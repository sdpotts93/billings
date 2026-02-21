import fs from 'node:fs/promises'
import path from 'node:path'
import zlib from 'node:zlib'

import { createPdfBytes } from '../app/utils/pdf.js'

const repoRoot = process.cwd()
const resourcesVuePath = path.join(repoRoot, 'app/pages/resources.vue')
const logoPngPath = path.join(repoRoot, 'public/images/billings-logo.png')

const toSlug = (text) => String(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

const extractArrayLiteral = (source, marker) => {
  const markerIndex = source.indexOf(marker)
  if (markerIndex === -1) {
    throw new Error(`Could not find marker: ${marker}`)
  }

  const equalsIndex = source.indexOf('=', markerIndex)
  if (equalsIndex === -1) {
    throw new Error(`Could not find assignment after marker: ${marker}`)
  }

  const arrayStart = source.indexOf('[', equalsIndex)
  if (arrayStart === -1) {
    throw new Error(`Could not find array start after marker: ${marker}`)
  }

  let i = arrayStart
  let depth = 0
  let inString = null
  let escaped = false

  for (; i < source.length; i++) {
    const ch = source[i]

    if (inString) {
      if (escaped) {
        escaped = false
        continue
      }
      if (ch === '\\') {
        escaped = true
        continue
      }
      if (ch === inString) {
        inString = null
      }
      continue
    }

    if (ch === '"' || ch === "'" || ch === '`') {
      inString = ch
      continue
    }

    if (ch === '[') {
      depth += 1
      continue
    }

    if (ch === ']') {
      depth -= 1
      if (depth === 0) {
        return source.slice(arrayStart, i + 1)
      }
    }
  }

  throw new Error(`Could not extract array for marker: ${marker}`)
}

const evaluateLiteral = (literalText) => {
  // eslint-disable-next-line no-new-func
  return new Function(`return (${literalText});`)()
}

const paethPredictor = (a, b, c) => {
  const p = a + b - c
  const pa = Math.abs(p - a)
  const pb = Math.abs(p - b)
  const pc = Math.abs(p - c)
  if (pa <= pb && pa <= pc) return a
  if (pb <= pc) return b
  return c
}

const unfilterScanline = (filterType, scanline, prior, bytesPerPixel) => {
  const out = new Uint8Array(scanline.length)
  if (filterType === 0) {
    out.set(scanline)
    return out
  }

  for (let i = 0; i < scanline.length; i++) {
    const left = i >= bytesPerPixel ? out[i - bytesPerPixel] : 0
    const up = prior ? prior[i] : 0
    const upLeft = prior && i >= bytesPerPixel ? prior[i - bytesPerPixel] : 0
    const value = scanline[i]

    let recon = value
    if (filterType === 1) recon = (value + left) & 0xff
    else if (filterType === 2) recon = (value + up) & 0xff
    else if (filterType === 3) recon = (value + Math.floor((left + up) / 2)) & 0xff
    else if (filterType === 4) recon = (value + paethPredictor(left, up, upLeft)) & 0xff
    else throw new Error(`Unsupported PNG filter type: ${filterType}`)

    out[i] = recon
  }
  return out
}

const decodePngRgba = (pngBytes) => {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10]
  for (let i = 0; i < signature.length; i++) {
    if (pngBytes[i] !== signature[i]) throw new Error('Invalid PNG signature.')
  }

  let offset = 8
  let width = 0
  let height = 0
  let bitDepth = 0
  let colorType = 0
  let interlace = 0
  /** @type {Uint8Array[]} */
  const idat = []

  while (offset + 8 <= pngBytes.length) {
    const length =
      (pngBytes[offset] << 24) | (pngBytes[offset + 1] << 16) | (pngBytes[offset + 2] << 8) | pngBytes[offset + 3]
    offset += 4
    const type = String.fromCharCode(pngBytes[offset], pngBytes[offset + 1], pngBytes[offset + 2], pngBytes[offset + 3])
    offset += 4
    const data = pngBytes.subarray(offset, offset + length)
    offset += length
    offset += 4 // CRC

    if (type === 'IHDR') {
      width = (data[0] << 24) | (data[1] << 16) | (data[2] << 8) | data[3]
      height = (data[4] << 24) | (data[5] << 16) | (data[6] << 8) | data[7]
      bitDepth = data[8]
      colorType = data[9]
      interlace = data[12]
      continue
    }

    if (type === 'IDAT') {
      idat.push(data)
      continue
    }

    if (type === 'IEND') {
      break
    }
  }

  if (!width || !height) throw new Error('PNG missing IHDR.')
  if (bitDepth !== 8) throw new Error(`Unsupported PNG bit depth: ${bitDepth}`)
  if (colorType !== 6) throw new Error(`Unsupported PNG color type: ${colorType} (expected 6=RGBA)`)
  if (interlace !== 0) throw new Error('Interlaced PNG not supported.')

  const compressed = Buffer.concat(idat.map((chunk) => Buffer.from(chunk)))
  const inflated = zlib.inflateSync(compressed)

  const bytesPerPixel = 4
  const stride = width * bytesPerPixel
  const rgba = new Uint8Array(width * height * bytesPerPixel)

  let inPos = 0
  let prior = null
  for (let y = 0; y < height; y++) {
    const filterType = inflated[inPos]
    inPos += 1
    const scanline = inflated.subarray(inPos, inPos + stride)
    inPos += stride
    const recon = unfilterScanline(filterType, scanline, prior, bytesPerPixel)
    rgba.set(recon, y * stride)
    prior = recon
  }

  return { width, height, rgba }
}

