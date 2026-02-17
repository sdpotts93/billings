<script setup lang="ts">
import { computed, reactive, ref } from 'vue'

type QuestionId = 'need' | 'stage' | 'condition' | 'insurance' | 'barrier' | 'age' | 'state' | 'email' | 'format'
type RouteKey = 'emergency' | 'uninsured' | 'meds' | 'bills' | 'care' | 'caregiver'

type Option = {
  label: string
  value: string
}

type WizardQuestion = {
  id: QuestionId
  prompt: string
  optional?: boolean
  input?: 'state' | 'email'
  options?: Option[]
}

type RouteRecipe = {
  key: RouteKey
  title: string
  summary: string
  doToday: string[]
  thisWeek: string[]
  ongoing: string[]
  resourceIds: string[]
  documentIds: string[]
}

type Adjustment = {
  today?: string
  week?: string
  ongoing?: string
  resourceIds?: string[]
  documentIds?: string[]
}

type ResourceItem = {
  id: string
  title: string
  whoItHelps: string
  phone?: string
  url: string
  urlLabel: string
  group: string
  needRoutes: RouteKey[]
  conditionTags: string[]
}

type DocumentItem = {
  id: string
  title: string
  whoItHelps: string
  summary: string
  topicTags: string[]
  conditionTags: string[]
  filename: string
}

type GeneratedResult = {
  routeTitle: string
  summary: string
  doToday: string[]
  thisWeek: string[]
  ongoing: string[]
  resourceIds: string[]
  documentIds: string[]
}

type ConditionCard = {
  id: string
  title: string
  summary: string
  effects: string[]
  triggers: string
  actions: {
    today: string
    week: string
    ongoing: string
  }
  stats: string[]
  sources: Array<{
    label: string
    url: string
  }>
}

type FaqItem = {
  question: string
  answer: string
}

const wizardQuestions: WizardQuestion[] = [
  {
    id: 'need',
    prompt: 'What do you need most right now?',
    options: [
      { label: 'Emergency / urgent symptoms', value: 'emergency' },
      { label: 'Finding care (appointments, specialists)', value: 'finding-care' },
      { label: 'Paying for meds', value: 'meds' },
      { label: 'Paying medical bills / debt', value: 'bills' },
      { label: 'Insurance help / uninsured', value: 'insurance' },
      { label: 'Understanding a diagnosis', value: 'diagnosis' },
      { label: 'Helping someone else (caregiver)', value: 'caregiver' }
    ]
  },
  {
    id: 'stage',
    prompt: 'Where are you in the process?',
    options: [
      { label: 'New symptoms', value: 'new-symptoms' },
      { label: 'New diagnosis', value: 'new-diagnosis' },
      { label: 'Ongoing condition', value: 'ongoing-condition' },
      { label: 'Post-hospital / recent flare', value: 'post-hospital' }
    ]
  },
  {
    id: 'condition',
    prompt: 'Do you want to focus on a condition? (optional)',
    optional: true,
    options: [
      { label: 'Cystic fibrosis (CF)', value: 'cf' },
      { label: 'Heart disease / stroke', value: 'heart-stroke' },
      { label: 'Cancer', value: 'cancer' },
      { label: 'Diabetes', value: 'diabetes' },
      { label: 'Mental health', value: 'mental-health' },
      { label: 'Kidney disease / dialysis', value: 'kidney' },
      { label: 'COPD / severe asthma', value: 'copd-asthma' },
      { label: 'Arthritis (including RA)', value: 'arthritis' },
      { label: 'Alzheimer’s / dementia', value: 'dementia' },
      { label: 'Not sure', value: 'not-sure' }
    ]
  },
  {
    id: 'insurance',
    prompt: 'Insurance status',
    options: [
      { label: 'Employer plan', value: 'employer' },
      { label: 'Marketplace (ACA)', value: 'marketplace' },
      { label: 'Medicaid', value: 'medicaid' },
      { label: 'Medicare', value: 'medicare' },
      { label: 'Uninsured', value: 'uninsured' },
      { label: 'Not sure', value: 'not-sure' }
    ]
  },
  {
    id: 'barrier',
    prompt: 'Biggest barrier',
    options: [
      { label: 'Med costs', value: 'med-costs' },
      { label: 'Visit / test costs', value: 'visit-costs' },
      { label: 'Bills / debt', value: 'bills-debt' },
      { label: 'Transportation', value: 'transportation' },
      { label: 'Finding specialists', value: 'specialists' },
      { label: 'Paperwork / denials / appeals', value: 'denials' }
    ]
  },
  {
    id: 'age',
    prompt: 'Age group',
    options: [
      { label: 'Child/teen', value: 'child-teen' },
      { label: 'Adult', value: 'adult' },
      { label: 'Older adult', value: 'older-adult' }
    ]
  },
  {
    id: 'state',
    prompt: 'State (optional)',
    optional: true,
    input: 'state'
  },
  {
    id: 'email',
    prompt: 'Email for movie news updates? (optional)',
    optional: true,
    input: 'email'
  },
  {
    id: 'format',
    prompt: 'Preferred help format',
    options: [
      { label: 'Call now', value: 'call-now' },
      { label: 'Checklist', value: 'checklist' },
      { label: 'Download documents', value: 'download' },
      { label: 'Find clinics', value: 'find-clinics' }
    ]
  }
]

const needToRoute: Record<string, RouteKey> = {
  'emergency': 'emergency',
  'finding-care': 'care',
  'meds': 'meds',
  'bills': 'bills',
  'insurance': 'uninsured',
  'diagnosis': 'care',
  'caregiver': 'caregiver'
}

const routeRecipes: Record<RouteKey, RouteRecipe> = {
  emergency: {
    key: 'emergency',
    title: 'Emergency and urgent symptoms',
    summary: 'Immediate safety first, then rapid follow-up to avoid repeat emergencies.',
    doToday: [
      'Call 911 or go to the nearest ER.',
      'Bring a list of meds, allergies, and recent symptoms if possible.',
      'Ask for written discharge and follow-up instructions before leaving.'
    ],
    thisWeek: [
      'Schedule follow-up with primary care or specialist.',
      'Request referrals plus copies of imaging, labs, and visit notes.',
      'Confirm who to call first if symptoms return.'
    ],
    ongoing: [
      'Build a medical file with diagnoses, labs, visits, meds, and bills.',
      'Track symptoms and triggers between visits.',
      'Keep emergency contacts and current med list updated.'
    ],
    resourceIds: ['emergency-911', 'crisis-988', 'help-211', 'paf', 'findcare'],
    documentIds: ['visit-prep', 'insurer-call-log', 'caregiver-starter', 'bill-review']
  },
  uninsured: {
    key: 'uninsured',
    title: 'Insurance problems or uninsured',
    summary: 'Prioritize coverage options and protect appeal rights with documented calls.',
    doToday: [
      'Check Medicaid and Marketplace eligibility based on your state and household.',
      'Gather income estimate, household size, and current coverage status.',
      'Create a call log before contacting assisters or plans.'
    ],
    thisWeek: [
      'Call your state Marketplace navigator or assister.',
      'If care or meds were denied, request written reason and appeal instructions.',
      'Ask providers for self-pay estimates while coverage is in progress.'
    ],
    ongoing: [
      'Track every call with date, person, and reference number.',
      'Keep denial letters, EOBs, and bills in one folder.',
      'Review eligibility each month if income or household changes.'
    ],
    resourceIds: ['healthcare-gov', 'medicaid-gov', 'paf', 'help-211', 'findhelp'],
    documentIds: ['appeal-template', 'insurer-call-log', 'financial-assistance', 'bill-review']
  },
  meds: {
    key: 'meds',
    title: 'Medication affordability',
    summary: 'Lower immediate medication costs and prevent interruptions from authorization delays.',
    doToday: [
      'Ask the pharmacy for lowest-cost equivalent options (generic, formulary, 90-day).',
      'Ask your clinician if there is a clinically acceptable lower-cost option.',
      'If you are rationing a critical med, contact your care team right away.'
    ],
    thisWeek: [
      'Apply for patient assistance and condition-specific foundation support.',
      'Ask your clinic for prior authorization help when coverage is blocked.',
      'Confirm refill timing and pharmacy network rules.'
    ],
    ongoing: [
      'Maintain a med access checklist with refill and PA renewal dates.',
      'Save receipts, denials, and formulary notices for appeals.',
      'Recheck costs when coverage phases reset during the year.'
    ],
    resourceIds: ['needymeds', 'paf', 'healthcare-gov', 'cf-compass', 'help-211'],
    documentIds: ['rx-affordability', 'prior-auth', 'appeal-template', 'cf-coverage-continuity']
  },
  bills: {
    key: 'bills',
    title: 'Medical bills and debt',
    summary: 'Review bills for errors, apply for assistance, and negotiate manageable payment terms.',
    doToday: [
      'Request an itemized bill and check every line for coding errors.',
      'Ask for financial assistance or charity care policies and application steps.',
      'If payment is needed now, request a zero-interest payment plan.'
    ],
    thisWeek: [
      'Negotiate a discount for prompt or cash payment where possible.',
      'If surprise out-of-network bill, request in-network reprocessing or dispute options.',
      'Match each bill against EOBs before agreeing to payment.'
    ],
    ongoing: [
      'Keep a billing folder with bills, EOBs, letters, and call notes.',
      'Document all payment agreements in writing.',
      'Escalate unresolved errors to patient financial services.'
    ],
    resourceIds: ['paf', 'findhelp', 'healthcare-gov', 'help-211', 'medicare-rights'],
    documentIds: ['bill-review', 'payment-plan-script', 'financial-assistance', 'insurer-call-log']
  },
  care: {
    key: 'care',
    title: 'Finding care and specialists',
    summary: 'Match clinic type to your needs and lock in records, estimates, and follow-up schedule.',
    doToday: [
      'Identify the right clinic type (primary care, specialist, center of excellence).',
      'If insured, ask for in-network specialist directories.',
      'Prepare a one-page summary of symptoms, medications, and goals.'
    ],
    thisWeek: [
      'Schedule appointments and ask which records to bring.',
      'Request cost estimates for common services if paying out of pocket.',
      'Ask for case management if your care spans multiple clinics.'
    ],
    ongoing: [
      'Maintain a recurring care plan for visits, labs, meds, and renewals.',
      'Track referral and authorization status before each visit.',
      'Update your medical file after each appointment.'
    ],
    resourceIds: ['findcare', 'help-211', 'healthcare-gov', 'paf', 'findhelp'],
    documentIds: ['visit-prep', 'insurer-call-log', 'appeal-template', 'rx-affordability']
  },
  caregiver: {
    key: 'caregiver',
    title: 'Caregiver support',
    summary: 'Stabilize daily support, formalize permissions, and protect caregiver capacity over time.',
    doToday: [
      'List top three daily needs and who can help with each one.',
      'Ask clinic social work about caregiver resources and respite options.',
      'Create an emergency contact and medication snapshot.'
    ],
    thisWeek: [
      'Start permissions paperwork for speaking with providers.',
      'Build a meds list and home emergency plan.',
      'Identify backup caregivers for high-risk days.'
    ],
    ongoing: [
      'Protect caregiver capacity with planned breaks and support groups.',
      'Track costs and work impacts to plan financial support.',
      'Reassess care level as needs change.'
    ],
    resourceIds: ['caregiver-action', 'alz-helpline', 'help-211', 'paf', 'findhelp'],
    documentIds: ['caregiver-starter', 'dementia-cost-tracker', 'insurer-call-log', 'compass-one-pager']
  }
}

