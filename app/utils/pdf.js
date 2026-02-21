/**
 * Minimal PDF generator (no external deps).
 *
 * - Uses raw (uncompressed) RGB image bytes for the logo.
 * - Uses built-in Type1 fonts (Helvetica).
 * - ASCII-only text output for consistent rendering.
 */

const encoder = new TextEncoder()

const encode = (text) => encoder.encode(text)

const concatBytes = (chunks) => {
  let total = 0
  for (const chunk of chunks) total += chunk.length
  const out = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    out.set(chunk, offset)
    offset += chunk.length
  }
  return out
}

const pad10 = (value) => String(value).padStart(10, '0')

const normalizeAscii = (value) => {
  return String(value)
    .replaceAll('\r\n', '\n')
    .replaceAll('\r', '\n')
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/\u00a0/g, ' ')
}

const escapePdfString = (value) => {
  return normalizeAscii(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

const wrapLine = (line, maxChars) => {
  const normalized = normalizeAscii(line)
  if (!normalized || normalized.length <= maxChars) {
    return [normalized]
  }

  // Preserve simple indentation for bullets and numbered lines.
  const indentMatch = normalized.match(/^(\s*(?:- |\* |\d+\. ))/)
  const indent = indentMatch?.[1] ?? ''
  const rest = normalized.slice(indent.length).trim()
  const words = rest.split(/\s+/g)
  const lines = []
  let current = indent

  for (const word of words) {
    const candidate = current === indent ? `${indent}${word}` : `${current} ${word}`
    if (candidate.length > maxChars && current !== indent) {
      lines.push(current)
      current = `${indent}${word}`
      continue
    }
    current = candidate
  }

  if (current.trim()) {
    lines.push(current)
  }

  return lines.length ? lines : [normalized.slice(0, maxChars)]
}

const wrapLines = (lines, maxChars) => {
  const out = []
  for (const line of lines) out.push(...wrapLine(line, maxChars))
  return out
}

const buildStreamObjectBody = (dictEntries, streamBytes) => {
  const dict = `<< ${dictEntries.join(' ')} /Length ${streamBytes.length} >>`
  return concatBytes([encode(`${dict}\nstream\n`), streamBytes, encode('\nendstream')])
}

/**
 * @typedef {Object} PdfLogo
 * @property {Uint8Array} rgbBytes Raw RGB bytes (row-major, width * height * 3)
 * @property {number} width Pixel width
 * @property {number} height Pixel height
 */

/**
 * @typedef {Object} PdfDocument
 * @property {string} title
 * @property {string[]} lines Body lines (plain text)
 * @property {PdfLogo} logo
 */

/**
 * @param {PdfDocument} doc
 * @returns {Uint8Array}
 */
export const createPdfBytes = (doc) => {
  const pageWidth = 612
  const pageHeight = 792
  const marginX = 54
  const marginTop = 54
  const marginBottom = 54

  const titleFontSize = 18
  const bodyFontSize = 11
  const bodyLineHeight = 14

  // Keep wrapping conservative to avoid spilling past the right margin.
  const maxChars = 90
  const titleText = normalizeAscii(doc.title).trim() || 'Resource'
  const bodyLines = wrapLines(doc.lines ?? [], maxChars)

  const headerLogoWidthPts = 160
  const headerLogoHeightPts = Math.max(1, Math.round((headerLogoWidthPts * doc.logo.height) / doc.logo.width))
  const logoX = marginX
  const logoY = pageHeight - marginTop - headerLogoHeightPts
  const titleY = logoY - 18
  const bodyStartY = titleY - 26
  const maxBodyLinesPerPage = Math.max(1, Math.floor((bodyStartY - marginBottom) / bodyLineHeight))

  const pages = []
  for (let i = 0; i < bodyLines.length; i += maxBodyLinesPerPage) {
    pages.push(bodyLines.slice(i, i + maxBodyLinesPerPage))
  }
  if (pages.length === 0) pages.push([])

  const objects = []
  const addObject = (bytes) => {
    objects.push(bytes)
    return objects.length
  }

  const fontRegularRef = addObject(encode('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'))
  const fontBoldRef = addObject(encode('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>'))

  const logoStreamBody = buildStreamObjectBody(
    [
      '/Type /XObject',
      '/Subtype /Image',
      `/Width ${doc.logo.width}`,
      `/Height ${doc.logo.height}`,
      '/ColorSpace /DeviceRGB',
      '/BitsPerComponent 8'
    ],
    doc.logo.rgbBytes
  )
  const logoRef = addObject(logoStreamBody)

  const resourcesRef = addObject(
    encode(
      `<< /Font << /F1 ${fontRegularRef} 0 R /F2 ${fontBoldRef} 0 R >> /XObject << /Logo ${logoRef} 0 R >> >>`
    )
  )

  const contentRefs = []
  for (const pageLines of pages) {
    const contentOps = []

    // Logo
    contentOps.push('q')
    contentOps.push(`${headerLogoWidthPts} 0 0 ${headerLogoHeightPts} ${logoX} ${logoY} cm`)
    contentOps.push('/Logo Do')
    contentOps.push('Q')

    // Title
    contentOps.push('BT')
    contentOps.push(`/F2 ${titleFontSize} Tf`)
    contentOps.push(`${marginX} ${titleY} Td`)
    contentOps.push(`(${escapePdfString(titleText)}) Tj`)
    contentOps.push('ET')

    // Body text
    contentOps.push('BT')
    contentOps.push(`/F1 ${bodyFontSize} Tf`)
    contentOps.push(`${marginX} ${bodyStartY} Td`)
    for (let i = 0; i < pageLines.length; i++) {
      const line = pageLines[i] ?? ''
      contentOps.push(`(${escapePdfString(line)}) Tj`)
      if (i !== pageLines.length - 1) {
        contentOps.push(`0 -${bodyLineHeight} Td`)
      }
    }
    contentOps.push('ET')

    const contentBytes = encode(`${contentOps.join('\n')}\n`)
    const contentRef = addObject(buildStreamObjectBody([], contentBytes))
    contentRefs.push(contentRef)
  }

  const pageRefs = []
  // Pages are added after the /Pages object exists, so we patch parent refs later.
  const placeholderPagesRef = addObject(encode('<< /Type /Pages /Kids [] /Count 0 >>'))

  for (const contentRef of contentRefs) {
    const pageBody = encode(
      `<< /Type /Page /Parent ${placeholderPagesRef} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources ${resourcesRef} 0 R /Contents ${contentRef} 0 R >>`
    )
    pageRefs.push(addObject(pageBody))
  }

  // Replace the placeholder /Pages object with the real Kids/Count.
  objects[placeholderPagesRef - 1] = encode(
    `<< /Type /Pages /Kids [${pageRefs.map((ref) => `${ref} 0 R`).join(' ')}] /Count ${pageRefs.length} >>`
  )

  const catalogRef = addObject(encode(`<< /Type /Catalog /Pages ${placeholderPagesRef} 0 R >>`))

  // Build final PDF.
  const fileChunks = []
  fileChunks.push(encode('%PDF-1.4\n'))

  const offsets = [0]
  let position = fileChunks[0].length

  for (let i = 0; i < objects.length; i++) {
    offsets.push(position)
    const objNum = i + 1
    const head = encode(`${objNum} 0 obj\n`)
    const tail = encode('\nendobj\n')
    fileChunks.push(head, objects[i], tail)
    position += head.length + objects[i].length + tail.length
  }

  const xrefStart = position
  const xrefLines = []
  xrefLines.push(`xref`)
  xrefLines.push(`0 ${objects.length + 1}`)
  xrefLines.push(`0000000000 65535 f `)
  for (let i = 1; i < offsets.length; i++) {
    xrefLines.push(`${pad10(offsets[i])} 00000 n `)
  }
  fileChunks.push(encode(`${xrefLines.join('\n')}\n`))
  position += fileChunks[fileChunks.length - 1].length

  const trailer = [
    'trailer',
    `<< /Size ${objects.length + 1} /Root ${catalogRef} 0 R >>`,
    'startxref',
    String(xrefStart),
    '%%EOF',
    ''
  ].join('\n')
  fileChunks.push(encode(trailer))

  return concatBytes(fileChunks)
}

