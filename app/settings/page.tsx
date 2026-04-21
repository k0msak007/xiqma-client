"use client";

import Link from "next/link";
import {
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
  History,
} from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n";
import { PermissionGate } from "@/components/permission-gate";
import { usePermission } from "@/lib/use-permission";

const SETTINGS_PAGE_REQUIRES = ["manage_users", "manage_roles", "manage_workspace", "view_analytics"];

export default function SettingsPage() {
  return (
    <PermissionGate requires={SETTINGS_PAGE_REQUIRES}>
      <SettingsPageInner />
    </PermissionGate>
  );
}

type Tile = {
  href: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  description: string;
  color: string;
  /** User must have ANY of these (admin always allowed) */
  requires: string[];
};

function SettingsPageInner() {
  const { t, language } = useTranslation();
  const { hasAny } = usePermission();

  const tiles: Tile[] = [
    {
      href: "/team",
      icon: Users,
      title: t("nav.team"),
      description: "View and manage team members",
      color: "#3b82f6",
      requires: ["manage_users"],
    },
    {
      href: "/settings/roles",
      icon: Shield,
      title: t("settings.roleManagement"),
      description: "Create roles with permissions and point ratios",
      color: "#10b981",
      requires: ["manage_roles"],
    },
    {
      href: "/settings/users",
      icon: UserCog,
      title: t("settings.userManagement"),
      description: "Add users and assign roles with custom point ratios",
      color: "#8b5cf6",
      requires: ["manage_users"],
    },
    {
      href: "/settings/performance",
      icon: Target,
      title: "Performance Config",
      description:
        language === "th"
          ? "กำหนด work schedule และ point target ต่อพนักงาน"
          : "Set per-employee work schedule and point target",
      color: "#0ea5e9",
      requires: ["view_analytics", "manage_users"],
    },
    {
      href: "/settings/holidays",
      icon: Calendar,
      title: language === "th" ? "ตั้งค่าวันหยุด" : "Holiday Settings",
      description:
        language === "th"
          ? "กำหนดวันหยุดสุดสัปดาห์และวันหยุดพิเศษ"
          : "Configure weekend days and special holidays",
      color: "#ef4444",
      requires: ["manage_users", "manage_workspace"],
    },
    {
      href: "/settings/task-types",
      icon: Layers,
      title: t("settings.taskTypeMaster"),
      description: "Define task types and whether they count for points",
      color: "#f59e0b",
      requires: ["manage_workspace"],
    },
    {
      href: "/settings/job-status",
      icon: CircleDot,
      title: "Job Status Master",
      description:
        language === "th"
          ? "จัดการสถานะของงาน เพิ่ม/แก้ไข/ลบ"
          : "Manage job statuses - add, edit, delete",
      color: "#14b8a6",
      requires: ["manage_workspace"],
    },
    {
      href: "/settings/organization",
      icon: Building2,
      title: language === "th" ? "โครงสร้างองค์กร" : "Organization Chart",
      description:
        language === "th"
          ? "จัดการตำแหน่งและโครงสร้างบริษัท"
          : "Manage positions and company structure",
      color: "#6366f1",
      requires: ["manage_workspace"],
    },
    {
      href: "/settings/ai-automate",
      icon: Bot,
      title: "AI Automate Task",
      description:
        language === "th"
          ? "ตั้งค่า Bot แจ้งเตือนและติดตามงาน"
          : "Configure bot alerts and task follow-ups",
      color: "#ec4899",
      requires: ["manage_workspace"],
    },
    {
      href: "/settings/ai-chatbot",
      icon: MessageSquare,
      title: "AI Chatbot Setup",
      description:
        language === "th"
          ? "ตั้งค่า API Token สำหรับ Line และ Chatbot อื่นๆ"
          : "Configure API tokens for Line and other chatbots",
      color: "#06b6d4",
      requires: ["manage_workspace"],
    },
    {
      href: "/settings/audit-logs",
      icon: History,
      title: "Audit Logs",
      description:
        language === "th"
          ? "ดูบันทึกการกระทำทุกอย่างในระบบ (admin เท่านั้น)"
          : "View all system actions for audit/debug (admin only)",
      color: "#f59e0b",
      requires: ["admin"],
    },
  ];

  const visibleTiles = tiles.filter((t) => hasAny(t.requires));

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("settings.settings")}</h1>
        <p className="text-muted-foreground">{t("settings.teamManagement")}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {visibleTiles.map((item) => (
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
