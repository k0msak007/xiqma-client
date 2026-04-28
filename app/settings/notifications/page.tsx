"use client";

import { useEffect, useState } from "react";
import {
  Bell, Loader2, Save, Smartphone, Mail, Monitor, Moon,
  Link2, Copy, CheckCircle2, Send, Unlink, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { notificationsApi, type NotificationPref } from "@/lib/api/notifications";
import { lineApi, type LineLinkStatus, type LineLinkToken } from "@/lib/api/line";

// Display order + Thai labels
const EVENTS: Array<{ key: string; label: string; group: "งาน" | "Comment" | "Extension/Leave" | "อื่นๆ" }> = [
  { key: "assigned",           label: "งานใหม่ (assign ให้คุณ)",      group: "งาน" },
  { key: "task_completed",     label: "งานเสร็จ",                       group: "งาน" },
  { key: "due_reminder",       label: "ใกล้กำหนด (24 ชม.)",            group: "งาน" },
  { key: "overdue",            label: "เกินกำหนด",                      group: "งาน" },
  { key: "rework_requested",   label: "ส่งกลับแก้ไข",                  group: "งาน" },
  { key: "comment_mention",    label: "@ คุณใน comment",                group: "Comment" },
  { key: "comment_reply",      label: "Comment ใหม่ในงานที่คุณคอมเมนต์", group: "Comment" },
  { key: "extension_request",  label: "ขอขยายเวลา (สำหรับผู้อนุมัติ)",  group: "Extension/Leave" },
  { key: "extension_approved", label: "อนุมัติขยายเวลา",                group: "Extension/Leave" },
  { key: "extension_rejected", label: "ปฏิเสธขยายเวลา",                 group: "Extension/Leave" },
  { key: "leave_request",      label: "ขอลา (สำหรับผู้อนุมัติ)",        group: "Extension/Leave" },
  { key: "leave_approved",     label: "อนุมัติลา",                       group: "Extension/Leave" },
  { key: "leave_rejected",     label: "ปฏิเสธลา",                        group: "Extension/Leave" },
  { key: "daily_summary",      label: "สรุปประจำวัน",                   group: "อื่นๆ" },
  { key: "announcement",       label: "ประกาศจากองค์กร",                group: "อื่นๆ" },
];

const CHANNELS: Array<{ key: "in_app" | "line" | "email"; label: string; icon: React.ComponentType<{ className?: string }>; note?: string }> = [
  { key: "in_app", label: "In-app",  icon: Monitor,    note: "ในแอป (Bell)" },
  { key: "line",   label: "LINE",    icon: Smartphone, note: "ต้อง link LINE ก่อน" },
  { key: "email",  label: "Email",   icon: Mail },
];

type PrefMap = Record<string, Record<string, boolean>>; // [eventType][channel] = enabled

function toMap(prefs: NotificationPref[]): PrefMap {
  const m: PrefMap = {};
  for (const p of prefs) {
    if (!m[p.eventType]) m[p.eventType] = {};
    m[p.eventType]![p.channel] = p.enabled;
  }
  return m;
}

function diff(orig: PrefMap, cur: PrefMap): NotificationPref[] {
  const out: NotificationPref[] = [];
  for (const ev of Object.keys(cur)) {
    for (const ch of Object.keys(cur[ev]!)) {
      const before = orig[ev]?.[ch] ?? false;
      const after  = cur[ev]![ch]!;
      if (before !== after) out.push({ eventType: ev, channel: ch as any, enabled: after });
    }
  }
  return out;
}

export default function NotificationSettingsPage() {
  const [prefs, setPrefs] = useState<PrefMap>({});
  const [original, setOriginal] = useState<PrefMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);

  // Quiet hours
  const [qhStart, setQhStart] = useState("22:00");
  const [qhEnd, setQhEnd]     = useState("08:00");
  const [qhOriginal, setQhOriginal] = useState({ start: "22:00", end: "08:00" });

  // LINE link
  const [lineStatus, setLineStatus] = useState<LineLinkStatus | null>(null);
  const [lineToken, setLineToken]   = useState<LineLinkToken | null>(null);
  const [lineBusy, setLineBusy]     = useState(false);

  const refreshLineStatus = () => {
    lineApi.status().then(setLineStatus).catch(() => setLineStatus(null));
  };

  useEffect(() => {
    refreshLineStatus();
  }, []);

  useEffect(() => {
    Promise.all([
      notificationsApi.getPrefs(),
      notificationsApi.getQuietHours(),
    ])
      .then(([list, qh]) => {
        const m = toMap(list);
        setPrefs(m);
        setOriginal(JSON.parse(JSON.stringify(m)));
        if (qh) {
          const s = qh.start.slice(0, 5);
          const e = qh.end.slice(0, 5);
          setQhStart(s); setQhEnd(e);
          setQhOriginal({ start: s, end: e });
        }
      })
      .catch(() => toast.error("โหลดการตั้งค่าไม่สำเร็จ"))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (event: string, channel: string, value: boolean) => {
    setPrefs((prev) => ({
      ...prev,
      [event]: { ...(prev[event] ?? {}), [channel]: value },
    }));
  };

  const dirty = diff(original, prefs);
  const qhDirty = qhStart !== qhOriginal.start || qhEnd !== qhOriginal.end;
  const hasChanges = dirty.length > 0 || qhDirty;

  const save = async () => {
    if (!hasChanges) return;
    setSaving(true);
    try {
      if (dirty.length > 0) {
        await notificationsApi.updatePrefs(dirty);
        setOriginal(JSON.parse(JSON.stringify(prefs)));
      }
      if (qhDirty) {
        await notificationsApi.setQuietHours(qhStart, qhEnd);
        setQhOriginal({ start: qhStart, end: qhEnd });
      }
      toast.success("บันทึกการตั้งค่าสำเร็จ");
    } catch (err: any) {
      toast.error(err?.message ?? "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  // ── LINE actions ───────────────────────────────────────────────────────────
  const generateLineToken = async () => {
    setLineBusy(true);
    try {
      const t = await lineApi.createLinkToken();
      setLineToken(t);
    } catch (err: any) {
      toast.error(err?.message ?? "สร้างรหัสไม่สำเร็จ");
    } finally {
      setLineBusy(false);
    }
  };

  const copyLineToken = () => {
    if (!lineToken) return;
    navigator.clipboard.writeText(lineToken.token).then(() => {
      toast.success("คัดลอกรหัสแล้ว");
    });
  };

  const unlinkLine = async () => {
    setLineBusy(true);
    try {
      await lineApi.unlink();
      setLineStatus({ linked: false, lineUserId: null, verifiedAt: null });
      setLineToken(null);
      toast.success("ยกเลิกการผูก LINE สำเร็จ");
    } catch (err: any) {
      toast.error(err?.message ?? "ยกเลิกไม่สำเร็จ");
    } finally {
      setLineBusy(false);
    }
  };

  const testLine = async () => {
    setLineBusy(true);
    try {
      await lineApi.test();
      toast.success("ส่งข้อความทดสอบไปที่ LINE แล้ว — กรุณาเช็ค");
    } catch (err: any) {
      toast.error(err?.message ?? "ส่งทดสอบไม่สำเร็จ");
    } finally {
      setLineBusy(false);
    }
  };

  // Group events for display
  const grouped = EVENTS.reduce<Record<string, typeof EVENTS>>((acc, e) => {
    (acc[e.group] ??= []).push(e);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight">
            <Bell className="h-6 w-6 text-primary" />
            <span className="bg-gradient-to-r from-orange-500 via-pink-500 to-rose-500 bg-clip-text text-transparent">
              การแจ้งเตือน
            </span>
          </h1>
          <p className="mt-1 text-muted-foreground">
            เลือกช่องทางสำหรับแต่ละ event และตั้งช่วงเงียบของคุณ
          </p>
        </div>
        <Button
          onClick={save}
          disabled={!hasChanges || saving}
          className="bg-gradient-to-r from-orange-500 via-pink-500 to-rose-500 text-white hover:from-orange-600 hover:via-pink-600 hover:to-rose-600"
        >
          {saving ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />กำลังบันทึก...</>
          ) : (
            <><Save className="mr-2 h-4 w-4" />บันทึก{hasChanges ? ` (${dirty.length + (qhDirty ? 1 : 0)})` : ""}</>
          )}
        </Button>
      </div>

      {/* Quiet hours */}
      <Card className="relative overflow-hidden border-border/60">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-400 to-violet-500" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300">
              <Moon className="h-3.5 w-3.5" />
            </div>
            ช่วงเงียบ (Quiet hours)
          </CardTitle>
          <CardDescription>
            ในช่วงนี้จะไม่ส่ง LINE / Email — Bell ในแอปยังทำงานปกติ
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">เริ่ม</Label>
            <Input
              type="time"
              value={qhStart}
              onChange={(e) => setQhStart(e.target.value)}
              className="font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">ถึง</Label>
            <Input
              type="time"
              value={qhEnd}
              onChange={(e) => setQhEnd(e.target.value)}
              className="font-mono"
            />
          </div>
        </CardContent>
      </Card>

      {/* Events × Channels matrix */}
      {Object.entries(grouped).map(([group, events]) => (
        <Card key={group} className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {group}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Column header */}
            <div className="grid grid-cols-[1fr_repeat(3,minmax(72px,80px))] items-center gap-2 border-b px-4 py-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              <div>Event</div>
              {CHANNELS.map((c) => {
                const Icon = c.icon;
                return (
                  <div key={c.key} className="flex flex-col items-center gap-0.5">
                    <Icon className="h-3.5 w-3.5" />
                    <span className="text-[10px]">{c.label}</span>
                  </div>
                );
              })}
            </div>

            {events.map((ev) => (
              <div
                key={ev.key}
                className="grid grid-cols-[1fr_repeat(3,minmax(72px,80px))] items-center gap-2 border-b px-4 py-2.5 text-sm last:border-b-0 hover:bg-muted/30"
              >
                <div className="truncate">{ev.label}</div>
                {CHANNELS.map((c) => (
                  <div key={c.key} className="flex justify-center">
                    <Switch
                      checked={prefs[ev.key]?.[c.key] ?? false}
                      onCheckedChange={(v) => toggle(ev.key, c.key, !!v)}
                    />
                  </div>
                ))}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* LINE Account linking */}
      <Card className="relative overflow-hidden border-border/60">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-green-400 to-emerald-500" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-300">
              <Smartphone className="h-3.5 w-3.5" />
            </div>
            ผูกบัญชี LINE
            {lineStatus?.linked && (
              <Badge className="border-0 bg-emerald-100 text-[10px] text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                <CheckCircle2 className="mr-0.5 h-2.5 w-2.5" />
                ผูกแล้ว
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            รับการแจ้งเตือนของ Xiqma ผ่าน LINE — ต้องผูกบัญชีก่อนเปิด channel "LINE" ในตารางด้านล่าง
          </CardDescription>
        </CardHeader>
        <CardContent>
          {lineStatus?.linked ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>ผูกบัญชี LINE เรียบร้อย</span>
                  {lineStatus.verifiedAt && (
                    <span className="text-xs text-muted-foreground">
                      · ตั้งแต่ {new Date(lineStatus.verifiedAt).toLocaleDateString("th-TH")}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={testLine} disabled={lineBusy}>
                  <Send className="mr-1.5 h-3.5 w-3.5" />
                  ส่งข้อความทดสอบ
                </Button>
                <Button variant="outline" size="sm" onClick={unlinkLine} disabled={lineBusy}>
                  <Unlink className="mr-1.5 h-3.5 w-3.5" />
                  ยกเลิกการผูก
                </Button>
              </div>
            </div>
          ) : lineToken ? (
            <div className="space-y-3">
              {/* Token + instructions */}
              <div className="rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-4">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">รหัสผูกบัญชี (อายุ 10 นาที)</div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div className="font-mono text-3xl font-bold tracking-widest text-primary">
                    {lineToken.token}
                  </div>
                  <Button variant="outline" size="sm" onClick={copyLineToken}>
                    <Copy className="mr-1.5 h-3.5 w-3.5" />
                    คัดลอก
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="font-medium">ขั้นตอน:</div>
                <ol className="ml-5 list-decimal space-y-1 text-xs text-muted-foreground">
                  <li>เปิด LINE → ค้นหา <code className="rounded bg-muted px-1 font-mono">{lineToken.botBasicId ?? "@xiqma"}</code> หรือสแกน QR ที่ admin ให้</li>
                  <li>กด "เพิ่มเพื่อน"</li>
                  <li>ส่งรหัส 6 หลักด้านบนเข้าไปใน chat</li>
                  <li>รอบอตตอบกลับ "✅ ผูกบัญชีสำเร็จ" — เสร็จ!</li>
                </ol>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setLineToken(null); refreshLineStatus(); }}>
                ผูกแล้ว / refresh
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                ยังไม่ได้ผูกบัญชี — กดปุ่มด้านล่างเพื่อรับรหัสผูกบัญชี
              </p>
              <Button
                onClick={generateLineToken}
                disabled={lineBusy}
                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600"
              >
                {lineBusy ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />กำลังสร้าง...</>
                ) : (
                  <><Link2 className="mr-2 h-4 w-4" />ผูก LINE</>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Channel availability hint */}
      <Card className="border-amber-200/60 bg-amber-50/40 dark:border-amber-500/30 dark:bg-amber-950/15">
        <CardContent className="flex flex-col gap-2 pt-6 text-xs text-amber-900 dark:text-amber-200">
          <p className="flex items-start gap-1.5">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>หลังผูก LINE แล้ว อย่าลืมเปิด toggle channel "LINE" ของ event ที่ต้องการในตารางด้านล่าง</span>
          </p>
          <p>📌 <strong>Email:</strong> Phase 2.4c — เร็วๆ นี้</p>
          <p>📌 <strong>Quiet hours</strong>: ใช้กับ LINE/Email เท่านั้น — bell ในแอปยังทำงานปกติ</p>
        </CardContent>
      </Card>
    </div>
  );
}
