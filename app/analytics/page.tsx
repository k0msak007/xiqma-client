"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { format, subYears, getISOWeek } from "date-fns";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  Calendar,
  Target,
  Activity,
  Zap,
  BarChart3,
  Timer,
  RefreshCcw,
  AlertTriangle,
  Gauge,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTaskStore } from "@/lib/store";
import { isHoliday } from "@/lib/types";
import type { HolidaySettings } from "@/lib/types";
import { employeesApi, type Employee } from "@/lib/api/employees";
import { tasksApi, type CalendarTaskRow } from "@/lib/api/tasks";
import { analyticsApi, type PerformanceSummary, type VelocityRow, type EfficiencyResult, type BottleneckRow, type TeamWorkloadRow } from "@/lib/api/analytics";
import { performanceConfigApi, type PerformanceConfig } from "@/lib/api/performance-config";
import { useTranslation } from "@/lib/i18n";
import { ApiError } from "@/lib/api/client";
import { useAuthStore } from "@/lib/auth-store";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadialBarChart,
  RadialBar,
  ComposedChart,
} from "recharts";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getHolidaySettingsForYear(
  holidaySettings: HolidaySettings[],
  year: number,
): HolidaySettings {
  return (
    holidaySettings.find((hs) => hs.year === year) ?? {
      year,
      weekendDays: [0, 6],
      specialHolidays: [],
    }
  );
}

function getWorkingDaysInPeriod(
  startDate: Date,
  endDate: Date,
  holidaySettings: HolidaySettings,
): number {
  let workingDays = 0;
  const current = new Date(startDate);
  while (current <= endDate) {
    if (!isHoliday(current, holidaySettings)) workingDays++;
    current.setDate(current.getDate() + 1);
  }
  return workingDays;
}

/** Convert JS getDay() (Sun=0..Sat=6) to ISO DOW (Mon=1..Sun=7) */
function isoDow(d: Date): number {
  const js = d.getDay();
  return js === 0 ? 7 : js;
}