const insuranceAdjustments: Record<string, Adjustment> = {
  'uninsured': {
    today: 'Ask if you qualify for presumptive or emergency Medicaid in your state.',
    week: 'Set a reminder for enrollment deadlines and document requirements.',
    resourceIds: ['healthcare-gov', 'medicaid-gov'],
    documentIds: ['financial-assistance']
  },
  'medicare': {
    today: 'Check if Extra Help or Medicare Savings Programs can reduce costs.',
    week: 'Call plan support to confirm formulary and network for this month.',
    resourceIds: ['medicare-rights'],
    documentIds: ['rx-affordability']
  },
  'medicaid': {
    today: 'Confirm managed care plan network before scheduling services.',
    week: 'Ask for transportation benefits if travel is a barrier.',
    resourceIds: ['medicaid-gov', 'help-211']
  },
  'marketplace': {
    week: 'Compare plan cost-sharing and specialist network before open enrollment closes.',
    resourceIds: ['healthcare-gov']
  },
  'employer': {
    week: 'Use your benefits team for escalation when prior authorization is delayed.',
    documentIds: ['appeal-template']
  },
  'not-sure': {
    today: 'Call member services with your insurance card to confirm active coverage.',
    resourceIds: ['healthcare-gov']
  }
}

const barrierAdjustments: Record<string, Adjustment> = {
  'med-costs': {
    today: 'Request generic or biosimilar options and 90-day fill pricing in one call.',
    resourceIds: ['needymeds'],
    documentIds: ['rx-affordability', 'prior-auth']
  },
  'visit-costs': {
    today: 'Ask each facility for self-pay and in-network estimates before booking.',
    documentIds: ['visit-prep']
  },
  'bills-debt': {
    today: 'Pause payment until you receive itemized billing and EOB match.',
    resourceIds: ['paf'],
    documentIds: ['bill-review', 'payment-plan-script']
  },
  'transportation': {
    week: 'Ask insurers, clinics, or local services about non-emergency transport options.',
    resourceIds: ['help-211', 'findhelp']
  },
  'specialists': {
    week: 'Request referrals to regional specialty centers if local access is limited.',
    resourceIds: ['findcare']
  },
  'denials': {
    today: 'Ask for denial reason code and the exact appeal deadline while on the call.',
    week: 'Submit appeals with supporting records and keep proof of submission.',
    documentIds: ['appeal-template', 'insurer-call-log']
  }
}

const conditionAdjustments: Record<string, Adjustment> = {
  'cf': {
    today: 'Contact CF Foundation Compass for insurance, financial, legal, and life issue support.',
    week: 'Build a CF prior-auth renewal calendar with your care team.',
    resourceIds: ['cf-compass'],
    documentIds: ['cf-coverage-continuity', 'compass-one-pager']
  },
  'heart-stroke': {
    resourceIds: ['aha']
  },
  'cancer': {
    resourceIds: ['cancer-society']
  },
  'diabetes': {
    resourceIds: ['diabetes-assoc']
  },
  'mental-health': {
    resourceIds: ['nami', 'crisis-988']
  },
  'kidney': {
    resourceIds: ['nkf']
  },
  'copd-asthma': {
    resourceIds: ['copd-foundation']
  },
  'arthritis': {
    resourceIds: ['arthritis-foundation']
  },
  'dementia': {
    resourceIds: ['alz-helpline', 'caregiver-action']
  }
}

const formatResourceAdditions: Record<string, string[]> = {
  'call-now': ['crisis-988', 'help-211', 'paf'],
  'checklist': ['paf', 'findhelp'],
  'download': ['paf', 'healthcare-gov'],
  'find-clinics': ['findcare', 'help-211']
}

const formatDocumentAdditions: Record<string, string[]> = {
  'call-now': ['insurer-call-log'],
  'checklist': ['bill-review', 'rx-affordability', 'visit-prep'],
  'download': ['financial-assistance', 'appeal-template', 'prior-auth'],
  'find-clinics': ['visit-prep']
}

const helpResources: ResourceItem[] = [
  {
    id: 'emergency-911',
    title: 'Emergency services',
    whoItHelps: 'People with urgent, life-threatening symptoms.',
    phone: '911',
    url: 'tel:911',
    urlLabel: 'Call 911',
    group: 'Urgent and crisis',
    needRoutes: ['emergency'],
    conditionTags: ['any']
  },
  {
    id: 'crisis-988',
    title: '988 Suicide & Crisis Lifeline',
    whoItHelps: 'People in emotional distress, crisis, or needing urgent mental health support.',
    phone: '988',
    url: 'https://988lifeline.org',
    urlLabel: '988 Lifeline',
    group: 'Urgent and crisis',
    needRoutes: ['emergency', 'meds', 'caregiver'],
    conditionTags: ['mental-health', 'any']
  },
  {
    id: 'help-211',
    title: '211 local services navigation',
    whoItHelps: 'People looking for local help with food, housing, transport, and basic needs.',
    phone: '211',
    url: 'https://www.211.org',
    urlLabel: '211.org',
    group: 'Urgent and crisis',
    needRoutes: ['emergency', 'uninsured', 'care', 'caregiver', 'bills', 'meds'],
    conditionTags: ['any']
  },
  {
    id: 'cf-compass',
    title: 'CF Foundation Compass',
    whoItHelps: 'People with cystic fibrosis and caregivers navigating insurance, financial, legal, and life issues.',
    phone: '844-266-7277',
    url: 'https://www.cff.org/support/get-help-cf-foundation-compass',
    urlLabel: 'CF Foundation Compass',
    group: 'CF-specific support',
    needRoutes: ['meds', 'care', 'caregiver', 'uninsured'],
    conditionTags: ['cf']
  },
  {
    id: 'healthcare-gov',
    title: 'HealthCare.gov',
    whoItHelps: 'People exploring Marketplace plans, enrollment windows, and subsidy eligibility.',
    url: 'https://www.healthcare.gov',
    urlLabel: 'HealthCare.gov',
    group: 'Insurance and coverage',
    needRoutes: ['uninsured', 'bills', 'care', 'meds'],
    conditionTags: ['any']
  },
  {
    id: 'medicaid-gov',
    title: 'Medicaid.gov',
    whoItHelps: 'People checking Medicaid eligibility and state-specific enrollment pathways.',
    url: 'https://www.medicaid.gov',
    urlLabel: 'Medicaid.gov',
    group: 'Insurance and coverage',
    needRoutes: ['uninsured'],
    conditionTags: ['any']
  },
  {
    id: 'medicare-rights',
    title: 'Medicare rights and savings programs',
    whoItHelps: 'Older adults and disabled beneficiaries facing Medicare cost barriers.',
    url: 'https://www.medicare.gov/basics/costs/help',
    urlLabel: 'Medicare cost help',
    group: 'Insurance and coverage',
    needRoutes: ['uninsured', 'bills'],
    conditionTags: ['any']
  },
  {
    id: 'paf',
    title: 'Patient Advocate Foundation',
    whoItHelps: 'People managing insurance denials, high bills, or debt linked to treatment.',
    url: 'https://www.patientadvocate.org',
    urlLabel: 'Patient Advocate Foundation',
    group: 'Bills and debt',
    needRoutes: ['bills', 'uninsured', 'meds', 'care', 'caregiver', 'emergency'],
    conditionTags: ['any']
  },
  {
    id: 'findhelp',
    title: 'FindHelp social support directory',
    whoItHelps: 'People needing nearby low-cost clinics, legal aid, food, and support services.',
    url: 'https://www.findhelp.org',
    urlLabel: 'FindHelp.org',
    group: 'Bills and debt',
    needRoutes: ['bills', 'care', 'caregiver', 'uninsured'],
    conditionTags: ['any']
  },
  {
    id: 'needymeds',
    title: 'NeedyMeds',
    whoItHelps: 'People comparing prescription assistance programs and discount tools.',
    url: 'https://www.needymeds.org',
    urlLabel: 'NeedyMeds',
    group: 'Medication affordability',
    needRoutes: ['meds'],
    conditionTags: ['any']
  },
  {
    id: 'findcare',
    title: 'Find a federally funded health center',
    whoItHelps: 'People seeking lower-cost primary or specialty referral access.',
    url: 'https://findahealthcenter.hrsa.gov',
    urlLabel: 'HRSA clinic finder',
    group: 'Care and specialists',
    needRoutes: ['care', 'uninsured', 'bills', 'emergency'],
    conditionTags: ['any']
  },
  {
    id: 'alz-helpline',
    title: 'Alzheimer’s Association 24/7 Helpline',
    whoItHelps: 'Families and caregivers supporting people with dementia.',
    phone: '800-272-3900',
    url: 'https://www.alz.org/help-support/resources/helpline',
    urlLabel: 'Alzheimer’s Helpline',
    group: 'Dementia and caregiver support',
    needRoutes: ['caregiver', 'care'],
    conditionTags: ['dementia']
  },
  {
    id: 'caregiver-action',
    title: 'Caregiver Action Network',
    whoItHelps: 'Caregivers needing practical planning and peer support resources.',
    url: 'https://www.caregiveraction.org',
    urlLabel: 'Caregiver Action Network',
    group: 'Dementia and caregiver support',
    needRoutes: ['caregiver'],
    conditionTags: ['dementia', 'any']
  },
  {
    id: 'aha',
    title: 'American Heart Association',
    whoItHelps: 'People with cardiovascular conditions seeking condition guidance and support.',
    url: 'https://www.heart.org',
    urlLabel: 'American Heart Association',
    group: 'Condition foundations',
    needRoutes: ['care', 'meds'],
    conditionTags: ['heart-stroke']
  },
  {
    id: 'cancer-society',
    title: 'American Cancer Society',
    whoItHelps: 'People in active cancer treatment needing navigation and financial support links.',
    url: 'https://www.cancer.org',
    urlLabel: 'American Cancer Society',
    group: 'Condition foundations',
    needRoutes: ['care', 'meds', 'bills'],
    conditionTags: ['cancer']
  },
  {
    id: 'diabetes-assoc',
    title: 'American Diabetes Association',
    whoItHelps: 'People with diabetes managing medication, supplies, and long-term care planning.',
    url: 'https://diabetes.org',
    urlLabel: 'American Diabetes Association',
    group: 'Condition foundations',
    needRoutes: ['meds', 'care'],
    conditionTags: ['diabetes']
  },
  {
    id: 'nami',
    title: 'NAMI support and education',
    whoItHelps: 'People and families affected by mental health conditions.',
    url: 'https://www.nami.org',
    urlLabel: 'NAMI',
    group: 'Condition foundations',
    needRoutes: ['care', 'caregiver', 'meds'],
    conditionTags: ['mental-health']
  },
  {
    id: 'nkf',
    title: 'National Kidney Foundation',
    whoItHelps: 'People with kidney disease and dialysis-related financial or care needs.',
    url: 'https://www.kidney.org',
    urlLabel: 'National Kidney Foundation',
    group: 'Condition foundations',
    needRoutes: ['care', 'meds'],
    conditionTags: ['kidney']
  },
  {
    id: 'copd-foundation',
    title: 'COPD Foundation',
    whoItHelps: 'People with COPD or severe asthma seeking education and support.',
    url: 'https://www.copdfoundation.org',
    urlLabel: 'COPD Foundation',
    group: 'Condition foundations',
    needRoutes: ['care', 'meds'],
    conditionTags: ['copd-asthma']
  },
  {
    id: 'arthritis-foundation',
    title: 'Arthritis Foundation',
    whoItHelps: 'People with arthritis managing flares, mobility, and medication access.',
    url: 'https://www.arthritis.org',
    urlLabel: 'Arthritis Foundation',
    group: 'Condition foundations',
    needRoutes: ['care', 'meds'],
    conditionTags: ['arthritis']
  }
]

