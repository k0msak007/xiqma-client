"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Search,
  Filter,
  Plus,
  Phone,
  Mail,
  Calendar,
  MoreVertical,
  Clock,
  Building2,
  User,
  ArrowRight,
  X,
  AlertTriangle,
  Check,
  XCircle,
  UserPlus,
  MessageSquare,
  FileText,
  Package,
  Copy,
  ChevronLeft,
  ChevronRight,
  Megaphone,
  Star,
  RefreshCw,
  Edit,
  Trash2,
  Flame,
  Thermometer,
  Snowflake,
  CalendarDays,
  Timer,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

// Types
interface Lead {
  id: number
  leadType: "individual" | "company"
  // Individual fields
  firstName?: string
  lastName?: string
  // Company fields
  companyName?: string
  taxId?: string
  contactFirstName?: string
  contactLastName?: string
  contactPosition?: string
  // Common fields
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
  // SLA fields
  contactDate: string // วันที่ Lead ติดต่อมา
  dueDate: string // Due date ตาม SLA
  slaHours: number // จำนวนชั่วโมง SLA ที่กำหนด
  // Other fields
  assignedTo: string
  createdAt: string
  isDuplicate: boolean
  duplicateOf?: number
  notes?: string
  disqualifyReason?: string
}

interface Activity {
  id: number
  type: string
  title: string
  description: string
  date: string
  createdBy: string
}

interface Product {
  id: number
  code: string
  name: string
  category: string
  unitPrice: number
}

// Mock Data
import { mockProducts, mockLeads as sharedMockLeads, mockActivities as sharedMockActivities } from "@/lib/crm-mock"
const products: Product[] = mockProducts as Product[]

const salesTeam = [
  { id: 1, name: "สมชาย ใจดี", role: "Sales" },
  { id: 2, name: "สมหญิง รักดี", role: "Sales" },
  { id: 3, name: "วิชัย สุขสันต์", role: "Sales" },
  { id: 4, name: "ประภา ดีใจ", role: "Manager" },
]

const leadSources = ["Website", "Referral", "Trade Show", "Cold Call", "Social Media", "LinkedIn", "Partner", "Advertisement"]
const leadGrades = ["A", "B", "C", "D"]
const leadTemperatures = ["Hot", "Warm", "Cold"]
const campaigns = ["Q1 2024 Promotion", "Trade Show 2024", "Summer Sale", "Year End Campaign"]
const activityTypes = ["โทรศัพท์", "อีเมล", "นัดพบ", "Demo", "ส่งเอกสาร", "บันทึกทั่วไป"]
const disqualifyReasons = [
  "งบประมาณไม่เพียงพอ",
  "ไม่ใช่ผู้มีอำนาจตัดสินใจ",
  "ไม่มีความต้องการ",
  "ใช้คู่แข่งอยู่แล้ว",
  "ติดต่อไม่ได้",
  "อื่นๆ",
]

// Helper functions for SLA calculation
const calculateSLAStatus = (contactDate: string, slaHours: number) => {
  const contact = new Date(contactDate)
  const now = new Date()
  const elapsedMs = now.getTime() - contact.getTime()
  const elapsedHours = elapsedMs / (1000 * 60 * 60)
  const remainingHours = slaHours - elapsedHours
  
  return {
    elapsedHours: Math.round(elapsedHours * 10) / 10,
    remainingHours: Math.round(remainingHours * 10) / 10,
    isOverdue: remainingHours < 0,
    isCritical: remainingHours >= 0 && remainingHours <= 1, // Less than 1 hour remaining
  }
}

const formatSLATime = (hours: number) => {
  if (Math.abs(hours) < 1) {
    const minutes = Math.round(Math.abs(hours) * 60)
    return `${hours < 0 ? "-" : ""}${minutes} นาที`
  }
  if (Math.abs(hours) < 24) {
    return `${hours < 0 ? "-" : ""}${Math.abs(Math.round(hours * 10) / 10)} ชม.`
  }
  const days = Math.round(Math.abs(hours) / 24 * 10) / 10
  return `${hours < 0 ? "-" : ""}${days} วัน`
}

const initialLeads: Lead[] = sharedMockLeads as unknown as Lead[]


const mockActivities: Activity[] = [
  {
    id: 1,
    type: "โทรศัพท์",
    title: "โทรติดตาม",
    description: "โทรสอบถามความสนใจเพิ่มเติม ลูกค้าขอให้ส่งใบเสนอราคา",
    date: "2024-01-15 10:30",
    createdBy: "สมชาย ใจดี",
  },
  {
    id: 2,
    type: "อีเมล",
    title: "ส่งข้อมูลสินค้า",
    description: "ส่ง Brochure และ Price List ตามที่ลูกค้าขอ",
    date: "2024-01-14 14:00",
    createdBy: "สมชาย ใจดี",
  },
  {
    id: 3,
    type: "นัดพบ",
    title: "นัด Demo",
    description: "นัด Demo ระบบ ERP ที่ออฟฟิศลูกค้า",
    date: "2024-01-16 14:00",
    createdBy: "วิชัย สุขสันต์",
  },
]

const statusFilters = ["All", "New", "Working", "Qualified", "Unqualified"]

const getStatusColor = (status: string) => {
  switch (status) {
    case "New":
      return "bg-status-new text-white"
    case "Working":
      return "bg-status-working text-black"
    case "Qualified":
      return "bg-status-qualified text-white"
    case "Unqualified":
      return "bg-status-unqualified text-white"
    default:
      return "bg-muted text-muted-foreground"
  }
}

const getScoreColor = (score: number) => {
  if (score >= 80) return "text-status-qualified"
  if (score >= 50) return "text-status-working"
  return "text-status-unqualified"
}

const getGradeColor = (grade: string) => {
  switch (grade) {
    case "A":
      return "bg-status-qualified/20 text-status-qualified"
    case "B":
      return "bg-status-working/20 text-status-working"
    case "C":
      return "bg-muted text-muted-foreground"
    case "D":
      return "bg-destructive/20 text-destructive"
    default:
      return "bg-muted text-muted-foreground"
  }
}

const getTemperatureIcon = (temp: string) => {
  switch (temp) {
    case "Hot":
      return Flame
    case "Warm":
      return Thermometer
    case "Cold":
      return Snowflake
    default:
      return Thermometer
  }
}

const getTemperatureColor = (temp: string) => {
  switch (temp) {
    case "Hot":
      return "text-red-500 bg-red-500/20"
    case "Warm":
      return "text-amber-500 bg-amber-500/20"
    case "Cold":
      return "text-blue-400 bg-blue-400/20"
    default:
      return "text-muted-foreground bg-muted"
  }
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case "โทรศัพท์":
      return Phone
    case "อีเมล":
      return Mail
    case "นัดพบ":
    case "Demo":
      return Calendar
    case "ส่งเอกสาร":
      return FileText
    default:
      return MessageSquare
  }
}

