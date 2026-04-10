"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  addDays,
  differenceInDays,
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isWeekend,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
} from "date-fns";
import { th, enUS } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Filter,
  Link2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useTaskStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";
import { calculatePlanFinish, priorityConfig, type Task } from "@/lib/types";
import { getUserById } from "@/lib/mock-data";
import { useRouter } from "next/navigation";

type ZoomLevel = "day" | "week" | "month";

export default function GanttChartPage() {
  const router = useRouter();
  const { tasks, users, spaces, lists, statuses, taskTypes } = useTaskStore();
  const { t, language } = useTranslation();
  const locale = language === "th" ? th : enUS;
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>("day");
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>("all");
  const [selectedListId, setSelectedListId] = useState<string>("all");
  const [showDependencies, setShowDependencies] = useState(true);

  // Calculate date range based on zoom level
  const dateRange = useMemo(() => {
    if (zoomLevel === "day") {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = addDays(start, 27); // 4 weeks
      return { start, end };
    } else if (zoomLevel === "week") {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(addMonths(currentDate, 2)); // 3 months
      return { start, end };
    } else {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(addMonths(currentDate, 11)); // 12 months
      return { start, end };
    }
  }, [currentDate, zoomLevel]);

  const dates = useMemo(() => {
    return eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
  }, [dateRange]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    let filtered = tasks.filter((task) => task.planStart);

    if (selectedSpaceId !== "all") {
      const spaceLists = lists.filter((l) => l.spaceId === selectedSpaceId);
      const listIds = spaceLists.map((l) => l.id);
      filtered = filtered.filter((t) => listIds.includes(t.listId));
    }

    if (selectedListId !== "all") {
      filtered = filtered.filter((t) => t.listId === selectedListId);
    }

    // Sort by planStart date
    return filtered.sort((a, b) => {
      const dateA = a.planStart ? new Date(a.planStart).getTime() : 0;
      const dateB = b.planStart ? new Date(b.planStart).getTime() : 0;
      return dateA - dateB;
    });
  }, [tasks, selectedSpaceId, selectedListId, lists]);

  // Calculate cell width based on zoom level
  const getCellWidth = () => {
    switch (zoomLevel) {
      case "day":
        return 40;
      case "week":
        return 20;
      case "month":
        return 10;
    }
  };

  const cellWidth = getCellWidth();

  // Get task bar position and width
  const getTaskBarStyle = (task: Task) => {
    if (!task.planStart) return null;

    const start = new Date(task.planStart);
    const finish = calculatePlanFinish(start, task.duration || 1) || start;
    
    const startOffset = differenceInDays(start, dateRange.start);
    const duration = differenceInDays(finish, start) + 1;

    // Only show if within view
    if (startOffset + duration < 0 || startOffset > dates.length) return null;

    const left = Math.max(0, startOffset * cellWidth);
    const width = Math.min(
      Math.max(duration, 1) * cellWidth,
      (dates.length - Math.max(0, startOffset)) * cellWidth
    );

    return { left, width };
  };

  // Get status color
  const getStatusColor = (statusId: string) => {
    const status = statuses.find((s) => s.id === statusId);
    return status?.color || "#6b7280";
  };

  // Get task type color
  const getTaskTypeColor = (taskTypeId?: string) => {
    if (!taskTypeId) return "#6b7280";
    const taskType = taskTypes.find((t) => t.id === taskTypeId);
    return taskType?.color || "#6b7280";
  };

  // Navigation
  const navigatePrevious = () => {
    if (zoomLevel === "day") {
      setCurrentDate(addDays(currentDate, -7));
    } else if (zoomLevel === "week") {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 3));
    }
  };

  const navigateNext = () => {
    if (zoomLevel === "day") {
      setCurrentDate(addDays(currentDate, 7));
    } else if (zoomLevel === "week") {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 3));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get predecessor tasks
  const getPredecessors = (task: Task) => {
    if (!task.predecessorIds || task.predecessorIds.length === 0) return [];
    return tasks.filter((t) => task.predecessorIds?.includes(t.id));
  };

  // Calculate dependency line coordinates
  const getDependencyLines = (task: Task, taskIndex: number) => {
    const predecessors = getPredecessors(task);
    if (predecessors.length === 0) return [];

    const taskStyle = getTaskBarStyle(task);
    if (!taskStyle) return [];

    return predecessors
      .map((pred) => {
        const predIndex = filteredTasks.findIndex((t) => t.id === pred.id);
        if (predIndex === -1) return null;

        const predStyle = getTaskBarStyle(pred);
        if (!predStyle) return null;

        return {
          x1: predStyle.left + predStyle.width,
          y1: predIndex * 48 + 24,
          x2: taskStyle.left,
          y2: taskIndex * 48 + 24,
        };
      })
      .filter(Boolean);
  };

  // Lists for selected space
  const spaceLists = useMemo(() => {
    if (selectedSpaceId === "all") return lists;
    return lists.filter((l) => l.spaceId === selectedSpaceId);
  }, [selectedSpaceId, lists]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {language === "th" ? "Gantt Chart" : "Gantt Chart"}
          </h1>
          <p className="text-muted-foreground">
            {language === "th"
              ? "ดูภาพรวมกำหนดการและความสัมพันธ์ของงาน"
              : "View task schedules and dependencies"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Space Filter */}
          <Select value={selectedSpaceId} onValueChange={setSelectedSpaceId}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={language === "th" ? "เลือก Space" : "Select Space"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {language === "th" ? "ทั้งหมด" : "All Spaces"}
              </SelectItem>
              {spaces.map((space) => (
                <SelectItem key={space.id} value={space.id}>
                  {space.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* List Filter */}
          <Select value={selectedListId} onValueChange={setSelectedListId}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={language === "th" ? "เลือก List" : "Select List"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {language === "th" ? "ทั้งหมด" : "All Lists"}
              </SelectItem>
              {spaceLists.map((list) => (
                <SelectItem key={list.id} value={list.id}>
                  {list.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Show Dependencies Toggle */}
          <Button
            variant={showDependencies ? "default" : "outline"}
            size="sm"
            onClick={() => setShowDependencies(!showDependencies)}
            className="gap-2"
          >
            <Link2 className="h-4 w-4" />
            {language === "th" ? "ความสัมพันธ์" : "Dependencies"}
          </Button>
        </div>
      </div>

      {/* Navigation & Zoom */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={navigatePrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={goToToday}>
            {language === "th" ? "วันนี้" : "Today"}
          </Button>
          <Button variant="outline" size="icon" onClick={navigateNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-lg font-medium">
          {format(dateRange.start, "d MMM yyyy", { locale })} -{" "}
          {format(dateRange.end, "d MMM yyyy", { locale })}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              if (zoomLevel === "month") setZoomLevel("week");
              else if (zoomLevel === "week") setZoomLevel("day");
            }}
            disabled={zoomLevel === "day"}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Select value={zoomLevel} onValueChange={(v) => setZoomLevel(v as ZoomLevel)}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">
                {language === "th" ? "วัน" : "Day"}
              </SelectItem>
              <SelectItem value="week">
                {language === "th" ? "สัปดาห์" : "Week"}
              </SelectItem>
              <SelectItem value="month">
                {language === "th" ? "เดือน" : "Month"}
              </SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              if (zoomLevel === "day") setZoomLevel("week");
              else if (zoomLevel === "week") setZoomLevel("month");
            }}
            disabled={zoomLevel === "month"}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Gantt Chart */}
      <Card className="flex-1 overflow-hidden">
        <CardContent className="p-0 h-full">
          <div className="flex h-full">
            {/* Task List Panel */}
            <div className="w-72 border-r flex-shrink-0 overflow-hidden flex flex-col">
              {/* Header */}
              <div className="h-14 border-b bg-muted/50 flex items-center px-4 font-medium">
                {language === "th" ? "งาน" : "Task"}
              </div>
              {/* Task List */}
              <div className="flex-1 overflow-y-auto">
                {filteredTasks.map((task, index) => {
                  const assignees = task.assigneeIds
                    .map((id) => getUserById(id))
                    .filter(Boolean);
                  const hasPredecessors =
                    task.predecessorIds && task.predecessorIds.length > 0;

                  return (
                    <div
                      key={task.id}
                      className="h-12 border-b flex items-center px-4 gap-2 hover:bg-muted/30 cursor-pointer group"
                      onClick={() => router.push(`/task/${task.id}`)}
                    >
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: getStatusColor(task.statusId) }}
                      />
                      <div className="flex-1 min-w-0">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="text-sm truncate">{task.title}</div>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              <div className="max-w-xs">
                                <p className="font-medium">{task.title}</p>
                                {task.description && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {task.description}
                                  </p>
                                )}
                                {hasPredecessors && (
                                  <div className="mt-2 text-xs">
                                    <span className="text-muted-foreground">
                                      {language === "th" ? "ต้องรอ: " : "Waiting for: "}
                                    </span>
                                    {getPredecessors(task)
                                      .map((p) => p.title)
                                      .join(", ")}
                                  </div>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          {hasPredecessors && (
                            <Link2 className="h-3 w-3 text-amber-500" />
                          )}
                          {task.planStart && (
                            <span>
                              {format(new Date(task.planStart), "d MMM", { locale })}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex -space-x-1">
                        {assignees.slice(0, 2).map((user) => (
                          <Avatar key={user!.id} className="h-5 w-5 border border-background">
                            <AvatarImage src={user!.avatar} />
                            <AvatarFallback className="text-[8px]">
                              {user!.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/task/${task.id}`);
                        }}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
                {filteredTasks.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    {language === "th"
                      ? "ไม่มีงานที่มี Plan Start"
                      : "No tasks with Plan Start date"}
                  </div>
                )}
              </div>
            </div>

            {/* Gantt Chart Panel */}
            <div className="flex-1 overflow-hidden flex flex-col" ref={scrollContainerRef}>
              {/* Timeline Header */}
              <div className="h-14 border-b bg-muted/50 overflow-x-auto flex-shrink-0">
                <div
                  className="flex h-full"
                  style={{ width: dates.length * cellWidth }}
                >
                  {dates.map((date, idx) => {
                    const isToday = isSameDay(date, new Date());
                    const isWeekendDay = isWeekend(date);
                    const showMonth =
                      idx === 0 || date.getDate() === 1;

                    return (
                      <div
                        key={date.toISOString()}
                        className={cn(
                          "flex flex-col items-center justify-center border-r text-xs",
                          isWeekendDay && "bg-muted/30",
                          isToday && "bg-primary/10"
                        )}
                        style={{ width: cellWidth, minWidth: cellWidth }}
                      >
                        {showMonth && zoomLevel === "day" && (
                          <span className="text-[10px] text-muted-foreground">
                            {format(date, "MMM", { locale })}
                          </span>
                        )}
                        <span className={cn("font-medium", isToday && "text-primary")}>
                          {zoomLevel === "day"
                            ? format(date, "d")
                            : zoomLevel === "week"
                            ? format(date, "d")
                            : format(date, "d")}
                        </span>
                        {zoomLevel === "day" && (
                          <span className="text-[10px] text-muted-foreground">
                            {format(date, "EEE", { locale })}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Chart Area */}
              <div className="flex-1 overflow-auto relative">
                {/* Grid Background */}
                <div
                  className="absolute inset-0"
                  style={{ width: dates.length * cellWidth }}
                >
                  {dates.map((date, idx) => {
                    const isToday = isSameDay(date, new Date());
                    const isWeekendDay = isWeekend(date);

                    return (
                      <div
                        key={date.toISOString()}
                        className={cn(
                          "absolute top-0 bottom-0 border-r",
                          isWeekendDay && "bg-muted/20",
                          isToday && "bg-primary/5"
                        )}
                        style={{
                          left: idx * cellWidth,
                          width: cellWidth,
                        }}
                      />
                    );
                  })}

                  {/* Today Line */}
                  {dates.some((d) => isSameDay(d, new Date())) && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-primary z-10"
                      style={{
                        left:
                          differenceInDays(new Date(), dateRange.start) * cellWidth +
                          cellWidth / 2,
                      }}
                    />
                  )}
                </div>

                {/* Task Bars */}
                <div
                  className="relative"
                  style={{
                    width: dates.length * cellWidth,
                    height: filteredTasks.length * 48,
                  }}
                >
                  {/* Dependency Lines */}
                  {showDependencies && (
                    <svg
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        width: dates.length * cellWidth,
                        height: filteredTasks.length * 48,
                      }}
                    >
                      {filteredTasks.map((task, index) => {
                        const lines = getDependencyLines(task, index);
                        return lines.map((line, lineIdx) => {
                          if (!line) return null;
                          const midX = (line.x1 + line.x2) / 2;
                          return (
                            <g key={`${task.id}-${lineIdx}`}>
                              <path
                                d={`M ${line.x1} ${line.y1} 
                                   C ${midX} ${line.y1}, ${midX} ${line.y2}, ${line.x2} ${line.y2}`}
                                fill="none"
                                stroke="#f59e0b"
                                strokeWidth="2"
                                strokeDasharray="4 2"
                                opacity={0.6}
                              />
                              <circle
                                cx={line.x2}
                                cy={line.y2}
                                r={4}
                                fill="#f59e0b"
                                opacity={0.8}
                              />
                            </g>
                          );
                        });
                      })}
                    </svg>
                  )}

                  {/* Task Bars */}
                  {filteredTasks.map((task, index) => {
                    const style = getTaskBarStyle(task);
                    if (!style) return null;

                    const status = statuses.find((s) => s.id === task.statusId);
                    const progress = task.estimateProgress || 0;

                    return (
                      <TooltipProvider key={task.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className="absolute h-8 rounded cursor-pointer hover:opacity-80 transition-opacity group"
                              style={{
                                left: style.left,
                                top: index * 48 + 8,
                                width: style.width,
                                backgroundColor: `${getTaskTypeColor(task.taskTypeId)}30`,
                                border: `2px solid ${getTaskTypeColor(task.taskTypeId)}`,
                              }}
                              onClick={() => router.push(`/task/${task.id}`)}
                            >
                              {/* Progress Fill */}
                              <div
                                className="absolute inset-0 rounded-sm"
                                style={{
                                  width: `${progress}%`,
                                  backgroundColor: `${getTaskTypeColor(task.taskTypeId)}50`,
                                }}
                              />
                              {/* Task Title */}
                              <div className="absolute inset-0 flex items-center px-2 text-xs font-medium truncate">
                                {style.width > 60 && task.title}
                              </div>
                              {/* Status dot */}
                              <div
                                className="absolute right-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                                style={{ backgroundColor: status?.color }}
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <div className="text-sm">
                              <p className="font-medium">{task.title}</p>
                              <p className="text-muted-foreground">
                                {task.planStart &&
                                  format(new Date(task.planStart), "d MMM yyyy", { locale })}
                                {task.duration && task.duration > 1 && (
                                  <>
                                    {" - "}
                                    {format(
                                      calculatePlanFinish(
                                        new Date(task.planStart!),
                                        task.duration
                                      )!,
                                      "d MMM yyyy",
                                      { locale }
                                    )}
                                  </>
                                )}
                              </p>
                              <p className="text-muted-foreground">
                                {language === "th" ? "ความคืบหน้า: " : "Progress: "}
                                {progress}%
                              </p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-primary" />
          <span className="text-muted-foreground">
            {language === "th" ? "วันนี้" : "Today"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-muted/30 border border-dashed" />
          <span className="text-muted-foreground">
            {language === "th" ? "วันหยุด" : "Weekend"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <svg width="20" height="10">
            <path
              d="M 0 5 C 10 5, 10 5, 20 5"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2"
              strokeDasharray="4 2"
            />
          </svg>
          <span className="text-muted-foreground">
            {language === "th" ? "ความสัมพันธ์งาน (Predecessor)" : "Task Dependency"}
          </span>
        </div>
      </div>
    </div>
  );
}
