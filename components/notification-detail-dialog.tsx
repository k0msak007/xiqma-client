"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
  Bell, CheckCheck, X,
  CheckCircle2, AlertCircle, Clock, MessageSquare, RotateCcw,
  Sun, Megaphone, FileText, AtSign, ArrowRight, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { NotificationItem } from "@/lib/api/notifications";

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
  const router = useRouter();

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

  const hasDeepLink =
    notification.deepLink && notification.deepLink !== "/" && notification.deepLink !== "";

  const handleMarkRead = () => {
    if (!notification.isRead && onMarkRead) onMarkRead(notification);
  };

  const handleOpenLink = () => {
    onOpenChange(false);
    if (hasDeepLink) {
      router.push(notification.deepLink!);
    } else if (notification.taskId) {
      router.push(`/task/${notification.taskId}`);
    }
  };

  const linkLabel = hasDeepLink
    ? "เปิดหน้านี้"
    : notification.taskId
      ? "ดูงาน"
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* flex + min-h-0 cascade = scroll works */}
      <DialogContent
        className="flex max-h-[88vh] flex-col overflow-hidden p-0 sm:max-w-lg"
        showCloseButton={false}
      >
        {/* ── Gradient accent bar ── */}
        <div className="absolute inset-x-0 top-0 z-10 h-1" style={{ backgroundColor: color }} />

        {/* ── Header (shrink-0 → fixed) ── */}
        <div className="shrink-0 px-5 pb-3 pt-6">
          <div className="flex items-start gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{
                background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
                boxShadow: `0 4px 16px ${color}33`,
              }}
            >
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge className="border-0 text-[10px] font-semibold" style={{ backgroundColor: `${color}18`, color }}>
                  {meta.label}
                </Badge>
                {notification.taskDisplayId && (
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {notification.taskDisplayId}
                  </Badge>
                )}
                {!notification.isRead && (
                  <span className="ml-auto h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                )}
              </div>
              <DialogHeader className="mt-1">
                <DialogTitle className="text-left text-sm font-semibold leading-snug line-clamp-2">
                  {notification.title || meta.label}
                </DialogTitle>
              </DialogHeader>
            </div>
          </div>
        </div>

        {/* ── Body (flex-1 + min-h-0 + overflow-y-auto → scroll) ── */}
        <div
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5
            [&::-webkit-scrollbar]:w-1.5
            [&::-webkit-scrollbar-track]:bg-transparent
            [&::-webkit-scrollbar-thumb]:rounded-full
            [&::-webkit-scrollbar-thumb]:bg-border/60
            hover:[&::-webkit-scrollbar-thumb]:bg-border"
          style={{ scrollbarWidth: "thin", scrollbarColor: "hsl(var(--border) / 0.6) transparent" }}
        >
          <div className="space-y-3 pb-1">
            {notification.message && notification.message !== notification.title && (
              <div className="rounded-lg border border-border/50 bg-muted/20 p-3.5">
                <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                  {notification.message}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-1.5">
              <MetaBlock
                label="เวลา"
                value={format(new Date(notification.createdAt), "d MMM yyyy · HH:mm", { locale: th })}
              />
              {notification.relatedType && (
                <MetaBlock
                  label="เกี่ยวข้องกับ"
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
                <MetaBlock
                  label="อ่านเมื่อ"
                  value={format(new Date(notification.readAt), "d MMM HH:mm", { locale: th })}
                />
              )}
            </div>
          </div>
        </div>

        {/* ── Footer (shrink-0 → fixed) ── */}
        <DialogFooter className="shrink-0 border-t bg-muted/10 px-5 py-2.5">
          <div className="flex w-full items-center justify-between gap-2">
            <div>
              {!notification.isRead ? (
                <Button variant="ghost" size="sm" onClick={handleMarkRead} className="h-8 gap-1.5 text-xs">
                  <CheckCheck className="h-3.5 w-3.5 text-muted-foreground" />
                  อ่านแล้ว
                </Button>
              ) : (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CheckCheck className="h-3.5 w-3.5 text-emerald-500" />
                  อ่านแล้ว
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="h-8 text-xs">
                <X className="mr-1 h-3.5 w-3.5" />
                ปิด
              </Button>
              {linkLabel && (
                <Button
                  size="sm"
                  onClick={handleOpenLink}
                  className="h-8 text-xs border-0 text-white"
                  style={{ background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)` }}
                >
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                  {linkLabel}
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MetaBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/30 px-3 py-2">
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-xs font-medium">{value}</div>
    </div>
  );
}