export function Leads() {
  const [leads, setLeads] = useState(initialLeads)
  const [selectedStatus, setSelectedStatus] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  
  // Advanced filters
  const [filterTemperature, setFilterTemperature] = useState<string>("All")
  const [filterGrade, setFilterGrade] = useState<string>("All")
  const [filterSource, setFilterSource] = useState<string>("All")
  const [filterCampaign, setFilterCampaign] = useState<string>("All")
  const [filterAssignedTo, setFilterAssignedTo] = useState<string>("All")
  const [filterSLAStatus, setFilterSLAStatus] = useState<string>("All") // All, Overdue, Critical, Normal
  const [filterDateFrom, setFilterDateFrom] = useState<string>("")
  const [filterDateTo, setFilterDateTo] = useState<string>("")
  
  // Dialogs
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false)
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false)
  const [isReassignDialogOpen, setIsReassignDialogOpen] = useState(false)
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false)
  const [isDisqualifyDialogOpen, setIsDisqualifyDialogOpen] = useState(false)
  
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [activities, setActivities] = useState(mockActivities)

  // Form states
  const [newLead, setNewLead] = useState<Partial<Lead>>({
    leadType: "company",
    status: "New",
    source: "",
    grade: "B",
    temperature: "Warm",
    interestedProducts: [],
    score: 50,
    slaHours: 2,
    assignedTo: salesTeam[0].name,
    isDuplicate: false,
  })

  const [editLead, setEditLead] = useState<Lead | null>(null)

  const [newActivity, setNewActivity] = useState({
    type: "โทรศัพท์",
    title: "",
    description: "",
    activityDate: new Date().toISOString().slice(0, 16),
  })

  const [reassignTo, setReassignTo] = useState("")
  const [convertOptions, setConvertOptions] = useState({
    createContact: true,
    createOpportunity: true,
    opportunityName: "",
    opportunityValue: 0,
  })
  const [disqualifyReason, setDisqualifyReason] = useState("")
  const [disqualifyReasonOther, setDisqualifyReasonOther] = useState("")

  const filteredLeads = leads.filter((lead) => {
    // Status filter
    const matchesStatus = selectedStatus === "All" || lead.status === selectedStatus
    
    // Search filter
    const searchLower = searchQuery.toLowerCase()
    const matchesSearch =
      (lead.companyName?.toLowerCase().includes(searchLower)) ||
      (lead.firstName?.toLowerCase().includes(searchLower)) ||
      (lead.lastName?.toLowerCase().includes(searchLower)) ||
      (lead.contactFirstName?.toLowerCase().includes(searchLower)) ||
      (lead.contactLastName?.toLowerCase().includes(searchLower)) ||
      lead.email.toLowerCase().includes(searchLower) ||
      lead.phone.includes(searchQuery)
    
    // Advanced filters
    const matchesTemperature = filterTemperature === "All" || lead.temperature === filterTemperature
    const matchesGrade = filterGrade === "All" || lead.grade === filterGrade
    const matchesSource = filterSource === "All" || lead.source === filterSource
    const matchesCampaign = filterCampaign === "All" || lead.campaign === filterCampaign
    const matchesAssignedTo = filterAssignedTo === "All" || lead.assignedTo === filterAssignedTo
    
    // SLA Status filter
    let matchesSLA = true
    if (filterSLAStatus !== "All" && lead.status !== "Qualified" && lead.status !== "Unqualified") {
      const slaStatus = calculateSLAStatus(lead.contactDate, lead.slaHours)
      if (filterSLAStatus === "Overdue") {
        matchesSLA = slaStatus.isOverdue
      } else if (filterSLAStatus === "Critical") {
        matchesSLA = slaStatus.isCritical && !slaStatus.isOverdue
      } else if (filterSLAStatus === "Normal") {
        matchesSLA = !slaStatus.isOverdue && !slaStatus.isCritical
      }
    }
    
    // Date filter
    let matchesDate = true
    if (filterDateFrom) {
      const leadDate = new Date(lead.contactDate)
      const fromDate = new Date(filterDateFrom)
      matchesDate = leadDate >= fromDate
    }
    if (filterDateTo && matchesDate) {
      const leadDate = new Date(lead.contactDate)
      const toDate = new Date(filterDateTo)
      toDate.setHours(23, 59, 59)
      matchesDate = leadDate <= toDate
    }
    
    return matchesStatus && matchesSearch && matchesTemperature && matchesGrade && 
           matchesSource && matchesCampaign && matchesAssignedTo && matchesSLA && matchesDate
  })

  const clearFilters = () => {
    setFilterTemperature("All")
    setFilterGrade("All")
    setFilterSource("All")
    setFilterCampaign("All")
    setFilterAssignedTo("All")
    setFilterSLAStatus("All")
    setFilterDateFrom("")
    setFilterDateTo("")
  }

  const hasActiveFilters = filterTemperature !== "All" || filterGrade !== "All" || 
    filterSource !== "All" || filterCampaign !== "All" || filterAssignedTo !== "All" ||
    filterSLAStatus !== "All" || filterDateFrom !== "" || filterDateTo !== ""

  const getLeadName = (lead: Lead) => {
    if (lead.leadType === "company") {
      return lead.companyName || ""
    }
    return `${lead.firstName || ""} ${lead.lastName || ""}`.trim()
  }

  const getContactName = (lead: Lead) => {
    if (lead.leadType === "company") {
      return `${lead.contactFirstName || ""} ${lead.contactLastName || ""}`.trim()
    }
    return getLeadName(lead)
  }

  const checkDuplicate = (phone: string, firstName?: string, lastName?: string): Lead | undefined => {
    return leads.find((lead) => {
      if (lead.phone === phone || lead.mobile === phone) return true
      if (firstName && lastName) {
        if (lead.leadType === "individual") {
          return lead.firstName === firstName && lead.lastName === lastName
        }
        return lead.contactFirstName === firstName && lead.contactLastName === lastName
      }
      return false
    })
  }

  const handleAddLead = () => {
    // Check for duplicates
    const phone = newLead.phone || ""
    const firstName = newLead.leadType === "individual" ? newLead.firstName : newLead.contactFirstName
    const lastName = newLead.leadType === "individual" ? newLead.lastName : newLead.contactLastName
    
    const duplicateLead = checkDuplicate(phone, firstName, lastName)
    
    if (duplicateLead) {
      setSelectedLead(duplicateLead)
      setIsDuplicateDialogOpen(true)
      return
    }

    const now = new Date()
    const slaHours = newLead.slaHours || 2
    const dueDate = new Date(now.getTime() + slaHours * 60 * 60 * 1000)

    const lead: Lead = {
      id: Date.now(),
      leadType: newLead.leadType || "company",
      firstName: newLead.firstName,
      lastName: newLead.lastName,
      companyName: newLead.companyName,
      taxId: newLead.taxId,
      contactFirstName: newLead.contactFirstName,
      contactLastName: newLead.contactLastName,
      contactPosition: newLead.contactPosition,
      email: newLead.email || "",
      phone: newLead.phone || "",
      mobile: newLead.mobile,
      address: newLead.address,
      status: "New",
      source: newLead.source || "",
      grade: newLead.grade || "B",
      temperature: newLead.temperature || "Warm",
      campaign: newLead.campaign,
      interestedProducts: newLead.interestedProducts || [],
      score: newLead.score || 50,
      contactDate: now.toISOString(),
      dueDate: dueDate.toISOString(),
      slaHours: slaHours,
      assignedTo: newLead.assignedTo || salesTeam[0].name,
      createdAt: now.toISOString().replace("T", " ").substring(0, 16),
      isDuplicate: false,
      notes: newLead.notes,
    }

    setLeads([lead, ...leads])
    setIsAddDialogOpen(false)
    resetNewLead()
  }

  const resetNewLead = () => {
    setNewLead({
      leadType: "company",
      status: "New",
      source: "",
      grade: "B",
      temperature: "Warm",
      interestedProducts: [],
      score: 50,
      slaHours: 2,
      assignedTo: salesTeam[0].name,
      isDuplicate: false,
    })
  }

  const handleEditLead = () => {
    if (!editLead) return
    setLeads(leads.map((l) => l.id === editLead.id ? editLead : l))
    setIsEditDialogOpen(false)
    setEditLead(null)
    // Update selected lead if in detail view
    if (selectedLead?.id === editLead.id) {
      setSelectedLead(editLead)
    }
  }

  const openEditDialog = (lead: Lead) => {
    setEditLead({ ...lead })
    setIsEditDialogOpen(true)
  }

  const handleAddProductToLead = (productId: number) => {
    if (!editLead) return
    if (!editLead.interestedProducts.includes(productId)) {
      setEditLead({ ...editLead, interestedProducts: [...editLead.interestedProducts, productId] })
    }
  }

  const handleRemoveProductFromLead = (productId: number) => {
    if (!editLead) return
    setEditLead({ ...editLead, interestedProducts: editLead.interestedProducts.filter(id => id !== productId) })
  }

  const handleQualify = (lead: Lead) => {
    // Mark lead as Qualified
    setLeads(leads.map((l) => l.id === lead.id ? { ...l, status: "Qualified" } : l))
    
    // Auto-open convert dialog to create Contact and Opportunity
    setSelectedLead(lead)
    const totalProductValue = lead.interestedProducts.reduce((sum, pid) => {
      const product = products.find(p => p.id === pid)
      return sum + (product?.unitPrice || 0)
    }, 0)
    setConvertOptions({
      createContact: true,
      createOpportunity: lead.interestedProducts.length > 0,
      opportunityName: `${getLeadName(lead)} - ${products.find(p => lead.interestedProducts[0] === p.id)?.name || "New Opportunity"}`,
      opportunityValue: totalProductValue,
    })
    setIsConvertDialogOpen(true)
  }

  const openDisqualifyDialog = (lead: Lead) => {
    setSelectedLead(lead)
    setDisqualifyReason("")
    setDisqualifyReasonOther("")
    setIsDisqualifyDialogOpen(true)
  }

  const handleDisqualify = () => {
    if (!selectedLead) return
    const reason = disqualifyReason === "อื่นๆ" ? disqualifyReasonOther : disqualifyReason
    setLeads(leads.map((l) => l.id === selectedLead.id ? { ...l, status: "Unqualified", disqualifyReason: reason } : l))
    setIsDisqualifyDialogOpen(false)
    setIsDetailOpen(false)
  }

  const handleConvert = () => {
    if (!selectedLead) return
    
    // Mark lead as converted (Qualified) if not already
    if (selectedLead.status !== "Qualified") {
      setLeads(leads.map((l) => l.id === selectedLead.id ? { ...l, status: "Qualified" } : l))
    }
    
    // In real app with database:
    // 1. Create Contact from Lead data
    // 2. If company lead, create Account first then link Contact
    // 3. Create Opportunity with interested products
    // 4. Link Opportunity to Contact
    
    // Show success message
    const actions: string[] = []
    if (convertOptions.createContact) {
      actions.push("Contact")
    }
    if (convertOptions.createOpportunity) {
      actions.push(`Opportunity (${new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", minimumFractionDigits: 0 }).format(convertOptions.opportunityValue)})`)
    }
    
    alert(`สร้าง ${actions.join(" และ ")} สำเร็จ!\n\nในระบบจริงจะ:\n- สร้าง Contact จากข้อมูล Lead\n- สร้าง Opportunity พร้อมสินค้าที่สนใจ\n- เชื่อมโยง Contact กับ Opportunity`)
    
    setIsConvertDialogOpen(false)
    setIsDetailOpen(false)
  }

  const handleAddActivity = () => {
    if (!selectedLead) return
    
const activity: Activity = {
      id: Date.now(),
      type: newActivity.type,
      title: newActivity.title,
      description: newActivity.description,
      date: newActivity.activityDate.replace("T", " "),
      createdBy: "Current User",
    }
    setActivities([activity, ...activities])
    setIsActivityDialogOpen(false)
    setNewActivity({ type: "โทรศัพท์", title: "", description: "", activityDate: new Date().toISOString().slice(0, 16) })
  }

  const handleReassign = () => {
    if (!selectedLead || !reassignTo) return
    
    setLeads(leads.map((l) => l.id === selectedLead.id ? { ...l, assignedTo: reassignTo } : l))
    setIsReassignDialogOpen(false)
    setReassignTo("")
  }

  const openDetail = (lead: Lead) => {
    setSelectedLead(lead)
    setIsDetailOpen(true)
  }

  const openConvert = (lead: Lead) => {
    setSelectedLead(lead)
    setConvertOptions({
      createContact: true,
      createOpportunity: lead.leadType === "company",
      opportunityName: `${getLeadName(lead)} - ${products.find(p => lead.interestedProducts[0] === p.id)?.name || "New Opportunity"}`,
      opportunityValue: lead.interestedProducts.reduce((sum, pid) => {
        const product = products.find(p => p.id === pid)
        return sum + (product?.unitPrice || 0)
      }, 0),
    })
    setIsConvertDialogOpen(true)
  }

  // SLA Display Component
  const SLABadge = ({ lead }: { lead: Lead }) => {
    // Don't show SLA for closed statuses
    if (lead.status === "Qualified" || lead.status === "Unqualified") {
      return null
    }

    const slaStatus = calculateSLAStatus(lead.contactDate, lead.slaHours)
    
    return (
      <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
        slaStatus.isOverdue 
          ? "bg-red-500/20 text-red-400" 
          : slaStatus.isCritical 
            ? "bg-amber-500/20 text-amber-400"
            : "bg-green-500/20 text-green-400"
      }`}>
        <Timer className="w-3 h-3" />
        <span>
          {slaStatus.isOverdue 
            ? `เกิน ${formatSLATime(Math.abs(slaStatus.remainingHours))}`
            : `เหลือ ${formatSLATime(slaStatus.remainingHours)}`
          }
        </span>
      </div>
    )
  }

  // Lead Form Component (reused for Add and Edit)
  const LeadForm = ({ 
    lead, 
    setLead, 
    isEdit = false 
  }: { 
    lead: Partial<Lead>, 
    setLead: (lead: Partial<Lead>) => void,
    isEdit?: boolean 
  }) => (
    <div className="space-y-6 py-4">
      {/* Lead Type */}
      <div className="space-y-2">
        <Label className="text-foreground">ประเภท Lead</Label>
        <div className="flex gap-4">
          <Button
            type="button"
            variant={lead.leadType === "individual" ? "default" : "outline"}
            onClick={() => setLead({ ...lead, leadType: "individual" })}
            className={lead.leadType === "individual" ? "bg-primary text-primary-foreground" : "border-border"}
          >
            <User className="w-4 h-4 mr-2" />
            บุคคลธรรมดา
          </Button>
          <Button
            type="button"
            variant={lead.leadType === "company" ? "default" : "outline"}
            onClick={() => setLead({ ...lead, leadType: "company" })}
            className={lead.leadType === "company" ? "bg-primary text-primary-foreground" : "border-border"}
          >
            <Building2 className="w-4 h-4 mr-2" />
            นิติบุคคล
          </Button>
        </div>
      </div>

      {/* Individual Fields */}
      {lead.leadType === "individual" && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-foreground">ชื่อ *</Label>
            <Input
              value={lead.firstName || ""}
              onChange={(e) => setLead({ ...lead, firstName: e.target.value })}
              className="bg-secondary border-border"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground">นามสกุล *</Label>
            <Input
              value={lead.lastName || ""}
              onChange={(e) => setLead({ ...lead, lastName: e.target.value })}
              className="bg-secondary border-border"
            />
          </div>
        </div>
      )}

      {/* Company Fields */}
      {lead.leadType === "company" && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-foreground">ชื่อบริษัท *</Label>
              <Input
                value={lead.companyName || ""}
                onChange={(e) => setLead({ ...lead, companyName: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">เลขประจำตัวผู้เสียภาษี</Label>
              <Input
                value={lead.taxId || ""}
                onChange={(e) => setLead({ ...lead, taxId: e.target.value })}
                className="bg-secondary border-border"
                maxLength={13}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-foreground font-medium">ข้อมูลผู้ติดต่อ</Label>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground text-sm">ชื่อ *</Label>
                <Input
                  value={lead.contactFirstName || ""}
                  onChange={(e) => setLead({ ...lead, contactFirstName: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground text-sm">นามสกุล *</Label>
                <Input
                  value={lead.contactLastName || ""}
                  onChange={(e) => setLead({ ...lead, contactLastName: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground text-sm">ตำแหน่ง</Label>
                <Input
                  value={lead.contactPosition || ""}
                  onChange={(e) => setLead({ ...lead, contactPosition: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Contact Info */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-foreground">อีเมล *</Label>
          <Input
            type="email"
            value={lead.email || ""}
            onChange={(e) => setLead({ ...lead, email: e.target.value })}
            className="bg-secondary border-border"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-foreground">โทรศัพท์ *</Label>
          <Input
            value={lead.phone || ""}
            onChange={(e) => setLead({ ...lead, phone: e.target.value })}
            className="bg-secondary border-border"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-foreground">มือถือ</Label>
          <Input
            value={lead.mobile || ""}
            onChange={(e) => setLead({ ...lead, mobile: e.target.value })}
            className="bg-secondary border-border"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-foreground">���ี่อยู่</Label>
        <Textarea
          value={lead.address || ""}
          onChange={(e) => setLead({ ...lead, address: e.target.value })}
          className="bg-secondary border-border"
          rows={2}
        />
      </div>

      {/* Lead Classification */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-foreground">แหล่งที่มา (Source)</Label>
          <Select value={lead.source} onValueChange={(v) => setLead({ ...lead, source: v })}>
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue placeholder="เลือกแหล่งที่มา" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {leadSources.map((source) => (
                <SelectItem key={source} value={source}>{source}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-foreground">แคมเปญ</Label>
          <Select value={lead.campaign || ""} onValueChange={(v) => setLead({ ...lead, campaign: v })}>
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue placeholder="เลือกแคมเปญ" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {campaigns.map((campaign) => (
                <SelectItem key={campaign} value={campaign}>{campaign}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-foreground">Grade</Label>
          <Select value={lead.grade} onValueChange={(v) => setLead({ ...lead, grade: v })}>
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue placeholder="เลือก Grade" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {leadGrades.map((grade) => (
                <SelectItem key={grade} value={grade}>Grade {grade}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-foreground">Temperature</Label>
          <Select value={lead.temperature} onValueChange={(v) => setLead({ ...lead, temperature: v as "Hot" | "Warm" | "Cold" })}>
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue placeholder="เลือก Temperature" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {leadTemperatures.map((temp) => (
                <SelectItem key={temp} value={temp}>
                  <div className="flex items-center gap-2">
                    {temp === "Hot" && <Flame className="w-4 h-4 text-red-500" />}
                    {temp === "Warm" && <Thermometer className="w-4 h-4 text-amber-500" />}
                    {temp === "Cold" && <Snowflake className="w-4 h-4 text-blue-400" />}
                    {temp}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-foreground">SLA (ชั่วโมง)</Label>
          <Select value={String(lead.slaHours || 2)} onValueChange={(v) => setLead({ ...lead, slaHours: parseInt(v) })}>
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue placeholder="เลือก SLA" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="1">1 ชั่วโมง</SelectItem>
              <SelectItem value="2">2 ชั่วโมง</SelectItem>
              <SelectItem value="4">4 ชั่วโมง</SelectItem>
              <SelectItem value="8">8 ชั่วโมง</SelectItem>
              <SelectItem value="24">24 ชั่วโมง</SelectItem>
              <SelectItem value="48">48 ชั่วโมง</SelectItem>
              <SelectItem value="72">72 ชั่วโมง</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-foreground">ผู้รับผิดชอบ</Label>
        <Select value={lead.assignedTo} onValueChange={(v) => setLead({ ...lead, assignedTo: v })}>
          <SelectTrigger className="bg-secondary border-border">
            <SelectValue placeholder="เลือกผู้รับผิดชอบ" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            {salesTeam.map((person) => (
              <SelectItem key={person.id} value={person.name}>
                {person.name} ({person.role})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Products Section */}
      <div className="space-y-2">
        <Label className="text-foreground">สินค้าที่สนใจ</Label>
        <div className="grid grid-cols-2 gap-2 p-3 bg-secondary rounded-lg border border-border">
          {products.map((product) => (
            <div key={product.id} className="flex items-center space-x-2">
              <Checkbox
                id={`product-${product.id}`}
                checked={lead.interestedProducts?.includes(product.id)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setLead({ ...lead, interestedProducts: [...(lead.interestedProducts || []), product.id] })
                  } else {
                    setLead({ ...lead, interestedProducts: lead.interestedProducts?.filter(id => id !== product.id) || [] })
                  }
                }}
              />
              <label
                htmlFor={`product-${product.id}`}
                className="text-sm text-foreground cursor-pointer"
              >
                {product.name}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label className="text-foreground">บันทึก</Label>
        <Textarea
          value={lead.notes || ""}
          onChange={(e) => setLead({ ...lead, notes: e.target.value })}
          className="bg-secondary border-border"
          rows={3}
          placeholder="รายละเอียดเพิ่มเติม..."
        />
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Lead Management</h2>
          <p className="text-muted-foreground">จัดการและติดตาม Lead ทั้งหมด</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          เพิ่ม Lead
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="p-4 space-y-4">
          {/* Search and Quick Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหาชื่อ บริษัท อีเมล หรือเบอร์โทร..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary border-border"
              />
            </div>
            <Button 
              variant="outline" 
              className={`border-border ${hasActiveFilters ? "bg-primary/10 border-primary" : ""}`}
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <Filter className="w-4 h-4 mr-2" />
              ตัวกรอง
              {hasActiveFilters && (
                <Badge className="ml-2 bg-primary text-primary-foreground">
                  {[filterTemperature, filterGrade, filterSource, filterCampaign, filterAssignedTo, filterSLAStatus, filterDateFrom, filterDateTo]
                    .filter(f => f && f !== "All" && f !== "").length}
                </Badge>
              )}
            </Button>
          </div>

          {/* Status Tabs */}
          <div className="flex gap-2 flex-wrap">
            {statusFilters.map((status) => {
              const count = status === "All" 
                ? leads.length 
                : leads.filter(l => l.status === status).length
              return (
                <Button
                  key={status}
                  variant={selectedStatus === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedStatus(status)}
                  className={selectedStatus === status 
                    ? "bg-primary text-primary-foreground" 
                    : "border-border hover:bg-secondary"
                  }
                >
                  {status === "All" ? "ทั้งหมด" : status}
                  <Badge variant="secondary" className="ml-2 bg-background/20">
                    {count}
                  </Badge>
                </Button>
              )
            })}
          </div>

          {/* Advanced Filters Collapsible */}
          <Collapsible open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <CollapsibleContent className="space-y-4 pt-4 border-t border-border">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Temperature</Label>
                  <Select value={filterTemperature} onValueChange={setFilterTemperature}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="All">ทั้งหมด</SelectItem>
                      {leadTemperatures.map((temp) => (
                        <SelectItem key={temp} value={temp}>
                          <div className="flex items-center gap-2">
                            {temp === "Hot" && <Flame className="w-4 h-4 text-red-500" />}
                            {temp === "Warm" && <Thermometer className="w-4 h-4 text-amber-500" />}
                            {temp === "Cold" && <Snowflake className="w-4 h-4 text-blue-400" />}
                            {temp}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Grade</Label>
                  <Select value={filterGrade} onValueChange={setFilterGrade}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="All">ทั้งหมด</SelectItem>
                      {leadGrades.map((grade) => (
                        <SelectItem key={grade} value={grade}>Grade {grade}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Source</Label>
                  <Select value={filterSource} onValueChange={setFilterSource}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="All">ทั้งหมด</SelectItem>
                      {leadSources.map((source) => (
                        <SelectItem key={source} value={source}>{source}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Campaign</Label>
                  <Select value={filterCampaign} onValueChange={setFilterCampaign}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="All">ทั้งหมด</SelectItem>
                      {campaigns.map((campaign) => (
                        <SelectItem key={campaign} value={campaign}>{campaign}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">ผู้รับผิดชอบ</Label>
                  <Select value={filterAssignedTo} onValueChange={setFilterAssignedTo}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="All">ทั้งหมด</SelectItem>
                      {salesTeam.map((person) => (
                        <SelectItem key={person.id} value={person.name}>{person.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">สถานะ SLA</Label>
                  <Select value={filterSLAStatus} onValueChange={setFilterSLAStatus}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="All">ทั้งหมด</SelectItem>
                      <SelectItem value="Overdue">
                        <span className="text-red-400">เกิน SLA</span>
                      </SelectItem>
                      <SelectItem value="Critical">
                        <span className="text-amber-400">ใกล้หมด SLA</span>
                      </SelectItem>
                      <SelectItem value="Normal">
                        <span className="text-green-400">ปกติ</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">วันที่ติดต่อ (จาก)</Label>
                  <Input
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">วันที่ติดต่อ (ถึง)</Label>
                  <Input
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                    className="bg-secondary border-border"
                  />
                </div>
              </div>
              {hasActiveFilters && (
                <div className="flex justify-end">
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4 mr-2" />
                    ล้างตัวกรอง
                  </Button>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Lead List */}
      <div className="space-y-3">
        {filteredLeads.map((lead) => {
          const TempIcon = getTemperatureIcon(lead.temperature)
          const slaStatus = calculateSLAStatus(lead.contactDate, lead.slaHours)
          
          return (
            <Card 
              key={lead.id} 
              className={`bg-card border-border hover:border-primary/50 transition-colors cursor-pointer ${
                lead.isDuplicate ? "border-l-4 border-l-amber-500" : ""
              } ${
                slaStatus.isOverdue && lead.status !== "Qualified" && lead.status !== "Unqualified" 
                  ? "border-l-4 border-l-red-500" 
                  : ""
              }`}
              onClick={() => openDetail(lead)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Lead Icon */}
                  <div className="p-2 rounded-lg bg-secondary">
                    {lead.leadType === "company" ? (
                      <Building2 className="w-6 h-6 text-primary" />
                    ) : (
                      <User className="w-6 h-6 text-primary" />
                    )}
                  </div>

                  {/* Lead Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-foreground text-lg">{getLeadName(lead)}</h3>
                          {lead.isDuplicate && (
                            <Badge variant="outline" className="border-amber-500 text-amber-500">
                              <Copy className="w-3 h-3 mr-1" />
                              Duplicate
                            </Badge>
                          )}
                        </div>
                        {lead.leadType === "company" && (
                          <p className="text-sm text-muted-foreground">
                            ผู้ติดต่อ: {getContactName(lead)} {lead.contactPosition && `(${lead.contactPosition})`}
                          </p>
                        )}
                      </div>
                      
                      {/* Right side badges */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge className={getStatusColor(lead.status)}>{lead.status}</Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover border-border">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditDialog(lead); }}>
                              <Edit className="w-4 h-4 mr-2" />
                              แก้ไข
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedLead(lead); setIsActivityDialogOpen(true); }}>
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Log Activity
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openConvert(lead); }}>
                              <ArrowRight className="w-4 h-4 mr-2" />
                              Convert
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedLead(lead); setIsReassignDialogOpen(true); }}>
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Reassign
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Contact Info Row */}
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" />
                        {lead.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5" />
                        {lead.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-3.5 h-3.5" />
                        {new Date(lead.contactDate).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    {/* Tags Row */}
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      {/* Temperature */}
                      <Badge variant="outline" className={`${getTemperatureColor(lead.temperature)} border-0`}>
                        <TempIcon className="w-3 h-3 mr-1" />
                        {lead.temperature}
                      </Badge>
                      
                      {/* Grade */}
                      <Badge variant="outline" className={getGradeColor(lead.grade)}>
                        <Star className="w-3 h-3 mr-1" />
                        Grade {lead.grade}
                      </Badge>
                      
                      {/* Source */}
                      <Badge variant="outline" className="border-border text-muted-foreground">
                        {lead.source}
                      </Badge>
                      
                      {/* Campaign */}
                      {lead.campaign && (
                        <Badge variant="outline" className="border-border text-muted-foreground">
                          <Megaphone className="w-3 h-3 mr-1" />
                          {lead.campaign}
                        </Badge>
                      )}
                      
                      {/* Products */}
                      {lead.interestedProducts.length > 0 && (
                        <Badge variant="outline" className="border-primary/50 text-primary">
                          <Package className="w-3 h-3 mr-1" />
                          {lead.interestedProducts.length} สินค้า
                        </Badge>
                      )}
                    </div>

                    {/* Bottom Row - SLA and Assigned */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                      <div className="flex items-center gap-3">
                        {/* SLA Status */}
                        <SLABadge lead={lead} />
                        
                        {/* SLA Details */}
                        {lead.status !== "Qualified" && lead.status !== "Unqualified" && (
                          <span className="text-xs text-muted-foreground">
                            ผ่านไป {formatSLATime(slaStatus.elapsedHours)} / SLA {lead.slaHours} ชม.
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          <User className="w-3.5 h-3.5 inline mr-1" />
                          {lead.assignedTo}
                        </span>
                        <span className={`text-sm font-medium ${getScoreColor(lead.score)}`}>
                          Score: {lead.score}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {filteredLeads.length === 0 && (
          <Card className="bg-card border-border">
            <CardContent className="p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-secondary mx-auto mb-4 flex items-center justify-center">
                <Search className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">ไม่พบข้อมูล Lead</h3>
              <p className="text-muted-foreground">ลองเปลี่ยนเงื่อนไขการค้นหาหรือเพิ่ม Lead ใหม่</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Lead Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="bg-card border-border max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">เพิ่ม Lead ใหม่</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              กรอกข้อมูล Lead ที่ต้องการเพิ่มในระบบ
            </DialogDescription>
          </DialogHeader>
          <LeadForm lead={newLead} setLead={setNewLead} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="border-border">
              ยกเลิก
            </Button>
            <Button onClick={handleAddLead} className="bg-primary text-primary-foreground">
              บันทึก Lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Lead Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-card border-border max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">แก้ไข Lead</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              แก้ไขข้อมูล Lead
            </DialogDescription>
          </DialogHeader>
          {editLead && (
            <>
              <LeadForm lead={editLead} setLead={(l) => setEditLead(l as Lead)} isEdit />
              
              {/* Products Management for Edit */}
              <div className="space-y-2 border-t border-border pt-4">
                <Label className="text-foreground font-medium">จัดการสินค้าที่สนใจ</Label>
                <div className="space-y-2">
                  {editLead.interestedProducts.map((productId) => {
                    const product = products.find(p => p.id === productId)
                    if (!product) return null
                    return (
                      <div key={productId} className="flex items-center justify-between p-2 bg-secondary rounded-lg">
                        <div>
                          <span className="text-foreground">{product.name}</span>
                          <span className="text-muted-foreground text-sm ml-2">
                            ({product.code}) - {product.unitPrice.toLocaleString()} บาท
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveProductFromLead(productId)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )
                  })}
                  {editLead.interestedProducts.length === 0 && (
                    <p className="text-muted-foreground text-sm py-2">ยังไม่มีสินค้าที่สนใจ</p>
                  )}
                </div>
                <Select onValueChange={(v) => handleAddProductToLead(parseInt(v))}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="เพิ่มสินค้า..." />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {products.filter(p => !editLead.interestedProducts.includes(p.id)).map((product) => (
                      <SelectItem key={product.id} value={String(product.id)}>
                        {product.name} - {product.unitPrice.toLocaleString()} บาท
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="border-border">
              ยกเลิก
            </Button>
            <Button onClick={handleEditLead} className="bg-primary text-primary-foreground">
              บันทึก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lead Detail Sheet */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="bg-card border-border w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-foreground flex items-center gap-2">
              {selectedLead?.leadType === "company" ? (
                <Building2 className="w-5 h-5 text-primary" />
              ) : (
                <User className="w-5 h-5 text-primary" />
              )}
              {selectedLead && getLeadName(selectedLead)}
            </SheetTitle>
            <SheetDescription className="text-muted-foreground">
              รายละเอียด Lead และประวัติกิจกรรม
            </SheetDescription>
          </SheetHeader>

          {selectedLead && (
            <div className="space-y-6 py-6">
              {/* Status and Actions */}
              <div className="flex items-center justify-between">
                <Badge className={`${getStatusColor(selectedLead.status)} text-sm px-3 py-1`}>
                  {selectedLead.status}
                </Badge>
                <div className="flex gap-2">
                  {selectedLead.status !== "Qualified" && selectedLead.status !== "Unqualified" && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => handleQualify(selectedLead)} className="border-status-qualified text-status-qualified hover:bg-status-qualified/10">
                        <Check className="w-4 h-4 mr-1" />
                        Qualify
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openDisqualifyDialog(selectedLead)} className="border-destructive text-destructive hover:bg-destructive/10">
                        <XCircle className="w-4 h-4 mr-1" />
                        Disqualify
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Disqualify Reason */}
              {selectedLead.status === "Unqualified" && selectedLead.disqualifyReason && (
                <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/30">
                  <p className="text-sm text-destructive font-medium">เหตุผลที่ Disqualify:</p>
                  <p className="text-sm text-muted-foreground">{selectedLead.disqualifyReason}</p>
                </div>
              )}

              {/* SLA Info */}
              {selectedLead.status !== "Qualified" && selectedLead.status !== "Unqualified" && (
                <Card className="bg-secondary/30 border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">SLA Status</p>
                        <div className="flex items-center gap-2 mt-1">
                          <SLABadge lead={selectedLead} />
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">SLA: {selectedLead.slaHours} ชั่วโมง</p>
                        <p className="text-xs text-muted-foreground">
                          Due: {new Date(selectedLead.dueDate).toLocaleString("th-TH")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Basic Info */}
              <Card className="bg-secondary/30 border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">ข้อมูลทั่วไป</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">วันที่ติดต่อ</p>
                      <p className="text-foreground">{new Date(selectedLead.contactDate).toLocaleString("th-TH")}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Temperature</p>
                      <Badge variant="outline" className={`${getTemperatureColor(selectedLead.temperature)} border-0`}>
                        {selectedLead.temperature === "Hot" && <Flame className="w-3 h-3 mr-1" />}
                        {selectedLead.temperature === "Warm" && <Thermometer className="w-3 h-3 mr-1" />}
                        {selectedLead.temperature === "Cold" && <Snowflake className="w-3 h-3 mr-1" />}
                        {selectedLead.temperature}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Grade</p>
                      <Badge variant="outline" className={getGradeColor(selectedLead.grade)}>
                        Grade {selectedLead.grade}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Score</p>
                      <p className={`font-semibold ${getScoreColor(selectedLead.score)}`}>{selectedLead.score}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Source</p>
                      <p className="text-foreground">{selectedLead.source}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Campaign</p>
                      <p className="text-foreground">{selectedLead.campaign || "-"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Info */}
              <Card className="bg-secondary/30 border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">ข้อมูลติดต่อ</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedLead.leadType === "company" && (
                    <>
                      <div>
                        <p className="text-xs text-muted-foreground">ผู้ติดต่อ</p>
                        <p className="text-foreground">{getContactName(selectedLead)} {selectedLead.contactPosition && `(${selectedLead.contactPosition})`}</p>
                      </div>
                      {selectedLead.taxId && (
                        <div>
                          <p className="text-xs text-muted-foreground">เลขประจำตัวผู้เสียภาษี</p>
                          <p className="text-foreground">{selectedLead.taxId}</p>
                        </div>
                      )}
                    </>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">อีเมล</p>
                      <p className="text-foreground">{selectedLead.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">โทรศัพท์</p>
                      <p className="text-foreground">{selectedLead.phone}</p>
                    </div>
                  </div>
                  {selectedLead.mobile && (
                    <div>
                      <p className="text-xs text-muted-foreground">มือถือ</p>
                      <p className="text-foreground">{selectedLead.mobile}</p>
                    </div>
                  )}
                  {selectedLead.address && (
                    <div>
                      <p className="text-xs text-muted-foreground">ที่อยู่</p>
                      <p className="text-foreground">{selectedLead.address}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Products */}
              <Card className="bg-secondary/30 border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">สินค้าที่สนใจ</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedLead.interestedProducts.length > 0 ? (
                    <div className="space-y-2">
                      {selectedLead.interestedProducts.map((productId) => {
                        const product = products.find(p => p.id === productId)
                        if (!product) return null
                        return (
                          <div key={productId} className="flex items-center justify-between p-2 bg-secondary rounded-lg">
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4 text-primary" />
                              <span className="text-foreground">{product.name}</span>
                            </div>
                            <span className="text-muted-foreground text-sm">
                              {product.unitPrice.toLocaleString()} บาท
                            </span>
                          </div>
                        )
                      })}
                      <div className="flex justify-between pt-2 border-t border-border">
                        <span className="text-muted-foreground">มูลค่ารวม</span>
                        <span className="font-semibold text-primary">
                          {selectedLead.interestedProducts.reduce((sum, pid) => {
                            const product = products.find(p => p.id === pid)
                            return sum + (product?.unitPrice || 0)
                          }, 0).toLocaleString()} บาท
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">ยังไม่ได้ระบุสินค้า</p>
                  )}
                </CardContent>
              </Card>

              {/* Notes */}
              {selectedLead.notes && (
                <Card className="bg-secondary/30 border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">บันทึก</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground">{selectedLead.notes}</p>
                  </CardContent>
                </Card>
              )}

              {/* Assigned To */}
              <Card className="bg-secondary/30 border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">ผู้รับผิดชอบ</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-foreground">{selectedLead.assignedTo}</span>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setIsReassignDialogOpen(true)}
                      className="border-border"
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Reassign
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Activities */}
              <Card className="bg-secondary/30 border-border">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm text-muted-foreground">กิจกรรมล่าสุด</CardTitle>
                  <Button size="sm" onClick={() => setIsActivityDialogOpen(true)} className="bg-primary text-primary-foreground">
                    <Plus className="w-4 h-4 mr-1" />
                    Log Activity
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {activities.slice(0, 3).map((activity) => {
                      const Icon = getActivityIcon(activity.type)
                      return (
                        <div key={activity.id} className="flex gap-3 p-2 bg-secondary rounded-lg">
                          <div className="p-1.5 rounded bg-primary/20">
                            <Icon className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">{activity.title}</p>
                            <p className="text-xs text-muted-foreground">{activity.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">{activity.date} โดย {activity.createdBy}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-border">
                <Button onClick={() => openEditDialog(selectedLead)} variant="outline" className="flex-1 border-border">
                  <Edit className="w-4 h-4 mr-2" />
                  แก้ไข
                </Button>
                <Button onClick={() => openConvert(selectedLead)} className="flex-1 bg-primary text-primary-foreground">
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Convert
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Convert Dialog */}
      <Dialog open={isConvertDialogOpen} onOpenChange={setIsConvertDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Convert Lead</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              แปลง Lead เป็น Account/Contact และสร้าง Opportunity
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="createContact"
                checked={convertOptions.createContact}
                onCheckedChange={(checked) => setConvertOptions({ ...convertOptions, createContact: checked as boolean })}
              />
              <label htmlFor="createContact" className="text-foreground cursor-pointer">
                สร้าง Contact
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="createOpportunity"
                checked={convertOptions.createOpportunity}
                onCheckedChange={(checked) => setConvertOptions({ ...convertOptions, createOpportunity: checked as boolean })}
              />
              <label htmlFor="createOpportunity" className="text-foreground cursor-pointer">
                สร้าง Opportunity
              </label>
            </div>
            {convertOptions.createOpportunity && (
              <div className="space-y-4 pl-6">
                <div className="space-y-2">
                  <Label className="text-foreground">ชื่อ Opportunity</Label>
                  <Input
                    value={convertOptions.opportunityName}
                    onChange={(e) => setConvertOptions({ ...convertOptions, opportunityName: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">มูลค่า (บาท)</Label>
                  <Input
                    type="number"
                    value={convertOptions.opportunityValue}
                    onChange={(e) => setConvertOptions({ ...convertOptions, opportunityValue: parseInt(e.target.value) || 0 })}
                    className="bg-secondary border-border"
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConvertDialogOpen(false)} className="border-border">
              ยกเลิก
            </Button>
            <Button onClick={handleConvert} className="bg-primary text-primary-foreground">
              Convert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Activity Dialog */}
      <Dialog open={isActivityDialogOpen} onOpenChange={setIsActivityDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Log Activity</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              บันทึกกิจกรรมที่ทำกับ Lead
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-foreground">ประเภท</Label>
              <Select value={newActivity.type} onValueChange={(v) => setNewActivity({ ...newActivity, type: v })}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {activityTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">หัวข้อ</Label>
              <Input
                value={newActivity.title}
                onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                className="bg-secondary border-border"
                placeholder="เช่น โทรติดตาม, ส่งใบเสนอราคา"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">วันที่ทำกิจกรรม</Label>
              <Input
                type="datetime-local"
                value={newActivity.activityDate}
                onChange={(e) => setNewActivity({ ...newActivity, activityDate: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">รายละเอียด</Label>
              <Textarea
                value={newActivity.description}
                onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                className="bg-secondary border-border"
                rows={3}
                placeholder="รายละเอียดของกิจกรรม..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsActivityDialogOpen(false)} className="border-border">
              ยกเลิก
            </Button>
            <Button onClick={handleAddActivity} className="bg-primary text-primary-foreground">
              บันทึก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reassign Dialog */}
      <Dialog open={isReassignDialogOpen} onOpenChange={setIsReassignDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Reassign Lead</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              มอบหมาย Lead ให้พนักงานขายคนอื่น
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-foreground">เลือกผู้รับผิดชอบใหม่</Label>
              <Select value={reassignTo} onValueChange={setReassignTo}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="เลือกพนักงานขาย" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {salesTeam.map((person) => (
                    <SelectItem key={person.id} value={person.name}>
                      {person.name} ({person.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReassignDialogOpen(false)} className="border-border">
              ยกเลิก
            </Button>
            <Button onClick={handleReassign} className="bg-primary text-primary-foreground">
              Reassign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Duplicate Warning Dialog */}
      <Dialog open={isDuplicateDialogOpen} onOpenChange={setIsDuplicateDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              พบ Lead ซ้ำ
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              ระบบพบว่ามี Lead ที่มีข้อมูลตรงกันในระบบแล้ว
            </DialogDescription>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-4 py-4">
              <Card className="bg-secondary/30 border-border">
                <CardContent className="p-4">
                  <h4 className="font-medium text-foreground mb-2">Lead ที่มีอยู่ในระบบ:</h4>
                  <p className="text-foreground">{getLeadName(selectedLead)}</p>
                  <p className="text-sm text-muted-foreground">{selectedLead.phone} | {selectedLead.email}</p>
                  <p className="text-sm text-muted-foreground">ผู้รับผิดชอบ: {selectedLead.assignedTo}</p>
                </CardContent>
              </Card>
              <p className="text-sm text-muted-foreground">
                Lead ใหม่จะถูก Assign ให้กับพนักงานขายคนเดิมโดยอัตโนมัติ
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDuplicateDialogOpen(false)} className="border-border">
              ยกเลิก
            </Button>
            <Button onClick={() => {
              // Assign to existing owner and mark as duplicate
              if (selectedLead) {
                const lead: Lead = {
                  id: Date.now(),
                  leadType: newLead.leadType || "company",
                  firstName: newLead.firstName,
                  lastName: newLead.lastName,
                  companyName: newLead.companyName,
                  taxId: newLead.taxId,
                  contactFirstName: newLead.contactFirstName,
                  contactLastName: newLead.contactLastName,
                  contactPosition: newLead.contactPosition,
                  email: newLead.email || "",
                  phone: newLead.phone || "",
                  mobile: newLead.mobile,
                  address: newLead.address,
                  status: "New",
                  source: newLead.source || "",
                  grade: newLead.grade || "B",
                  temperature: newLead.temperature || "Warm",
                  campaign: newLead.campaign,
                  interestedProducts: newLead.interestedProducts || [],
                  score: newLead.score || 50,
                  contactDate: new Date().toISOString(),
                  dueDate: new Date(Date.now() + (newLead.slaHours || 2) * 60 * 60 * 1000).toISOString(),
                  slaHours: newLead.slaHours || 2,
                  assignedTo: selectedLead.assignedTo, // Assign to existing owner
                  createdAt: new Date().toISOString().replace("T", " ").substring(0, 16),
                  isDuplicate: true,
                  duplicateOf: selectedLead.id,
                  notes: `Duplicate ของ Lead ID ${selectedLead.id}`,
                }
                setLeads([lead, ...leads])
              }
              setIsDuplicateDialogOpen(false)
              setIsAddDialogOpen(false)
              resetNewLead()
            }} className="bg-amber-500 text-white hover:bg-amber-600">
              ยืนยันเพิ่ม Lead (Duplicate)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disqualify Dialog */}
      <Dialog open={isDisqualifyDialogOpen} onOpenChange={setIsDisqualifyDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Disqualify Lead</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              กรุณาระบุเหตุผลในการ Disqualify Lead นี้
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-foreground">เหตุผล</Label>
              <Select value={disqualifyReason} onValueChange={setDisqualifyReason}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="เลือกเหตุผล" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {disqualifyReasons.map((reason) => (
                    <SelectItem key={reason} value={reason}>{reason}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {disqualifyReason === "อื่นๆ" && (
              <div className="space-y-2">
                <Label className="text-foreground">ระบุเหตุผล</Label>
                <Textarea
                  value={disqualifyReasonOther}
                  onChange={(e) => setDisqualifyReasonOther(e.target.value)}
                  className="bg-secondary border-border"
                  placeholder="กรุณาระบุเหตุผลอื่นๆ..."
                  rows={3}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDisqualifyDialogOpen(false)} className="border-border">
              ยกเลิก
            </Button>
            <Button 
              onClick={handleDisqualify} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={!disqualifyReason || (disqualifyReason === "อื่นๆ" && !disqualifyReasonOther)}
            >
              Disqualify
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
