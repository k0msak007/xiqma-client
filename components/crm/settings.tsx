"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Plus,
  Clock,
  Bell,
  Mail,
  Users,
  AlertTriangle,
  Trash2,
  Edit,
  Zap,
  Tag,
  Layers,
  Star,
  Megaphone,
  ChevronLeft,
  Activity,
  CheckCircle2,
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

interface MasterDataItem {
  id: number
  name: string
  description?: string
  color?: string
  isActive: boolean
}

interface ActivityType {
  id: number
  name: string
  description?: string
  color?: string
  isActive: boolean
  appliesTo: ("Lead" | "Contact" | "Account" | "Opportunity")[]
}

interface SLARule {
  id: number
  name: string
  targetObject: "Lead" | "Opportunity"
  condition: string
  timeLimit: string
  timeLimitHours: number
  action: string
  enabled: boolean
}

// Master Data
const initialLeadSources: MasterDataItem[] = [
  { id: 1, name: "Website", description: "ลูกค้าเข้ามาจากเว็บไซต์", color: "#3B82F6", isActive: true },
  { id: 2, name: "Referral", description: "ลูกค้าแนะนำ", color: "#10B981", isActive: true },
  { id: 3, name: "Trade Show", description: "งานแสดงสินค้า", color: "#F59E0B", isActive: true },
  { id: 4, name: "Cold Call", description: "โทรหาลูกค้าใหม่", color: "#6366F1", isActive: true },
  { id: 5, name: "Social Media", description: "Facebook, LINE, Instagram", color: "#EC4899", isActive: true },
  { id: 6, name: "LinkedIn", description: "LinkedIn", color: "#0077B5", isActive: true },
  { id: 7, name: "Partner", description: "พาร์ทเนอร์แนะนำ", color: "#8B5CF6", isActive: true },
  { id: 8, name: "Advertisement", description: "โฆษณาออนไลน์/ออฟไลน์", color: "#EF4444", isActive: true },
]

const initialLeadTypes: MasterDataItem[] = [
  { id: 1, name: "บุคคลธรรมดา", description: "ลูกค้าทั่วไป ไม่ใช่นิติบุคคล", isActive: true },
  { id: 2, name: "นิติบุคคล", description: "บริษัท หรือ ห้างหุ้นส่วน", isActive: true },
  { id: 3, name: "หน่วยงานราชการ", description: "หน่วยงานของรัฐ", isActive: true },
  { id: 4, name: "รัฐวิสาหกิจ", description: "องค์กรรัฐวิสาหกิจ", isActive: true },
]

const initialLeadGrades: MasterDataItem[] = [
  { id: 1, name: "A", description: "Top Priority - มีโอกาสปิดสูงมาก", color: "#10B981", isActive: true },
  { id: 2, name: "B", description: "High Priority - สนใจ ยังต้องติดตาม", color: "#F59E0B", isActive: true },
  { id: 3, name: "C", description: "Medium Priority - สนใจน้อย ยังไม่พร้อม", color: "#6B7280", isActive: true },
  { id: 4, name: "D", description: "Low Priority - ไม่สนใจ", color: "#EF4444", isActive: true },
]

const initialLeadTemperatures: MasterDataItem[] = [
  { id: 1, name: "Hot", description: "ลูกค้าพร้อมซื้อ ต้องติดต่อด่วน", color: "#EF4444", isActive: true },
  { id: 2, name: "Warm", description: "ลูกค้าสนใจ ยังไม่ตัดสินใจ", color: "#F59E0B", isActive: true },
  { id: 3, name: "Cold", description: "ลูกค้าเพิ่งเริ่มสนใจ ต้องติดตามระยะยาว", color: "#3B82F6", isActive: true },
]

const initialCampaigns: MasterDataItem[] = [
  { id: 1, name: "Q1 2024 Promotion", description: "โปรโมชั่นไตรมาส 1", isActive: true },
  { id: 2, name: "Trade Show 2024", description: "งาน Bangkok International Trade Show", isActive: true },
  { id: 3, name: "Summer Sale", description: "โปรโมชั่นช่วงซัมเมอร์", isActive: true },
  { id: 4, name: "Year End Campaign", description: "แคมเปญปลายปี", isActive: false },
]

const initialActivityTypes: ActivityType[] = [
  { id: 1, name: "โทรศัพท์", description: "โทรติดต่อลูกค้า", color: "#3B82F6", isActive: true, appliesTo: ["Lead", "Contact", "Account", "Opportunity"] },
  { id: 2, name: "อีเมล", description: "ส่งอีเมลถึงลูกค้า", color: "#10B981", isActive: true, appliesTo: ["Lead", "Contact", "Account", "Opportunity"] },
  { id: 3, name: "นัดพบ", description: "นัดประชุมหรือเข้าพบลูกค้า", color: "#F59E0B", isActive: true, appliesTo: ["Lead", "Contact", "Opportunity"] },
  { id: 4, name: "Demo", description: "สาธิตสินค้า/บริการ", color: "#8B5CF6", isActive: true, appliesTo: ["Lead", "Opportunity"] },
  { id: 5, name: "ส่งเอกสาร", description: "ส่งเอกสารหรือใบเสนอราคา", color: "#EC4899", isActive: true, appliesTo: ["Contact", "Account", "Opportunity"] },
  { id: 6, name: "บันทึกทั่วไป", description: "บันทึกข้อมูลทั่วไป", color: "#6B7280", isActive: true, appliesTo: ["Lead", "Contact", "Account", "Opportunity"] },
]