const documentLibrary: DocumentItem[] = [
  {
    id: 'bill-review',
    title: 'Medical bill review checklist',
    whoItHelps: 'People validating bill errors and requesting itemized statements.',
    summary: 'Error checks, coding mismatch review, and itemized bill request prompts.',
    topicTags: ['bills-debt'],
    conditionTags: ['any'],
    filename: 'medical-bill-review-checklist.txt'
  },
  {
    id: 'financial-assistance',
    title: 'Financial assistance / charity care checklist',
    whoItHelps: 'People applying for hospital assistance programs.',
    summary: 'Required documents, deadlines, and follow-up call structure.',
    topicTags: ['insurance', 'bills-debt'],
    conditionTags: ['any'],
    filename: 'financial-assistance-checklist.txt'
  },
  {
    id: 'payment-plan-script',
    title: 'Payment plan negotiation script',
    whoItHelps: 'People negotiating affordable repayment terms.',
    summary: 'How to request zero-interest plans and written agreements.',
    topicTags: ['bills-debt'],
    conditionTags: ['any'],
    filename: 'payment-plan-negotiation-script.txt'
  },
  {
    id: 'appeal-template',
    title: 'Insurance appeal template',
    whoItHelps: 'People responding to denials for visits, tests, or treatment.',
    summary: 'Appeal checklist with reason-code, evidence, and deadline sections.',
    topicTags: ['insurance', 'prior-auth'],
    conditionTags: ['any'],
    filename: 'insurance-appeal-template.txt'
  },
  {
    id: 'prior-auth',
    title: 'Prior authorization checklist',
    whoItHelps: 'People waiting on specialty medication approvals.',
    summary: 'Documents, call cadence, and escalation points for authorization delays.',
    topicTags: ['meds', 'prior-auth'],
    conditionTags: ['any'],
    filename: 'prior-authorization-checklist.txt'
  },
  {
    id: 'insurer-call-log',
    title: 'Talking to your insurer call log',
    whoItHelps: 'People tracking calls, reference numbers, and next steps.',
    summary: 'Structured call log for denials, billing questions, and coverage checks.',
    topicTags: ['insurance', 'bills-debt'],
    conditionTags: ['any'],
    filename: 'insurer-call-log-template.txt'
  },
  {
    id: 'visit-prep',
    title: 'Specialist visit prep worksheet',
    whoItHelps: 'People preparing for specialist appointments.',
    summary: 'Symptom timeline, meds list, questions, and treatment goal prompts.',
    topicTags: ['visit-prep'],
    conditionTags: ['any'],
    filename: 'specialist-visit-prep-worksheet.txt'
  },
  {
    id: 'rx-affordability',
    title: 'Prescription affordability checklist',
    whoItHelps: 'People comparing generic, formulary, and 90-day options.',
    summary: 'Medication cost comparison and refill strategy worksheet.',
    topicTags: ['meds'],
    conditionTags: ['any'],
    filename: 'prescription-affordability-checklist.txt'
  },
  {
    id: 'caregiver-starter',
    title: 'Caregiver starter kit',
    whoItHelps: 'Caregivers organizing permissions and emergency planning.',
    summary: 'Provider permission checklist, med list template, and emergency plan.',
    topicTags: ['caregiver'],
    conditionTags: ['dementia', 'any'],
    filename: 'caregiver-starter-kit.txt'
  },
  {
    id: 'dementia-cost-tracker',
    title: 'Dementia caregiver cost tracker',
    whoItHelps: 'Families tracking dementia-related caregiving and respite costs.',
    summary: 'Monthly cost tracker plus respite planning prompts.',
    topicTags: ['caregiver', 'disability-work'],
    conditionTags: ['dementia'],
    filename: 'dementia-caregiver-cost-tracker.txt'
  },
  {
    id: 'cf-coverage-continuity',
    title: 'CF coverage continuity checklist',
    whoItHelps: 'People with CF managing PA renewals and specialty pharmacy steps.',
    summary: 'Renewal dates, pharmacy tasks, and escalation triggers.',
    topicTags: ['cf', 'prior-auth', 'meds'],
    conditionTags: ['cf'],
    filename: 'cf-coverage-continuity-checklist.txt'
  },
  {
    id: 'compass-one-pager',
    title: 'CF Compass one-pager',
    whoItHelps: 'People needing a quick CF Foundation Compass contact guide.',
    summary: 'Compass scope, call prep, and handoff checklist for care teams.',
    topicTags: ['cf', 'insurance', 'caregiver'],
    conditionTags: ['cf'],
    filename: 'cf-compass-one-pager.txt'
  }
]

const topicFilters = [
  { value: 'all', label: 'All topics' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'bills-debt', label: 'Bills & debt' },
  { value: 'meds', label: 'Meds' },
  { value: 'prior-auth', label: 'Prior auth' },
  { value: 'visit-prep', label: 'Visit prep' },
  { value: 'caregiver', label: 'Caregiver' },
  { value: 'disability-work', label: 'Disability/work' },
  { value: 'cf', label: 'CF' }
]

const conditionFilters = [
  { value: 'all', label: 'All conditions' },
  { value: 'cf', label: 'CF' },
  { value: 'heart-stroke', label: 'Heart/stroke' },
  { value: 'cancer', label: 'Cancer' },
  { value: 'diabetes', label: 'Diabetes' },
  { value: 'mental-health', label: 'Mental health' },
  { value: 'kidney', label: 'Kidney' },
  { value: 'copd-asthma', label: 'COPD/asthma' },
  { value: 'arthritis', label: 'Arthritis' },
  { value: 'dementia', label: 'Dementia' }
]

const conditionCards: ConditionCard[] = [
  {
    id: 'heart-stroke',
    title: 'Heart disease & stroke',
    summary: 'High-cost events plus lifelong medications can create large out-of-pocket exposure and ongoing cost strain.',
    effects: [
      'One hospitalization can trigger major deductibles and coinsurance.',
      'Follow-up rehab and specialist visits add recurring costs.',
      'Medication burden can reduce adherence and increase repeat events.'
    ],
    triggers: 'ER care, imaging, procedures, readmissions, cardiac rehab, and multi-drug regimens.',
    actions: {
      today: 'Ask billing for financial assistance and an itemized bill. Request generic/formulary alternatives.',
      week: 'Confirm in-network providers and request procedure or rehab estimates.',
      ongoing: 'Keep organized documentation for appeals and coverage exceptions.'
    },
    stats: [
      'Heart failure family mean annual out-of-pocket: $4,423; 14% high burden, 5% catastrophic burden.',
      'Nearly 50% of people with ASCVD and diabetes reported medical bill hardship.'
    ],
    sources: [
      { label: 'AHA journals', url: 'https://www.ahajournals.org' },
      { label: 'CDC heart disease', url: 'https://www.cdc.gov/heartdisease' }
    ]
  },
  {
    id: 'cancer',
    title: 'Cancer',
    summary: 'Diagnostics, surgery, infusions, and supportive meds can create rapid cost spikes and financial toxicity.',
    effects: [
      'Recurring treatment costs combine with travel and missed work.',
      'High cost-sharing can leave insured households effectively underinsured.',
      'Long treatment timelines increase debt risk.'
    ],
    triggers: 'Imaging, surgery, infusion cycles, specialty drugs, and complications.',
    actions: {
      today: 'Request a treatment cost outline and ask for a social worker or financial navigator.',
      week: 'Apply to copay foundations and hospital financial assistance programs.',
      ongoing: 'Track EOBs and denials at each treatment phase and recheck coverage.'
    },
    stats: [
      'Insured patients can face a median $500/month out-of-pocket burden.',
      'U.S. out-of-pocket cancer treatment spending reached $5.6B in 2018.'
    ],
    sources: [
      { label: 'NCI financial toxicity', url: 'https://www.cancer.gov/about-cancer/managing-care/track-care-costs/financial-toxicity-pdq' },
      { label: 'American Cancer Society', url: 'https://www.cancer.org/treatment/finding-and-paying-for-treatment.html' }
    ]
  },
  {
    id: 'diabetes',
    title: 'Diabetes',
    summary: 'Medication, supplies, monitoring, and specialist follow-up create continuous monthly pressure.',
    effects: [
      'Medication and supply costs can force dangerous rationing.',
      'Complications increase long-term care intensity and cost.',
      'Regular labs and visits can be hard to sustain financially.'
    ],
    triggers: 'ER visits for glucose emergencies, complications, and hospitalizations.',
    actions: {
      today: 'Ask pharmacy and clinician about lowest-cost covered med and supply options.',
      week: 'Apply for assistance and verify plan prior-auth requirements.',
      ongoing: 'Maintain preventive schedule (A1C, eye, kidney) to reduce avoidable crises.'
    },
    stats: [
      'Estimated U.S. diagnosed diabetes cost in 2022: $412.9B.',
      'Average annual medical expenditures per person: $19,736.'
    ],
    sources: [
      { label: 'American Diabetes Association', url: 'https://diabetes.org/about-diabetes/statistics/cost-diabetes' },
      { label: 'CDC diabetes', url: 'https://www.cdc.gov/diabetes' }
    ]
  },
  {
    id: 'mental-health',
    title: 'Mental health conditions',
    summary: 'Access gaps and out-of-network care can create disproportionate out-of-pocket burden.',
    effects: [
      'Therapy and psychiatry visits can be expensive without in-network access.',
      'Frequent follow-up and medication management create ongoing costs.',
      'Financial strain can worsen symptoms and disrupt care continuity.'
    ],
    triggers: 'Out-of-network therapy, crisis visits, inpatient admissions, and interrupted care.',
    actions: {
      today: 'Ask insurer for in-network options and case management support.',
      week: 'Request network adequacy exception if no in-network providers are available.',
      ongoing: 'Use community or sliding-scale options while maintaining care continuity.'
    },
    stats: [
      'MEPS 2018–2021: 2.4% of psychiatric outpatients had high OOP burden.',
      'Among those below poverty level, high OOP burden rose to 12.8%.'
    ],
    sources: [
      { label: 'NIMH', url: 'https://www.nimh.nih.gov/health/topics/caring-for-your-mental-health' },
      { label: 'NAMI', url: 'https://www.nami.org/Your-Journey/Individuals-with-Mental-Illness/Finding-Treatment' }
    ]
  },
  {
    id: 'kidney',
    title: 'Kidney disease / dialysis',
    summary: 'Kidney disease carries high spending; dialysis adds recurring treatment and transport burden.',
    effects: [
      'Frequent labs, specialist care, and multiple meds add up.',
      'Dialysis schedules can impact work stability and transportation costs.',
      'Out-of-pocket spending can be high even pre-dialysis.'
    ],
    triggers: 'Hospitalizations, dialysis progression, transplant workups, and complications.',
    actions: {
      today: 'Confirm in-network care and request written estimates for planned services.',
      week: 'Ask about transport help and medication assistance programs.',
      ongoing: 'Track all bills and EOBs and appeal denials quickly.'
    },
    stats: [
      'Non-dialysis CKD mean annual out-of-pocket: $1,439 in MEPS analysis.',
      'Medicare ESRD costs reached $55.3B in 2023.'
    ],
    sources: [
      { label: 'National Kidney Foundation', url: 'https://www.kidney.org' },
      { label: 'USRDS', url: 'https://usrds-adr.niddk.nih.gov' }
    ]
  },
  {
    id: 'copd-asthma',
    title: 'COPD / severe asthma',
    summary: 'Maintenance inhalers and exacerbation events create recurring and sudden costs.',
    effects: [
      'Brand or non-formulary inhalers can be expensive.',
      'Exacerbations can lead to ER visits and hospital admissions.',
      'Work interruptions may reduce household income.'
    ],
    triggers: 'ER/hospital admissions, oxygen equipment, and repeat exacerbations.',
    actions: {
      today: 'Ask for least expensive covered inhaler options and refill timing rules.',
      week: 'Build an exacerbation prevention plan and verify equipment coverage.',
      ongoing: 'Keep a trigger log and follow maintenance plan to reduce crises.'
    },
    stats: [
      'Mean annual OOP spending estimated at $325 in referenced COPD analysis.',
      'COPD-specific national cost in that analysis: $24.0B.'
    ],
    sources: [
      { label: 'COPD Foundation', url: 'https://www.copdfoundation.org' },
      { label: 'CDC COPD', url: 'https://www.cdc.gov/copd' }
    ]
  },
  {
    id: 'arthritis',
    title: 'Arthritis (including RA)',
    summary: 'Specialty biologics and long-term monitoring can create substantial annual out-of-pocket costs.',
    effects: [
      'Specialty medications can create high yearly cost-sharing.',
      'Pain and function loss can reduce work hours and earnings.',
      'PT, imaging, and procedures add recurring expenses.'
    ],
    triggers: 'Biologics, urgent flares, surgery, and ongoing therapy.',
    actions: {
      today: 'Ask about biosimilars, assistance programs, and formulary status.',
      week: 'Review expected annual OOP and refill timing across coverage phases.',
      ongoing: 'Use function-focused PT and exercise plans to reduce flare-related costs.'
    },
    stats: [
      'Medicare Part D RA biologics projected annual OOP mean: $4,613 (2019).',
      'Arthritis-attributable medical spending plus earnings losses: $303.5B (2013).'
    ],
    sources: [
      { label: 'Arthritis Foundation', url: 'https://www.arthritis.org' },
      { label: 'CDC arthritis', url: 'https://www.cdc.gov/arthritis' }
    ]
  },
  {
    id: 'dementia',
    title: 'Alzheimer’s & other dementias',
    summary: 'Long-term care needs and caregiver burden can destabilize household finances over years.',
    effects: [
      'Long-term support services can dominate family budgets.',
      'Families absorb major unpaid caregiving and direct out-of-pocket costs.',
      'Caregiving demands can reduce paid work hours.'
    ],
    triggers: 'Escalating care needs, home safety changes, placement, and repeated medical events.',
    actions: {
      today: 'Identify immediate support gaps and ask for respite resources.',
      week: 'Start care coordination permissions, med list, and emergency plan.',
      ongoing: 'Reassess care level and support eligibility as needs evolve.'
    },
    stats: [
      'Projected 2025 dementia health + long-term care costs: $384B, with $97B OOP.',
      'Caregivers average annual OOP around $7,200, higher for dementia caregivers.'
    ],
    sources: [
      { label: 'Alzheimer’s Association', url: 'https://www.alz.org' },
      { label: 'NIH Alzheimer’s disease', url: 'https://www.nia.nih.gov/health/alzheimers' }
    ]
  }
]

