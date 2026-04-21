/**
 * Shared mock data for CRM components.
 *
 * IDs are numeric and STABLE across modules so that cross-references hold:
 *   - Account.id  1 = "บริษัท ABC จำกัด"
 *   - Account.id  2 = "บริษัท XYZ คอร์ปอเรชั่น"
 *   - Account.id  3 = "บริษัท DFG อินเตอร์"
 *   - Account.id  4 = "บริษัท LMN โซลูชั่น"
 *
 * Contacts carry accountId pointing at Accounts.
 * Opportunities carry contactId + accountId.
 * Quotations carry opportunityId.
 * Activities carry relatedToType + relatedToId.
 *
 * Components keep their own local `interface` declarations; this module
 * exposes superset types so each component can cast on import without
 * breaking its own field shape.
 */

// ---------- Types (supersets of per-component shapes) ----------

export interface DashboardStat {
  name: string
  value: string
  change: string
  trend: "up" | "down"
  iconName: "Users" | "Target" | "DollarSign" | "TrendingUp"
}

export interface Product {
  id: number
  code: string
  name: string
  category: string
  description?: string
  unitPrice: number
  unit?: string
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
  images?: Array<{ id: number; name: string; type: "image" | "catalog" | "document"; url: string; size: string; uploadedAt: string }>
  catalogs?: Array<{ id: number; name: string; type: "image" | "catalog" | "document"; url: string; size: string; uploadedAt: string }>
  documents?: Array<{ id: number; name: string; type: "image" | "catalog" | "document"; url: string; size: string; uploadedAt: string }>
}

export interface AccountContact {
  id: number
  name: string
  position?: string
  email?: string
  phone?: string
  isPrimary: boolean
}

export interface AccountOpportunity {
  id: number
  name: string
  stage: string
  value: number
  expectedCloseDate: string
  owner: string
}

export interface Account {
  id: number
  name: string
  taxId?: string
  industry: string
  type: "Customer" | "Prospect" | "Partner" | "Other"
  website?: string
  phone?: string
  email?: string
  address?: string
  lifetimeValue: number
  contacts: AccountContact[]
  opportunities: AccountOpportunity[]
  quotations: number
  contracts: number
  owner: string
  createdAt: string
  description?: string
}

export interface Lead {
  id: number
  leadType: "individual" | "company"
  firstName?: string
  lastName?: string
  companyName?: string
  taxId?: string
  contactFirstName?: string
  contactLastName?: string
  contactPosition?: string
  email: string
  phone: string
  mobile?: string
  address?: string
  status: "New" | "Working" | "Qualified" | "Unqualified"
  source: string
  grade: string
  temperature: "Hot" | "Warm" | "Cold"
  campaign?: string
  interestedProducts: number[]
  score: number
  contactDate: string
  dueDate: string
  slaHours: number
  assignedTo: string
  createdAt: string
  isDuplicate: boolean
  duplicateOf?: number
  notes?: string
  disqualifyReason?: string
}

export interface Contact {
  id: number
  contactType: "individual" | "company"
  firstName: string
  lastName: string
  title?: string
  department?: string
  email: string
  phone?: string
  mobile?: string
  address?: string
  temperature: "Hot" | "Warm" | "Cold"
  source?: string
  campaign?: string
  interestedProducts: number[]
  accountId?: number
  accountName?: string
  isPrimary: boolean
  emailOpens: number
  webVisits: number
  lastActivity?: string
  owner: string
  createdAt: string
  convertedFromLeadId?: number
  notes?: string
}

export interface OpportunityActivity {
  id: number
  type: "call" | "email" | "meeting" | "task" | "note"
  subject: string
  notes: string
  date: string
  time: string
  completed: boolean
  user: string
  createdAt: string
}

export interface OpportunityQuotation {
  id: number
  number: string
  status: "draft" | "pending_approval" | "approved" | "sent" | "accepted" | "rejected"
  total: number
  createdAt: string
  validUntil: string
}

export interface Opportunity {
  id: number
  name: string
  contactId: number
  contactName: string
  accountId?: number
  accountName?: string
  value: number
  closingDate: string
  stage: "qualification" | "proposal" | "negotiation" | "closed_won" | "closed_lost"
  hasNextActivity: boolean
  probability: number
  products: number[]
  owner: string
  source: string
  notes?: string
  createdAt: string
  activities: OpportunityActivity[]
  quotations: OpportunityQuotation[]
}

export interface QuotationLineItem {
  id: number
  productId: number
  productCode: string
  productName: string
  quantity: number
  unitPrice: number
  discount: number
  total: number
}

