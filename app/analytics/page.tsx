"use client";

import { useState, useMemo } from "react";
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
import { users, lists, getUserById, getRoleById } from "@/lib/mock-data";
import { priorityConfig, isHoliday, getWorkingDays, calculatePointSplit } from "@/lib/types";
import type { HolidaySettings, Task, User } from "@/lib/types";
import { useTranslation } from "@/lib/i18n";
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

// Helper to get the holiday settings for a specific year
function getHolidaySettingsForYear(
  holidaySettings: HolidaySettings[],
  year: number
): HolidaySettings {
  return (
    holidaySettings.find((hs) => hs.year === year) || {
      year,
      weekendDays: [0, 6],
      specialHolidays: [],
    }
  );
}

// Helper to calculate working days in a period
function getWorkingDaysInPeriod(
  startDate: Date,
  endDate: Date,
  holidaySettings: HolidaySettings
): number {
  let workingDays = 0;
  const current = new Date(startDate);

  while (current <= endDate) {
    if (!isHoliday(current, holidaySettings)) {
      workingDays++;
    }
    current.setDate(current.getDate() + 1);
  }

  return workingDays;
}

// Helper to get date range based on period
function getDateRange(
  period: "week" | "month" | "quarter" | "year",
  referenceDate: Date = new Date()
): { start: Date; end: Date } {
  const start = new Date(referenceDate);
  const end = new Date(referenceDate);

  switch (period) {
    case "week":
      // Start of week (Monday)
      const dayOfWeek = start.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      start.setDate(start.getDate() + diff);
      start.setHours(0, 0, 0, 0);
      // End of week (Sunday)
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;
    case "month":
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "quarter":
      const quarter = Math.floor(start.getMonth() / 3);
      start.setMonth(quarter * 3, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(quarter * 3 + 3, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "year":
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(11, 31);
      end.setHours(23, 59, 59, 999);
      break;
  }

  return { start, end };
}

// Performance Gauge Component
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

export default function AnalyticsPage() {
  const { tasks, users: storeUsers, roles, holidaySettings, taskTypes } = useTaskStore();
  const { t, language } = useTranslation();
  
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month" | "quarter" | "year">("week");
  const [selectedUserId, setSelectedUserId] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("performance");

  // Get current holiday settings
  const currentYear = new Date().getFullYear();
  const currentHolidaySettings = getHolidaySettingsForYear(holidaySettings, currentYear);
  
  // Calculate date range
  const dateRange = useMemo(() => getDateRange(selectedPeriod), [selectedPeriod]);
  const workingDaysInPeriod = useMemo(
    () => getWorkingDaysInPeriod(dateRange.start, dateRange.end, currentHolidaySettings),
    [dateRange, currentHolidaySettings]
  );

  // Individual Performance Metrics
  const performanceMetrics = useMemo(() => {
    const filterTasks = selectedUserId === "all" 
      ? tasks 
      : tasks.filter((t) => t.assigneeIds.includes(selectedUserId));

    // Point Status calculations
    const assignedPoints = filterTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
    const inProgressPoints = filterTasks
      .filter((t) => t.statusId === "status-2" || t.statusId === "status-3")
      .reduce((sum, t) => sum + (t.storyPoints || 0), 0);
    const completedPoints = filterTasks
      .filter((t) => t.statusId === "status-4" || t.statusId === "status-5")
      .reduce((sum, t) => sum + (t.storyPoints || 0), 0);
    const backlogPoints = filterTasks
      .filter((t) => t.statusId === "status-1")
      .reduce((sum, t) => sum + (t.storyPoints || 0), 0);

    // Calculate target based on user's role
    let dailyTarget = 8; // Default 8 points per day
    if (selectedUserId !== "all") {
      const user = storeUsers.find((u) => u.id === selectedUserId);
      if (user?.roleId) {
        const role = roles.find((r) => r.id === user.roleId);
        if (role?.pointTarget) {
          // Convert role target to daily target
          switch (role.pointTarget.period) {
            case "day":
              dailyTarget = role.pointTarget.totalPoints;
              break;
            case "week":
              dailyTarget = role.pointTarget.totalPoints / 5; // Assume 5 working days
              break;
            case "month":
              dailyTarget = role.pointTarget.totalPoints / 22; // Assume 22 working days
              break;
            case "year":
              dailyTarget = role.pointTarget.totalPoints / 260; // Assume 260 working days
              break;
          }
        }
      }
    }

    const targetPoints = dailyTarget * workingDaysInPeriod;
    const performancePercent = targetPoints > 0 ? (completedPoints / targetPoints) * 100 : 0;

    return {
      assignedPoints,
      inProgressPoints,
      completedPoints,
      backlogPoints,
      targetPoints: Math.round(targetPoints),
      performancePercent,
      dailyTarget: Math.round(dailyTarget * 10) / 10,
      workingDays: workingDaysInPeriod,
    };
  }, [tasks, selectedUserId, storeUsers, roles, workingDaysInPeriod]);

  // Velocity Analysis Data
  const velocityData = useMemo(() => {
    // Generate weekly velocity data for last 6 periods
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i * 7);
      const range = getDateRange("week", date);
      
      const periodTasks = tasks.filter((t) => {
        const taskDate = t.completedAt ? new Date(t.completedAt) : null;
        return taskDate && taskDate >= range.start && taskDate <= range.end;
      });

      const completed = periodTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
      const planned = completed + Math.floor(Math.random() * 10); // Simulated planned

      data.push({
        period: `W${date.getWeek ? date.getWeek() : Math.ceil(date.getDate() / 7)}`,
        planned,
        completed,
        efficiency: planned > 0 ? Math.round((completed / planned) * 100) : 0,
      });
    }
    return data;
  }, [tasks]);

  // Calculate average velocity and variance
  const velocityStats = useMemo(() => {
    const completedValues = velocityData.map((d) => d.completed);
    const average = completedValues.reduce((a, b) => a + b, 0) / completedValues.length;
    const variance = Math.sqrt(
      completedValues.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / completedValues.length
    );
    const stability = average > 0 ? Math.max(0, 100 - (variance / average) * 100) : 0;

    return {
      average: Math.round(average),
      variance: Math.round(variance * 10) / 10,
      stability: Math.round(stability),
    };
  }, [velocityData]);

  // Efficiency Analysis - Estimate vs Actual
  const efficiencyData = useMemo(() => {
    const completedTasks = tasks.filter(
      (t) =>
        (t.statusId === "status-4" || t.statusId === "status-5") &&
        t.timeEstimate &&
        t.timeSpent
    );

    const data = completedTasks.slice(0, 10).map((task) => ({
      name: task.title.substring(0, 15) + "...",
      estimated: Math.round((task.timeEstimate || 0) / 60),
      actual: Math.round((task.timeSpent || 0) / 60),
      accuracy:
        task.timeEstimate && task.timeEstimate > 0
          ? Math.round((task.timeSpent! / task.timeEstimate) * 100)
          : 0,
    }));

    // Point density calculation (minutes per story point)
    const pointDensity: { user: string; avgMinutesPerPoint: number; taskCount: number }[] = [];
    
    users.forEach((user) => {
      const userTasks = completedTasks.filter((t) => t.assigneeIds.includes(user.id));
      const totalMinutes = userTasks.reduce((sum, t) => sum + (t.timeSpent || 0), 0);
      const totalPoints = userTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
      
      if (totalPoints > 0) {
        pointDensity.push({
          user: user.name,
          avgMinutesPerPoint: Math.round(totalMinutes / totalPoints),
          taskCount: userTasks.length,
        });
      }
    });

    const avgAccuracy =
      data.length > 0
        ? Math.round(data.reduce((sum, d) => sum + d.accuracy, 0) / data.length)
        : 0;

    return { tasks: data, pointDensity, avgAccuracy };
  }, [tasks]);

  // Bottleneck Analysis - Status Aging
  const bottleneckData = useMemo(() => {
    const defaultList = lists[0];
    if (!defaultList) return { statusAging: [], workloadBalance: [] };

    // Calculate average time spent in each status
    const statusAging = defaultList.statuses.map((status) => {
      const tasksInStatus = tasks.filter((t) => t.statusId === status.id);
      const avgDays = tasksInStatus.length > 0
        ? Math.round(
            tasksInStatus.reduce((sum, t) => {
              const created = new Date(t.createdAt);
              const now = new Date();
              return sum + Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
            }, 0) / tasksInStatus.length
          )
        : 0;

      return {
        status: status.name,
        color: status.color,
        taskCount: tasksInStatus.length,
        avgDays,
        isBottleneck: avgDays > 5 && tasksInStatus.length > 3,
      };
    });

    // Workload balance
    const workloadBalance = users.map((user) => {
      const userTasks = tasks.filter((t) => t.assigneeIds.includes(user.id));
      const activePoints = userTasks
        .filter((t) => t.statusId !== "status-4" && t.statusId !== "status-5")
        .reduce((sum, t) => sum + (t.storyPoints || 0), 0);

      return {
        user: user.name,
        avatar: user.avatar,
        points: activePoints,
        taskCount: userTasks.length,
      };
    }).sort((a, b) => b.points - a.points);

    const avgPoints =
      workloadBalance.length > 0
        ? workloadBalance.reduce((sum, w) => sum + w.points, 0) / workloadBalance.length
        : 0;

    return {
      statusAging,
      workloadBalance: workloadBalance.map((w) => ({
        ...w,
        isOverloaded: w.points > avgPoints * 1.5,
        isUnderloaded: w.points < avgPoints * 0.5,
      })),
    };
  }, [tasks]);

  // Quality Score - Rework Rate
  const qualityData = useMemo(() => {
    // Simulate rework data (tasks that moved back from review to in-progress)
    const completedTasks = tasks.filter(
      (t) => t.statusId === "status-4" || t.statusId === "status-5"
    );
    
    // Simulated rework rate based on task type
    const reworkTasks = completedTasks.filter(() => Math.random() < 0.15); // 15% rework rate
    const reworkRate = completedTasks.length > 0
      ? Math.round((reworkTasks.length / completedTasks.length) * 100)
      : 0;

    // Quality by user (simulated)
    const qualityByUser = users.map((user) => {
      const userCompletedTasks = completedTasks.filter((t) =>
        t.assigneeIds.includes(user.id)
      );
      const userReworkRate = Math.floor(Math.random() * 25); // 0-25% simulated

      return {
        user: user.name,
        avatar: user.avatar,
        completedTasks: userCompletedTasks.length,
        reworkRate: userReworkRate,
        qualityScore: 100 - userReworkRate,
      };
    }).sort((a, b) => b.qualityScore - a.qualityScore);

    return {
      totalCompleted: completedTasks.length,
      reworkCount: reworkTasks.length,
      reworkRate,
      qualityByUser,
    };
  }, [tasks]);

  // Tasks by task type with point counting info
  const taskTypeAnalysis = useMemo(() => {
    return taskTypes.map((tt) => {
      const typeTasks = tasks.filter((t) => t.taskTypeId === tt.id);
      const points = typeTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
      
      return {
        name: tt.name,
        color: tt.color,
        taskCount: typeTasks.length,
        points,
        countsForPoints: tt.countsForPoints,
      };
    });
  }, [tasks, taskTypes]);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
  };

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
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className="w-[180px]">
              <Users className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select user" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {language === "th" ? "ทั้งทีม" : "All Team"}
              </SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as typeof selectedPeriod)}>
            <SelectTrigger className="w-[150px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">
                {language === "th" ? "รายสัปดาห์" : "Weekly"}
              </SelectItem>
              <SelectItem value="month">
                {language === "th" ? "รายเดือน" : "Monthly"}
              </SelectItem>
              <SelectItem value="quarter">
                {language === "th" ? "รายไตรมาส" : "Quarterly"}
              </SelectItem>
              <SelectItem value="year">
                {language === "th" ? "รายปี" : "Yearly"}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tab Navigation */}
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

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          {/* Point Status Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {language === "th" ? "Assigned Points" : "Assigned Points"}
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
                  {language === "th" ? "In-Progress Points" : "In-Progress Points"}
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
                  {language === "th" ? "Completed Points" : "Completed Points"}
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">
                  {performanceMetrics.completedPoints}
                </div>
                <p className="text-xs text-muted-foreground">
                  {language === "th" ? "แต้มของงานที่เสร็จแล้ว" : "Points completed"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {language === "th" ? "Backlog Points" : "Backlog Points"}
                </CardTitle>
                <Clock className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-500">
                  {performanceMetrics.backlogPoints}
                </div>
                <p className="text-xs text-muted-foreground">
                  {language === "th" ? "แต้มของงานที่ยังไม่เริ่ม" : "Points not started"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Performance Gauge & Target */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>
                  {language === "th" ? "Performance %" : "Performance %"}
                </CardTitle>
                <CardDescription>
                  {language === "th"
                    ? "(Completed Points / Target Points) × 100"
                    : "(Completed Points / Target Points) × 100"}
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
                    ? "คำนวณจากวันทำงานจริง (หักวันหยุด)"
                    : "Calculated from actual working days (minus holidays)"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">
                      {language === "th" ? "Daily Target" : "Daily Target"}
                    </p>
                    <p className="text-2xl font-bold">{performanceMetrics.dailyTarget}</p>
                    <p className="text-xs text-muted-foreground">points/day</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">
                      {language === "th" ? "วันทำงาน" : "Working Days"}
                    </p>
                    <p className="text-2xl font-bold">{performanceMetrics.workingDays}</p>
                    <p className="text-xs text-muted-foreground">
                      {language === "th" ? `ใน${selectedPeriod === "week" ? "สัปดาห์" : selectedPeriod === "month" ? "เดือน" : selectedPeriod === "quarter" ? "ไตรมาส" : "ปี"}นี้` : `in this ${selectedPeriod}`}
                    </p>
                  </div>
                </div>
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-sm font-medium mb-2">
                    {language === "th" ? "สูตรการคำนวณ" : "Formula"}
                  </p>
                  <code className="text-xs bg-background px-2 py-1 rounded">
                    Target = Daily Target × Working Days = {performanceMetrics.dailyTarget} × {performanceMetrics.workingDays} = {performanceMetrics.targetPoints} pts
                  </code>
                </div>
              </CardContent>
            </Card>
          </div>

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
                        <p className="text-xs text-muted-foreground">
                          {tt.taskCount} tasks
                        </p>
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

        {/* Velocity Tab */}
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
              <CardTitle>
                {language === "th" ? "Velocity Trend" : "Velocity Trend"}
              </CardTitle>
              <CardDescription>
                {language === "th"
                  ? "เปรียบเทียบ Points ที่วางแผนและทำเสร็จในแต่ละสัปดาห์"
                  : "Comparing planned vs completed points per week"}
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                                    {entry.value} {entry.name === "Efficiency" ? "%" : "SP"}
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
                    <Bar dataKey="planned" name="Planned" fill="#6b7280" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="completed" name="Completed" fill="#3b82f6" radius={[4, 4, 0, 0]} />
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Efficiency Tab */}
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
                  {language === "th" ? "ค่าเฉลี่ยความแม่นยำ" : "Avg Accuracy"}: {efficiencyData.avgAccuracy}%
                </Badge>
              </div>
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
                    <Bar dataKey="estimated" name="Estimated" fill="#6b7280" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="actual" name="Actual" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                {language === "th" ? "Point Density" : "Point Density"}
              </CardTitle>
              <CardDescription>
                {language === "th"
                  ? "เวลาเฉลี่ยที่ใช้ต่อ 1 Story Point ของแต่ละคน"
                  : "Average minutes spent per story point by user"}
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                      <p className="font-bold">{pd.avgMinutesPerPoint} min/pt</p>
                      <p className="text-xs text-muted-foreground">
                        ({Math.round(pd.avgMinutesPerPoint / 60 * 10) / 10} hr/pt)
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bottleneck Tab */}
        <TabsContent value="bottleneck" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {language === "th" ? "Status Aging" : "Status Aging"}
              </CardTitle>
              <CardDescription>
                {language === "th"
                  ? "งานค้างอยู่ที่แต่ละ Status นานเท่าไร (เฉลี่ย)"
                  : "Average days tasks spend in each status"}
              </CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                {language === "th" ? "Workload Balance" : "Workload Balance"}
              </CardTitle>
              <CardDescription>
                {language === "th"
                  ? "ดูว่าใครมีงานมากหรือน้อยเกินไป"
                  : "Check if anyone is overloaded or underloaded"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bottleneckData.workloadBalance}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="user" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="rounded-lg border bg-background p-3 shadow-sm">
                              <p className="font-medium">{data.user}</p>
                              <p className="text-sm text-muted-foreground">
                                {data.points} points, {data.taskCount} tasks
                              </p>
                              {data.isOverloaded && (
                                <Badge variant="destructive" className="mt-1">Overloaded</Badge>
                              )}
                              {data.isUnderloaded && (
                                <Badge variant="secondary" className="mt-1">Underloaded</Badge>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="points"
                      name="Active Points"
                      radius={[4, 4, 0, 0]}
                    >
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quality Tab */}
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

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {language === "th" ? "Rework Count" : "Rework Count"}
                </CardTitle>
                <RefreshCcw className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{qualityData.reworkCount}</div>
                <p className="text-xs text-muted-foreground">
                  {language === "th" ? "งานที่ถูกตีกลับ" : "tasks sent back"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {language === "th" ? "Rework Rate" : "Rework Rate"}
                </CardTitle>
                <AlertCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{qualityData.reworkRate}%</div>
                <Progress
                  value={qualityData.reworkRate}
                  className="mt-2 h-1"
                />
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
                  ? "คะแนนคุณภาพ = 100 - Rework Rate"
                  : "Quality Score = 100 - Rework Rate"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {qualityData.qualityByUser.map((user) => (
                  <div key={user.user} className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar} />
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
                        {user.completedTasks} tasks, {user.reworkRate}% rework
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