const initialDisqualifyReasons: MasterDataItem[] = [
  { id: 1, name: "งบประมาณไม่เพียงพอ", description: "ลูกค้าไม่มีงบประมาณในขณะนี้", isActive: true },
  { id: 2, name: "ไม่ใช่ผู้มีอำนาจตัดสินใจ", description: "ผู้ติดต่อไม่สามารถตัดสินใจได้", isActive: true },
  { id: 3, name: "ไม่มีความต้องการ", description: "ลูกค้าไม่มีความต้องการใช้สินค้า/บริการ", isActive: true },
  { id: 4, name: "ใช้คู่แข่งอยู่แล้ว", description: "ลูกค้าใช้สินค้า/บริการของคู่แข่งและพอใจอยู่", isActive: true },
  { id: 5, name: "ติดต่อไม่ได้", description: "ไม่สามารถติดต่อลูกค้าได้", isActive: true },
  { id: 6, name: "อื่นๆ", description: "เหตุผลอื่นๆ", isActive: true },
]

interface OpportunityStage {
  id: number
  name: string
  description?: string
  color: string
  probability: number
  order: number
  isActive: boolean
  isClosed: boolean
  isWon?: boolean
}

const initialOpportunityStages: OpportunityStage[] = [
  { id: 1, name: "Qualification", description: "คัดกรองคุณสมบัติลูกค้า", color: "#3B82F6", probability: 10, order: 1, isActive: true, isClosed: false },
  { id: 2, name: "Needs Analysis", description: "วิเคราะห์ความต้องการ", color: "#8B5CF6", probability: 20, order: 2, isActive: true, isClosed: false },
  { id: 3, name: "Proposal", description: "เสนอราคา/โซลูชั่น", color: "#F59E0B", probability: 50, order: 3, isActive: true, isClosed: false },
  { id: 4, name: "Negotiation", description: "เจรจาต่อรอง", color: "#EC4899", probability: 75, order: 4, isActive: true, isClosed: false },
  { id: 5, name: "Closed Won", description: "ปิดการขายสำเร็จ", color: "#10B981", probability: 100, order: 5, isActive: true, isClosed: true, isWon: true },
  { id: 6, name: "Closed Lost", description: "ปิดการขายไม่สำเร็จ", color: "#EF4444", probability: 0, order: 6, isActive: true, isClosed: true, isWon: false },
]

const slaRules: SLARule[] = [
  {
    id: 1,
    name: "New Lead Response",
    targetObject: "Lead",
    condition: "Status = New",
    timeLimit: "2 ชั่วโมง",
    timeLimitHours: 2,
    action: "แจ้งเตือน + Re-assign",
    enabled: true,
  },
  {
    id: 2,
    name: "Working Lead Follow-up",
    targetObject: "Lead",
    condition: "Status = Working",
    timeLimit: "24 ชั่วโมง",
    timeLimitHours: 24,
    action: "แจ้งเตือน Manager",
    enabled: true,
  },
  {
    id: 3,
    name: "Opportunity Stagnant Alert",
    targetObject: "Opportunity",
    condition: "ไม่มี Activity",
    timeLimit: "7 วัน",
    timeLimitHours: 168,
    action: "แจ้งเตือน + Escalate",
    enabled: true,
  },
  {
    id: 4,
    name: "Proposal Pending",
    targetObject: "Opportunity",
    condition: "Stage = Proposal",
    timeLimit: "3 วัน",
    timeLimitHours: 72,
    action: "แจ้งเตือน Sales",
    enabled: false,
  },
]

const notificationChannels = [
  { id: "app", name: "In-App Notification", icon: Bell, enabled: true },
  { id: "email", name: "Email", icon: Mail, enabled: true },
  { id: "line", name: "LINE Notify", icon: Zap, enabled: false },
]

type MasterDataType = "source" | "type" | "grade" | "temperature" | "campaign" | "activity" | "disqualify" | "oppStage" | "unit"
type ViewMode = "grid" | MasterDataType | "sla" | "bot"

interface BotChannel {
  id: string
  name: string
  platform: "messenger" | "facebook_comment" | "instagram" | "tiktok" | "line_oa"
  icon: string
  color: string
  isConnected: boolean
  pageId?: string
  pageName?: string
  accessToken?: string
  webhookUrl?: string
  lastSync?: string
}

import { Flame, TrendingUp, Bot, MessageCircle, Link2, Unlink, RefreshCw, ExternalLink, Ruler } from "lucide-react"

const masterDataCategories: {
  type: MasterDataType
  title: string
  description: string
  icon: React.ElementType
  color: string
}[] = [
  { type: "source", title: "Lead Source", description: "แหล่งที่มาของ Lead", icon: Layers, color: "bg-blue-500/20 text-blue-400" },
  { type: "type", title: "Lead Type", description: "ประเภทของ Lead", icon: Tag, color: "bg-green-500/20 text-green-400" },
  { type: "grade", title: "Lead Grade", description: "เกรดความสำคัญของ Lead", icon: Star, color: "bg-amber-500/20 text-amber-400" },
  { type: "temperature", title: "Lead Temperature", description: "ระดับความร้อนของ Lead (Hot/Warm/Cold)", icon: Flame, color: "bg-orange-500/20 text-orange-400" },
  { type: "oppStage", title: "Opportunity Stages", description: "ขั้นตอนของโอกาสขาย (Pipeline)", icon: TrendingUp, color: "bg-cyan-500/20 text-cyan-400" },
  { type: "unit", title: "Product Units", description: "หน่วยของสินค้า/บริการ", icon: Ruler, color: "bg-teal-500/20 text-teal-400" },
  { type: "campaign", title: "Campaigns", description: "แคมเปญการตลาด", icon: Megaphone, color: "bg-pink-500/20 text-pink-400" },
  { type: "activity", title: "Activity Types", description: "ประเภทกิจกรรม", icon: Activity, color: "bg-purple-500/20 text-purple-400" },
  { type: "disqualify", title: "Disqualify Reasons", description: "เหตุผลในการ Disqualify", icon: AlertTriangle, color: "bg-red-500/20 text-red-400" },
]