export interface Quotation {
  id: number
  number: string
  opportunityId: number
  opportunityName: string
  accountName: string
  contactName: string
  status: "draft" | "pending_approval" | "approved" | "sent" | "accepted" | "rejected"
  subtotal: number
  discountPercent: number
  discountAmount: number
  vatPercent: number
  vatAmount: number
  grandTotal: number
  createdAt: string
  validUntil: string
  notes?: string
  lineItems: QuotationLineItem[]
  createdBy: string
}
// หมายเหตุ: interface Quotation ใช้ createdAt (ISO timestamp) ตรงกับ DB `created_at`
// FE แสดงผลด้วย formatDate(createdAt) — ไม่มี createdDate แยก (derive ได้)

export interface Activity {
  id: number
  type: "call" | "email" | "meeting" | "task" | "note"
  subject: string
  notes: string
  relatedToId: number
  relatedToName: string
  relatedToType: "Lead" | "Contact" | "Account" | "Opportunity"
  activityDate: string
  activityTime: string
  completed: boolean
  completedDate?: string
  user: string
  createdAt: string
}

// ---------- Products ----------

export const mockProducts: Product[] = [
  {
    id: 1, code: "PRD-001", name: "ระบบ ERP Standard", category: "Software",
    description: "ระบบ ERP สำหรับองค์กรขนาดกลาง รองรับ 50 users",
    unitPrice: 500000, unit: "License", isActive: true,
    createdAt: "2024-01-01", updatedAt: "2024-03-15",
    images: [{ id: 1, name: "erp-screenshot.png", type: "image", url: "/images/erp.png", size: "2.5 MB", uploadedAt: "2024-01-01" }],
    catalogs: [{ id: 1, name: "ERP-Catalog-2024.pdf", type: "catalog", url: "/docs/catalog.pdf", size: "5.2 MB", uploadedAt: "2024-01-05" }],
    documents: [{ id: 1, name: "Technical-Spec.docx", type: "document", url: "/docs/spec.docx", size: "1.8 MB", uploadedAt: "2024-01-10" }],
  },
  {
    id: 2, code: "PRD-002", name: "ระบบ ERP Enterprise", category: "Software",
    description: "ระบบ ERP สำหรับองค์กรขนาดใหญ่ รองรับ Unlimited users",
    unitPrice: 1500000, unit: "License", isActive: true,
    createdAt: "2024-01-01", updatedAt: "2024-03-10",
    images: [], catalogs: [], documents: [],
  },
  {
    id: 3, code: "SVC-001", name: "บริการ Implementation", category: "Service",
    description: "บริการติดตั้งและ Setup ระบบ รวมการ Training",
    unitPrice: 200000, unit: "Project", isActive: true,
    createdAt: "2024-01-05", updatedAt: "2024-02-20",
    images: [], catalogs: [], documents: [],
  },
  {
    id: 4, code: "SVC-002", name: "บริการ Support รายปี", category: "Service",
    description: "บริการ Support และ Maintenance รายปี",
    unitPrice: 120000, unit: "Year", isActive: true,
    createdAt: "2024-01-05", updatedAt: "2024-01-05",
    images: [], catalogs: [], documents: [],
  },
  {
    id: 5, code: "PRD-003", name: "Module CRM", category: "Software",
    description: "Module CRM เพิ่มเติมสำหรับระบบ ERP",
    unitPrice: 150000, unit: "License", isActive: true,
    createdAt: "2024-02-01", updatedAt: "2024-02-01",
    images: [], catalogs: [], documents: [],
  },
  {
    id: 6, code: "HW-001", name: "Server HPE ProLiant", category: "Hardware",
    description: "Server สำหรับติดตั้งระบบ On-premise",
    unitPrice: 250000, unit: "Unit", isActive: true,
    createdAt: "2024-01-10", updatedAt: "2024-03-01",
    images: [], catalogs: [], documents: [],
  },
  {
    id: 7, code: "SVC-003", name: "บริการ Customization", category: "Service",
    description: "บริการพัฒนาระบบเพิ่มเติมตามความต้องการ",
    unitPrice: 15000, unit: "Man-day", isActive: true,
    createdAt: "2024-01-15", updatedAt: "2024-01-15",
    images: [], catalogs: [], documents: [],
  },
  {
    id: 8, code: "PRD-004", name: "Module HR", category: "Software",
    description: "Module HR & Payroll เพิ่มเติมสำหรับระบบ ERP",
    unitPrice: 180000, unit: "License", isActive: false,
    createdAt: "2024-02-01", updatedAt: "2024-02-15",
    images: [], catalogs: [], documents: [],
  },
]

// ---------- Accounts ----------