function getDateRange(
  period: "week" | "month" | "quarter" | "year",
  referenceDate: Date = new Date(),
  workDays: number[] = [1, 2, 3, 4, 5],
): { start: Date; end: Date } {
  const start = new Date(referenceDate);
  const end = new Date(referenceDate);
  switch (period) {
    case "week": {
      // Use min/max of work_days as the work-week span.
      // If today is before the work-week starts (e.g. Sunday for Mon-Fri worker),
      // roll back to the most recent completed work week.
      const validDays = workDays.length > 0 ? workDays : [1, 2, 3, 4, 5];
      const firstDow = Math.min(...validDays);
      const lastDow  = Math.max(...validDays);
      const todayDow = isoDow(start);
      const daysBack = todayDow >= firstDow
        ? todayDow - firstDow
        : todayDow - firstDow + 7;
      start.setDate(start.getDate() - daysBack);
      start.setHours(0, 0, 0, 0);
      end.setTime(start.getTime());
      end.setDate(start.getDate() + (lastDow - firstDow));
      end.setHours(23, 59, 59, 999);
      break;
    }
    case "month":
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "quarter": {
      const quarter = Math.floor(start.getMonth() / 3);
      start.setMonth(quarter * 3, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(quarter * 3 + 3, 0);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case "year":
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(11, 31);
      end.setHours(23, 59, 59, 999);
      break;
  }
  return { start, end };
}

// ─── Performance Gauge ────────────────────────────────────────────────────────

function PerformanceGauge({ value, label }: { value: number; label: string }) {
  const getColor = (val: number) => {
    if (val >= 100) return "#10b981";
    if (val >= 80) return "#3b82f6";
    if (val >= 60) return "#f59e0b";
    return "#ef4444";
  };
  const data = [{ name: label, value, fill: getColor(value) }];
  return (
    <div className="flex flex-col items-center">
      <div className="h-[120px] w-[120px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="100%"
            barSize={12}
            data={data}
            startAngle={180}
            endAngle={0}
          >
            <RadialBar
              background={{ fill: "hsl(var(--muted))" }}
              dataKey="value"
              cornerRadius={6}
            />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
      <div className="text-center -mt-8">
        <span className="text-2xl font-bold">{Math.round(value)}%</span>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

import { PermissionGate } from "@/components/permission-gate";

export default function AnalyticsPage() {
  return (
    <PermissionGate requires={["view_analytics"]}>
      <AnalyticsPageInner />
    </PermissionGate>
  );
}

function AnalyticsPageInner() {
  const { holidaySettings, taskTypes } = useTaskStore();
  const { t, language } = useTranslation();

  // ── Raw data from APIs ──────────────────────────────────────────────────────
  const [employees,       setEmployees]       = useState<Employee[]>([]);
  const [apiTasks,        setApiTasks]        = useState<CalendarTaskRow[]>([]);
  const [perfSummary,     setPerfSummary]     = useState<PerformanceSummary | null>(null);
  const [perfConfig,      setPerfConfig]      = useState<PerformanceConfig | null>(null);
  const [selectedUserConfig, setSelectedUserConfig] = useState<PerformanceConfig | null>(null);
  const [velocityRows,    setVelocityRows]    = useState<VelocityRow[]>([]);
  const [efficiencyResult,setEfficiencyResult]= useState<EfficiencyResult | null>(null);
  const [bottleneckRows,  setBottleneckRows]  = useState<BottleneckRow[]>([]);
  const [teamWorkload,    setTeamWorkload]    = useState<TeamWorkloadRow[]>([]);

  const [dataLoading, setDataLoading]   = useState(true);
  const [tabLoading,  setTabLoading]    = useState(false);

  const currentUser = useAuthStore((s) => s.user);
  const isManagerOrAdmin = currentUser?.role === "manager" || currentUser?.role === "admin";

  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month" | "quarter" | "year">("week");
  const [selectedUserId, setSelectedUserId] = useState<string>("all");
  const [activeTab,      setActiveTab]      = useState("performance");

  // ── Initial load: employees (listAll = no permission needed), calendar tasks, config ──
  useEffect(() => {
    const start = format(subYears(new Date(), 1), "yyyy-MM-dd");
    const end   = format(new Date(), "yyyy-MM-dd");
    setDataLoading(true);

    Promise.all([
      employeesApi.listAll(),                            // GET /employees/all — backend scope ตาม role (admin=ทุกคน, manager=ทีมตัวเอง)
      tasksApi.calendar(start, end),
      performanceConfigApi.getMe().catch(() => null),    // ถ้ายังไม่มี config ไม่ error
    ])
      .then(([empRes, calTasks, config]) => {
        // Backend returns: { success, message, data: { rows: Employee[] } }
        const empData = empRes as unknown as { rows?: Employee[] };
        const empList = empData?.rows || [];
        setEmployees(empList);
        setApiTasks(calTasks);
        setPerfConfig(config);
      })
      .catch(console.error)
      .finally(() => setDataLoading(false));
  }, []);

  // ── Period-dependent load: analytics APIs re-run when period or user changes ─
  const loadAnalytics = useCallback(async () => {
    setTabLoading(true);
    const workDays = selectedUserId === "all"
      ? [1, 2, 3, 4, 5]
      : (selectedUserConfig?.work_days && selectedUserConfig.work_days.length > 0
          ? selectedUserConfig.work_days
          : (perfConfig?.work_days && perfConfig.work_days.length > 0
              ? perfConfig.work_days
              : [1, 2, 3, 4, 5]));
    const range = getDateRange(selectedPeriod, new Date(), workDays);
    const startStr  = format(range.start, "yyyy-MM-dd");
    const endStr    = format(range.end,   "yyyy-MM-dd");
    const empParam  = selectedUserId !== "all" ? selectedUserId : undefined;

    // ใช้ allSettled เพื่อให้ API ที่ fail (เช่น 403 สำหรับ employee) ไม่ทำให้ตัวอื่นพัง
    const [summary, velocity, efficiency, bottleneck, workload] = await Promise.allSettled([
      analyticsApi.performance({ employee_id: empParam, period: selectedPeriod, start: startStr, end: endStr }),
      analyticsApi.velocity({ employee_id: empParam, weeks: 8 }),
      isManagerOrAdmin ? analyticsApi.efficiency({ period: selectedPeriod, employee_id: empParam }) : Promise.resolve(null),
      isManagerOrAdmin ? analyticsApi.bottleneck() : Promise.resolve([]),
      isManagerOrAdmin ? analyticsApi.teamWorkload() : Promise.resolve([]),
    ]);

    if (summary.status    === "fulfilled") setPerfSummary(summary.value);
    if (velocity.status   === "fulfilled") setVelocityRows(velocity.value);
    if (efficiency.status === "fulfilled" && efficiency.value) setEfficiencyResult(efficiency.value);
    if (bottleneck.status === "fulfilled") setBottleneckRows(bottleneck.value as BottleneckRow[]);
    if (workload.status   === "fulfilled") setTeamWorkload(workload.value as TeamWorkloadRow[]);

    // log errors ที่ไม่ใช่ 403
    [summary, velocity, efficiency, bottleneck, workload].forEach((r) => {
      if (r.status === "rejected" && !(r.reason instanceof ApiError && r.reason.status === 403)) {
        console.error("Analytics error:", r.reason);
      }
    });

    setTabLoading(false);
  }, [selectedPeriod, selectedUserId, selectedUserConfig, perfConfig, isManagerOrAdmin]);

  useEffect(() => {
    if (!dataLoading) void loadAnalytics();
  }, [dataLoading, loadAnalytics]);

  // Load selected employee's perf config (for work_days) when user changes
  useEffect(() => {
    if (selectedUserId === "all") {
      setSelectedUserConfig(null);
      return;
    }
    performanceConfigApi
      .getByEmployee(selectedUserId)
      .then(setSelectedUserConfig)
      .catch(() => setSelectedUserConfig(null));
  }, [selectedUserId]);

  // ── Holiday settings ────────────────────────────────────────────────────────
  const currentYear = new Date().getFullYear();
  const currentHolidaySettings = getHolidaySettingsForYear(holidaySettings, currentYear);

  // Work days: selected employee's config > own config > default Mon-Fri.
  // "All team" view always uses default — per-user work_days doesn't apply.
  const effectiveWorkDays = useMemo(() => {
    if (selectedUserId === "all") return [1, 2, 3, 4, 5];
    const cfg = selectedUserConfig || perfConfig;
    return (cfg?.work_days && cfg.work_days.length > 0) ? cfg.work_days : [1, 2, 3, 4, 5];
  }, [selectedUserId, selectedUserConfig, perfConfig]);

  const dateRange = useMemo(
    () => getDateRange(selectedPeriod, new Date(), effectiveWorkDays),
    [selectedPeriod, effectiveWorkDays],
  );
  const workingDaysInPeriod = useMemo(
    () => getWorkingDaysInPeriod(dateRange.start, dateRange.end, currentHolidaySettings),
    [dateRange, currentHolidaySettings],
  );

  // ── PERFORMANCE TAB: mix of calendar tasks + API summary ───────────────────
  const performanceMetrics = useMemo(() => {
    const filterTasks =
      selectedUserId === "all"
        ? apiTasks
        : apiTasks.filter((t) => t.assignee_id === selectedUserId);

    // Filter tasks in current date range
    const periodTasks = filterTasks.filter((t) => {
      const d = new Date(t.created_at);
      return d >= dateRange.start && d <= dateRange.end;
    });

    // Use list_statuses.type (status_type) as source of truth — t.status column is legacy
    // and doesn't reflect kanban moves. Fall back to t.status only if status_type is null.
    const bucketOf = (t: CalendarTaskRow): "in_progress" | "completed" | "backlog" | "other" => {
      const raw = (t.status_type || t.status || "").toLowerCase();
      if (["in_progress", "review", "paused", "blocked"].includes(raw)) return "in_progress";
      if (["done", "closed", "completed"].includes(raw)) return "completed";
      if (["open", "pending"].includes(raw)) return "backlog";
      return "other";
    };

    const assignedPoints   = perfSummary
      ? Number(perfSummary.assigned_points)
      : periodTasks.reduce((s, t) => s + (t.story_points ?? 0), 0);
    const inProgressPoints = periodTasks
      .filter((t) => bucketOf(t) === "in_progress")
      .reduce((s, t) => s + (t.story_points ?? 0), 0);
    const completedPoints  = perfSummary
      ? Number(perfSummary.completed_points)
      : periodTasks
          .filter((t) => bucketOf(t) === "completed")
          .reduce((s, t) => s + (t.story_points ?? 0), 0);
    const backlogPoints    = periodTasks
      .filter((t) => bucketOf(t) === "backlog")
      .reduce((s, t) => s + (t.story_points ?? 0), 0);

    // Target calculation — only for individual user view.
    // Target = point_target × ratio × (how many config-periods fit the selected period).
    // e.g. 40 pts/week × 0.8 → week view = 32, month view = 128 (×4 weeks).
    const cfg = selectedUserId === "all" ? null : selectedUserConfig;
    const ratio = cfg?.expected_ratio != null ? Number(cfg.expected_ratio) : 1;
    const daysPerWeek = cfg?.days_per_week != null ? Number(cfg.days_per_week) : 5;

    // Convert period → normalized weeks (approximate, but matches user intent: month = 4 weeks)
    const periodInWeeks = { day: 1 / daysPerWeek, week: 1, month: 4, quarter: 13, year: 52 };
    const selectedWeeks = periodInWeeks[selectedPeriod];

    let targetPoints = 0;
    let dailyTarget = 0;
    if (cfg?.point_target != null) {
      const pt = Number(cfg.point_target);
      const cfgWeeks = periodInWeeks[cfg.point_period] ?? 1;
      const periodScale = selectedWeeks / cfgWeeks;
      targetPoints = Math.round(pt * ratio * periodScale);
      // Daily target (for display only) — derived from config
      dailyTarget = (pt * ratio) / (cfgWeeks * daysPerWeek);
    }
    const performancePercent = targetPoints > 0 ? (completedPoints / targetPoints) * 100 : 0;

    return {
      cfg,
      ratio,
      assignedPoints,
      inProgressPoints,
      completedPoints,
      backlogPoints,
      targetPoints,
      performancePercent,
      dailyTarget:  Math.round(dailyTarget * 10) / 10,
      workingDays:  workingDaysInPeriod,
      totalTasks:   perfSummary?.total_tasks    ?? periodTasks.length,
      overdueTasks: perfSummary?.overdue_tasks  ?? 0,
      completionRate: perfSummary?.completion_rate ?? 0,
    };
  }, [apiTasks, selectedUserId, dateRange, perfSummary, selectedUserConfig, workingDaysInPeriod]);

  // ── VELOCITY TAB ──────────────────────────────────────────────────────────
  const velocityData = useMemo(() => {
    if (velocityRows.length === 0) return [];

    // Group by week_start, aggregate across employees if "all"
    const weekMap = new Map<string, { planned: number; completed: number; ratioSum: number; count: number }>();
    for (const row of velocityRows) {
      if (selectedUserId !== "all" && row.employee_id !== selectedUserId) continue;
      const existing = weekMap.get(row.week_start);
      const ratio = row.performance_ratio ? Number(row.performance_ratio) : 0;
      if (existing) {
        existing.planned   += Number(row.expected_points ?? 0);
        existing.completed += Number(row.actual_points);
        existing.ratioSum  += ratio;
        existing.count     += 1;
      } else {
        weekMap.set(row.week_start, {
          planned:   Number(row.expected_points ?? 0),
          completed: Number(row.actual_points),
          ratioSum:  ratio,
          count:     1,
        });
      }
    }

    return Array.from(weekMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([weekStart, agg]) => {
        const d = new Date(weekStart);
        return {
          period:     `W${getISOWeek(d)}`,
          planned:    agg.planned   || agg.completed,   // fallback to completed if no target
          completed:  agg.completed,
          efficiency: agg.count > 0
            ? Math.round((agg.ratioSum / agg.count) * 100)
            : (agg.planned > 0 ? Math.round((agg.completed / agg.planned) * 100) : 0),
        };
      });
  }, [velocityRows, selectedUserId]);

  const velocityStats = useMemo(() => {
    const completedValues = velocityData.map((d) => d.completed);
    if (completedValues.length === 0) return { average: 0, variance: 0, stability: 0 };
    const average = completedValues.reduce((a, b) => a + b, 0) / completedValues.length;
    const variance = Math.sqrt(
      completedValues.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) /
        completedValues.length,
    );
    const stability = average > 0 ? Math.max(0, 100 - (variance / average) * 100) : 0;
    return {
      average:   Math.round(average),
      variance:  Math.round(variance * 10) / 10,
      stability: Math.round(stability),
    };
  }, [velocityData]);

  // ── EFFICIENCY TAB ─────────────────────────────────────────────────────────
  const efficiencyData = useMemo(() => {
    // Per-task breakdown from calendar tasks (for the bar chart)
    const completedTasks = apiTasks.filter((t) => {
      const s = (t.status_type || t.status || "").toLowerCase();
      const isDone = s === "done" || s === "closed" || s === "completed";
      return (
        isDone &&
        t.time_estimate_hours &&
        t.accumulated_minutes > 0 &&
        (selectedUserId === "all" || t.assignee_id === selectedUserId)
      );
    });
    const taskChartData = completedTasks.slice(0, 10).map((task) => ({
      name:      task.title.substring(0, 15) + "…",
      estimated: Math.round((task.time_estimate_hours ?? 0)),
      actual:    Math.round(task.accumulated_minutes / 60),
      accuracy:  (task.time_estimate_hours ?? 0) > 0
        ? Math.round((task.accumulated_minutes / 60 / (task.time_estimate_hours ?? 1)) * 100)
        : 0,
    }));

    // Per-employee point density from API efficiency result
    const effRows = efficiencyResult?.data ?? [];
    const pointDensity = effRows
      .filter((r) => selectedUserId === "all" || r.employee_id === selectedUserId)
      .map((r) => ({
        user:               r.employee_name,
        avgMinutesPerPoint: r.avg_actual_hours > 0
          ? Math.round((r.avg_actual_hours * 60) / Math.max(1, r.total_tasks))
          : 0,
        taskCount:          r.total_tasks,
      }));

    const avgAccuracy = effRows.length > 0
      ? Math.round(
          effRows
            .filter((r) => r.accuracy_pct != null)
            .reduce((s, r) => s + Number(r.accuracy_pct ?? 0), 0) /
            Math.max(1, effRows.filter((r) => r.accuracy_pct != null).length),
        )
      : (taskChartData.length > 0
          ? Math.round(taskChartData.reduce((s, d) => s + d.accuracy, 0) / taskChartData.length)
          : 0);

    return { tasks: taskChartData, pointDensity, avgAccuracy };
  }, [apiTasks, efficiencyResult, selectedUserId]);

  // ── BOTTLENECK TAB ─────────────────────────────────────────────────────────
  const bottleneckData = useMemo(() => {
    // Status aging from API — empty array falls through to empty state in UI
    const statusAging = bottleneckRows.map((row) => ({
      status:       row.status_name,
      color:        row.color ?? "#6b7280",
      taskCount:    Number(row.task_count),
      avgDays:      Number(row.avg_days_stuck),
      isBottleneck: Number(row.avg_days_stuck) > 5 && Number(row.task_count) > 3,
    }));

    // Workload balance from team workload API
    const workloadRows = teamWorkload.filter(
      (r) => selectedUserId === "all" || r.id === selectedUserId,
    );
    const avgPoints =
      workloadRows.length > 0
        ? workloadRows.reduce((s, r) => s + Number(r.active_points), 0) / workloadRows.length
        : 0;

    const workloadBalance = workloadRows.map((r) => ({
      user:         r.name,
      avatar:       r.avatar_url,
      points:       Number(r.active_points),
      taskCount:    Number(r.active_tasks),
      isOverloaded:  Number(r.active_points) > avgPoints * 1.5,
      isUnderloaded: Number(r.active_points) < avgPoints * 0.5,
    }));

    return { statusAging, workloadBalance };
  }, [bottleneckRows, teamWorkload, selectedUserId]);

  // ── QUALITY TAB ────────────────────────────────────────────────────────────
  const qualityData = useMemo(() => {
    const effRows = efficiencyResult?.data ?? [];
    const totalCompleted = Number(perfSummary?.completed_tasks ?? 0);

    const qualityByUser = effRows
      .filter((r) => selectedUserId === "all" || r.employee_id === selectedUserId)
      .map((r) => {
        // Quality score: 100% if accuracy_pct is 80-120%, penalise outliers
        const acc = r.accuracy_pct != null ? Number(r.accuracy_pct) : null;
        let qualityScore = 100;
        if (acc != null) {
          if (acc > 150) qualityScore = Math.max(0, 100 - (acc - 150));
          else if (acc < 50) qualityScore = Math.max(0, acc);
          else qualityScore = Math.round(100 - Math.abs(100 - acc) * 0.5);
        }
        return {
          user:           r.employee_name,
          avatar:         r.avatar_url,
          completedTasks: r.total_tasks,
          reworkRate:     0,
          qualityScore,
        };
      })
      .sort((a, b) => b.qualityScore - a.qualityScore);

    return { totalCompleted, reworkCount: 0, reworkRate: 0, qualityByUser };
  }, [efficiencyResult, perfSummary, selectedUserId]);

  // ── TASK TYPE ANALYSIS ─────────────────────────────────────────────────────
  const taskTypeAnalysis = useMemo(() => {
    const scoped = apiTasks.filter(
      (t) => selectedUserId === "all" || t.assignee_id === selectedUserId,
    );
    const byType = new Map<string, { count: number; points: number }>();
    let untypedCount = 0;
    let untypedPoints = 0;
    for (const t of scoped) {
      const pts = Number(t.story_points ?? 0);
      if (!t.task_type_id) {
        untypedCount += 1;
        untypedPoints += pts;
        continue;
      }
      const prev = byType.get(t.task_type_id) ?? { count: 0, points: 0 };
      byType.set(t.task_type_id, { count: prev.count + 1, points: prev.points + pts });
    }

    const rows = taskTypes.map((tt) => {
      const agg = byType.get(tt.id) ?? { count: 0, points: 0 };
      return {
        name:            tt.name,
        color:           tt.color,
        taskCount:       agg.count,
        points:          agg.points,
        countsForPoints: tt.countsForPoints,
      };
    });
    if (untypedCount > 0) {
      rows.push({
        name:            language === "th" ? "ไม่ระบุประเภท" : "Untyped",
        color:           "#94a3b8",
        taskCount:       untypedCount,
        points:          untypedPoints,
        countsForPoints: false,
      });
    }
    return rows.sort((a, b) => b.taskCount - a.taskCount);
  }, [apiTasks, taskTypes, selectedUserId, language]);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Loading analytics…</p>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {language === "th" ? "การวิเคราะห์ประสิทธิภาพ" : "Performance Analytics"}
          </h1>
          <p className="text-muted-foreground">
            {language === "th"
              ? "ติดตามประสิทธิภาพและความคืบหน้าของทีม"
              : "Track your team's productivity and project progress"}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {tabLoading && (
            <p className="self-center text-sm text-muted-foreground animate-pulse">
              {language === "th" ? "กำลังโหลด…" : "Refreshing…"}
            </p>
          )}
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className="w-[180px]">
              <Users className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select user" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {language === "th" ? "ทั้งทีม" : "All Team"}
              </SelectItem>
              {(employees || []).map((emp) => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={selectedPeriod}
            onValueChange={(v) => setSelectedPeriod(v as typeof selectedPeriod)}
          >
            <SelectTrigger className="w-[150px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">{language === "th" ? "รายสัปดาห์" : "Weekly"}</SelectItem>
              <SelectItem value="month">{language === "th" ? "รายเดือน" : "Monthly"}</SelectItem>
              <SelectItem value="quarter">{language === "th" ? "รายไตรมาส" : "Quarterly"}</SelectItem>
              <SelectItem value="year">{language === "th" ? "รายปี" : "Yearly"}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
          <TabsTrigger value="performance" className="gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">
              {language === "th" ? "ประสิทธิภาพ" : "Performance"}
            </span>
          </TabsTrigger>
          <TabsTrigger value="velocity" className="gap-2">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">
              {language === "th" ? "ความเร็ว" : "Velocity"}
            </span>
          </TabsTrigger>
          <TabsTrigger value="efficiency" className="gap-2">
            <Timer className="h-4 w-4" />
            <span className="hidden sm:inline">
              {language === "th" ? "ความแม่นยำ" : "Efficiency"}
            </span>
          </TabsTrigger>
          <TabsTrigger value="bottleneck" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">
              {language === "th" ? "คอขวด" : "Bottleneck"}
            </span>
          </TabsTrigger>
          <TabsTrigger value="quality" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span className="hidden sm:inline">
              {language === "th" ? "คุณภาพ" : "Quality"}
            </span>
          </TabsTrigger>
        </TabsList>

        {/* ── Performance Tab ─────────────────────────────────────────────── */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Assigned Points
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performanceMetrics.assignedPoints}</div>
                <p className="text-xs text-muted-foreground">
                  {language === "th" ? "แต้มทั้งหมดที่ได้รับมอบหมาย" : "Total points assigned"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  In-Progress Points
                </CardTitle>
                <Activity className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-500">
                  {performanceMetrics.inProgressPoints}
                </div>
                <p className="text-xs text-muted-foreground">
                  {language === "th" ? "แต้มของงานที่กำลังทำ" : "Points in active work"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Completed Points
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">
                  {performanceMetrics.completedPoints}
                </div>
                <p className="text-xs text-muted-foreground">
                  {language === "th" ? "แต้มของงานที่เสร็จแล้ว" : "Points completed"}
                  {perfSummary && (
                    <span className="ml-1 text-green-600">
                      ({Math.round(Number(perfSummary.completion_rate))}% rate)
                    </span>
                  )}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Backlog Points
                </CardTitle>
                <Clock className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-500">
                  {performanceMetrics.backlogPoints}
                </div>
                <p className="text-xs text-muted-foreground">
                  {language === "th" ? "แต้มของงานที่ยังไม่เริ่ม" : "Points not started"}
                  {perfSummary && Number(perfSummary.overdue_tasks) > 0 && (
                    <span className="ml-1 text-red-500">
                      ({perfSummary.overdue_tasks} overdue)
                    </span>
                  )}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Performance Gauge & Target — only for individual user view */}
          {selectedUserId === "all" ? (
            <Card>
              <CardContent className="flex items-center gap-3 py-6 text-muted-foreground">
                <Users className="h-5 w-5 shrink-0" />
                <p className="text-sm">
                  {language === "th"
                    ? "เลือกพนักงานจาก dropdown ด้านบนเพื่อดู Target และ Performance % รายบุคคล (ภาพรวมทีมจะไม่แสดงเป้าหมาย เนื่องจากแต่ละคนมี target คนละระดับ)"
                    : "Select an employee from the dropdown above to view individual Target and Performance %. (Team-wide view hides targets since each person has different goals.)"}
                </p>
              </CardContent>
            </Card>
          ) : !performanceMetrics.cfg ? (
            <Card>
              <CardContent className="flex items-center gap-3 py-6 text-muted-foreground">
                <AlertCircle className="h-5 w-5 shrink-0 text-amber-500" />
                <p className="text-sm">
                  {language === "th" ? (
                    <>
                      ยังไม่ได้ตั้งค่า Performance Config สำหรับพนักงานคนนี้ —{" "}
                      <a href="/settings/performance" className="text-primary underline">
                        ไปตั้งค่า
                      </a>
                    </>
                  ) : (
                    <>
                      Performance Config not set for this employee —{" "}
                      <a href="/settings/performance" className="text-primary underline">
                        configure now
                      </a>
                    </>
                  )}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Performance %
                    {performanceMetrics.performancePercent >= 100 && (
                      <Badge className="bg-green-500 text-white hover:bg-green-500">
                        {language === "th" ? "ถึงเป้า" : "On Target"}
                      </Badge>
                    )}
                    {performanceMetrics.performancePercent >= 80 &&
                      performanceMetrics.performancePercent < 100 && (
                        <Badge variant="outline" className="border-blue-500 text-blue-600">
                          {language === "th" ? "ใกล้เป้า" : "Near Target"}
                        </Badge>
                      )}
                    {performanceMetrics.performancePercent < 80 && (
                      <Badge variant="outline" className="border-amber-500 text-amber-600">
                        {language === "th" ? "ต่ำกว่าเป้า" : "Below Target"}
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    (Completed / Target) × 100 —{" "}
                    {language === "th"
                      ? selectedPeriod === "week" ? "สัปดาห์นี้" : selectedPeriod === "month" ? "เดือนนี้" : selectedPeriod === "quarter" ? "ไตรมาสนี้" : "ปีนี้"
                      : `this ${selectedPeriod}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center gap-8">
                    <PerformanceGauge
                      value={performanceMetrics.performancePercent}
                      label={language === "th" ? "ประสิทธิภาพ" : "Performance"}
                    />
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {language === "th" ? "เสร็จแล้ว" : "Completed"}
                          </p>
                          <p className="text-xl font-bold">{performanceMetrics.completedPoints} pts</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                          <Target className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {language === "th" ? "เป้าหมาย" : "Target"}
                          </p>
                          <p className="text-xl font-bold">{performanceMetrics.targetPoints} pts</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                          {performanceMetrics.completedPoints >= performanceMetrics.targetPoints ? (
                            <TrendingUp className="h-5 w-5 text-green-500" />
                          ) : (
                            <TrendingDown className="h-5 w-5 text-amber-500" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {language === "th" ? "คงเหลือ" : "Remaining"}
                          </p>
                          <p className="text-xl font-bold">
                            {Math.max(0, performanceMetrics.targetPoints - performanceMetrics.completedPoints)} pts
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>
                    {language === "th" ? "การคำนวณ Target" : "Target Calculation"}
                  </CardTitle>
                  <CardDescription>
                    {language === "th"
                      ? "เป้าหมายทั้งช่วง = point target × ratio × จำนวน period ที่ครอบคลุม"
                      : "Full-period target = point target × ratio × periods covered"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">
                        {language === "th" ? "Config" : "Config"}
                      </p>
                      <p className="text-lg font-bold">{performanceMetrics.cfg.point_target}</p>
                      <p className="text-[10px] text-muted-foreground">
                        pts/{performanceMetrics.cfg.point_period}
                      </p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">
                        {language === "th" ? "Ratio" : "Ratio"}
                      </p>
                      <p className="text-lg font-bold">×{performanceMetrics.ratio.toFixed(2)}</p>
                      <p className="text-[10px] text-muted-foreground">expected</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">
                        {language === "th" ? "Period Scale" : "Period Scale"}
                      </p>
                      <p className="text-lg font-bold">
                        ×{(() => {
                          const weeks = { day: 1 / Number(performanceMetrics.cfg.days_per_week), week: 1, month: 4, quarter: 13, year: 52 };
                          const scale = weeks[selectedPeriod] / (weeks[performanceMetrics.cfg.point_period] ?? 1);
                          return scale % 1 === 0 ? scale : scale.toFixed(2);
                        })()}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {performanceMetrics.cfg.point_period} → {selectedPeriod}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-4">
                    <p className="text-sm font-medium mb-2">
                      {language === "th" ? "สูตรการคำนวณ" : "Formula"}
                    </p>
                    <code className="text-xs bg-background px-2 py-1 rounded block">
                      Target = {performanceMetrics.cfg.point_target} × {performanceMetrics.ratio.toFixed(2)}
                      {(() => {
                        const weeks = { day: 1 / Number(performanceMetrics.cfg.days_per_week), week: 1, month: 4, quarter: 13, year: 52 };
                        const scale = weeks[selectedPeriod] / (weeks[performanceMetrics.cfg.point_period] ?? 1);
                        return scale === 1 ? "" : ` × ${scale % 1 === 0 ? scale : scale.toFixed(2)}`;
                      })()}
                      {" = "}<strong>{performanceMetrics.targetPoints} pts</strong>
                    </code>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Task Type Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>
                {language === "th" ? "การวิเคราะห์ตาม Task Type" : "Analysis by Task Type"}
              </CardTitle>
              <CardDescription>
                {language === "th"
                  ? "แสดงจำนวน Task และ Points แยกตามประเภท (รวมถึงประเภทที่ไม่นับ Point)"
                  : "Shows task count and points by type (including non-counted types)"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {taskTypeAnalysis.map((tt) => (
                  <div
                    key={tt.name}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: tt.color }}
                      />
                      <div>
                        <p className="font-medium">{tt.name}</p>
                        <p className="text-xs text-muted-foreground">{tt.taskCount} tasks</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{tt.points} pts</p>
                      {!tt.countsForPoints && (
                        <Badge variant="secondary" className="text-xs">
                          {language === "th" ? "ไม่นับ Point" : "No Points"}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Velocity Tab ──────────────────────────────────────────────────── */}
        <TabsContent value="velocity" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {language === "th" ? "Average Velocity" : "Average Velocity"}
                </CardTitle>
                <Zap className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{velocityStats.average} SP</div>
                <p className="text-xs text-muted-foreground">
                  {language === "th" ? "ต่อสัปดาห์" : "per week"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {language === "th" ? "Variance" : "Variance"}
                </CardTitle>
                <Activity className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">±{velocityStats.variance}</div>
                <p className="text-xs text-muted-foreground">
                  {language === "th" ? "ค่าเบี่ยงเบน" : "deviation"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {language === "th" ? "Stability" : "Stability"}
                </CardTitle>
                <Gauge className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{velocityStats.stability}%</div>
                <Progress value={velocityStats.stability} className="mt-2 h-1" />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{language === "th" ? "Velocity Trend" : "Velocity Trend"}</CardTitle>
              <CardDescription>
                {language === "th"
                  ? "เปรียบเทียบ Points ที่วางแผนและทำเสร็จในแต่ละสัปดาห์ (8 สัปดาห์ล่าสุด)"
                  : "Comparing planned vs completed points per week (last 8 weeks)"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {velocityData.length === 0 ? (
                <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                  {language === "th"
                    ? "ยังไม่มีข้อมูล weekly reports — ลอง generate ก่อน"
                    : "No weekly report data — try generating reports first"}
                </div>
              ) : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={velocityData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="rounded-lg border bg-background p-3 shadow-sm">
                                <p className="mb-2 font-medium">{label}</p>
                                {payload.map((entry, index) => (
                                  <div key={index} className="flex items-center gap-2 text-sm">
                                    <div
                                      className="h-2 w-2 rounded-full"
                                      style={{ backgroundColor: entry.color }}
                                    />
                                    <span className="text-muted-foreground">{entry.name}:</span>
                                    <span className="font-medium">
                                      {entry.value}{entry.name === "Efficiency" ? "%" : " SP"}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend />
                      <Bar dataKey="planned"   name="Planned"    fill="#6b7280" radius={[4,4,0,0]} />
                      <Bar dataKey="completed" name="Completed"  fill="#3b82f6" radius={[4,4,0,0]} />
                      <Line
                        type="monotone"
                        dataKey="efficiency"
                        name="Efficiency"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ fill: "#10b981" }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Efficiency Tab ────────────────────────────────────────────────── */}
        <TabsContent value="efficiency" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {language === "th" ? "Estimate vs Actual Time" : "Estimate vs Actual Time"}
              </CardTitle>
              <CardDescription>
                {language === "th"
                  ? "เปรียบเทียบเวลาที่ประมาณการกับเวลาจริง"
                  : "Comparing estimated hours vs actual hours spent"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center gap-4">
                <Badge variant="outline" className="gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  {language === "th" ? "ค่าเฉลี่ยความแม่นยำ" : "Avg Accuracy"}:{" "}
                  {efficiencyData.avgAccuracy}%
                </Badge>
              </div>
              {efficiencyData.tasks.length === 0 ? (
                <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                  {language === "th" ? "ยังไม่มีข้อมูล" : "No data for this period"}
                </div>
              ) : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={efficiencyData.tasks} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={100} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="rounded-lg border bg-background p-3 shadow-sm">
                                {payload.map((entry, index) => (
                                  <div key={index} className="flex items-center gap-2 text-sm">
                                    <span className="text-muted-foreground">{entry.name}:</span>
                                    <span className="font-medium">{entry.value}h</span>
                                  </div>
                                ))}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend />
                      <Bar dataKey="estimated" name="Estimated" fill="#6b7280" radius={[0,4,4,0]} />
                      <Bar dataKey="actual"    name="Actual"    fill="#3b82f6" radius={[0,4,4,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{language === "th" ? "Point Density" : "Point Density"}</CardTitle>
              <CardDescription>
                {language === "th"
                  ? "เวลาเฉลี่ยที่ใช้ต่อ 1 Task ของแต่ละคน (จาก API)"
                  : "Average minutes spent per task by user (from API)"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {efficiencyData.pointDensity.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {language === "th" ? "ยังไม่มีข้อมูล" : "No data available"}
                </p>
              ) : (
                <div className="space-y-4">
                  {efficiencyData.pointDensity.map((pd) => (
                    <div key={pd.user} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{pd.user.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{pd.user}</p>
                          <p className="text-xs text-muted-foreground">
                            {pd.taskCount} tasks completed
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{pd.avgMinutesPerPoint} min/task</p>
                        <p className="text-xs text-muted-foreground">
                          ({Math.round((pd.avgMinutesPerPoint / 60) * 10) / 10} hr/task)
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Bottleneck Tab ────────────────────────────────────────────────── */}
        <TabsContent value="bottleneck" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{language === "th" ? "Status Aging" : "Status Aging"}</CardTitle>
              <CardDescription>
                {language === "th"
                  ? "งานค้างอยู่ที่แต่ละ Status นานเท่าไร (เฉลี่ย จาก API)"
                  : "Average days tasks spend in each status (from API)"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {bottleneckData.statusAging.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {language === "th" ? "ยังไม่มีข้อมูล" : "No active tasks found"}
                </p>
              ) : (
                <div className="space-y-4">
                  {bottleneckData.statusAging.map((status) => (
                    <div key={status.status} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: status.color }}
                          />
                          <span className="font-medium">{status.status}</span>
                          {status.isBottleneck && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertTriangle className="mr-1 h-3 w-3" />
                              {language === "th" ? "คอขวด" : "Bottleneck"}
                            </Badge>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="font-bold">{status.avgDays} days</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            ({status.taskCount} tasks)
                          </span>
                        </div>
                      </div>
                      <Progress
                        value={Math.min(100, status.avgDays * 10)}
                        className={`h-2 ${status.isBottleneck ? "bg-red-100" : ""}`}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{language === "th" ? "Workload Balance" : "Workload Balance"}</CardTitle>
              <CardDescription>
                {language === "th"
                  ? "ดูว่าใครมีงานมากหรือน้อยเกินไป (จาก API)"
                  : "Check if anyone is overloaded or underloaded (from API)"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {bottleneckData.workloadBalance.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {language === "th" ? "ยังไม่มีข้อมูล" : "No workload data available"}
                </p>
              ) : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={bottleneckData.workloadBalance}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="user" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0]?.payload;
                            return (
                              <div className="rounded-lg border bg-background p-3 shadow-sm">
                                <p className="font-medium">{d.user}</p>
                                <p className="text-sm text-muted-foreground">
                                  {d.points} points, {d.taskCount} tasks
                                </p>
                                {d.isOverloaded && (
                                  <Badge variant="destructive" className="mt-1">Overloaded</Badge>
                                )}
                                {d.isUnderloaded && (
                                  <Badge variant="secondary" className="mt-1">Underloaded</Badge>
                                )}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="points" name="Active Points" radius={[4,4,0,0]}>
                        {bottleneckData.workloadBalance.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              entry.isOverloaded
                                ? "#ef4444"
                                : entry.isUnderloaded
                                ? "#6b7280"
                                : "#3b82f6"
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Quality Tab ───────────────────────────────────────────────────── */}
        <TabsContent value="quality" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {language === "th" ? "Tasks Completed" : "Tasks Completed"}
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{qualityData.totalCompleted}</div>
                <p className="text-xs text-muted-foreground">
                  {language === "th" ? "งานที่เสร็จแล้ว" : "tasks done"}
                </p>
              </CardContent>
            </Card>

            <Card className="opacity-60">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {language === "th" ? "Rework Count" : "Rework Count"}
                </CardTitle>
                <RefreshCcw className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-muted-foreground">—</div>
                <p className="text-xs text-muted-foreground">
                  {language === "th" ? "ยังไม่มีข้อมูล (รอ backend)" : "Not tracked yet"}
                </p>
              </CardContent>
            </Card>

            <Card className="opacity-60">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {language === "th" ? "Rework Rate" : "Rework Rate"}
                </CardTitle>
                <AlertCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-muted-foreground">—</div>
                <p className="text-xs text-muted-foreground">
                  {language === "th" ? "ยังไม่มีข้อมูล (รอ backend)" : "Not tracked yet"}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                {language === "th" ? "Quality Score by User" : "Quality Score by User"}
              </CardTitle>
              <CardDescription>
                {language === "th"
                  ? "คะแนนคุณภาพ = ความแม่นยำในการประมาณเวลา (จาก API)"
                  : "Quality Score derived from time estimate accuracy (from API)"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {qualityData.qualityByUser.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {language === "th" ? "ยังไม่มีข้อมูล" : "No data for this period"}
                </p>
              ) : (
                <div className="space-y-4">
                  {qualityData.qualityByUser.map((user) => (
                    <div key={user.user} className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar ?? undefined} />
                        <AvatarFallback>{user.user.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{user.user}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{user.qualityScore}%</span>
                            {user.qualityScore >= 90 ? (
                              <ArrowUpRight className="h-4 w-4 text-green-500" />
                            ) : user.qualityScore < 75 ? (
                              <ArrowDownRight className="h-4 w-4 text-red-500" />
                            ) : null}
                          </div>
                        </div>
                        <Progress
                          value={user.qualityScore}
                          className={`h-2 ${
                            user.qualityScore >= 90
                              ? "bg-green-100"
                              : user.qualityScore < 75
                              ? "bg-red-100"
                              : ""
                          }`}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {user.completedTasks} tasks
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