const appliesToOptions = ["Lead", "Contact", "Account", "Opportunity"] as const

const initialProductUnits: MasterDataItem[] = [
  { id: 1, name: "License", description: "ลิขสิทธิ์การใช้งาน", isActive: true },
  { id: 2, name: "Project", description: "โปรเจกต์", isActive: true },
  { id: 3, name: "Year", description: "ปี", isActive: true },
  { id: 4, name: "Month", description: "เดือน", isActive: true },
  { id: 5, name: "Unit", description: "หน่วย/ชิ้น", isActive: true },
  { id: 6, name: "Man-day", description: "วันทำงาน", isActive: true },
  { id: 7, name: "Hour", description: "ชั่วโมง", isActive: true },
  { id: 8, name: "Set", description: "ชุด", isActive: true },
  { id: 9, name: "Piece", description: "ชิ้น", isActive: true },
  { id: 10, name: "Box", description: "กล่อง", isActive: true },
]

const initialBotChannels: BotChannel[] = [
  { 
    id: "1", 
    name: "Facebook Messenger", 
    platform: "messenger", 
    icon: "messenger",
    color: "#0084FF",
    isConnected: true,
    pageId: "123456789",
    pageName: "XIQMA Official",
    lastSync: "2024-03-15 14:30"
  },
  { 
    id: "2", 
    name: "Facebook Comment", 
    platform: "facebook_comment", 
    icon: "facebook",
    color: "#1877F2",
    isConnected: false
  },
  { 
    id: "3", 
    name: "Instagram", 
    platform: "instagram", 
    icon: "instagram",
    color: "#E4405F",
    isConnected: true,
    pageId: "987654321",
    pageName: "@xiqma_official",
    lastSync: "2024-03-15 12:00"
  },
  { 
    id: "4", 
    name: "TikTok", 
    platform: "tiktok", 
    icon: "tiktok",
    color: "#000000",
    isConnected: false
  },
  { 
    id: "5", 
    name: "LINE Official Account", 
    platform: "line_oa", 
    icon: "line",
    color: "#00B900",
    isConnected: true,
    pageId: "@xiqma",
    pageName: "XIQMA LINE OA",
    accessToken: "****...****",
    webhookUrl: "https://api.xiqma.com/webhook/line",
    lastSync: "2024-03-15 15:45"
  },
]