export const mockAccounts: Account[] = [
  {
    id: 1,
    name: "บริษัท ABC จำกัด",
    taxId: "0105561234567",
    industry: "Manufacturing",
    type: "Customer",
    website: "www.abc.co.th",
    phone: "02-123-4567",
    email: "info@abc.co.th",
    address: "123 อาคาร ABC ถนนสุขุมวิท กรุงเทพมหานคร 10110",
    lifetimeValue: 12500000,
    contacts: [
      { id: 1, name: "คุณสมชาย ใจดี", position: "ผู้จัดการฝ่ายจัดซื้อ", email: "somchai@abc.co.th", phone: "081-123-4567", isPrimary: true },
      { id: 2, name: "คุณวิภา รักงาน", position: "CFO", email: "wipa@abc.co.th", phone: "081-234-5678", isPrimary: false },
    ],
    opportunities: [
      { id: 1, name: "ERP Implementation - ABC", stage: "Proposal", value: 700000, expectedCloseDate: "2024-02-28", owner: "สมชาย ใจดี" },
      { id: 3, name: "CRM System - DFG", stage: "Negotiation", value: 150000, expectedCloseDate: "2024-02-10", owner: "สมชาย ใจดี" },
    ],
    quotations: 5,
    contracts: 2,
    owner: "สมชาย ใจดี",
    createdAt: "2024-01-01",
    description: "ลูกค้ารายใหญ่ในอุตสาหกรรมการผลิต ใช้ระบบ ERP มาตั้งแต่ปี 2023",
  },
  {
    id: 2,
    name: "บริษัท XYZ คอร์ปอเรชั่น",
    taxId: "0105567891234",
    industry: "Technology",
    type: "Customer",
    website: "www.xyz.com",
    phone: "02-234-5678",
    email: "contact@xyz.com",
    lifetimeValue: 8200000,
    contacts: [
      { id: 3, name: "คุณสมหญิง รักดี", position: "CTO", email: "somying@xyz.com", phone: "082-123-4567", isPrimary: true },
    ],
    opportunities: [
      { id: 2, name: "Cloud Migration - XYZ", stage: "Qualification", value: 1800000, expectedCloseDate: "2024-02-15", owner: "สมหญิง รักดี" },
      { id: 4, name: "Data Analytics Solution", stage: "Closed Won", value: 4500000, expectedCloseDate: "2024-01-30", owner: "สมหญิง รักดี" },
    ],
    quotations: 3,
    contracts: 1,
    owner: "สมหญิง รักดี",
    createdAt: "2024-01-15",
  },
  {
    id: 3,
    name: "บริษัท DFG อินเตอร์",
    taxId: "0105512345678",
    industry: "Retail",
    type: "Prospect",
    website: "www.dfg.co.th",
    phone: "02-345-6789",
    email: "sales@dfg.co.th",
    lifetimeValue: 0,
    contacts: [
      { id: 5, name: "คุณประภา ดีใจ", position: "Procurement Manager", email: "prapa@dfg.co.th", phone: "082-456-7890", isPrimary: true },
    ],
    opportunities: [],
    quotations: 2,
    contracts: 0,
    owner: "วิชัย สุขสันต์",
    createdAt: "2024-02-01",
  },
  {
    id: 4,
    name: "บริษัท LMN โซลูชั่น",
    industry: "Services",
    type: "Partner",
    website: "www.lmn.co.th",
    phone: "02-456-7890",
    lifetimeValue: 5000000,
    contacts: [
      { id: 6, name: "คุณอภิชาติ มั่นคง", position: "Partner Manager", email: "apichat@lmn.co.th", phone: "084-123-4567", isPrimary: true },
    ],
    opportunities: [],
    quotations: 0,
    contracts: 1,
    owner: "สมชาย ใจดี",
    createdAt: "2023-06-15",
  },
  {
    id: 5,
    name: "บริษัท HIJ เทรดดิ้ง",
    industry: "Retail",
    type: "Prospect",
    phone: "02-456-7890",
    email: "mana@hij.co.th",
    lifetimeValue: 0,
    contacts: [],
    opportunities: [],
    quotations: 0,
    contracts: 0,
    owner: "สมชาย ใจดี",
    createdAt: "2024-01-12",
  },
]

// ---------- Contacts ----------

