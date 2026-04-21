"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Users,
  Target,
  DollarSign,
  TrendingUp,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Phone,
  Mail,
  Calendar,
} from "lucide-react"
import { mockDashboardStats, mockRecentLeads } from "@/lib/crm-mock"

const statIconMap = { Users, Target, DollarSign, TrendingUp } as const
const stats = mockDashboardStats.map((s) => ({
  name: s.name,
  value: s.value,
  change: s.change,
  trend: s.trend,
  icon: statIconMap[s.iconName],
}))

const recentLeads = mockRecentLeads

const upcomingActivities = [
  {
    id: 1,
    type: "call",
    title: "โทรติดตาม บริษัท ABC",
    time: "10:00",
    date: "วันนี้",
  },
  {
    id: 2,
    type: "meeting",
    title: "นัดพบ บริษัท XYZ",
    time: "14:00",
    date: "วันนี้",
  },
  {
    id: 3,
    type: "email",
    title: "ส่งใบเสนอราคา บริษัท DFG",
    time: "09:00",
    date: "พรุ่งนี้",
  },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case "New":
      return "bg-status-new text-white"
    case "Working":
      return "bg-status-working text-black"
    case "Qualified":
      return "bg-status-qualified text-white"
    default:
      return "bg-muted text-muted-foreground"
  }
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case "call":
      return Phone
    case "meeting":
      return Calendar
    case "email":
      return Mail
    default:
      return Clock
  }
}

export function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.name} className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-secondary">
                  <stat.icon className="w-5 h-5 text-primary" />
                </div>
                <div
                  className={`flex items-center gap-1 text-sm font-medium ${
                    stat.trend === "up" ? "text-status-qualified" : "text-destructive"
                  }`}
                >
                  {stat.trend === "up" ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                  {stat.change}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.name}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Leads */}
        <Card className="lg:col-span-2 bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold text-foreground">
              Leads ล่าสุด
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-primary">
              ดูทั้งหมด
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-medium">
                      {lead.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{lead.name}</p>
                      <p className="text-sm text-muted-foreground">{lead.contact}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-medium text-foreground">
                        Score: {lead.score}
                      </p>
                      <p className="text-xs text-muted-foreground">{lead.source}</p>
                    </div>
                    <Badge className={getStatusColor(lead.status)}>{lead.status}</Badge>
                    <div className="flex items-center gap-1 text-sm text-accent">
                      <Clock className="w-4 h-4" />
                      {lead.slaRemaining}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Activities */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold text-foreground">
              กิจกรรมที่กำลังจะถึง
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-primary">
              + เพิ่ม
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingActivities.map((activity) => {
                const Icon = getActivityIcon(activity.type)
                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
                  >
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {activity.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.date} เวลา {activity.time}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SLA Alerts */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-accent" />
            <CardTitle className="text-lg font-semibold text-foreground">
              SLA Alerts
            </CardTitle>
          </div>
          <Badge variant="outline" className="border-accent text-accent">
            3 รายการ
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-destructive">Lead ไม่ติดต่อกลับ</span>
                <Badge className="bg-destructive text-destructive-foreground">Urgent</Badge>
              </div>
              <p className="text-sm text-muted-foreground">3 leads เกิน SLA 2 ชม.</p>
            </div>
            <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-accent">ดีลไม่มี Activity</span>
                <Badge className="bg-accent text-accent-foreground">Warning</Badge>
              </div>
              <p className="text-sm text-muted-foreground">5 opportunities ไม่มีการขยับ 7 วัน</p>
            </div>
            <div className="p-4 rounded-lg bg-status-new/10 border border-status-new/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-status-new">ใบเสนอราคารอ Approval</span>
                <Badge className="bg-status-new text-white">Pending</Badge>
              </div>
              <p className="text-sm text-muted-foreground">2 quotations รอ Manager อนุมัติ</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
