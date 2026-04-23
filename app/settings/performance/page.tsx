"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Pencil, Target, Clock, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { employeesApi, type Employee } from "@/lib/api/employees";
import { workSchedulesApi, type WorkSchedule } from "@/lib/api/work-schedules";
import {
  performanceConfigApi,
  type PerformanceConfig,
} from "@/lib/api/performance-config";
import { ApiError } from "@/lib/api/client";

const DOW_LABEL_EN = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function PerformanceConfigPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [configs, setConfigs] = useState<Record<string, PerformanceConfig | null>>({});
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState<Employee | null>(null);
  const [saving, setSaving] = useState(false);

  // form state
  const [workScheduleId, setWorkScheduleId] = useState("");
  const [pointTarget, setPointTarget] = useState<string>("");
  const [pointPeriod, setPointPeriod] = useState<"day" | "week" | "month" | "year">("week");
  const [expectedRatio, setExpectedRatio] = useState<string>("0.8");
  const [pointedWorkPercent, setPointedWorkPercent] = useState<string>("80");

  const loadAll = async () => {
    setLoading(true);
    try {
      const empRes: any = await employeesApi.listAll();
      const empList: Employee[] = empRes?.rows ?? empRes ?? [];
      const active = empList.filter((e) => e.isActive);
      const wsList = await workSchedulesApi.list();
      setEmployees(active);
      setSchedules(wsList);

      // Fetch configs in parallel — 404 = not configured
      const results = await Promise.allSettled(
        active.map((e) => performanceConfigApi.getByEmployee(e.id)),
      );
      const cfgMap: Record<string, PerformanceConfig | null> = {};
      active.forEach((e, i) => {
        const r = results[i];
        cfgMap[e.id] = r.status === "fulfilled" ? r.value : null;
      });
      setConfigs(cfgMap);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const openEdit = (emp: Employee) => {
    const cfg = configs[emp.id];
    const defaultWs = schedules.find((s) => s.isDefault) || schedules[0];
    setEditing(emp);
    setWorkScheduleId(cfg?.work_schedule_id || defaultWs?.id || "");
    setPointTarget(cfg?.point_target != null ? String(cfg.point_target) : "");
    setPointPeriod(cfg?.point_period || "week");
    setExpectedRatio(cfg?.expected_ratio != null ? String(cfg.expected_ratio) : "0.8");
    setPointedWorkPercent(
      cfg?.pointed_work_percent != null ? String(cfg.pointed_work_percent) : "80",
    );
  };

  const closeEdit = () => {
    setEditing(null);
  };

  const handleSave = async () => {
    if (!editing) return;
    if (!workScheduleId) {
      toast.error("Please select a work schedule");
      return;
    }
    setSaving(true);
    try {
      const updated = await performanceConfigApi.upsert({
        employee_id: editing.id,
        work_schedule_id: workScheduleId,
        expected_ratio: Number(expectedRatio) || 0.8,
        pointed_work_percent: Number(pointedWorkPercent) || 80,
        point_target: pointTarget ? Number(pointTarget) : undefined,
        point_period: pointPeriod,
      });
      setConfigs((m) => ({ ...m, [editing.id]: updated }));
      toast.success(`Saved config for ${editing.name}`);
      closeEdit();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to save";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <Link href="/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Performance Config</h1>
          <p className="text-muted-foreground">
            กำหนด work schedule และ point target ให้พนักงานแต่ละคน — ใช้คำนวณช่วงเวลาและเป้าหมายในหน้า Analytics
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Employees
            </CardTitle>
            <Target className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Configured
            </CardTitle>
            <Clock className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {Object.values(configs).filter(Boolean).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Not Configured
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {Object.values(configs).filter((v) => !v).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee table */}
      <Card>
        <CardHeader>
          <CardTitle>Employees</CardTitle>
          <CardDescription>
            คลิก Edit เพื่อเลือก work schedule, ตั้ง point target ต่อสัปดาห์/เดือน/ปี และ expected ratio
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Loading…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Work Schedule</TableHead>
                  <TableHead>Work Days</TableHead>
                  <TableHead>Point Target</TableHead>
                  <TableHead>Expected Ratio</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((emp) => {
                  const cfg = configs[emp.id];
                  return (
                    <TableRow key={emp.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={emp.avatarUrl ?? undefined} />
                            <AvatarFallback className="text-xs">
                              {emp.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{emp.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {typeof emp.role === "string" ? emp.role : (emp.role as any)?.name ?? "—"} · {emp.employeeCode}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {cfg ? (
                          <Badge variant="outline">{cfg.work_schedule_name}</Badge>
                        ) : (
                          <Badge variant="secondary">Not set</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {cfg?.work_days?.length ? (
                          <div className="flex flex-wrap gap-1">
                            {cfg.work_days
                              .slice()
                              .sort((a, b) => a - b)
                              .map((d) => (
                                <span
                                  key={d}
                                  className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary"
                                >
                                  {DOW_LABEL_EN[d]}
                                </span>
                              ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {cfg?.point_target != null ? (
                          <span className="font-medium">
                            {cfg.point_target} pts/{cfg.point_period}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {cfg?.expected_ratio != null ? (
                          <span>{Number(cfg.expected_ratio).toFixed(2)}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => openEdit(emp)}>
                          <Pencil className="mr-1 h-3 w-3" />
                          {cfg ? "Edit" : "Set up"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {employees.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No active employees
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && closeEdit()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Performance Config</DialogTitle>
            <DialogDescription>
              {editing ? `Configure for ${editing.name}` : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Work Schedule</Label>
              <Select value={workScheduleId} onValueChange={setWorkScheduleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select schedule" />
                </SelectTrigger>
                <SelectContent>
                  {schedules.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <div className="flex items-center gap-2">
                        <span>{s.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({s.workDays?.map((d) => DOW_LABEL_EN[d]).join(", ")})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                จัดการ schedule ได้ที่{" "}
                <Link href="/settings/organization" className="text-primary underline">
                  Organization → Work Schedules
                </Link>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Point Target</Label>
                <Input
                  type="number"
                  min="0"
                  value={pointTarget}
                  onChange={(e) => setPointTarget(e.target.value)}
                  placeholder="e.g. 40"
                />
              </div>
              <div className="space-y-2">
                <Label>Period</Label>
                <Select value={pointPeriod} onValueChange={(v) => setPointPeriod(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Per Day</SelectItem>
                    <SelectItem value="week">Per Week</SelectItem>
                    <SelectItem value="month">Per Month</SelectItem>
                    <SelectItem value="year">Per Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Expected Ratio</Label>
                <Input
                  type="number"
                  min="0"
                  max="2"
                  step="0.05"
                  value={expectedRatio}
                  onChange={(e) => setExpectedRatio(e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground">0.0–2.0 (เช่น 0.8 = คาดหวัง 80%)</p>
              </div>
              <div className="space-y-2">
                <Label>Pointed Work %</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={pointedWorkPercent}
                  onChange={(e) => setPointedWorkPercent(e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground">0–100 (% งานที่นับ point)</p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeEdit} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