export const mockContacts: Contact[] = [
  {
    id: 1,
    contactType: "company",
    firstName: "สมชาย",
    lastName: "ใจดี",
    title: "ผู้จัดการฝ่ายจัดซื้อ",
    department: "Procurement",
    email: "somchai@abc.co.th",
    phone: "02-123-4567 ext.101",
    mobile: "089-123-4567",
    address: "123 อาคาร ABC ถนนสุขุมวิท กทม. 10110",
    temperature: "Hot",
    source: "Lead Conversion",
    campaign: "Q1 2024 Promotion",
    interestedProducts: [1, 3],
    accountId: 1,
    accountName: "บริษัท ABC จำกัด",
    isPrimary: true,
    emailOpens: 24,
    webVisits: 15,
    lastActivity: "2024-01-15",
    owner: "สมชาย ใจดี",
    createdAt: "2024-01-01",
    convertedFromLeadId: 1,
    notes: "Convert จาก Lead - สนใจระบบ ERP",
  },
  {
    id: 2,
    contactType: "company",
    firstName: "วิภา",
    lastName: "รักงาน",
    title: "CFO",
    department: "Finance",
    email: "wipa@abc.co.th",
    mobile: "089-234-5678",
    temperature: "Warm",
    source: "Referral",
    interestedProducts: [2, 4],
    accountId: 1,
    accountName: "บริษัท ABC จำกัด",
    isPrimary: false,
    emailOpens: 12,
    webVisits: 8,
    lastActivity: "2024-01-14",
    owner: "สมชาย ใจดี",
    createdAt: "2024-01-05",
  },
  {
    id: 3,
    contactType: "company",
    firstName: "สมหญิง",
    lastName: "รักดี",
    title: "CTO",
    department: "IT",
    email: "somying@xyz.com",
    mobile: "081-234-5678",
    temperature: "Hot",
    source: "Trade Show",
    campaign: "Trade Show 2024",
    interestedProducts: [2],
    accountId: 2,
    accountName: "บริษัท XYZ คอร์ปอเรชั่น",
    isPrimary: true,
    emailOpens: 18,
    webVisits: 22,
    lastActivity: "2024-01-15",
    owner: "สมหญิง รักดี",
    createdAt: "2024-01-15",
    convertedFromLeadId: 2,
  },
  {
    id: 4,
    contactType: "individual",
    firstName: "วิชัย",
    lastName: "สุขสันต์",
    title: "เจ้าของธุรกิจ",
    email: "wichai@gmail.com",
    mobile: "082-345-6789",
    address: "456 ถนนพหลโยธิน กทม.",
    temperature: "Hot",
    source: "Lead Conversion",
    interestedProducts: [1, 5],
    isPrimary: true,
    emailOpens: 31,
    webVisits: 19,
    lastActivity: "2024-01-13",
    owner: "วิชัย สุขสันต์",
    createdAt: "2024-02-01",
    convertedFromLeadId: 3,
    notes: "เจ้าของธุรกิจ SME - Qualified Lead",
  },
  {
    id: 5,
    contactType: "company",
    firstName: "ประภา",
    lastName: "ดีใจ",
    title: "Procurement Manager",
    department: "Procurement",
    email: "prapa@dfg.co.th",
    mobile: "082-456-7890",
    temperature: "Cold",
    source: "Cold Call",
    interestedProducts: [],
    accountId: 3,
    accountName: "บริษัท DFG อินเตอร์",
    isPrimary: false,
    emailOpens: 8,
    webVisits: 5,
    lastActivity: "2024-01-10",
    owner: "วิชัย สุขสันต์",
    createdAt: "2024-02-05",
  },
  {
    id: 6,
    contactType: "company",
    firstName: "อภิชาติ",
    lastName: "มั่นคง",
    title: "Partner Manager",
    department: "Partnerships",
    email: "apichat@lmn.co.th",
    mobile: "084-123-4567",
    temperature: "Warm",
    source: "Partner",
    interestedProducts: [3, 4],
    accountId: 4,
    accountName: "บริษัท LMN โซลูชั่น",
    isPrimary: true,
    emailOpens: 10,
    webVisits: 6,
    lastActivity: "2024-01-12",
    owner: "สมชาย ใจดี",
    createdAt: "2023-06-15",
  },
]

// ---------- Leads ----------

