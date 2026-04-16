"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  CalendarDays,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { tasksApi, type MyTasksRow, type CalendarTaskRow } from "@/lib/api/tasks";
import { employeesApi, type Employee } from "@/lib/api/employees";
import { priorityConfig } from "@/lib/types";
import { formatDistanceToNow, startOfMonth, endOfMonth, format } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

const STATUS_COLORS: Record<string, string> = {
  open:        "#6b7280",
  in_progress: "#3b82f6",
  review:      "#f59e0b",
  done:        "#10b981",
  closed:      "#6366f1",
};
const STATUS_LABELS: Record<string, string> = {
  open:        "Open",
  in_progress: "In Progress",
  review:      "Review",
  done:        "Done",
  closed:      "Closed",
};

export default function DashboardPage() {
  const [myTasks,    setMyTasks]    = useState<MyTasksRow[]>([]);
  const [teamTasks,  setTeamTasks]  = useState<CalendarTaskRow[]>([]);
  const [employees,  setEmployees]  = useState<Employee[]>([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    const now      = new Date();
    const startStr = format(startOfMonth(now), "yyyy-MM-dd");
    const endStr   = format(endOfMonth(now),   "yyyy-MM-dd");

    Promise.all([
      tasksApi.myTasks(),
      tasksApi.calendar(startStr, endStr),
      employeesApi.list({ limit: 100, isActive: true }),
    ])
      .then(([my, cal, emp]) => {
        setMyTasks(my);
        setTeamTasks(cal);
        setEmployees(emp.rows);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total      = myTasks.length;
    const completed  = myTasks.filter((t) => t.status === "done" || t.status === "closed").length;
    const inProgress = myTasks.filter((t) => t.status === "in_progress").length;
    const overdue    = myTasks.filter(
      (t) =>
        t.deadline &&
        new Date(t.deadline) < new Date() &&
        t.status !== "done" &&
        t.status !== "closed",
    ).length;
    return {
      total,
      completed,
      inProgress,
      overdue,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [myTasks]);

  // ── Pie chart ─────────────────────────────────────────────────────────────
  const tasksByStatus = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of myTasks) counts[t.status] = (counts[t.status] || 0) + 1;
    return Object.entries(STATUS_LABELS)
      .map(([key, name]) => ({ name, value: counts[key] || 0, color: STATUS_COLORS[key] }))
      .filter((s) => s.value > 0);
  }, [myTasks]);

  // ── Bar chart ────────────────────────────────────────────────────────────
  const tasksByPriority = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of myTasks) counts[t.priority] = (counts[t.priority] || 0) + 1;
    return Object.entries(priorityConfig).map(([key, cfg]) => ({
      name:  cfg.label,
      count: counts[key] || 0,
      color: cfg.color,
    }));
  }, [myTasks]);

  // ── Due soon ──────────────────────────────────────────────────────────────
  const dueSoonTasks = useMemo(() => {
    const now         = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return myTasks
      .filter(
        (t) =>
          t.deadline &&
          new Date(t.deadline) <= weekFromNow &&
          t.status !== "done" &&
          t.status !== "closed",
      )
      .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
      .slice(0, 5);
  }, [myTasks]);

  // ── Recent tasks ──────────────────────────────────────────────────────────
  const recentTasks = useMemo(
    () =>
      [...myTasks]
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 5),
    [myTasks],
  );

  // ── Team workload (calendar tasks this month) ─────────────────────────────
  const teamWorkload = useMemo(() => {
    const map: Record<string, { name: string; avatar: string | null; active: number; total: number }> = {};

    for (const task of teamTasks) {
      const id = task.assignee_id;
      if (!id) continue;
      if (!map[id]) map[id] = { name: task.assignee_name, avatar: task.assignee_avatar, active: 0, total: 0 };
      map[id].total++;
      if (task.status !== "done" && task.status !== "closed") map[id].active++;
    }
    // pad with employees who have no tasks this month
    if (Array.isArray(employees)) {
      for (const emp of employees) {
        if (!map[emp.id])
          map[emp.id] = { name: emp.name, avatar: emp.avatarUrl, active: 0, total: 0 };
      }
    }
    return Object.entries(map)
      .map(([id, d]) => ({ id, ...d }))
      .sort((a, b) => b.active - a.active)
      .slice(0, 10);
  }, [teamTasks, employees]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Loading dashboard…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s an overview of your projects.
          </p>
        </div>
        <Button asChild>
          <Link href="/my-tasks">
            View My Tasks
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tasks</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">{stats.completed} completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">Active tasks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.overdue}</div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completionRate}%</div>
            <Progress value={stats.completionRate} className="mt-2 h-1" />
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Tasks by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tasks by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {tasksByStatus.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No tasks yet</p>
            ) : (
              <>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={tasksByStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {tasksByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="rounded-lg border bg-background p-2 shadow-sm">
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: data.color }} />
                                  <span className="text-sm font-medium">{data.name}</span>
                                  <span className="text-sm text-muted-foreground">{data.value}</span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  {tasksByStatus.map((status) => (
                    <div key={status.name} className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: status.color }} />
                      <span className="text-xs text-muted-foreground">
                        {status.name} ({status.value})
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Tasks by Priority */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tasks by Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tasksByPriority} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={60}
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{data.name}</span>
                              <span className="text-sm text-muted-foreground">{data.count} tasks</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {tasksByPriority.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Due Soon */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Due Soon</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dueSoonTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No upcoming deadlines</p>
              ) : (
                dueSoonTasks.map((task) => {
                  const isOverdue = task.deadline && new Date(task.deadline) < new Date();
                  const pCfg =
                    priorityConfig[task.priority as keyof typeof priorityConfig] ?? {
                      color: "#6b7280",
                      label: task.priority,
                    };

                  return (
                    <Link
                      key={task.id}
                      href={`/task/${task.id}`}
                      className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={task.assignee_avatar ?? undefined} />
                          <AvatarFallback>{task.assignee_name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{task.title}</p>
                          <p className={`text-xs ${isOverdue ? "text-red-500" : "text-muted-foreground"}`}>
                            {isOverdue ? "Overdue" : "Due"}{" "}
                            {formatDistanceToNow(new Date(task.deadline!), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        style={{ borderColor: pCfg.color, color: pCfg.color }}
                      >
                        {pCfg.label}
                      </Badge>
                    </Link>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tasks yet</p>
              ) : (
                recentTasks.map((task) => (
                  <Link
                    key={task.id}
                    href={`/task/${task.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-2 w-2 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor:
                            task.status_color ?? STATUS_COLORS[task.status] ?? "#6b7280",
                        }}
                      />
                      <div>
                        <p className="text-sm font-medium">{task.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {task.status_name ?? STATUS_LABELS[task.status] ?? task.status}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(task.updated_at), { addSuffix: true })}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Workload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Team Workload (This Month)</CardTitle>
        </CardHeader>
        <CardContent>
          {teamWorkload.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data available</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
              {teamWorkload.map((member) => (
                <div
                  key={member.id}
                  className="flex flex-col items-center gap-2 rounded-lg border p-4"
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={member.avatar ?? undefined} />
                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <p className="text-sm font-medium">{member.name}</p>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span className="rounded bg-muted px-2 py-1">{member.active} active</span>
                    <span className="rounded bg-muted px-2 py-1">{member.total} total</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