const resizeRgbaNearest = (rgba, width, height, targetWidth) => {
  if (targetWidth >= width) return { width, height, rgba }

  const targetHeight = Math.max(1, Math.round((height * targetWidth) / width))
  const out = new Uint8Array(targetWidth * targetHeight * 4)

  for (let y = 0; y < targetHeight; y++) {
    const srcY = Math.min(height - 1, Math.floor((y * height) / targetHeight))
    for (let x = 0; x < targetWidth; x++) {
      const srcX = Math.min(width - 1, Math.floor((x * width) / targetWidth))
      const srcIndex = (srcY * width + srcX) * 4
      const dstIndex = (y * targetWidth + x) * 4
      out[dstIndex] = rgba[srcIndex]
      out[dstIndex + 1] = rgba[srcIndex + 1]
      out[dstIndex + 2] = rgba[srcIndex + 2]
      out[dstIndex + 3] = rgba[srcIndex + 3]
    }
  }

  return { width: targetWidth, height: targetHeight, rgba: out }
}

const flattenRgbaToRgbOnWhite = (rgba) => {
  const rgb = new Uint8Array((rgba.length / 4) * 3)
  for (let i = 0, j = 0; i < rgba.length; i += 4, j += 3) {
    const r = rgba[i]
    const g = rgba[i + 1]
    const b = rgba[i + 2]
    const a = rgba[i + 3] / 255
    rgb[j] = Math.round(r * a + 255 * (1 - a))
    rgb[j + 1] = Math.round(g * a + 255 * (1 - a))
    rgb[j + 2] = Math.round(b * a + 255 * (1 - a))
  }
  return rgb
}

