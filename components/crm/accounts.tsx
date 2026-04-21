"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  Plus,
  Building2,
  Mail,
  Phone,
  Globe,
  DollarSign,
  MoreVertical,
  ExternalLink,
  TrendingUp,
  MapPin,
  Users,
  Edit,
  Eye,
  Trash2,
  UserPlus,
  X,
  FileText,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Contact {
  id: number
  name: string
  position?: string
  email?: string
  phone?: string
  isPrimary: boolean
}

interface Opportunity {
  id: number
  name: string
  stage: string
  value: number
  expectedCloseDate: string
  owner: string
}

interface Account {
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
  contacts: Contact[]
  opportunities: Opportunity[]
  quotations: number
  contracts: number
  owner: string
  createdAt: string
  description?: string
}

import { mockAccounts as _sharedAccounts } from '@/lib/crm-mock'
const initialAccounts: Account[] = _sharedAccounts as unknown as Account[]

const industries = ["Manufacturing", "Technology", "Retail", "Services", "Healthcare", "Finance", "Education", "Other"]
const accountTypes = ["Customer", "Prospect", "Partner", "Other"]
const opportunityStages = ["Qualification", "Needs Analysis", "Proposal", "Negotiation", "Closed Won", "Closed Lost"]
const salesOwners = ["สมชาย ใจดี", "สมหญิง รักดี", "วิชัย สุขสันต์", "สุนีย์ มีสุข"]

const products = [
  { id: 1, name: "ERP System", unitPrice: 500000 },
  { id: 2, name: "CRM Software", unitPrice: 200000 },
  { id: 3, name: "Business Intelligence", unitPrice: 300000 },
  { id: 4, name: "Cloud Services", unitPrice: 50000 },
  { id: 5, name: "Consulting Services", unitPrice: 100000 },
]

