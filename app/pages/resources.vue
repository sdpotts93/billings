<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'

import { createPdfBytes } from '../utils/pdf.js'

type QuestionId = 'need' | 'condition' | 'insurance' | 'barrier' | 'format'
type RouteKey = 'emergency' | 'uninsured' | 'meds' | 'bills' | 'care' | 'caregiver'

type Option = {
  label: string
  value: string
}

type WizardQuestion = {
  id: QuestionId
  prompt: string
  optional?: boolean
  options: Option[]
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
    prompt: 'What do you want help with today?',
    options: [
      { label: 'Emergency / crisis (911 / 988)', value: 'emergency' },
      { label: 'Finding care (clinics, appointments, specialists)', value: 'finding-care' },
      { label: 'Prescription costs / paying for meds', value: 'meds' },
      { label: 'Medical bills, debt, or collections', value: 'bills' },
      { label: 'Insurance / coverage problems (including uninsured)', value: 'insurance' },
      { label: 'Understanding a diagnosis and next steps', value: 'diagnosis' },
      { label: 'Helping someone else (caregiver)', value: 'caregiver' }
    ]
  },
  {
    id: 'condition',
    prompt: 'Want condition-specific resources too? (optional)',
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
    prompt: 'What’s your insurance right now?',
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
    prompt: 'Biggest barrier right now',
    options: [
      { label: 'Med costs', value: 'med-costs' },
      { label: 'Visit / test costs', value: 'visit-costs' },
      { label: 'Bills / debt', value: 'bills-debt' },
      { label: 'Transportation', value: 'transportation' },
      { label: 'Finding specialists', value: 'specialists' },
      { label: 'Paperwork / denials / appeals', value: 'denials' },
      { label: 'Not sure / multiple things', value: 'not-sure' }
    ]
  },
  {
    id: 'format',
    prompt: 'How do you want help right now?',
    options: [
      { label: 'Call someone / talk to a human', value: 'call-now' },
      { label: 'Checklist I can follow', value: 'checklist' },
      { label: 'Download PDFs', value: 'download' },
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
    title: 'Emergency or urgent symptoms',
    summary: 'Immediate safety first, then follow-up and documentation so you do not have to start over.',
    doToday: [
      'If this might be life-threatening, call 911 or go to the nearest ER now.',
      'If this is a mental health crisis, call or text 988 for immediate support.',
      'If you can, bring (or screenshot) your med list, allergies, and recent symptoms. Ask for written discharge instructions.'
    ],
    thisWeek: [
      'Schedule follow-up with primary care or a specialist and ask what to do if symptoms return.',
      'Request copies of imaging, labs, and visit notes (paper copy or portal download).',
      'Start a simple timeline: when symptoms started, what changed, and what helped.'
    ],
    ongoing: [
      'Keep a medical file: diagnoses, meds, labs, visits, bills, and insurer letters.',
      'Track triggers and warning signs between visits.',
      'Keep emergency contacts and your med list up to date.'
    ],
    resourceIds: ['emergency-911', 'crisis-988', 'help-211', 'findcare', 'paf'],
    documentIds: ['visit-prep', 'insurer-call-log', 'bill-review', 'financial-assistance']
  },
  uninsured: {
    key: 'uninsured',
    title: 'Insurance problems or uninsured',
    summary: 'Get coverage moving and protect your appeal rights with documented calls.',
    doToday: [
      'Check Medicaid and Marketplace eligibility based on your state and household.',
      'Gather basics: household size, income estimate, current coverage status, and any denial letters.',
      'Start a call log before contacting assisters, providers, or plans.'
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
    title: 'Prescription costs / paying for meds',
    summary: 'Lower costs now and prevent gaps from prior authorization delays.',
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
    resourceIds: ['needymeds', 'rxassist', 'paf', 'help-211', 'healthcare-gov'],
    documentIds: ['rx-affordability', 'prior-auth', 'appeal-template', 'insurer-call-log']
  },
  bills: {
    key: 'bills',
    title: 'Medical bills, debt, or collections',
    summary: 'Verify charges, apply for assistance, then negotiate a plan you can actually keep.',
    doToday: [
      'Request an itemized bill and compare it to your EOB (Explanation of Benefits).',
      'Ask for financial assistance / charity care and the application steps and deadlines.',
      'If you need a plan, ask for a zero-interest payment plan and get it in writing.'
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
    resourceIds: ['paf', 'findhelp', 'no-surprises', 'help-211', 'healthcare-gov'],
    documentIds: ['bill-review', 'payment-plan-script', 'financial-assistance', 'insurer-call-log']
  },
  care: {
    key: 'care',
    title: 'Finding care and specialists',
    summary: 'Find the right clinic, then reduce wasted visits with good records and clear questions.',
    doToday: [
      'Identify the next appointment you need (primary care, specialist, clinic) and what you want from it.',
      'If insured, ask for an in-network directory. If uninsured, start with HRSA or free/charitable clinics.',
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
    resourceIds: ['findcare', 'nafc-clinics', 'help-211', 'findhelp', 'paf'],
    documentIds: ['visit-prep', 'insurer-call-log', 'appeal-template', 'rx-affordability']
  },
  caregiver: {
    key: 'caregiver',
    title: 'Caregiver support',
    summary: 'Make the next week sustainable: clarify roles, permissions, and a backup plan.',
    doToday: [
      'List top three daily needs and who can help with each one.',
      'Ask clinic social work about caregiver resources and respite options.',
      'Create an emergency contact and medication snapshot.'
    ],
    thisWeek: [
      'Complete permission paperwork (HIPAA release / caregiver authorization) so you can speak with providers.',
      'Set up a simple system for appointments, refills, and symptom notes.',
      'Identify backup caregivers for high-risk or exhausting days.'
    ],
    ongoing: [
      'Protect caregiver capacity with planned breaks and support groups.',
      'Track costs and work impacts to plan financial support.',
      'Reassess care level as needs change.'
    ],
    resourceIds: ['caregiver-action', 'family-caregiver-alliance', 'help-211', 'findhelp', 'paf'],
    documentIds: ['caregiver-starter', 'visit-prep', 'insurer-call-log', 'financial-assistance']
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
    resourceIds: ['alz-helpline', 'nia-dementia-caregiving', 'family-caregiver-alliance'],
    documentIds: ['dementia-cost-tracker']
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
    whoItHelps: 'People with cystic fibrosis and caregivers who need support with coverage and daily care logistics.',
    phone: '844-266-7277',
    url: 'https://www.cff.org/support/get-help-cf-foundation-compass',
    urlLabel: 'CF Foundation Compass',
    group: 'CF-specific support',
    needRoutes: ['meds', 'care', 'caregiver', 'uninsured'],
    conditionTags: ['cf']
  },
  {
    id: 'cflf',
    title: 'CF Lifestyle Foundation',
    whoItHelps: 'People with CF looking for practical support and community resources.',
    url: 'https://www.cflf.org',
    urlLabel: 'CF Lifestyle Foundation',
    group: 'CF-specific support',
    needRoutes: ['care', 'caregiver', 'meds'],
    conditionTags: ['cf']
  },
  {
    id: 'healthcare-gov',
    title: 'HealthCare.gov',
    whoItHelps: 'People comparing Marketplace plans, deadlines, and subsidy options.',
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
    title: 'Medicare rights and savings',
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
    id: 'no-surprises',
    title: 'No Surprises billing protections (CMS)',
    whoItHelps: 'People who received an unexpected out-of-network bill in the U.S.',
    url: 'https://www.cms.gov/nosurprises',
    urlLabel: 'CMS No Surprises',
    group: 'Bills and debt',
    needRoutes: ['bills'],
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
    id: 'rxassist',
    title: 'RxAssist',
    whoItHelps: 'People finding patient assistance programs for medications.',
    url: 'https://www.rxassist.org',
    urlLabel: 'RxAssist',
    group: 'Medication affordability',
    needRoutes: ['meds'],
    conditionTags: ['any']
  },
  {
    id: 'findcare',
    title: 'Find a health center (HRSA)',
    whoItHelps: 'People looking for community health centers and lower-cost primary care.',
    url: 'https://findahealthcenter.hrsa.gov',
    urlLabel: 'HRSA health center finder',
    group: 'Care and specialists',
    needRoutes: ['care', 'uninsured', 'bills', 'emergency'],
    conditionTags: ['any']
  },
  {
    id: 'nafc-clinics',
    title: 'Find a free or charitable clinic',
    whoItHelps: 'People seeking local low-cost clinics and specialty referrals.',
    url: 'https://nafcclinics.org/find-clinic',
    urlLabel: 'NAFC clinic finder',
    group: 'Care and specialists',
    needRoutes: ['care', 'uninsured', 'bills'],
    conditionTags: ['any']
  },
  {
    id: 'alz-helpline',
    title: 'Alzheimer’s Association 24/7',
    whoItHelps: 'Families and caregivers supporting people with dementia.',
    phone: '800-272-3900',
    url: 'https://www.alz.org/help-support/resources/helpline',
    urlLabel: 'Alzheimer’s Helpline',
    group: 'Dementia support',
    needRoutes: ['caregiver', 'care'],
    conditionTags: ['dementia']
  },
  {
    id: 'nia-dementia-caregiving',
    title: 'NIA Alzheimer’s caregiving resources',
    whoItHelps: 'Families caring for someone with dementia who need practical guidance.',
    url: 'https://www.nia.nih.gov/health/alzheimers/caregiving',
    urlLabel: 'NIA caregiving resources',
    group: 'Dementia support',
    needRoutes: ['caregiver', 'care'],
    conditionTags: ['dementia']
  },
  {
    id: 'caregiver-action',
    title: 'Caregiver Action Network',
    whoItHelps: 'Caregivers needing practical planning and peer support resources.',
    url: 'https://www.caregiveraction.org',
    urlLabel: 'Caregiver Action Network',
    group: 'Caregiver support',
    needRoutes: ['caregiver'],
    conditionTags: ['dementia', 'any']
  },
  {
    id: 'family-caregiver-alliance',
    title: 'Family Caregiver Alliance',
    whoItHelps: 'Family caregivers needing planning tools, education, and support.',
    url: 'https://www.caregiver.org',
    urlLabel: 'Family Caregiver Alliance',
    group: 'Caregiver support',
    needRoutes: ['caregiver', 'care'],
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
    whoItHelps: 'People with diabetes managing meds, supplies, and long-term care costs.',
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
    filename: 'medical-bill-review-checklist.pdf'
  },
  {
    id: 'financial-assistance',
    title: 'Financial assistance / charity care checklist',
    whoItHelps: 'People applying for hospital assistance programs.',
    summary: 'Required documents, deadlines, and follow-up call structure.',
    topicTags: ['insurance', 'bills-debt'],
    conditionTags: ['any'],
    filename: 'financial-assistance-checklist.pdf'
  },
  {
    id: 'payment-plan-script',
    title: 'Payment plan negotiation script',
    whoItHelps: 'People negotiating affordable repayment terms.',
    summary: 'How to request zero-interest plans and written agreements.',
    topicTags: ['bills-debt'],
    conditionTags: ['any'],
    filename: 'payment-plan-negotiation-script.pdf'
  },
  {
    id: 'appeal-template',
    title: 'Insurance appeal template',
    whoItHelps: 'People responding to denials for visits, tests, or treatment.',
    summary: 'Appeal checklist with reason-code, evidence, and deadline sections.',
    topicTags: ['insurance', 'prior-auth'],
    conditionTags: ['any'],
    filename: 'insurance-appeal-template.pdf'
  },
  {
    id: 'prior-auth',
    title: 'Prior authorization checklist',
    whoItHelps: 'People waiting on specialty medication approvals.',
    summary: 'Documents, call cadence, and escalation points for authorization delays.',
    topicTags: ['meds', 'prior-auth'],
    conditionTags: ['any'],
    filename: 'prior-authorization-checklist.pdf'
  },
  {
    id: 'insurer-call-log',
    title: 'Talking to your insurer call log',
    whoItHelps: 'People tracking calls, reference numbers, and next steps.',
    summary: 'Structured call log for denials, billing questions, and coverage checks.',
    topicTags: ['insurance', 'bills-debt'],
    conditionTags: ['any'],
    filename: 'insurer-call-log-template.pdf'
  },
  {
    id: 'visit-prep',
    title: 'Specialist visit prep worksheet',
    whoItHelps: 'People preparing for specialist appointments.',
    summary: 'Symptom timeline, meds list, questions, and treatment goal prompts.',
    topicTags: ['visit-prep'],
    conditionTags: ['any'],
    filename: 'specialist-visit-prep-worksheet.pdf'
  },
  {
    id: 'rx-affordability',
    title: 'Prescription affordability checklist',
    whoItHelps: 'People comparing generic, formulary, and 90-day options.',
    summary: 'Medication cost comparison and refill strategy worksheet.',
    topicTags: ['meds'],
    conditionTags: ['any'],
    filename: 'prescription-affordability-checklist.pdf'
  },
  {
    id: 'caregiver-starter',
    title: 'Caregiver starter kit',
    whoItHelps: 'Caregivers organizing permissions and emergency planning.',
    summary: 'Provider permission checklist, med list template, and emergency plan.',
    topicTags: ['caregiver'],
    conditionTags: ['dementia', 'any'],
    filename: 'caregiver-starter-kit.pdf'
  },
  {
    id: 'dementia-cost-tracker',
    title: 'Dementia caregiver cost tracker',
    whoItHelps: 'Families tracking dementia-related caregiving and respite costs.',
    summary: 'Monthly cost tracker plus respite planning prompts.',
    topicTags: ['caregiver', 'disability-work'],
    conditionTags: ['dementia'],
    filename: 'dementia-caregiver-cost-tracker.pdf'
  },
  {
    id: 'cf-coverage-continuity',
    title: 'CF coverage continuity checklist',
    whoItHelps: 'People with CF managing PA renewals and specialty pharmacy steps.',
    summary: 'Renewal dates, pharmacy tasks, and escalation triggers.',
    topicTags: ['cf', 'prior-auth', 'meds'],
    conditionTags: ['cf'],
    filename: 'cf-coverage-continuity-checklist.pdf'
  },
  {
    id: 'compass-one-pager',
    title: 'CF Compass one-pager',
    whoItHelps: 'People needing a quick CF Foundation Compass contact guide.',
    summary: 'Compass scope, call prep, and handoff checklist for care teams.',
    topicTags: ['cf', 'insurance', 'caregiver'],
    conditionTags: ['cf'],
    filename: 'cf-compass-one-pager.pdf'
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
    answer: 'No. This page is for navigation and cost support, not medical diagnosis or treatment. For emergencies call 911; for a mental health crisis call or text 988.'
  },
  {
    question: 'Do you store my answers?',
    answer: 'We do not save your wizard answers or personal health information. Your selections stay in your browser. If you sign up for updates, we collect your email address so we can contact you, but we do not attach your answers.'
  },
  {
    question: 'What if I’m uninsured?',
    answer: 'Check Medicaid and Marketplace (ACA) eligibility for your state. If you need care while coverage is in progress, start with an HRSA health center (FQHC) or a free/charitable clinic, ask about sliding-scale fees, and call 211 for local help.'
  },
  {
    question: 'What if I can’t afford my meds?',
    answer: 'Ask the pharmacy about the lowest-cost clinically appropriate option (generic, biosimilar, formulary alternative, 90-day). Ask your clinician for prior authorization help and check patient assistance programs. If you are rationing a critical medication, contact your care team right away.'
  },
  {
    question: 'How do I fight a denial?',
    answer: 'Ask for the denial reason (and reason code), the appeal deadline, and appeal instructions in writing. Submit your appeal before the deadline with supporting records and keep proof of submission. If the situation is urgent, ask about an expedited review.'
  },
  {
    question: 'What should I do about medical debt?',
    answer: 'Request an itemized bill and, if insured, match it to your EOB before paying. Ask about charity care/financial assistance and negotiate a zero-interest payment plan in writing. If you are disputing a bill, ask billing/collections to pause while the review is pending.'
  }
]

const answers = reactive<Record<QuestionId, string>>({
  need: '',
  condition: '',
  insurance: '',
  barrier: '',
  format: ''
})

const questionIndex = ref(0)
const result = ref<GeneratedResult | null>(null)
const activeTopicFilter = ref('all')
const route = useRoute()

const updatesEmail = ref('')
const updatesStatus = ref<'idle' | 'sending' | 'success' | 'error'>('idle')
const updatesError = ref('')
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const submitUpdatesEmail = async () => {
  const email = updatesEmail.value.trim()
  updatesError.value = ''

  if (!email || !EMAIL_PATTERN.test(email)) {
    updatesStatus.value = 'error'
    updatesError.value = 'Enter a valid email address.'
    return
  }

  updatesStatus.value = 'sending'
  try {
    await $fetch('/api/resources-email', {
      method: 'POST',
      body: { email }
    })
    updatesStatus.value = 'success'
  } catch (error) {
    updatesStatus.value = 'error'
    updatesError.value = 'Could not submit email right now. Please try again later.'
    console.error('Could not submit updates email.', error)
  }
}

const resetUpdatesForm = () => {
  if (updatesStatus.value !== 'sending') {
    updatesStatus.value = 'idle'
  }
  updatesError.value = ''
}

const needQuestion = wizardQuestions.find(question => question.id === 'need')
const validNeedValues = new Set((needQuestion?.options ?? []).map(option => option.value))
const queryNeedValue = Array.isArray(route.query.need) ? route.query.need[0] : route.query.need

if (typeof queryNeedValue === 'string' && validNeedValues.has(queryNeedValue)) {
  answers.need = queryNeedValue
  questionIndex.value = wizardQuestions.length > 1 ? 1 : 0
}

const fallbackQuestion: WizardQuestion = {
  id: 'need',
  prompt: 'What do you want help with today?',
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

    return topicMatch
  })
})