const buildDocumentLines = (document) => {
  const base = [
    `Who it helps: ${document.whoItHelps}`,
    `Summary: ${document.summary}`,
    '',
    'Not medical, legal, or financial advice. Use this as a practical checklist and a record-keeping tool.',
    ''
  ]

  const links = [
    'Helpful links:',
    '- 211 local services: https://www.211.org',
    '- Patient Advocate Foundation: https://www.patientadvocate.org',
    '- HealthCare.gov (Marketplace): https://www.healthcare.gov',
    '- Medicaid: https://www.medicaid.gov',
    '- Medicare cost help: https://www.medicare.gov/basics/costs/help'
  ]

  if (document.id === 'bill-review') {
    return [
      ...base,
      'Quick steps (today):',
      '- Ask for an itemized statement with dates of service and billing codes.',
      '- Compare the bill to your EOB (Explanation of Benefits) for the same claim.',
      '- Look for duplicates, incorrect patient name, wrong insurance, or out-of-network surprises.',
      '- If you cannot pay, ask about financial assistance and an interest-free payment plan before the due date.',
      '',
      'What to gather:',
      '- Bill(s) and any collection notices.',
      '- EOB(s) for the same dates of service.',
      '- Discharge summary or visit notes (if you have them).',
      '- A list of questions and your call log (date, time, name, reference number).',
      '',
      'Checklist:',
      '[ ] Request itemized bill and a statement showing payments/adjustments.',
      '[ ] Verify the provider/facility name matches where you received care.',
      '[ ] Check dates of service and compare line items to your EOB.',
      '[ ] Ask what portion is patient responsibility and why (deductible, coinsurance, copay, non-covered).',
      '[ ] If you believe there is an error, ask for a corrected claim submission.',
      '[ ] Ask if a self-pay or prompt-pay discount is available.',
      '[ ] Ask to pause collections while a dispute/assistance application is pending.',
      '',
      'Notes:',
      'Billing phone: ______________________  Account/guarantor #: ______________________',
      'Date/time: __________________________  Agent name/ID: ___________________________',
      'Reference #: ________________________  Next step promised: ______________________',
      'Deadline: ___________________________',
      '',
      ...links,
      '- No Surprises protections (U.S.): https://www.cms.gov/nosurprises'
    ]
  }

  if (document.id === 'financial-assistance') {
    return [
      ...base,
      'Quick steps (today):',
      '- Ask the hospital/clinic for their "financial assistance" or "charity care" policy and application.',
      '- Ask what documents they accept and the deadline to apply (and whether they cover past bills).',
      '- If you are already in collections, ask the provider to recall the account while you apply.',
      '',
      'What to gather:',
      '- Recent pay stubs or proof of income (or a written statement if no income).',
      '- Last tax return (if available).',
      '- Proof of residence and household size (if requested).',
      '- Any denial letters (insurance/Medicaid), and your bill/account number.',
      '',
      'Checklist:',
      '[ ] Get the correct mailing address, upload portal, fax number, and a named contact.',
      '[ ] Ask for confirmation that collections are paused while your application is reviewed.',
      '[ ] Submit all documents with proof (upload receipt, fax confirmation, certified mail tracking).',
      '[ ] Ask when the decision will be made and how you will be notified.',
      '[ ] If approved, ask for the bill to be reissued with the approved discount/adjustment.',
      '',
      'Notes:',
      'Application link/portal: _________________________________________________',
      'Contact name: ____________________  Phone: ______________________________',
      'Submission date: _________________  Receipt/confirmation #: ______________',
      '',
      ...links
    ]
  }

  if (document.id === 'payment-plan-script') {
    return [
      ...base,
      'Call script (billing office):',
      '- "I want to resolve this, but I cannot pay the full balance today."',
      '- "Do you offer an interest-free payment plan? What is the minimum monthly amount?"',
      '- "Can you put the account on hold while we set the plan up in writing?"',
      '- "Are there discounts available if I pay a portion today or enroll in assistance?"',
      '- "Please send the agreement and the payment schedule in writing."',
      '',
      'Checklist:',
      '[ ] Ask for an itemized bill first if charges look unfamiliar.',
      '[ ] Ask for a zero-interest plan and confirm there are no hidden fees.',
      '[ ] Confirm whether missed payments trigger collections and how to avoid that.',
      '[ ] Get the plan terms in writing (amount, due date, duration).',
      '',
      'Notes:',
      'Proposed monthly amount: $____________  Due date each month: _______________',
      'Agreement received (yes/no): _________  How received: _____________________',
      '',
      ...links
    ]
  }

  if (document.id === 'appeal-template') {
    return [
      ...base,
      'Before you write:',
      '- Get the denial letter and the appeal deadline.',
      '- Ask what documents the plan wants: clinical notes, letter of medical necessity, prior auth info, labs/imaging.',
      '- Ask your clinician to support the appeal with documentation.',
      '',
      'Fill in:',
      'Member name: _______________________________________________',
      'Member ID: _________________________________________________',
      'Plan name: _________________________________________________',
      'Claim / reference #: ________________________________________',
      'Denied service / medication: ________________________________',
      'Denial letter date: ______________  Appeal deadline: _________',
      '',
      'Appeal letter template:',
      '"I am appealing the denial of [service/medication] dated [date]. The denial reason is [reason].',
      'This care is medically necessary because [short clinical rationale].',
      'Attached are supporting records: [list attachments].',
      'Please reconsider and approve coverage. If you uphold the denial, please provide the plan provisions used and instructions for the next level of review."',
      '',
      'Checklist:',
      '[ ] Submit before the deadline using a trackable method and keep proof.',
      '[ ] Ask for an expedited/urgent appeal if delay risks harm (ask your clinician to support urgency).',
      '[ ] Track every call (date, person, reference number).',
      '',
      ...links,
      '- Marketplace appeals overview: https://www.healthcare.gov/appeal-insurance-company-decision/'
    ]
  }

  if (document.id === 'prior-auth') {
    return [
      ...base,
      'Quick steps (today):',
      '- Ask your prescriber: "Was the prior authorization submitted? On what date?"',
      '- Ask your insurer/pharmacy benefit manager: "What is the status and the expected turnaround time?"',
      '- Ask for the case/reference number and the exact missing items (if any).',
      '',
      'Checklist:',
      '[ ] Confirm the medication/procedure name, dose, and diagnosis code match what was submitted.',
      '[ ] Ask whether it is standard or urgent review and what qualifies as urgent.',
      '[ ] If denied, request the denial reason in writing and the appeal process.',
      '[ ] If delayed, ask your prescriber about bridge samples, alternatives, or a temporary fill.',
      '',
      'Notes:',
      'Case/reference #: ____________________  Submitted date: ___________________',
      'Insurer/PBM contact: _____________________________________________________',
      'Next follow-up date: _____________________________________________________',
      '',
      ...links
    ]
  }

  if (document.id === 'insurer-call-log') {
    return [
      ...base,
      'Use this to keep a clean record for denials, billing questions, and coverage checks.',
      '',
      'Call log fields (copy this block for each call):',
      'Date/time: ___________________________',
      'Plan/PBM phone: _______________________',
      'Agent name/ID: ________________________',
      'Reference/case #: ______________________',
      'Topic (claim, denial, benefits, PA): ___',
      'What I asked: _________________________',
      'What they said: _______________________',
      'Next step promised: ___________________',
      'Deadline: _____________________________',
      '',
      ...links
    ]
  }

  if (document.id === 'visit-prep') {
    return [
      ...base,
      'Bring this to your visit (or fill it out in your phone).',
      '',
      'Symptoms and timeline:',
      '- Start date: __________________________',
      '- Worst days/times: ____________________',
      '- Triggers: ____________________________',
      '- What helps: __________________________',
      '',
      'Medication list (include OTC/supplements):',
      '- Name / dose / schedule: ________________________________________________',
      '- Name / dose / schedule: ________________________________________________',
      '',
      'Top 5 questions:',
      '1. ______________________________________________________________________',
      '2. ______________________________________________________________________',
      '3. ______________________________________________________________________',
      '4. ______________________________________________________________________',
      '5. ______________________________________________________________________',
      '',
      'Costs (if you want to ask):',
      '- Is this visit/test in-network? _________________________________________',
      '- Prior authorization needed? ___________________________________________',
      '- Lower-cost alternatives? ______________________________________________',
      '',
      ...links
    ]
  }

  if (document.id === 'rx-affordability') {
    return [
      ...base,
      'Quick checks:',
      '[ ] Ask if a generic or biosimilar is clinically appropriate.',
      '[ ] Ask if there is a preferred formulary alternative.',
      '[ ] Ask about 90-day fills and mail-order pricing.',
      '[ ] If uninsured/underinsured, ask about manufacturer assistance and foundations.',
      '',
      'At the pharmacy:',
      '- "What is the cash price vs my insurance price?"',
      '- "Is there a different NDC/manufacturer that is cheaper under my plan?"',
      '',
      'Notes:',
      'Medication: ____________________________  Dose: ___________________________',
      'Current monthly cost: $_______________  Target monthly cost: $_____________',
      '',
      ...links,
      '- NeedyMeds: https://www.needymeds.org',
      '- RxAssist: https://www.rxassist.org'
    ]
  }

  if (document.id === 'caregiver-starter') {
    return [
      ...base,
      'Core items to organize:',
      '[ ] Current medication list (name, dose, schedule, prescribing clinician).',
      '[ ] Emergency contacts and preferred hospital/clinic.',
      '[ ] Insurance cards and plan contact numbers.',
      '[ ] Permission forms (ask providers about a HIPAA release so you can speak on the patient\'s behalf).',
      '',
      'Weekly routine:',
      '- Track appointments, refill dates, and symptom changes.',
      '- Keep a shared notes doc with questions for the next visit.',
      '',
      'Notes:',
      'Primary clinician: _____________________  Phone: __________________________',
      'Pharmacy: _____________________________  Phone: __________________________',
      '',
      ...links,
      '- Caregiver Action Network: https://www.caregiveraction.org',
      '- Family Caregiver Alliance: https://www.caregiver.org'
    ]
  }

  if (document.id === 'dementia-cost-tracker') {
    return [
      ...base,
      'Monthly cost tracker (fill totals):',
      '- Home care / aides: $______________',
      '- Adult day / respite: $____________',
      '- Medications / supplies: $_________',
      '- Transportation: $_________________',
      '- Home safety changes: $____________',
      '- Co-pays / visits: $_______________',
      '- Other: $__________________________',
      '',
      'Care planning prompts:',
      '[ ] What support do we need this month (sleep, meals, supervision, bathing)?',
      '[ ] Who can help (family, neighbors, local programs)?',
      '[ ] What is the next likely change in care level (and what will it cost)?',
      '',
      ...links,
      '- Alzheimer\'s Association: https://www.alz.org',
      '- NIA caregiving: https://www.nia.nih.gov/health/alzheimers/caregiving'
    ]
  }

  if (document.id === 'cf-coverage-continuity') {
    return [
      ...base,
      'Renewal calendar (avoid gaps):',
      '[ ] Write down prior auth expiration dates for each specialty medication.',
      '[ ] Ask your clinic when they start renewals (often weeks before expiration).',
      '[ ] Confirm which pharmacy fills the med and how refills are requested.',
      '',
      'If a renewal is delayed:',
      '- Ask for the case/reference number and missing items.',
      '- Ask your clinic to mark urgent if medically necessary.',
      '- Keep all denial letters and submit appeals before the deadline.',
      '',
      'CF support:',
      '- CF Foundation Compass: https://www.cff.org/support/get-help-cf-foundation-compass',
      '',
      ...links
    ]
  }

  if (document.id === 'compass-one-pager') {
    return [
      ...base,
      'CF Foundation Compass (quick contact guide)',
      '',
      'What to prepare before you call:',
      '[ ] Insurance plan name and member ID.',
      '[ ] Medication names, pharmacy, and any denial letters.',
      '[ ] What you need most (coverage, financial, legal, school/work, care logistics).',
      '',
      'What to ask:',
      '- "What are my next steps, and what documents do you need from me?"',
      '- "Is there a deadline I should not miss?"',
      '- "Who should I contact next (clinic, insurer, pharmacy), and what should I say?"',
      '',
      'Compass link:',
      '- https://www.cff.org/support/get-help-cf-foundation-compass',
      '',
      ...links
    ]
  }

  return [...base, ...links]
}

