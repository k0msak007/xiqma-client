"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Sparkles, Loader2, AlertCircle, CheckCircle2, X, Plus,
  CalendarIcon, Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { aiApi, type ExtractedTaskDraft } from "@/lib/api/ai";
import { tasksApi } from "@/lib/api/tasks";
import { employeesApi, type Employee } from "@/lib/api/employees";
import { taskTypesApi, type TaskType } from "@/lib/api/task-types";

const PLACEHOLDER = `วาง notes ที่นี่ — เช่น สรุปประชุม, อีเมลจากลูกค้า, ข้อความ ฯลฯ
ตัวอย่าง:

ประชุมกับลูกค้า ABC วันนี้ 25/4 10:00
- ลูกค้าอยากให้ทำหน้า landing page ใหม่ ภายใน 2 สัปดาห์ ให้ Anna ทำ design, Jane ทำ dev
- Bug: ปุ่ม checkout ใน mobile กดไม่ได้ — urgent! Bob ดูให้ภายในพรุ่งนี้
- ฟีเจอร์ใหม่: export PDF invoice อยากได้สิ้นเดือน
`;

const PRIORITY_OPTIONS: Array<{ value: "low" | "normal" | "high" | "urgent"; label: string; color: string }> = [
  { value: "low",    label: "Low",    color: "#6b7280" },
  { value: "normal", label: "Normal", color: "#3b82f6" },
  { value: "high",   label: "High",   color: "#f97316" },
  { value: "urgent", label: "Urgent", color: "#ef4444" },
];

interface DraftEdit extends ExtractedTaskDraft {
  // editable runtime overrides
  _include:        boolean;
  _editAssigneeId: string | null;
  _editTaskTypeId: string | null;
  _editPriority:   "low" | "normal" | "high" | "urgent";
  _editTitle:      string;
  _editPlanStart:  Date | null;
  _editDeadline:   Date | null;
  _editDuration:   number | null;
}

interface ExtractTasksDialogProps {
  open:       boolean;
  onOpenChange: (open: boolean) => void;
  listId:     string;
  defaultStatusId?: string;
  onCreated?: () => void;
}

