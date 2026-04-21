"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
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

const POLL_MS = 60_000;

export function NotificationsBell() {
  const isAuthed = useAuthStore((s) => !!s.user);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [marking, setMarking] = useState(false);

  const unreadCount = items.filter((n) => !n.isRead).length;

  const load = useCallback(async () => {
    if (!isAuthed) return;
    setLoading(true);
    try {
      const rows = await notificationsApi.list({ limit: 20 });
      setItems(rows);
    } catch {
      // silent — bell shouldn't break UI
    } finally {
      setLoading(false);
    }
  }, [isAuthed]);

  useEffect(() => {
    if (!isAuthed) return;
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [isAuthed, load]);

  const markOne = async (n: NotificationItem) => {
    if (n.isRead) return;
    setItems((prev) =>
      prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)),
    );
    try {
      await notificationsApi.markRead(n.id);
    } catch {
      // revert on error
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

      <PopoverContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] font-medium text-red-600">
                {unreadCount} new
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
            Mark all read
          </Button>
        </div>
        <Separator />

        <ScrollArea className="h-[360px]">
          {loading && items.length === 0 ? (
            <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : items.length === 0 ? (
            <div className="flex h-[320px] flex-col items-center justify-center gap-1 text-sm text-muted-foreground">
              <Bell className="h-6 w-6 opacity-40" />
              <span>ยังไม่มีการแจ้งเตือน</span>
            </div>
          ) : (
            <div className="divide-y">
              {items.map((n) => (
                <NotifRow key={n.id} n={n} onClick={() => markOne(n)} onClose={() => setOpen(false)} />
              ))}
            </div>
          )}
        </ScrollArea>

        <Separator />
        <div className="px-3 py-2">
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="block w-full text-center text-xs font-medium text-primary hover:underline"
          >
            View all notifications
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function NotifRow({
  n,
  onClick,
  onClose,
}: {
  n: NotificationItem;
  onClick: () => void;
  onClose: () => void;
}) {
  const body = (
    <div
      className={cn(
        "flex cursor-pointer gap-3 px-3 py-3 transition-colors hover:bg-muted/50",
        !n.isRead && "bg-primary/5",
      )}
      onClick={onClick}
    >
      <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full">
        {!n.isRead && <span className="block h-2 w-2 rounded-full bg-primary" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="font-medium text-foreground/70">{n.notifType}</span>
          {n.taskDisplayId && (
            <>
              <span>·</span>
              <span className="font-mono">{n.taskDisplayId}</span>
            </>
          )}
        </div>
        <p className="mt-0.5 line-clamp-2 text-sm">
          {n.message ?? n.taskTitle ?? "—"}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
        </p>
      </div>
    </div>
  );

  if (n.taskId) {
    return (
      <Link href={`/task/${n.taskId}`} onClick={onClose}>
        {body}
      </Link>
    );
  }
  return body;
}
