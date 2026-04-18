"use client";

import { useState, useMemo, useEffect } from "react";
import {
  format,
  addDays,
  addWeeks,
  subWeeks,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
  differenceInDays,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Users,
  AlertTriangle,
  Activity,
  UserX,
  Gauge,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { employeesApi, type Employee } from "@/lib/api/employees";
import { tasksApi, type CalendarTaskRow } from "@/lib/api/tasks";
import {
  performanceConfigApi,
  type PerformanceConfig,
} from "@/lib/api/performance-config";
import { toast } from "sonner";
import { PermissionGate } from "@/components/permission-gate";

type ViewMode = "week" | "2weeks" | "month";

// Defaults when employee has no performance config
const DEFAULT_HOURS_PER_DAY = 8;
const DEFAULT_WORK_DAYS = [1, 2, 3, 4, 5]; // Mon..Fri (ISO DOW)

// Map JS getDay() → ISO DOW (1=Mon..7=Sun)
const isoDow = (d: Date) => (d.getDay() === 0 ? 7 : d.getDay());

function utilizationColor(pct: number) {
  if (pct > 100) return "#ef4444"; // red
  if (pct >= 85) return "#f59e0b"; // amber
  if (pct >= 40) return "#10b981"; // green
  return "#94a3b8"; // slate
}

export default function ResourcesPage() {
  return (
    <PermissionGate requires={["view_analytics", "manage_users"]}>
      <ResourcesPageInner />
    </PermissionGate>
  );
}

function ResourcesPageInner() {
  const [employees, setEmployees]         = useState<Employee[]>([]);
  const [tasks, setTasks]                 = useState<CalendarTaskRow[]>([]);
  const [configs, setConfigs]             = useState<PerformanceConfig[]>([]);
  const [isLoading, setIsLoading]         = useState(true);
  const [currentDate, setCurrentDate]     = useState(new Date());
  const [viewMode, setViewMode]           = useState<ViewMode>("2weeks");
  const [selectedUserId, setSelectedUserId] = useState<string>("all");

  // ─── Date range ───────────────────────────────────────────────────────────
  const dateRange = useMemo(() => {
    const start =
      viewMode === "month"
        ? startOfMonth(currentDate)
        : startOfWeek(currentDate, { weekStartsOn: 1 });
    const end =
      viewMode === "month"
        ? endOfMonth(currentDate)
        : viewMode === "2weeks"
          ? endOfWeek(addWeeks(currentDate, 1), { weekStartsOn: 1 })
          : endOfWeek(currentDate, { weekStartsOn: 1 });
    return { start, end };
  }, [currentDate, viewMode]);

  const days = useMemo(
    () => eachDayOfInterval({ start: dateRange.start, end: dateRange.end }),
    [dateRange]
  );

  // ─── Load data ────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const startStr = format(dateRange.start, "yyyy-MM-dd");
      const endStr   = format(dateRange.end,   "yyyy-MM-dd");

      const [empRes, taskRes, cfgRes] = await Promise.allSettled([
        employeesApi.listAll(),
        tasksApi.calendar(startStr, endStr),
        performanceConfigApi.listAll(),
      ]);

      if (empRes.status === "fulfilled") {
        const raw = empRes.value as unknown;
        const list: Employee[] = Array.isArray(raw)
          ? (raw as Employee[])
          : ((raw as { rows?: Employee[] })?.rows ?? []);
        setEmployees(list.filter((e) => e.isActive));
      } else {
        console.error("employees load failed:", empRes.reason);
        toast.error("โหลดพนักงานไม่สำเร็จ");
      }

      if (taskRes.status === "fulfilled") {
        setTasks(taskRes.value);
      } else {
        console.error("tasks load failed:", taskRes.reason);
        toast.error("โหลดงานไม่สำเร็จ");
      }

      if (cfgRes.status === "fulfilled" && Array.isArray(cfgRes.value)) {
        setConfigs(cfgRes.value);
      } else {
        // Non-fatal: capacity just falls back to default (8h/day, Mon–Fri)
        if (cfgRes.status === "rejected") {
          console.warn("perf configs unavailable, using defaults:", cfgRes.reason);
        }
        setConfigs([]);
      }

      setIsLoading(false);
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, viewMode]);

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const configByEmployee = useMemo(() => {
    const m = new Map<string, PerformanceConfig>();
    configs.forEach((c) => m.set(c.employee_id, c));
    return m;
  }, [configs]);

  const filteredEmployees = useMemo(() => {
    if (selectedUserId === "all") return employees;
    return employees.filter((e) => e.id === selectedUserId);
  }, [employees, selectedUserId]);

  /** tasks grouped by assignee_id */
  const userTasksMap = useMemo(() => {
    const map: Record<string, CalendarTaskRow[]> = {};
    filteredEmployees.forEach((emp) => {
      map[emp.id] = tasks.filter((t) => t.assignee_id === emp.id);
    });
    return map;
  }, [filteredEmployees, tasks]);

  /** capacity & utilization per employee in the visible date range */
  const capacityByEmployee = useMemo(() => {
    const out: Record<
      string,
      {
        workDaysInRange: number;
        capacityHours: number;
        assignedHours: number;
        utilizationPct: number;
      }
    > = {};

    filteredEmployees.forEach((emp) => {
      const cfg = configByEmployee.get(emp.id);
      const hoursPerDay = cfg?.hours_per_day
        ? Number(cfg.hours_per_day)
        : DEFAULT_HOURS_PER_DAY;
      const workDays = cfg?.work_days?.length ? cfg.work_days : DEFAULT_WORK_DAYS;

      // count working days of this employee inside the visible range
      const workDaysInRange = days.filter((d) => workDays.includes(isoDow(d))).length;
      const capacityHours = workDaysInRange * hoursPerDay;

      // sum assigned hours from tasks overlapping the range
      const empTasks = userTasksMap[emp.id] ?? [];
      let assignedHours = 0;
      empTasks.forEach((t) => {
        let start: Date | null = null;
        let end: Date | null = null;
        if (t.plan_start && t.duration_days) {
          start = new Date(t.plan_start);
          end = addDays(start, Math.max(0, t.duration_days - 1));
        } else if (t.plan_start && t.plan_finish) {
          start = new Date(t.plan_start);
          end = new Date(t.plan_finish);
        } else if (t.deadline && t.duration_days) {
          end = new Date(t.deadline);
          start = addDays(end, -(t.duration_days - 1));
        }
        if (!start || !end) return;

        const clipStart = start < dateRange.start ? dateRange.start : start;
        const clipEnd = end > dateRange.end ? dateRange.end : end;
        if (clipEnd < clipStart) return;

        const totalSpanDays = differenceInDays(end, start) + 1;
        const overlapDays = differenceInDays(clipEnd, clipStart) + 1;
        if (totalSpanDays <= 0 || overlapDays <= 0) return;

        const estHours = t.time_estimate_hours
          ? Number(t.time_estimate_hours)
          : (t.duration_days ?? 0) * hoursPerDay;
        assignedHours += (estHours * overlapDays) / totalSpanDays;
      });

      const utilizationPct = capacityHours > 0 ? (assignedHours / capacityHours) * 100 : 0;
      out[emp.id] = {
        workDaysInRange,
        capacityHours,
        assignedHours: Math.round(assignedHours * 10) / 10,
        utilizationPct: Math.round(utilizationPct),
      };
    });

    return out;
  }, [filteredEmployees, configByEmployee, days, userTasksMap, dateRange]);

  /** summary stats across all employees in view */
  const summary = useMemo(() => {
    const utilValues = Object.values(capacityByEmployee).map((c) => c.utilizationPct);
    const avgUtil = utilValues.length
      ? Math.round(utilValues.reduce((a, b) => a + b, 0) / utilValues.length)
      : 0;
    const overAllocated = utilValues.filter((u) => u > 100).length;
    const unassignedTasks = tasks.filter(
      (t) => !t.assignee_id || t.assignee_id === null,
    ).length;
    const totalTasks = tasks.length;
    return { avgUtil, overAllocated, unassignedTasks, totalTasks };
  }, [capacityByEmployee, tasks]);

  /** Gantt bar position & width (% of total days) */
  const getBarStyle = (task: CalendarTaskRow) => {
    let startDate: Date;
    let endDate: Date;

    if (task.plan_start && task.duration_days) {
      startDate = new Date(task.plan_start);
      endDate   = addDays(startDate, Math.max(0, task.duration_days - 1));
    } else if (task.plan_start && task.plan_finish) {
      startDate = new Date(task.plan_start);
      endDate   = new Date(task.plan_finish);
    } else if (task.deadline) {
      endDate   = new Date(task.deadline);
      startDate = addDays(endDate, -(task.duration_days ?? 1));
    } else {
      startDate = new Date(task.created_at);
      endDate   = addDays(startDate, 1);
    }

    const clampedStart = startDate < dateRange.start ? dateRange.start : startDate;
    const clampedEnd   = endDate   > dateRange.end   ? dateRange.end   : endDate;

    const total       = days.length;
    const startOffset = differenceInDays(clampedStart, dateRange.start);
    const duration    = Math.max(1, differenceInDays(clampedEnd, clampedStart) + 1);

    return {
      left:  `${(startOffset / total) * 100}%`,
      width: `${Math.min(((100 - (startOffset / total) * 100)), (duration / total) * 100)}%`,
    };
  };

  const navigate = (dir: "prev" | "next") => {
    const amount = viewMode === "month" ? 1 : viewMode === "2weeks" ? 2 : 1;
    if (dir === "prev") {
      setCurrentDate(
        viewMode === "month"
          ? new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
          : subWeeks(currentDate, amount)
      );
    } else {
      setCurrentDate(
        viewMode === "month"
          ? new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
          : addWeeks(currentDate, amount)
      );
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <TooltipProvider>
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold">Resources</h1>
          <Badge variant="secondary" className="font-normal">Capacity & Gantt</Badge>
        </div>

        {/* Toolbar */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigate("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => setCurrentDate(new Date())}>Today</Button>
            <Button variant="outline" size="icon" onClick={() => navigate("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="ml-2 font-medium">
              {format(dateRange.start, "MMM d")} – {format(dateRange.end, "MMM d, yyyy")}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="h-8 w-[180px]">
                <Users className="mr-1.5 h-3.5 w-3.5" />
                <SelectValue placeholder="Filter by user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Team Members</SelectItem>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <SelectTrigger className="h-8 w-[130px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="week">1 Week</SelectItem>
                <SelectItem value="2weeks">2 Weeks</SelectItem>
                <SelectItem value="month">Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary cards */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Activity className="h-4 w-4 text-blue-600" />
              </div>
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">Total Tasks</div>
                <div className="text-lg font-semibold">{summary.totalTasks}</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Gauge className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">Avg Utilization</div>
                <div className="text-lg font-semibold" style={{ color: utilizationColor(summary.avgUtil) }}>
                  {summary.avgUtil}%
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">Over-allocated</div>
                <div className="text-lg font-semibold">{summary.overAllocated}</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <UserX className="h-4 w-4 text-amber-600" />
              </div>
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">Unassigned</div>
                <div className="text-lg font-semibold">{summary.unassignedTasks}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Gantt */}
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center text-muted-foreground">
          Loading…
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* User Column */}
          <div className="w-[260px] shrink-0 border-r bg-muted/30">
            <div className="h-16 border-b px-4 py-2 flex items-end">
              <span className="text-sm font-medium text-muted-foreground">Team Member · Capacity</span>
            </div>
            {filteredEmployees.map((emp) => {
              const cap = capacityByEmployee[emp.id];
              const util = cap?.utilizationPct ?? 0;
              const color = utilizationColor(util);
              const hasConfig = configByEmployee.has(emp.id);
              return (
                <div key={emp.id} className="flex items-center gap-3 border-b px-3 py-2 h-[80px]">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={emp.avatarUrl ?? undefined} />
                    <AvatarFallback>{emp.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <div className="text-sm font-medium truncate">{emp.name}</div>
                      {util > 100 && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                          </TooltipTrigger>
                          <TooltipContent>Over-allocated</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {(userTasksMap[emp.id]?.length ?? 0)} task{(userTasksMap[emp.id]?.length ?? 0) !== 1 ? "s" : ""}
                      {!hasConfig && <span className="ml-1 opacity-70">· default 8h</span>}
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="mt-1">
                          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${Math.min(util, 100)}%`,
                                backgroundColor: color,
                              }}
                            />
                          </div>
                          <div className="mt-0.5 flex justify-between text-[10px]">
                            <span className="text-muted-foreground">
                              {cap?.assignedHours ?? 0}h / {cap?.capacityHours ?? 0}h
                            </span>
                            <span className="font-medium tabular-nums" style={{ color }}>
                              {util}%
                            </span>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-xs space-y-0.5">
                          <div>Work days in range: <b>{cap?.workDaysInRange ?? 0}</b></div>
                          <div>Capacity: <b>{cap?.capacityHours ?? 0}h</b></div>
                          <div>Assigned: <b>{cap?.assignedHours ?? 0}h</b></div>
                          <div>Utilization: <b>{util}%</b></div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Timeline */}
          <ScrollArea className="flex-1">
            <div className="min-w-[800px]">
              {/* Date Headers */}
              <div className="flex h-16 border-b">
                {days.map((day, idx) => {
                  const weekend = isoDow(day) === 6 || isoDow(day) === 7;
                  return (
                    <div
                      key={idx}
                      className={cn(
                        "flex-1 flex flex-col items-center justify-center border-r text-center",
                        weekend && "bg-muted/40",
                        isToday(day) && "bg-primary/10"
                      )}
                    >
                      <span className="text-xs text-muted-foreground">{format(day, "EEE")}</span>
                      <span className={cn("text-sm font-medium", isToday(day) && "text-primary")}>
                        {format(day, "d")}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Task Rows */}
              {filteredEmployees.map((emp) => {
                const empTasks = userTasksMap[emp.id] ?? [];
                const cfg = configByEmployee.get(emp.id);
                const workDays = cfg?.work_days?.length ? cfg.work_days : DEFAULT_WORK_DAYS;
                return (
                  <div key={emp.id} className="relative flex h-[80px] border-b">
                    {/* Grid lines + non-work-day shading */}
                    {days.map((day, idx) => {
                      const isWorkDay = workDays.includes(isoDow(day));
                      return (
                        <div
                          key={idx}
                          className={cn(
                            "flex-1 border-r",
                            !isWorkDay && "bg-muted/30",
                            isToday(day) && "bg-primary/5",
                          )}
                        />
                      );
                    })}
                    {/* Task bars */}
                    <div className="absolute inset-0 p-2 flex flex-col gap-1 overflow-hidden">
                      {empTasks.slice(0, 3).map((task, idx) => {
                        const style = getBarStyle(task);
                        const barColor = task.status_color ?? "#6b7280";
                        const dur = task.duration_days ?? (
                          task.plan_start && task.plan_finish
                            ? differenceInDays(new Date(task.plan_finish), new Date(task.plan_start)) + 1
                            : null
                        );
                        return (
                          <Tooltip key={task.id}>
                            <TooltipTrigger asChild>
                              <div
                                className="absolute h-6 rounded px-2 flex items-center gap-1 text-xs text-white truncate cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
                                style={{
                                  left:            style.left,
                                  width:           style.width,
                                  top:             `${8 + idx * 24}px`,
                                  backgroundColor: barColor,
                                }}
                                onClick={() => window.open(`/task/${task.id}`, "_blank")}
                              >
                                <span className="truncate font-medium">{task.title}</span>
                                {dur && (
                                  <Badge variant="secondary" className="h-4 px-1 text-[10px] bg-white/20 text-white shrink-0">
                                    {dur}d
                                  </Badge>
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-xs space-y-0.5 max-w-[280px]">
                                <div className="font-medium">{task.title}</div>
                                <div>Status: <b>{task.status_name ?? task.status}</b></div>
                                {task.list_name && <div>List: {task.list_name}</div>}
                                <div>Priority: {task.priority}</div>
                                {task.time_estimate_hours != null && (
                                  <div>Estimate: {task.time_estimate_hours}h</div>
                                )}
                                {dur && <div>Duration: {dur}d</div>}
                                {task.deadline && (
                                  <div>Deadline: {format(new Date(task.deadline), "MMM d, yyyy")}</div>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                      {empTasks.length > 3 && (
                        <div className="absolute bottom-1 right-2 text-xs text-muted-foreground">
                          +{empTasks.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredEmployees.length === 0 && (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  No team members found
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Legend */}
      <div className="border-t px-6 py-3 bg-muted/30">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Utilization:</span>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded" style={{ backgroundColor: "#94a3b8" }} />
              <span className="text-xs">&lt;40%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded" style={{ backgroundColor: "#10b981" }} />
              <span className="text-xs">40–84%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded" style={{ backgroundColor: "#f59e0b" }} />
              <span className="text-xs">85–100%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded" style={{ backgroundColor: "#ef4444" }} />
              <span className="text-xs">&gt;100%</span>
            </div>
          </div>

          <div className="h-4 w-px bg-border" />

          <span className="text-xs text-muted-foreground">Status:</span>
          {(() => {
            const seen = new Map<string, string>();
            tasks.forEach((t) => {
              const key = t.status_name ?? t.status;
              if (!seen.has(key)) seen.set(key, t.status_color ?? "#6b7280");
            });
            return Array.from(seen.entries()).slice(0, 6).map(([name, color]) => (
              <div key={name} className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded" style={{ backgroundColor: color }} />
                <span className="text-xs">{name}</span>
              </div>
            ));
          })()}
        </div>
      </div>
    </div>
    </TooltipProvider>
  );
}
