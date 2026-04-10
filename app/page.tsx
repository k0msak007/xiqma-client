"use client";

import { useMemo } from "react";
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
import { useTaskStore } from "@/lib/store";
import { users, activities, getUserById } from "@/lib/mock-data";
import { priorityConfig } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
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

export default function DashboardPage() {
  const { tasks, lists } = useTaskStore();

  // Calculate stats
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.statusId === "status-4" || t.statusId === "status-5").length;
    const inProgress = tasks.filter((t) => t.statusId === "status-2").length;
    const overdue = tasks.filter(
      (t) =>
        t.dueDate &&
        new Date(t.dueDate) < new Date() &&
        t.statusId !== "status-4" &&
        t.statusId !== "status-5"
    ).length;

    return {
      total,
      completed,
      inProgress,
      overdue,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [tasks]);

  // Tasks by status for pie chart
  const tasksByStatus = useMemo(() => {
    const statusCounts = tasks.reduce(
      (acc, task) => {
        acc[task.statusId] = (acc[task.statusId] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const defaultList = lists[0];
    return defaultList?.statuses.map((status) => ({
      name: status.name,
      value: statusCounts[status.id] || 0,
      color: status.color,
    })) || [];
  }, [tasks, lists]);

  // Tasks by priority for bar chart
  const tasksByPriority = useMemo(() => {
    const priorityCounts = tasks.reduce(
      (acc, task) => {
        acc[task.priority] = (acc[task.priority] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return Object.entries(priorityConfig).map(([key, config]) => ({
      name: config.label,
      count: priorityCounts[key] || 0,
      color: config.color,
    }));
  }, [tasks]);

  // Due soon tasks
  const dueSoonTasks = useMemo(() => {
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return tasks
      .filter(
        (t) =>
          t.dueDate &&
          new Date(t.dueDate) <= weekFromNow &&
          t.statusId !== "status-4" &&
          t.statusId !== "status-5"
      )
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
      .slice(0, 5);
  }, [tasks]);

  // Recent activities
  const recentActivities = useMemo(() => {
    return [...activities]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, []);

  const getActivityText = (activity: (typeof activities)[0]) => {
    const user = getUserById(activity.userId);
    const task = tasks.find((t) => t.id === activity.taskId);

    switch (activity.type) {
      case "created":
        return (
          <>
            <span className="font-medium">{user?.name}</span> created{" "}
            <span className="font-medium">{task?.title}</span>
          </>
        );
      case "completed":
        return (
          <>
            <span className="font-medium">{user?.name}</span> completed{" "}
            <span className="font-medium">{task?.title}</span>
          </>
        );
      case "status_changed":
        return (
          <>
            <span className="font-medium">{user?.name}</span> moved{" "}
            <span className="font-medium">{task?.title}</span> from {activity.previousValue} to{" "}
            {activity.newValue}
          </>
        );
      case "assigned":
        return (
          <>
            <span className="font-medium">{user?.name}</span> assigned{" "}
            <span className="font-medium">{task?.title}</span> to {activity.newValue}
          </>
        );
      default:
        return null;
    }
  };

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
          <Link href="/list/list-1">
            View All Tasks
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Tasks
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completed} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Progress
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">Active tasks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overdue
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.overdue}</div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completion Rate
            </CardTitle>
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
                              <div
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: data.color }}
                              />
                              <span className="text-sm font-medium">{data.name}</span>
                              <span className="text-sm text-muted-foreground">
                                {data.value}
                              </span>
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
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: status.color }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {status.name} ({status.value})
                  </span>
                </div>
              ))}
            </div>
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
                              <span className="text-sm text-muted-foreground">
                                {data.count} tasks
                              </span>
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
                  const assignee = task.assigneeIds[0]
                    ? getUserById(task.assigneeIds[0])
                    : null;
                  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

                  return (
                    <Link
                      key={task.id}
                      href={`/list/${task.listId}?task=${task.id}`}
                      className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        {assignee && (
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={assignee.avatar} />
                            <AvatarFallback>
                              {assignee.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div>
                          <p className="text-sm font-medium">{task.title}</p>
                          <p
                            className={`text-xs ${
                              isOverdue ? "text-red-500" : "text-muted-foreground"
                            }`}
                          >
                            {isOverdue ? "Overdue" : "Due"}{" "}
                            {formatDistanceToNow(new Date(task.dueDate!), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        style={{
                          borderColor: priorityConfig[task.priority].color,
                          color: priorityConfig[task.priority].color,
                        }}
                      >
                        {priorityConfig[task.priority].label}
                      </Badge>
                    </Link>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => {
                const user = getUserById(activity.userId);

                return (
                  <div key={activity.id} className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatar} />
                      <AvatarFallback>{user?.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm leading-relaxed">
                        {getActivityText(activity)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Team Workload</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
            {users.map((user) => {
              const userTasks = tasks.filter((t) => t.assigneeIds.includes(user.id));
              const activeTasks = userTasks.filter(
                (t) => t.statusId !== "status-4" && t.statusId !== "status-5"
              );

              return (
                <div
                  key={user.id}
                  className="flex flex-col items-center gap-2 rounded-lg border p-4"
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.role}</p>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span className="rounded bg-muted px-2 py-1">
                      {activeTasks.length} active
                    </span>
                    <span className="rounded bg-muted px-2 py-1">
                      {userTasks.length} total
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