export function Settings() {
  const [rules, setRules] = useState(slaRules)
  const [channels, setChannels] = useState(notificationChannels)
  const [leadSources, setLeadSources] = useState(initialLeadSources)
  const [leadTypes, setLeadTypes] = useState(initialLeadTypes)
  const [leadGrades, setLeadGrades] = useState(initialLeadGrades)
  const [leadTemperatures, setLeadTemperatures] = useState(initialLeadTemperatures)
  const [campaigns, setCampaigns] = useState(initialCampaigns)
  const [activityTypes, setActivityTypes] = useState(initialActivityTypes)
  const [disqualifyReasons, setDisqualifyReasons] = useState(initialDisqualifyReasons)
  const [opportunityStages, setOpportunityStages] = useState(initialOpportunityStages)
  const [productUnits, setProductUnits] = useState(initialProductUnits)
  const [botChannels, setBotChannels] = useState(initialBotChannels)
  const [selectedBotChannel, setSelectedBotChannel] = useState<BotChannel | null>(null)
  const [isBotConfigDialogOpen, setIsBotConfigDialogOpen] = useState(false)
  const [botConfig, setBotConfig] = useState({ pageId: "", pageName: "", accessToken: "", webhookUrl: "" })

  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [addDialogType, setAddDialogType] = useState<MasterDataType>("source")
  const [newItem, setNewItem] = useState({ name: "", description: "", color: "#3B82F6" })
  const [newStage, setNewStage] = useState({ name: "", description: "", color: "#3B82F6", probability: 50, isClosed: false, isWon: false })
  const [newActivityAppliesTo, setNewActivityAppliesTo] = useState<typeof appliesToOptions[number][]>([])

  const toggleRule = (id: number) => {
    setRules(
      rules.map((rule) =>
        rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
      )
    )
  }

  const toggleChannel = (id: string) => {
    setChannels(
      channels.map((channel) =>
        channel.id === id ? { ...channel, enabled: !channel.enabled } : channel
      )
    )
  }

  const openBotConfig = (channel: BotChannel) => {
    setSelectedBotChannel(channel)
    setBotConfig({
      pageId: channel.pageId || "",
      pageName: channel.pageName || "",
      accessToken: channel.accessToken || "",
      webhookUrl: channel.webhookUrl || `https://api.xiqma.com/webhook/${channel.platform}`,
    })
    setIsBotConfigDialogOpen(true)
  }

  const handleConnectBot = () => {
    if (!selectedBotChannel) return
    setBotChannels(botChannels.map(ch => 
      ch.id === selectedBotChannel.id 
        ? { 
            ...ch, 
            isConnected: true, 
            pageId: botConfig.pageId,
            pageName: botConfig.pageName,
            accessToken: botConfig.accessToken,
            webhookUrl: botConfig.webhookUrl,
            lastSync: new Date().toISOString().slice(0, 16).replace("T", " ")
          } 
        : ch
    ))
    setIsBotConfigDialogOpen(false)
  }

  const handleDisconnectBot = (channelId: string) => {
    setBotChannels(botChannels.map(ch => 
      ch.id === channelId 
        ? { ...ch, isConnected: false, pageId: undefined, pageName: undefined, accessToken: undefined, webhookUrl: undefined, lastSync: undefined } 
        : ch
    ))
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "messenger":
        return (
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
            <path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.91 1.19 5.44 3.14 7.17.16.14.26.35.27.57l.05 1.78c.02.63.63 1.07 1.21.87l1.99-.69c.17-.06.36-.06.53-.01.92.25 1.9.39 2.81.39 5.64 0 10-4.13 10-9.7S17.64 2 12 2zm1.02 13.04l-2.55-2.72-4.98 2.72 5.48-5.82 2.61 2.72 4.93-2.72-5.49 5.82z"/>
          </svg>
        )
      case "facebook_comment":
        return (
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        )
      case "instagram":
        return (
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
          </svg>
        )
      case "tiktok":
        return (
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
          </svg>
        )
      case "line_oa":
        return (
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
            <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
          </svg>
        )
      default:
        return <MessageCircle className="w-6 h-6" />
    }
  }

  const openAddDialog = (type: MasterDataType) => {
    setAddDialogType(type)
    setNewItem({ name: "", description: "", color: "#3B82F6" })
    setNewActivityAppliesTo([])
    setIsAddDialogOpen(true)
  }

  const handleAddItem = () => {
    const newId = Date.now()

    if (addDialogType === "oppStage") {
      const item: OpportunityStage = {
        id: newId,
        name: newStage.name,
        description: newStage.description,
        color: newStage.color,
        probability: newStage.probability,
        order: opportunityStages.length + 1,
        isActive: true,
        isClosed: newStage.isClosed,
        isWon: newStage.isClosed ? newStage.isWon : undefined,
      }
      setOpportunityStages([...opportunityStages, item])
      setIsAddDialogOpen(false)
      setNewStage({ name: "", description: "", color: "#3B82F6", probability: 50, isClosed: false, isWon: false })
      return
    }

    if (addDialogType === "activity") {
      const item: ActivityType = {
        id: newId,
        name: newItem.name,
        description: newItem.description,
        color: newItem.color,
        isActive: true,
        appliesTo: newActivityAppliesTo,
      }
      setActivityTypes([...activityTypes, item])
    } else {
      const item: MasterDataItem = {
        id: newId,
        name: newItem.name,
        description: newItem.description,
        color: newItem.color,
        isActive: true,
      }

      switch (addDialogType) {
        case "source":
          setLeadSources([...leadSources, item])
          break
        case "type":
          setLeadTypes([...leadTypes, item])
          break
        case "grade":
          setLeadGrades([...leadGrades, item])
          break
        case "temperature":
          setLeadTemperatures([...leadTemperatures, item])
          break
        case "campaign":
          setCampaigns([...campaigns, item])
          break
        case "disqualify":
          setDisqualifyReasons([...disqualifyReasons, item])
          break
        case "unit":
          setProductUnits([...productUnits, item])
          break
      }
    }

    setIsAddDialogOpen(false)
  }

  const deleteItem = (type: MasterDataType, id: number) => {
    switch (type) {
      case "source":
        setLeadSources(leadSources.filter((item) => item.id !== id))
        break
      case "type":
        setLeadTypes(leadTypes.filter((item) => item.id !== id))
        break
      case "grade":
        setLeadGrades(leadGrades.filter((item) => item.id !== id))
        break
      case "temperature":
        setLeadTemperatures(leadTemperatures.filter((item) => item.id !== id))
        break
      case "campaign":
        setCampaigns(campaigns.filter((item) => item.id !== id))
        break
      case "activity":
        setActivityTypes(activityTypes.filter((item) => item.id !== id))
        break
      case "disqualify":
        setDisqualifyReasons(disqualifyReasons.filter((item) => item.id !== id))
        break
      case "oppStage":
        setOpportunityStages(opportunityStages.filter((item) => item.id !== id))
        break
      case "unit":
        setProductUnits(productUnits.filter((item) => item.id !== id))
        break
    }
  }

  const toggleItemActive = (type: MasterDataType, id: number) => {
    switch (type) {
      case "source":
        setLeadSources(leadSources.map((item) => item.id === id ? { ...item, isActive: !item.isActive } : item))
        break
      case "type":
        setLeadTypes(leadTypes.map((item) => item.id === id ? { ...item, isActive: !item.isActive } : item))
        break
      case "grade":
        setLeadGrades(leadGrades.map((item) => item.id === id ? { ...item, isActive: !item.isActive } : item))
        break
      case "temperature":
        setLeadTemperatures(leadTemperatures.map((item) => item.id === id ? { ...item, isActive: !item.isActive } : item))
        break
      case "campaign":
        setCampaigns(campaigns.map((item) => item.id === id ? { ...item, isActive: !item.isActive } : item))
        break
      case "activity":
        setActivityTypes(activityTypes.map((item) => item.id === id ? { ...item, isActive: !item.isActive } : item))
        break
      case "disqualify":
        setDisqualifyReasons(disqualifyReasons.map((item) => item.id === id ? { ...item, isActive: !item.isActive } : item))
        break
      case "oppStage":
        setOpportunityStages(opportunityStages.map((item) => item.id === id ? { ...item, isActive: !item.isActive } : item))
        break
      case "unit":
        setProductUnits(productUnits.map((item) => item.id === id ? { ...item, isActive: !item.isActive } : item))
        break
    }
  }

  const getDialogTitle = () => {
    switch (addDialogType) {
      case "source": return "เพิ่ม Lead Source"
      case "type": return "เพิ่ม Lead Type"
      case "grade": return "เพิ่ม Lead Grade"
      case "temperature": return "เพิ่ม Lead Temperature"
      case "oppStage": return "เพิ่ม Opportunity Stage"
      case "unit": return "เพิ่มหน่วยสินค้า"
      case "campaign": return "เพิ่ม Campaign"
      case "activity": return "เพิ่ม Activity Type"
      case "disqualify": return "เพิ่ม Disqualify Reason"
    }
  }

  const getCategoryTitle = () => {
    const category = masterDataCategories.find(c => c.type === viewMode)
    return category?.title || "Master Data"
  }

  const getItems = (type: MasterDataType): (MasterDataItem | ActivityType | OpportunityStage)[] => {
    switch (type) {
      case "source": return leadSources
      case "type": return leadTypes
      case "grade": return leadGrades
      case "temperature": return leadTemperatures
      case "oppStage": return opportunityStages
      case "unit": return productUnits
      case "campaign": return campaigns
      case "activity": return activityTypes
      case "disqualify": return disqualifyReasons
    }
  }

  const renderMasterDataList = (type: MasterDataType) => {
    const items = getItems(type)
    const category = masterDataCategories.find(c => c.type === type)
    const Icon = category?.icon || Tag

    return (
      <div className="space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewMode("grid")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Icon className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-bold text-foreground">{category?.title}</h3>
            </div>
            <p className="text-muted-foreground text-sm">{category?.description}</p>
          </div>
          <Button onClick={() => openAddDialog(type)} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            เพิ่มใหม่
          </Button>
        </div>

        {/* Items List */}
        <Card className="bg-card border-border">
          <CardContent className="p-4 space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  item.isActive ? "bg-secondary/30 border-border" : "bg-muted/20 border-border opacity-60"
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.color && (
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }} />
                  )}
                  <div>
                    <p className="font-medium text-foreground">{item.name}</p>
                    {item.description && (
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    )}
                    {type === "activity" && "appliesTo" in item && (
                      <div className="flex gap-1 mt-1">
                        {item.appliesTo.map((target) => (
                          <Badge key={target} variant="outline" className="text-xs border-border">
                            {target}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {type === "oppStage" && "probability" in item && (
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-xs border-border">
                          {item.probability}% Probability
                        </Badge>
                        {item.isClosed && (
                          <Badge 
                            className={`text-xs ${item.isWon ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}
                          >
                            {item.isWon ? "Won" : "Lost"}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={item.isActive}
                    onCheckedChange={() => toggleItemActive(type, item.id)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => deleteItem(type, item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Icon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>ยังไม่มีข้อมูล</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderSLASettings = () => (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setViewMode("grid")}
          className="text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <h3 className="text-xl font-bold text-foreground">SLA Settings</h3>
          </div>
          <p className="text-muted-foreground text-sm">กำหนดระยะเวลาและเงื่อนไขในการติดตาม</p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          เพิ่มกฎ SLA
        </Button>
      </div>

      {/* SLA Rules */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">SLA Rules</CardTitle>
          <CardDescription className="text-muted-foreground">
            กำหนดระยะเวลาและเงื่อนไขในการติดตามล���กค้า
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={`p-4 rounded-lg border ${
                rule.enabled
                  ? "bg-secondary/30 border-border"
                  : "bg-muted/30 border-border opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-foreground">{rule.name}</h4>
                    <Badge
                      variant="outline"
                      className={
                        rule.targetObject === "Lead"
                          ? "border-status-new text-status-new"
                          : "border-status-working text-status-working"
                      }
                    >
                      {rule.targetObject}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">เงื่อนไข:</span>
                      <p className="text-foreground">{rule.condition}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">ระยะเวลา:</span>
                      <p className="text-foreground font-medium">{rule.timeLimit}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">การดำเนินการ:</span>
                      <p className="text-foreground">{rule.action}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={() => toggleRule(rule.id)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Notification Channels */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg text-foreground">Notification Channels</CardTitle>
          </div>
          <CardDescription className="text-muted-foreground">
            เลือกช่องทางการแจ้งเตือนเมื่อมีการละเมิด SLA
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {channels.map((channel) => (
              <div
                key={channel.id}
                className={`p-4 rounded-lg border ${
                  channel.enabled
                    ? "bg-primary/10 border-primary/30"
                    : "bg-secondary/30 border-border"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        channel.enabled ? "bg-primary/20" : "bg-muted"
                      }`}
                    >
                      <channel.icon
                        className={`w-5 h-5 ${
                          channel.enabled ? "text-primary" : "text-muted-foreground"
                        }`}
                      />
                    </div>
                    <span
                      className={`font-medium ${
                        channel.enabled ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {channel.name}
                    </span>
                  </div>
                  <Switch
                    checked={channel.enabled}
                    onCheckedChange={() => toggleChannel(channel.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Automated Actions */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg text-foreground">Automated Actions</CardTitle>
          </div>
          <CardDescription className="text-muted-foreground">
            การดำเนินการอัตโนมัติเมื่อมีการละเมิด SLA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-secondary/30 border border-border">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-accent/20">
                  <Users className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Auto Re-assignment</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    โอน Lead ไปให้ Sales คนอื่นอัตโนมัติเมื่อเกิน SLA
                  </p>
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">หลังจาก:</span>
                      <Select defaultValue="24">
                        <SelectTrigger className="w-24 h-8 bg-secondary border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          <SelectItem value="12">12 ชม.</SelectItem>
                          <SelectItem value="24">24 ชม.</SelectItem>
                          <SelectItem value="48">48 ชม.</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">โอนไปให้:</span>
                      <Select defaultValue="round-robin">
                        <SelectTrigger className="w-32 h-8 bg-secondary border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          <SelectItem value="round-robin">Round Robin</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="specific">เลือกคน</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
              <Switch defaultChecked />
            </div>
          </div>

          <div className="p-4 rounded-lg bg-secondary/30 border border-border">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-destructive/20">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Stagnant Deal Escalation</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    แจ้งเตือน Manager เมื่อ Opportunity ไม่มีการขยับสถานะ
                  </p>
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">หลังจาก:</span>
                      <Select defaultValue="7">
                        <SelectTrigger className="w-24 h-8 bg-secondary border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          <SelectItem value="3">3 วัน</SelectItem>
                          <SelectItem value="7">7 วัน</SelectItem>
                          <SelectItem value="14">14 วัน</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">แจ้ง:</span>
                      <Select defaultValue="manager">
                        <SelectTrigger className="w-32 h-8 bg-secondary border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="director">Director</SelectItem>
                          <SelectItem value="both">ทั้งคู่</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderBotSettings = () => (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setViewMode("grid")}
          className="text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            <h3 className="text-xl font-bold text-foreground">Bot Settings</h3>
          </div>
          <p className="text-muted-foreground text-sm">เชื่อมต่อ Bot กับช่องทาง Chat ต่างๆ</p>
        </div>
      </div>

      {/* Connected Channels */}
      <div>
        <h4 className="text-lg font-semibold text-foreground mb-4">ช่องทางที่เชื่อมต่อแล้ว</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {botChannels.filter(ch => ch.isConnected).map((channel) => (
            <Card key={channel.id} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
                      style={{ backgroundColor: channel.color }}
                    >
                      {getPlatformIcon(channel.platform)}
                    </div>
                    <div>
                      <h5 className="font-semibold text-foreground">{channel.name}</h5>
                      <p className="text-sm text-muted-foreground">{channel.pageName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-green-500/20 text-green-400 text-xs">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          เชื่อมต่อแล้ว
                        </Badge>
                        {channel.lastSync && (
                          <span className="text-xs text-muted-foreground">
                            อัพเดต: {channel.lastSync}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => openBotConfig(channel)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-primary"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => handleDisconnectBot(channel.id)}
                    >
                      <Unlink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {channel.webhookUrl && (
                  <div className="mt-4 p-3 bg-secondary/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Webhook URL</p>
                        <p className="text-sm text-foreground font-mono truncate max-w-xs">{channel.webhookUrl}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="text-muted-foreground">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {botChannels.filter(ch => ch.isConnected).length === 0 && (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              <Bot className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>ยังไม่มีช่องทางที่เชื่อมต่อ</p>
            </div>
          )}
        </div>
      </div>

      {/* Available Channels */}
      <div>
        <h4 className="text-lg font-semibold text-foreground mb-4">ช่องทางที่สามารถเชื่อมต่อได้</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {botChannels.filter(ch => !ch.isConnected).map((channel) => (
            <Card 
              key={channel.id} 
              className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer group"
              onClick={() => openBotConfig(channel)}
            >
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div 
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform opacity-60 group-hover:opacity-100"
                  style={{ backgroundColor: channel.color + "30", color: channel.color }}
                >
                  {getPlatformIcon(channel.platform)}
                </div>
                <h5 className="font-medium text-foreground mb-1">{channel.name}</h5>
                <Button size="sm" variant="outline" className="mt-2 border-border">
                  <Link2 className="w-4 h-4 mr-2" />
                  เชื่อมต่อ
                </Button>
              </CardContent>
            </Card>
          ))}
          {botChannels.filter(ch => !ch.isConnected).length === 0 && (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>เชื่อมต่อทุกช่องทางแล้ว</p>
            </div>
          )}
        </div>
      </div>

      {/* Bot Configuration Tips */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">คำแนะนำในการตั้งค่า</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-secondary/30 rounded-lg">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <MessageCircle className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h6 className="font-medium text-foreground">Facebook Messenger / Comment</h6>
              <p className="text-sm text-muted-foreground">ต้องมี Facebook Page และ App ที่ได้รับการอนุมัติ Permissions สำหรับ Messaging</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-secondary/30 rounded-lg">
            <div className="p-2 rounded-lg bg-pink-500/20">
              {getPlatformIcon("instagram")}
            </div>
            <div>
              <h6 className="font-medium text-foreground">Instagram</h6>
              <p className="text-sm text-muted-foreground">ต้องเป็น Business Account ที่เชื่อมต่อกับ Facebook Page</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-secondary/30 rounded-lg">
            <div className="p-2 rounded-lg bg-green-500/20">
              {getPlatformIcon("line_oa")}
            </div>
            <div>
              <h6 className="font-medium text-foreground">LINE Official Account</h6>
              <p className="text-sm text-muted-foreground">ต้องมี LINE Official Account และเปิดใช้งาน Messaging API</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-secondary/30 rounded-lg">
            <div className="p-2 rounded-lg bg-gray-500/20">
              {getPlatformIcon("tiktok")}
            </div>
            <div>
              <h6 className="font-medium text-foreground">TikTok</h6>
              <p className="text-sm text-muted-foreground">ต้องมี TikTok Business Account และลงทะเบียน TikTok for Business API</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderGrid = () => (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Settings</h2>
        <p className="text-muted-foreground">ตั้งค่า Master Data และ SLA Rules</p>
      </div>

      {/* Master Data Grid */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Master Data</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {masterDataCategories.map((category) => {
            const Icon = category.icon
            const itemCount = getItems(category.type).length
            return (
              <Card
                key={category.type}
                className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer group"
                onClick={() => setViewMode(category.type)}
              >
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className={`w-14 h-14 rounded-xl ${category.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-1">{category.title}</h4>
                  <p className="text-sm text-muted-foreground mb-2">{category.description}</p>
                  <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                    {itemCount} รายการ
                  </Badge>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* SLA Settings Card */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">System Settings</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <Card
            className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer group"
            onClick={() => setViewMode("sla")}
          >
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Clock className="w-7 h-7" />
              </div>
              <h4 className="font-semibold text-foreground mb-1">SLA Settings</h4>
              <p className="text-sm text-muted-foreground mb-2">ตั้งค่า SLA และ Notifications</p>
              <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                {rules.filter(r => r.enabled).length} Active Rules
              </Badge>
            </CardContent>
          </Card>
          <Card
            className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer group"
            onClick={() => setViewMode("bot")}
          >
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Bot className="w-7 h-7" />
              </div>
              <h4 className="font-semibold text-foreground mb-1">Bot Settings</h4>
              <p className="text-sm text-muted-foreground mb-2">เชื่อมต่อ Bot กับ Chat</p>
              <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                {botChannels.filter(ch => ch.isConnected).length}/{botChannels.length} Connected
              </Badge>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {viewMode === "grid" && renderGrid()}
      {viewMode === "sla" && renderSLASettings()}
      {viewMode === "bot" && renderBotSettings()}
      {viewMode !== "grid" && viewMode !== "sla" && viewMode !== "bot" && renderMasterDataList(viewMode)}

      {/* Add Item Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">{getDialogTitle()}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              กรอกข้อมูลเพื่อเพิ่มรายการใหม่
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {addDialogType !== "oppStage" && (
              <>
                <div className="space-y-2">
                  <Label className="text-foreground">ชื่อ</Label>
                  <Input
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    placeholder="กรอกชื่อ..."
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">คำอธิบาย</Label>
                  <Input
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    placeholder="กรอกคำอธิบาย..."
                    className="bg-secondary border-border"
                  />
                </div>
              </>
            )}
            {(addDialogType === "source" || addDialogType === "grade" || addDialogType === "temperature" || addDialogType === "activity") && (
              <div className="space-y-2">
                <Label className="text-foreground">สี</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={newItem.color}
                    onChange={(e) => setNewItem({ ...newItem, color: e.target.value })}
                    className="w-12 h-10 p-1 bg-secondary border-border"
                  />
                  <Input
                    value={newItem.color}
                    onChange={(e) => setNewItem({ ...newItem, color: e.target.value })}
                    className="flex-1 bg-secondary border-border"
                  />
                </div>
              </div>
            )}
            {addDialogType === "activity" && (
              <div className="space-y-2">
                <Label className="text-foreground">ใช้กับ</Label>
                <div className="grid grid-cols-2 gap-2">
                  {appliesToOptions.map((option) => (
                    <div key={option} className="flex items-center gap-2">
                      <Checkbox
                        id={`applies-${option}`}
                        checked={newActivityAppliesTo.includes(option)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setNewActivityAppliesTo([...newActivityAppliesTo, option])
                          } else {
                            setNewActivityAppliesTo(newActivityAppliesTo.filter(o => o !== option))
                          }
                        }}
                      />
                      <Label htmlFor={`applies-${option}`} className="text-foreground text-sm cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {addDialogType === "oppStage" && (
              <>
                <div className="space-y-2">
                  <Label className="text-foreground">ชื่อ Stage</Label>
                  <Input
                    value={newStage.name}
                    onChange={(e) => setNewStage({ ...newStage, name: e.target.value })}
                    placeholder="เช่น Qualification, Proposal..."
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">คำอธิบาย</Label>
                  <Input
                    value={newStage.description}
                    onChange={(e) => setNewStage({ ...newStage, description: e.target.value })}
                    placeholder="กรอกคำอธิบาย..."
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-foreground">สี</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={newStage.color}
                        onChange={(e) => setNewStage({ ...newStage, color: e.target.value })}
                        className="w-12 h-10 p-1 bg-secondary border-border"
                      />
                      <Input
                        value={newStage.color}
                        onChange={(e) => setNewStage({ ...newStage, color: e.target.value })}
                        className="flex-1 bg-secondary border-border"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Probability (%)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={newStage.probability}
                      onChange={(e) => setNewStage({ ...newStage, probability: parseInt(e.target.value) || 0 })}
                      className="bg-secondary border-border"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="isClosed"
                      checked={newStage.isClosed}
                      onCheckedChange={(checked) => setNewStage({ ...newStage, isClosed: !!checked, isWon: false })}
                    />
                    <Label htmlFor="isClosed" className="text-foreground text-sm cursor-pointer">
                      เป็น Stage ปิดการขาย (Closed Stage)
                    </Label>
                  </div>
                  {newStage.isClosed && (
                    <div className="ml-6 flex items-center gap-2">
                      <Checkbox
                        id="isWon"
                        checked={newStage.isWon}
                        onCheckedChange={(checked) => setNewStage({ ...newStage, isWon: !!checked })}
                      />
                      <Label htmlFor="isWon" className="text-foreground text-sm cursor-pointer">
                        ปิดสำเร็จ (Won)
                      </Label>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="border-border">
              ยกเลิก
            </Button>
            <Button 
              onClick={handleAddItem} 
              disabled={addDialogType === "oppStage" ? !newStage.name : !newItem.name} 
              className="bg-primary text-primary-foreground"
            >
              บันทึก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bot Configuration Dialog */}
      <Dialog open={isBotConfigDialogOpen} onOpenChange={setIsBotConfigDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              {selectedBotChannel && (
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: selectedBotChannel.color }}
                >
                  {getPlatformIcon(selectedBotChannel.platform)}
                </div>
              )}
              {selectedBotChannel?.isConnected ? "แก้ไขการเชื่อมต่อ" : "เชื่อมต่อ"} {selectedBotChannel?.name}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              กรอกข้อมูลเพื่อ{selectedBotChannel?.isConnected ? "แก้ไข" : "เชื่อมต่อ"} Bot กับ {selectedBotChannel?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {(selectedBotChannel?.platform === "messenger" || selectedBotChannel?.platform === "facebook_comment") && (
              <>
                <div className="space-y-2">
                  <Label className="text-foreground">Page ID</Label>
                  <Input
                    value={botConfig.pageId}
                    onChange={(e) => setBotConfig({ ...botConfig, pageId: e.target.value })}
                    placeholder="กรอก Facebook Page ID..."
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Page Name</Label>
                  <Input
                    value={botConfig.pageName}
                    onChange={(e) => setBotConfig({ ...botConfig, pageName: e.target.value })}
                    placeholder="ชื่อ Facebook Page..."
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Access Token</Label>
                  <Input
                    type="password"
                    value={botConfig.accessToken}
                    onChange={(e) => setBotConfig({ ...botConfig, accessToken: e.target.value })}
                    placeholder="กรอก Page Access Token..."
                    className="bg-secondary border-border"
                  />
                </div>
              </>
            )}
            {selectedBotChannel?.platform === "instagram" && (
              <>
                <div className="space-y-2">
                  <Label className="text-foreground">Instagram Business Account ID</Label>
                  <Input
                    value={botConfig.pageId}
                    onChange={(e) => setBotConfig({ ...botConfig, pageId: e.target.value })}
                    placeholder="กรอก Instagram Business Account ID..."
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Username</Label>
                  <Input
                    value={botConfig.pageName}
                    onChange={(e) => setBotConfig({ ...botConfig, pageName: e.target.value })}
                    placeholder="@username..."
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Access Token</Label>
                  <Input
                    type="password"
                    value={botConfig.accessToken}
                    onChange={(e) => setBotConfig({ ...botConfig, accessToken: e.target.value })}
                    placeholder="กรอก Access Token..."
                    className="bg-secondary border-border"
                  />
                </div>
              </>
            )}
            {selectedBotChannel?.platform === "line_oa" && (
              <>
                <div className="space-y-2">
                  <Label className="text-foreground">Channel ID</Label>
                  <Input
                    value={botConfig.pageId}
                    onChange={(e) => setBotConfig({ ...botConfig, pageId: e.target.value })}
                    placeholder="กรอก LINE Channel ID..."
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Bot Name</Label>
                  <Input
                    value={botConfig.pageName}
                    onChange={(e) => setBotConfig({ ...botConfig, pageName: e.target.value })}
                    placeholder="ชื่อ LINE Official Account..."
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Channel Access Token</Label>
                  <Input
                    type="password"
                    value={botConfig.accessToken}
                    onChange={(e) => setBotConfig({ ...botConfig, accessToken: e.target.value })}
                    placeholder="กรอก Channel Access Token..."
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Webhook URL</Label>
                  <Input
                    value={botConfig.webhookUrl}
                    onChange={(e) => setBotConfig({ ...botConfig, webhookUrl: e.target.value })}
                    placeholder="https://your-domain.com/webhook/line"
                    className="bg-secondary border-border"
                  />
                  <p className="text-xs text-muted-foreground">ใช้สำหรับรับข้อความจาก LINE</p>
                </div>
              </>
            )}
            {selectedBotChannel?.platform === "tiktok" && (
              <>
                <div className="space-y-2">
                  <Label className="text-foreground">TikTok Business ID</Label>
                  <Input
                    value={botConfig.pageId}
                    onChange={(e) => setBotConfig({ ...botConfig, pageId: e.target.value })}
                    placeholder="กรอก TikTok Business ID..."
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Account Name</Label>
                  <Input
                    value={botConfig.pageName}
                    onChange={(e) => setBotConfig({ ...botConfig, pageName: e.target.value })}
                    placeholder="@username..."
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Access Token</Label>
                  <Input
                    type="password"
                    value={botConfig.accessToken}
                    onChange={(e) => setBotConfig({ ...botConfig, accessToken: e.target.value })}
                    placeholder="กรอก Access Token..."
                    className="bg-secondary border-border"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBotConfigDialogOpen(false)} className="border-border">
              ยกเลิก
            </Button>
            <Button 
              onClick={handleConnectBot} 
              disabled={!botConfig.pageId || !botConfig.accessToken}
              className="bg-primary text-primary-foreground"
            >
              <Link2 className="w-4 h-4 mr-2" />
              {selectedBotChannel?.isConnected ? "บันทึก" : "เชื่อมต่อ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
