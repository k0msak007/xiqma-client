"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Package,
  Tag,
  DollarSign,
  MoreVertical,
  Eye,
  Copy,
  Upload,
  FileSpreadsheet,
  Image as ImageIcon,
  FileText,
  File,
  Download,
  X,
  Calendar,
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ProductFile {
  id: number
  name: string
  type: "image" | "catalog" | "document"
  url: string
  size: string
  uploadedAt: string
}

interface Product {
  id: number
  code: string
  name: string
  category: string
  description: string
  unitPrice: number
  unit: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  images: ProductFile[]
  catalogs: ProductFile[]
  documents: ProductFile[]
}

import { mockProducts as _sharedProducts } from '@/lib/crm-mock'
const initialProducts: Product[] = _sharedProducts as unknown as Product[]

const categories = ["All", "Software", "Service", "Hardware"]
const units = ["License", "Project", "Year", "Month", "Unit", "Man-day", "Hour", "Set", "Piece", "Box"]

export function Products() {
  const [products, setProducts] = useState(initialProducts)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState<Partial<Product>>({
    code: "",
    name: "",
    category: "Software",
    description: "",
    unitPrice: 0,
    unit: "License",
    isActive: true,
    images: [],
    catalogs: [],
    documents: [],
  })
  const [activeTab, setActiveTab] = useState("info")
  const [importFile, setImportFile] = useState<File | null>(null)

  const imageInputRef = useRef<HTMLInputElement>(null)
  const catalogInputRef = useRef<HTMLInputElement>(null)
  const documentInputRef = useRef<HTMLInputElement>(null)

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.code.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "All" || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 0,
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Software":
        return "bg-primary/20 text-primary"
      case "Service":
        return "bg-status-working/20 text-status-working"
      case "Hardware":
        return "bg-status-qualified/20 text-status-qualified"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const openAddDialog = () => {
    setFormData({
      code: `PRD-${String(products.length + 1).padStart(3, "0")}`,
      name: "",
      category: "Software",
      description: "",
      unitPrice: 0,
      unit: "License",
      isActive: true,
      images: [],
      catalogs: [],
      documents: [],
    })
    setSelectedProduct(null)
    setActiveTab("info")
    setIsDialogOpen(true)
  }

  const openEditDialog = (product: Product) => {
    setFormData(product)
    setSelectedProduct(product)
    setActiveTab("info")
    setIsDialogOpen(true)
  }

  const openDetailDialog = (product: Product) => {
    setSelectedProduct(product)
    setActiveTab("info")
    setIsDetailOpen(true)
  }

  const handleSave = () => {
    const now = new Date().toISOString().split("T")[0]
    if (selectedProduct) {
      // Edit
      setProducts(products.map((p) => (p.id === selectedProduct.id ? { ...p, ...formData, updatedAt: now } as Product : p)))
    } else {
      // Add
      const newProduct: Product = {
        id: Date.now(),
        code: formData.code || "",
        name: formData.name || "",
        category: formData.category || "Software",
        description: formData.description || "",
        unitPrice: formData.unitPrice || 0,
        unit: formData.unit || "License",
        isActive: formData.isActive ?? true,
        createdAt: now,
        updatedAt: now,
        images: formData.images || [],
        catalogs: formData.catalogs || [],
        documents: formData.documents || [],
      }
      setProducts([...products, newProduct])
    }
    setIsDialogOpen(false)
  }

  const handleDelete = (id: number) => {
    setProducts(products.filter((p) => p.id !== id))
  }

  const handleDuplicate = (product: Product) => {
    const now = new Date().toISOString().split("T")[0]
    const newProduct: Product = {
      ...product,
      id: Date.now(),
      code: `${product.code}-COPY`,
      name: `${product.name} (Copy)`,
      createdAt: now,
      updatedAt: now,
    }
    setProducts([...products, newProduct])
  }

  const toggleActive = (id: number) => {
    const now = new Date().toISOString().split("T")[0]
    setProducts(products.map((p) => (p.id === id ? { ...p, isActive: !p.isActive, updatedAt: now } : p)))
  }

  const handleFileUpload = (type: "image" | "catalog" | "document", files: FileList | null) => {
    if (!files) return
    const newFiles: ProductFile[] = Array.from(files).map((file, index) => ({
      id: Date.now() + index,
      name: file.name,
      type,
      url: URL.createObjectURL(file),
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      uploadedAt: new Date().toISOString().split("T")[0],
    }))

    if (type === "image") {
      setFormData({ ...formData, images: [...(formData.images || []), ...newFiles] })
    } else if (type === "catalog") {
      setFormData({ ...formData, catalogs: [...(formData.catalogs || []), ...newFiles] })
    } else {
      setFormData({ ...formData, documents: [...(formData.documents || []), ...newFiles] })
    }
  }

  const removeFile = (type: "image" | "catalog" | "document", fileId: number) => {
    if (type === "image") {
      setFormData({ ...formData, images: formData.images?.filter(f => f.id !== fileId) })
    } else if (type === "catalog") {
      setFormData({ ...formData, catalogs: formData.catalogs?.filter(f => f.id !== fileId) })
    } else {
      setFormData({ ...formData, documents: formData.documents?.filter(f => f.id !== fileId) })
    }
  }

  const handleImportExcel = () => {
    if (!importFile) return
    // Simulate import - in real app would parse Excel file
    alert(`จะ Import ข้อมูลจากไฟล์ ${importFile.name}\n\nในระบบจริงจะ:\n- Parse Excel file\n- Validate ข้อมูล\n- สร้าง Products ใหม่ตามข้อมูลในไฟล์`)
    setIsImportDialogOpen(false)
    setImportFile(null)
  }

  const downloadTemplate = () => {
    // In real app would download Excel template
    alert("Download Excel Template สำหรับ Import Products\n\nColumns: รหัสสินค้า, ชื่อสินค้า, หมวดหมู่, รายละเอียด, ราคา, หน่วย")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Products & Services</h2>
          <p className="text-muted-foreground">จัดการรายการสินค้าและบริการ</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setIsImportDialogOpen(true)} 
            className="border-border"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Import Excel
          </Button>
          <Button onClick={openAddDialog} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            เพิ่มสินค้า/บริการ
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหาสินค้า/บริการ..."
                className="pl-9 bg-secondary border-border"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={
                    selectedCategory === category
                      ? "bg-primary text-primary-foreground"
                      : "border-border text-foreground hover:bg-secondary"
                  }
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{products.length}</p>
                <p className="text-xs text-muted-foreground">สินค้า/บริการทั้งหมด</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-status-qualified/20">
                <Tag className="w-5 h-5 text-status-qualified" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {products.filter((p) => p.isActive).length}
                </p>
                <p className="text-xs text-muted-foreground">ใช้งานอยู่</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-status-working/20">
                <DollarSign className="w-5 h-5 text-status-working" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {products.filter((p) => p.category === "Software").length}
                </p>
                <p className="text-xs text-muted-foreground">Software</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/20">
                <Package className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {products.filter((p) => p.category === "Service").length}
                </p>
                <p className="text-xs text-muted-foreground">Service</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products List */}
      <div className="space-y-3">
        {filteredProducts.map((product) => (
          <Card
            key={product.id}
            className={`bg-card border-border hover:border-primary/50 transition-colors ${
              !product.isActive && "opacity-60"
            }`}
          >
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* Product Info */}
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                    {product.images.length > 0 ? (
                      <ImageIcon className="w-6 h-6" />
                    ) : (
                      <Package className="w-6 h-6" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-muted-foreground font-mono">{product.code}</span>
                      <Badge className={getCategoryColor(product.category)}>{product.category}</Badge>
                      {!product.isActive && (
                        <Badge variant="outline" className="border-muted-foreground text-muted-foreground">
                          Inactive
                        </Badge>
                      )}
                      {(product.images.length > 0 || product.catalogs.length > 0 || product.documents.length > 0) && (
                        <Badge variant="outline" className="border-primary/50 text-primary">
                          <File className="w-3 h-3 mr-1" />
                          {product.images.length + product.catalogs.length + product.documents.length} Files
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-foreground">{product.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-1">{product.description}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      อัพเดต: {formatDate(product.updatedAt)}
                    </div>
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xl font-bold text-primary">{formatPrice(product.unitPrice)}</p>
                    <p className="text-xs text-muted-foreground">/{product.unit}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Switch checked={product.isActive} onCheckedChange={() => toggleActive(product.id)} />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => openDetailDialog(product)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => openEditDialog(product)}
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
                      <DropdownMenuItem onClick={() => handleDuplicate(product)}>
                        <Copy className="w-4 h-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(product.id)}
                        className="text-destructive"
                      >
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
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {selectedProduct ? "แก้ไขสินค้า/บริการ" : "เพิ่มสินค้า/บริการ"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              กรอกข้อมูลสินค้าหรือบริการ
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-secondary w-full justify-start">
              <TabsTrigger value="info">ข้อมูลทั่วไป</TabsTrigger>
              <TabsTrigger value="images">รูปภาพ</TabsTrigger>
              <TabsTrigger value="catalogs">Catalog</TabsTrigger>
              <TabsTrigger value="documents">เอกสาร/KM</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground">รหัสสินค้า</Label>
                  <Input
                    value={formData.code || ""}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">หมวดหมู่</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="Software">Software</SelectItem>
                      <SelectItem value="Service">Service</SelectItem>
                      <SelectItem value="Hardware">Hardware</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">ชื่อสินค้า/บริการ</Label>
                <Input
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">รายละเอียด</Label>
                <Textarea
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-secondary border-border min-h-[80px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground">ราคา (บาท)</Label>
                  <Input
                    type="number"
                    value={formData.unitPrice || 0}
                    onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">หน่วย</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(value) => setFormData({ ...formData, unit: value })}
                  >
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {units.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label className="text-foreground">ใช้งาน</Label>
              </div>
            </TabsContent>

            <TabsContent value="images" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <Label className="text-foreground">รูปภาพสินค้า</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => imageInputRef.current?.click()}
                  className="border-border"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  เพิ่มรูปภาพ
                </Button>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileUpload("image", e.target.files)}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {formData.images?.map((file) => (
                  <div key={file.id} className="relative group">
                    <div className="aspect-square bg-secondary rounded-lg flex items-center justify-center overflow-hidden">
                      <ImageIcon className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 truncate">{file.name}</p>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeFile("image", file.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                {(!formData.images || formData.images.length === 0) && (
                  <div className="col-span-3 text-center py-8 text-muted-foreground">
                    <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>ยังไม่มีรูปภาพ</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="catalogs" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <Label className="text-foreground">Catalog / Brochure</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => catalogInputRef.current?.click()}
                  className="border-border"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  เพิ่ม Catalog
                </Button>
                <input
                  ref={catalogInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileUpload("catalog", e.target.files)}
                />
              </div>
              <div className="space-y-2">
                {formData.catalogs?.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{file.size} - {file.uploadedAt}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="text-muted-foreground">
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => removeFile("catalog", file.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {(!formData.catalogs || formData.catalogs.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>ยังไม่มี Catalog</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="documents" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <Label className="text-foreground">เอกสาร / Knowledge Management</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => documentInputRef.current?.click()}
                  className="border-border"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  เพิ่มเอกสาร
                </Button>
                <input
                  ref={documentInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileUpload("document", e.target.files)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                อัพโหลดเอกสารที่เกี่ยวข้องกับสินค้า เช่น Technical Spec, User Manual, FAQ, Training Material
              </p>
              <div className="space-y-2">
                {formData.documents?.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                    <div className="flex items-center gap-3">
                      <File className="w-8 h-8 text-accent" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{file.size} - {file.uploadedAt}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="text-muted-foreground">
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => removeFile("document", file.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {(!formData.documents || formData.documents.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <File className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>ยังไม่มีเอกสาร</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-border">
              ยกเลิก
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.code || !formData.name}
              className="bg-primary text-primary-foreground"
            >
              บันทึก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">รายละเอียดสินค้า/บริการ</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              ดูข้อมูลสินค้าหรือบริการ
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-secondary w-full justify-start">
                <TabsTrigger value="info">ข้อมูลทั่วไป</TabsTrigger>
                <TabsTrigger value="images">
                  รูปภาพ ({selectedProduct.images.length})
                </TabsTrigger>
                <TabsTrigger value="catalogs">
                  Catalog ({selectedProduct.catalogs.length})
                </TabsTrigger>
                <TabsTrigger value="documents">
                  เอกสาร ({selectedProduct.documents.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4 mt-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Package className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground font-mono">{selectedProduct.code}</span>
                      <Badge className={getCategoryColor(selectedProduct.category)}>{selectedProduct.category}</Badge>
                      {!selectedProduct.isActive && (
                        <Badge variant="outline" className="border-muted-foreground text-muted-foreground">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-foreground">{selectedProduct.name}</h3>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 p-4 bg-secondary/30 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">ราคา</p>
                    <p className="text-2xl font-bold text-primary">{formatPrice(selectedProduct.unitPrice)}</p>
                    <p className="text-sm text-muted-foreground">/{selectedProduct.unit}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">สถานะ</p>
                    <Badge className={selectedProduct.isActive ? "bg-status-qualified/20 text-status-qualified" : "bg-muted text-muted-foreground"}>
                      {selectedProduct.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
                <div className="p-4 bg-secondary/30 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">รายละเอียด</p>
                  <p className="text-foreground">{selectedProduct.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 p-4 bg-secondary/30 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">วันที่สร้าง</p>
                    <p className="text-foreground">{formatDate(selectedProduct.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">อัพเดตล่าสุด</p>
                    <p className="text-foreground">{formatDate(selectedProduct.updatedAt)}</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="images" className="mt-4">
                <div className="grid grid-cols-3 gap-3">
                  {selectedProduct.images.map((file) => (
                    <div key={file.id} className="relative">
                      <div className="aspect-square bg-secondary rounded-lg flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{file.size}</p>
                    </div>
                  ))}
                  {selectedProduct.images.length === 0 && (
                    <div className="col-span-3 text-center py-8 text-muted-foreground">
                      <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>ไม่มีรูปภาพ</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="catalogs" className="mt-4">
                <div className="space-y-2">
                  {selectedProduct.catalogs.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8 text-primary" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{file.name}</p>
                          <p className="text-xs text-muted-foreground">{file.size} - {file.uploadedAt}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="text-muted-foreground">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {selectedProduct.catalogs.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>ไม่มี Catalog</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="documents" className="mt-4">
                <div className="space-y-2">
                  {selectedProduct.documents.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                      <div className="flex items-center gap-3">
                        <File className="w-8 h-8 text-accent" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{file.name}</p>
                          <p className="text-xs text-muted-foreground">{file.size} - {file.uploadedAt}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="text-muted-foreground">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {selectedProduct.documents.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <File className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>ไม่มีเอกสาร</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDetailOpen(false)
                if (selectedProduct) openEditDialog(selectedProduct)
              }}
              className="border-border"
            >
              <Edit className="w-4 h-4 mr-2" />
              แก้ไข
            </Button>
            <Button onClick={() => setIsDetailOpen(false)} className="bg-primary text-primary-foreground">
              ปิด
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Excel Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Import Products จาก Excel</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              อัพโหลดไฟล์ Excel เพื่อ Import สินค้า/บริการเข้าสู่ระบบ
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              {importFile ? (
                <div className="flex items-center justify-center gap-3">
                  <FileSpreadsheet className="w-10 h-10 text-primary" />
                  <div className="text-left">
                    <p className="font-medium text-foreground">{importFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(importFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setImportFile(null)}
                    className="text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-foreground mb-2">ลากไฟล์มาวางที่นี่ หรือ Click เพื่อเลือกไฟล์</p>
                  <p className="text-sm text-muted-foreground">รองรับไฟล์ .xlsx, .xls</p>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  />
                </>
              )}
            </div>
            <Button
              variant="outline"
              onClick={downloadTemplate}
              className="w-full border-border"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)} className="border-border">
              ยกเลิก
            </Button>
            <Button
              onClick={handleImportExcel}
              disabled={!importFile}
              className="bg-primary text-primary-foreground"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
