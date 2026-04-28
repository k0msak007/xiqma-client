"use client";

import { useEffect, useState } from "react";
import {
  Sun, Loader2, Save, Play, AlertCircle, Calendar as CalendarIcon, Clock,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { standupsApi, type StandupSettings } from "@/lib/api/standups";
import { useAuthStore } from "@/lib/auth-store";

const DAYS_TH: Array<{ iso: number; label: string; short: string }> = [
  { iso: 1, label: "จันทร์",   short: "จ." },
  { iso: 2, label: "อังคาร",   short: "อ." },
  { iso: 3, label: "พุธ",      short: "พ." },
  { iso: 4, label: "พฤหัสบดี", short: "พฤ." },
  { iso: 5, label: "ศุกร์",    short: "ศ." },
  { iso: 6, label: "เสาร์",    short: "ส." },
  { iso: 7, label: "อาทิตย์",  short: "อา." },
];

export default function StandupSettingsPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";

  const [s, setS] = useState<StandupSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    standupsApi.getSettings()
      .then((row) => setS({ ...row, sendTime: row.sendTime.slice(0, 5) })) // HH:MM
      .catch(() => toast.error("โหลดการตั้งค่าไม่สำเร็จ"))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !s) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const update = <K extends keyof StandupSettings>(key: K, value: StandupSettings[K]) => {
    setS((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const toggleDay = (iso: number) => {
    if (!s) return;
    const has = s.sendDays.includes(iso);
    const next = has ? s.sendDays.filter((d) => d !== iso) : [...s.sendDays, iso].sort();
    if (next.length === 0) return; // must have at least 1 day
    update("sendDays", next);
  };

  const save = async () => {
    if (!isAdmin) return;
    setSaving(true);
    try {
      const updated = await standupsApi.updateSettings({
        enabled:         s.enabled,
        sendTime:        s.sendTime,
        sendDays:        s.sendDays,
        respectWorkDays: s.respectWorkDays,
      });
      setS({ ...updated, sendTime: updated.sendTime.slice(0, 5) });
      toast.success("บันทึกการตั้งค่าสำเร็จ");
    } catch (err: any) {
      toast.error(err?.message ?? "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const runNow = async () => {
    if (!isAdmin) return;
    setRunning(true);
    try {
      const result = await standupsApi.runNow();
      toast.success(
        `Generate: สำเร็จ ${result.generated} · ข้าม ${result.skipped} · พลาด ${result.failed}`,
      );
    } catch (err: any) {
      toast.error(err?.message ?? "trigger ไม่สำเร็จ");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight">
            <Sun className="h-6 w-6 text-orange-500" />
            <span className="bg-gradient-to-r from-orange-500 via-pink-500 to-rose-500 bg-clip-text text-transparent">
              Daily Standup Settings
            </span>
          </h1>
          <p className="mt-1 text-muted-foreground">
            ตั้งเวลา / วันส่ง / นโยบาย AI generate standup ของพนักงาน
          </p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={runNow} disabled={running}>
              {running ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />กำลังรัน...</>
              ) : (
                <><Play className="mr-2 h-4 w-4" />รันเดี๋ยวนี้</>
              )}
            </Button>
            <Button
              onClick={save}
              disabled={saving}
              className="bg-gradient-to-r from-orange-500 via-pink-500 to-rose-500 text-white hover:from-orange-600 hover:via-pink-600 hover:to-rose-600"
            >
              {saving ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />กำลังบันทึก...</>
              ) : (
                <><Save className="mr-2 h-4 w-4" />บันทึก</>
              )}
            </Button>
          </div>
        )}
      </div>

      {!isAdmin && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200/60 bg-amber-50/50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/20 dark:text-amber-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>คุณดูได้แต่แก้ไขไม่ได้ — เฉพาะ admin เท่านั้น</span>
        </div>
      )}

      {/* Master switch */}
      <Card className="relative overflow-hidden border-border/60">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base">เปิดใช้ระบบ</CardTitle>
              <CardDescription>
                ถ้าปิด → cron จะข้ามไม่ generate ใครเลย แต่ผู้ใช้ยังสร้างเองได้จากหน้า Standup
              </CardDescription>
            </div>
            <Switch
              checked={s.enabled}
              onCheckedChange={(v) => update("enabled", !!v)}
              disabled={!isAdmin}
            />
          </div>
        </CardHeader>
      </Card>

      {/* Time */}
      <Card className="relative overflow-hidden border-border/60">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-400 to-indigo-500" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-300">
              <Clock className="h-3.5 w-3.5" />
            </div>
            เวลาส่ง
          </CardTitle>
          <CardDescription>
            cron เช็คทุกต้นชั่วโมง — ถ้าตรงกับชั่วโมงนี้ จะรัน generate ให้ทุกคน (เวลาเขตเอเชีย/กรุงเทพ)
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:max-w-xs">
          <Label className="text-xs">เวลา (HH:MM)</Label>
          <Input
            type="time"
            value={s.sendTime}
            onChange={(e) => update("sendTime", e.target.value)}
            disabled={!isAdmin}
            className="font-mono"
          />
          <p className="text-xs text-muted-foreground">
            แนะนำ 07:00–09:00 — ก่อนเริ่มงานเช้า
          </p>
        </CardContent>
      </Card>

      {/* Send days */}
      <Card className="relative overflow-hidden border-border/60">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 to-fuchsia-500" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300">
              <CalendarIcon className="h-3.5 w-3.5" />
            </div>
            วันที่ส่ง
          </CardTitle>
          <CardDescription>
            เลือกวันที่ระบบจะ generate standup (ระดับองค์กร) — ต้องเลือกอย่างน้อย 1 วัน
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {DAYS_TH.map((d) => {
              const active = s.sendDays.includes(d.iso);
              return (
                <button
                  key={d.iso}
                  type="button"
                  onClick={() => toggleDay(d.iso)}
                  disabled={!isAdmin}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-60",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-muted",
                  )}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Respect work_days */}
      <Card className="relative overflow-hidden border-border/60">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base">เคารพตารางทำงานของแต่ละคน</CardTitle>
              <CardDescription>
                ถ้าเปิด: ระบบจะใช้ <code className="rounded bg-muted px-1">work_days</code> จาก performance config ของแต่ละคน — เช่น Jane ทำ จ–ส, อาทิตย์จะไม่ generate ให้ Jane
                <br />ถ้าปิด: ใช้ "วันที่ส่ง" ด้านบนกับทุกคน
              </CardDescription>
            </div>
            <Switch
              checked={s.respectWorkDays}
              onCheckedChange={(v) => update("respectWorkDays", !!v)}
              disabled={!isAdmin}
            />
          </div>
        </CardHeader>
      </Card>

      {/* How it works */}
      <Card className="border-blue-200/60 bg-blue-50/40 dark:border-blue-500/30 dark:bg-blue-950/15">
        <CardContent className="space-y-1 pt-6 text-xs text-blue-900 dark:text-blue-200">
          <p>📌 <strong>ทำงานยังไง</strong>: cron ทำงานทุกต้นชั่วโมง → เช็คว่าตรงกับเวลา/วันที่ตั้งหรือไม่ → ถ้าตรงค่อย generate</p>
          <p>📌 <strong>ปลอดภัย</strong>: คน 1 คน มี standup ได้แค่ 1 เรคอร์ดต่อวัน — ถ้ารันซ้ำ จะ skip</p>
          <p>📌 <strong>ทดสอบ</strong>: กด <span className="rounded bg-blue-100 px-1.5 dark:bg-blue-900/40">รันเดี๋ยวนี้</span> เพื่อ trigger ทันทีโดยไม่ต้องรอ schedule</p>
        </CardContent>
      </Card>
    </div>
  );
}
