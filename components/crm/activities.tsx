"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Phone,
  Mail,
  Calendar,
  Users,
  FileText,
  Plus,
  Clock,
  CheckCircle2,
  Circle,
  Filter,
  ChevronDown,
  Search,
  Edit,
  Trash2,
  ExternalLink,
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

type ActivityType = "call" | "email" | "meeting" | "task" | "note"
type RelatedToType = "Lead" | "Contact" | "Account" | "Opportunity"

interface Activity {
  id: number
  type: ActivityType
  subject: string
  notes: string
  relatedToId: number
  relatedToName: string
  relatedToType: RelatedToType
  activityDate: string
  activityTime: string
  completed: boolean
  completedDate?: string
  user: string
  createdAt: string
}

const activityTypes = [
  { id: "call", name: "โทรศัพท์", icon: Phone, color: "bg-blue-500/20 text-blue-400" },
  { id: "email", name: "อีเมล", icon: Mail, color: "bg-purple-500/20 text-purple-400" },
  { id: "meeting", name: "เข้าพบ/ประชุม", icon: Users, color: "bg-green-500/20 text-green-400" },
  { id: "task", name: "งาน/Task", icon: FileText, color: "bg-amber-500/20 text-amber-400" },
  { id: "note", name: "บันทึก", icon: FileText, color: "bg-gray-500/20 text-gray-400" },
]

const relatedItems = [
  { id: 1, name: "สมชาย ใจดี", type: "Lead" as RelatedToType },
  { id: 2, name: "บริษัท ABC จำกัด", type: "Account" as RelatedToType },
  { id: 3, name: "ERP Implementation - ABC", type: "Opportunity" as RelatedToType },
  { id: 4, name: "วิภา รักงาน", type: "Contact" as RelatedToType },
  { id: 5, name: "Cloud Migration - XYZ", type: "Opportunity" as RelatedToType },
  { id: 6, name: "สมหญิง รักดี", type: "Contact" as RelatedToType },
]

import { mockActivities as _sharedActivities } from '@/lib/crm-mock'
const initialActivities: Activity[] = _sharedActivities as unknown as Activity[]

const getActivityTypeConfig = (type: ActivityType) => {
  return activityTypes.find(t => t.id === type) || activityTypes[0]
}

const getRelatedTypeColor = (type: RelatedToType) => {
  switch (type) {
    case "Lead": return "bg-blue-500/20 text-blue-400"
    case "Contact": return "bg-green-500/20 text-green-400"
    case "Account": return "bg-purple-500/20 text-purple-400"
    case "Opportunity": return "bg-amber-500/20 text-amber-400"
    default: return "bg-muted text-muted-foreground"
  }
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })
}

const formatDateRelative = (dateStr: string) => {
  const date = new Date(dateStr)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return "วันนี้"
  if (date.toDateString() === tomorrow.toDateString()) return "พรุ่งนี้"
  if (date.toDateString() === yesterday.toDateString()) return "เมื่อวาน"
  return date.toLocaleDateString("th-TH", { weekday: "short", day: "numeric", month: "short" })
}