const faqItems: FaqItem[] = [
  {
    question: 'Is this medical advice?',
    answer: 'No. This page is for navigation and cost support, not medical diagnosis or treatment.'
  },
  {
    question: 'Do you store my answers?',
    answer: 'Only optional email is stored for movie-news invites. Health answers are not stored.'
  },
  {
    question: 'What if I’m uninsured?',
    answer: 'Start with Medicaid or Marketplace checks, then ask clinics for self-pay and financial-assistance options.'
  },
  {
    question: 'What if I can’t afford my meds?',
    answer: 'Ask for lower-cost alternatives, prior-auth help, and medication assistance programs.'
  },
  {
    question: 'How do I fight a denial?',
    answer: 'Get the denial reason in writing and appeal before the deadline with supporting records.'
  },
  {
    question: 'What should I do about medical debt?',
    answer: 'Request an itemized bill, apply for assistance, and negotiate written no-interest payment terms.'
  }
]

const supportCallScript = [
  'Hi, I need help with coverage and costs for my care right now.',
  'Please tell me the most important next step for today and the deadline I need to track.',
  'Before we end this call, please share the reference number and required documents.'
]

const answers = reactive<Record<QuestionId, string>>({
  need: '',
  stage: '',
  condition: '',
  insurance: '',
  barrier: '',
  age: '',
  state: '',
  email: '',
  format: ''
})

const questionIndex = ref(0)
const result = ref<GeneratedResult | null>(null)
const activeTopicFilter = ref('all')
const activeConditionFilter = ref('all')
const route = useRoute()

const needQuestion = wizardQuestions.find(question => question.id === 'need')
const validNeedValues = new Set((needQuestion?.options ?? []).map(option => option.value))
const queryNeedValue = Array.isArray(route.query.need) ? route.query.need[0] : route.query.need

if (typeof queryNeedValue === 'string' && validNeedValues.has(queryNeedValue)) {
  answers.need = queryNeedValue
  questionIndex.value = wizardQuestions.length > 1 ? 1 : 0
}

const fallbackQuestion: WizardQuestion = {
  id: 'need',
  prompt: 'What do you need most right now?',
  options: []
}

const currentQuestion = computed<WizardQuestion>(() => {
  return wizardQuestions[questionIndex.value] ?? fallbackQuestion
})

const currentQuestionOptions = computed<Option[]>(() => {
  return currentQuestion.value.options ?? []
})

const filteredDocuments = computed(() => {
  return documentLibrary.filter((document) => {
    const topicMatch = activeTopicFilter.value === 'all' || document.topicTags.includes(activeTopicFilter.value)
    const conditionMatch = activeConditionFilter.value === 'all'
      || document.conditionTags.includes('any')
      || document.conditionTags.includes(activeConditionFilter.value)

    return topicMatch && conditionMatch
  })
})

const groupedHelpResources = computed(() => {
  const groups = [...new Set(helpResources.map(resource => resource.group))]

  return groups.map((group) => {
    const groupedItems = helpResources.filter(resource => resource.group === group)

    return {
      group,
      total: groupedItems.length,
      items: groupedItems.slice(0, 4)
    }
  })
})

const resultResources = computed(() => {
  if (!result.value) {
    return []
  }

  return result.value.resourceIds
    .map(resourceId => helpResources.find(resource => resource.id === resourceId))
    .filter((resource): resource is ResourceItem => Boolean(resource))
})

const resultDocuments = computed(() => {
  if (!result.value) {
    return []
  }

  return result.value.documentIds
    .map(documentId => documentLibrary.find(document => document.id === documentId))
    .filter((document): document is DocumentItem => Boolean(document))
})

useSeoMeta({
  title: 'Resources | Billings',
  ogTitle: 'Resources | Billings',
  description: 'Care, insurance, and financial help resources without storing personal health information.',
  ogDescription: 'Care, insurance, and financial help resources without storing personal health information.'
})

const findOptionLabel = (questionId: QuestionId, value: string) => {
  if (questionId === 'state' || questionId === 'email') {
    return value
  }

  const question = wizardQuestions.find(item => item.id === questionId)

  if (!question?.options) {
    return value
  }

  return question.options.find(option => option.value === value)?.label ?? value
}

const resultHeading = computed(() => {
  if (!result.value) {
    return 'Find your next step'
  }

  const stateValue = answers.state.trim()
  const stateFragment = stateValue ? ` in ${stateValue}` : ''
  const formatLabel = findOptionLabel('format', answers.format)
  const formatFragment = formatLabel ? ` - ${formatLabel} support` : ''

  return `${result.value.routeTitle}${stateFragment}${formatFragment}`
})

const orderedResultResources = computed(() => {
  const preferredIds = new Set(formatResourceAdditions[answers.format] ?? [])
  const preferred = resultResources.value.filter(resource => preferredIds.has(resource.id))
  const remaining = resultResources.value.filter(resource => !preferredIds.has(resource.id))
  return [...preferred, ...remaining]
})

const orderedResultDocuments = computed(() => {
  const preferredIds = new Set(formatDocumentAdditions[answers.format] ?? [])
  const preferred = resultDocuments.value.filter(document => preferredIds.has(document.id))
  const remaining = resultDocuments.value.filter(document => !preferredIds.has(document.id))
  return [...preferred, ...remaining]
})

const topResource = computed(() => {
  return orderedResultResources.value[0] ?? null
})

const topDocument = computed(() => {
  return orderedResultDocuments.value[0] ?? null
})

function dedupe<T>(items: T[]) {
  return Array.from(new Set(items))
}

const compactCopy = (text: string, max = 120) => {
  if (text.length <= max) {
    return text
  }

  return `${text.slice(0, max).trimEnd()}...`
}

