"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Plus,
  MoreVertical,
  AlertTriangle,
  Calendar,
  Building2,
  DollarSign,
  ChevronRight,
  User,
  Search,
  Filter,
  Edit,
  Eye,
  Trash2,
  Package,
  X,
  Phone,
  Mail,
  Users,
  FileText,
  Clock,
  CheckCircle2,
  Circle,
  History,
  ExternalLink,
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
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type Stage = "qualification" | "proposal" | "negotiation" | "closed_won" | "closed_lost"
type ActivityType = "call" | "email" | "meeting" | "task" | "note"

interface OpportunityActivity {
  id: number
  type: ActivityType
  subject: string
  notes: string
  date: string
  time: string
  completed: boolean
  user: string
  createdAt: string
}

interface Quotation {
  id: number
  number: string
  status: "draft" | "pending_approval" | "approved" | "sent" | "accepted" | "rejected"
  total: number
  createdAt: string
  validUntil: string
}

interface Opportunity {
  id: number
  name: string
  contactId: number
  contactName: string
  accountId?: number
  accountName?: string
  value: number
  closingDate: string
  stage: Stage
  hasNextActivity: boolean
  probability: number
  products: number[]
  owner: string
  source: string
  notes?: string
  createdAt: string
  activities: OpportunityActivity[]
  quotations: Quotation[]
}

interface Product {
  id: number
  code: string
  name: string
  category: string
  unitPrice: number
}

interface Contact {
  id: number
  firstName: string
  lastName: string
  accountId?: number
  accountName?: string
}

// Activity Types
const activityTypes = [
  { id: "call", name: "โทร", icon: Phone, color: "bg-blue-500/20 text-blue-400" },
  { id: "email", name: "อีเมล", icon: Mail, color: "bg-purple-500/20 text-purple-400" },
  { id: "meeting", name: "เข้าพบ", icon: Users, color: "bg-green-500/20 text-green-400" },
  { id: "task", name: "งาน", icon: FileText, color: "bg-amber-500/20 text-amber-400" },
  { id: "note", name: "บันทึก", icon: FileText, color: "bg-gray-500/20 text-gray-400" },
]

// Mock Data
import { mockProducts as _sharedProducts, mockContacts as _sharedContactsFull, mockOpportunities as _sharedOpps } from '@/lib/crm-mock'
const products: Product[] = _sharedProducts as unknown as Product[]

const mockContacts: Contact[] = _sharedContactsFull.map((c) => ({ id: c.id, firstName: c.firstName, lastName: c.lastName, accountId: c.accountId, accountName: c.accountName })) as Contact[]

const salesTeam = [
  { id: 1, name: "สมชาย ใจดี", role: "Sales" },
  { id: 2, name: "สมหญิง รักดี", role: "Sales" },
  { id: 3, name: "วิชัย สุขสันต์", role: "Sales" },
  { id: 4, name: "ประภา ดีใจ", role: "Manager" },
]

const stages: { id: Stage; name: string; color: string; probability: number }[] = [
  { id: "qualification", name: "Qualification", color: "bg-status-new", probability: 20 },
  { id: "proposal", name: "Proposal", color: "bg-status-working", probability: 50 },
  { id: "negotiation", name: "Negotiation", color: "bg-chart-4", probability: 75 },
  { id: "closed_won", name: "Closed Won", color: "bg-status-won", probability: 100 },
  { id: "closed_lost", name: "Closed Lost", color: "bg-status-lost", probability: 0 },
]

const quotationStatusConfig = {
  draft: { label: "Draft", color: "bg-muted text-muted-foreground" },
  pending_approval: { label: "Pending", color: "bg-amber-500/20 text-amber-400" },
  approved: { label: "Approved", color: "bg-blue-500/20 text-blue-400" },
  sent: { label: "Sent", color: "bg-primary/20 text-primary" },
  accepted: { label: "Accepted", color: "bg-green-500/20 text-green-400" },
  rejected: { label: "Rejected", color: "bg-red-500/20 text-red-400" },
}

const initialOpportunities: Opportunity[] = _sharedOpps as unknown as Opportunity[]

const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    return `฿${(value / 1000000).toFixed(1)}M`
  }
  return `฿${(value / 1000).toFixed(0)}K`
}