export function Activities() {
  const [activities, setActivities] = useState<Activity[]>(initialActivities)
  const [filter, setFilter] = useState<"all" | "upcoming" | "completed">("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [relatedFilter, setRelatedFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    type: "call" as ActivityType,
    subject: "",
    notes: "",
    relatedToId: 0,
    activityDate: new Date().toISOString().split("T")[0],
    activityTime: "09:00",
  })

  const filteredActivities = activities.filter((activity) => {
    const matchesSearch = 
      activity.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.relatedToName.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = 
      filter === "all" ||
      (filter === "upcoming" && !activity.completed) ||
      (filter === "completed" && activity.completed)
    
    const matchesType = typeFilter === "all" || activity.type === typeFilter
    const matchesRelated = relatedFilter === "all" || activity.relatedToType === relatedFilter
    
    return matchesSearch && matchesStatus && matchesType && matchesRelated
  })

  const groupedActivities = filteredActivities.reduce(
    (groups, activity) => {
      const date = activity.activityDate
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(activity)
      return groups
    },
    {} as Record<string, Activity[]>
  )

  // Sort dates (newest first for completed, upcoming first for others)
  const sortedDates = Object.keys(groupedActivities).sort((a, b) => {
    if (filter === "completed") {
      return new Date(b).getTime() - new Date(a).getTime()
    }
    return new Date(a).getTime() - new Date(b).getTime()
  })

  const handleAdd = () => {
    const relatedItem = relatedItems.find(r => r.id === formData.relatedToId)
    if (!relatedItem || !formData.subject) return

    const newActivity: Activity = {
      id: Date.now(),
      type: formData.type,
      subject: formData.subject,
      notes: formData.notes,
      relatedToId: formData.relatedToId,
      relatedToName: relatedItem.name,
      relatedToType: relatedItem.type,
      activityDate: formData.activityDate,
      activityTime: formData.activityTime,
      completed: false,
      user: "Current User",
      createdAt: new Date().toISOString().split("T")[0],
    }

    setActivities([newActivity, ...activities])
    setIsDialogOpen(false)
    setFormData({
      type: "call",
      subject: "",
      notes: "",
      relatedToId: 0,
      activityDate: new Date().toISOString().split("T")[0],
      activityTime: "09:00",
    })
  }

  const toggleComplete = (id: number) => {
    setActivities(activities.map(act => 
      act.id === id 
        ? { 
            ...act, 
            completed: !act.completed,
            completedDate: !act.completed ? new Date().toISOString().split("T")[0] : undefined
          }
        : act
    ))
  }

  const deleteActivity = (id: number) => {
    setActivities(activities.filter(act => act.id !== id))
  }

  // Stats
  const totalActivities = activities.length
  const completedActivities = activities.filter(a => a.completed).length
  const pendingActivities = activities.filter(a => !a.completed).length
  const overdueActivities = activities.filter(a => !a.completed && new Date(a.activityDate) < new Date()).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Activity Tracking</h2>
          <p className="text-muted-foreground">บันทึกและติดตามกิจกรรมการขาย</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              บันทึก Activity
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-foreground">บันทึก Activity ใหม่</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                บันทึกกิจกรรมที่ทำกับ Lead, Contact, Account หรือ Opportunity
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label className="text-foreground">ประเภท Activity</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as ActivityType })}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="เลือกประเภท" />
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
                  <Label className="text-foreground">วันที่ Activity *</Label>
                  <Input
                    type="date"
                    value={formData.activityDate}
                    onChange={(e) => setFormData({ ...formData, activityDate: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">เวลา</Label>
                  <Input
                    type="time"
                    value={formData.activityTime}
                    onChange={(e) => setFormData({ ...formData, activityTime: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">หัวข้อ *</Label>
                <Input
                  placeholder="ระบุหัวข้อ..."
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">รายละเอียด</Label>
                <Textarea
                  placeholder="รายละเอียดเพิ่มเติม..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="bg-secondary border-border min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">เกี่ยวข้องกับ *</Label>
                <Select 
                  value={formData.relatedToId.toString()} 
                  onValueChange={(v) => setFormData({ ...formData, relatedToId: parseInt(v) })}
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="เลือก Lead / Contact / Account / Opportunity" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {relatedItems.map((item) => (
                      <SelectItem key={item.id} value={item.id.toString()}>
                        <div className="flex items-center gap-2">
                          <Badge className={`${getRelatedTypeColor(item.type)} text-xs`}>{item.type}</Badge>
                          {item.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-border">
                ยกเลิก
              </Button>
              <Button 
                onClick={handleAdd}
                disabled={!formData.subject || !formData.relatedToId}
                className="bg-primary text-primary-foreground"
              >
                บันทึก
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalActivities}</p>
                <p className="text-xs text-muted-foreground">Total Activities</p>
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
                <p className="text-2xl font-bold text-foreground">{pendingActivities}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
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
                <p className="text-2xl font-bold text-foreground">{completedActivities}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/20">
                <Clock className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{overdueActivities}</p>
                <p className="text-xs text-muted-foreground">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหา Activity..."
                className="pl-9 bg-secondary border-border"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("all")}
                className={filter === "all" ? "bg-primary text-primary-foreground" : "border-border text-foreground"}
              >
                ทั้งหมด
              </Button>
              <Button
                variant={filter === "upcoming" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("upcoming")}
                className={filter === "upcoming" ? "bg-primary text-primary-foreground" : "border-border text-foreground"}
              >
                <Circle className="w-3 h-3 mr-1" />
                รอดำเนินการ
              </Button>
              <Button
                variant={filter === "completed" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("completed")}
                className={filter === "completed" ? "bg-primary text-primary-foreground" : "border-border text-foreground"}
              >
                <CheckCircle2 className="w-3 h-3 mr-1" />
                เสร็จสิ้น
              </Button>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px] bg-secondary border-border">
                <SelectValue placeholder="ประเภท" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all">ทุกประเภท</SelectItem>
                {activityTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={relatedFilter} onValueChange={setRelatedFilter}>
              <SelectTrigger className="w-[150px] bg-secondary border-border">
                <SelectValue placeholder="Related To" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="Lead">Lead</SelectItem>
                <SelectItem value="Contact">Contact</SelectItem>
                <SelectItem value="Account">Account</SelectItem>
                <SelectItem value="Opportunity">Opportunity</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <div className="space-y-6">
        {sortedDates.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>ไม่พบ Activity</p>
          </div>
        ) : (
          sortedDates.map((date) => (
            <div key={date}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {formatDateRelative(date)} - {formatDate(date)}
              </h3>
              <div className="space-y-3">
                {groupedActivities[date].map((activity) => {
                  const typeConfig = getActivityTypeConfig(activity.type)
                  const TypeIcon = typeConfig.icon
                  const isOverdue = !activity.completed && new Date(activity.activityDate) < new Date()
                  
                  return (
                    <Card
                      key={activity.id}
                      className={`bg-card border-border hover:border-primary/50 transition-colors ${isOverdue ? "border-red-500/50" : ""}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className={`p-2.5 rounded-lg ${typeConfig.color}`}>
                            <TypeIcon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-foreground">{activity.subject}</h4>
                                  <button onClick={() => toggleComplete(activity.id)} className="focus:outline-none">
                                    {activity.completed ? (
                                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                                    ) : (
                                      <Circle className="w-5 h-5 text-muted-foreground hover:text-primary" />
                                    )}
                                  </button>
                                  {isOverdue && (
                                    <Badge className="bg-red-500/20 text-red-400 text-xs">Overdue</Badge>
                                  )}
                                </div>
                                {activity.notes && (
                                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{activity.notes}</p>
                                )}
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-sm font-medium text-foreground">{activity.activityTime}</p>
                                <p className="text-xs text-muted-foreground">{activity.user}</p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-3">
                              <div className="flex items-center gap-2">
                                <Badge className={getRelatedTypeColor(activity.relatedToType)}>
                                  {activity.relatedToType}
                                </Badge>
                                <span className="text-sm text-primary flex items-center gap-1">
                                  <ExternalLink className="w-3 h-3" />
                                  {activity.relatedToName}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                {activity.completed && activity.completedDate && (
                                  <span className="text-xs text-muted-foreground mr-2">
                                    Completed: {formatDate(activity.completedDate)}
                                  </span>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  onClick={() => deleteActivity(activity.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
