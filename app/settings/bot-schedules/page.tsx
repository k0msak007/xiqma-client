"use client";

import { useEffect, useState } from "react";
import {
  Bot, Loader2, Plus, Pencil, Trash2, Play, AlertCircle,
  Sparkles, Clock, Calendar as CalendarIcon, Users, Sun, ChevronDown, X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/auth-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { botSchedulesApi, type BotSchedule, type BotScheduleInput } from "@/lib/api/bot-schedules";
import { rolesApi, type Role } from "@/lib/api/roles";
import { employeesApi, type Employee } from "@/lib/api/employees";

const DAYS_TH: Array<{ iso: number; label: string }> = [
  { iso: 1, label: "จันทร์" },  { iso: 2, label: "อังคาร" },  { iso: 3, label: "พุธ" },
  { iso: 4, label: "พฤหัสบดี" }, { iso: 5, label: "ศุกร์" },  { iso: 6, label: "เสาร์" },
  { iso: 7, label: "อาทิตย์" },
];

const CONTEXT_KINDS: Array<{ value: BotSchedule["contextKind"]; label: string; hint: string; detail: string }> = [
  { value: "today",              label: "วันนี้",           hint: "ข้อมูลของวันนี้",                       detail: "Query tasks + time sessions วันนี้: จำนวนงานค้าง/เสร็จ, ชั่วโมงที่ log, งานเกินกำหนด (ตัวเลข)" },
  { value: "yesterday",          label: "เมื่อวาน",        hint: "ข้อมูลของเมื่อวาน",                    detail: "Query tasks + time sessions เมื่อวาน: เหมือน today แต่ย้อนหลัง 1 วัน" },
  { value: "week",               label: "สัปดาห์",         hint: "ข้อมูลย้อนหลัง 7 วัน",                 detail: "Query tasks + time sessions 7 วัน: จำนวนงานปิด, ชั่วโมงรวม, งานเกินกำหนด (ตัวเลข)" },
  { value: "morning_briefing",   label: "สรุปงานเช้า",     hint: "รายชื่องานใกล้กำหนด",                 detail: "Query tasks: งานเกินกำหนด, งานครบวันนี้, งานครบใน 3 วัน — แสดง display_id, title, deadline" },
  { value: "leave_reminder",     label: "เตือนวันลา",      hint: "วันลาทีม + โควต้า + รออนุมัติ",        detail: "Query leave_requests + employees + leave_quotas: ใครลาวันนี้/พรุ่งนี้/7วัน, โควต้าคงเหลือของแต่ละคน, ใบลารออนุมัติ (สำหรับหัวหน้า)" },
  { value: "time_reminder",      label: "เตือน log time",  hint: "ใครยังไม่ได้ log time",                detail: "Query task_time_sessions: log แล้วกี่ชม.วันนี้ หรือยังไม่ได้ log เลย — per employee" },
  { value: "none",               label: "ไม่ใช้ข้อมูล",    hint: "ไม่ query อะไรเลย",                    detail: "ส่งข้อความตรงตาม template — ไม่มีข้อมูลจาก DB ใดๆ" },
];

const blankInput: BotScheduleInput = {
  name:            "",
  description:     "",
  enabled:         true,
  sendTime:        "08:00",
  sendDays:        [1, 2, 3, 4, 5],
  sendDayOfMonth:  null,
  audienceType:    "all",
  audienceValues:  [],
  respectWorkDays: true,
  mode:            "ai",
  titleTemplate:   "🤖 ข้อความถึงคุณ {{name}}",
  bodyTemplate:    "เขียนข้อความสั้น ๆ ให้กำลังใจพนักงานคนนี้สำหรับวัน{{weekday}} ใช้ข้อมูลถ้าจำเป็น",
  contextKind:     "today",
  channels:        ["in_app"],
  notifType:       "daily_summary",
  deepLink:        "/",
};

interface MultiSelectOption {
  value: string;
  label: string;
  color?: string;
}

function MultiSelectPopover({
  options,
  selected,
  onChange,
  disabled,
  placeholder,
}: {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (vals: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);

  const toggle = (val: string) => {
    if (selected.includes(val)) {
      onChange(selected.filter((v) => v !== val));
    } else {
      onChange([...selected, val]);
    }
  };

  const remove = (val: string) => {
    onChange(selected.filter((v) => v !== val));
  };

  const selectedLabels = selected
    .map((v) => options.find((o) => o.value === v)?.label ?? v)
    .join(", ");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className="flex w-full items-center justify-between gap-1 rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className={selected.length === 0 ? "text-muted-foreground" : ""}>
            {selected.length === 0 ? placeholder ?? "เลือก..." : `${selected.length} รายการ`}
          </span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[260px] p-0" side="bottom" sideOffset={4}>
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-1 border-b px-2.5 py-2">
            {selected.map((val) => {
              const opt = options.find((o) => o.value === val);
              return (
                <span
                  key={val}
                  className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[11px]"
                >
                  {opt?.label ?? val}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); remove(val); }}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              );
            })}
          </div>
        )}
        <ScrollArea className="max-h-48">
          <div className="p-1">
            {options.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-muted-foreground">ไม่มีข้อมูล</div>
            ) : (
              options.map((opt) => {
                const checked = selected.includes(opt.value);
                return (
                  <label
                    key={opt.value}
                    className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-xs hover:bg-accent"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggle(opt.value)}
                      disabled={disabled}
                    />
                    {opt.color && (
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: opt.color }} />
                    )}
                    <span className="truncate">{opt.label}</span>
                  </label>
                );
              })
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