export const mockLeads: Lead[] = [
  {
    id: 1,
    leadType: "company",
    companyName: "บริษัท เอบีซี จำกัด",
    taxId: "0105561234567",
    contactFirstName: "สมชาย",
    contactLastName: "ใจดี",
    contactPosition: "ผู้จัดการฝ่ายจัดซื้อ",
    email: "somchai@abc.co.th",
    phone: "02-123-4567",
    mobile: "089-123-4567",
    address: "123 อาคาร ABC ถนนสุขุมวิท กทม. 10110",
    status: "New",
    source: "Website",
    grade: "A",
    temperature: "Hot",
    campaign: "Q1 2024 Promotion",
    interestedProducts: [1, 3],
    score: 85,
    contactDate: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
    slaHours: 2,
    assignedTo: "สมชาย ใจดี",
    createdAt: "2024-01-15 09:30",
    isDuplicate: false,
    notes: "ลูกค้าติดต่อมาทางเว็บไซต์ สนใจระบบ ERP สำหรับบริษัท",
  },
  {
    id: 2,
    leadType: "company",
    companyName: "บริษัท XYZ คอร์ปอเรชั่น",
    taxId: "0105567891234",
    contactFirstName: "สมหญิง",
    contactLastName: "รักดี",
    contactPosition: "CFO",
    email: "somying@xyz.com",
    phone: "02-234-5678",
    mobile: "081-234-5678",
    status: "Working",
    source: "Referral",
    grade: "B",
    temperature: "Warm",
    campaign: "Trade Show 2024",
    interestedProducts: [2, 4],
    score: 72,
    contactDate: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() + 19 * 60 * 60 * 1000).toISOString(),
    slaHours: 24,
    assignedTo: "สมหญิง รักดี",
    createdAt: "2024-01-14 14:20",
    isDuplicate: false,
  },
  {
    id: 3,
    leadType: "individual",
    firstName: "วิชัย",
    lastName: "สุขสันต์",
    email: "wichai@gmail.com",
    phone: "082-345-6789",
    status: "Qualified",
    source: "Trade Show",
    grade: "A",
    temperature: "Hot",
    interestedProducts: [1, 5],
    score: 91,
    contactDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
    slaHours: 24,
    assignedTo: "วิชัย สุขสันต์",
    createdAt: "2024-01-13 10:00",
    isDuplicate: false,
    notes: "เจ้าของธุรกิจ SME ต้องการระบบจัดการสต็อกและลูกค้า",
  },
  {
    id: 4,
    leadType: "company",
    companyName: "บริษัท HIJ เทรดดิ้ง",
    contactFirstName: "มานะ",
    contactLastName: "ทำดี",
    contactPosition: "IT Manager",
    email: "mana@hij.co.th",
    phone: "02-456-7890",
    mobile: "083-456-7890",
    status: "Unqualified",
    source: "Cold Call",
    grade: "D",
    temperature: "Cold",
    interestedProducts: [],
    score: 35,
    contactDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    slaHours: 24,
    assignedTo: "สมชาย ใจดี",
    createdAt: "2024-01-12 16:45",
    isDuplicate: false,
    notes: "งบประมาณไม่เพียงพอ รอปีหน้า",
    disqualifyReason: "งบประมาณไม่เพียงพอ",
  },
  {
    id: 5,
    leadType: "individual",
    firstName: "สมชาย",
    lastName: "ใจดี",
    email: "somchai.j@gmail.com",
    phone: "089-123-4567",
    status: "New",
    source: "LinkedIn",
    grade: "B",
    temperature: "Warm",
    interestedProducts: [1],
    score: 78,
    contactDate: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    slaHours: 2,
    assignedTo: "สมหญิง รักดี",
    createdAt: "2024-01-15 11:00",
    isDuplicate: true,
    duplicateOf: 1,
    notes: "เบอร์โทรซ้ำกับ Lead ID 1",
  },
  {
    id: 6,
    leadType: "company",
    companyName: "บริษัท DFG อินเตอร์",
    contactFirstName: "ประภา",
    contactLastName: "ดีใจ",
    contactPosition: "Procurement Manager",
    email: "prapa@dfg.co.th",
    phone: "02-345-6789",
    mobile: "082-456-7890",
    status: "Working",
    source: "Cold Call",
    grade: "C",
    temperature: "Cold",
    interestedProducts: [5],
    score: 55,
    contactDate: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() + 14 * 60 * 60 * 1000).toISOString(),
    slaHours: 24,
    assignedTo: "วิชัย สุขสันต์",
    createdAt: "2024-02-05 09:00",
    isDuplicate: false,
  },
]

// ---------- Opportunities ----------

