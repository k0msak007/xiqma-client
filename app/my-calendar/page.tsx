"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, isWithinInterval, parseISO, setHours, setMinutes } from "date-fns";
import { th, enUS } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, MapPin, Briefcase, Users, FileText, X, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { useTaskStore } from "@/lib/store";
import { useAuthStore } from "@/lib/auth-store";
import { useHolidays } from "@/hooks/use-holidays";
import { tasksApi, type CalendarTaskRow } from "@/lib/api/tasks";
import { taskTypesApi, type TaskType } from "@/lib/api/task-types";
import { spacesApi } from "@/lib/api/spaces";
import { listsApi, type List } from "@/lib/api/lists";
import { leaveApi, type LeaveRequest } from "@/lib/api/leave";
import type { Priority } from "@/lib/types";

// Frontend leave type (UI only)
type LeaveType = "annual" | "sick" | "personal" | "wfh" | "other";
interface LeaveRecord {
  id: string;
  displayId: string;
  employeeId: string;
  type: LeaveType;
  startDate: Date;
  endDate: Date;
  note?: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  createdAt: Date;
}

// Map frontend leave type to API leave type
const mapLeaveTypeToApi = (type: LeaveType): LeaveRequest["leaveType"] => {
  switch (type) {
    case "annual": return "annual";
    case "sick": return "sick";
    case "personal": return "personal";
    case "wfh": return "personal"; // WFH mapped to personal for now
    case "other": return "unpaid";
    default: return "annual";
  }
};

// Map API leave type to frontend leave type (for display)
const mapApiTypeToFrontend = (apiType: string): LeaveType => {
  switch (apiType) {
    case "annual": return "annual";
    case "sick": return "sick";
    case "personal": return "personal";
    case "maternity": return "personal";
    case "ordain": return "personal";
    case "unpaid": return "other";
    default: return "annual";
  }
};

// Leave type colors
const leaveTypeColors: Record<LeaveType, { bg: string; text: string; label: string }> = {
  annual: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400", label: "Annual Leave" },
  sick: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", label: "Sick Leave" },
  personal: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", label: "Personal Leave" },
  wfh: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-400", label: "Work From Home" },
  other: { bg: "bg-gray-100 dark:bg-gray-900/30", text: "text-gray-700 dark:text-gray-400", label: "Other" },
};

// Time options for dropdown
const timeOptions = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = (i % 2) * 30;
  return {
    value: `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
    label: `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
  };
});