const toSlug = (text: string) => {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

const mergePlanItems = (base: string[], additions: Array<string | undefined>) => {
  const prioritized = additions.filter((item): item is string => Boolean(item))
  const merged = dedupe([...prioritized, ...base])
  return merged.slice(0, 3)
}

const formatSummary = () => {
  const needLabel = findOptionLabel('need', answers.need).toLowerCase()
  const insuranceLabel = findOptionLabel('insurance', answers.insurance).toLowerCase()
  const barrierLabel = findOptionLabel('barrier', answers.barrier).toLowerCase()
  const formatLabel = findOptionLabel('format', answers.format).toLowerCase()
  const conditionLabel = findOptionLabel('condition', answers.condition)
  const stageLabel = findOptionLabel('stage', answers.stage).toLowerCase()
  const stateFragment = answers.state.trim() ? ` in ${answers.state.trim()}` : ''

  const conditionFragment = answers.condition && answers.condition !== 'not-sure'
    ? ` with focus on ${conditionLabel}`
    : ''

  return `You asked for ${formatLabel} help${stateFragment}. This plan prioritizes ${needLabel} during ${stageLabel}, with ${insuranceLabel} coverage and the main barrier of ${barrierLabel}${conditionFragment}.`
}

const buildResultPlan = () => {
  const routeKey = needToRoute[answers.need] ?? 'care'
  const baseRoute = routeRecipes[routeKey]
  const insuranceUpdate = insuranceAdjustments[answers.insurance] ?? {}
  const barrierUpdate = barrierAdjustments[answers.barrier] ?? {}
  const conditionUpdate = conditionAdjustments[answers.condition] ?? {}

  const doToday = mergePlanItems(baseRoute.doToday, [
    insuranceUpdate.today,
    barrierUpdate.today,
    conditionUpdate.today
  ])

  const thisWeek = mergePlanItems(baseRoute.thisWeek, [
    insuranceUpdate.week,
    barrierUpdate.week,
    conditionUpdate.week
  ])

  const ongoing = mergePlanItems(baseRoute.ongoing, [
    insuranceUpdate.ongoing,
    barrierUpdate.ongoing,
    conditionUpdate.ongoing
  ])

  const fallbackResources = ['help-211', 'paf', 'healthcare-gov', 'findhelp', 'findcare']
  const mergedResourceIds = dedupe([
    ...(formatResourceAdditions[answers.format] ?? []),
    ...baseRoute.resourceIds,
    ...(insuranceUpdate.resourceIds ?? []),
    ...(barrierUpdate.resourceIds ?? []),
    ...(conditionUpdate.resourceIds ?? []),
    ...fallbackResources
  ])

  const routeResources = mergedResourceIds.slice(0, 8)

  const fallbackDocuments = ['insurer-call-log', 'bill-review', 'visit-prep', 'financial-assistance']
  const mergedDocumentIds = dedupe([
    ...(formatDocumentAdditions[answers.format] ?? []),
    ...baseRoute.documentIds,
    ...(insuranceUpdate.documentIds ?? []),
    ...(barrierUpdate.documentIds ?? []),
    ...(conditionUpdate.documentIds ?? []),
    ...fallbackDocuments
  ])

  const routeDocuments = mergedDocumentIds.slice(0, 6)

  return {
    routeTitle: baseRoute.title,
    summary: formatSummary(),
    doToday,
    thisWeek,
    ongoing,
    resourceIds: routeResources,
    documentIds: routeDocuments
  }
}

const answerWithOption = (value: string) => {
  answers[currentQuestion.value.id] = value

  if (questionIndex.value === wizardQuestions.length - 1) {
    result.value = buildResultPlan()
    return
  }

  questionIndex.value += 1
}

const setOptionalInputValue = (value: string) => {
  if (currentQuestion.value.input === 'state') {
    answers.state = value
    return
  }

  if (currentQuestion.value.input === 'email') {
    answers.email = value
  }
}

const submitOptionalInputAndContinue = () => {
  if (currentQuestion.value.input === 'state') {
    answers.state = answers.state.trim()
  }

  if (currentQuestion.value.input === 'email') {
    answers.email = answers.email.trim()
  }

  if (questionIndex.value === wizardQuestions.length - 1) {
    result.value = buildResultPlan()
    return
  }

  questionIndex.value += 1
}

const skipOptionalInput = () => {
  if (currentQuestion.value.input === 'state') {
    answers.state = ''
  }

  if (currentQuestion.value.input === 'email') {
    answers.email = ''
  }

  submitOptionalInputAndContinue()
}

const goBack = () => {
  if (questionIndex.value > 0) {
    questionIndex.value -= 1
  }
}

const returnToQuestions = () => {
  if (!result.value) {
    return
  }

  result.value = null
  questionIndex.value = wizardQuestions.length - 1
}

const restartWizard = () => {
  answers.need = ''
  answers.stage = ''
  answers.condition = ''
  answers.insurance = ''
  answers.barrier = ''
  answers.age = ''
  answers.state = ''
  answers.email = ''
  answers.format = ''
  questionIndex.value = 0
  result.value = null
}

const buildDocumentDownloadContent = (document: DocumentItem) => {
  return [
    document.title,
    '',
    `Who it helps: ${document.whoItHelps}`,
    `Summary: ${document.summary}`,
    '',
    'Checklist notes:',
    '- Date:',
    '- Contact name:',
    '- Phone / email:',
    '- Next action:',
    '- Deadline:'
  ].join('\n')
}

const documentDownloadHref = (document: DocumentItem) => {
  return `data:text/plain;charset=utf-8,${encodeURIComponent(buildDocumentDownloadContent(document))}`
}

const buildConditionGuideContent = (condition: ConditionCard) => {
  return [
    condition.title,
    '',
    `Summary: ${condition.summary}`,
    `Main trigger: ${condition.triggers}`,
    '',
    'Top actions:',
    `- Today: ${condition.actions.today}`,
    `- This week: ${condition.actions.week}`,
    `- Ongoing: ${condition.actions.ongoing}`,
    '',
    `Key stat: ${condition.stats[0] ?? 'See listed sources.'}`,
    '',
    'Sources:',
    ...condition.sources.map(source => `- ${source.label}: ${source.url}`)
  ].join('\n')
}

const conditionGuideFilename = (condition: ConditionCard) => {
  return `${toSlug(condition.title)}-quick-guide.txt`
}

const conditionGuideDownloadHref = (condition: ConditionCard) => {
  return `data:text/plain;charset=utf-8,${encodeURIComponent(buildConditionGuideContent(condition))}`
}

const buildActionPlanDownloadContent = (plan: GeneratedResult) => {
  return [
    plan.routeTitle,
    '',
    plan.summary,
    '',
    'Today:',
    ...plan.doToday.map(item => `- ${item}`),
    '',
    'This week:',
    ...plan.thisWeek.map(item => `- ${item}`),
    '',
    'Ongoing:',
    ...plan.ongoing.map(item => `- ${item}`)
  ].join('\n')
}

const actionPlanDownloadHref = computed(() => {
  if (!result.value) {
    return ''
  }

  return `data:text/plain;charset=utf-8,${encodeURIComponent(buildActionPlanDownloadContent(result.value))}`
})

const actionPlanFilename = computed(() => {
  if (!result.value) {
    return 'action-plan.txt'
  }

  return `${toSlug(result.value.routeTitle)}-action-plan.txt`
})

const buildDirectoryDownloadContent = () => {
  return helpResources.map((resource) => {
    const lines = [
      `${resource.group} - ${resource.title}`,
      `Who it helps: ${resource.whoItHelps}`,
      `Link: ${resource.url} (${resource.urlLabel})`
    ]

    if (resource.phone) {
      lines.push(`Phone: ${resource.phone}`)
    }

    return lines.join('\n')
  }).join('\n\n')
}

const helpDirectoryDownloadHref = computed(() => {
  return `data:text/plain;charset=utf-8,${encodeURIComponent(buildDirectoryDownloadContent())}`
})

const buildCallScriptDownloadContent = () => {
  return [
    'Call script',
    '',
    ...supportCallScript.map(line => `- ${line}`)
  ].join('\n')
}

const callScriptDownloadHref = computed(() => {
  return `data:text/plain;charset=utf-8,${encodeURIComponent(buildCallScriptDownloadContent())}`
})

const cfQuickDocuments = computed(() => {
  const ids = ['compass-one-pager', 'cf-coverage-continuity']
  return ids
    .map(id => documentLibrary.find(document => document.id === id))
    .filter((document): document is DocumentItem => Boolean(document))
})

const cfCompassResource = helpResources.find(resource => resource.id === 'cf-compass')
</script>

<template>
  <div class="resources-page">
    <main>
      <section
        class="hero-transform"
        :class="{ 'is-result': Boolean(result) }"
      >
        <div class="hero-layout">
          <div class="hero-copy">
            <div
              v-if="!result"
              class="wizard-state"
            >
              <article class="question-card">
                <Transition
                  name="question-fade"
                  mode="out-in"
                >
                  <div
                    :key="currentQuestion.id"
                    class="question-stage"
                  >
                    <header>
                      <p class="question-step">
                        Question {{ questionIndex + 1 }} of {{ wizardQuestions.length }}
                      </p>
                      <h1>{{ currentQuestion.prompt }}</h1>
                      <p
                        v-if="currentQuestion.optional"
                        class="optional-badge"
                      >
                        Optional
                      </p>
                    </header>

                    <div
                      v-if="currentQuestion.input === 'state' || currentQuestion.input === 'email'"
                      class="state-input-wrap"
                    >
                      <input
                        :value="currentQuestion.input === 'email' ? answers.email : answers.state"
                        :type="currentQuestion.input === 'email' ? 'email' : 'text'"
                        :placeholder="currentQuestion.input === 'email'
                          ? 'Enter email (optional)'
                          : 'Enter state (for example: California)'"
                        :autocomplete="currentQuestion.input === 'email' ? 'email' : 'address-level1'"
                        @input="setOptionalInputValue(($event.target as HTMLInputElement).value)"
                      >

                      <div class="state-actions">
                        <button
                          type="button"
                          class="primary-btn"
                          @click="submitOptionalInputAndContinue"
                        >
                          Continue
                        </button>
                        <button
                          type="button"
                          class="ghost-btn"
                          @click="skipOptionalInput"
                        >
                          Skip
                        </button>
                      </div>
                    </div>

                    <div
                      v-else
                      class="options-grid"
                    >
                      <button
                        v-for="option in currentQuestionOptions"
                        :key="option.value"
                        type="button"
                        class="option-btn"
                        @click="answerWithOption(option.value)"
                      >
                        {{ option.label }}
                      </button>
                    </div>
                  </div>
                </Transition>

                <button
                  type="button"
                  class="back-btn"
                  :disabled="questionIndex === 0"
                  @click="goBack"
                >
                  Back
                </button>
              </article>
            </div>

            <div
              v-else
              class="results-state"
            >
              <p class="section-label section-label--with-icon">
                <UIcon
                  name="i-lucide-sparkles"
                  class="section-label-icon"
                />
                Personalized plan
              </p>
              <h1>{{ resultHeading }}</h1>

              <section class="result-simple-grid">
                <article class="result-simple-card result-simple-card--resource">
                  <p class="result-card-label">
                    <UIcon
                      name="i-lucide-life-buoy"
                      class="result-label-icon"
                    />
                    <span>Top free resource</span>
                  </p>
                  <template v-if="topResource">
                    <h2>{{ topResource.title }}</h2>
                    <p class="resource-meta">
                      {{ compactCopy(topResource.whoItHelps, 96) }}
                    </p>
                    <a
                      :href="topResource.url"
                      target="_blank"
                      rel="noopener"
                    >
                      {{ topResource.urlLabel }} <UIcon name="i-lucide-arrow-up-right" />
                    </a>
                  </template>
                  <p
                    v-else
                    class="resource-meta"
                  >
                    No free resource available.
                  </p>
                </article>

                <article class="result-simple-card result-simple-card--document">
                  <p class="result-card-label">
                    <UIcon
                      name="i-lucide-file-down"
                      class="result-label-icon"
                    />
                    <span>Top document to download</span>
                  </p>
                  <template v-if="topDocument">
                    <h2>{{ topDocument.title }}</h2>
                    <p class="resource-meta">
                      {{ compactCopy(topDocument.summary, 96) }}
                    </p>
                    <a
                      :href="documentDownloadHref(topDocument)"
                      :download="topDocument.filename"
                    >
                      Download template <UIcon name="i-lucide-download" />
                    </a>
                  </template>
                  <p
                    v-else
                    class="resource-meta"
                  >
                    No document available.
                  </p>
                </article>
              </section>

              <section class="result-plan-card result-panel result-panel--plan">
                <p class="result-card-label">
                  <UIcon
                    name="i-lucide-list-checks"
                    class="result-label-icon"
                  />
                  <span>Action plan</span>
                </p>
                <div class="plan-columns">
                  <article class="plan-block">
                    <h4 class="mini-heading">
                      <UIcon
                        name="i-lucide-sun"
                        class="mini-heading-icon"
                      /> Today
                    </h4>
                    <ul>
                      <li
                        v-for="item in result.doToday.slice(0, 2)"
                        :key="item"
                      >
                        {{ item }}
                      </li>
                    </ul>
                  </article>
                  <article class="plan-block">
                    <h4 class="mini-heading">
                      <UIcon
                        name="i-lucide-calendar-days"
                        class="mini-heading-icon"
                      /> This week
                    </h4>
                    <ul>
                      <li
                        v-for="item in result.thisWeek.slice(0, 2)"
                        :key="item"
                      >
                        {{ item }}
                      </li>
                    </ul>
                  </article>
                  <article class="plan-block">
                    <h4 class="mini-heading">
                      <UIcon
                        name="i-lucide-refresh-cw"
                        class="mini-heading-icon"
                      /> Ongoing
                    </h4>
                    <ul>
                      <li
                        v-for="item in result.ongoing.slice(0, 2)"
                        :key="item"
                      >
                        {{ item }}
                      </li>
                    </ul>
                  </article>
                </div>
                <a
                  class="plan-download-link"
                  :href="actionPlanDownloadHref"
                  :download="actionPlanFilename"
                >
                  Download full action plan <UIcon name="i-lucide-download" />
                </a>
              </section>

              <section class="result-resource-list-card result-panel result-panel--resources">
                <p class="result-card-label">
                  <UIcon
                    name="i-lucide-link-2"
                    class="result-label-icon"
                  />
                  <span>All free resources</span>
                </p>
                <ul class="resource-list result-resource-list">
                  <li
                    v-for="resource in orderedResultResources"
                    :key="resource.id"
                  >
                    <div>
                      <p class="resource-title">
                        <UIcon
                          name="i-lucide-life-buoy"
                          class="result-inline-icon"
                        /> {{ resource.title }}
                      </p>
                      <p class="resource-meta">
                        {{ compactCopy(resource.whoItHelps, 92) }}
                      </p>
                      <p
                        v-if="resource.phone"
                        class="resource-meta"
                      >
                        <UIcon
                          name="i-lucide-phone"
                          class="result-inline-icon"
                        /> {{ resource.phone }}
                      </p>
                    </div>
                    <a
                      :href="resource.url"
                      target="_blank"
                      rel="noopener"
                    >
                      {{ resource.urlLabel }} <UIcon name="i-lucide-arrow-up-right" />
                    </a>
                  </li>
                </ul>
              </section>

              <div class="result-controls">
                <button
                  type="button"
                  class="ghost-btn"
                  @click="returnToQuestions"
                >
                  <UIcon name="i-lucide-arrow-left" /> Back to questions
                </button>
                <button
                  type="button"
                  class="ghost-btn"
                  @click="restartWizard"
                >
                  <UIcon name="i-lucide-rotate-ccw" /> Restart
                </button>
              </div>
            </div>
          </div>

          <figure
            v-if="!result"
            class="hero-media"
          >
            <img
              src="/images/form-alter.jpg"
              alt="A man grabbing a medical device"
              loading="lazy"
            >
          </figure>
        </div>
      </section>

      <div class="page-shell">
        <section
          id="help-now"
          class="help-now content-section section-help"
        >
          <h2>Help now</h2>
          <p>Use one of these first if you need immediate support.</p>
          <div class="help-now-grid">
            <figure class="section-photo section-photo--help section-photo--wide grid-photo-item">
              <img
                src="https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1800&q=80"
                alt="Support team helping someone by phone"
                loading="lazy"
              >
            </figure>
            <a href="tel:911">
              <UIcon
                name="i-lucide-siren"
                class="link-icon"
              /> Emergency: 911
            </a>
            <a
              href="https://988lifeline.org"
              target="_blank"
              rel="noopener"
            ><UIcon
              name="i-lucide-phone-call"
              class="link-icon"
            /> Crisis support: 988</a>
            <a
              href="https://www.211.org"
              target="_blank"
              rel="noopener"
            ><UIcon
              name="i-lucide-map-pin"
              class="link-icon"
            /> Local services: 211</a>
            <a
              href="https://www.cff.org/support/get-help-cf-foundation-compass"
              target="_blank"
              rel="noopener"
            >
              <span>
                <UIcon
                  name="i-lucide-heart-pulse"
                  class="link-icon"
                /> CF help: CF Foundation Compass
              </span>
            </a>
          </div>
        </section>

        <section
          id="cf-quick-guide"
          class="cf-spotlight content-section section-cf"
        >
          <h2 class="title-with-icon">
            Cystic fibrosis quick guide
          </h2>
          <p class="section-subtitle">
            Focus on support first, then download a guide for details.
          </p>
          <div class="spotlight-grid">
            <figure class="section-photo section-photo--cf section-photo--portrait grid-photo-item">
              <img
                src="https://images.unsplash.com/photo-1584982751601-97dcc096659c?auto=format&fit=crop&w=1800&q=80"
                alt="Clinician discussing care plan with patient"
                loading="lazy"
              >
            </figure>
            <article>
              <h3>
                Main pressure
              </h3>
              <ul>
                <li>Specialty meds and frequent follow-up can raise monthly costs.</li>
                <li>Care time can affect school or work stability.</li>
              </ul>
            </article>

            <article>
              <h3>
                Start now
              </h3>
              <ul>
                <li>Call CF Foundation Compass for navigation support.</li>
                <li>Track prior-auth and pharmacy renewal dates.</li>
              </ul>
            </article>

            <article>
              <h3>
                Download guides
              </h3>
              <p>Use these if you want the full step-by-step checklist.</p>
              <div class="inline-downloads">
                <a
                  v-for="document in cfQuickDocuments"
                  :key="document.id"
                  :href="documentDownloadHref(document)"
                  :download="document.filename"
                >
                  <UIcon
                    name="i-lucide-file-text"
                    class="link-icon"
                  /> {{ document.title }}
                </a>
              </div>
              <a
                v-if="cfCompassResource"
                :href="cfCompassResource.url"
                target="_blank"
                rel="noopener"
              ><UIcon
                name="i-lucide-phone"
                class="link-icon"
              /> Call CF Foundation Compass</a>
            </article>
          </div>
        </section>

        <section
          id="conditions-section"
          class="conditions-section content-section section-conditions"
        >
          <h2 class="title-with-icon">
            Top Conditions people struggle with financially
          </h2>
          <p class="section-subtitle">
            Keep this simple: main risk, next steps, then download a quick guide.
          </p>
          <div class="conditions-grid">
            <figure class="section-photo section-photo--conditions section-photo--square grid-photo-item">
              <img
                src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1800&q=80"
                alt="Medical records and notes on a desk"
                loading="lazy"
              >
            </figure>
            <article
              v-for="condition in conditionCards"
              :key="condition.id"
              class="condition-card"
            >
              <h3>{{ condition.title }}</h3>
              <p class="card-summary">
                {{ condition.summary }}
              </p>

              <p class="condition-impact">
                <UIcon
                  name="i-lucide-alert-circle"
                  class="inline-icon"
                />
                <strong>Main cost trigger:</strong> {{ compactCopy(condition.triggers, 96) }}
              </p>

              <p class="condition-stat">
                <UIcon
                  name="i-lucide-bar-chart-3"
                  class="inline-icon"
                />
                <strong>Key stat:</strong> {{ compactCopy(condition.stats[0] ?? '', 98) }}
              </p>

              <div class="condition-links">
                <a
                  :href="conditionGuideDownloadHref(condition)"
                  :download="conditionGuideFilename(condition)"
                >
                  <UIcon
                    name="i-lucide-file-down"
                    class="link-icon"
                  /> Download quick guide
                </a>
                <a
                  v-if="condition.sources[0]"
                  :href="condition.sources[0].url"
                  target="_blank"
                  rel="noopener"
                >
                  <UIcon
                    name="i-lucide-book-open"
                    class="link-icon"
                  /> Source
                </a>
              </div>
            </article>
          </div>
        </section>

        <section
          id="docs-library"
          class="docs-library content-section section-docs"
        >
          <p class="section-label section-label--with-icon">
            <UIcon
              name="i-lucide-book-open"
              class="section-label-icon"
            />
            Document library
          </p>
          <h2 class="title-with-icon">
            <UIcon
              name="i-lucide-files"
              class="title-icon"
            /> Downloadable templates
          </h2>
          <p class="section-subtitle">
            Filter quickly, then download only what you need.
          </p>
          <div class="filter-row">
            <div>
              <p class="filter-label">
                <UIcon
                  name="i-lucide-tags"
                  class="inline-icon"
                /> Topic tags
              </p>
              <div class="filter-chip-row">
                <button
                  v-for="filter in topicFilters"
                  :key="filter.value"
                  type="button"
                  class="filter-chip"
                  :class="{ 'is-active': activeTopicFilter === filter.value }"
                  @click="activeTopicFilter = filter.value"
                >
                  {{ filter.label }}
                </button>
              </div>
            </div>

            <div>
              <p class="filter-label">
                <UIcon
                  name="i-lucide-heart-pulse"
                  class="inline-icon"
                /> Condition tags
              </p>
              <div class="filter-chip-row">
                <button
                  v-for="filter in conditionFilters"
                  :key="filter.value"
                  type="button"
                  class="filter-chip"
                  :class="{ 'is-active': activeConditionFilter === filter.value }"
                  @click="activeConditionFilter = filter.value"
                >
                  {{ filter.label }}
                </button>
              </div>
            </div>
          </div>

          <div class="docs-grid">
            <figure class="section-photo section-photo--docs section-photo--landscape grid-photo-item">
              <img
                src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1800&q=80"
                alt="Checklist documents and pen ready for planning"
                loading="lazy"
              >
            </figure>
            <article
              v-for="document in filteredDocuments"
              :key="document.id"
              class="doc-card"
            >
              <h3>
                <UIcon
                  name="i-lucide-file-text"
                  class="title-icon"
                /> {{ document.title }}
              </h3>
              <p class="doc-meta">
                <UIcon
                  name="i-lucide-users"
                  class="inline-icon"
                /> {{ compactCopy(document.whoItHelps, 86) }}
              </p>
              <p>
                <UIcon
                  name="i-lucide-info"
                  class="inline-icon"
                /> {{ compactCopy(document.summary, 92) }}
              </p>
              <a
                :href="documentDownloadHref(document)"
                :download="document.filename"
              >
                <UIcon
                  name="i-lucide-download"
                  class="link-icon"
                /> Download template
              </a>
            </article>
          </div>
        </section>

        <section
          id="help-directory"
          class="help-directory content-section section-directory"
        >
          <p class="section-label section-label--with-icon">
            <UIcon
              name="i-lucide-link-2"
              class="section-label-icon"
            />
            Free help links directory
          </p>
          <h2 class="title-with-icon">
            <UIcon
              name="i-lucide-layers-3"
              class="title-icon"
            /> Grouped by need
          </h2>
          <p class="section-subtitle">
            Showing top links in each group. Download the full directory if needed.
          </p>
          <a
            class="section-download-link"
            :href="helpDirectoryDownloadHref"
            download="full-free-help-directory.txt"
          >
            <UIcon
              name="i-lucide-download"
              class="link-icon"
            /> Download full free-help directory
          </a>

          <div class="directory-grid">
            <article
              v-for="group in groupedHelpResources"
              :key="group.group"
              class="directory-group"
            >
              <h3>
                <UIcon
                  name="i-lucide-folder-open"
                  class="title-icon"
                /> {{ group.group }}
              </h3>
              <p class="group-count">
                <UIcon
                  name="i-lucide-list"
                  class="inline-icon"
                /> Top {{ group.items.length }} of {{ group.total }} links
              </p>
              <ul>
                <li
                  v-for="resource in group.items"
                  :key="resource.id"
                >
                  <p class="resource-title">
                    <UIcon
                      name="i-lucide-link-2"
                      class="inline-icon"
                    /> {{ resource.title }}
                  </p>
                  <p class="resource-meta">
                    {{ compactCopy(resource.whoItHelps, 78) }}
                  </p>
                  <p
                    v-if="resource.phone"
                    class="resource-meta"
                  >
                    <UIcon
                      name="i-lucide-phone"
                      class="inline-icon"
                    /> Phone: {{ resource.phone }}
                  </p>
                  <a
                    :href="resource.url"
                    target="_blank"
                    rel="noopener"
                  >
                    {{ resource.urlLabel }} <UIcon
                      name="i-lucide-arrow-up-right"
                      class="link-icon"
                    />
                  </a>
                </li>
              </ul>
            </article>
          </div>
        </section>

        <section
          id="call-script"
          class="call-script-section content-section section-script"
        >
          <p class="section-label section-label--with-icon">
            <UIcon
              name="i-lucide-phone-call"
              class="section-label-icon"
            />
            Call support
          </p>
          <h2 class="title-with-icon">
            <UIcon
              name="i-lucide-messages-square"
              class="title-icon"
            /> Call script
          </h2>
          <p class="section-subtitle">
            Keep your call short and focused.
          </p>
          <article class="call-script-card">
            <p class="call-script-title">
              <UIcon
                name="i-lucide-clipboard-list"
                class="title-icon"
              /> Suggested script
            </p>
            <ol class="call-script-lines">
              <li
                v-for="line in supportCallScript"
                :key="line"
              >
                <UIcon
                  name="i-lucide-check-circle-2"
                  class="inline-icon"
                /> {{ line }}
              </li>
            </ol>
            <a
              class="section-download-link"
              :href="callScriptDownloadHref"
              download="call-script.txt"
            >
              <UIcon
                name="i-lucide-download"
                class="link-icon"
              /> Download call script
            </a>
          </article>
        </section>

        <section
          id="faq"
          class="faq-section content-section section-faq"
        >
          <p class="section-label section-label--with-icon">
            <UIcon
              name="i-lucide-circle-help"
              class="section-label-icon"
            />
            FAQ + disclaimers
          </p>
          <h2 class="title-with-icon">
            <UIcon
              name="i-lucide-help-circle"
              class="title-icon"
            /> Common questions
          </h2>

          <div class="faq-list">
            <details
              v-for="item in faqItems"
              :key="item.question"
            >
              <summary>
                <UIcon
                  name="i-lucide-circle-help"
                  class="inline-icon"
                /> {{ item.question }}
              </summary>
              <p>{{ item.answer }}</p>
            </details>
          </div>
        </section>

        <section class="footer-lines content-section section-footer">
          <a href="mailto:resources@billings.app?subject=Resource%20update">
            <UIcon
              name="i-lucide-mail"
              class="inline-icon"
            />
            Report broken link / suggest resource
          </a>
        </section>
      </div>
    </main>
  </div>
</template>

<style scoped>
.resources-page {
  --ink-soft: #4a4c5f;
  --line: #dde3eb;
  --line-strong: #cfd6df;
  --hero-a: #fdf1e5;
  --hero-b: #e6f4f4;
  --hero-c: #edf1ff;
  --accent-soft: #ebf1ff;
  --surface-card: #ffffff;
  --surface-card-soft: #f7f9fc;
  --surface-border: #d9e1ec;
  --surface-shadow: 0 12px 24px rgba(15, 28, 44, 0.09);
  --result-surface: #ffffff;
  --result-surface-soft: #f6f7f8;
  --result-line: #d9dde3;
  --result-text: #1f2428;
  --result-muted: #626a73;
  --result-link: #1f2428;
  --result-tone-highlight-a: #d7f0ff;
  --result-tone-highlight-b: #e4f8e8;
  --result-tone-doc-a: #efe3ff;
  --result-tone-doc-b: #ffe9ef;
  --result-tone-plan-a: #eef7ff;
  --result-tone-plan-b: #f5fff6;
  --result-tone-today-a: #dff4ff;
  --result-tone-today-b: #ebf9ff;
  --result-tone-week-a: #eaf7e2;
  --result-tone-week-b: #f3fde8;
  --result-tone-ongoing-a: #fff0d8;
  --result-tone-ongoing-b: #fff7e8;
  --section-help-a: #ffe9cf;
  --section-help-b: #fff6e8;
  --section-cf-a: #dff5f4;
  --section-cf-b: #effbfb;
  --section-conditions-a: #e6ecff;
  --section-conditions-b: #f1f4ff;
  --section-docs-a: #f5ebff;
  --section-docs-b: #faf4ff;
  --section-directory-a: #e4f9ed;
  --section-directory-b: #f0fdf5;
  --section-script-a: #ffe6eb;
  --section-script-b: #fff1f4;
  --section-faq-a: #f2f4f8;
  --section-faq-b: #f8f9fc;
  --section-footer-a: #e9eef6;
  --section-footer-b: #f3f6fb;
  min-height: 100vh;
  color: var(--ink);
  background: var(--alt-bg);
}

.page-shell {
  width: 100%;
  max-width: 1220px;
  margin-inline: auto;
  padding: 60px 24px 4rem;
  display: grid;
  gap: clamp(1.3rem, 2.2vw, 1.9rem);
}

.hero-transform {
  --hero-top-pad: clamp(1rem, 3vw, 2rem);
  --hero-inline-pad: clamp(1rem, 3vw, 2rem);
  --hero-available-height: calc(100svh - var(--layout-header-height, 69px) - var(--hero-top-pad));
  height: var(--hero-available-height);
  min-height: var(--hero-available-height);
  max-height: var(--hero-available-height);
  padding: var(--hero-top-pad) var(--hero-inline-pad);
  overflow: hidden;
}

.hero-layout {
  width: 100%;
  max-width: 1320px;
  margin-inline: auto;
  height: 100%;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(1.2rem, 2.8vw, 2.8rem);
}

.hero-copy {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  min-height: 0;
  height: 100%;
  overflow: hidden;
}

.hero-media {
  margin: 0;
  border-radius: 20px;
  overflow: hidden;
  height: 100%;
  background: linear-gradient(145deg, #d5dee9 0%, #f4f8fb 100%);
  box-shadow: 24px 24px 0px var(--muted);
}

.hero-media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-transform.is-result {
  height: auto;
  min-height: auto;
  max-height: none;
  padding-bottom: 0;
  overflow: visible;
}

.hero-transform.is-result .hero-layout {
  max-width: 1220px;
  grid-template-columns: 1fr;
}

.hero-transform.is-result .hero-copy {
  height: auto;
  min-height: auto;
  overflow: visible;
}

.content-section {
  margin: 0;
  padding: 0;
}

.content-section::before {
  content: '';
  display: block;
  width: 240px;
  height: 4px;
  border-radius: 999px;
  margin-bottom: 24px;
  background: var(--section-rule, #8b97b4);
}

.section-help { --section-rule: #c5862e; padding-top: 120px; }
.section-cf { --section-rule: #c5862e; padding-top: 120px;}
.section-conditions { --section-rule: #c5862e; padding-top: 120px;}
.section-docs { --section-rule: #c5862e;padding-top: 120px; }
.section-directory { --section-rule: #c5862e;padding-top: 120px; }
.section-script { --section-rule: #c5862e;padding-top: 120px; }
.section-faq { --section-rule: #c5862e;padding-top: 120px; }
.section-footer { --section-rule: #c5862e;padding-top: 120px; }

.wizard-state {
  margin-top: 0;
  max-width: 620px;
  height: 100%;
  max-height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.results-state {
  margin-top: 1.1rem;
  max-width: 620px;
}

.hero-transform.is-result .results-state {
  max-width: none;
  margin-top: 0;
}

.section-label {
  margin: 0;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 700;
  color: #4f5a78;
}

.section-label--with-icon {
  display: inline-flex;
  align-items: center;
  gap: 0.38rem;
}

.section-label-icon {
  font-size: 0.84rem;
}

.content-section .section-label {
  color: #44506d;
}

.title-with-icon {
  display: inline-flex;
  align-items: center;
  gap: 0.44rem;
}

.title-icon {
  font-size: 0.95em;
  opacity: 0.9;
}

.inline-icon {
  font-size: 0.9rem;
  margin-right: 0.22rem;
  vertical-align: -1px;
}

.link-icon {
  font-size: 0.9rem;
  margin-right: 0.18rem;
}

h1 {
  margin: 0.3rem 0 0;
  font-size: clamp(1.75rem, 4vw, 2.8rem);
  line-height: 1.1;
  color: var(--ink);
}

.section-subtitle {
  margin: 0.65rem 0 0;
  max-width: 760px;
  color: var(--muted);
  line-height: 1.5;
  font-size: 0.96rem;
}

.section-photo {
  margin: 0.95rem 0 0;
  display: block;
  width: min(100%, var(--section-photo-width, 100%));
  border-radius: 14px;
  overflow: hidden;
  box-shadow: var(--surface-shadow);
  background: #ffffff;
}

.section-photo img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.section-photo--wide {
  --section-photo-ratio: 17 / 8;
  --section-photo-width: 100%;
}

.section-photo--portrait {
  --section-photo-ratio: 4 / 5;
  --section-photo-width: min(100%, 360px);
}

.section-photo--square {
  --section-photo-ratio: 1 / 1;
  --section-photo-width: min(100%, 460px);
}

.section-photo--landscape {
  --section-photo-ratio: 16 / 9;
  --section-photo-width: min(100%, 920px);
}

.section-photo--help {
  border-color: color-mix(in oklab, var(--surface-border), #dca66a 22%);
}

.section-photo--cf {
  border-color: color-mix(in oklab, var(--surface-border), #7fc9c7 22%);
}

.section-photo--conditions {
  border-color: color-mix(in oklab, var(--surface-border), #8ea0e0 24%);
}

.section-photo--docs {
  border-color: color-mix(in oklab, var(--surface-border), #b99adb 24%);
}

.grid-photo-item {
  margin: 0;
  width: 100%;
  --section-photo-width: 100%;
}

.help-now-grid .grid-photo-item {
  grid-column: 1 / span 2;
  grid-row: 1 / span 2;
}

.docs-grid .grid-photo-item {
  grid-column: span 2;
}

.question-card {
  margin-top: 1.45rem;
  border: 0;
  border-radius: 0;
  padding: 0;
  background: transparent;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.question-step {
  margin: 0;
  font-size: 0.74rem;
  color: var(--muted);
  font-weight: 700;
}

.optional-badge {
  margin: 0.45rem 0 0;
  font-size: 0.75rem;
  color: #66708d;
}

.question-stage {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.question-fade-enter-active,
.question-fade-leave-active {
  transition: opacity 220ms ease;
}

.question-fade-enter-from,
.question-fade-leave-to {
  opacity: 0;
}

.options-grid {
  margin-top: 1rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.62rem;
  max-width: 560px;
  align-content: start;
}

.option-btn,
.primary-btn,
.ghost-btn,
.back-btn {
  border-radius: 11px;
  border: 1px solid transparent;
  font-weight: 650;
  line-height: 1.2;
  cursor: pointer;
}

.option-btn {
  text-align: left;
  border-color: var(--line-strong);
  background: var(--muted);
  color: var(--accent-contrast);
  padding: 0.88rem 0.92rem;
  transition: border-color 160ms ease, background-color 160ms ease, transform 160ms ease;
}

.option-btn:hover {
  border-color: var(--ink);
  background: #f7faff;
  transform: translateX(2px);
}

.state-input-wrap {
  margin-top: 1rem;
  max-width: 560px;
}

.state-input-wrap input {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 0.72rem 0.75rem;
  font: inherit;
  background: #ffffff;
  color: var(--accent-contrast);
  font-size: var(--fs-brand);
}

.state-input-wrap input:focus {
  outline: none;
}

.state-actions {
  margin-top: 0.72rem;
  display: flex;
  gap: 0.5rem;
}

.primary-btn {
  background: var(--accent);
  color: var(--accent-contrast);
  padding: 0.67rem 0.92rem;
}

.ghost-btn,
.back-btn {
  border-color: var(--muted);
  color: var(--muted);
  padding: 0.67rem 0.92rem;
}

.back-btn {
  margin-top: auto;
  width: fit-content;
}

.back-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.condition-card ul,
.directory-group ul {
  margin: 0.65rem 0 0;
  padding-left: 1.1rem;
}

.condition-card li,
.directory-group li {
  margin-bottom: 0.48rem;
  line-height: 1.4;
  color: var(--ink-soft);
}

.content-section h2 {
  margin: 0.2rem 0 0;
  font-size: var(--theme-font-size-heading-md);
  line-height: 1.03;
}

.results-state {
  color: var(--result-text);
  margin-top: 0.9rem;
  max-width: none;
}

.result-card-label {
  margin: 0;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 700;
  color: var(--result-muted);
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.result-label-icon {
  font-size: 0.82rem;
  opacity: 0.88;
}

.result-simple-grid {
  margin-top: 1rem;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
}

.result-simple-card,
.result-panel {
  border: 1px solid var(--result-line);
  border-radius: 18px;
  padding: 1.05rem;
  box-shadow: var(--surface-shadow);
}

.result-simple-card {
  background: linear-gradient(
    145deg,
    var(--result-tone-highlight-a),
    var(--result-tone-highlight-b)
  );
}

.result-simple-card--document {
  background: linear-gradient(
    145deg,
    var(--result-tone-doc-a),
    var(--result-tone-doc-b)
  );
}

.result-simple-card h2 {
  margin: 0.56rem 0 0;
  font-size: var(--theme-font-size-heading-md);
  line-height: 1.03;
  color: var(--result-text);
}

.results-state .resource-meta {
  margin: 0.42rem 0 0;
  color: var(--result-muted);
  font-size: 0.84rem;
  line-height: 1.4;
}

.result-simple-card a {
  display: inline-flex;
  align-items: center;
  gap: 0.28rem;
  margin-top: 0.72rem;
  color: var(--result-link);
  font-size: 0.82rem;
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.result-panel {
  margin-top: 0.9rem;
  background: var(--result-surface);
}

.result-panel--plan {
  border-color: color-mix(in oklab, var(--result-line), #bdd8f7 22%);
  background: linear-gradient(140deg, var(--result-tone-plan-a), var(--result-tone-plan-b));
}

.plan-columns {
  margin-top: 0.84rem;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.72rem;
}

.plan-block {
  border: 1px solid color-mix(in oklab, var(--result-line), #ffffff 26%);
  border-radius: 14px;
  padding: 0.78rem;
  box-shadow: 0 6px 14px rgba(15, 28, 44, 0.05);
}

.plan-block:nth-child(1) {
  background: linear-gradient(145deg, var(--result-tone-today-a), var(--result-tone-today-b));
}

.plan-block:nth-child(2) {
  background: linear-gradient(145deg, var(--result-tone-week-a), var(--result-tone-week-b));
}

.plan-block:nth-child(3) {
  background: linear-gradient(145deg, var(--result-tone-ongoing-a), var(--result-tone-ongoing-b));
}

.plan-block h4 {
  margin: 0;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #374360;
}

.mini-heading {
  display: inline-flex;
  align-items: center;
  gap: 0.32rem;
}

.mini-heading-icon {
  font-size: 0.82rem;
}

.plan-block ul {
  margin: 0.62rem 0 0;
  padding-left: 1rem;
}

.plan-block li {
  margin-bottom: 0.56rem;
  color: #2b3342;
  line-height: 1.4;
}

.plan-download-link {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  margin-top: 0.8rem;
  font-size: 0.84rem;
  font-weight: 700;
  color: #253a63;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.result-panel--resources {
  border-color: color-mix(in oklab, var(--result-line), #c5d7e6 18%);
  background: linear-gradient(150deg, #ffffff, #f5f9ff);
}

.results-state .resource-list {
  list-style: none;
  padding: 0;
  margin: 0.74rem 0 0;
}

.results-state .resource-list li {
  border: 1px solid var(--result-line);
  border-radius: 12px;
  background: var(--result-surface-soft);
  padding: 0.8rem;
  margin-bottom: 0.58rem;
  display: flex;
  gap: 0.72rem;
  justify-content: space-between;
  align-items: flex-start;
  box-shadow: 0 6px 14px rgba(15, 28, 44, 0.05);
}

.results-state .resource-title {
  margin: 0;
  font-weight: 680;
  color: var(--result-text);
  line-height: 1.35;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.result-inline-icon {
  font-size: 0.86rem;
  color: var(--result-muted);
}

.results-state .resource-list a {
  display: inline-flex;
  align-items: center;
  gap: 0.28rem;
  margin-top: 0;
  color: var(--result-link);
  text-decoration: underline;
  text-underline-offset: 2px;
  font-size: 0.8rem;
  font-weight: 700;
}

.resource-list a,
.doc-card a,
.directory-group a,
.cf-spotlight a,
.condition-links a {
  display: flex;
  margin-top: 0.45rem;
  font-size: 0.84rem;
  font-weight: 700;
  color: var(--accent);
  text-decoration: none;
  align-items: anchor-center;
  column-gap: 0.5rem;
  row-gap: 0.5rem;
  text-decoration: underline;
  text-underline-offset: 0.5em;
}

.cf-spotlight a {
  margin-top: 1rem;
}
.result-controls {
  margin-top: 1rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.62rem;
}

.result-controls button {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.section-download-link {
  display: inline-flex;
  align-items: center;
  gap: 0.28rem;
  margin-top: 0.75rem;
  font-size: 0.84rem;
  font-weight: 700;
  color: #304063;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.call-script-card {
  margin-top: 0.95rem;
  border: 1px solid color-mix(in oklab, var(--surface-border), #f0a6b4 18%);
  border-radius: 14px;
  background: linear-gradient(145deg, var(--section-script-a), var(--section-script-b));
  padding: 0.96rem;
  box-shadow: var(--surface-shadow);
}

.call-script-title {
  margin: 0;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #5b6483;
}

.call-script-lines {
  margin: 0.62rem 0 0;
  padding-left: 1.1rem;
}

.call-script-lines li {
  margin-bottom: 0.48rem;
  line-height: 1.42;
  color: var(--ink-soft);
  display: flex;
  align-items: flex-start;
  gap: 0.26rem;
}

.call-script-card .section-download-link {
  margin-top: 0.35rem;
}

.help-now > p,
.doc-meta,
.doc-tags {
  margin: 0.6rem 0 0;
  color: var(--muted);
  font-size: var(--fs-brand);
}

.help-now-grid {
  margin-top: 0.95rem;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.72rem;
}

.help-now-grid a {
  text-decoration: none;
  /* border: 1px solid
  color-mix(in oklab, var(--surface-border), #e8c88f 18%); */
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  padding: 0.9rem;
  background: #b84a4a;
  color: #ffffff;
  font-weight: 700;
  line-height: 1.35;
  min-height: 92px;
  text-align: center;
  font-size: 1.1rem;
  box-shadow: var(--surface-shadow);
  transition: transform 160ms ease, box-shadow 160ms ease;
}

.help-now-grid a:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 28px rgba(15, 28, 44, 0.12);
}

.spotlight-grid {
  margin-top: 0.95rem;
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  gap: 0.72rem;
}

.spotlight-grid article {
    border-radius: 14px;
    background: #3c2851;
    padding: 1.5rem;
    grid-column: 1 / span 4;
}

.spotlight-grid .grid-photo-item {
    grid-column: 5 / span 4;
    grid-row: 1 / span 3;
}

.spotlight-grid h3,
.condition-card h3,
.doc-card h3,
.directory-group h3 {
  margin: 0;
  font-size: 2rem;
  line-height: 1.28;
}

.spotlight-grid ul,
.spotlight-grid p {
  margin: 0.64rem 0 0;
  color: var(--muted);
  line-height: 1.5;
}

.inline-downloads {
  margin-top: 0.62rem;
  display: grid;
  gap: 0.75rem;
}

.inline-downloads a {
  margin-top: 0;
  font-size: 0.84rem;
  text-decoration: underline;
}

.conditions-grid {
  margin-top: 0.95rem;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.82rem;
}

.condition-card {
  border-radius: 14px;
  padding: 0.95rem;
  background: #366199;
}

.card-summary {
  margin: 0.52rem 0 0;
  color: var(--ink-soft);
  line-height: 1.5;
}

.condition-card p {
  margin: 0.52rem 0 0;
  color: var(--muted);
  line-height: 1.5;
}

.condition-impact {
  font-size: 0.9rem;
}

.condition-action-list {
  margin: 0.62rem 0 0;
  padding-left: 1rem;
}

.condition-action-list li {
  margin-bottom: 0.5rem;
  color: #2f3a4d;
  line-height: 1.42;
  font-size: 0.9rem;
}

.condition-stat {
  margin-top: 0.62rem;
  font-size: 0.86rem;
}

.condition-links {
  margin-top: 0.7rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.filter-row {
  margin-top: 0.95rem;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.82rem;
}

.filter-row > div {
  padding: 0;
}

.filter-label {
  margin: 0;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #5b6483;
}

.filter-chip-row {
  margin-top: 0.45rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.42rem;
}

.filter-chip {
  border: 1px solid var(--line);
  border-radius: 999px;
  background: #ffffff;
  color: #4d5573;
  font-size: 0.8rem;
  font-weight: 650;
  padding: 0.34rem 0.58rem;
  cursor: pointer;
}

.filter-chip.is-active {
  border-color: var(--accent);
  background: var(--accent-soft);
  color: var(--accent);
}

.docs-grid {
  margin-top: 0.95rem;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.82rem;
}

.doc-card {
  border: 1px solid color-mix(in oklab, var(--surface-border), #c9aaf6 16%);
  border-radius: 14px;
  padding: 0.9rem;
  background: linear-gradient(145deg, var(--section-docs-a), var(--section-docs-b));
  box-shadow: var(--surface-shadow);
}

.doc-card p,
.directory-group p {
  margin: 0.5rem 0 0;
  color: var(--muted);
  line-height: 1.42;
}

.doc-card p {
  font-size: 0.9rem;
}

.directory-grid {
  margin-top: 0.95rem;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.82rem;
}

.directory-group {
  border: 1px solid color-mix(in oklab, var(--surface-border), #9fddb2 20%);
  border-radius: 14px;
  padding: 0.9rem;
  background: linear-gradient(145deg, var(--section-directory-a), var(--section-directory-b));
  box-shadow: var(--surface-shadow);
}

.directory-group ul {
  list-style: none;
  margin: 0.72rem 0 0;
  padding: 0;
}

.group-count {
  margin: 0.46rem 0 0;
  font-size: 0.78rem;
  color: #4b5f4b;
  font-weight: 700;
}

.directory-group li {
  border: 1px solid color-mix(in oklab, var(--surface-border), #9fddb2 10%);
  border-radius: 12px;
  padding: 0.72rem;
  margin-bottom: 0.62rem;
  background: rgba(255, 255, 255, 0.64);
}

.faq-list {
  margin-top: 0.95rem;
  display: grid;
  gap: 0.62rem;
}

.faq-list details {
  border: 1px solid color-mix(in oklab, var(--surface-border), #bcc4d4 18%);
  border-radius: 12px;
  padding: 0.75rem 0.86rem;
  background: linear-gradient(145deg, var(--section-faq-a), var(--section-faq-b));
  box-shadow: 0 8px 16px rgba(15, 28, 44, 0.06);
}

.faq-list summary {
  cursor: pointer;
  font-weight: 700;
  color: #263246;
}

.faq-list p {
  margin: 0.62rem 0 0;
  color: var(--muted);
  line-height: 1.5;
}

.footer-lines {
  display: flex;
  align-items: center;
}

.footer-lines a {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  margin: 0;
  text-decoration: none;
  font-weight: 700;
  color: #2b3447;
  line-height: 1.45;
  font-size: 0.9rem;
}

@media (max-width: 1100px) {
  .results-state .resource-list li {
    flex-direction: column;
    align-items: flex-start;
  }

  .help-now-grid,
  .spotlight-grid,
  .docs-grid,
  .directory-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .conditions-grid {
    grid-template-columns: 1fr;
  }

  .help-now-grid .grid-photo-item {
    grid-column: 1 / -1;
    grid-row: auto;
  }

  .spotlight-grid article,
  .spotlight-grid .grid-photo-item {
    grid-column: 1 / -1;
    grid-row: auto;
  }

  .footer-lines {
    align-items: flex-start;
  }
}

@media (max-width: 900px) {
  .hero-transform {
    height: auto;
    min-height: auto;
    max-height: none;
    padding: 1rem 24px;
    overflow: visible;
  }

  .hero-layout {
    max-width: 1220px;
    grid-template-columns: 1fr;
  }

  .hero-copy {
    height: auto;
    min-height: auto;
    overflow: visible;
  }

  .wizard-state {
    height: auto;
    max-height: none;
  }

  .hero-media {
    min-height: clamp(320px, 58vh, 480px);
    max-width: 780px;
    margin-inline: auto;
  }
}

@media (max-width: 768px) {
  .hero-transform {
    padding: 0.9rem 16px;
  }

  .hero-media {
    min-height: 300px;
    border-radius: 14px;
  }

  .page-shell {
    padding: 0.9rem 16px 3.2rem;
  }

  .help-now-grid,
  .spotlight-grid,
  .docs-grid,
  .directory-grid,
  .filter-row,
  .options-grid {
    grid-template-columns: 1fr;
  }

  .result-simple-grid,
  .plan-columns {
    grid-template-columns: 1fr;
  }

  .result-simple-card,
  .result-panel {
    padding: 0.82rem;
  }

  h1 {
    font-size: clamp(1.45rem, 7vw, 2rem);
    line-height: 1.16;
  }

  .content-section h2 {
    font-size: 1.22rem;
  }

  .section-subtitle {
    font-size: 0.92rem;
    line-height: 1.45;
  }

  .section-photo {
    width: 100%;
    --section-photo-width: 100%;
  }

  .section-photo--wide,
  .section-photo--landscape {
    --section-photo-ratio: 16 / 9;
  }

  .section-photo--portrait,
  .section-photo--square {
    --section-photo-ratio: 4 / 3;
  }

  .help-now-grid .grid-photo-item,
  .docs-grid .grid-photo-item {
    grid-column: auto;
    grid-row: auto;
  }

  .help-now-grid a {
    min-height: auto;
  }

  .condition-action-list li,
  .doc-card p,
  .results-state .resource-meta {
    font-size: 0.88rem;
  }

  .result-controls {
    gap: 0.45rem;
  }

  .result-controls button {
    width: 100%;
  }

  .footer-lines {
    justify-content: flex-start;
  }
}
</style>