export function ExtractTasksDialog({
  open, onOpenChange, listId, defaultStatusId, onCreated,
}: ExtractTasksDialogProps) {
  const [text, setText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [drafts, setDrafts] = useState<DraftEdit[]>([]);
  const [notes, setNotes] = useState<string>("");

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [creating, setCreating] = useState(false);

  // Load reference data when dialog opens
  useEffect(() => {
    if (!open) return;
    employeesApi.listAll()
      .then((emps) => setEmployees(emps.filter((e) => (e as any).isActive ?? true)))
      .catch(() => {});
    taskTypesApi.list()
      .then((tts) => setTaskTypes(tts))
      .catch(() => {});
  }, [open]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setText("");
      setDrafts([]);
      setNotes("");
      setAnalyzing(false);
      setCreating(false);
    }
  }, [open]);

  const analyze = async () => {
    if (text.trim().length < 10) {
      toast.error("ข้อความสั้นเกินไป");
      return;
    }
    setAnalyzing(true);
    setDrafts([]);
    try {
      const result = await aiApi.extractTasks({ text, listId, language: "th" });
      const editable: DraftEdit[] = result.drafts.map((d) => ({
        ...d,
        _include:        true,
        _editAssigneeId: d.assigneeId ?? null,
        _editTaskTypeId: d.taskTypeId ?? null,
        _editPriority:   d.priority ?? "normal",
        _editTitle:      d.title,
        _editPlanStart:  d.planStart ? new Date(d.planStart) : null,
        _editDeadline:   d.deadline ? new Date(d.deadline) : null,
        _editDuration:   d.durationDays ?? null,
      }));
      setDrafts(editable);
      setNotes(result.notes ?? "");
      toast.success(`พบ ${editable.length} task`);
    } catch (err: any) {
      toast.error(err?.message ?? "วิเคราะห์ไม่สำเร็จ");
    } finally {
      setAnalyzing(false);
    }
  };

  const update = (idx: number, patch: Partial<DraftEdit>) => {
    setDrafts((prev) => prev.map((d, i) => (i === idx ? { ...d, ...patch } : d)));
  };

  const includedDrafts = drafts.filter((d) => d._include);
  const missingAssignee = includedDrafts.filter((d) => !d._editAssigneeId);

  const createAll = async () => {
    if (includedDrafts.length === 0) return;
    if (missingAssignee.length > 0) {
      toast.error(`ยังไม่ได้เลือกผู้รับผิดชอบให้ ${missingAssignee.length} task`);
      return;
    }
    setCreating(true);
    let success = 0;
    let failed  = 0;
    try {
      for (const d of includedDrafts) {
        try {
          await tasksApi.create({
            title:        d._editTitle.trim(),
            listId,
            assigneeId:   d._editAssigneeId!,
            description:  d.description ?? undefined,
            listStatusId: defaultStatusId,
            taskTypeId:   d._editTaskTypeId ?? undefined,
            priority:     d._editPriority,
            durationDays: d._editDuration ?? undefined,
            planStart:    d._editPlanStart ? format(d._editPlanStart, "yyyy-MM-dd") : undefined,
            deadline:     d._editDeadline  ? d._editDeadline.toISOString() : undefined,
          });
          success++;
        } catch {
          failed++;
        }
      }
      if (success > 0) toast.success(`สร้าง ${success} task สำเร็จ${failed > 0 ? ` (พลาด ${failed})` : ""}`);
      else toast.error("สร้างไม่สำเร็จเลย");
      if (success > 0) {
        onCreated?.();
        onOpenChange(false);
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[90vh] max-h-[90vh] flex-col gap-4 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-600" />
            สร้าง Task จาก Notes ด้วย AI
          </DialogTitle>
          <DialogDescription>
            paste บันทึกประชุม / อีเมล / ข้อความ — AI จะสกัดเป็น task พร้อมเดา assignee + วันเวลาให้
          </DialogDescription>
        </DialogHeader>

        {drafts.length === 0 ? (
          // ── Step 1: textarea ────────────────────────────────────────────
          <>
            <div className="flex-1 space-y-2 overflow-y-auto px-6">
              <Label className="text-sm">ข้อความ (notes / email / ข้อความ)</Label>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={PLACEHOLDER}
                rows={12}
                className="resize-y font-mono text-sm"
                disabled={analyzing}
              />
              <p className="text-xs text-muted-foreground">
                {text.length} / 20,000 ตัวอักษร · AI ใช้ context: รายชื่อพนักงาน + task types + วันที่อ้างอิง
              </p>
            </div>
            <DialogFooter className="border-t px-6 py-4">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={analyzing}>
                ยกเลิก
              </Button>
              <Button
                onClick={analyze}
                disabled={analyzing || text.trim().length < 10}
                className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-rose-500 text-white hover:from-violet-600 hover:via-fuchsia-600 hover:to-rose-600"
              >
                {analyzing ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />กำลังวิเคราะห์...</>
                ) : (
                  <><Wand2 className="mr-2 h-4 w-4" />วิเคราะห์</>
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          // ── Step 2: preview drafts ──────────────────────────────────────
          <>
            {notes && (
              <div className="mx-6 rounded-lg border border-violet-200/60 bg-violet-50/50 px-3 py-2 text-xs text-violet-900 dark:border-violet-500/30 dark:bg-violet-950/20 dark:text-violet-200">
                💡 {notes}
              </div>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto px-6">
              <div className="space-y-3">
                {drafts.map((d, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "rounded-xl border p-3 transition",
                      d._include ? "border-border/60 bg-card" : "border-dashed border-muted-foreground/30 bg-muted/30 opacity-60",
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <Checkbox
                        checked={d._include}
                        onCheckedChange={(v) => update(idx, { _include: !!v })}
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-2 min-w-0">
                        {/* Title */}
                        <div className="flex items-center gap-2">
                          <Input
                            value={d._editTitle}
                            onChange={(e) => update(idx, { _editTitle: e.target.value })}
                            disabled={!d._include}
                            className="h-8 flex-1 font-medium"
                          />
                          <PriorityBadgeSelect
                            value={d._editPriority}
                            onChange={(v) => update(idx, { _editPriority: v })}
                            disabled={!d._include}
                          />
                        </div>

                        {d.description && (
                          <p className="line-clamp-2 text-xs text-muted-foreground">{d.description}</p>
                        )}

                        {/* Editable fields */}
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                          {/* Assignee */}
                          <div className="space-y-0.5">
                            <Label className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                              ผู้รับผิดชอบ
                              <MatchBadge match={d.assigneeMatch} raw={d.rawAssignee} />
                            </Label>
                            <Select
                              value={d._editAssigneeId ?? ""}
                              onValueChange={(v) => update(idx, { _editAssigneeId: v })}
                              disabled={!d._include}
                            >
                              <SelectTrigger className="h-8 w-full text-xs">
                                <SelectValue placeholder="เลือก..." />
                              </SelectTrigger>
                              <SelectContent>
                                {employees.map((e) => (
                                  <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Task type */}
                          <div className="space-y-0.5">
                            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">ประเภท</Label>
                            <Select
                              value={d._editTaskTypeId ?? "_none"}
                              onValueChange={(v) => update(idx, { _editTaskTypeId: v === "_none" ? null : v })}
                              disabled={!d._include}
                            >
                              <SelectTrigger className="h-8 w-full text-xs">
                                <SelectValue placeholder="เลือก..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="_none">—</SelectItem>
                                {taskTypes.map((t) => (
                                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Plan start */}
                          <div className="space-y-0.5">
                            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">เริ่ม</Label>
                            <DateButton
                              value={d._editPlanStart}
                              onChange={(date) => update(idx, { _editPlanStart: date })}
                              disabled={!d._include}
                            />
                          </div>

                          {/* Duration */}
                          <div className="space-y-0.5">
                            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">วัน</Label>
                            <Input
                              type="number"
                              min="1"
                              value={d._editDuration ?? ""}
                              onChange={(e) => {
                                const n = e.target.value ? parseInt(e.target.value, 10) : null;
                                update(idx, { _editDuration: Number.isFinite(n as number) ? n : null });
                              }}
                              placeholder="—"
                              disabled={!d._include}
                              className="h-8 text-xs"
                            />
                          </div>
                        </div>

                        {d.reasoning && (
                          <p className="mt-1 text-[10px] italic text-muted-foreground">💭 {d.reasoning}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="flex-col-reverse gap-2 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-muted-foreground">
                เลือกแล้ว {includedDrafts.length} / {drafts.length} task
                {missingAssignee.length > 0 && (
                  <span className="ml-2 text-destructive">
                    · ขาด assignee {missingAssignee.length} task
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setDrafts([])} disabled={creating}>
                  วิเคราะห์ใหม่
                </Button>
                <Button
                  onClick={createAll}
                  disabled={creating || includedDrafts.length === 0 || missingAssignee.length > 0}
                  className="bg-gradient-to-r from-orange-500 via-pink-500 to-rose-500 text-white hover:from-orange-600 hover:via-pink-600 hover:to-rose-600"
                >
                  {creating ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />กำลังสร้าง...</>
                  ) : (
                    <><Plus className="mr-2 h-4 w-4" />สร้างทั้งหมด ({includedDrafts.length})</>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function MatchBadge({ match, raw }: { match: "exact" | "fuzzy" | "none"; raw?: string | null }) {
  if (match === "exact") {
    return (
      <span title={`AI match: "${raw}"`} className="inline-flex h-3.5 items-center rounded bg-emerald-100 px-1 text-[9px] font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
        ✓
      </span>
    );
  }
  if (match === "fuzzy") {
    return (
      <span title={`AI match (fuzzy): "${raw}"`} className="inline-flex h-3.5 items-center rounded bg-amber-100 px-1 text-[9px] font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
        ~
      </span>
    );
  }
  return raw ? (
    <span title={`AI พูดถึง: "${raw}" แต่หาไม่เจอ`} className="inline-flex h-3.5 items-center rounded bg-rose-100 px-1 text-[9px] font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
      ?
    </span>
  ) : null;
}

function PriorityBadgeSelect({
  value, onChange, disabled,
}: {
  value: "low" | "normal" | "high" | "urgent";
  onChange: (v: "low" | "normal" | "high" | "urgent") => void;
  disabled?: boolean;
}) {
  const conf = PRIORITY_OPTIONS.find((p) => p.value === value);
  return (
    <Select value={value} onValueChange={(v) => onChange(v as any)} disabled={disabled}>
      <SelectTrigger
        className="h-7 w-fit gap-1 border-0 px-2 text-[10px] font-semibold uppercase tracking-wide shadow-none focus:ring-0"
        style={{ backgroundColor: `${conf?.color}1a`, color: conf?.color }}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PRIORITY_OPTIONS.map((p) => (
          <SelectItem key={p.value} value={p.value}>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
              {p.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function DateButton({
  value, onChange, disabled,
}: {
  value: Date | null;
  onChange: (d: Date | null) => void;
  disabled?: boolean;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn("h-8 w-full justify-start px-2 text-xs font-normal", !value && "text-muted-foreground")}
        >
          <CalendarIcon className="mr-1 h-3 w-3 opacity-60" />
          {value ? format(value, "d MMM") : "—"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={value ?? undefined} onSelect={(d) => onChange(d ?? null)} />
      </PopoverContent>
    </Popover>
  );
}
