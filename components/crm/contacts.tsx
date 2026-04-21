"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Search,
  Plus,
  User,
  Mail,
  Phone,
  Building2,
  MoreVertical,
  Edit,
  Eye,
  Trash2,
  Calendar,
  MessageSquare,
  Activity,
  Star,
  Filter,
  Flame,
  Thermometer,
  Snowflake,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Briefcase,
  FileText,
  Clock,
  X,
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
interface Contact {
  id: number
  contactType: "individual" | "company"
  // Individual fields
  firstName: string
  lastName: string
  // Company fields (if linked to account)
  title?: string
  department?: string
  // Common fields
  email: string
  phone?: string
  mobile?: string
  address?: string
  // Classification
  temperature: "Hot" | "Warm" | "Cold"
  source?: string
  campaign?: string
  interestedProducts: number[]
  // Account link
  accountId?: number
  accountName?: string
  isPrimary: boolean
  // Engagement
  emailOpens: number
  webVisits: number
  lastActivity?: string
  // Other
  owner: string
  createdAt: string
  convertedFromLeadId?: number
  notes?: string
}

interface OpportunityLink {
  id: number
  name: string
  value: number
  stage: string
  closingDate: string
  probability: number
  contactId: number
}

interface ContactActivity {
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
import { mockProducts as _sharedProducts, mockContacts as _sharedContacts, mockOpportunities as _sharedOpps } from '@/lib/crm-mock'
const products: Product[] = _sharedProducts as unknown as Product[]

const accounts = [
  { id: 1, name: "บริษัท ABC จำกัด" },
  { id: 2, name: "บริษัท XYZ คอร์ปอเรชั่น" },
  { id: 3, name: "บริษัท DFG อินเตอร์" },
  { id: 4, name: "บริษัท LMN โซลูชั่น" },
]

const salesTeam = [
  { id: 1, name: "สมชาย ใจดี", role: "Sales" },
  { id: 2, name: "สมหญิง รักดี", role: "Sales" },
  { id: 3, name: "วิชัย สุขสันต์", role: "Sales" },
  { id: 4, name: "ประภา ดีใจ", role: "Manager" },
]

const leadSources = ["Website", "Referral", "Trade Show", "Cold Call", "Social Media", "LinkedIn", "Partner", "Advertisement", "Lead Conversion"]
const contactTemperatures = ["Hot", "Warm", "Cold"]
const campaigns = ["Q1 2024 Promotion", "Trade Show 2024", "Summer Sale", "Year End Campaign"]
const activityTypes = ["โทรศัพท์", "อีเมล", "นัดพบ", "Demo", "ส่งเอกสาร", "บันทึกทั่วไป"]

const initialContacts: Contact[] = _sharedContacts as unknown as Contact[]

const initialOpportunities: OpportunityLink[] = _sharedOpps.flatMap((o) => o.contactId ? [{ id: o.id, name: o.name, value: o.value, stage: o.stage, closingDate: o.closingDate, probability: o.probability, contactId: o.contactId }] : []) as OpportunityLink[]

const mockActivities: ContactActivity[] = [
  {
    id: 1,
    type: "โทรศัพท์",
    title: "โทรติดตาม",
    description: "โทรสอบถามความสนใจเพิ่มเติม",
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

const getTemperatureIcon = (temp: string) => {
  switch (temp) {
    case "Hot": return Flame
    case "Warm": return Thermometer
    case "Cold": return Snowflake
    default: return Thermometer
  }
}

const getTemperatureColor = (temp: string) => {
  switch (temp) {
    case "Hot": return "text-red-500 bg-red-500/20"
    case "Warm": return "text-amber-500 bg-amber-500/20"
    case "Cold": return "text-blue-400 bg-blue-400/20"
    default: return "text-muted-foreground bg-muted"
  }
}

const getStageColor = (stage: string) => {
  switch (stage) {
    case "qualification": return "bg-status-new text-white"
    case "proposal": return "bg-status-working text-black"
    case "negotiation": return "bg-chart-4 text-white"
    case "closed_won": return "bg-status-won text-white"
    case "closed_lost": return "bg-status-lost text-white"
    default: return "bg-muted text-muted-foreground"
  }
}

const getStageName = (stage: string) => {
  switch (stage) {
    case "qualification": return "Qualification"
    case "proposal": return "Proposal"
    case "negotiation": return "Negotiation"
    case "closed_won": return "Closed Won"
    case "closed_lost": return "Closed Lost"
    default: return stage
  }
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case "โทรศัพท์": return Phone
    case "อีเมล": return Mail
    case "นัดพบ":
    case "Demo": return Calendar
    case "ส่งเอกสาร": return FileText
    default: return MessageSquare
  }
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", minimumFractionDigits: 0 }).format(value)
}

export function Contacts() {
  const [contacts, setContacts] = useState(initialContacts)
  const [opportunities] = useState(initialOpportunities)
  const [activities, setActivities] = useState(mockActivities)
  
  // Search and Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [filterTemperature, setFilterTemperature] = useState("All")
  const [filterSource, setFilterSource] = useState("All")
  const [filterAccount, setFilterAccount] = useState("All")
  const [filterOwner, setFilterOwner] = useState("All")
  
  // Dialogs
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false)
  
  // Form states
  const [formData, setFormData] = useState<Partial<Contact>>({
    contactType: "individual",
    isPrimary: false,
    temperature: "Warm",
    interestedProducts: [],
  })
  
  const [newActivity, setNewActivity] = useState({
    type: "โทรศัพท์",
    title: "",
    description: "",
    activityDate: new Date().toISOString().slice(0, 16),
  })

  // Filter logic
  const filteredContacts = contacts.filter((contact) => {
    const searchLower = searchQuery.toLowerCase()
    const matchesSearch =
      contact.firstName.toLowerCase().includes(searchLower) ||
      contact.lastName.toLowerCase().includes(searchLower) ||
      contact.email.toLowerCase().includes(searchLower) ||
      (contact.accountName?.toLowerCase().includes(searchLower)) ||
      (contact.mobile?.includes(searchQuery)) ||
      (contact.phone?.includes(searchQuery))
    
    const matchesTemperature = filterTemperature === "All" || contact.temperature === filterTemperature
    const matchesSource = filterSource === "All" || contact.source === filterSource
    const matchesAccount = filterAccount === "All" || contact.accountId?.toString() === filterAccount
    const matchesOwner = filterOwner === "All" || contact.owner === filterOwner
    
    return matchesSearch && matchesTemperature && matchesSource && matchesAccount && matchesOwner
  })

  const hasActiveFilters = filterTemperature !== "All" || filterSource !== "All" || 
    filterAccount !== "All" || filterOwner !== "All"

  const clearFilters = () => {
    setFilterTemperature("All")
    setFilterSource("All")
    setFilterAccount("All")
    setFilterOwner("All")
  }

  const getFullName = (contact: Contact) => `${contact.firstName} ${contact.lastName}`
  
  const getContactOpportunities = (contactId: number) => {
    return opportunities.filter(opp => opp.contactId === contactId)
  }

  const openDetail = (contact: Contact) => {
    setSelectedContact(contact)
    setIsDetailOpen(true)
  }

  const openAdd = () => {
    setFormData({ 
      contactType: "individual",
      isPrimary: false, 
      temperature: "Warm",
      interestedProducts: [],
      owner: salesTeam[0].name 
    })
    setIsAddDialogOpen(true)
  }

  const openEdit = (contact: Contact) => {
    setFormData(contact)
    setSelectedContact(contact)
    setIsEditDialogOpen(true)
  }

  const handleSave = () => {
    const selectedAccount = accounts.find((a) => a.id === formData.accountId)
    const newContact: Contact = {
      id: Date.now(),
      contactType: formData.contactType || "individual",
      firstName: formData.firstName || "",
      lastName: formData.lastName || "",
      title: formData.title,
      department: formData.department,
      email: formData.email || "",
      phone: formData.phone,
      mobile: formData.mobile,
      address: formData.address,
      temperature: formData.temperature || "Warm",
      source: formData.source,
      campaign: formData.campaign,
      interestedProducts: formData.interestedProducts || [],
      accountId: formData.accountId,
      accountName: selectedAccount?.name,
      isPrimary: formData.isPrimary || false,
      emailOpens: 0,
      webVisits: 0,
      owner: formData.owner || salesTeam[0].name,
      createdAt: new Date().toISOString().split("T")[0],
      notes: formData.notes,
    }
    setContacts([newContact, ...contacts])
    setIsAddDialogOpen(false)
  }

  const handleEdit = () => {
    if (!selectedContact) return
    const selectedAccount = accounts.find((a) => a.id === formData.accountId)
    setContacts(contacts.map((c) => c.id === selectedContact.id 
      ? { ...c, ...formData, accountName: selectedAccount?.name } as Contact 
      : c
    ))
    setIsEditDialogOpen(false)
  }

  const handleDelete = (id: number) => {
    setContacts(contacts.filter((c) => c.id !== id))
    if (selectedContact?.id === id) {
      setIsDetailOpen(false)
    }
  }

  const togglePrimary = (id: number) => {
    setContacts(contacts.map((c) => c.id === id ? { ...c, isPrimary: !c.isPrimary } : c))
  }

  const handleAddActivity = () => {
    if (!selectedContact) return
    const activity: ContactActivity = {
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

  // Stats
  const totalContacts = contacts.length
  const hotContacts = contacts.filter((c) => c.temperature === "Hot").length
  const primaryContacts = contacts.filter((c) => c.isPrimary).length
  const totalOpportunityValue = opportunities.reduce((sum, opp) => sum + opp.value, 0)

  // Contact Form Component
  const ContactForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-6 py-4">
      {/* Contact Type */}
      <div className="space-y-2">
        <Label className="text-foreground">ประเภท Contact</Label>
        <div className="flex gap-4">
          <Button
            type="button"
            variant={formData.contactType === "individual" ? "default" : "outline"}
            onClick={() => setFormData({ ...formData, contactType: "individual" })}
            className={formData.contactType === "individual" ? "bg-primary text-primary-foreground" : "border-border"}
          >
            <User className="w-4 h-4 mr-2" />
            บุคคลธรรมดา
          </Button>
          <Button
            type="button"
            variant={formData.contactType === "company" ? "default" : "outline"}
            onClick={() => setFormData({ ...formData, contactType: "company" })}
            className={formData.contactType === "company" ? "bg-primary text-primary-foreground" : "border-border"}
          >
            <Building2 className="w-4 h-4 mr-2" />
            ผู้ติดต่อบริษัท
          </Button>
        </div>
      </div>

      {/* Name Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-foreground">ชื่อ *</Label>
          <Input
            value={formData.firstName || ""}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            className="bg-secondary border-border"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-foreground">นามสกุล *</Label>
          <Input
            value={formData.lastName || ""}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            className="bg-secondary border-border"
          />
        </div>
      </div>

      {/* Title and Department (for company contacts) */}
      {formData.contactType === "company" && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-foreground">ตำแหน่ง</Label>
            <Input
              value={formData.title || ""}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="bg-secondary border-border"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground">แผนก</Label>
            <Input
              value={formData.department || ""}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="bg-secondary border-border"
            />
          </div>
        </div>
      )}

      {/* Contact Info */}
      <div className="space-y-2">
        <Label className="text-foreground">อีเมล *</Label>
        <Input
          type="email"
          value={formData.email || ""}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="bg-secondary border-border"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-foreground">โทรศัพท์</Label>
          <Input
            value={formData.phone || ""}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="bg-secondary border-border"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-foreground">มือถือ</Label>
          <Input
            value={formData.mobile || ""}
            onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
            className="bg-secondary border-border"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-foreground">ที่อยู่</Label>
        <Textarea
          value={formData.address || ""}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          className="bg-secondary border-border"
          rows={2}
        />
      </div>

      {/* Account (for company contacts) */}
      {formData.contactType === "company" && (
        <div className="space-y-2">
          <Label className="text-foreground">Account (บริษัท)</Label>
          <Select 
            value={formData.accountId?.toString() || ""} 
            onValueChange={(v) => setFormData({ ...formData, accountId: parseInt(v) })}
          >
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue placeholder="เลือก Account" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id.toString()}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Classification */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-foreground">Temperature</Label>
          <Select 
            value={formData.temperature} 
            onValueChange={(v) => setFormData({ ...formData, temperature: v as "Hot" | "Warm" | "Cold" })}
          >
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue placeholder="เลือก Temperature" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {contactTemperatures.map((temp) => (
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
          <Label className="text-foreground">แหล่งที่มา</Label>
          <Select value={formData.source || ""} onValueChange={(v) => setFormData({ ...formData, source: v })}>
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
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-foreground">แคมเปญ</Label>
          <Select value={formData.campaign || ""} onValueChange={(v) => setFormData({ ...formData, campaign: v })}>
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
        <div className="space-y-2">
          <Label className="text-foreground">ผู้รับผิดชอบ</Label>
          <Select value={formData.owner || ""} onValueChange={(v) => setFormData({ ...formData, owner: v })}>
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
      </div>

      {/* Products */}
      <div className="space-y-2">
        <Label className="text-foreground">สินค้าที่สนใจ</Label>
        <div className="grid grid-cols-2 gap-2 p-3 bg-secondary rounded-lg border border-border">
          {products.map((product) => (
            <div key={product.id} className="flex items-center space-x-2">
              <Checkbox
                id={`contact-product-${product.id}`}
                checked={formData.interestedProducts?.includes(product.id)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setFormData({ ...formData, interestedProducts: [...(formData.interestedProducts || []), product.id] })
                  } else {
                    setFormData({ ...formData, interestedProducts: formData.interestedProducts?.filter(id => id !== product.id) || [] })
                  }
                }}
              />
              <label
                htmlFor={`contact-product-${product.id}`}
                className="text-sm text-foreground cursor-pointer"
              >
                {product.name}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Primary Contact */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="isPrimary"
          checked={formData.isPrimary}
          onCheckedChange={(checked) => setFormData({ ...formData, isPrimary: !!checked })}
        />
        <label htmlFor="isPrimary" className="text-sm text-foreground cursor-pointer">
          Primary Contact
        </label>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label className="text-foreground">บันทึก</Label>
        <Textarea
          value={formData.notes || ""}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Contacts</h2>
          <p className="text-muted-foreground">จัดการข้อมูลผู้ติดต่อ</p>
        </div>
        <Button onClick={openAdd} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          เพิ่ม Contact
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalContacts}</p>
                <p className="text-xs text-muted-foreground">Contacts ทั้งหมด</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/20">
                <Flame className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{hotContacts}</p>
                <p className="text-xs text-muted-foreground">Hot Contacts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/20">
                <Star className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{primaryContacts}</p>
                <p className="text-xs text-muted-foreground">Primary Contacts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-status-qualified/20">
                <DollarSign className="w-5 h-5 text-status-qualified" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(totalOpportunityValue)}</p>
                <p className="text-xs text-muted-foreground">Total Opportunity</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหาชื่อ, อีเมล, บริษัท หรือเบอร์โทร..."
                className="pl-9 bg-secondary border-border"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
                  {[filterTemperature, filterSource, filterAccount, filterOwner]
                    .filter(f => f !== "All").length}
                </Badge>
              )}
            </Button>
          </div>

          {/* Advanced Filters */}
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
                      {contactTemperatures.map((temp) => (
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
                  <Label className="text-sm text-muted-foreground">Account</Label>
                  <Select value={filterAccount} onValueChange={setFilterAccount}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="All">ทั้งหมด</SelectItem>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id.toString()}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">ผู้รับผิดชอบ</Label>
                  <Select value={filterOwner} onValueChange={setFilterOwner}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="All">ทั้งหมด</SelectItem>
                      {salesTeam.map((person) => (
                        <SelectItem key={person.id} value={person.name}>
                          {person.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                  <X className="w-4 h-4 mr-1" />
                  ล้างตัวกรอง
                </Button>
              )}
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Contacts List */}
      <div className="space-y-3">
        {filteredContacts.map((contact) => {
          const contactOpps = getContactOpportunities(contact.id)
          const TempIcon = getTemperatureIcon(contact.temperature)
          
          return (
            <Card
              key={contact.id}
              className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => openDetail(contact)}
            >
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Contact Info */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-lg">
                      {contact.firstName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-foreground">{getFullName(contact)}</h3>
                        {contact.isPrimary && (
                          <Badge className="bg-primary/20 text-primary">Primary</Badge>
                        )}
                        <Badge className={`${getTemperatureColor(contact.temperature)} flex items-center gap-1`}>
                          <TempIcon className="w-3 h-3" />
                          {contact.temperature}
                        </Badge>
                        {contact.convertedFromLeadId && (
                          <Badge variant="outline" className="border-status-qualified text-status-qualified">
                            Converted
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{contact.title}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap mt-1">
                        {contact.accountName && (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5" />
                            {contact.accountName}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" />
                          {contact.email}
                        </span>
                        {contact.mobile && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5" />
                            {contact.mobile}
                          </span>
                        )}
                      </div>
                      {/* Products */}
                      {contact.interestedProducts.length > 0 && (
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {contact.interestedProducts.slice(0, 3).map((pid) => {
                            const product = products.find(p => p.id === pid)
                            return product ? (
                              <Badge key={pid} variant="outline" className="border-border text-xs">
                                {product.name}
                              </Badge>
                            ) : null
                          })}
                          {contact.interestedProducts.length > 3 && (
                            <Badge variant="outline" className="border-border text-xs">
                              +{contact.interestedProducts.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Opportunities */}
                  {contactOpps.length > 0 && (
                    <div className="flex flex-col gap-1 min-w-[200px]">
                      <p className="text-xs text-muted-foreground mb-1">Opportunities ({contactOpps.length})</p>
                      {contactOpps.slice(0, 2).map((opp) => (
                        <div key={opp.id} className="flex items-center gap-2 text-sm">
                          <Badge className={`${getStageColor(opp.stage)} text-xs`}>
                            {getStageName(opp.stage)}
                          </Badge>
                          <span className="text-foreground font-medium">{formatCurrency(opp.value)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Engagement Stats */}
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-lg font-bold text-foreground">{contact.emailOpens}</p>
                      <p className="text-xs text-muted-foreground">Email Opens</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-foreground">{contact.webVisits}</p>
                      <p className="text-xs text-muted-foreground">Web Visits</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                    >
                      <Phone className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                    >
                      <Mail className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => openEdit(contact)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover border-border">
                        <DropdownMenuItem onClick={() => openDetail(contact)}>
                          <Eye className="w-4 h-4 mr-2" />
                          ดูรายละเอียด
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => togglePrimary(contact.id)}>
                          <Star className="w-4 h-4 mr-2" />
                          {contact.isPrimary ? "Remove Primary" : "Set as Primary"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setSelectedContact(contact)
                          setIsActivityDialogOpen(true)
                        }}>
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Log Activity
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDelete(contact.id)} className="text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {filteredContacts.length === 0 && (
          <Card className="bg-card border-border">
            <CardContent className="p-12 text-center">
              <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">ไม่พบ Contact ที่ตรงกับเงื่อนไข</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Contact Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">เพิ่ม Contact</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              กรอกข้อมูลผู้ติดต่อใหม่
            </DialogDescription>
          </DialogHeader>
          <ContactForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="border-border">
              ยกเลิก
            </Button>
            <Button onClick={handleSave} className="bg-primary text-primary-foreground">
              บันทึก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Contact Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">แก้ไข Contact</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              แก้ไขข้อมูลผู้ติดต่อ
            </DialogDescription>
          </DialogHeader>
          <ContactForm isEdit />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="border-border">
              ยกเลิก
            </Button>
            <Button onClick={handleEdit} className="bg-primary text-primary-foreground">
              บันทึก
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
              บันทึกกิจกรรมที่ทำกับ Contact
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-foreground">���ระเภท Activity</Label>
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
                placeholder="เช่น โทรติดตาม, นัดพบ"
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

      {/* Contact Detail Sheet */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="bg-card border-border w-full sm:max-w-2xl overflow-y-auto">
          {selectedContact && (
            <>
              <SheetHeader className="pb-4 border-b border-border">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-2xl">
                    {selectedContact.firstName.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <SheetTitle className="text-foreground text-xl">
                        {getFullName(selectedContact)}
                      </SheetTitle>
                      {selectedContact.isPrimary && (
                        <Badge className="bg-primary/20 text-primary">Primary</Badge>
                      )}
                      <Badge className={`${getTemperatureColor(selectedContact.temperature)} flex items-center gap-1`}>
                        {(() => {
                          const TempIcon = getTemperatureIcon(selectedContact.temperature)
                          return <TempIcon className="w-3 h-3" />
                        })()}
                        {selectedContact.temperature}
                      </Badge>
                    </div>
                    <SheetDescription className="text-muted-foreground">
                      {selectedContact.title} {selectedContact.department && `- ${selectedContact.department}`}
                    </SheetDescription>
                    {selectedContact.accountName && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Building2 className="w-4 h-4" />
                        {selectedContact.accountName}
                      </p>
                    )}
                  </div>
                </div>
              </SheetHeader>

              <Tabs defaultValue="info" className="mt-6">
                <TabsList className="bg-secondary border-border">
                  <TabsTrigger value="info">ข้อมูลทั่วไป</TabsTrigger>
                  <TabsTrigger value="opportunities">Opportunities ({getContactOpportunities(selectedContact.id).length})</TabsTrigger>
                  <TabsTrigger value="activities">Activities</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-6 mt-4">
                  {/* Contact Info */}
                  <Card className="bg-secondary/50 border-border">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">ข้อมูลติดต่อ</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground">{selectedContact.email}</span>
                      </div>
                      {selectedContact.phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span className="text-foreground">{selectedContact.phone}</span>
                        </div>
                      )}
                      {selectedContact.mobile && (
                        <div className="flex items-center gap-3">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span className="text-foreground">{selectedContact.mobile}</span>
                        </div>
                      )}
                      {selectedContact.address && (
                        <div className="flex items-start gap-3">
                          <Building2 className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <span className="text-foreground">{selectedContact.address}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Classification */}
                  <Card className="bg-secondary/50 border-border">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">ข้อมูลการจัดประเภท</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                      {selectedContact.source && (
                        <div>
                          <p className="text-xs text-muted-foreground">Source</p>
                          <p className="text-foreground">{selectedContact.source}</p>
                        </div>
                      )}
                      {selectedContact.campaign && (
                        <div>
                          <p className="text-xs text-muted-foreground">Campaign</p>
                          <p className="text-foreground">{selectedContact.campaign}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-muted-foreground">Owner</p>
                        <p className="text-foreground">{selectedContact.owner}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Created</p>
                        <p className="text-foreground">{selectedContact.createdAt}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Products */}
                  {selectedContact.interestedProducts.length > 0 && (
                    <Card className="bg-secondary/50 border-border">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">สินค้าที่สนใจ</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {selectedContact.interestedProducts.map((pid) => {
                            const product = products.find(p => p.id === pid)
                            return product ? (
                              <Badge key={pid} variant="outline" className="border-border">
                                {product.name}
                              </Badge>
                            ) : null
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Engagement */}
                  <Card className="bg-secondary/50 border-border">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Engagement</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-background rounded-lg">
                        <p className="text-2xl font-bold text-foreground">{selectedContact.emailOpens}</p>
                        <p className="text-xs text-muted-foreground">Email Opens</p>
                      </div>
                      <div className="text-center p-3 bg-background rounded-lg">
                        <p className="text-2xl font-bold text-foreground">{selectedContact.webVisits}</p>
                        <p className="text-xs text-muted-foreground">Web Visits</p>
                      </div>
                      <div className="text-center p-3 bg-background rounded-lg">
                        <p className="text-2xl font-bold text-foreground">{selectedContact.emailOpens + selectedContact.webVisits}</p>
                        <p className="text-xs text-muted-foreground">Total</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Notes */}
                  {selectedContact.notes && (
                    <Card className="bg-secondary/50 border-border">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">บันทึก</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-foreground">{selectedContact.notes}</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="opportunities" className="mt-4">
                  <div className="space-y-3">
                    {getContactOpportunities(selectedContact.id).length === 0 ? (
                      <Card className="bg-secondary/50 border-border">
                        <CardContent className="p-8 text-center">
                          <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                          <p className="text-muted-foreground">ยังไม่มี Opportunity</p>
                          <Button className="mt-4 bg-primary text-primary-foreground">
                            <Plus className="w-4 h-4 mr-2" />
                            สร้าง Opportunity
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      getContactOpportunities(selectedContact.id).map((opp) => (
                        <Card key={opp.id} className="bg-secondary/50 border-border">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-semibold text-foreground">{opp.name}</h4>
                                <div className="flex items-center gap-3 mt-2">
                                  <Badge className={getStageColor(opp.stage)}>
                                    {getStageName(opp.stage)}
                                  </Badge>
                                  <span className="text-sm text-muted-foreground">
                                    {opp.probability}% probability
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xl font-bold text-primary">{formatCurrency(opp.value)}</p>
                                <p className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                                  <Calendar className="w-3 h-3" />
                                  Close: {opp.closingDate}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="activities" className="mt-4">
                  <div className="flex justify-end mb-4">
                    <Button 
                      size="sm" 
                      className="bg-primary text-primary-foreground"
                      onClick={() => setIsActivityDialogOpen(true)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Log Activity
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {activities.map((activity) => {
                      const ActivityIcon = getActivityIcon(activity.type)
                      return (
                        <Card key={activity.id} className="bg-secondary/50 border-border">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="p-2 rounded-lg bg-primary/20">
                                <ActivityIcon className="w-4 h-4 text-primary" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium text-foreground">{activity.title}</h4>
                                  <Badge variant="outline" className="border-border text-xs">
                                    {activity.type}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {activity.date}
                                  </span>
                                  <span>by {activity.createdBy}</span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </TabsContent>
              </Tabs>

              {/* Actions */}
              <div className="flex gap-2 mt-6 pt-4 border-t border-border">
                <Button 
                  className="flex-1 bg-primary text-primary-foreground"
                  onClick={() => openEdit(selectedContact)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  แก้ไข
                </Button>
                <Button variant="outline" className="flex-1 border-border">
                  <Plus className="w-4 h-4 mr-2" />
                  สร้าง Opportunity
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
