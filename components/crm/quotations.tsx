"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Search,
  Plus,
  FileText,
  Download,
  Eye,
  Send,
  MoreVertical,
  Building2,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Package,
  Trash2,
  Edit,
  ExternalLink,
  Copy,
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
  DialogTrigger,
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

interface LineItem {
  id: number
  productId: number
  productCode: string
  productName: string
  quantity: number
  unitPrice: number
  discount: number
  total: number
}

interface Opportunity {
  id: number
  name: string
  accountName?: string
  contactName: string
  value: number
  stage: string
}

interface Quotation {
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
  lineItems: LineItem[]
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
import { mockProducts as _sharedProducts, mockOpportunitySummaries as _sharedOppSummaries, mockQuotations as _sharedQuotations } from '@/lib/crm-mock'
const products: Product[] = _sharedProducts as unknown as Product[]

const mockOpportunities: Opportunity[] = _sharedOppSummaries as unknown as Opportunity[]

const initialQuotations: Quotation[] = _sharedQuotations as unknown as Quotation[]

const statusConfig = {
  draft: { label: "Draft", color: "bg-muted text-muted-foreground", icon: FileText },
  pending_approval: { label: "Pending Approval", color: "bg-amber-500/20 text-amber-400", icon: Clock },
  approved: { label: "Approved", color: "bg-blue-500/20 text-blue-400", icon: CheckCircle2 },
  sent: { label: "Sent", color: "bg-primary/20 text-primary", icon: Send },
  accepted: { label: "Accepted", color: "bg-green-500/20 text-green-400", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "bg-red-500/20 text-red-400", icon: XCircle },
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", minimumFractionDigits: 0 }).format(value)
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })
}

