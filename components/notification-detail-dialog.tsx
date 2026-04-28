"use client";

import Link from "next/link";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
  Bell, CheckCheck, ExternalLink,
  CheckCircle2, AlertCircle, Clock, MessageSquare, RotateCcw,
  Sparkles, Sun, Megaphone, FileText, AtSign, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { NotificationItem } from "@/lib/api/notifications";

// Event type → icon + accent color (matches LINE/email theme)
function metaFor(t: string): { icon: React.ComponentType<{ className?: string }>; color: string; label: string } {
  switch (t) {
    case "assigned":           return { icon: ArrowRight,    color: "#FB7185", label: "งานใหม่" };
    case "task_completed":     return { icon: CheckCircle2,  color: "#10B981", label: "งานเสร็จ" };
    case "comment_mention":    return { icon: AtSign,        color: "#D946EF", label: "@ คุณ" };
    case "comment_reply":      return { icon: MessageSquare, color: "#8B5CF6", label: "ตอบ comment" };
    case "rework_requested":   return { icon: RotateCcw,     color: "#F59E0B", label: "ส่งกลับแก้ไข" };
    case "extension_request":  return { icon: Clock,         color: "#8B5CF6", label: "ขอขยายเวลา" };
    case "extension_approved": return { icon: CheckCircle2,  color: "#10B981", label: "อนุมัติขยายเวลา" };
    case "extension_rejected": return { icon: AlertCircle,   color: "#EF4444", label: "ปฏิเสธขยายเวลา" };
    case "leave_request":      return { icon: FileText,      color: "#8B5CF6", label: "ขอลา" };
    case "leave_approved":     return { icon: CheckCircle2,  color: "#10B981", label: "อนุมัติลา" };
    case "leave_rejected":     return { icon: AlertCircle,   color: "#EF4444", label: "ปฏิเสธลา" };
    case "due_reminder":       return { icon: Clock,         color: "#FB923C", label: "ใกล้กำหนด" };
    case "overdue":            return { icon: AlertCircle,   color: "#EF4444", label: "เกินกำหนด" };
    case "daily_summary":      return { icon: Sun,           color: "#FB7185", label: "สรุปประจำวัน" };
    case "announcement":       return { icon: Megaphone,     color: "#0EA5E9", label: "ประกาศ" };
    default:                   return { icon: Bell,          color: "#FB7185", label: t };
  }
}

interface Props {
  notification: NotificationItem | null;
  onOpenChange: (open: boolean) => void;
  onMarkRead?: (n: NotificationItem) => void;
}

export function NotificationDetailDialog({ notification, onOpenChange, onMarkRead }: Props) {
  const open = !!notification;

  if (!notification) {
    return (
      <Dialog open={false} onOpenChange={onOpenChange}>
        <DialogContent />
      </Dialog>
    );
  }

  const meta = metaFor(notification.notifType);
  const Icon = meta.icon;
  const color = meta.color;

  const hasMeaningfulDeepLink =
    notification.deepLink && notification.deepLink !== "/" && notification.deepLink !== "";

  const handleMarkRead = () => {
    if (!notification.isRead && onMarkRead) onMarkRead(notification);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-md">
        {/* Header — gradient with event color */}
        <div
          className="relative px-6 pb-6 pt-7"
          style={{
            background: `linear-gradient(135deg, ${color}22 0%, ${color}0a 60%, transparent 100%)`,
          }}
        >
          <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: color }} />

          {/* Decorative blur blob */}
          <div
            className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full blur-3xl"
            style={{ backgroundColor: `${color}40` }}
          />

          <div className="relative flex items-start gap-3">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
                boxShadow: `0 8px 24px ${color}33`,
              }}
            >
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  className="border-0 text-[10px] font-semibold uppercase tracking-wider"
                  style={{ backgroundColor: `${color}20`, color: color }}
                >
                  {meta.label}
                </Badge>
                {notification.taskDisplayId && (
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {notification.taskDisplayId}
                  </Badge>
                )}
                {!notification.isRead && (
                  <Badge variant="secondary" className="text-[10px]">ยังไม่อ่าน</Badge>
                )}
              </div>
              <DialogHeader className="mt-2">
                <DialogTitle className="text-left text-lg leading-snug">
                  {notification.title || meta.label}
                </DialogTitle>
              </DialogHeader>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-4 px-6 pb-2">
          {notification.message && notification.message !== notification.title && (
            <div className="rounded-xl border border-border/60 bg-muted/30 p-4 text-sm leading-relaxed">
              <div className="whitespace-pre-wrap break-words">{notification.message}</div>
            </div>
          )}

          {/* Meta */}
          <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
            <MetaRow label="เกิดขึ้นเมื่อ" value={format(new Date(notification.createdAt), "d MMM yyyy · HH:mm", { locale: th })} />
            {notification.relatedType && (
              <MetaRow
                label="ประเภท"
                value={
                  notification.relatedType === "task" ? "งาน" :
                  notification.relatedType === "comment" ? "Comment" :
                  notification.relatedType === "leave" ? "ลา" :
                  notification.relatedType === "extension" ? "ขยายเวลา" :
                  notification.relatedType
                }
              />
            )}
            {notification.isRead && notification.readAt && (
              <MetaRow label="อ่านเมื่อ" value={format(new Date(notification.readAt), "d MMM HH:mm", { locale: th })} />
            )}
          </div>
        </div>

        <DialogFooter className="flex-col-reverse gap-2 border-t bg-muted/20 px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
          {!notification.isRead ? (
            <Button variant="ghost" size="sm" onClick={handleMarkRead}>
              <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
              ทำเครื่องหมายว่าอ่านแล้ว
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">
              <CheckCheck className="mr-1 inline h-3.5 w-3.5 text-emerald-600" />
              อ่านแล้ว
            </span>
          )}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              ปิด
            </Button>
            {hasMeaningfulDeepLink && (
              <Button
                size="sm"
                asChild
                style={{
                  background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
                  color: "#fff",
                }}
                className={cn("border-0 hover:opacity-90")}
              >
                <Link href={notification.deepLink!} onClick={() => onOpenChange(false)}>
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                  เปิดหน้านี้
                </Link>
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 rounded-md bg-muted/40 px-3 py-1.5 sm:flex-col sm:items-start sm:gap-0">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="text-xs font-medium">{value}</span>
    </div>
  );
}
