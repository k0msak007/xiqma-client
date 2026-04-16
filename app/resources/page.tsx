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
  isSameDay,
  differenceInDays,
} from "date-fns";
import { ChevronLeft, ChevronRight, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { employeesApi, type Employee } from "@/lib/api/employees";
import { tasksApi, type CalendarTaskRow } from "@/lib/api/tasks";
import { toast } from "sonner";

type ViewMode = "week" | "2weeks" | "month";

export default function ResourcesPage() {
  const [employees, setEmployees]       = useState<Employee[]>([]);
  const [tasks, setTasks]               = useState<CalendarTaskRow[]>([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [currentDate, setCurrentDate]   = useState(new Date());
  const [viewMode, setViewMode]         = useState<ViewMode>("2weeks");
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
      try {
        const startStr = format(dateRange.start, "yyyy-MM-dd");
        const endStr   = format(dateRange.end,   "yyyy-MM-dd");
        const [empRes, taskRows] = await Promise.all([
          employeesApi.listAll(),
          tasksApi.calendar(startStr, endStr),
        ]);
        setEmployees(empRes.filter((e) => e.isActive));
        setTasks(taskRows);
      } catch {
        toast.error("โหลดข้อมูลไม่สำเร็จ");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, viewMode]);

  // ─── Helpers ──────────────────────────────────────────────────────────────
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

  /** Gantt bar position & width (% of total days) */
  const getBarStyle = (task: CalendarTaskRow) => {
    let startDate: Date;
    let endDate: Date;

    if (task.plan_start && task.duration_days) {
      startDate = new Date(task.plan_start);
      endDate   = addDays(startDate, task.duration_days);
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
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold">Resources</h1>
          <Badge variant="secondary" className="font-normal">Gantt Chart</Badge>
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
      </div>

      {/* Gantt */}
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center text-muted-foreground">
          Loading…
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* User Column */}
          <div className="w-[200px] shrink-0 border-r bg-muted/30">
            <div className="h-16 border-b px-4 py-2 flex items-end">
              <span className="text-sm font-medium text-muted-foreground">Team Member</span>
            </div>
            {filteredEmployees.map((emp) => (
              <div key={emp.id} className="flex items-center gap-3 border-b px-4 py-3 h-[80px]">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={emp.avatarUrl ?? undefined} />
                  <AvatarFallback>{emp.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{emp.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {(userTasksMap[emp.id]?.length ?? 0)} task{(userTasksMap[emp.id]?.length ?? 0) !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Timeline */}
          <ScrollArea className="flex-1">
            <div className="min-w-[800px]">
              {/* Date Headers */}
              <div className="flex h-16 border-b">
                {days.map((day, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "flex-1 flex flex-col items-center justify-center border-r text-center",
                      isToday(day) && "bg-primary/10"
                    )}
                  >
                    <span className="text-xs text-muted-foreground">{format(day, "EEE")}</span>
                    <span className={cn("text-sm font-medium", isToday(day) && "text-primary")}>
                      {format(day, "d")}
                    </span>
                  </div>
                ))}
              </div>

              {/* Task Rows */}
              {filteredEmployees.map((emp) => {
                const empTasks = userTasksMap[emp.id] ?? [];
                return (
                  <div key={emp.id} className="relative flex h-[80px] border-b">
                    {/* Grid lines */}
                    {days.map((day, idx) => (
                      <div key={idx} className={cn("flex-1 border-r", isToday(day) && "bg-primary/5")} />
                    ))}
                    {/* Task bars */}
                    <div className="absolute inset-0 p-2 flex flex-col gap-1 overflow-hidden">
                      {empTasks.slice(0, 3).map((task, idx) => {
                        const style = getBarStyle(task);
                        const barColor = task.status_color ?? "#6b7280";
                        const dur = task.duration_days ?? (
                          task.plan_start && task.plan_finish
                            ? differenceInDays(new Date(task.plan_finish), new Date(task.plan_start))
                            : null
                        );
                        return (
                          <div
                            key={task.id}
                            className="absolute h-6 rounded px-2 flex items-center gap-1 text-xs text-white truncate cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
                            style={{
                              left:            style.left,
                              width:           style.width,
                              top:             `${8 + idx * 24}px`,
                              backgroundColor: barColor,
                            }}
                            title={`${task.title} — ${task.status_name ?? task.status}${dur ? ` (${dur}d)` : ""}`}
                          >
                            <span className="truncate font-medium">{task.title}</span>
                            {dur && (
                              <Badge variant="secondary" className="h-4 px-1 text-[10px] bg-white/20 text-white shrink-0">
                                {dur}d
                              </Badge>
                            )}
                          </div>
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
          <span className="text-xs text-muted-foreground">Status Colors:</span>
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
  );
}