const formatCurrencyFull = (value: number) => {
  return new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", minimumFractionDigits: 0 }).format(value)
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })
}

export function Opportunities() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>(initialOpportunities)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStage, setFilterStage] = useState("All")
  const [filterOwner, setFilterOwner] = useState("All")
  
  // Dialogs
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false)
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null)
  
  // Form state
  const [formData, setFormData] = useState<Partial<Opportunity>>({
    stage: "qualification",
    probability: 20,
    products: [],
    hasNextActivity: true,
  })

  // Activity form state
  const [activityForm, setActivityForm] = useState({
    type: "call" as ActivityType,
    subject: "",
    notes: "",
    date: new Date().toISOString().split("T")[0],
    time: "09:00",
  })

  const getOpportunitiesByStage = (stage: Stage) => {
    return filteredOpportunities.filter((opp) => opp.stage === stage)
  }

  const getStageTotal = (stage: Stage) => {
    return getOpportunitiesByStage(stage).reduce((sum, opp) => sum + opp.value, 0)
  }

  const getStageColor = (stage: Stage) => {
    return stages.find(s => s.id === stage)?.color || "bg-muted"
  }

  const getStageName = (stage: Stage) => {
    return stages.find(s => s.id === stage)?.name || stage
  }

  const getActivityTypeConfig = (type: ActivityType) => {
    return activityTypes.find(t => t.id === type) || activityTypes[0]
  }

  const filteredOpportunities = opportunities.filter((opp) => {
    const searchLower = searchQuery.toLowerCase()
    const matchesSearch = 
      opp.name.toLowerCase().includes(searchLower) ||
      opp.contactName.toLowerCase().includes(searchLower) ||
      (opp.accountName?.toLowerCase().includes(searchLower))
    
    const matchesStage = filterStage === "All" || opp.stage === filterStage
    const matchesOwner = filterOwner === "All" || opp.owner === filterOwner
    
    return matchesSearch && matchesStage && matchesOwner
  })

  const openDetail = (opp: Opportunity) => {
    setSelectedOpp(opp)
    setIsDetailOpen(true)
  }

  const openAdd = () => {
    setFormData({
      stage: "qualification",
      probability: 20,
      products: [],
      hasNextActivity: true,
      owner: salesTeam[0].name,
      closingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    })
    setIsAddDialogOpen(true)
  }

  const openEdit = (opp: Opportunity) => {
    setFormData(opp)
    setSelectedOpp(opp)
    setIsEditDialogOpen(true)
  }

  const openAddActivity = (opp: Opportunity) => {
    setSelectedOpp(opp)
    setActivityForm({
      type: "call",
      subject: "",
      notes: "",
      date: new Date().toISOString().split("T")[0],
      time: "09:00",
    })
    setIsActivityDialogOpen(true)
  }

  const handleSave = () => {
    const contact = mockContacts.find(c => c.id === formData.contactId)
    const productValue = (formData.products || []).reduce((sum, pid) => {
      const product = products.find(p => p.id === pid)
      return sum + (product?.unitPrice || 0)
    }, 0)

    const newOpp: Opportunity = {
      id: Date.now(),
      name: formData.name || "",
      contactId: formData.contactId || 0,
      contactName: contact ? `${contact.firstName} ${contact.lastName}` : "",
      accountId: contact?.accountId,
      accountName: contact?.accountName,
      value: formData.value || productValue,
      closingDate: formData.closingDate || "",
      stage: formData.stage || "qualification",
      hasNextActivity: formData.hasNextActivity ?? true,
      probability: formData.probability || 20,
      products: formData.products || [],
      owner: formData.owner || salesTeam[0].name,
      source: formData.source || "Direct",
      notes: formData.notes,
      createdAt: new Date().toISOString().split("T")[0],
      activities: [],
      quotations: [],
    }
    
    setOpportunities([newOpp, ...opportunities])
    setIsAddDialogOpen(false)
  }

  const handleEdit = () => {
    if (!selectedOpp) return
    const contact = mockContacts.find(c => c.id === formData.contactId)
    
    setOpportunities(opportunities.map(opp => 
      opp.id === selectedOpp.id 
        ? { 
            ...opp, 
            ...formData, 
            contactName: contact ? `${contact.firstName} ${contact.lastName}` : opp.contactName,
            accountId: contact?.accountId,
            accountName: contact?.accountName,
          } as Opportunity 
        : opp
    ))
    setIsEditDialogOpen(false)
  }

  const handleDelete = (id: number) => {
    setOpportunities(opportunities.filter(opp => opp.id !== id))
    if (selectedOpp?.id === id) {
      setIsDetailOpen(false)
    }
  }

  const handleStageChange = (oppId: number, newStage: Stage) => {
    const stageProbability = stages.find(s => s.id === newStage)?.probability || 0
    setOpportunities(opportunities.map(opp => 
      opp.id === oppId 
        ? { ...opp, stage: newStage, probability: stageProbability }
        : opp
    ))
  }

  const handleAddActivity = () => {
    if (!selectedOpp || !activityForm.subject) return

    const newActivity: OpportunityActivity = {
      id: Date.now(),
      type: activityForm.type,
      subject: activityForm.subject,
      notes: activityForm.notes,
      date: activityForm.date,
      time: activityForm.time,
      completed: false,
      user: selectedOpp.owner,
      createdAt: new Date().toISOString().split("T")[0],
    }

    setOpportunities(opportunities.map(opp =>
      opp.id === selectedOpp.id
        ? { ...opp, activities: [newActivity, ...opp.activities], hasNextActivity: true }
        : opp
    ))

    // Update selected opp for detail view
    setSelectedOpp({
      ...selectedOpp,
      activities: [newActivity, ...selectedOpp.activities],
      hasNextActivity: true,
    })

    setIsActivityDialogOpen(false)
  }

  const toggleActivityComplete = (oppId: number, activityId: number) => {
    setOpportunities(opportunities.map(opp => {
      if (opp.id !== oppId) return opp
      const updatedActivities = opp.activities.map(act =>
        act.id === activityId ? { ...act, completed: !act.completed } : act
      )
      return { ...opp, activities: updatedActivities }
    }))

    if (selectedOpp?.id === oppId) {
      setSelectedOpp({
        ...selectedOpp,
        activities: selectedOpp.activities.map(act =>
          act.id === activityId ? { ...act, completed: !act.completed } : act
        ),
      })
    }
  }

  // Stats
  const totalValue = opportunities.filter(o => o.stage !== "closed_lost").reduce((sum, o) => sum + o.value, 0)
  const wonValue = opportunities.filter(o => o.stage === "closed_won").reduce((sum, o) => sum + o.value, 0)
  const pipelineValue = opportunities.filter(o => !["closed_won", "closed_lost"].includes(o.stage)).reduce((sum, o) => sum + o.value, 0)
  const avgDealSize = pipelineValue / opportunities.filter(o => !["closed_won", "closed_lost"].includes(o.stage)).length || 0

  // Form Component
  const OpportunityForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label className="text-foreground">ชื่อ Opportunity *</Label>
        <Input
          value={formData.name || ""}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="bg-secondary border-border"
          placeholder="เช่น ERP Implementation - ABC"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-foreground">Contact *</Label>
        <Select 
          value={formData.contactId?.toString() || ""} 
          onValueChange={(v) => setFormData({ ...formData, contactId: parseInt(v) })}
        >
          <SelectTrigger className="bg-secondary border-border">
            <SelectValue placeholder="เลือก Contact" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            {mockContacts.map((contact) => (
              <SelectItem key={contact.id} value={contact.id.toString()}>
                {contact.firstName} {contact.lastName}
                {contact.accountName && ` - ${contact.accountName}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-foreground">Stage</Label>
          <Select 
            value={formData.stage} 
            onValueChange={(v) => {
              const stage = stages.find(s => s.id === v)
              setFormData({ ...formData, stage: v as Stage, probability: stage?.probability || 20 })
            }}
          >
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {stages.map((stage) => (
                <SelectItem key={stage.id} value={stage.id}>
                  {stage.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-foreground">Probability (%)</Label>
          <Input
            type="number"
            min={0}
            max={100}
            value={formData.probability || 0}
            onChange={(e) => setFormData({ ...formData, probability: parseInt(e.target.value) })}
            className="bg-secondary border-border"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-foreground">มูลค่า (บาท)</Label>
          <Input
            type="number"
            value={formData.value || 0}
            onChange={(e) => setFormData({ ...formData, value: parseInt(e.target.value) })}
            className="bg-secondary border-border"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-foreground">Expected Close Date</Label>
          <Input
            type="date"
            value={formData.closingDate || ""}
            onChange={(e) => setFormData({ ...formData, closingDate: e.target.value })}
            className="bg-secondary border-border"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-foreground">สินค้า/บริการ</Label>
        <div className="grid grid-cols-2 gap-2 p-3 bg-secondary rounded-lg border border-border max-h-[200px] overflow-y-auto">
          {products.map((product) => (
            <div key={product.id} className="flex items-center space-x-2">
              <Checkbox
                id={`opp-product-${product.id}`}
                checked={formData.products?.includes(product.id)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setFormData({ ...formData, products: [...(formData.products || []), product.id] })
                  } else {
                    setFormData({ ...formData, products: formData.products?.filter(id => id !== product.id) || [] })
                  }
                }}
              />
              <label
                htmlFor={`opp-product-${product.id}`}
                className="text-sm text-foreground cursor-pointer"
              >
                {product.name}
              </label>
            </div>
          ))}
        </div>
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
          <h2 className="text-2xl font-bold text-foreground">Opportunity Pipeline</h2>
          <p className="text-muted-foreground">จัดการและติดตามโอกาสในการขาย</p>
        </div>
        <Button onClick={openAdd} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          เพิ่ม Opportunity
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(pipelineValue)}</p>
                <p className="text-xs text-muted-foreground">Pipeline Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <DollarSign className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(wonValue)}</p>
                <p className="text-xs text-muted-foreground">Closed Won</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <FileText className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{opportunities.filter(o => !["closed_won", "closed_lost"].includes(o.stage)).length}</p>
                <p className="text-xs text-muted-foreground">Open Deals</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <DollarSign className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(avgDealSize)}</p>
                <p className="text-xs text-muted-foreground">Avg Deal Size</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหา Opportunity, Contact, Account..."
                className="pl-9 bg-secondary border-border"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterStage} onValueChange={setFilterStage}>
              <SelectTrigger className="w-[150px] bg-secondary border-border">
                <SelectValue placeholder="Stage" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="All">ทุก Stage</SelectItem>
                {stages.map((stage) => (
                  <SelectItem key={stage.id} value={stage.id}>{stage.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterOwner} onValueChange={setFilterOwner}>
              <SelectTrigger className="w-[150px] bg-secondary border-border">
                <SelectValue placeholder="Owner" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="All">ทุกคน</SelectItem>
                {salesTeam.map((person) => (
                  <SelectItem key={person.id} value={person.name}>{person.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stages.map((stage) => {
          const stageOpps = getOpportunitiesByStage(stage.id)
          const stageTotal = getStageTotal(stage.id)
          return (
            <div key={stage.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                  <h3 className="font-medium text-foreground">{stage.name}</h3>
                  <Badge variant="outline" className="border-border text-muted-foreground">
                    {stageOpps.length}
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{formatCurrency(stageTotal)}</p>
              
              <div className="space-y-2 min-h-[200px]">
                {stageOpps.map((opp) => (
                  <Card 
                    key={opp.id} 
                    className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => openDetail(opp)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-medium text-foreground text-sm line-clamp-2">{opp.name}</h4>
                        {!opp.hasNextActivity && stage.id !== "closed_won" && stage.id !== "closed_lost" && (
                          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        )}
                      </div>
                      
                      <div className="space-y-1.5 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          <span className="truncate">{opp.accountName || opp.contactName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(opp.closingDate)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span className="truncate">{opp.owner}</span>
                        </div>
                      </div>

                      {opp.products.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {opp.products.slice(0, 2).map((pid) => {
                            const product = products.find(p => p.id === pid)
                            return product ? (
                              <Badge key={pid} variant="outline" className="text-xs border-border text-muted-foreground">
                                {product.name.substring(0, 15)}...
                              </Badge>
                            ) : null
                          })}
                          {opp.products.length > 2 && (
                            <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                              +{opp.products.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
                        <p className="text-sm font-semibold text-primary">{formatCurrency(opp.value)}</p>
                        <Badge className="text-xs" variant="outline">
                          {opp.probability}%
                        </Badge>
                      </div>

                      {opp.quotations.length > 0 && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                          <History className="w-3 h-3" />
                          <span>{opp.quotations.length} Quotation(s)</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">เพิ่ม Opportunity ใหม่</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              กรอกข้อมูล Opportunity ที่ต้องการสร้าง
            </DialogDescription>
          </DialogHeader>
          <OpportunityForm />
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">แก้ไข Opportunity</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              แก้ไขข้อมูล Opportunity
            </DialogDescription>
          </DialogHeader>
          <OpportunityForm isEdit />
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
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">บันทึก Activity</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              บันทึกกิจกรรมที่ทำกับ Opportunity นี้
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-foreground">ประเภท Activity</Label>
              <Select value={activityForm.type} onValueChange={(v) => setActivityForm({ ...activityForm, type: v as ActivityType })}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {activityTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      <div className="flex items-center gap-2">
                        <type.icon className="w-4 h-4" />
                        {type.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground">วันที่</Label>
                <Input
                  type="date"
                  value={activityForm.date}
                  onChange={(e) => setActivityForm({ ...activityForm, date: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">เวลา</Label>
                <Input
                  type="time"
                  value={activityForm.time}
                  onChange={(e) => setActivityForm({ ...activityForm, time: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">หัวข้อ *</Label>
              <Input
                value={activityForm.subject}
                onChange={(e) => setActivityForm({ ...activityForm, subject: e.target.value })}
                className="bg-secondary border-border"
                placeholder="หัวข้อกิจกรรม"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">รายละเอียด</Label>
              <Textarea
                value={activityForm.notes}
                onChange={(e) => setActivityForm({ ...activityForm, notes: e.target.value })}
                className="bg-secondary border-border"
                rows={3}
                placeholder="บันทึกรายละเอียด..."
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

      {/* Detail Sheet */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="bg-card border-border w-full sm:max-w-2xl overflow-y-auto">
          {selectedOpp && (
            <>
              <SheetHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <SheetTitle className="text-foreground text-xl">{selectedOpp.name}</SheetTitle>
                    <SheetDescription className="text-muted-foreground">
                      {selectedOpp.accountName || selectedOpp.contactName}
                    </SheetDescription>
                  </div>
                  <Badge className={`${getStageColor(selectedOpp.stage)} text-white`}>
                    {getStageName(selectedOpp.stage)}
                  </Badge>
                </div>
              </SheetHeader>

              <Tabs defaultValue="details" className="mt-6">
                <TabsList className="bg-secondary border-border">
                  <TabsTrigger value="details">รายละเอียด</TabsTrigger>
                  <TabsTrigger value="activities">Activities ({selectedOpp.activities.length})</TabsTrigger>
                  <TabsTrigger value="quotations">Quotations ({selectedOpp.quotations.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-6 mt-4">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <Card className="bg-secondary border-border">
                      <CardContent className="p-3 text-center">
                        <p className="text-2xl font-bold text-primary">{formatCurrencyFull(selectedOpp.value)}</p>
                        <p className="text-xs text-muted-foreground">มูลค่า</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-secondary border-border">
                      <CardContent className="p-3 text-center">
                        <p className="text-2xl font-bold text-foreground">{selectedOpp.probability}%</p>
                        <p className="text-xs text-muted-foreground">Probability</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-secondary border-border">
                      <CardContent className="p-3 text-center">
                        <p className="text-2xl font-bold text-foreground">{formatDate(selectedOpp.closingDate)}</p>
                        <p className="text-xs text-muted-foreground">Close Date</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Details */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Contact</p>
                        <p className="text-foreground font-medium">{selectedOpp.contactName}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Account</p>
                        <p className="text-foreground font-medium">{selectedOpp.accountName || "-"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">ผู้รับผิดชอบ</p>
                        <p className="text-foreground font-medium">{selectedOpp.owner}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Source</p>
                        <p className="text-foreground font-medium">{selectedOpp.source}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">วันที่สร้าง</p>
                        <p className="text-foreground font-medium">{formatDate(selectedOpp.createdAt)}</p>
                      </div>
                    </div>

                    {selectedOpp.products.length > 0 && (
                      <div>
                        <p className="text-muted-foreground text-sm mb-2">สินค้า/บริการ</p>
                        <div className="space-y-2">
                          {selectedOpp.products.map((pid) => {
                            const product = products.find(p => p.id === pid)
                            return product ? (
                              <div key={pid} className="flex items-center justify-between p-2 bg-secondary rounded-lg">
                                <div className="flex items-center gap-2">
                                  <Package className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-foreground">{product.name}</span>
                                </div>
                                <span className="text-primary font-medium">{formatCurrencyFull(product.unitPrice)}</span>
                              </div>
                            ) : null
                          })}
                        </div>
                      </div>
                    )}

                    {selectedOpp.notes && (
                      <div>
                        <p className="text-muted-foreground text-sm mb-2">บันทึก</p>
                        <p className="text-foreground bg-secondary p-3 rounded-lg">{selectedOpp.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t border-border">
                    <Button onClick={() => openEdit(selectedOpp)} variant="outline" className="border-border">
                      <Edit className="w-4 h-4 mr-2" />
                      แก้ไข
                    </Button>
                    <Button onClick={() => openAddActivity(selectedOpp)} className="bg-primary text-primary-foreground">
                      <Plus className="w-4 h-4 mr-2" />
                      เพิ่ม Activity
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="activities" className="mt-4">
                  <div className="flex justify-end mb-4">
                    <Button onClick={() => openAddActivity(selectedOpp)} size="sm" className="bg-primary text-primary-foreground">
                      <Plus className="w-4 h-4 mr-2" />
                      เพิ่ม Activity
                    </Button>
                  </div>

                  {selectedOpp.activities.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>ยังไม่มี Activity</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedOpp.activities.map((activity) => {
                        const typeConfig = getActivityTypeConfig(activity.type)
                        const TypeIcon = typeConfig.icon
                        return (
                          <Card key={activity.id} className="bg-secondary border-border">
                            <CardContent className="p-3">
                              <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg ${typeConfig.color}`}>
                                  <TypeIcon className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <h4 className="font-medium text-foreground">{activity.subject}</h4>
                                        <button
                                          onClick={() => toggleActivityComplete(selectedOpp.id, activity.id)}
                                          className="focus:outline-none"
                                        >
                                          {activity.completed ? (
                                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                                          ) : (
                                            <Circle className="w-4 h-4 text-muted-foreground hover:text-primary" />
                                          )}
                                        </button>
                                      </div>
                                      {activity.notes && (
                                        <p className="text-sm text-muted-foreground mt-1">{activity.notes}</p>
                                      )}
                                    </div>
                                    <div className="text-right text-xs text-muted-foreground flex-shrink-0">
                                      <p className="font-medium text-foreground">{formatDate(activity.date)}</p>
                                      <p>{activity.time}</p>
                                    </div>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-2">โดย {activity.user}</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="quotations" className="mt-4">
                  {selectedOpp.quotations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>ยังไม่มี Quotation</p>
                      <Button variant="outline" className="mt-4 border-border">
                        <Plus className="w-4 h-4 mr-2" />
                        สร้าง Quotation
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedOpp.quotations.map((quotation) => {
                        const statusConfig = quotationStatusConfig[quotation.status]
                        return (
                          <Card key={quotation.id} className="bg-secondary border-border hover:border-primary/50 transition-colors cursor-pointer">
                            <CardContent className="p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 rounded-lg bg-primary/20">
                                    <FileText className="w-4 h-4 text-primary" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-medium text-foreground">{quotation.number}</h4>
                                      <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      สร้างเมื่อ {formatDate(quotation.createdAt)} | หมดอายุ {formatDate(quotation.validUntil)}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <p className="text-lg font-bold text-primary">{formatCurrencyFull(quotation.total)}</p>
                                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                                    <ExternalLink className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}

                      <Button variant="outline" className="w-full border-border border-dashed">
                        <Plus className="w-4 h-4 mr-2" />
                        สร้าง Quotation ใหม่
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