export const mockOpportunities: Opportunity[] = [
  {
    id: 1,
    name: "ERP Implementation - ABC",
    contactId: 1,
    contactName: "สมชาย ใจดี",
    accountId: 1,
    accountName: "บริษัท ABC จำกัด",
    value: 700000,
    closingDate: "2024-02-28",
    stage: "proposal",
    hasNextActivity: true,
    probability: 50,
    products: [1, 3],
    owner: "สมชาย ใจดี",
    source: "Lead Conversion",
    createdAt: "2024-01-15",
    notes: "Convert จาก Lead - ต้องการระบบ ERP Standard พร้อม Implementation",
    activities: [
      { id: 1, type: "call", subject: "โทรติดตามความต้องการ", notes: "ลูกค้าสนใจ ขอนัด Demo", date: "2024-01-20", time: "10:00", completed: true, user: "สมชาย ใจดี", createdAt: "2024-01-20" },
      { id: 2, type: "meeting", subject: "Demo ระบบ ERP", notes: "Demo สำเร็จ ลูกค้าพอใจ", date: "2024-01-25", time: "14:00", completed: true, user: "สมชาย ใจดี", createdAt: "2024-01-25" },
      { id: 3, type: "email", subject: "ส่งใบเสนอราคา", notes: "ส่ง Quotation Q2024-0051", date: "2024-01-28", time: "09:00", completed: true, user: "สมชาย ใจดี", createdAt: "2024-01-28" },
    ],
    quotations: [
      { id: 1, number: "Q2024-0051", status: "sent", total: 700000, createdAt: "2024-01-28", validUntil: "2024-02-28" },
    ],
  },
  {
    id: 2,
    name: "Cloud Migration - XYZ",
    contactId: 3,
    contactName: "สมหญิง รักดี",
    accountId: 2,
    accountName: "บริษัท XYZ คอร์ปอเรชั่น",
    value: 1800000,
    closingDate: "2024-02-15",
    stage: "qualification",
    hasNextActivity: false,
    probability: 25,
    products: [2, 4],
    owner: "สมหญิง รักดี",
    source: "Trade Show",
    createdAt: "2024-01-10",
    activities: [
      { id: 1, type: "meeting", subject: "พบลูกค้าที่งาน Trade Show", notes: "สนใจระบบ Cloud", date: "2024-01-10", time: "11:00", completed: true, user: "สมหญิง รักดี", createdAt: "2024-01-10" },
    ],
    quotations: [],
  },
  {
    id: 3,
    name: "CRM System - DFG",
    contactId: 2,
    contactName: "วิภา รักงาน",
    accountId: 1,
    accountName: "บริษัท ABC จำกัด",
    value: 150000,
    closingDate: "2024-02-10",
    stage: "negotiation",
    hasNextActivity: true,
    probability: 75,
    products: [5],
    owner: "สมชาย ใจดี",
    source: "Referral",
    createdAt: "2024-01-08",
    activities: [
      { id: 1, type: "call", subject: "รับ Referral จากลูกค้า", notes: "ลูกค้าแนะนำบริษัทในเครือ", date: "2024-01-08", time: "09:30", completed: true, user: "สมชาย ใจดี", createdAt: "2024-01-08" },
      { id: 2, type: "meeting", subject: "นำเสนอ CRM", notes: "เข้าพบ Demo ระบบ", date: "2024-01-15", time: "14:00", completed: true, user: "สมชาย ใจดี", createdAt: "2024-01-15" },
      { id: 3, type: "email", subject: "ส่ง Quotation ครั้งที่ 1", notes: "เสนอราคา 180,000 บาท", date: "2024-01-18", time: "10:00", completed: true, user: "สมชาย ใจดี", createdAt: "2024-01-18" },
      { id: 4, type: "call", subject: "ต่อรองราคา", notes: "ลูกค้าขอส่วนลด ตกลงที่ 150,000", date: "2024-01-22", time: "11:00", completed: true, user: "สมชาย ใจดี", createdAt: "2024-01-22" },
    ],
    quotations: [
      { id: 1, number: "Q2024-0048", status: "rejected", total: 180000, createdAt: "2024-01-18", validUntil: "2024-02-18" },
      { id: 2, number: "Q2024-0052", status: "pending_approval", total: 150000, createdAt: "2024-01-23", validUntil: "2024-02-23" },
    ],
  },
  {
    id: 4,
    name: "Data Analytics Solution",
    contactId: 3,
    contactName: "สมหญิง รักดี",
    accountId: 2,
    accountName: "บริษัท XYZ คอร์ปอเรชั่น",
    value: 4500000,
    closingDate: "2024-01-30",
    stage: "closed_won",
    hasNextActivity: false,
    probability: 100,
    products: [2],
    owner: "สมหญิง รักดี",
    source: "Website",
    createdAt: "2023-12-01",
    activities: [],
    quotations: [
      { id: 1, number: "Q2023-0150", status: "accepted", total: 4500000, createdAt: "2023-12-15", validUntil: "2024-01-15" },
    ],
  },
  {
    id: 5,
    name: "ERP + CRM Bundle - วิชัย",
    contactId: 4,
    contactName: "วิชัย สุขสันต์",
    value: 650000,
    closingDate: "2024-03-10",
    stage: "qualification",
    hasNextActivity: true,
    probability: 25,
    products: [1, 5],
    owner: "วิชัย สุขสันต์",
    source: "Lead Conversion",
    createdAt: "2024-02-01",
    activities: [],
    quotations: [],
  },
]

// ---------- Quotations ----------