const buildConditionLines = (condition) => {
  return [
    `Summary: ${condition.summary}`,
    `Main trigger: ${condition.triggers}`,
    '',
    'Top actions:',
    `- Today: ${condition.actions.today}`,
    `- This week: ${condition.actions.week}`,
    `- Ongoing: ${condition.actions.ongoing}`,
    '',
    'Sources:',
    ...condition.sources.map((source) => `- ${source.label}: ${source.url}`)
  ]
}

const buildDirectoryLines = (resources, groupOrder) => {
  const byGroup = new Map()
  for (const resource of resources) {
    if (!byGroup.has(resource.group)) byGroup.set(resource.group, [])
    byGroup.get(resource.group).push(resource)
  }

  const groups = [...byGroup.keys()]
  const orderIndex = new Map(groupOrder.map((group, index) => [group, index]))
  groups.sort((a, b) => (orderIndex.get(a) ?? 999) - (orderIndex.get(b) ?? 999) || a.localeCompare(b))

  const lines = [
    'Free Help Directory (U.S.)',
    'Not medical advice. For emergencies call 911. For crisis support call/text 988.',
    ''
  ]

  for (const group of groups) {
    lines.push(group)
    lines.push(''.padEnd(group.length, '-'))
    const items = byGroup.get(group) ?? []
    for (const item of items) {
      lines.push(`- ${item.title}`)
      lines.push(`  Who it helps: ${item.whoItHelps}`)
      lines.push(`  Link: ${item.url} (${item.urlLabel})`)
      if (item.phone) lines.push(`  Phone: ${item.phone}`)
      lines.push('')
    }
    lines.push('')
  }

  return lines
}

