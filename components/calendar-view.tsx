"use client";

import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, isWithinInterval, differenceInDays } from "date-fns";
import { th, enUS } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, GanttChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import type { Task, Status } from "@/lib/types";
import { calculatePlanFinish } from "@/lib/types";

interface CalendarViewProps {
  tasks: Task[];
  statuses: Status[];
  onTaskClick: (taskId: string) => void;
}

type ViewMode = "plan" | "duedate";

export function CalendarView({ tasks, statuses, onTaskClick }: CalendarViewProps) {
  const { language } = useTranslation();
  const locale = language === "th" ? th : enUS;
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("plan");

  const getStatusColor = (statusId: string) => {
    const status = statuses.find(s => s.id === statusId);
    return status?.color || "#6b7280";
  };

  const getStatusName = (statusId: string) => {
    const status = statuses.find(s => s.id === statusId);
    return status?.name || "Unknown";
  };

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const days: Date[] = [];
    let day = calendarStart;
    while (day <= calendarEnd) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentMonth]);

  // Get tasks for Plan View (with planStart and duration as bars)
  const taskBars = useMemo(() => {
    if (viewMode === "duedate") return [];

    return tasks
      .filter(t => t.planStart && t.duration)
      .map(task => {
        const planStart = new Date(task.planStart!);
        const planFinish = calculatePlanFinish(task.planStart, task.duration);
        return {
          ...task,
          planStart,
          planFinish: planFinish || planStart,
        };
      });
  }, [tasks, viewMode]);

  // Get tasks for Due Date View
  const dueDateTasks = useMemo(() => {
    if (viewMode !== "duedate") return [];
    return tasks.filter(t => t.dueDate);
  }, [tasks, viewMode]);

  // Check if a bar spans across a specific day
  const getBarForDay = (day: Date, taskBar: typeof taskBars[0]) => {
    const start = new Date(taskBar.planStart);
    start.setHours(0, 0, 0, 0);
    const end = new Date(taskBar.planFinish);
    end.setHours(23, 59, 59, 999);
    const checkDay = new Date(day);
    checkDay.setHours(12, 0, 0, 0);

    return isWithinInterval(checkDay, { start, end });
  };

  // Check if day is the start of a bar
  const isBarStart = (day: Date, taskBar: typeof taskBars[0]) => {
    return isSameDay(day, taskBar.planStart);
  };

  // Check if day is the end of a bar
  const isBarEnd = (day: Date, taskBar: typeof taskBars[0]) => {
    return isSameDay(day, taskBar.planFinish);
  };

  // Get tasks with due date on a specific day
  const getTasksForDueDate = (day: Date) => {
    return dueDateTasks.filter(t => {
      const dueDate = new Date(t.dueDate!);
      return isSameDay(day, dueDate);
    });
  };

  // Calculate bar width for a task starting on this day
  const getBarDuration = (taskBar: typeof taskBars[0]) => {
    return differenceInDays(taskBar.planFinish, taskBar.planStart) + 1;
  };

  const weekDays = language === "th" 
    ? ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold min-w-[200px] text-center">
            {format(currentMonth, "MMMM yyyy", { locale })}
          </h2>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentMonth(new Date())}
          >
            {language === "th" ? "วันนี้" : "Today"}
          </Button>
        </div>

        {/* View Mode Toggle */}
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
          <TabsList>
            <TabsTrigger value="plan" className="gap-2">
              <GanttChart className="h-4 w-4" />
              {language === "th" ? "แผนงาน" : "Plan"}
            </TabsTrigger>
            <TabsTrigger value="duedate" className="gap-2">
              <CalendarIcon className="h-4 w-4" />
              {language === "th" ? "กำหนดส่ง" : "Due Date"}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
          {/* Week day headers */}
          {weekDays.map((day, i) => (
            <div
              key={i}
              className="bg-muted p-2 text-center text-sm font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {calendarDays.map((day, dayIndex) => {
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());
            const dayDueTasks = viewMode === "duedate" ? getTasksForDueDate(day) : [];

            // Get bars that span this day (Plan view)
            const barsOnDay = viewMode === "plan" 
              ? taskBars.filter(bar => getBarForDay(day, bar))
              : [];

            return (
              <div
                key={dayIndex}
                className={cn(
                  "min-h-[120px] bg-background p-1 relative",
                  !isCurrentMonth && "bg-muted/50 text-muted-foreground"
                )}
              >
                {/* Date number */}
                <div
                  className={cn(
                    "text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full",
                    isToday && "bg-primary text-primary-foreground"
                  )}
                >
                  {format(day, "d")}
                </div>

                {/* Plan View - Task Bars */}
                {viewMode === "plan" && (
                  <div className="space-y-0.5">
                    {barsOnDay.slice(0, 4).map((taskBar, idx) => {
                      const isStart = isBarStart(day, taskBar);
                      const isEnd = isBarEnd(day, taskBar);
                      const statusColor = getStatusColor(taskBar.statusId);
                      
                      return (
                        <TooltipProvider key={taskBar.id}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                onClick={() => onTaskClick(taskBar.id)}
                                className={cn(
                                  "h-6 cursor-pointer text-white text-xs font-medium flex items-center overflow-hidden transition-opacity hover:opacity-80",
                                  isStart && "rounded-l pl-1.5",
                                  isEnd && "rounded-r",
                                  !isStart && "pl-0.5",
                                  !isEnd && "-mr-1"
                                )}
                                style={{ 
                                  backgroundColor: statusColor,
                                  marginTop: idx * 2 + "px"
                                }}
                              >
                                {isStart && (
                                  <span className="truncate">
                                    {taskBar.taskId} {taskBar.title}
                                  </span>
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <div className="space-y-1">
                                <p className="font-semibold">{taskBar.taskId}: {taskBar.title}</p>
                                <p className="text-xs">
                                  {language === "th" ? "สถานะ" : "Status"}: {getStatusName(taskBar.statusId)}
                                </p>
                                <p className="text-xs">
                                  {format(taskBar.planStart, "d MMM", { locale })} - {format(taskBar.planFinish, "d MMM yyyy", { locale })}
                                </p>
                                <p className="text-xs">
                                  {language === "th" ? "ระยะเวลา" : "Duration"}: {taskBar.duration} {language === "th" ? "วัน" : "days"}
                                </p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    })}
                    {barsOnDay.length > 4 && (
                      <div className="text-xs text-muted-foreground pl-1">
                        +{barsOnDay.length - 4} {language === "th" ? "งาน" : "more"}
                      </div>
                    )}
                  </div>
                )}

                {/* Due Date View - Task chips */}
                {viewMode === "duedate" && (
                  <div className="space-y-0.5">
                    {dayDueTasks.slice(0, 4).map((task) => {
                      const statusColor = getStatusColor(task.statusId);
                      return (
                        <TooltipProvider key={task.id}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                onClick={() => onTaskClick(task.id)}
                                className="h-5 rounded px-1.5 cursor-pointer text-white text-xs font-medium flex items-center overflow-hidden transition-opacity hover:opacity-80"
                                style={{ backgroundColor: statusColor }}
                              >
                                <span className="truncate">
                                  {task.taskId} {task.title}
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <div className="space-y-1">
                                <p className="font-semibold">{task.taskId}: {task.title}</p>
                                <p className="text-xs">
                                  {language === "th" ? "สถานะ" : "Status"}: {getStatusName(task.statusId)}
                                </p>
                                <p className="text-xs">
                                  {language === "th" ? "กำหนดส่ง" : "Due"}: {format(new Date(task.dueDate!), "d MMM yyyy", { locale })}
                                </p>
                                {task.storyPoints && (
                                  <p className="text-xs">
                                    {language === "th" ? "คะแนน" : "Points"}: {task.storyPoints}
                                  </p>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    })}
                    {dayDueTasks.length > 4 && (
                      <div className="text-xs text-muted-foreground pl-1">
                        +{dayDueTasks.length - 4} {language === "th" ? "งาน" : "more"}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 items-center">
          <span className="text-sm font-medium text-muted-foreground">
            {language === "th" ? "สถานะ:" : "Status:"}
          </span>
          {statuses.map(status => (
            <div key={status.id} className="flex items-center gap-1.5">
              <div 
                className="w-3 h-3 rounded"
                style={{ backgroundColor: status.color }}
              />
              <span className="text-sm">{status.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