export const mockQuotations: Quotation[] = [
  {
    id: 1,
    number: "Q2024-0051",
    opportunityId: 1,
    opportunityName: "ERP Implementation - ABC",
    accountName: "บริษัท ABC จำกัด",
    contactName: "คุณสมชาย ใจดี",
    status: "sent",
    subtotal: 700000,
    discountPercent: 0,
    discountAmount: 0,
    vatPercent: 7,
    vatAmount: 49000,
    grandTotal: 749000,
    createdAt: "2024-01-28",
    validUntil: "2024-02-28",
    notes: "ใบเสนอราคาสำหรับระบบ ERP Standard พร้อม Implementation",
    lineItems: [
      { id: 1, productId: 1, productCode: "PRD-001", productName: "ระบบ ERP Standard", quantity: 1, unitPrice: 500000, discount: 0, total: 500000 },
      { id: 2, productId: 3, productCode: "SVC-001", productName: "บริการ Implementation", quantity: 1, unitPrice: 200000, discount: 0, total: 200000 },
    ],
    createdBy: "สมชาย ใจดี",
  },
  {
    id: 2,
    number: "Q2024-0050",
    opportunityId: 2,
    opportunityName: "Cloud Migration - XYZ",
    accountName: "บริษัท XYZ คอร์ปอเรชั่น",
    contactName: "คุณสมหญิง รักดี",
    status: "pending_approval",
    subtotal: 1800000,
    discountPercent: 5,
    discountAmount: 90000,
    vatPercent: 7,
    vatAmount: 119700,
    grandTotal: 1829700,
    createdAt: "2024-01-25",
    validUntil: "2024-02-25",
    lineItems: [
      { id: 1, productId: 2, productCode: "PRD-002", productName: "ระบบ ERP Enterprise", quantity: 1, unitPrice: 1500000, discount: 5, total: 1425000 },
      { id: 2, productId: 4, productCode: "SVC-002", productName: "บริการ Support รายปี", quantity: 2, unitPrice: 120000, discount: 5, total: 228000 },
    ],
    createdBy: "สมหญิง รักดี",
  },
  {
    id: 3,
    number: "Q2024-0048",
    opportunityId: 3,
    opportunityName: "CRM System - DFG",
    accountName: "บริษัท ABC จำกัด",
    contactName: "คุณวิภา รักงาน",
    status: "rejected",
    subtotal: 180000,
    discountPercent: 0,
    discountAmount: 0,
    vatPercent: 7,
    vatAmount: 12600,
    grandTotal: 192600,
    createdAt: "2024-01-18",
    validUntil: "2024-02-18",
    lineItems: [
      { id: 1, productId: 5, productCode: "PRD-003", productName: "Module CRM", quantity: 1, unitPrice: 150000, discount: 0, total: 150000 },
      { id: 2, productId: 4, productCode: "SVC-002", productName: "บริการ Support รายปี", quantity: 1, unitPrice: 30000, discount: 0, total: 30000 },
    ],
    createdBy: "สมชาย ใจดี",
  },
  {
    id: 4,
    number: "Q2024-0052",
    opportunityId: 3,
    opportunityName: "CRM System - DFG",
    accountName: "บริษัท ABC จำกัด",
    contactName: "คุณวิภา รักงาน",
    status: "approved",
    subtotal: 150000,
    discountPercent: 0,
    discountAmount: 0,
    vatPercent: 7,
    vatAmount: 10500,
    grandTotal: 160500,
    createdAt: "2024-01-23",
    validUntil: "2024-02-23",
    notes: "ใบเสนอราคาปรับปรุงตามที่ลูกค้าต่อรอง",
    lineItems: [
      { id: 1, productId: 5, productCode: "PRD-003", productName: "Module CRM", quantity: 1, unitPrice: 150000, discount: 0, total: 150000 },
    ],
    createdBy: "สมชาย ใจดี",
  },
  {
    id: 5,
    number: "Q2023-0150",
    opportunityId: 4,
    opportunityName: "Data Analytics Solution",
    accountName: "บริษัท XYZ คอร์ปอเรชั่น",
    contactName: "คุณสมหญิง รักดี",
    status: "accepted",
    subtotal: 4500000,
    discountPercent: 10,
    discountAmount: 450000,
    vatPercent: 7,
    vatAmount: 283500,
    grandTotal: 4333500,
    createdAt: "2023-12-15",
    validUntil: "2024-01-15",
    lineItems: [
      { id: 1, productId: 2, productCode: "PRD-002", productName: "ระบบ ERP Enterprise", quantity: 3, unitPrice: 1500000, discount: 10, total: 4050000 },
    ],
    createdBy: "สมหญิง รักดี",
  },
]

// Simplified opportunity summary (used by Quotations picker).
export const mockOpportunitySummaries = mockOpportunities.map((o) => ({
  id: o.id,
  name: o.name,
  accountName: o.accountName,
  contactName: o.contactName,
  value: o.value,
  stage: o.stage,
}))

// ---------- Activities ----------