export function Accounts() {
  const [accounts, setAccounts] = useState(initialAccounts)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState("All")
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [formData, setFormData] = useState<Partial<Account>>({
    type: "Prospect",
    industry: "Technology",
  })

  // Contact Dialog
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false)
  const [contactForm, setContactForm] = useState<Partial<Contact>>({
    isPrimary: false,
  })
  const [editingContact, setEditingContact] = useState<Contact | null>(null)

  // Opportunity Dialog
  const [isOpportunityDialogOpen, setIsOpportunityDialogOpen] = useState(false)
  const [opportunityForm, setOpportunityForm] = useState({
    name: "",
    stage: "Qualification",
    value: 0,
    expectedCloseDate: "",
    owner: "สมชาย ใจดี",
    productIds: [] as number[],
  })

  // Delete Confirm
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "contact" | "opportunity" | "account"; id: number } | null>(null)

  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch = account.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = selectedType === "All" || account.type === selectedType
    return matchesSearch && matchesType
  })

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `฿${(value / 1000000).toFixed(1)}M`
    }
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 0,
    }).format(value)
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Customer":
        return "bg-green-500/20 text-green-400"
      case "Prospect":
        return "bg-blue-500/20 text-blue-400"
      case "Partner":
        return "bg-purple-500/20 text-purple-400"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "Qualification":
        return "bg-blue-500/20 text-blue-400"
      case "Needs Analysis":
        return "bg-purple-500/20 text-purple-400"
      case "Proposal":
        return "bg-amber-500/20 text-amber-400"
      case "Negotiation":
        return "bg-pink-500/20 text-pink-400"
      case "Closed Won":
        return "bg-green-500/20 text-green-400"
      case "Closed Lost":
        return "bg-red-500/20 text-red-400"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const openDetail = (account: Account) => {
    setSelectedAccount(account)
    setIsDetailOpen(true)
  }

  const openAdd = () => {
    setFormData({ type: "Prospect", industry: "Technology", owner: "สมชาย ใจดี" })
    setSelectedAccount(null)
    setIsEditMode(false)
    setIsAddDialogOpen(true)
  }

  const openEdit = (account: Account) => {
    setFormData(account)
    setSelectedAccount(account)
    setIsEditMode(true)
    setIsAddDialogOpen(true)
  }

  const handleSave = () => {
    if (isEditMode && selectedAccount) {
      setAccounts(accounts.map((a) => a.id === selectedAccount.id ? { ...a, ...formData } as Account : a))
      // Update selected account too
      setSelectedAccount({ ...selectedAccount, ...formData } as Account)
    } else {
      const newAccount: Account = {
        id: Date.now(),
        name: formData.name || "",
        taxId: formData.taxId,
        industry: formData.industry || "Other",
        type: (formData.type as Account["type"]) || "Prospect",
        website: formData.website,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        lifetimeValue: 0,
        contacts: [],
        opportunities: [],
        quotations: 0,
        contracts: 0,
        owner: formData.owner || "สมชาย ใจดี",
        createdAt: new Date().toISOString().split("T")[0],
        description: formData.description,
      }
      setAccounts([newAccount, ...accounts])
    }
    setIsAddDialogOpen(false)
  }

  const handleDeleteAccount = (id: number) => {
    setAccounts(accounts.filter((a) => a.id !== id))
    setDeleteConfirm(null)
    setIsDetailOpen(false)
  }

  // Contact handlers
  const openAddContact = () => {
    setContactForm({ isPrimary: false })
    setEditingContact(null)
    setIsContactDialogOpen(true)
  }

  const openEditContact = (contact: Contact) => {
    setContactForm(contact)
    setEditingContact(contact)
    setIsContactDialogOpen(true)
  }

  const handleSaveContact = () => {
    if (!selectedAccount) return

    const updatedAccounts = accounts.map((a) => {
      if (a.id !== selectedAccount.id) return a

      let updatedContacts: Contact[]
      if (editingContact) {
        updatedContacts = a.contacts.map((c) => 
          c.id === editingContact.id ? { ...c, ...contactForm } as Contact : c
        )
      } else {
        const newContact: Contact = {
          id: Date.now(),
          name: contactForm.name || "",
          position: contactForm.position,
          email: contactForm.email,
          phone: contactForm.phone,
          isPrimary: contactForm.isPrimary || false,
        }
        updatedContacts = [...a.contacts, newContact]
      }

      // If new contact is primary, unset others
      if (contactForm.isPrimary) {
        const contactId = editingContact?.id || updatedContacts[updatedContacts.length - 1].id
        updatedContacts = updatedContacts.map((c) => ({
          ...c,
          isPrimary: c.id === contactId,
        }))
      }

      return { ...a, contacts: updatedContacts }
    })

    setAccounts(updatedAccounts)
    const updated = updatedAccounts.find((a) => a.id === selectedAccount.id)
    if (updated) setSelectedAccount(updated)
    setIsContactDialogOpen(false)
  }

  const handleDeleteContact = (contactId: number) => {
    if (!selectedAccount) return

    const updatedAccounts = accounts.map((a) => {
      if (a.id !== selectedAccount.id) return a
      return { ...a, contacts: a.contacts.filter((c) => c.id !== contactId) }
    })

    setAccounts(updatedAccounts)
    const updated = updatedAccounts.find((a) => a.id === selectedAccount.id)
    if (updated) setSelectedAccount(updated)
    setDeleteConfirm(null)
  }

  // Opportunity handlers
  const openAddOpportunity = () => {
    setOpportunityForm({
      name: "",
      stage: "Qualification",
      value: 0,
      expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      owner: selectedAccount?.owner || "สมชาย ใจดี",
      productIds: [],
    })
    setIsOpportunityDialogOpen(true)
  }

  const handleSaveOpportunity = () => {
    if (!selectedAccount) return

    const newOpp: Opportunity = {
      id: Date.now(),
      name: opportunityForm.name,
      stage: opportunityForm.stage,
      value: opportunityForm.value,
      expectedCloseDate: opportunityForm.expectedCloseDate,
      owner: opportunityForm.owner,
    }

    const updatedAccounts = accounts.map((a) => {
      if (a.id !== selectedAccount.id) return a
      return { ...a, opportunities: [...a.opportunities, newOpp] }
    })

    setAccounts(updatedAccounts)
    const updated = updatedAccounts.find((a) => a.id === selectedAccount.id)
    if (updated) setSelectedAccount(updated)
    setIsOpportunityDialogOpen(false)
  }

  const handleDeleteOpportunity = (oppId: number) => {
    if (!selectedAccount) return

    const updatedAccounts = accounts.map((a) => {
      if (a.id !== selectedAccount.id) return a
      return { ...a, opportunities: a.opportunities.filter((o) => o.id !== oppId) }
    })

    setAccounts(updatedAccounts)
    const updated = updatedAccounts.find((a) => a.id === selectedAccount.id)
    if (updated) setSelectedAccount(updated)
    setDeleteConfirm(null)
  }

  const calculateOppValue = (productIds: number[]) => {
    return productIds.reduce((sum, id) => {
      const product = products.find((p) => p.id === id)
      return sum + (product?.unitPrice || 0)
    }, 0)
  }

  // Stats
  const totalAccounts = accounts.length
  const totalCustomers = accounts.filter((a) => a.type === "Customer").length
  const totalLifetimeValue = accounts.reduce((sum, a) => sum + a.lifetimeValue, 0)
  const totalOpenOpps = accounts.reduce((sum, a) => sum + a.opportunities.filter((o) => !o.stage.startsWith("Closed")).length, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Accounts</h2>
          <p className="text-muted-foreground">จัดการข้อมูลบริษัทและองค์กร</p>
        </div>
        <Button onClick={openAdd} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          เพิ่ม Account
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalAccounts}</p>
                <p className="text-xs text-muted-foreground">Accounts ทั้งหมด</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Users className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalCustomers}</p>
                <p className="text-xs text-muted-foreground">Customers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <DollarSign className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(totalLifetimeValue)}</p>
                <p className="text-xs text-muted-foreground">Lifetime Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalOpenOpps}</p>
                <p className="text-xs text-muted-foreground">Open Opportunities</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหา Account..."
                className="pl-9 bg-secondary border-border"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {["All", ...accountTypes].map((type) => (
                <Button
                  key={type}
                  variant={selectedType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType(type)}
                  className={
                    selectedType === type
                      ? "bg-primary text-primary-foreground"
                      : "border-border text-foreground hover:bg-secondary"
                  }
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accounts List */}
      <div className="space-y-3">
        {filteredAccounts.map((account) => (
          <Card
            key={account.id}
            className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => openDetail(account)}
          >
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* Account Info */}
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-semibold text-lg">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-foreground">{account.name}</h3>
                      <Badge className={getTypeColor(account.type)}>{account.type}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" />
                        {account.industry}
                      </span>
                      {account.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" />
                          {account.phone}
                        </span>
                      )}
                      {account.website && (
                        <span className="flex items-center gap-1">
                          <Globe className="w-3.5 h-3.5" />
                          {account.website}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-lg font-bold text-primary">{formatCurrency(account.lifetimeValue)}</p>
                    <p className="text-xs text-muted-foreground">Lifetime Value</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">{account.opportunities.filter((o) => !o.stage.startsWith("Closed")).length}</p>
                    <p className="text-xs text-muted-foreground">Open Opp.</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">{account.contacts.length}</p>
                    <p className="text-xs text-muted-foreground">Contacts</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => openDetail(account)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => openEdit(account)}
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
                      <DropdownMenuItem onClick={() => { setSelectedAccount(account); openAddOpportunity(); }}>
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Create Opportunity
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setSelectedAccount(account); openAddContact(); }}>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add Contact
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDeleteConfirm({ type: "account", id: account.id })} className="text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredAccounts.length === 0 && (
          <Card className="bg-card border-border">
            <CardContent className="p-8 text-center">
              <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">ไม่พบ Account</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add/Edit Account Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {isEditMode ? "แก้ไข Account" : "เพิ่ม Account"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {isEditMode ? "แก้ไขข้อมูลบริษัท" : "กรอกข้อมูลบริษัทใหม่"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-foreground">ชื่อบริษัท *</Label>
              <Input
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground">เลขประจำตัวผู้เสียภาษี</Label>
                <Input
                  value={formData.taxId || ""}
                  onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                  className="bg-secondary border-border"
                  maxLength={13}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">ประเภท</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as Account["type"] })}
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {accountTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">อุตสาหกรรม</Label>
              <Select
                value={formData.industry}
                onValueChange={(value) => setFormData({ ...formData, industry: value })}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {industries.map((industry) => (
                    <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                <Label className="text-foreground">อีเมล</Label>
                <Input
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">เว็บไซต์</Label>
              <Input
                value={formData.website || ""}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="bg-secondary border-border"
                placeholder="www.example.com"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">ที่อยู่</Label>
              <Textarea
                value={formData.address || ""}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="bg-secondary border-border min-h-[60px]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">รายละเอียดเพิ่มเติม</Label>
              <Textarea
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-secondary border-border min-h-[60px]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">ผู้รับผิดชอบ</Label>
              <Select
                value={formData.owner || "สมชาย ใจดี"}
                onValueChange={(value) => setFormData({ ...formData, owner: value })}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {salesOwners.map((owner) => (
                    <SelectItem key={owner} value={owner}>{owner}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="border-border">
              ยกเลิก
            </Button>
            <Button onClick={handleSave} disabled={!formData.name} className="bg-primary text-primary-foreground">
              บันทึก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Contact Dialog */}
      <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editingContact ? "แก้ไข Contact" : "เพิ่ม Contact"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editingContact ? "แก้ไขข้อมูลผู้ติดต่อ" : "เพิ่มผู้ติดต่อใหม่สำหรับ Account นี้"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-foreground">ชื่อ-นามสกุล *</Label>
              <Input
                value={contactForm.name || ""}
                onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">ตำแหน่ง</Label>
              <Input
                value={contactForm.position || ""}
                onChange={(e) => setContactForm({ ...contactForm, position: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground">อีเมล</Label>
                <Input
                  type="email"
                  value={contactForm.email || ""}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">โทรศัพท์</Label>
                <Input
                  value={contactForm.phone || ""}
                  onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPrimary"
                checked={contactForm.isPrimary || false}
                onChange={(e) => setContactForm({ ...contactForm, isPrimary: e.target.checked })}
                className="rounded border-border"
              />
              <Label htmlFor="isPrimary" className="text-foreground cursor-pointer">
                เป็นผู้ติดต่อหลัก (Primary Contact)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsContactDialogOpen(false)} className="border-border">
              ยกเลิก
            </Button>
            <Button onClick={handleSaveContact} disabled={!contactForm.name} className="bg-primary text-primary-foreground">
              บันทึก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Opportunity Dialog */}
      <Dialog open={isOpportunityDialogOpen} onOpenChange={setIsOpportunityDialogOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">สร้าง Opportunity</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              สร้างโอกาสขายใหม่สำหรับ {selectedAccount?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-foreground">ชื่อ Opportunity *</Label>
              <Input
                value={opportunityForm.name}
                onChange={(e) => setOpportunityForm({ ...opportunityForm, name: e.target.value })}
                className="bg-secondary border-border"
                placeholder="เช่น ERP Implementation Phase 1"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">สินค้า/บริการ</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto p-2 bg-secondary rounded-md border border-border">
                {products.map((product) => (
                  <div key={product.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`product-${product.id}`}
                      checked={opportunityForm.productIds.includes(product.id)}
                      onChange={(e) => {
                        const newIds = e.target.checked
                          ? [...opportunityForm.productIds, product.id]
                          : opportunityForm.productIds.filter((id) => id !== product.id)
                        setOpportunityForm({
                          ...opportunityForm,
                          productIds: newIds,
                          value: calculateOppValue(newIds),
                        })
                      }}
                      className="rounded border-border"
                    />
                    <Label htmlFor={`product-${product.id}`} className="text-foreground cursor-pointer flex-1 flex items-center justify-between">
                      <span>{product.name}</span>
                      <span className="text-muted-foreground">{formatCurrency(product.unitPrice)}</span>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground">มูลค่า (฿)</Label>
                <Input
                  type="number"
                  value={opportunityForm.value}
                  onChange={(e) => setOpportunityForm({ ...opportunityForm, value: parseFloat(e.target.value) || 0 })}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Stage</Label>
                <Select
                  value={opportunityForm.stage}
                  onValueChange={(value) => setOpportunityForm({ ...opportunityForm, stage: value })}
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {opportunityStages.filter((s) => !s.startsWith("Closed")).map((stage) => (
                      <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground">คาดว่าจะปิด</Label>
                <Input
                  type="date"
                  value={opportunityForm.expectedCloseDate}
                  onChange={(e) => setOpportunityForm({ ...opportunityForm, expectedCloseDate: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">ผู้รับผิดชอบ</Label>
                <Select
                  value={opportunityForm.owner}
                  onValueChange={(value) => setOpportunityForm({ ...opportunityForm, owner: value })}
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {salesOwners.map((owner) => (
                      <SelectItem key={owner} value={owner}>{owner}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpportunityDialogOpen(false)} className="border-border">
              ยกเลิก
            </Button>
            <Button onClick={handleSaveOpportunity} disabled={!opportunityForm.name} className="bg-primary text-primary-foreground">
              สร้าง Opportunity
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {deleteConfirm?.type === "account" && "คุณต้องการลบ Account นี้หรือไม่? ข้อมูล Contacts และ Opportunities ทั้งหมดจะถูกลบด้วย"}
              {deleteConfirm?.type === "contact" && "คุณต้องการลบ Contact นี้หรือไม่?"}
              {deleteConfirm?.type === "opportunity" && "คุณต้องการลบ Opportunity นี้หรือไม่?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => {
                if (deleteConfirm?.type === "account") handleDeleteAccount(deleteConfirm.id)
                else if (deleteConfirm?.type === "contact") handleDeleteContact(deleteConfirm.id)
                else if (deleteConfirm?.type === "opportunity") handleDeleteOpportunity(deleteConfirm.id)
              }}
            >
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Detail Sheet */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="bg-card border-border w-full sm:max-w-xl overflow-y-auto">
          {selectedAccount && (
            <>
              <SheetHeader>
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                    <Building2 className="w-7 h-7" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <SheetTitle className="text-foreground text-xl">{selectedAccount.name}</SheetTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => openEdit(selectedAccount)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                    <SheetDescription className="text-muted-foreground">
                      {selectedAccount.industry}
                    </SheetDescription>
                    <Badge className={`mt-2 ${getTypeColor(selectedAccount.type)}`}>{selectedAccount.type}</Badge>
                  </div>
                </div>
              </SheetHeader>

              <div className="space-y-6 mt-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-secondary/30 border-border">
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-primary">{formatCurrency(selectedAccount.lifetimeValue)}</p>
                      <p className="text-xs text-muted-foreground">Lifetime Value</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-secondary/30 border-border">
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-foreground">{selectedAccount.opportunities.filter((o) => !o.stage.startsWith("Closed")).length}</p>
                      <p className="text-xs text-muted-foreground">Open Opportunities</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="info" className="w-full">
                  <TabsList className="bg-secondary border border-border w-full">
                    <TabsTrigger value="info" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      ข้อมูล
                    </TabsTrigger>
                    <TabsTrigger value="contacts" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      Contacts ({selectedAccount.contacts.length})
                    </TabsTrigger>
                    <TabsTrigger value="opportunities" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      Opp. ({selectedAccount.opportunities.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="info" className="mt-4 space-y-4">
                    <Card className="bg-secondary/30 border-border">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground">ข้อมูลการติดต่อ</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {selectedAccount.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <a href={`tel:${selectedAccount.phone}`} className="text-primary hover:underline">
                              {selectedAccount.phone}
                            </a>
                          </div>
                        )}
                        {selectedAccount.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <a href={`mailto:${selectedAccount.email}`} className="text-primary hover:underline">
                              {selectedAccount.email}
                            </a>
                          </div>
                        )}
                        {selectedAccount.website && (
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-muted-foreground" />
                            <a
                              href={`https://${selectedAccount.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline flex items-center gap-1"
                            >
                              {selectedAccount.website}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                        {selectedAccount.address && (
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                            <p className="text-foreground">{selectedAccount.address}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {selectedAccount.taxId && (
                      <Card className="bg-secondary/30 border-border">
                        <CardContent className="p-4">
                          <p className="text-xs text-muted-foreground">เลขประจำตัวผู้เสียภาษี</p>
                          <p className="text-foreground font-mono">{selectedAccount.taxId}</p>
                        </CardContent>
                      </Card>
                    )}

                    {selectedAccount.description && (
                      <Card className="bg-secondary/30 border-border">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-muted-foreground">รายละเอียด</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-foreground">{selectedAccount.description}</p>
                        </CardContent>
                      </Card>
                    )}

                    <Card className="bg-secondary/30 border-border">
                      <CardContent className="p-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Owner</p>
                            <p className="text-foreground">{selectedAccount.owner}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">สร้างเมื่อ</p>
                            <p className="text-foreground">{selectedAccount.createdAt}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="contacts" className="mt-4 space-y-3">
                    <div className="flex justify-end">
                      <Button size="sm" onClick={openAddContact} className="bg-primary text-primary-foreground">
                        <UserPlus className="w-4 h-4 mr-2" />
                        เพิ่ม Contact
                      </Button>
                    </div>
                    
                    {selectedAccount.contacts.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>ยังไม่มี Contact</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedAccount.contacts.map((contact) => (
                          <Card key={contact.id} className="bg-secondary/30 border-border">
                            <CardContent className="p-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium text-foreground">{contact.name}</p>
                                    {contact.isPrimary && (
                                      <Badge className="bg-primary/20 text-primary text-xs">Primary</Badge>
                                    )}
                                  </div>
                                  {contact.position && (
                                    <p className="text-sm text-muted-foreground">{contact.position}</p>
                                  )}
                                  <div className="flex items-center gap-4 mt-1 text-sm">
                                    {contact.email && (
                                      <a href={`mailto:${contact.email}`} className="text-primary hover:underline flex items-center gap-1">
                                        <Mail className="w-3 h-3" />
                                        {contact.email}
                                      </a>
                                    )}
                                    {contact.phone && (
                                      <a href={`tel:${contact.phone}`} className="text-primary hover:underline flex items-center gap-1">
                                        <Phone className="w-3 h-3" />
                                        {contact.phone}
                                      </a>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                    onClick={() => openEditContact(contact)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                    onClick={() => setDeleteConfirm({ type: "contact", id: contact.id })}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="opportunities" className="mt-4 space-y-3">
                    <div className="flex justify-end">
                      <Button size="sm" onClick={openAddOpportunity} className="bg-primary text-primary-foreground">
                        <Plus className="w-4 h-4 mr-2" />
                        สร้าง Opportunity
                      </Button>
                    </div>
                    
                    {selectedAccount.opportunities.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>ยังไม่มี Opportunity</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedAccount.opportunities.map((opp) => (
                          <Card key={opp.id} className="bg-secondary/30 border-border">
                            <CardContent className="p-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium text-foreground">{opp.name}</p>
                                    <Badge className={getStageColor(opp.stage)}>{opp.stage}</Badge>
                                  </div>
                                  <div className="flex items-center gap-4 mt-1 text-sm">
                                    <span className="text-primary font-semibold">{formatCurrency(opp.value)}</span>
                                    <span className="text-muted-foreground flex items-center gap-1">
                                      <FileText className="w-3 h-3" />
                                      Close: {opp.expectedCloseDate}
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">Owner: {opp.owner}</p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  onClick={() => setDeleteConfirm({ type: "opportunity", id: opp.id })}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
