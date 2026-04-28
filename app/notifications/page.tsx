"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  notificationsApi,
  type NotificationItem,
} from "@/lib/api/notifications";
import { toast } from "sonner";
import { NotificationDetailDialog } from "@/components/notification-detail-dialog";

type Filter = "all" | "unread";

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [detail, setDetail] = useState<NotificationItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await notificationsApi.list({
        limit: 100,
        ...(filter === "unread" && { unread: true }),
      });
      setItems(rows);
    } catch {
      toast.error("โหลดการแจ้งเตือนไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const unreadCount = items.filter((n) => !n.isRead).length;

  const notifyChanged = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("notifications-changed"));
    }
  };

  const markOne = async (n: NotificationItem) => {
    if (n.isRead) return;
    setItems((prev) =>
      prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)),
    );
    try {
      await notificationsApi.markRead(n.id);
      notifyChanged();
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
      toast.success("ทำเครื่องหมายว่าอ่านทั้งหมดแล้ว");
      await load();
      notifyChanged();
    } catch {
      toast.error("ทำเครื่องหมายไม่สำเร็จ");
    } finally {
      setMarking(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0
              ? `คุณมี ${unreadCount} การแจ้งเตือนที่ยังไม่ได้อ่าน`
              : "ไม่มีการแจ้งเตือนใหม่"}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={markAll}
          disabled={marking || unreadCount === 0}
          className="gap-2"
        >
          {marking ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCheck className="h-4 w-4" />
          )}
          Mark all as read
        </Button>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader className="border-b py-3">
          <CardTitle className="text-base">Inbox</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : items.length === 0 ? (
            <div className="flex h-[300px] flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
              <Bell className="h-8 w-8 opacity-40" />
              <span>ยังไม่มีการแจ้งเตือน</span>
            </div>
          ) : (
            <div className="divide-y">
              {items.map((n) => (
                <Row
                  key={n.id}
                  n={n}
                  onMark={() => markOne(n)}
                  onShowDetail={() => { setDetail(n); markOne(n); }}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <NotificationDetailDialog
        notification={detail}
        onOpenChange={(o) => !o && setDetail(null)}
        onMarkRead={(n) => markOne(n)}
      />
    </div>
  );
}

function Row({
  n, onMark, onShowDetail,
}: {
  n: NotificationItem;
  onMark: () => void;
  onShowDetail: () => void;
}) {
  const content = (
    <div
      className={cn(
        "flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50",
        !n.isRead && "bg-primary/5",
      )}
      onClick={onMark}
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
          {n.taskTitle && (
            <>
              <span>·</span>
              <span className="truncate">{n.taskTitle}</span>
            </>
          )}
        </div>
        <p className="mt-0.5 text-sm">{n.message ?? "—"}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
        </p>
      </div>
    </div>
  );

  // Routing precedence:
  //   1. meaningful deepLink → navigate
  //   2. taskId → /task/<id>
  //   3. fallback → open detail dialog (instead of dead click)
  const meaningfulDeepLink =
    n.deepLink && n.deepLink !== "/" && n.deepLink !== "";
  if (meaningfulDeepLink) {
    return <Link href={n.deepLink!}>{content}</Link>;
  }
  if (n.taskId) return <Link href={`/task/${n.taskId}`}>{content}</Link>;
  return <div onClick={onShowDetail}>{content}</div>;
}