export const mockActivities: Activity[] = [
  {
    id: 1,
    type: "call",
    subject: "โทรติดตาม ERP Project",
    notes: "ลูกค้าสนใจ ขอนัดประชุมอาทิตย์หน้า",
    relatedToId: 1,
    relatedToName: "ERP Implementation - ABC",
    relatedToType: "Opportunity",
    activityDate: "2024-01-15",
    activityTime: "10:00",
    completed: true,
    completedDate: "2024-01-15",
    user: "สมชาย ใจดี",
    createdAt: "2024-01-15",
  },
  {
    id: 2,
    type: "meeting",
    subject: "นัดพบนำเสนอ Solution",
    notes: "เตรียม Demo ระบบ CRM ให้ลูกค้าดู พร้อมเอกสารประกอบ",
    relatedToId: 2,
    relatedToName: "Cloud Migration - XYZ",
    relatedToType: "Opportunity",
    activityDate: "2024-01-18",
    activityTime: "14:00",
    completed: false,
    user: "สมหญิง รักดี",
    createdAt: "2024-01-14",
  },
  {
    id: 3,
    type: "email",
    subject: "ส่งใบเสนอราคา Cloud Migration",
    notes: "Quote #Q2024-0050 มูลค่า 1.8M ส่งพร้อม Proposal",
    relatedToId: 2,
    relatedToName: "Cloud Migration - XYZ",
    relatedToType: "Opportunity",
    activityDate: "2024-01-15",
    activityTime: "11:30",
    completed: true,
    completedDate: "2024-01-15",
    user: "สมหญิง รักดี",
    createdAt: "2024-01-15",
  },
  {
    id: 4,
    type: "task",
    subject: "เตรียมเอกสาร Proposal",
    notes: "ต้องส่งภายในวันศุกร์นี้ รวม Technical Spec และ Timeline",
    relatedToId: 1,
    relatedToName: "สมชาย ใจดี",
    relatedToType: "Lead",
    activityDate: "2024-01-16",
    activityTime: "09:00",
    completed: false,
    user: "วิชัย สุขสันต์",
    createdAt: "2024-01-14",
  },
  {
    id: 5,
    type: "note",
    subject: "บันทึกการพูดคุย",
    notes: "ลูกค้าสอบถามเรื่องราคาและเงื่อนไขการชำระเงิน ต้องการแบ่งจ่าย 3 งวด จะส่ง Payment Term ให้พิจารณา",
    relatedToId: 1,
    relatedToName: "บริษัท ABC จำกัด",
    relatedToType: "Account",
    activityDate: "2024-01-14",
    activityTime: "16:45",
    completed: true,
    completedDate: "2024-01-14",
    user: "สมชาย ใจดี",
    createdAt: "2024-01-14",
  },
  {
    id: 6,
    type: "call",
    subject: "Follow up หลังส่ง Quotation",
    notes: "ลูกค้ารับเอกสารแล้ว กำลังพิจารณา จะติดต่อกลับภายในสัปดาห์นี้",
    relatedToId: 2,
    relatedToName: "วิภา รักงาน",
    relatedToType: "Contact",
    activityDate: "2024-01-17",
    activityTime: "10:30",
    completed: false,
    user: "สมชาย ใจดี",
    createdAt: "2024-01-16",
  },
]

// Related-item index used by Activities module for dropdowns.
export const mockRelatedItems = [
  { id: 1, name: "สมชาย ใจดี", type: "Lead" as const },
  { id: 1, name: "บริษัท ABC จำกัด", type: "Account" as const },
  { id: 1, name: "ERP Implementation - ABC", type: "Opportunity" as const },
  { id: 2, name: "วิภา รักงาน", type: "Contact" as const },
  { id: 2, name: "Cloud Migration - XYZ", type: "Opportunity" as const },
  { id: 3, name: "สมหญิง รักดี", type: "Contact" as const },
]

// ---------- Dashboard ----------

export const mockDashboardStats: DashboardStat[] = [
  { name: "Total Leads", value: "2,847", change: "+12.5%", trend: "up", iconName: "Users" },
  { name: "Open Opportunities", value: "156", change: "+8.2%", trend: "up", iconName: "Target" },
  { name: "Pipeline Value", value: "฿24.5M", change: "+15.3%", trend: "up", iconName: "DollarSign" },
  { name: "Win Rate", value: "68%", change: "-2.4%", trend: "down", iconName: "TrendingUp" },
]

// Dashboard "recent leads" mini-view, derived from mockLeads.
export const mockRecentLeads = mockLeads.slice(0, 3).map((l) => ({
  id: l.id,
  name: l.leadType === "company" ? (l.companyName ?? "") : `${l.firstName ?? ""} ${l.lastName ?? ""}`.trim(),
  contact: l.leadType === "company"
    ? `คุณ${l.contactFirstName ?? ""}`
    : `คุณ${l.firstName ?? ""}`,
  status: l.status,
  source: l.source,
  slaRemaining: l.slaHours >= 24 ? `${Math.round(l.slaHours / 24)} วัน` : `${l.slaHours} ชม.`,
  score: l.score,
}))