const groupedHelpResources = computed(() => {
  const groups = [...new Set(helpResources.map(resource => resource.group))]

  return groups.map((group) => {
    const groupedItems = helpResources.filter(resource => resource.group === group)

    return {
      group,
      total: groupedItems.length,
      items: groupedItems
    }
  })
})

const expandedDirectoryGroups = reactive<Record<string, boolean>>({})
const directoryPreviewLimit = 2

const isDirectoryGroupExpanded = (group: string) => {
  return Boolean(expandedDirectoryGroups[group])
}

const visibleDirectoryResources = (group: { group: string, items: ResourceItem[] }) => {
  if (isDirectoryGroupExpanded(group.group)) {
    return group.items
  }

  return group.items.slice(0, directoryPreviewLimit)
}

const directoryHiddenCount = (group: { items: ResourceItem[] }) => {
  return Math.max(group.items.length - directoryPreviewLimit, 0)
}

const directoryExpandLabel = (group: { group: string, items: ResourceItem[] }) => {
  if (isDirectoryGroupExpanded(group.group)) {
    return 'Show less'
  }

  const hiddenCount = directoryHiddenCount(group)
  const suffix = hiddenCount === 1 ? 'link' : 'links'
  return `Show ${hiddenCount} more ${suffix}`
}

const toggleDirectoryGroup = (group: string) => {
  expandedDirectoryGroups[group] = !isDirectoryGroupExpanded(group)
}

