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
  addMonths,
  subMonths,
} from "date-fns";
import { th, enUS } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { tasksApi, type CalendarTaskRow } from "@/lib/api/tasks";
import { spacesApi, type Space } from "@/lib/api/spaces";
import { listsApi, type List } from "@/lib/api/lists";
import { useRouter } from "next/navigation";

type ZoomLevel = "day" | "week" | "month";

const STATUS_COLORS: Record<string, string> = {
  open:        "#6b7280",
  in_progress: "#3b82f6",
  review:      "#f59e0b",
  done:        "#10b981",
  closed:      "#6366f1",
};

export default function GanttChartPage() {
  const router = useRouter();
  const { language } = useTranslation();
  const locale = language === "th" ? th : enUS;
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [currentDate,     setCurrentDate]     = useState(new Date());
  const [zoomLevel,       setZoomLevel]        = useState<ZoomLevel>("day");
  const [selectedSpaceId, setSelectedSpaceId]  = useState<string>("all");
  const [selectedListId,  setSelectedListId]   = useState<string>("all");

  const [tasks,     setTasks]     = useState<CalendarTaskRow[]>([]);
  const [spaces,    setSpaces]    = useState<Space[]>([]);
  const [allLists,  setAllLists]  = useState<List[]>([]);
  const [loading,   setLoading]   = useState(true);

  // ── date range for calendar query (wide: 2 years around today) ────────────
  const queryRange = useMemo(() => {
    const start = format(addMonths(new Date(), -6),  "yyyy-MM-dd");
    const end   = format(addMonths(new Date(),  18), "yyyy-MM-dd");
    return { start, end };
  }, []);

  // ── Load data ─────────────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    Promise.all([
      tasksApi.calendar(queryRange.start, queryRange.end),
      spacesApi.list(),
    ])
      .then(async ([calTasks, spaceList]) => {
        setTasks(calTasks);
        setSpaces(spaceList);
        // load lists for all spaces
        const listArrays = await Promise.all(spaceList.map((s) => listsApi.list(s.id)));
        setAllLists(listArrays.flat());
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [queryRange]);

  // ── Gantt view date range ─────────────────────────────────────────────────
  const dateRange = useMemo(() => {
    if (zoomLevel === "day") {
      const start = addDays(currentDate, -3);
      const end   = addDays(start, 27);
      return { start, end };
    } else if (zoomLevel === "week") {
      const start = startOfMonth(currentDate);
      const end   = endOfMonth(addMonths(currentDate, 2));
      return { start, end };
    } else {
      const start = startOfMonth(currentDate);
      const end   = endOfMonth(addMonths(currentDate, 11));
      return { start, end };
    }
  }, [currentDate, zoomLevel]);

  const dates = useMemo(
    () => eachDayOfInterval({ start: dateRange.start, end: dateRange.end }),
    [dateRange],
  );

  // ── Lists for selected space filter ──────────────────────────────────────
  const spaceLists = useMemo(() => {
    if (selectedSpaceId === "all") return allLists;
    return allLists.filter((l) => l.spaceId === selectedSpaceId);
  }, [selectedSpaceId, allLists]);

  // ── Filtered tasks ────────────────────────────────────────────────────────
  const filteredTasks = useMemo(() => {
    let filtered = tasks.filter((t) => !!t.plan_start);

    if (selectedSpaceId !== "all") {
      const listIds = spaceLists.map((l) => l.id);
      filtered = filtered.filter((t) => listIds.includes(t.list_id));
    }
    if (selectedListId !== "all") {
      filtered = filtered.filter((t) => t.list_id === selectedListId);
    }

    return filtered.sort((a, b) => {
      const da = a.plan_start ? new Date(a.plan_start).getTime() : 0;
      const db = b.plan_start ? new Date(b.plan_start).getTime() : 0;
      return da - db;
    });
  }, [tasks, selectedSpaceId, selectedListId, spaceLists]);

  // ── Cell width ────────────────────────────────────────────────────────────
  const cellWidth = zoomLevel === "day" ? 40 : zoomLevel === "week" ? 20 : 10;

  // ── Task bar style ────────────────────────────────────────────────────────
  const getTaskBarStyle = (task: CalendarTaskRow) => {
    if (!task.plan_start) return null;
    const start  = new Date(task.plan_start);
    const finish = task.plan_finish ? new Date(task.plan_finish) : start;

    const startOffset = differenceInDays(start, dateRange.start);
    const duration    = differenceInDays(finish, start) + 1;

    if (startOffset + duration < 0 || startOffset > dates.length) return null;

    const left  = Math.max(0, startOffset * cellWidth);
    const width = Math.min(
      Math.max(duration, 1) * cellWidth,
      (dates.length - Math.max(0, startOffset)) * cellWidth,
    );
    return { left, width };
  };

  const getBarColor = (task: CalendarTaskRow) =>
    task.status_color ?? STATUS_COLORS[task.status] ?? "#6b7280";

  // ── Navigation ────────────────────────────────────────────────────────────
  const navigatePrevious = () => {
    if (zoomLevel === "day")   setCurrentDate(addDays(currentDate, -7));
    else if (zoomLevel === "week") setCurrentDate(subMonths(currentDate, 1));
    else                       setCurrentDate(subMonths(currentDate, 3));
  };
  const navigateNext = () => {
    if (zoomLevel === "day")   setCurrentDate(addDays(currentDate, 7));
    else if (zoomLevel === "week") setCurrentDate(addMonths(currentDate, 1));
    else                       setCurrentDate(addMonths(currentDate, 3));
  };

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
              ? "ดูภาพรวมกำหนดการของงาน"
              : "View task schedules and timelines"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={selectedSpaceId} onValueChange={(v) => { setSelectedSpaceId(v); setSelectedListId("all"); }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={language === "th" ? "เลือก Space" : "Select Space"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === "th" ? "ทั้งหมด" : "All Spaces"}</SelectItem>
              {spaces.map((space) => (
                <SelectItem key={space.id} value={space.id}>{space.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedListId} onValueChange={setSelectedListId}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={language === "th" ? "เลือก List" : "Select List"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === "th" ? "ทั้งหมด" : "All Lists"}</SelectItem>
              {spaceLists.map((list) => (
                <SelectItem key={list.id} value={list.id}>{list.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Navigation & Zoom */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={navigatePrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
            {language === "th" ? "วันนี้" : "Today"}
          </Button>
          <Button variant="outline" size="icon" onClick={navigateNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-lg font-medium">
          {format(dateRange.start, "d MMM yyyy", { locale })} –{" "}
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
              <SelectItem value="day">{language === "th" ? "วัน" : "Day"}</SelectItem>
              <SelectItem value="week">{language === "th" ? "สัปดาห์" : "Week"}</SelectItem>
              <SelectItem value="month">{language === "th" ? "เดือน" : "Month"}</SelectItem>
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
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-muted-foreground text-sm">
                {language === "th" ? "กำลังโหลด…" : "Loading…"}
              </p>
            </div>
          ) : (
            <div className="flex h-full">
              {/* Task List Panel */}
              <div className="w-72 border-r flex-shrink-0 overflow-hidden flex flex-col">
                <div className="h-14 border-b bg-muted/50 flex items-center px-4 font-medium">
                  {language === "th" ? "งาน" : "Task"}
                </div>
                <div className="flex-1 overflow-y-auto">
                  {filteredTasks.map((task) => (
                    <div
                      key={task.id}
                      className="h-12 border-b flex items-center px-4 gap-2 hover:bg-muted/30 cursor-pointer group"
                      onClick={() => router.push(`/task/${task.id}`)}
                    >
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: getBarColor(task) }}
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
                                {task.list_name && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {task.list_name}
                                  </p>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          {task.plan_start && (
                            <span>{format(new Date(task.plan_start), "d MMM", { locale })}</span>
                          )}
                        </div>
                      </div>
                      <Avatar className="h-5 w-5 border border-background">
                        <AvatarImage src={task.assignee_avatar ?? undefined} />
                        <AvatarFallback className="text-[8px]">
                          {task.assignee_name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
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
                  ))}
                  {filteredTasks.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground text-sm">
                      {language === "th"
                        ? "ไม่มีงานที่มี Plan Start"
                        : "No tasks with a Plan Start date"}
                    </div>
                  )}
                </div>
              </div>

              {/* Gantt Chart Panel */}
              <div className="flex-1 overflow-hidden flex flex-col" ref={scrollContainerRef}>
                {/* Timeline Header */}
                <div className="h-14 border-b bg-muted/50 overflow-x-auto flex-shrink-0">
                  <div className="flex h-full" style={{ width: dates.length * cellWidth }}>
                    {dates.map((date, idx) => {
                      const isToday      = isSameDay(date, new Date());
                      const isWeekendDay = isWeekend(date);
                      const showMonth    = idx === 0 || date.getDate() === 1;

                      return (
                        <div
                          key={date.toISOString()}
                          className={cn(
                            "flex flex-col items-center justify-center border-r text-xs",
                            isWeekendDay && "bg-muted/30",
                            isToday && "bg-primary/10",
                          )}
                          style={{ width: cellWidth, minWidth: cellWidth }}
                        >
                          {showMonth && zoomLevel === "day" && (
                            <span className="text-[10px] text-muted-foreground">
                              {format(date, "MMM", { locale })}
                            </span>
                          )}
                          <span className={cn("font-medium", isToday && "text-primary")}>
                            {format(date, "d")}
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
                  <div className="absolute inset-0" style={{ width: dates.length * cellWidth }}>
                    {dates.map((date, idx) => (
                      <div
                        key={date.toISOString()}
                        className={cn(
                          "absolute top-0 bottom-0 border-r",
                          isWeekend(date) && "bg-muted/20",
                          isSameDay(date, new Date()) && "bg-primary/5",
                        )}
                        style={{ left: idx * cellWidth, width: cellWidth }}
                      />
                    ))}
                    {/* Today line */}
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
                      width:  dates.length * cellWidth,
                      height: filteredTasks.length * 48,
                    }}
                  >
                    {filteredTasks.map((task, index) => {
                      const style = getTaskBarStyle(task);
                      if (!style) return null;
                      const barColor = getBarColor(task);

                      return (
                        <TooltipProvider key={task.id}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className="absolute h-8 rounded cursor-pointer hover:opacity-80 transition-opacity"
                                style={{
                                  left:            style.left,
                                  top:             index * 48 + 8,
                                  width:           style.width,
                                  backgroundColor: `${barColor}30`,
                                  border:          `2px solid ${barColor}`,
                                }}
                                onClick={() => router.push(`/task/${task.id}`)}
                              >
                                <div className="absolute inset-0 flex items-center px-2 text-xs font-medium truncate">
                                  {style.width > 60 && task.title}
                                </div>
                                <div
                                  className="absolute right-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                                  style={{ backgroundColor: barColor }}
                                />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <div className="text-sm">
                                <p className="font-medium">{task.title}</p>
                                {task.plan_start && (
                                  <p className="text-muted-foreground">
                                    {format(new Date(task.plan_start), "d MMM yyyy", { locale })}
                                    {task.plan_finish && task.plan_finish !== task.plan_start && (
                                      <>
                                        {" – "}
                                        {format(new Date(task.plan_finish), "d MMM yyyy", { locale })}
                                      </>
                                    )}
                                  </p>
                                )}
                                {task.duration_days && (
                                  <p className="text-muted-foreground">
                                    {task.duration_days}{" "}
                                    {language === "th" ? "วัน" : "days"}
                                  </p>
                                )}
                                <p className="text-muted-foreground">
                                  {task.status_name ?? task.status}
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
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-primary" />
          <span className="text-muted-foreground">{language === "th" ? "วันนี้" : "Today"}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-muted/30 border border-dashed" />
          <span className="text-muted-foreground">{language === "th" ? "วันหยุด" : "Weekend"}</span>
        </div>
      </div>
    </div>
  );
}