const main = async () => {
  const resourcesSource = await fs.readFile(resourcesVuePath, 'utf8')

  const helpResources = evaluateLiteral(
    extractArrayLiteral(resourcesSource, 'const helpResources: ResourceItem[] =')
  )
  const documentLibrary = evaluateLiteral(
    extractArrayLiteral(resourcesSource, 'const documentLibrary: DocumentItem[] =')
  )
  const conditionCards = evaluateLiteral(extractArrayLiteral(resourcesSource, 'const conditionCards: ConditionCard[] ='))
  const directoryLayoutOrder = evaluateLiteral(extractArrayLiteral(resourcesSource, 'const directoryLayoutOrder ='))

  const logoPngBytes = new Uint8Array(await fs.readFile(logoPngPath))
  const { width: logoWidth, height: logoHeight, rgba: logoRgba } = decodePngRgba(logoPngBytes)
  const resized = resizeRgbaNearest(logoRgba, logoWidth, logoHeight, 320)
  const logo = {
    width: resized.width,
    height: resized.height,
    rgbBytes: flattenRgbaToRgbOnWhite(resized.rgba)
  }

  const documentsDir = path.join(repoRoot, 'public/downloads/documents')
  const conditionsDir = path.join(repoRoot, 'public/downloads/conditions')
  await fs.mkdir(documentsDir, { recursive: true })
  await fs.mkdir(conditionsDir, { recursive: true })

  for (const document of documentLibrary) {
    const lines = buildDocumentLines(document)
    const pdfBytes = createPdfBytes({ title: document.title, lines, logo })
    const outPath = path.join(documentsDir, document.filename)
    await fs.writeFile(outPath, pdfBytes)
  }

  for (const condition of conditionCards) {
    const filename = `${toSlug(condition.title)}-quick-guide.pdf`
    const lines = buildConditionLines(condition)
    const pdfBytes = createPdfBytes({ title: condition.title, lines, logo })
    const outPath = path.join(conditionsDir, filename)
    await fs.writeFile(outPath, pdfBytes)
  }

  const directoryLines = buildDirectoryLines(helpResources, directoryLayoutOrder)
  const directoryPdfBytes = createPdfBytes({ title: 'Free Help Directory', lines: directoryLines, logo })
  await fs.writeFile(path.join(repoRoot, 'public/downloads/full-free-help-directory.pdf'), directoryPdfBytes)
}

await main()