export function Quotations() {
  const [quotations, setQuotations] = useState<Quotation[]>(initialQuotations)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [opportunityFilter, setOpportunityFilter] = useState<string>("all")
  
  // Dialogs
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null)
  
  // Form state
  const [formData, setFormData] = useState<{
    opportunityId: number
    discountPercent: number
    vatPercent: number
    validDays: number
    notes: string
    lineItems: { productId: number; quantity: number; discount: number }[]
  }>({
    opportunityId: 0,
    discountPercent: 0,
    vatPercent: 7,
    validDays: 30,
    notes: "",
    lineItems: [],
  })

  const filteredQuotations = quotations.filter((q) => {
    const matchesSearch =
      q.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.accountName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.opportunityName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || q.status === statusFilter
    const matchesOpportunity = opportunityFilter === "all" || q.opportunityId.toString() === opportunityFilter
    return matchesSearch && matchesStatus && matchesOpportunity
  })

  const openDetail = (quotation: Quotation) => {
    setSelectedQuotation(quotation)
    setIsDetailOpen(true)
  }

  const openAdd = (opportunityId?: number) => {
    setFormData({
      opportunityId: opportunityId || 0,
      discountPercent: 0,
      vatPercent: 7,
      validDays: 30,
      notes: "",
      lineItems: [],
    })
    setIsAddDialogOpen(true)
  }

  const addLineItem = () => {
    setFormData({
      ...formData,
      lineItems: [...formData.lineItems, { productId: 0, quantity: 1, discount: 0 }],
    })
  }

  const removeLineItem = (index: number) => {
    setFormData({
      ...formData,
      lineItems: formData.lineItems.filter((_, i) => i !== index),
    })
  }

  const updateLineItem = (index: number, field: string, value: number) => {
    setFormData({
      ...formData,
      lineItems: formData.lineItems.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      ),
    })
  }

  const calculateTotals = () => {
    const subtotal = formData.lineItems.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId)
      if (!product) return sum
      const lineTotal = product.unitPrice * item.quantity * (1 - item.discount / 100)
      return sum + lineTotal
    }, 0)
    
    const discountAmount = subtotal * (formData.discountPercent / 100)
    const afterDiscount = subtotal - discountAmount
    const vatAmount = afterDiscount * (formData.vatPercent / 100)
    const grandTotal = afterDiscount + vatAmount

    return { subtotal, discountAmount, afterDiscount, vatAmount, grandTotal }
  }

  const handleSave = () => {
    const opportunity = mockOpportunities.find(o => o.id === formData.opportunityId)
    if (!opportunity || formData.lineItems.length === 0) return

    const totals = calculateTotals()
    const today = new Date()
    const validUntil = new Date(today.getTime() + formData.validDays * 24 * 60 * 60 * 1000)

    const newQuotation: Quotation = {
      id: Date.now(),
      number: `Q2024-${String(quotations.length + 53).padStart(4, "0")}`,
      opportunityId: formData.opportunityId,
      opportunityName: opportunity.name,
      accountName: opportunity.accountName || "",
      contactName: opportunity.contactName,
      status: "draft",
      subtotal: totals.subtotal,
      discountPercent: formData.discountPercent,
      discountAmount: totals.discountAmount,
      vatPercent: formData.vatPercent,
      vatAmount: totals.vatAmount,
      grandTotal: totals.grandTotal,
      createdAt: today.toISOString().split("T")[0],
      validUntil: validUntil.toISOString().split("T")[0],
      notes: formData.notes,
      lineItems: formData.lineItems.map((item, index) => {
        const product = products.find(p => p.id === item.productId)!
        const total = product.unitPrice * item.quantity * (1 - item.discount / 100)
        return {
          id: index + 1,
          productId: item.productId,
          productCode: product.code,
          productName: product.name,
          quantity: item.quantity,
          unitPrice: product.unitPrice,
          discount: item.discount,
          total,
        }
      }),
      createdBy: "Current User",
    }

    setQuotations([newQuotation, ...quotations])
    setIsAddDialogOpen(false)
  }

  const handleStatusChange = (quotationId: number, newStatus: Quotation["status"]) => {
    setQuotations(quotations.map(q => 
      q.id === quotationId ? { ...q, status: newStatus } : q
    ))
    if (selectedQuotation?.id === quotationId) {
      setSelectedQuotation({ ...selectedQuotation, status: newStatus })
    }
  }

  const handleDuplicate = (quotation: Quotation) => {
    const today = new Date()
    const validUntil = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
    
    const newQuotation: Quotation = {
      ...quotation,
      id: Date.now(),
      number: `Q2024-${String(quotations.length + 53).padStart(4, "0")}`,
      status: "draft",
      createdAt: today.toISOString().split("T")[0],
      validUntil: validUntil.toISOString().split("T")[0],
    }

    setQuotations([newQuotation, ...quotations])
  }

  // Stats
  const totalQuotations = quotations.length
  const pendingValue = quotations.filter(q => ["draft", "pending_approval", "approved", "sent"].includes(q.status)).reduce((sum, q) => sum + q.grandTotal, 0)
  const acceptedValue = quotations.filter(q => q.status === "accepted").reduce((sum, q) => sum + q.grandTotal, 0)

  const totals = calculateTotals()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Quotation Management</h2>
          <p className="text-muted-foreground">สร้างและจัดการใบเสนอราคา</p>
        </div>
        <Button onClick={() => openAdd()} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          สร้างใบเสนอราคา
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalQuotations}</p>
                <p className="text-xs text-muted-foreground">Total Quotations</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{quotations.filter(q => q.status === "pending_approval").length}</p>
                <p className="text-xs text-muted-foreground">Pending Approval</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <DollarSign className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(pendingValue)}</p>
                <p className="text-xs text-muted-foreground">Pending Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(acceptedValue)}</p>
                <p className="text-xs text-muted-foreground">Accepted Value</p>
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
                placeholder="ค้นหาเลขที่ใบเสนอราคา, บริษัท, Opportunity..."
                className="pl-9 bg-secondary border-border"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-secondary border-border">
                <SelectValue placeholder="สถานะทั้งหมด" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all">สถานะทั้งหมด</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending_approval">Pending Approval</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={opportunityFilter} onValueChange={setOpportunityFilter}>
              <SelectTrigger className="w-[200px] bg-secondary border-border">
                <SelectValue placeholder="Opportunity ทั้งหมด" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all">Opportunity ทั้งหมด</SelectItem>
                {mockOpportunities.map((opp) => (
                  <SelectItem key={opp.id} value={opp.id.toString()}>{opp.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Quotations List */}
      <div className="space-y-3">
        {filteredQuotations.map((quotation) => {
          const status = statusConfig[quotation.status]
          const StatusIcon = status.icon
          return (
            <Card
              key={quotation.id}
              className="bg-card border-border hover:border-primary/50 transition-colors"
            >
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Quotation Info */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{quotation.number}</h3>
                        <Badge className={status.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {status.label}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5" />
                          {quotation.accountName}
                        </span>
                        <span className="flex items-center gap-1 text-primary">
                          <ExternalLink className="w-3.5 h-3.5" />
                          {quotation.opportunityName}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Amount & Dates */}
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">{formatCurrency(quotation.grandTotal)}</p>
                      {quotation.discountAmount > 0 && (
                        <p className="text-xs text-green-400">
                          ส่วนลด {formatCurrency(quotation.discountAmount)} ({quotation.discountPercent}%)
                        </p>
                      )}
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-sm text-foreground">{formatDate(quotation.createdAt)}</p>
                      <p className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                        <Calendar className="w-3 h-3" />
                        หมดอายุ {formatDate(quotation.validUntil)}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                      onClick={() => openDetail(quotation)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    {quotation.status === "pending_approval" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-green-500 text-green-400 hover:bg-green-500 hover:text-white"
                        onClick={() => handleStatusChange(quotation.id, "approved")}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Approve
                      </Button>
                    )}
                    {(quotation.status === "approved" || quotation.status === "draft") && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                        onClick={() => handleStatusChange(quotation.id, "sent")}
                      >
                        <Send className="w-3.5 h-3.5 mr-1" />
                        ส่งให้ลูกค้า
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover border-border">
                        <DropdownMenuItem onClick={() => openDetail(quotation)}>
                          <Eye className="w-4 h-4 mr-2" />
                          ดูรายละเอียด
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          แก้ไข
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(quotation)}>
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="w-4 h-4 mr-2" />
                          Download PDF
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {quotation.status === "sent" && (
                          <>
                            <DropdownMenuItem onClick={() => handleStatusChange(quotation.id, "accepted")}>
                              <CheckCircle2 className="w-4 h-4 mr-2 text-green-400" />
                              Mark as Accepted
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(quotation.id, "rejected")}>
                              <XCircle className="w-4 h-4 mr-2 text-red-400" />
                              Mark as Rejected
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem className="text-destructive">
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

        {filteredQuotations.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>ไม่พบใบเสนอราคา</p>
          </div>
        )}
      </div>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="bg-card border-border max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">สร้างใบเสนอราคาใหม่</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              กรอกข้อมูลใบเสนอราคา
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Opportunity Selection */}
            <div className="space-y-2">
              <Label className="text-foreground">Opportunity *</Label>
              <Select 
                value={formData.opportunityId.toString()} 
                onValueChange={(v) => setFormData({ ...formData, opportunityId: parseInt(v) })}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="เลือก Opportunity" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {mockOpportunities.map((opp) => (
                    <SelectItem key={opp.id} value={opp.id.toString()}>
                      {opp.name} - {opp.accountName || opp.contactName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Line Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-foreground">รายการสินค้า/บริการ</Label>
                <Button variant="outline" size="sm" onClick={addLineItem} className="border-border">
                  <Plus className="w-4 h-4 mr-1" />
                  เพิ่มรายการ
                </Button>
              </div>

              {formData.lineItems.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-border rounded-lg">
                  <Package className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">ยังไม่มีรายการ กดปุ่ม "เพิ่มรายการ" เพื่อเริ่มต้น</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {formData.lineItems.map((item, index) => {
                    const product = products.find(p => p.id === item.productId)
                    const lineTotal = product ? product.unitPrice * item.quantity * (1 - item.discount / 100) : 0
                    return (
                      <Card key={index} className="bg-secondary border-border">
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            <div className="flex-1 grid grid-cols-4 gap-3">
                              <div className="col-span-2">
                                <Label className="text-xs text-muted-foreground">สินค้า/บริการ</Label>
                                <Select 
                                  value={item.productId.toString()} 
                                  onValueChange={(v) => updateLineItem(index, "productId", parseInt(v))}
                                >
                                  <SelectTrigger className="bg-background border-border mt-1">
                                    <SelectValue placeholder="เลือก" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-popover border-border">
                                    {products.map((p) => (
                                      <SelectItem key={p.id} value={p.id.toString()}>
                                        {p.name} ({formatCurrency(p.unitPrice)})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">จำนวน</Label>
                                <Input
                                  type="number"
                                  min={1}
                                  value={item.quantity}
                                  onChange={(e) => updateLineItem(index, "quantity", parseInt(e.target.value) || 1)}
                                  className="bg-background border-border mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">ส่วนลด %</Label>
                                <Input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={item.discount}
                                  onChange={(e) => updateLineItem(index, "discount", parseInt(e.target.value) || 0)}
                                  className="bg-background border-border mt-1"
                                />
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">รวม</p>
                              <p className="font-medium text-foreground">{formatCurrency(lineTotal)}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeLineItem(index)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Discount & VAT */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground">ส่วนลดรวม (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={formData.discountPercent}
                  onChange={(e) => setFormData({ ...formData, discountPercent: parseInt(e.target.value) || 0 })}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">VAT (%)</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.vatPercent}
                  onChange={(e) => setFormData({ ...formData, vatPercent: parseInt(e.target.value) || 0 })}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">มีผลภายใน (วัน)</Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.validDays}
                  onChange={(e) => setFormData({ ...formData, validDays: parseInt(e.target.value) || 30 })}
                  className="bg-secondary border-border"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label className="text-foreground">หมายเหตุ</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="bg-secondary border-border"
                rows={3}
                placeholder="บันทึกเพิ่มเติม..."
              />
            </div>

            {/* Summary */}
            {formData.lineItems.length > 0 && (
              <Card className="bg-secondary border-border">
                <CardContent className="p-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ยอดรวมก่อนส่วนลด:</span>
                      <span className="text-foreground">{formatCurrency(totals.subtotal)}</span>
                    </div>
                    {totals.discountAmount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ส่วนลด ({formData.discountPercent}%):</span>
                        <span className="text-green-400">-{formatCurrency(totals.discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">VAT ({formData.vatPercent}%):</span>
                      <span className="text-foreground">{formatCurrency(totals.vatAmount)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-border">
                      <span className="font-medium text-foreground">ยอดรวมสุทธิ:</span>
                      <span className="font-bold text-primary text-lg">{formatCurrency(totals.grandTotal)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="border-border">
              ยกเลิก
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!formData.opportunityId || formData.lineItems.length === 0}
              className="bg-primary text-primary-foreground"
            >
              สร้างใบเสนอราคา
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Sheet */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="bg-card border-border w-full sm:max-w-2xl overflow-y-auto">
          {selectedQuotation && (
            <>
              <SheetHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <SheetTitle className="text-foreground text-xl">{selectedQuotation.number}</SheetTitle>
                    <SheetDescription className="text-muted-foreground">
                      {selectedQuotation.accountName}
                    </SheetDescription>
                  </div>
                  <Badge className={statusConfig[selectedQuotation.status].color}>
                    {statusConfig[selectedQuotation.status].label}
                  </Badge>
                </div>
              </SheetHeader>

              <div className="space-y-6 mt-6">
                {/* Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Opportunity</p>
                    <p className="text-primary font-medium flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" />
                      {selectedQuotation.opportunityName}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">ผู้ติดต่อ</p>
                    <p className="text-foreground font-medium">{selectedQuotation.contactName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">วันที่สร้าง</p>
                    <p className="text-foreground font-medium">{formatDate(selectedQuotation.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">หมดอายุ</p>
                    <p className="text-foreground font-medium">{formatDate(selectedQuotation.validUntil)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">สร้างโดย</p>
                    <p className="text-foreground font-medium">{selectedQuotation.createdBy}</p>
                  </div>
                </div>

                {/* Line Items */}
                <div>
                  <h4 className="font-medium text-foreground mb-3">รายการสินค้า/บริการ</h4>
                  <div className="border border-border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-secondary">
                        <tr>
                          <th className="text-left p-3 text-sm font-medium text-foreground">รายการ</th>
                          <th className="text-right p-3 text-sm font-medium text-foreground">จำนวน</th>
                          <th className="text-right p-3 text-sm font-medium text-foreground">ราคา/หน่วย</th>
                          <th className="text-right p-3 text-sm font-medium text-foreground">ส่วนลด</th>
                          <th className="text-right p-3 text-sm font-medium text-foreground">รวม</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedQuotation.lineItems.map((item) => (
                          <tr key={item.id} className="border-t border-border">
                            <td className="p-3">
                              <p className="text-sm text-foreground">{item.productName}</p>
                              <p className="text-xs text-muted-foreground">{item.productCode}</p>
                            </td>
                            <td className="p-3 text-sm text-foreground text-right">{item.quantity}</td>
                            <td className="p-3 text-sm text-foreground text-right">{formatCurrency(item.unitPrice)}</td>
                            <td className="p-3 text-sm text-green-400 text-right">{item.discount}%</td>
                            <td className="p-3 text-sm text-foreground text-right font-medium">{formatCurrency(item.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Summary */}
                <div className="flex justify-end">
                  <div className="w-64 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ยอดรวม:</span>
                      <span className="text-foreground">{formatCurrency(selectedQuotation.subtotal)}</span>
                    </div>
                    {selectedQuotation.discountAmount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ส่วนลด ({selectedQuotation.discountPercent}%):</span>
                        <span className="text-green-400">-{formatCurrency(selectedQuotation.discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">VAT {selectedQuotation.vatPercent}%:</span>
                      <span className="text-foreground">{formatCurrency(selectedQuotation.vatAmount)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-border">
                      <span className="font-medium text-foreground">ยอดสุทธิ:</span>
                      <span className="font-bold text-primary text-lg">{formatCurrency(selectedQuotation.grandTotal)}</span>
                    </div>
                  </div>
                </div>

                {selectedQuotation.notes && (
                  <div>
                    <h4 className="font-medium text-foreground mb-2">หมายเหตุ</h4>
                    <p className="text-sm text-muted-foreground bg-secondary p-3 rounded-lg">{selectedQuotation.notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-border">
                  <Button variant="outline" className="border-border">
                    <Edit className="w-4 h-4 mr-2" />
                    แก้ไข
                  </Button>
                  <Button variant="outline" onClick={() => handleDuplicate(selectedQuotation)} className="border-border">
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicate
                  </Button>
                  <Button variant="outline" className="border-border">
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