const directoryLayoutOrder = [
  'Condition foundations',
  'Insurance and coverage',
  'Urgent and crisis',
  'CF-specific support',
  'Bills and debt',
  'Care and specialists',
  'Medication affordability',
  'Caregiver support',
  'Dementia support'
]

const directoryOrderByGroup = new Map(directoryLayoutOrder.map((group, index) => [group, index]))

const orderedGroupedHelpResources = computed(() => {
  return groupedHelpResources.value.slice().sort((leftGroup, rightGroup) => {
    const leftOrder = directoryOrderByGroup.get(leftGroup.group) ?? Number.MAX_SAFE_INTEGER
    const rightOrder = directoryOrderByGroup.get(rightGroup.group) ?? Number.MAX_SAFE_INTEGER

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder
    }

    return leftGroup.group.localeCompare(rightGroup.group)
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
  const question = wizardQuestions.find(item => item.id === questionId)

  return question?.options.find(option => option.value === value)?.label ?? value
}

const resultHeading = computed(() => {
  if (!result.value) {
    return 'Find your next step'
  }

  const formatLabel = findOptionLabel('format', answers.format)
  const formatFragment = formatLabel ? ` (${formatLabel})` : ''

  return `${result.value.routeTitle}${formatFragment}`
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

const digitsOnly = (value: string) => {
  return value.replace(/\D+/g, '')
}

const shouldShowDirectoryPhone = (resource: ResourceItem) => {
  if (!resource.phone) {
    return false
  }

  const phoneDigits = digitsOnly(resource.phone)

  if (!phoneDigits) {
    return true
  }

  const linkDigits = digitsOnly(resource.urlLabel)

  return !linkDigits.includes(phoneDigits)
}

const toTelHref = (phone: string) => {
  const normalized = digitsOnly(phone)
  return normalized ? `tel:${normalized}` : `tel:${phone}`
}

const isCallLink = (url: string) => {
  return url.trim().toLowerCase().startsWith('tel:')
}

const toSlug = (text: string) => {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

const mergePlanItems = (base: string[], additions: Array<string | undefined>) => {
  const prioritized = additions.filter((item): item is string => Boolean(item))
  const merged = dedupe([...prioritized, ...base])
  return merged.slice(0, 3)
}

const hasMeaningfulAnswer = (value: string) => {
  return Boolean(value && value !== 'not-sure')
}

const formatSummary = (routeTitle: string) => {
  const details: string[] = []

  if (hasMeaningfulAnswer(answers.insurance)) {
    details.push(findOptionLabel('insurance', answers.insurance))
  }

  if (hasMeaningfulAnswer(answers.barrier)) {
    details.push(findOptionLabel('barrier', answers.barrier))
  }

  if (hasMeaningfulAnswer(answers.condition)) {
    details.push(findOptionLabel('condition', answers.condition))
  }

  const detailFragment = details.length ? ` Based on: ${details.join(' • ')}.` : ''
  return `A short action plan for ${routeTitle}.${detailFragment}`
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
    summary: formatSummary(baseRoute.title),
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

const skipOptionalQuestion = () => {
  if (!currentQuestion.value.optional) {
    return
  }

  answers[currentQuestion.value.id] = ''

  if (questionIndex.value === wizardQuestions.length - 1) {
    result.value = buildResultPlan()
    return
  }

  questionIndex.value += 1
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
  answers.condition = ''
  answers.insurance = ''
  answers.barrier = ''
  answers.format = ''
  questionIndex.value = 0
  result.value = null
}

const documentDownloadHref = (document: DocumentItem) => {
  return `/downloads/documents/${document.filename}`
}

const conditionGuideFilename = (condition: ConditionCard) => {
  return `${toSlug(condition.title)}-quick-guide.pdf`
}

const conditionGuideDownloadHref = (condition: ConditionCard) => {
  return `/downloads/conditions/${conditionGuideFilename(condition)}`
}

type PdfLogo = {
  width: number
  height: number
  rgbBytes: Uint8Array
}

const pdfLogoCache = ref<PdfLogo | null>(null)

const loadPdfLogo = async (): Promise<PdfLogo> => {
  if (pdfLogoCache.value) {
    return pdfLogoCache.value
  }

  const response = await fetch('/images/billings-logo.png')
  if (!response.ok) {
    throw new Error(`Could not load logo (${response.status}).`)
  }

  const blob = await response.blob()
  const bitmap = await createImageBitmap(blob)
  const targetWidth = 320
  const targetHeight = Math.max(1, Math.round((bitmap.height * targetWidth) / bitmap.width))
  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight
  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Canvas 2D context not available.')
  }

  context.clearRect(0, 0, targetWidth, targetHeight)
  context.drawImage(bitmap, 0, 0, targetWidth, targetHeight)
  bitmap.close?.()

  const rgba = context.getImageData(0, 0, targetWidth, targetHeight).data
  const rgbBytes = new Uint8Array(targetWidth * targetHeight * 3)
  for (let i = 0, j = 0; i < rgba.length; i += 4, j += 3) {
    const alpha = (rgba[i + 3] ?? 0) / 255
    rgbBytes[j] = Math.round((rgba[i] ?? 0) * alpha + 255 * (1 - alpha))
    rgbBytes[j + 1] = Math.round((rgba[i + 1] ?? 0) * alpha + 255 * (1 - alpha))
    rgbBytes[j + 2] = Math.round((rgba[i + 2] ?? 0) * alpha + 255 * (1 - alpha))
  }

  pdfLogoCache.value = { width: targetWidth, height: targetHeight, rgbBytes }
  return pdfLogoCache.value
}

const buildActionPlanPdfLines = (plan: GeneratedResult, origin: string) => {
  const resources = plan.resourceIds
    .map(resourceId => helpResources.find(resource => resource.id === resourceId))
    .filter((resource): resource is ResourceItem => Boolean(resource))

  const documents = plan.documentIds
    .map(documentId => documentLibrary.find(document => document.id === documentId))
    .filter((document): document is DocumentItem => Boolean(document))

  const lines = [
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
  ]

  if (resources.length) {
    lines.push('', 'Top free resources:')
    for (const resource of resources) {
      lines.push(`- ${resource.title}: ${resource.url}`)
      if (resource.phone) {
        lines.push(`  Phone: ${resource.phone}`)
      }
    }
  }

  if (documents.length) {
    lines.push('', 'Recommended PDFs to download:')
    for (const document of documents) {
      const href = `${origin}${documentDownloadHref(document)}`
      lines.push(`- ${document.title}: ${href}`)
    }
  }

  lines.push(
    '',
    `Resources page: ${origin}/resources`,
    '',
    'Not medical advice. If you are in danger, call 911. For crisis support, call/text 988.'
  )

  return lines
}

const actionPlanPdfHref = ref('')
let actionPlanObjectUrl: string | null = null

const revokeActionPlanUrl = () => {
  if (!actionPlanObjectUrl) {
    return
  }

  URL.revokeObjectURL(actionPlanObjectUrl)
  actionPlanObjectUrl = null
}

watch(result, async (plan) => {
  revokeActionPlanUrl()
  actionPlanPdfHref.value = ''

  if (!plan) {
    return
  }

  try {
    const logo = await loadPdfLogo()
    const origin = typeof window === 'undefined' ? '' : window.location.origin
    const pdfBytes = createPdfBytes({
      title: plan.routeTitle,
      lines: buildActionPlanPdfLines(plan, origin),
      logo
    })
    const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' })
    actionPlanObjectUrl = URL.createObjectURL(blob)
    actionPlanPdfHref.value = actionPlanObjectUrl
  } catch (error) {
    console.error('Could not build action plan PDF.', error)
  }
}, { immediate: true })

onBeforeUnmount(() => {
  revokeActionPlanUrl()
})

const actionPlanDownloadHref = computed(() => actionPlanPdfHref.value)

const actionPlanFilename = computed(() => {
  if (!result.value) {
    return 'action-plan.pdf'
  }

  return `${toSlug(result.value.routeTitle)}-action-plan.pdf`
})

const helpDirectoryDownloadHref = computed(() => {
  return '/downloads/full-free-help-directory.pdf'
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

                    <div class="options-grid">
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

                <div class="wizard-nav">
                  <button
                    type="button"
                    class="back-btn"
                    :disabled="questionIndex === 0"
                    @click="goBack"
                  >
                    Back
                  </button>
                  <button
                    v-if="currentQuestion.optional"
                    type="button"
                    class="ghost-btn"
                    @click="skipOptionalQuestion"
                  >
                    Skip
                  </button>
                </div>
              </article>
            </div>

            <div
              v-else
              class="results-state"
            >
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
                      Download PDF <UIcon name="i-lucide-download" />
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
                <h2 class="result-plan-title">
                  Suggested action plan
                </h2>
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

              <section class="result-documents-card result-panel result-panel--documents">
                <p class="result-card-label">
                  <UIcon
                    name="i-lucide-file-down"
                    class="result-label-icon"
                  />
                  <span>Recommended PDFs</span>
                </p>
                <h2 class="result-resource-list-title">
                  Recommended PDFs
                </h2>
                <div class="inline-downloads">
                  <a
                    v-for="document in orderedResultDocuments.slice(0, 5)"
                    :key="document.id"
                    :href="documentDownloadHref(document)"
                    :download="document.filename"
                  >
                    <UIcon
                      name="i-lucide-download"
                      class="inline-icon"
                    /> {{ document.title }}
                  </a>
                </div>
              </section>

              <section class="result-resource-list-card result-panel result-panel--resources">
                <p class="result-card-label">
                  <UIcon
                    name="i-lucide-link-2"
                    class="result-label-icon"
                  />
                  <span>All free resources</span>
                </p>
                <h2 class="result-resource-list-title">
                  All free resources
                </h2>
                <ul class="resource-list result-resource-list">
                  <li
                    v-for="resource in orderedResultResources"
                    :key="resource.id"
                  >
                    <div class="result-resource-copy">
                      <p class="resource-title">
                        <UIcon
                          name="i-lucide-life-buoy"
                          class="result-inline-icon"
                        /> {{ resource.title }}
                      </p>
                      <p class="resource-meta">
                        {{ compactCopy(resource.whoItHelps, 92) }}
                      </p>
                      <div class="result-resource-links">
                        <a
                          :href="resource.url"
                          target="_blank"
                          rel="noopener"
                        >
                          {{ resource.urlLabel }} <UIcon name="i-lucide-arrow-up-right" />
                        </a>
                        <a
                          v-if="resource.phone && !isCallLink(resource.url)"
                          :href="toTelHref(resource.phone)"
                        >
                          <UIcon
                            name="i-lucide-phone"
                            class="result-inline-icon"
                          /> {{ resource.phone }}
                        </a>
                      </div>
                    </div>
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
            <p class="hero-media-title">
              Explore our<br>resources
            </p>
            <NuxtImg
              src="/images/form-alter.jpg"
              alt="A man grabbing a medical device"
              loading="lazy"
            />
          </figure>
        </div>
      </section>

      <div class="page-shell">
        <section
          id="help-now"
          class="help-now content-section section-help"
        >
          <h2 class="title-with-icon">
            <UIcon
              name="i-lucide-siren"
              class="title-icon"
            /> Help now
          </h2>
          <p>Start here if you need help right now. For emergencies call 911. For crisis support call/text 988. For local services (housing, food, rides) call 211.</p>
          <div class="help-now-grid">
            <figure class="section-photo section-photo--help section-photo--wide grid-photo-item">
              <NuxtImg
                src="/images/resources-emergency.jpg"
                alt="A police car with emergency lights"
                loading="lazy"
              />
            </figure>
            <a href="tel:911">
              <UIcon
                name="i-lucide-siren"
                class="link-icon"
              /> Emergency: Call 911
            </a>
            <a
              href="https://988lifeline.org"
              target="_blank"
              rel="noopener"
            ><UIcon
              name="i-lucide-phone-call"
              class="link-icon"
            /> Crisis support: Call/text 988</a>
            <a
              href="https://www.211.org"
              target="_blank"
              rel="noopener"
            ><UIcon
              name="i-lucide-map-pin"
              class="link-icon"
            /> Local services: 211 (housing, food, rides)</a>
            <a
              href="https://www.cff.org/support/get-help-cf-foundation-compass"
              target="_blank"
              rel="noopener"
            >
              <span>
                <UIcon
                  name="i-lucide-heart-pulse"
                  class="link-icon"
                /> CF help: CF Foundation Compass (coverage + financial)
              </span>
            </a>
          </div>
        </section>

        <section
          id="cf-quick-guide"
          class="cf-spotlight content-section section-cf"
        >
          <h2 class="title-with-icon">
            <UIcon
              name="i-lucide-heart-pulse"
              class="title-icon"
            /> Cystic fibrosis (CF) quick guide
          </h2>
          <p class="section-subtitle">
            Start with Compass for navigation help, then download PDFs to track refills and prior authorizations.
          </p>
          <div class="spotlight-grid">
            <figure class="section-photo section-photo--cf section-photo--portrait grid-photo-item">
              <NuxtImg
                src="/images/resources-cf.jpg"
                alt="Clinician discussing care plan with patient"
                loading="lazy"
              />
            </figure>
            <article>
              <h3>
                Why it gets expensive
              </h3>
              <ul>
                <li>Specialty meds and frequent follow-up can drive high monthly out-of-pocket costs.</li>
                <li>Prior authorizations and specialty pharmacies can delay refills if renewals slip.</li>
              </ul>
            </article>

            <article>
              <h3>
                Fast next steps
              </h3>
              <ul>
                <li>Contact CF Foundation Compass for insurance and financial navigation.</li>
                <li>Write down prior authorization and pharmacy renewal dates (a simple calendar helps).</li>
              </ul>
            </article>

            <article>
              <h3>
                Download PDFs
              </h3>
              <p>Use these checklists to track calls, renewals, and next steps.</p>
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
                name="i-lucide-arrow-up-right"
                class="link-icon"
              /> CF Foundation Compass (get help)</a>
            </article>
          </div>
        </section>

        <section
          id="conditions-section"
          class="conditions-section content-section section-conditions"
        >
          <h2 class="title-with-icon">
            <UIcon
              name="i-lucide-bar-chart-3"
              class="title-icon"
            /> Conditions that often create high costs
          </h2>
          <p class="section-subtitle">
            Skim the overview, then download a 1-page guide you can save or print.
          </p>
          <div class="conditions-grid">
            <figure class="section-photo section-photo--conditions section-photo--square grid-photo-item">
              <NuxtImg
                src="/images/resources-top.png"
                alt="Medical records and notes on a desk"
                loading="lazy"
              />
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
                <span class="condition-impact-copy"><strong>Where costs spike:</strong> {{ compactCopy(condition.triggers, 96) }}</span>
              </p>
              <p class="condition-stat">
                <UIcon
                  name="i-lucide-bar-chart-3"
                  class="inline-icon"
                />
                <span class="condition-stat-copy"><strong>Key stat:</strong> {{ compactCopy(condition.stats[0] ?? '', 98) }}</span>
              </p>

              <div class="condition-links">
                <a
                  :href="conditionGuideDownloadHref(condition)"
                  :download="conditionGuideFilename(condition)"
                >
                  <UIcon
                    name="i-lucide-file-down"
                    class="link-icon"
                  /> Download 1-page guide
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
                  /> Learn more
                </a>
              </div>
            </article>
          </div>
        </section>

        <section
          id="docs-library"
          class="docs-library content-section section-docs"
        >
          <h2 class="title-with-icon">
            <UIcon
              name="i-lucide-file-down"
              class="title-icon"
            /> Downloadable PDFs (checklists + call scripts)
          </h2>
          <p class="section-subtitle">
            Download and use while you make calls. Your wizard answers are not stored.
          </p>
          <div class="filter-row">
            <div>
              <p class="filter-label">
                <UIcon
                  name="i-lucide-tags"
                  class="inline-icon"
                /> Filter by topic
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
          </div>

          <div class="docs-grid">
            <figure
              v-if="activeTopicFilter === 'all'"
              class="section-photo section-photo--docs section-photo--landscape grid-photo-item"
            >
              <NuxtImg
                src="/images/resources-paperwork.jpg"
                alt="Checklist documents and pen ready for planning"
                loading="lazy"
              />
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
              <p class="doc-meta doc-row">
                <UIcon
                  name="i-lucide-users"
                  class="inline-icon"
                /> <span class="doc-row-copy">{{ compactCopy(document.whoItHelps, 86) }}</span>
              </p>
              <p class="doc-row">
                <UIcon
                  name="i-lucide-info"
                  class="inline-icon"
                /> <span class="doc-row-copy">{{ compactCopy(document.summary, 92) }}</span>
              </p>
              <a
                :href="documentDownloadHref(document)"
                :download="document.filename"
              >
                <UIcon
                  name="i-lucide-download"
                  class="link-icon"
                /> Download PDF
              </a>
            </article>
          </div>
        </section>

        <section
          id="help-directory"
          class="help-directory content-section section-directory"
        >
          <h2 class="title-with-icon">
            <UIcon
              name="i-lucide-layers-3"
              class="title-icon"
            /> Free help directory
          </h2>
          <p class="section-subtitle">
            Previewing {{ directoryPreviewLimit }} links per group. Expand a group to see more, or download the full directory.
          </p>
          <a
            class="section-download-link"
            :href="helpDirectoryDownloadHref"
            download="full-free-help-directory.pdf"
          >
            <UIcon
              name="i-lucide-download"
              class="link-icon"
            /> Download full directory (PDF)
          </a>

          <div class="directory-grid">
            <article
              v-for="group in orderedGroupedHelpResources"
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
                /> {{ group.items.length }} links
              </p>
              <ul>
                <li
                  v-for="resource in visibleDirectoryResources(group)"
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
                  <div
                    class="directory-link-row"
                    :class="{ 'has-phone-link': shouldShowDirectoryPhone(resource) }"
                  >
                    <a
                      :href="resource.url"
                      target="_blank"
                      rel="noopener"
                      class="directory-link directory-link--external"
                    >
                      {{ resource.urlLabel }} <UIcon
                        name="i-lucide-arrow-up-right"
                        class="link-icon"
                      />
                    </a>
                    <a
                      v-if="shouldShowDirectoryPhone(resource)"
                      :href="toTelHref(resource.phone ?? '')"
                      class="directory-link directory-link--phone"
                    >
                      <UIcon
                        name="i-lucide-phone"
                        class="link-icon"
                      /> Call
                    </a>
                  </div>
                </li>
              </ul>
              <button
                v-if="group.items.length > directoryPreviewLimit"
                type="button"
                class="group-expand-btn"
                @click="toggleDirectoryGroup(group.group)"
              >
                {{ directoryExpandLabel(group) }}
              </button>
            </article>
          </div>
        </section>

        <section
          id="faq"
          class="faq-section content-section section-faq"
        >
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

        <section
          id="updates"
          class="updates-section content-section section-updates"
        >
          <h2 class="title-with-icon">
            <UIcon
              name="i-lucide-mail"
              class="title-icon"
            /> Get updates (optional)
          </h2>
          <p>Occasional Billings updates. We only collect your email address (we do not collect your wizard answers).</p>
          <form
            class="updates-form"
            @submit.prevent="submitUpdatesEmail"
          >
            <input
              v-model="updatesEmail"
              type="email"
              inputmode="email"
              autocomplete="email"
              placeholder="you@example.com"
              :disabled="updatesStatus === 'sending'"
              @input="resetUpdatesForm"
            >
            <button
              type="submit"
              class="primary-btn"
              :disabled="updatesStatus === 'sending'"
            >
              {{ updatesStatus === 'sending' ? 'Sending...' : 'Sign up' }}
            </button>
          </form>
          <p
            v-if="updatesStatus === 'success'"
            class="updates-status updates-status--success"
          >
            Thanks. You are on the list.
          </p>
          <p
            v-else-if="updatesStatus === 'error'"
            class="updates-status updates-status--error"
          >
            {{ updatesError }}
          </p>
        </section>

        <section class="footer-lines content-section section-footer">
          <a href="mailto:resources@billings.app?subject=Resource%20update">
            <UIcon
              name="i-lucide-mail"
              class="inline-icon"
            />
            Report a broken link or suggest a resource
          </a>
        </section>
      </div>
    </main>
  </div>
</template>

<style scoped>
.resources-page {
  --line: #dde3eb;
  --line-strong: #cfd6df;
  --hero-a: #fdf1e5;
  --surface-border: #d9e1ec;
  --surface-shadow: 0 0.75rem 1.5rem rgba(15, 28, 44, 0.09);
  --result-surface: #ffffff;
  --result-line: #d9dde3;
  --result-text: #1f2428;
  --result-muted: #626a73;
  --result-link: #1f2428;
  --resource-card-padding: var(--space-8) var(--space-6);
  --resource-card-title-line-height: 1;
  --resource-card-body-line-height: 1.5;
  --resource-card-title-gap: var(--space-2);
  --resource-card-text-gap: var(--space-2);
  --resource-card-link-gap: var(--space-3);
  min-height: 100vh;
  color: var(--theme-color-text);
  background: var(--alt-bg);
}

.page-shell {
  width: 100%;
  max-width: var(--layout-max-width);
  margin-inline: auto;
  padding: var(--space-16) var(--space-6) 4rem;
  display: grid;
  gap: clamp(1.3rem, 2.2vw, 1.9rem);
}

.hero-transform {
  --hero-top-pad: clamp(1rem, 3vw, 2rem);
  --hero-inline-pad: clamp(1rem, 3vw, 2rem);
  --hero-available-height: calc(100svh - var(--layout-header-height, 4.25rem) - var(--hero-top-pad));
  height: var(--hero-available-height);
  min-height: var(--hero-available-height);
  max-height: var(--hero-available-height);
  padding: var(--hero-top-pad) var(--space-6);
  overflow: hidden;
  margin: 0 auto;
}

.hero-layout {
  width: 100%;
  max-width: 82.5rem;
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
  position: relative;
  margin: 0;
  border-radius: var(--radius-xl);
  overflow: hidden;
  height: 100%;
  background: linear-gradient(145deg, #d5dee9 0%, #f4f8fb 100%);
  box-shadow: 1.5rem 1.5rem 0 var(--theme-color-muted);
}

.hero-media-title {
  position: absolute;
  bottom: clamp(0.9rem, 2.6vw, 1.7rem);
  right: clamp(0.9rem, 2.8vw, 2rem);
  z-index: 2;
  margin: 0;
  max-width: min(82%, 12ch);
  font-family: var(--theme-font-title);
  font-size: clamp(1.7rem, 5vw, 4rem);
  line-height: 1.1;
  text-transform: lowercase;
  text-wrap: balance;
  text-align: right;
  color: var(--theme-color-muted);
  text-shadow: 0 0.125rem 1.125rem rgba(18, 25, 34, 0.45);
  pointer-events: none;
}

.hero-media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 34%;
}

.hero-transform.is-result {
  height: auto;
  min-height: auto;
  max-height: none;
  padding-bottom: 0;
  overflow: visible;
  max-width: var(--layout-max-width);
  margin: 0 auto;
}

.hero-transform.is-result .hero-layout {
  max-width: 76.25rem;
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
  width: 15rem;
  height: 0.25rem;
  border-radius: var(--radius-pill);
  margin-bottom: var(--space-6);
  background: var(--section-rule, #8b97b4);
}

.section-help { --section-rule: #c5862e; padding-top: var(--space-24); }
.section-cf { --section-rule: #c5862e; padding-top: var(--space-24);}
.section-conditions { --section-rule: #c5862e; padding-top: var(--space-24);}
.section-docs { --section-rule: #c5862e;padding-top: var(--space-24); }
.section-directory { --section-rule: #c5862e;padding-top: var(--space-24); }
.section-faq { --section-rule: #c5862e;padding-top: var(--space-24); }
.section-footer { --section-rule: #c5862e;padding-top: var(--space-24); }

.wizard-state {
  margin-top: 0;
  max-width: 38.75rem;
  height: 100%;
  max-height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.results-state {
  margin-top: 1.1rem;
  max-width: 38.75rem;
}

.hero-transform.is-result .results-state {
  max-width: none;
  margin-top: 0;
}

.section-label {
  margin: 0;
  font-size: var(--theme-font-size-caption);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 700;
  color: #4f5a78;
}

.section-label--with-icon {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

.section-label-icon {
  font-size: var(--theme-font-size-brand);
}

.content-section .section-label {
  color: #44506d;
}

.title-with-icon {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  line-height: 1 !important;
  margin-top: -0.5rem;
}

.title-icon {
  font-size: 0.95em;
  opacity: 0.9;
}

.inline-icon {
  font-size: var(--theme-font-size-brand);
  margin-right: 0.22rem;
}

.link-icon {
  font-size: var(--theme-font-size-brand);
  margin-right: 0;
}

h1 {
  margin: 0.3rem 0 0;
  font-size:var(--theme-font-size-display-md);
  line-height: 1.1;
  color: var(--theme-color-text);
}

.section-subtitle {
  margin: 0.65rem 0 0;
  max-width: 47.5rem;
  color: var(--theme-color-muted);
  line-height: 1.5;
  font-size: var(--theme-font-size-brand-lg);
}

.section-photo {
  margin: var(--space-4) 0 0;
  display: block;
  width: min(100%, var(--section-photo-width, 100%));
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--surface-shadow);
  background: #ffffff;
}

.conditions-grid .section-photo img {
  object-position: 35%;
}

.section-photo img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.help-now-grid .section-photo img {
  min-height: 400px;
}

.section-photo--wide {
  --section-photo-ratio: 17 / 8;
  --section-photo-width: 100%;
}

.section-photo--portrait {
  --section-photo-ratio: 4 / 5;
  --section-photo-width: min(100%, 22.5rem);
}

.section-photo--square {
  --section-photo-ratio: 1 / 1;
  --section-photo-width: min(100%, 28.75rem);
}

.section-photo--landscape {
  --section-photo-ratio: 16 / 9;
  --section-photo-width: min(100%, 57.5rem);
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
  grid-column: 2;
  grid-row: 2;
  align-self: stretch;
}

.docs-grid .grid-photo-item img {
  height: 100%;
}

.question-card {
  margin-top: var(--space-6);
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
  font-size: var(--theme-font-size-caption);
  color: var(--theme-color-muted);
  font-weight: 700;
}

.optional-badge {
  margin: 0.45rem 0 0;
  font-size: 0.75rem;
  color: var(--theme-color-muted-2);
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
  grid-template-columns: repeat(auto-fit, minmax(13.75rem, 1fr));
  gap: var(--space-2);
  max-width: 35rem;
  align-content: start;
}

.option-btn,
.primary-btn,
.ghost-btn,
.back-btn {
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  font-weight: 650;
  line-height: 1.5;
  cursor: pointer;
}

.option-btn {
  text-align: left;
  border-color: var(--line-strong);
  background: var(--theme-color-muted);
  color: var(--theme-color-accent-contrast);
  padding: var(--space-3) var(--space-4);
  font-size: var(--theme-font-size-brand);
  transition: border-color 160ms ease, background-color 160ms ease, transform 160ms ease;
  padding-block: var(--space-2);
}

.option-btn:hover {
  border-color: var(--theme-color-text);
  background: #f7faff;
}

.state-input-wrap {
  margin-top: 1rem;
  max-width: 35rem;
}

.state-input-wrap input {
  width: 100%;
  max-width: 500px;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  font: inherit;
  background: #ffffff;
  color: var(--theme-color-accent-contrast);
  font-size: var(--theme-font-size-form);
}

.state-input-wrap input:focus {
  outline: none;
}

.updates-form {
  margin-top: 1rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
}

.updates-form input {
  flex: 1 1 16rem;
  max-width: 26rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  font: inherit;
  background: #ffffff;
  color: var(--theme-color-accent-contrast);
  font-size: var(--theme-font-size-form);
}

.updates-form input:focus {
  outline: none;
}

.updates-status {
  margin: var(--space-2) 0 0;
  font-size: var(--theme-font-size-brand);
}

.updates-status--success {
  color: var(--theme-color-muted);
}

.updates-status--error {
  color: #b84a4a;
}

.state-actions {
  margin-top: var(--space-3);
  display: flex;
  gap: 0.5rem;
}

.primary-btn {
  background: var(--theme-color-accent);
  color: var(--theme-color-accent-contrast);
  padding: var(--space-3) var(--space-4);
  font-size: var(--theme-font-size-btn);
}

.directory-group .resource-title {
  margin-top: 0;
  font-family: var(--theme-font-title);
  font-size: var(--theme-font-size-card-title);
  line-height: var(--resource-card-title-line-height);
  color: var(--theme-color-muted);
}
.ghost-btn,
.back-btn {
  border-color: var(--theme-color-muted);
  color: var(--theme-color-muted);
  padding: var(--space-3) var(--space-4);
  font-size: var(--theme-font-size-btn);
}

.wizard-nav {
  margin-top: auto;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.back-btn {
  width: fit-content;
}

.back-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.condition-card ul,
.directory-group ul {
  margin: 0.65rem 0 0;
  padding-left: var(--space-4);
}

.condition-card li,
.directory-group li {
  margin-bottom: 0.48rem;
  line-height: 1.4;
  color: var(--theme-color-text-soft);
}

.directory-group li:last-child {
  margin-bottom: 0;
}

.content-section h2 {
  margin: 0.2rem 0 0;
  font-size: var(--theme-font-size-heading-md);
  line-height: 1.1;
}

.results-state {
  color: var(--result-text);
  margin-top: 0.9rem;
  max-width: none;
}

.result-card-label {
  margin: 0;
  font-size: var(--theme-font-size-caption);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 700;
  color: var(--result-muted);
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

.result-label-icon {
  font-size: var(--theme-font-size-brand);
  opacity: 0.88;
}

.result-simple-grid {
  margin-top: 1rem;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}

.result-simple-card,
.result-panel {
  border: 1px solid var(--result-line);
  border-radius: 1.125rem;
  padding: var(--resource-card-padding);
  box-shadow: var(--surface-shadow);
}

.result-simple-card {
  background: var(--theme-color-muted);
  display: flex;
  flex-direction: column;
}

.result-simple-card--document {
  background: var(--theme-color-muted);
}

.result-simple-card h2,
.result-plan-title,
.result-resource-list-title {
  margin: var(--resource-card-title-gap) 0 0;
  font-size: var(--theme-font-size-card-title-big);
  font-family: var(--theme-font-title);
  line-height: var(--resource-card-title-line-height);
  color: var(--result-text);
}

.results-state .resource-meta {
  margin: var(--resource-card-text-gap) 0 2rem;
  color: var(--result-muted);
  font-size: var(--theme-font-size-brand);
  line-height: var(--resource-card-body-line-height);
}

.resource-meta {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.result-simple-card a {
  display: block;
  align-items: center;
  gap: var(--space-1);
  margin-top: auto;
  color: var(--result-link);
  font-size: var(--theme-font-size-brand);
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 0.5em;
}

.result-panel {
  margin-top: 0.9rem;
  background: var(--result-surface);
}

.result-panel--plan {
  background: var(--theme-color-muted);
}

.result-panel--documents {
  border-color: white;
  background: white;
}

.results-state .result-documents-card .inline-downloads a {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  margin-top: 0;
  color: var(--result-link);
  font-weight: 700;
}

.plan-columns {
  margin-top: var(--space-3);
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-3);
}

.plan-block {
  border: 1px solid color-mix(in oklab, var(--result-line), #ffffff 26%);
  border-radius: var(--radius-lg);
  padding: var(--resource-card-padding);
  box-shadow: 0 0.375rem 0.875rem rgba(15, 28, 44, 0.05);
}

.plan-block:nth-child(1) {
  background: #93b89f;
}

.plan-block:nth-child(2) {
  background: #93a8b8;
}

.plan-block:nth-child(3) {
  background: #b89393;
}

.plan-block h4 {
  margin: 0;
  font-size: 1.25rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--theme-color-accent-contrast);
}

.mini-heading {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

.mini-heading-icon {
  font-size: var(--theme-font-size-brand);
}

.plan-block ul {
  margin: 0.62rem 0 0;
  padding-left: 0;
}

.plan-block li {
  margin-bottom: var(--space-2);
  color: var(--theme-color-accent-contrast);
  line-height: 1.5;
  font-size: var(--theme-font-size-brand);
}

.plan-download-link {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  margin-top: 0.8rem;
  font-size: var(--theme-font-size-brand);
  font-weight: 700;
  color: #253a63;
  text-decoration: underline;
  text-underline-offset: 0.5em;
}

.result-panel--resources {
  border-color: color-mix(in oklab, var(--result-line), #c5d7e6 18%);
  background: linear-gradient(150deg, #ffffff, #f5f9ff);
}

.results-state .resource-list {
  list-style: none;
  padding: 0;
  margin: var(--space-3) 0 0;
}

.results-state .result-resource-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.results-state .resource-list li {
  border-radius: var(--radius-md);
  background: #ededed;
  padding: var(--resource-card-padding);
  margin-bottom: var(--space-2);
  display: flex;
  gap: var(--space-3);
  justify-content: space-between;
  align-items: flex-start;
}

.results-state .result-resource-list li {
  margin-bottom: 0;
  justify-content: flex-start;
}

.result-resource-copy {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.result-resource-links {
  margin-top: auto;
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-6) 1rem;
}

.results-state .resource-title {
  margin: 0;
  font-size: var(--theme-font-size-card-title);
  line-height: var(--resource-card-title-line-height);
  font-weight: 680;
  color: var(--result-text);
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.result-inline-icon {
  font-size: var(--theme-font-size-brand);
  color: var(--result-muted);
}

.results-state .resource-list a {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  margin-top: 0;
  color: var(--result-link);
  text-decoration: underline;
  text-underline-offset: 0.5em;
  font-size: var(--theme-font-size-brand);
  font-weight: 700;
}

.resource-list a,
.directory-group a,
.cf-spotlight a,
.condition-links a {
  display: flex;
  margin-top: var(--resource-card-link-gap);
  font-size: var(--theme-font-size-brand);
  font-weight: 700;
  color: var(--theme-color-accent);
  text-decoration: none;
  align-items: anchor-center;
  column-gap: 0.5rem;
  row-gap: 0.5rem;
  text-decoration: underline;
  text-underline-offset: 0.5em;
}
.doc-card a {
  display: flex;
  margin-top: auto;
  font-size: var(--theme-font-size-brand);
  font-weight: 700;
  text-decoration: none;
  align-items: anchor-center;
  column-gap: 0.5rem;
  row-gap: 0.5rem;
  text-decoration: underline;
  text-underline-offset: 0.5em;
  color: var(--theme-color-accent-contrast);
}

.cf-spotlight a {
  margin-top: var(--resource-card-link-gap);
}
.result-controls {
  margin-top: 1rem;
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.result-controls button {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

.section-download-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  margin-top: 0.75rem;
  font-size: var(--theme-font-size-brand);
  font-weight: 700;
  color: var(--theme-color-muted);
  text-decoration: underline;
  text-underline-offset: 0.5em;
}

.help-now > p,
.doc-meta,
.doc-tags {
  margin: 0.6rem 0 0;
  color: var(--theme-color-muted);
  font-size: var(--theme-font-size-brand-lg);
}

.help-now-grid {
  margin-top: var(--space-4);
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-3);
}

.help-now-grid a {
  text-decoration: none;
  /* border: 1px solid
  color-mix(in oklab, var(--surface-border), #e8c88f 18%); */
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  padding: var(--space-4);
  background: #b84a4a;
  color: #ffffff;
  font-weight: 700;
  line-height: 1.5;
  min-height: 5.75rem;
  text-align: center;
  font-size: var(--theme-font-size-brand);
  box-shadow: var(--surface-shadow);
  transition: transform 160ms ease, box-shadow 160ms ease;
  column-gap: 0.3rem;
}

.help-now-grid a:hover {
  transform: translateY(-0.125rem);
  box-shadow: 0 1rem 1.75rem rgba(15, 28, 44, 0.12);
}

.spotlight-grid {
  margin-top: var(--space-4);
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  gap: var(--space-3);
}

.spotlight-grid article {
    border-radius: var(--radius-lg);
    background: #3c2851;
    padding: var(--resource-card-padding);
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
  font-size: 1.5rem;
  line-height: var(--resource-card-title-line-height);
}

.spotlight-grid ul,
.spotlight-grid p {
  margin: var(--resource-card-text-gap) 0 0;
  color: var(--theme-color-muted);
  line-height: var(--resource-card-body-line-height);
  font-size: var(--theme-font-size-brand);
}

.inline-downloads {
  margin-top: var(--space-3);
  display: grid;
  gap: 0.75rem;
}

.inline-downloads a {
  margin-top: 0;
  font-size: var(--theme-font-size-brand);
  text-decoration: underline;
  color: var(--theme-color-muted);
}

.conditions-grid {
  margin-top: var(--space-4);
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
  grid-auto-flow: row;
}

.conditions-grid .grid-photo-item {
  grid-column: 1;
  grid-row: 1 / span 2;
}

.conditions-grid .condition-card:nth-of-type(1) {
  grid-column: 2;
  grid-row: 1;
}

.conditions-grid .condition-card:nth-of-type(2) {
  grid-column: 2;
  grid-row: 2;
}

.condition-card {
  border-radius: var(--radius-lg);
  padding: var(--resource-card-padding);
  background: #273b54;
}

.card-summary {
  margin: var(--resource-card-text-gap) 0 0;
  color: var(--theme-color-text-soft);
  line-height: var(--resource-card-body-line-height);
  font-size: var(--theme-font-size-brand);
}

.condition-card p {
  margin: 1.5rem 0 0;
  color: var(--theme-color-muted);
  line-height: var(--resource-card-body-line-height);
  font-size: var(--theme-font-size-brand);
}

.condition-impact {
  font-size: var(--theme-font-size-brand);
  display: flex;
  align-items: start;
  gap: var(--space-2);
}

.condition-impact .inline-icon {
  margin-right: 0;
  margin-top: 0.28em;
  vertical-align: baseline;
}

.condition-impact-copy {
  display: block;
  flex: 1;
}

.condition-action-list {
  margin: 0.62rem 0 0;
  padding-left: 1rem;
}

.condition-action-list li {
  margin-bottom: 0.5rem;
  color: #2f3a4d;
  line-height: 1.5;
  font-size: var(--theme-font-size-brand);
}

.condition-stat {
  margin-top: var(--resource-card-text-gap);
  font-size: var(--theme-font-size-brand);
  display: flex;
  align-items: start;
  gap: var(--space-2);
}

.condition-stat .inline-icon {
  margin-right: 0;
  margin-top: 0.14rem;
  vertical-align: baseline;
}

.condition-stat-copy {
  display: block;
  flex: 1;
}

.condition-links {
  margin-top: var(--resource-card-link-gap);
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.filter-row {
  margin-top: var(--space-4);
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-3);
}

.filter-row > div {
  padding: 0;
}

.filter-label {
  margin: 0;
  font-size: var(--theme-font-size-caption);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--theme-color-muted);
}

.filter-chip-row {
  margin-top: var(--space-2);
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}

.filter-chip {
  border: 1px solid var(--theme-color-muted);
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--theme-color-muted);
  font-size: var(--theme-font-size-caption);
  font-weight: 650;
  padding: var(--space-1) var(--space-2);
  cursor: pointer;
}

.filter-chip.is-active {
  border-color: var(--theme-color-accent);
  background: var(--theme-color-muted);
  color: var(--theme-color-bg);
}

.docs-grid {
  margin-top: var(--space-4);
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-3);
}

.doc-card {
  border-radius: var(--radius-lg);
  padding: var(--resource-card-padding);
  background: white;
  display: flex;
  flex-direction: column;
}

.doc-card p,
.directory-group p {
  margin: var(--resource-card-text-gap) 0 0;
  color: var(--theme-color-accent-contrast);
  line-height: var(--resource-card-body-line-height);
  font-size: var(--theme-font-size-brand);
}

.directory-group p {
  color: var(--theme-color-muted);
}

.doc-card .doc-row {
  display: flex;
  align-items: start;
  gap: 0.5rem;
}

.doc-card .doc-row:not(.doc-meta) {
  margin-bottom: 1rem;
}

.doc-card .doc-row .inline-icon {
  margin-right: 0;
  margin-top: 0.25rem;
  vertical-align: baseline;
}

.doc-card .doc-row-copy {
  display: block;
  flex: 1;
  font-size: var(--theme-font-size-brand);
}

.directory-grid {
  margin-top: var(--space-4);
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  column-gap: var(--space-3);
  row-gap: var(--space-3);
  grid-auto-flow: row;
}

.directory-group {
    /* border: 1px solid var(--theme-color-muted); */
    border-radius: var(--radius-lg);
    padding: var(--resource-card-padding);
    background: #333949;
}

.directory-group ul {
  list-style: none;
  margin: 1rem 0 0;
  padding: 0;
}

.group-count {
  margin: 0.46rem 0 0;
  font-size: var(--theme-font-size-caption);
  color: #4b5f4b;
  font-weight: 700;
}

.group-more-hint {
  margin: 0.36rem 0 0;
  font-size: var(--theme-font-size-caption);
  color: var(--theme-color-muted);
  font-weight: 600;
}

.group-expand-btn {
    margin-top: 1.5rem;
    border-radius: var(--radius-pill);
    padding: var(--space-1) var(--space-3);
    background: var(--theme-color-muted);
    color: var(--theme-color-accent-contrast);
    font-size: var(--theme-font-size-caption);
    line-height: 1.5;
    font-weight: 700;
    cursor: pointer;
}

.directory-group li {
  border-radius: var(--radius-md);
  padding: 0rem;
  margin-bottom: 2.5rem;
}

.directory-link-row {
  margin-top: var(--space-2);
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.directory-link-row .directory-link:first-child {
  margin-top: 0;
  color: var(--theme-color-muted);
}

.faq-list {
  margin-top: var(--space-4);
  display: grid;
  gap: var(--space-3);
}

.faq-list details {
  border: 1px solid color-mix(in oklab, var(--surface-border), #bcc4d4 18%);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
  background: var(--theme-color-muted);
  box-shadow: 0 0.5rem 1rem rgba(15, 28, 44, 0.06);
}

.faq-list summary {
  cursor: pointer;
  font-weight: 700;
  color: var(--theme-color-accent-contrast);
  font-size: var(--theme-font-size-brand-lg);
}

.faq-list p {
  margin: var(--space-3) 0 0;
  color: var(--theme-color-accent-contrast);
  line-height: 1.5;
  font-size: var(--theme-font-size-brand);
}

.footer-lines {
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  justify-content: center;
}

.footer-lines a {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  margin: 0;
  text-decoration: none;
  font-weight: 700;
  color: var(--theme-color-muted);
  line-height: 1.5;
  font-size: var(--theme-font-size-brand);
}

.directory-group .group-count {
  color: var(--theme-color-muted);
}

@media screen and (max-width: 1024px) {
  .results-state .result-resource-list {
    grid-template-columns: 1fr;
  }

  .filter-chip-row {
    gap: var(--space-2);
  }
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

  .conditions-grid .grid-photo-item,
  .conditions-grid .condition-card:nth-of-type(1),
  .conditions-grid .condition-card:nth-of-type(2) {
    grid-column: auto;
    grid-row: auto;
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

@media screen and (max-width: 991px) {
  .hero-transform {
    height: auto;
    min-height: auto;
    max-height: none;
    padding: 1rem var(--space-6);
    overflow: visible;
  }

  .hero-layout {
    max-width: 76.25rem;
    grid-template-columns: 1fr;
  }

  .question-card {
    margin-bottom: 3rem;
  }
  .hero-copy {
    order: 1;
    height: auto;
    min-height: auto;
    overflow: visible;
  }

  .wizard-state {
    height: auto;
    max-height: none;
  }

  .section-cf,
  .section-conditions,
  .section-conditions,
  .section-directory,
  .section-faq,
  .section-footer {
    padding-top: var(--space-20);
  }
  .hero-media {
    order: 2;
    min-height: clamp(20rem, 58vh, 30rem);
    max-width: 48.75rem;
    margin-inline: auto;
    width: 90%;
    left: -3%;
  }

  .hero-media-title {
    max-width: min(86%, 14ch);
  }
  .back-btn {
    margin-top: 2rem;
  }

}

@media screen and (max-width: 767px) {
  .hero-transform {
    padding: 2rem var(--space-4) 0;
  }

  .hero-media {
    min-height: 18.75rem;
    border-radius: var(--radius-lg);
  }

  .hero-media-title {
    top: 0.7rem;
    right: 0.7rem;
  }

  .page-shell {
    padding: 1rem var(--space-4) 3.25rem;
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

  .plan-block ul {
    padding-left: 0;
  }

  h1 {
    line-height: 1.1;
  }

  .content-section h2 {
    align-items: baseline;
  }

  .section-subtitle {
    line-height: 1.5;
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