export default function MyCalendarPage() {
  const { t, language } = useTranslation();
  const locale = language === "th" ? th : enUS;

  // real auth user
  const authUser    = useAuthStore((s) => s.user);

  // holiday settings still come from store (loaded on app init)
  const { holidaySettings } = useTaskStore();

  // real API state
  const [calendarTasks, setCalendarTasks] = useState<CalendarTaskRow[]>([]);
  const [taskTypes,     setTaskTypes]     = useState<TaskType[]>([]);
  const [allLists,      setAllLists]      = useState<List[]>([]);
  const [tasksLoading,  setTasksLoading]  = useState(false);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  
  // Task form state
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskTypeId, setTaskTypeId] = useState("");
  const [taskPriority, setTaskPriority] = useState<Priority>("normal");
  const [taskStartTime, setTaskStartTime] = useState("09:00");
  const [taskEndTime, setTaskEndTime] = useState("10:00");
  const [taskStartDate, setTaskStartDate] = useState<Date>(new Date());
  const [taskEndDate, setTaskEndDate] = useState<Date>(new Date());
  const [selectedFolderId, setSelectedFolderId] = useState("");
  
  // Get selected task type for auto points
  const selectedTaskType = useMemo(() => {
    return taskTypes.find(tt => tt.id === taskTypeId);
  }, [taskTypes, taskTypeId]);
  
  // Auto-calculated points from task type
  const autoPoints = useMemo(() => {
    if (selectedTaskType?.category === "private" && selectedTaskType?.countsForPoints) {
      return selectedTaskType.fixedPoints || 0;
    }
    return 0;
  }, [selectedTaskType]);
  
  // Leave form state
  const [leaveType, setLeaveType] = useState<LeaveType>("annual");
  const [leaveStartDate, setLeaveStartDate] = useState<Date>(new Date());
  const [leaveEndDate, setLeaveEndDate] = useState<Date>(new Date());
  const [leaveNote, setLeaveNote] = useState("");
  
  // Local leaves state (would be in store in production)
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [leaveDaysCount, setLeaveDaysCount] = useState(0);
  const [leaveLoading, setLeaveLoading] = useState(false);

  const { getWorkingDays } = useHolidays();

  // real current user
  const currentUserId = authUser?.id ?? "";
  
  // ── Load task types and lists on mount ────────────────────────────────────
  useEffect(() => {
    taskTypesApi.list().then(setTaskTypes).catch(console.error);
    spacesApi.list()
      .then((spaces) => Promise.all(spaces.map((s) => listsApi.list(s.id))))
      .then((arrays) => setAllLists(arrays.flat()))
      .catch(console.error);
  }, []);

  // ── Load calendar tasks when month changes ────────────────────────────────
  useEffect(() => {
    if (!currentUserId) return;
    const startStr = format(startOfMonth(currentMonth), "yyyy-MM-dd");
    const endStr   = format(endOfMonth(currentMonth),   "yyyy-MM-dd");
    setTasksLoading(true);
    tasksApi.calendar(startStr, endStr)
      .then((rows) => setCalendarTasks(rows.filter((t) => t.assignee_id === currentUserId)))
      .catch(console.error)
      .finally(() => setTasksLoading(false));
  }, [currentMonth, currentUserId]);

  // ── Load leave requests when month changes ────────────────────────────────
  useEffect(() => {
    if (!currentUserId) return;
    setLeaveLoading(true);
    leaveApi.list({ employee_id: currentUserId, year: currentMonth.getFullYear() })
      .then((data) => {
        const mapped: LeaveRecord[] = data.map((l) => ({
          id: l.id,
          displayId: l.displayId,
          employeeId: l.employeeId,
          type: mapApiTypeToFrontend(l.leaveType),
          startDate: new Date(l.startDate),
          endDate: new Date(l.endDate),
          note: l.reason || undefined,
          status: l.status,
          createdAt: new Date(l.createdAt),
        }));
        setLeaves(mapped);
      })
      .catch(console.error)
      .finally(() => setLeaveLoading(false));
  }, [currentMonth, currentUserId]);

  // Private task types (category = "private")
  const privateTaskTypes = useMemo(
    () => taskTypes.filter((tt) => tt.category === "private"),
    [taskTypes],
  );

  // Tasks with plan dates for calendar display
  const plannedTasks = useMemo(
    () => calendarTasks.filter((t) => !!t.plan_start),
    [calendarTasks],
  );
  
  // Get current year holidays
  const currentYearHolidays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const settings = holidaySettings.find(h => h.year === year);
    return settings?.specialHolidays || [];
  }, [holidaySettings, currentMonth]);
  
  // Get weekend days for current year
  const weekendDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const settings = holidaySettings.find(h => h.year === year);
    return settings?.weekendDays || ["saturday", "sunday"];
  }, [holidaySettings, currentMonth]);

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

  // Check if day is holiday
  const isHoliday = (day: Date) => {
    return currentYearHolidays.some(h => isSameDay(new Date(h.date), day));
  };

  // Get holiday info for a day
  const getHolidayInfo = (day: Date) => {
    return currentYearHolidays.find(h => isSameDay(new Date(h.date), day));
  };

  // Check if day is weekend (use day-of-week number: 0=Sun, 6=Sat)
  const isWeekend = (day: Date) => {
    const dow = day.getDay(); // 0=Sun, 6=Sat
    if (weekendDays.length > 0 && typeof weekendDays[0] === "number") {
      return (weekendDays as number[]).includes(dow);
    }
    return dow === 0 || dow === 6; // default Sat/Sun
  };

  // Get leave for a day
  const getLeaveForDay = (day: Date) => {
    return leaves.find(leave => 
      isWithinInterval(day, { start: new Date(leave.startDate), end: new Date(leave.endDate) })
    );
  };

  // Get tasks for a specific day (CalendarTaskRow uses plan_start / plan_finish)
  const getTasksForDay = (day: Date) => {
    return plannedTasks.filter((task) => {
      if (!task.plan_start) return false;
      const start = new Date(task.plan_start);
      start.setHours(0, 0, 0, 0);
      const end = task.plan_finish ? new Date(task.plan_finish) : new Date(start);
      end.setHours(23, 59, 59, 999);
      const checkDay = new Date(day);
      checkDay.setHours(12, 0, 0, 0);
      return isWithinInterval(checkDay, { start, end });
    });
  };

  // Get task type info
  const getTaskTypeInfo = (taskTypeId: string | null | undefined) => {
    if (!taskTypeId) return undefined;
    return taskTypes.find((tt) => tt.id === taskTypeId);
  };

  // Handle create task (real API)
  const handleCreateTask = async () => {
    if (!taskTitle.trim() || !currentUserId) return;

    // Pick first available list
    const targetList = allLists[0];
    if (!targetList) {
      alert(language === "th" ? "ไม่พบ List สำหรับสร้างงาน" : "No list available to create task");
      return;
    }

    // Calculate duration in days
    const durationDays = Math.max(
      1,
      Math.ceil((taskEndDate.getTime() - taskStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1,
    );

    try {
      await tasksApi.create({
        title:            taskTitle.trim(),
        description:      taskDescription.trim() || undefined,
        listId:           targetList.id,
        assigneeId:       currentUserId,
        priority:         taskPriority,
        storyPoints:      autoPoints > 0 ? autoPoints : undefined,
        taskTypeId:       taskTypeId || undefined,
        planStart:        format(taskStartDate, "yyyy-MM-dd"),
        durationDays,
        timeEstimateHours: 1,
      });
      // Refresh calendar tasks
      const startStr = format(startOfMonth(currentMonth), "yyyy-MM-dd");
      const endStr   = format(endOfMonth(currentMonth),   "yyyy-MM-dd");
      const rows = await tasksApi.calendar(startStr, endStr);
      setCalendarTasks(rows.filter((t) => t.assignee_id === currentUserId));
    } catch (err) {
      console.error("Failed to create task:", err);
    }

    resetTaskForm();
    setShowCreateDialog(false);
  };

  // Handle create leave (using real API)
  const handleCreateLeave = async () => {
    if (!currentUserId) return;

    const startStr = format(leaveStartDate, "yyyy-MM-dd");
    const endStr = format(leaveEndDate, "yyyy-MM-dd");
    
    try {
      const result = await getWorkingDays(startStr, endStr);
      setLeaveDaysCount(result.workingDays);
    } catch {
      const diffTime = Math.abs(leaveEndDate.getTime() - leaveStartDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      setLeaveDaysCount(diffDays);
    }
    
    try {
      await leaveApi.create({
        leaveType: mapLeaveTypeToApi(leaveType),
        startDate: startStr,
        endDate: endStr,
        reason: leaveNote || undefined,
      });
      
      // Refresh leave requests
      const data = await leaveApi.list({ employee_id: currentUserId, year: currentMonth.getFullYear() });
      const mapped: LeaveRecord[] = data.map((l) => ({
        id: l.id,
        displayId: l.displayId,
        employeeId: l.employeeId,
        type: l.leaveType as LeaveType,
        startDate: new Date(l.startDate),
        endDate: new Date(l.endDate),
        note: l.reason || undefined,
        status: l.status,
        createdAt: new Date(l.createdAt),
      }));
      setLeaves(mapped);
    } catch (err) {
      console.error("Failed to create leave request:", err);
      return;
    }
    
    resetLeaveForm();
    setShowLeaveDialog(false);
  };

  const resetTaskForm = () => {
    setTaskTitle("");
    setTaskDescription("");
    setTaskTypeId("");
    setTaskPriority("normal");
    setTaskStartTime("09:00");
    setTaskEndTime("10:00");
    setTaskStartDate(new Date());
    setTaskEndDate(new Date());
    setSelectedFolderId("");
  };

  const resetLeaveForm = () => {
    setLeaveType("annual");
    setLeaveStartDate(new Date());
    setLeaveEndDate(new Date());
    setLeaveNote("");
  };

  const openCreateDialog = (date: Date) => {
    setTaskStartDate(date);
    setTaskEndDate(date);
    setSelectedDate(date);
    setShowCreateDialog(true);
  };

  const openLeaveDialog = (date: Date) => {
    setLeaveStartDate(date);
    setLeaveEndDate(date);
    setSelectedDate(date);
    setShowLeaveDialog(true);
  };

  const weekDays = language === "th" 
    ? ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {language === "th" ? "ปฏิทินของฉัน" : "My Calendar"}
            </h1>
            <p className="text-muted-foreground">
              {language === "th" ? "จัดการงานส่วนตัว การประชุม และวันลา" : "Manage personal tasks, meetings, and leaves"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => openLeaveDialog(new Date())}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {language === "th" ? "บันทึกวันลา" : "Record Leave"}
            </Button>
            <Button onClick={() => openCreateDialog(new Date())}>
              <Plus className="mr-2 h-4 w-4" />
              {language === "th" ? "เพิ่มงาน" : "Add Task"}
            </Button>
          </div>
        </div>
      </header>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between px-6 py-3 border-b">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <h2 className="text-xl font-semibold">
            {format(currentMonth, "MMMM yyyy", { locale })}
          </h2>
          <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(new Date())}>
            {language === "th" ? "วัน��ี้" : "Today"}
          </Button>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Legend */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-200 dark:bg-red-900/50" />
              <span>{language === "th" ? "วันหยุด" : "Holiday"}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-purple-200 dark:bg-purple-900/50" />
              <span>{language === "th" ? "วันลา" : "Leave"}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-blue-500" />
              <span>{language === "th" ? "งาน" : "Task"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-card rounded-lg border">
          {/* Week Days Header */}
          <div className="grid grid-cols-7 border-b">
            {weekDays.map((day, idx) => (
              <div
                key={day}
                className={cn(
                  "py-3 text-center text-sm font-medium",
                  (idx === 0 || idx === 6) && "text-muted-foreground"
                )}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, idx) => {
              const isToday = isSameDay(day, new Date());
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const dayTasks = getTasksForDay(day);
              const holiday = getHolidayInfo(day);
              const leave = getLeaveForDay(day);
              const weekend = isWeekend(day);

              return (
                <div
                  key={idx}
                  className={cn(
                    "min-h-[120px] border-b border-r p-2 transition-colors",
                    !isCurrentMonth && "bg-muted/30",
                    isToday && "bg-primary/5",
                    holiday && "bg-red-50 dark:bg-red-950/20",
                    leave && "bg-purple-50 dark:bg-purple-950/20",
                    weekend && !holiday && !leave && "bg-muted/50",
                    "hover:bg-muted/50 cursor-pointer"
                  )}
                  onClick={() => openCreateDialog(day)}
                >
                  {/* Day Header */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={cn(
                        "text-sm font-medium",
                        !isCurrentMonth && "text-muted-foreground",
                        isToday && "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center",
                        weekend && "text-muted-foreground"
                      )}
                    >
                      {format(day, "d")}
                    </span>
                    {(holiday || leave) && (
                      <div className="flex gap-1">
                        {holiday && (
                          <Badge variant="destructive" className="text-[10px] px-1 py-0">
                            {language === "th" ? "หยุด" : "Holiday"}
                          </Badge>
                        )}
                        {leave && (
                          <Badge className={cn("text-[10px] px-1 py-0", leaveTypeColors[leave.type].bg, leaveTypeColors[leave.type].text)}>
                            {language === "th" ? "ลา" : "Leave"}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Holiday Name */}
                  {holiday && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="text-[10px] text-red-600 dark:text-red-400 truncate mb-1">
                            {holiday.name}
                          </p>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{holiday.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}

                  {/* Tasks */}
                  <div className="space-y-0.5">
                    {dayTasks.slice(0, 3).map((task) => {
                      const barColor = task.status_color ?? "#3b82f6";
                      return (
                        <TooltipProvider key={task.id}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className="text-[10px] px-1.5 py-0.5 rounded truncate cursor-pointer"
                                style={{
                                  backgroundColor: `${barColor}20`,
                                  color:           barColor,
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Navigate to task detail
                                  window.location.href = `/task/${task.id}`;
                                }}
                              >
                                {task.title}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="space-y-1">
                                <p className="font-medium">{task.title}</p>
                                {task.story_points && (
                                  <p className="text-xs">Points: {task.story_points}</p>
                                )}
                                {task.status_name && (
                                  <p className="text-xs">Status: {task.status_name}</p>
                                )}
                                {task.list_name && (
                                  <p className="text-xs">{task.list_name}</p>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    })}
                    {dayTasks.length > 3 && (
                      <div className="text-[10px] text-muted-foreground">
                        +{dayTasks.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Create Task Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {language === "th" ? "เพิ่มงานส่วนตัว" : "Add Private Task"}
            </DialogTitle>
            <DialogDescription>
              {selectedDate && format(selectedDate, "EEEE, d MMMM yyyy", { locale })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label>{language === "th" ? "ชื่องาน" : "Task Title"} *</Label>
              <Input
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder={language === "th" ? "เช่น ประชุมทีม, Consult ลูกค้า" : "e.g., Team Meeting, Client Consultation"}
              />
            </div>

            {/* Task Type */}
            <div className="space-y-2">
              <Label>{language === "th" ? "ประเภทงาน" : "Task Type"}</Label>
              <Select value={taskTypeId} onValueChange={setTaskTypeId}>
                <SelectTrigger>
                  <SelectValue placeholder={language === "th" ? "เลือกประเภท" : "Select type"} />
                </SelectTrigger>
                <SelectContent>
                  {privateTaskTypes.map(tt => (
                    <SelectItem key={tt.id} value={tt.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tt.color }} />
                        {tt.name}
                        {tt.countsForPoints && tt.fixedPoints !== undefined && (
                          <Badge variant="secondary" className="text-[10px] ml-auto">
                            {tt.fixedPoints} pts
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTaskType && selectedTaskType.countsForPoints && (
                <p className="text-xs text-green-600 dark:text-green-400">
                  {language === "th" 
                    ? `งานนี้จะได้รับ ${selectedTaskType.fixedPoints || 0} คะแนน` 
                    : `This task will earn ${selectedTaskType.fixedPoints || 0} points`}
                </p>
              )}
            </div>

            {/* Date Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === "th" ? "วันที่เริ่ม" : "Start Date"}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(taskStartDate, "d MMM yyyy", { locale })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={taskStartDate}
                      onSelect={(date) => {
                        if (date) {
                          setTaskStartDate(date);
                          // If end date is before start date, update it
                          if (date > taskEndDate) {
                            setTaskEndDate(date);
                          }
                        }
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>{language === "th" ? "วันที่สิ้นสุด" : "End Date"}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(taskEndDate, "d MMM yyyy", { locale })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={taskEndDate}
                      onSelect={(date) => date && setTaskEndDate(date)}
                      disabled={(date) => date < taskStartDate}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Time Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === "th" ? "เวลาเริ่ม" : "Start Time"}</Label>
                <Select value={taskStartTime} onValueChange={setTaskStartTime}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {timeOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{language === "th" ? "เวลาสิ้นสุด" : "End Time"}</Label>
                <Select value={taskEndTime} onValueChange={setTaskEndTime}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {timeOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label>{language === "th" ? "ความสำคัญ" : "Priority"}</Label>
              <Select value={taskPriority} onValueChange={(v) => setTaskPriority(v as Priority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{language === "th" ? "ต่ำ" : "Low"}</SelectItem>
                  <SelectItem value="normal">{language === "th" ? "ปกติ" : "Normal"}</SelectItem>
                  <SelectItem value="high">{language === "th" ? "สูง" : "High"}</SelectItem>
                  <SelectItem value="urgent">{language === "th" ? "เร่งด่วน" : "Urgent"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* List selection */}
            {allLists.length > 1 && (
              <div className="space-y-2">
                <Label>{language === "th" ? "List" : "List"}</Label>
                <Select value={selectedFolderId} onValueChange={setSelectedFolderId}>
                  <SelectTrigger>
                    <SelectValue placeholder={language === "th" ? "เลือก List" : "Select list"} />
                  </SelectTrigger>
                  <SelectContent>
                    {allLists.map((list) => (
                      <SelectItem key={list.id} value={list.id}>
                        {list.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Description */}
            <div className="space-y-2">
              <Label>{language === "th" ? "รายละเอียด" : "Description"}</Label>
              <Textarea
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder={language === "th" ? "รายละเอียดเพิ่มเติม..." : "Additional details..."}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              {language === "th" ? "ยกเลิก" : "Cancel"}
            </Button>
            <Button onClick={handleCreateTask} disabled={!taskTitle.trim()}>
              {language === "th" ? "สร้างงาน" : "Create Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Leave Dialog */}
      <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === "th" ? "บันทึกวันลา" : "Record Leave"}
            </DialogTitle>
            <DialogDescription>
              {language === "th" ? "บันทึกวันลาหรือ Work From Home" : "Record your leave or work from home days"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Leave Type */}
            <div className="space-y-2">
              <Label>{language === "th" ? "ประเภทการลา" : "Leave Type"}</Label>
              <Select value={leaveType} onValueChange={(v) => setLeaveType(v as LeaveType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="annual">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      {language === "th" ? "ลาพักร้อน" : "Annual Leave"}
                    </div>
                  </SelectItem>
                  <SelectItem value="sick">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      {language === "th" ? "ลาป่วย" : "Sick Leave"}
                    </div>
                  </SelectItem>
                  <SelectItem value="personal">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      {language === "th" ? "ลากิจ" : "Personal Leave"}
                    </div>
                  </SelectItem>
                  <SelectItem value="wfh">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-500" />
                      {language === "th" ? "Work From Home" : "Work From Home"}
                    </div>
                  </SelectItem>
                  <SelectItem value="other">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gray-500" />
                      {language === "th" ? "อื่นๆ" : "Other"}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === "th" ? "วันที่เริ่ม" : "Start Date"}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(leaveStartDate, "d MMM yyyy", { locale })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={leaveStartDate}
                      onSelect={(date) => date && setLeaveStartDate(date)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>{language === "th" ? "วันที่สิ้นสุด" : "End Date"}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(leaveEndDate, "d MMM yyyy", { locale })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={leaveEndDate}
                      onSelect={(date) => date && setLeaveEndDate(date)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Working Days Count */}
            {leaveDaysCount > 0 && (
              <div className="rounded-lg bg-muted p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {language === "th" ? "จำนวนวันทำงาน" : "Working Days"}
                  </span>
                  <span className="font-semibold">{leaveDaysCount}</span>
                </div>
              </div>
            )}

            {/* Note */}
            <div className="space-y-2">
              <Label>{language === "th" ? "หมายเหตุ" : "Note"}</Label>
              <Textarea
                value={leaveNote}
                onChange={(e) => setLeaveNote(e.target.value)}
                placeholder={language === "th" ? "หมายเหตุเพิ่มเติม..." : "Additional notes..."}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLeaveDialog(false)}>
              {language === "th" ? "ยกเลิก" : "Cancel"}
            </Button>
            <Button onClick={handleCreateLeave}>
              {language === "th" ? "บันทึก" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