export default function BotSchedulesPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";

  const [list, setList]       = useState<BotSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState<BotSchedule | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm]       = useState<BotScheduleInput>(blankInput);
  const [saving, setSaving]   = useState(false);
  const [running, setRunning] = useState<string | null>(null);

  // Audience dropdown sources
  const [roles, setRoles] = useState<Role[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Load roles + employees on first dialog open (and cache)
  useEffect(() => {
    if (!creating) return;
    if (roles.length === 0) {
      rolesApi.list().then(setRoles).catch(() => {});
    }
    if (employees.length === 0) {
      employeesApi.listAll()
        .then((emps) => setEmployees(emps.filter((e) => (e as any).isActive ?? true)))
        .catch(() => {});
    }
  }, [creating, roles.length, employees.length]);

  const reload = () => {
    setLoading(true);
    botSchedulesApi.list()
      .then(setList)
      .catch(() => toast.error("โหลดไม่สำเร็จ"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { reload(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...blankInput });
    setCreating(true);
  };

  const openEdit = (s: BotSchedule) => {
    setEditing(s);
    setForm({
      ...s,
      sendTime:       s.sendTime.slice(0, 5),
      audienceValues: s.audienceValues ?? [],
      description:    s.description ?? "",
      deepLink:       s.deepLink ?? "/",
    });
    setCreating(true);
  };

  const closeDialog = () => {
    setCreating(false);
    setEditing(null);
  };

  const save = async () => {
    if (!isAdmin) return;
    if (!form.name.trim()) { toast.error("กรุณาตั้งชื่อ"); return; }
    setSaving(true);
    try {
      const payload: BotScheduleInput = {
        ...form,
        audienceValues: form.audienceType === "all" ? [] : form.audienceValues,
        description:    form.description?.trim() || null,
      };
      if (editing) {
        await botSchedulesApi.update(editing.id, payload);
        toast.success("บันทึกสำเร็จ");
      } else {
        await botSchedulesApi.create(payload);
        toast.success("สร้างสำเร็จ");
      }
      closeDialog();
      reload();
    } catch (err: any) {
      toast.error(err?.message ?? "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (s: BotSchedule) => {
    if (!isAdmin) return;
    if (!confirm(`ลบ "${s.name}"?`)) return;
    try {
      await botSchedulesApi.remove(s.id);
      toast.success("ลบสำเร็จ");
      reload();
    } catch (err: any) {
      toast.error(err?.message ?? "ลบไม่สำเร็จ");
    }
  };

  const runNow = async (s: BotSchedule) => {
    if (!isAdmin) return;
    setRunning(s.id);
    try {
      const result = await botSchedulesApi.runNow(s.id);
      toast.success(`Trigger สำเร็จ: ส่ง ${result.recipients} คน · พลาด ${result.failed}`);
    } catch (err: any) {
      toast.error(err?.message ?? "trigger ไม่สำเร็จ");
    } finally {
      setRunning(null);
    }
  };

  const toggleDay = (iso: number) => {
    const has = form.sendDays.includes(iso);
    const next = has ? form.sendDays.filter((d) => d !== iso) : [...form.sendDays, iso].sort();
    if (next.length === 0) return;
    setForm({ ...form, sendDays: next });
  };

  const toggleChannel = (ch: string) => {
    const has = form.channels.includes(ch);
    const next = has ? form.channels.filter((c) => c !== ch) : [...form.channels, ch];
    if (next.length === 0) return;
    setForm({ ...form, channels: next as any });
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight">
            <Bot className="h-7 w-7 text-violet-500" />
            <span className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-rose-500 bg-clip-text text-transparent">
              Bot Schedules
            </span>
          </h1>
          <p className="mt-1 text-muted-foreground">
            ตั้งข้อความ bot ส่งให้พนักงานเป็นรอบ — daily summary / weekly recap / reminder ฯลฯ
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={openCreate}
            className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-rose-500 text-white hover:from-violet-600 hover:via-fuchsia-600 hover:to-rose-600"
          >
            <Plus className="mr-2 h-4 w-4" />
            สร้างใหม่
          </Button>
        )}
      </div>

      {!isAdmin && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200/60 bg-amber-50/50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/20 dark:text-amber-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>คุณดูได้ — แก้ไขได้เฉพาะ admin</span>
        </div>
      )}

      {loading ? (
        <Card className="border-border/60">
          <CardContent className="flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : list.length === 0 ? (
        <Card className="border-border/60">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            ยังไม่มี schedule — กด "สร้างใหม่" เพื่อเริ่ม
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {list.map((s) => (
            <Card key={s.id} className="relative overflow-hidden border-border/60">
              <div className={cn("absolute inset-x-0 top-0 h-1", s.enabled ? "bg-gradient-to-r from-emerald-400 to-teal-500" : "bg-muted")} />
              <CardContent className="flex flex-col gap-3 pt-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-semibold">{s.name}</span>
                    {!s.enabled && <Badge variant="secondary" className="text-[10px]">ปิดอยู่</Badge>}
                    {s.mode === "ai" && (
                      <Badge className="border-0 bg-violet-100 text-[10px] text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
                        <Sparkles className="mr-0.5 h-2.5 w-2.5" /> AI
                      </Badge>
                    )}
                    {s.mode === "static" && (
                      <Badge variant="outline" className="text-[10px]">Static</Badge>
                    )}
                  </div>
                  {s.description && (
                    <p className="text-xs text-muted-foreground">{s.description}</p>
                  )}
                  <div className="flex flex-wrap gap-3 pt-1 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {s.sendTime.slice(0,5)}</span>
                    <span className="inline-flex items-center gap-1"><CalendarIcon className="h-3 w-3" />
                      {s.sendDays.map((d) => DAYS_TH.find((x) => x.iso === d)?.label.slice(0,3)).join(" ")}
                      {s.sendDayOfMonth ? ` · ทุกวันที่ ${s.sendDayOfMonth}` : ""}
                    </span>
                    <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />
                      {s.audienceType === "all"
                        ? "ทุกคน"
                        : s.audienceType === "role"
                          ? `role: ${s.audienceValues?.join(", ") || "—"}`
                          : s.audienceType === "employee"
                            ? `${s.audienceValues?.length || 0} คน`
                            : "ทุกคน"}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      📡 {s.channels.join(" · ")}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {isAdmin && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => runNow(s)} disabled={running === s.id}>
                        {running === s.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <><Play className="mr-1 h-3.5 w-3.5" />รันเลย</>
                        )}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(s)} title="แก้ไข">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => remove(s)} title="ลบ" className="text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Create/Edit Dialog ── */}
      <Dialog open={creating} onOpenChange={(v) => !v && closeDialog()}>
        <DialogContent className="flex h-[90vh] max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-violet-600" />
              {editing ? "แก้ไข Bot Schedule" : "สร้าง Bot Schedule ใหม่"}
            </DialogTitle>
            <DialogDescription>
              ใช้ตัวแปรในข้อความ: <code className="rounded bg-muted px-1 text-[10px]">{"{{name}}"}</code>{" "}
              <code className="rounded bg-muted px-1 text-[10px]">{"{{date}}"}</code>{" "}
              <code className="rounded bg-muted px-1 text-[10px]">{"{{weekday}}"}</code>{" "}
              <code className="rounded bg-muted px-1 text-[10px]">{"{{todayCompleted}}"}</code>{" "}
              <code className="rounded bg-muted px-1 text-[10px]">{"{{todayHours}}"}</code>{" "}
              <code className="rounded bg-muted px-1 text-[10px]">{"{{overdue}}"}</code>
              <br />
              <span className="text-[10px]">morning_briefing เพิ่ม: </span>
              <code className="rounded bg-muted px-1 text-[10px]">{"{{overdueList}}"}</code>{" "}
              <code className="rounded bg-muted px-1 text-[10px]">{"{{dueTodayList}}"}</code>{" "}
              <code className="rounded bg-muted px-1 text-[10px]">{"{{dueSoonList}}"}</code>
              <br />
              <span className="text-[10px]">leave_reminder เพิ่ม: </span>
              <code className="rounded bg-muted px-1 text-[10px]">{"{{leaveToday}}"}</code>{" "}
              <code className="rounded bg-muted px-1 text-[10px]">{"{{leaveQuota}}"}</code>{" "}
              <code className="rounded bg-muted px-1 text-[10px]">{"{{pendingLeaves}}"}</code>
              <br />
              <span className="text-[10px]">time_reminder เพิ่ม: </span>
              <code className="rounded bg-muted px-1 text-[10px]">{"{{timeLogged}}"}</code>{" "}
              <code className="rounded bg-muted px-1 text-[10px]">{"{{timeMissing}}"}</code>
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
            {/* Name + enabled */}
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <div className="space-y-1.5">
                <Label className="text-xs">ชื่อ *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} disabled={!isAdmin} />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.enabled}
                  onCheckedChange={(v) => setForm({ ...form, enabled: !!v })}
                  disabled={!isAdmin}
                />
                <Label className="text-xs">เปิดใช้</Label>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">คำอธิบาย (optional)</Label>
              <Input value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} disabled={!isAdmin} />
            </div>

            {/* Schedule */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">เวลา</Label>
                <Input type="time" value={form.sendTime} onChange={(e) => setForm({ ...form, sendTime: e.target.value })} disabled={!isAdmin} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">เฉพาะวันที่ของเดือน (1–31, optional)</Label>
                <Input
                  type="number" min="1" max="31"
                  value={form.sendDayOfMonth ?? ""}
                  onChange={(e) => setForm({ ...form, sendDayOfMonth: e.target.value ? Number(e.target.value) : null })}
                  disabled={!isAdmin}
                  placeholder="ทุกวัน"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">วันที่ส่ง</Label>
              <div className="flex flex-wrap gap-1.5">
                {DAYS_TH.map((d) => {
                  const active = form.sendDays.includes(d.iso);
                  return (
                    <button
                      key={d.iso}
                      type="button"
                      onClick={() => toggleDay(d.iso)}
                      disabled={!isAdmin}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs transition disabled:cursor-not-allowed disabled:opacity-50",
                        active ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted",
                      )}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Audience */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">ส่งให้ใคร</Label>
                <Select
                  value={form.audienceType}
                  onValueChange={(v) => setForm({ ...form, audienceType: v as any, audienceValues: [] })}
                  disabled={!isAdmin}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทุกคน</SelectItem>
                    <SelectItem value="role">เฉพาะ role</SelectItem>
                    <SelectItem value="employee">เฉพาะคน</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.audienceType !== "all" && (
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    {form.audienceType === "role" ? "เลือก role" : "เลือกพนักงาน"}
                    {form.audienceValues.length > 0 && (
                      <span className="ml-1 text-primary">({form.audienceValues.length})</span>
                    )}
                  </Label>
                  <MultiSelectPopover
                    options={
                      form.audienceType === "role"
                        ? roles.map((r) => ({ value: r.name, label: r.name, color: r.color }))
                        : employees.map((e) => ({
                            value: e.id,
                            label: `${e.name}${(e as any).employeeCode ? ` (${(e as any).employeeCode})` : ""}`,
                          }))
                    }
                    selected={form.audienceValues}
                    onChange={(vals) => setForm({ ...form, audienceValues: vals })}
                    disabled={!isAdmin}
                    placeholder={
                      form.audienceType === "role"
                        ? roles.length === 0 ? "กำลังโหลด..." : "เลือก role..."
                        : employees.length === 0 ? "กำลังโหลด..." : "เลือกพนักงาน..."
                    }
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={form.respectWorkDays}
                onCheckedChange={(v) => setForm({ ...form, respectWorkDays: !!v })}
                disabled={!isAdmin}
              />
              <Label className="text-xs">เคารพ <code>work_days</code> ของแต่ละคน (ข้ามถ้าวันนี้ไม่ใช่วันทำงานของเขา)</Label>
            </div>

            {/* Mode + Context */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">โหมด</Label>
                <Select value={form.mode} onValueChange={(v) => setForm({ ...form, mode: v as any })} disabled={!isAdmin}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ai">AI (LLM generate ข้อความ)</SelectItem>
                    <SelectItem value="static">Static (ใช้ template ตรง ๆ)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">บริบท (สำหรับ AI หรือใส่ตัวแปร)</Label>
                <Select value={form.contextKind} onValueChange={(v) => setForm({ ...form, contextKind: v as any })} disabled={!isAdmin}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CONTEXT_KINDS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        <span className="font-medium">{c.label}</span>
                        <span className="ml-2 text-[10px] text-muted-foreground">— {c.hint}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Live description of selected context */}
                {(() => {
                  const selected = CONTEXT_KINDS.find((c) => c.value === form.contextKind);
                  return selected ? (
                    <p className="text-[10px] leading-relaxed text-muted-foreground">
                      <span className="font-medium text-foreground/60">📂 Query: </span>
                      {selected.detail}
                    </p>
                  ) : null;
                })()}
              </div>
            </div>

            {/* Title + body */}
            <div className="space-y-1.5">
              <Label className="text-xs">หัวข้อ (template)</Label>
              <Input
                value={form.titleTemplate}
                onChange={(e) => setForm({ ...form, titleTemplate: e.target.value })}
                disabled={!isAdmin}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">
                {form.mode === "ai" ? "Prompt สำหรับ AI" : "ข้อความ (template)"}
              </Label>
              <Textarea
                rows={6}
                value={form.bodyTemplate}
                onChange={(e) => setForm({ ...form, bodyTemplate: e.target.value })}
                disabled={!isAdmin}
                className="font-mono text-sm"
              />
            </div>

            {/* Channels */}
            <div className="space-y-1.5">
              <Label className="text-xs">ช่องทาง</Label>
              <div className="flex gap-2">
                {(["in_app","line","email"] as const).map((ch) => {
                  const active = form.channels.includes(ch);
                  return (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => toggleChannel(ch)}
                      disabled={!isAdmin}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs transition disabled:cursor-not-allowed disabled:opacity-50",
                        active ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted",
                      )}
                    >
                      {ch}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-muted-foreground">
                Channel ที่นี่จำกัดเฉพาะ schedule นี้ — ผู้ใช้แต่ละคนยังต้องเปิด channel เดียวกันนี้ใน Settings ของตัวเอง
              </p>
            </div>

            {/* Deep link */}
            <div className="space-y-1.5">
              <Label className="text-xs">Deep link เมื่อกดในแอป</Label>
              <Input
                value={form.deepLink ?? "/"}
                onChange={(e) => setForm({ ...form, deepLink: e.target.value })}
                disabled={!isAdmin}
                placeholder="/"
              />
            </div>
          </div>

          <DialogFooter className="border-t px-6 py-3">
            <Button variant="outline" onClick={closeDialog} disabled={saving}>ยกเลิก</Button>
            {isAdmin && (
              <Button
                onClick={save}
                disabled={saving}
                className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-rose-500 text-white hover:from-violet-600 hover:via-fuchsia-600 hover:to-rose-600"
              >
                {saving ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />กำลังบันทึก...</>
                ) : (
                  editing ? "บันทึก" : "สร้าง"
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
