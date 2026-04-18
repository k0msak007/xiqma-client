"use client";

import Link from "next/link";
import {
  Settings,
  Shield,
  Users,
  UserCog,
  ChevronRight,
  Layers,
  Calendar,
  Building2,
  Bot,
  MessageSquare,
  CircleDot,
  Target,
} from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n";
import { PermissionGate } from "@/components/permission-gate";

export default function SettingsPage() {
  return (
    <PermissionGate requires={["manage_users"]}>
      <SettingsPageInner />
    </PermissionGate>
  );
}

function SettingsPageInner() {
  const { t, language } = useTranslation();

  const settingsLinks = [
    {
      href: "/team",
      icon: Users,
      title: t("nav.team"),
      description: "View and manage team members",
      color: "#3b82f6",
    },
    {
      href: "/settings/roles",
      icon: Shield,
      title: t("settings.roleManagement"),
      description: "Create roles with permissions and point ratios",
      color: "#10b981",
    },
    {
      href: "/settings/users",
      icon: UserCog,
      title: t("settings.userManagement"),
      description: "Add users and assign roles with custom point ratios",
      color: "#8b5cf6",
    },
    {
      href: "/settings/performance",
      icon: Target,
      title: language === "th" ? "Performance Config" : "Performance Config",
      description: language === "th"
        ? "กำหนด work schedule และ point target ต่อพนักงาน"
        : "Set per-employee work schedule and point target",
      color: "#0ea5e9",
    },
    {
      href: "/settings/task-types",
      icon: Layers,
      title: t("settings.taskTypeMaster"),
      description: "Define task types and whether they count for points",
      color: "#f59e0b",
    },
    {
      href: "/settings/job-status",
      icon: CircleDot,
      title: language === "th" ? "Job Status Master" : "Job Status Master",
      description: language === "th" 
        ? "จัดการสถานะของงาน เพิ่ม/แก้ไข/ลบ" 
        : "Manage job statuses - add, edit, delete",
      color: "#14b8a6",
    },
    {
      href: "/settings/holidays",
      icon: Calendar,
      title: language === "th" ? "ตั้งค่าวันหยุด" : "Holiday Settings",
      description: language === "th" 
        ? "กำหนดวันหยุดสุดสัปดาห์และวันหยุดพิเศษ" 
        : "Configure weekend days and special holidays",
      color: "#ef4444",
    },
    {
      href: "/settings/organization",
      icon: Building2,
      title: language === "th" ? "โครงสร้างองค์กร" : "Organization Chart",
      description: language === "th" 
        ? "จัดการตำแหน่งและโครงสร้างบริษัท" 
        : "Manage positions and company structure",
      color: "#6366f1",
    },
    {
      href: "/settings/ai-automate",
      icon: Bot,
      title: language === "th" ? "AI Automate Task" : "AI Automate Task",
      description: language === "th" 
        ? "ตั้งค่า Bot แจ้งเตือนและติดตามงาน" 
        : "Configure bot alerts and task follow-ups",
      color: "#ec4899",
    },
    {
      href: "/settings/ai-chatbot",
      icon: MessageSquare,
      title: language === "th" ? "AI Chatbot Setup" : "AI Chatbot Setup",
      description: language === "th" 
        ? "ตั้งค่า API Token สำหรับ Line และ Chatbot อื่นๆ" 
        : "Configure API tokens for Line and other chatbots",
      color: "#06b6d4",
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("settings.settings")}</h1>
        <p className="text-muted-foreground">
          {t("settings.teamManagement")}
        </p>
      </div>

      {/* Settings Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {settingsLinks.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="cursor-pointer hover:border-primary transition-colors h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${item.color}20` }}
                  >
                    <item.icon className="h-5 w-5" style={{ color: item.color }} />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
