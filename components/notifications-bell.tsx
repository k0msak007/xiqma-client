"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Loader2, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  notificationsApi,
  type NotificationItem,
} from "@/lib/api/notifications";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "sonner";
import { NotificationDetailDialog } from "@/components/notification-detail-dialog";

const POLL_MS = 30_000;
const TOAST_ID = "notif-batch";

export function NotificationsBell() {
  const isAuthed = useAuthStore((s) => !!s.user);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [marking, setMarking] = useState(false);
  const [detail, setDetail]   = useState<NotificationItem | null>(null);

  const unreadCount = items.filter((n) => !n.isRead).length;
  const seenIdsRef  = useRef<Set<string>>(new Set());
  const isFirstLoadRef = useRef(true);

  const load = useCallback(async () => {
    if (!isAuthed) return;
    setLoading(true);
    try {
      const rows = await notificationsApi.list({ limit: 20 });

      // Detect newly arrived notifications (after first load) → single consolidated toast
      if (!isFirstLoadRef.current) {
        const newOnes = rows.filter((n) => !seenIdsRef.current.has(n.id) && !n.isRead);
        if (newOnes.length > 0) {
          const firstTitle = newOnes[0]?.title ?? "";
          const summary = newOnes.length === 1
            ? firstTitle
            : `${firstTitle} และอีก ${newOnes.length - 1} รายการ`;
          toast.message(`${newOnes.length} การแจ้งเตือนใหม่`, {
            id: TOAST_ID,
            description: summary,
            duration: 6000,
            action: {
              label: "ดู",
              onClick: () => {
                toast.dismiss(TOAST_ID);
                setOpen(true);
              },
            },
          });
        }
      }
      // Update seen set
      seenIdsRef.current = new Set(rows.map((n) => n.id));
      isFirstLoadRef.current = false;

      setItems(rows);
    } catch {
      // silent — bell shouldn't break UI
    } finally {
      setLoading(false);
    }
  }, [isAuthed]);

  useEffect(() => {
    if (!isAuthed) {
      seenIdsRef.current = new Set();
      isFirstLoadRef.current = true;
      return;
    }
    load();
    const id = setInterval(load, POLL_MS);

    const onFocus = () => load();
    const onVisibility = () => { if (!document.hidden) load(); };
    const onChange = () => load();

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("notifications-changed", onChange);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("notifications-changed", onChange);
    };
  }, [isAuthed, load]);

  const markOne = async (n: NotificationItem) => {
    if (n.isRead) return;
    setItems((prev) =>
      prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)),
    );
    try {
      await notificationsApi.markRead(n.id);
    } catch {
      setItems((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, isRead: false } : x)),
      );
    }
  };

  const markAll = async () => {
    if (unreadCount === 0) return;
    setMarking(true);
    try {
      await notificationsApi.markAllRead();
      setItems((prev) => prev.map((x) => ({ ...x, isRead: true })));
      toast.success("ทำเครื่องหมายว่าอ่านทั้งหมดแล้ว");
    } catch {
      toast.error("ทำเครื่องหมายไม่สำเร็จ");
    } finally {
      setMarking(false);
    }
  };

  if (!isAuthed) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[400px] p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">การแจ้งเตือน</span>
            {unreadCount > 0 && (
              <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] font-medium text-red-600">
                {unreadCount} ใหม่
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={markAll}
            disabled={marking || unreadCount === 0}
          >
            {marking ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <CheckCheck className="h-3 w-3" />
            )}
            อ่านทั้งหมด
          </Button>
        </div>
        <Separator />

        {/* List */}
        <ScrollArea className="h-[420px]">
          {loading && items.length === 0 ? (
            <div className="flex h-[380px] items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              กำลังโหลด…
            </div>
          ) : items.length === 0 ? (
            <div className="flex h-[380px] flex-col items-center justify-center gap-1 text-sm text-muted-foreground">
              <Bell className="h-6 w-6 opacity-40" />
              <span>ยังไม่มีการแจ้งเตือน</span>
            </div>
          ) : (
            <div className="divide-y">
              {items.map((n) => (
                <NotifRow
                  key={n.id}
                  n={n}
                  onMarkRead={() => markOne(n)}
                  onClose={() => setOpen(false)}
                  onShowDetail={() => { setDetail(n); markOne(n); }}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        <Separator />
        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 text-xs">
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="font-medium text-primary hover:underline"
          >
            ดูทั้งหมด
          </Link>
          <Link
            href="/settings/notifications"
            onClick={() => setOpen(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            ตั้งค่าการแจ้งเตือน
          </Link>
        </div>
      </PopoverContent>

      {/* Detail Modal */}
      <NotificationDetailDialog
        notification={detail}
        onOpenChange={(o) => !o && setDetail(null)}
        onMarkRead={markOne}
      />
    </Popover>
  );
}

function NotifRow({
  n,
  onMarkRead,
  onClose,
  onShowDetail,
}: {
  n: NotificationItem;
  onMarkRead: () => void;
  onClose: () => void;
  onShowDetail: () => void;
}) {
  const meta = prettyTypeRow(n.notifType);
  const hasDeepLink = n.deepLink && n.deepLink !== "/" && n.deepLink !== "";
  const href = hasDeepLink ? n.deepLink! : (n.taskId ? `/task/${n.taskId}` : null);

  const content = (
    <div
      className={cn(
        "group flex flex-col gap-1.5 px-4 py-3 transition-colors hover:bg-muted/40",
        !n.isRead && "bg-primary/5",
      )}
    >
      {/* Top row: type badge + task ID + unread dot */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
            meta.bgClass,
          )}
        >
          {meta.label}
        </span>
        {n.taskDisplayId && (
          <span className="font-mono text-[10px]">{n.taskDisplayId}</span>
        )}
        {!n.isRead && (
          <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-primary" />
        )}
      </div>

      {/* Title */}
      {n.title && (
        <p className="line-clamp-1 text-sm font-medium leading-snug">{n.title}</p>
      )}

      {/* Message preview */}
      {(n.message && n.message !== n.title) && (
        <p className={cn(
          "line-clamp-2 text-xs leading-relaxed text-muted-foreground",
          !n.title && "text-sm text-foreground",
        )}>
          {n.message}
        </p>
      )}

      {/* Bottom row: time + detail button */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-muted-foreground">
          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 gap-1 px-1.5 text-[11px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground hover:bg-muted"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onShowDetail();
          }}
        >
          <Eye className="h-3 w-3" />
          รายละเอียด
        </Button>
      </div>
    </div>
  );

  // Click on the row body → mark read + navigate to deeplink
  // Click on "รายละเอียด" button → opens detail modal (stopPropagation above)
  const handleRowClick = () => {
    onMarkRead();
    if (href) {
      onClose();
    } else {
      onShowDetail();
    }
  };

  if (href) {
    return (
      <Link href={href} onClick={handleRowClick} className="block">
        {content}
      </Link>
    );
  }

  return (
    <div onClick={handleRowClick} className="cursor-pointer">
      {content}
    </div>
  );
}

function prettyTypeRow(t: string): { label: string; bgClass: string } {
  switch (t) {
    case "assigned":           return { label: "งานใหม่",          bgClass: "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-300" };
    case "task_completed":     return { label: "งานเสร็จ",         bgClass: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-300" };
    case "comment_mention":    return { label: "@ คุณ",            bgClass: "bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-950/30 dark:text-fuchsia-300" };
    case "comment_reply":      return { label: "ตอบ comment",     bgClass: "bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-300" };
    case "rework_requested":   return { label: "ส่งกลับแก้ไข",     bgClass: "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-300" };
    case "extension_request":  return { label: "ขอขยายเวลา",      bgClass: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-300" };
    case "extension_approved": return { label: "อนุมัติขยายเวลา", bgClass: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-300" };
    case "extension_rejected": return { label: "ปฏิเสธขยายเวลา",   bgClass: "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-300" };
    case "leave_request":      return { label: "ขอลา",            bgClass: "bg-sky-50 text-sky-600 dark:bg-sky-950/30 dark:text-sky-300" };
    case "leave_approved":     return { label: "อนุมัติลา",        bgClass: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-300" };
    case "leave_rejected":     return { label: "ปฏิเสธลา",         bgClass: "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-300" };
    case "due_reminder":       return { label: "ใกล้กำหนด",        bgClass: "bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-300" };
    case "overdue":            return { label: "เกินกำหนด",        bgClass: "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-300" };
    case "daily_summary":      return { label: "สรุปประจำวัน",     bgClass: "bg-pink-50 text-pink-600 dark:bg-pink-950/30 dark:text-pink-300" };
    case "announcement":       return { label: "ประกาศ",           bgClass: "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-300" };
    default:                   return { label: t,                  bgClass: "bg-muted text-muted-foreground" };
  }
}
