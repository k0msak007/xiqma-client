"use client";

import { useState, useMemo, useEffect, Fragment } from "react";
import {
  addDays,
  startOfWeek,
  endOfWeek,
  format,
  eachDayOfInterval,
  isSameDay,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
} from "date-fns";
import { th, enUS } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Clock,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { employeesApi, type Employee } from "@/lib/api/employees";
import { tasksApi, type CalendarTaskRow } from "@/lib/api/tasks";
import { timeTrackingApi, type DailyTimeRow } from "@/lib/api/time-tracking";
import { attendanceApi, leaveApi, type AttendanceLog, type LeaveQuota } from "@/lib/api/leave";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "sonner";

type ViewMode = "week" | "month";

// กำหนดสีตาม task status enum
const STATUS_COLORS: Record<string, string> = {
  open:         "#6b7280",
  in_progress:  "#3b82f6",
  review:       "#f59e0b",
  completed:    "#10b981",
  closed:       "#6366f1",
};

export default function TimeSheetPage() {
  const { t, language } = useTranslation();
  const locale = language === "th" ? th : enUS;

  const [viewMode, setViewMode]             = useState<ViewMode>("week");
  const [currentDate, setCurrentDate]       = useState(new Date());
  const [employees, setEmployees]           = useState<Employee[]>([]);
  const [tasks, setTasks]                   = useState<CalendarTaskRow[]>([]);
  const [dailyTime, setDailyTime]           = useState<DailyTimeRow[]>([]);
  const [isLoading, setIsLoading]           = useState(true);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [expandedUsers, setExpandedUsers]   = useState<Set<string>>(new Set());
  
  // Attendance state
  const user = useAuthStore((s) => s.user);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceLog | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  
  // Leave quota state
  const [leaveQuotas, setLeaveQuotas] = useState<LeaveQuota[]>([]);

  // ─── Date range ───────────────────────────────────────────────────────────
  const dates = useMemo(() => {
    if (viewMode === "week") {
      return eachDayOfInterval({
        start: startOfWeek(currentDate, { weekStartsOn: 1 }),
        end:   endOfWeek(currentDate,   { weekStartsOn: 1 }),
      });
    }
    return eachDayOfInterval({
      start: startOfMonth(currentDate),
      end:   endOfMonth(currentDate),
    });
  }, [currentDate, viewMode]);

  // ─── Load data ────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const startStr = format(dates[0], "yyyy-MM-dd");
        const endStr   = format(dates[dates.length - 1], "yyyy-MM-dd");
        const [empRes, taskRows, dailyRows] = await Promise.all([
          employeesApi.listAll(),
          tasksApi.calendar(startStr, endStr),
          timeTrackingApi.daily(startStr, endStr).catch(() => [] as DailyTimeRow[]),
        ]);
        setEmployees(empRes.filter((e) => e.isActive));
        setTasks(taskRows);
        setDailyTime(dailyRows);
      } catch {
        toast.error("โหลดข้อมูลไม่สำเร็จ");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, viewMode]);

  // Load today's attendance status
  useEffect(() => {
    const loadTodayStatus = async () => {
      try {
        const data = await attendanceApi.getToday();
        setTodayAttendance(data);
      } catch (err) {
        console.error("Failed to load today's attendance:", err);
      }
    };
    loadTodayStatus();
  }, []);

  // Load leave quotas
  useEffect(() => {
    const loadQuotas = async () => {
      try {
        const data = await leaveApi.getMyQuotas(new Date().getFullYear());
        setLeaveQuotas(data);
      } catch (err) {
        console.error("Failed to load leave quotas:", err);
      }
    };
    loadQuotas();
  }, []);

  // Check in
  const handleCheckIn = async () => {
    setIsCheckingIn(true);
    try {
      const result = await attendanceApi.checkIn();
      setTodayAttendance(result);
      toast.success(language === "th" ? "เช็คอินสำเร็จ" : "Check-in successful");
    } catch (err: any) {
      toast.error(err.message || (language === "th" ? "เช็คอินไม่สำเร็จ" : "Check-in failed"));
    } finally {
      setIsCheckingIn(false);
    }
  };

  // Check out
  const handleCheckOut = async () => {
    setIsCheckingOut(true);
    try {
      const result = await attendanceApi.checkOut();
      setTodayAttendance(result);
      toast.success(language === "th" ? "เช็คเอาต์สำเร็จ" : "Check-out successful");
    } catch (err: any) {
      toast.error(err.message || (language === "th" ? "เช็คเอาต์ไม่สำเร็จ" : "Check-out failed"));
    } finally {
      setIsCheckingOut(false);
    }
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const filteredEmployees = useMemo(() => {
    if (selectedUserIds.length === 0) return employees;
    return employees.filter((e) => selectedUserIds.includes(e.id));
  }, [employees, selectedUserIds]);

  const getTasksForUserOnDate = (userId: string, date: Date): CalendarTaskRow[] => {
    return tasks.filter((task) => {
      if (task.assignee_id !== userId) return false;
      const start = task.plan_start ? new Date(task.plan_start) : null;
      const end   = task.plan_finish ?? task.deadline
        ? new Date((task.plan_finish ?? task.deadline)!)
        : null;
      if (!start) return false;
      if (end) {
        return isWithinInterval(date, { start, end }) ||
               isSameDay(date, start) || isSameDay(date, end);
      }
      return isSameDay(date, start);
    });
  };

  // ใช้เวลา "จริง" จาก time_sessions ต่อวัน (กดเริ่ม/หยุดจริง) — ไม่เฉลี่ย
  const getHoursForUserOnDate = (userId: string, date: Date): number => {
    const dayStr = format(date, "yyyy-MM-dd");
    const totalMin = dailyTime
      .filter((r) => r.employeeId === userId && r.day === dayStr)
      .reduce((s, r) => s + r.durationMin, 0);
    return totalMin / 60;
  };

  const getTaskHoursForUserOnDate = (userId: string, taskId: string, date: Date): number => {
    const dayStr = format(date, "yyyy-MM-dd");
    const row = dailyTime.find((r) => r.employeeId === userId && r.taskId === taskId && r.day === dayStr);
    return row ? row.durationMin / 60 : 0;
  };

  const getTotalHoursForUser = (userId: string): number =>
    dates.reduce((sum, d) => sum + getHoursForUserOnDate(userId, d), 0);

  const formatHours = (h: number) => {
    if (h === 0) return "-";
    if (h < 1)   return `${Math.round(h * 60)}m`;
    return `${h.toFixed(1)}h`;
  };

  const navigatePrevious = () =>
    setCurrentDate(addDays(currentDate, viewMode === "week" ? -7 : -30));
  const navigateNext = () =>
    setCurrentDate(addDays(currentDate, viewMode === "week" ? 7 : 30));
  const goToToday = () => setCurrentDate(new Date());

  const toggleUser = (id: string) =>
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const toggleExpand = (id: string) =>
    setExpandedUsers((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });

  const grandTotal = filteredEmployees.reduce((s, e) => s + getTotalHoursForUser(e.id), 0);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Time Sheet</h1>
          <p className="text-muted-foreground">
            {language === "th" ? "ดูภาพรวมการทำงานของแต่ละคนในแต่ละวัน" : "Work overview per person by day"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Check In/Out Buttons */}
          {todayAttendance?.checkIn && !todayAttendance?.checkOut ? (
            <Button 
              variant="default" 
              onClick={handleCheckOut}
              disabled={isCheckingOut}
              className="gap-2"
            >
              <Clock className="h-4 w-4" />
              {language === "th" ? "เช็คเอาต์" : "Check Out"}
            </Button>
          ) : !todayAttendance?.checkIn ? (
            <Button 
              variant="default" 
              onClick={handleCheckIn}
              disabled={isCheckingIn}
              className="gap-2"
            >
              <Clock className="h-4 w-4" />
              {language === "th" ? "เช็คอิน" : "Check In"}
            </Button>
          ) : null}
          
          {/* Today's Status */}
          {todayAttendance && (
            <Badge variant={todayAttendance.status === "late" ? "destructive" : "secondary"}>
              {todayAttendance.checkIn 
                ? `${language === "th" ? "เข้า" : "In"}: ${new Date(todayAttendance.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : "-"}
              {todayAttendance.checkOut 
                ? ` / ${language === "th" ? "ออก" : "Out"}: ${new Date(todayAttendance.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : ""}
            </Badge>
          )}

          {/* Leave Quotas Summary */}
          {leaveQuotas.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">{language === "th" ? "โควตาลา:" : "Leave:"}</span>
              {leaveQuotas.slice(0, 2).map((q) => (
                <Badge key={q.leaveType} variant="outline" className="text-xs">
                  {q.leaveType === "annual" ? (language === "th" ? "ประจำ" : "Annual") : 
                   q.leaveType === "sick" ? (language === "th" ? "ป่วย" : "Sick") : 
                   q.leaveType === "personal" ? (language === "th" ? "กิจ" : "Personal") : q.leaveType}: {q.remainingDays}
                </Badge>
              ))}
            </div>
          )}

          {/* User Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Users className="h-4 w-4" />
                {selectedUserIds.length > 0
                  ? `${selectedUserIds.length} ${language === "th" ? "คน" : "selected"}`
                  : language === "th" ? "ทุกคน" : "All Users"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="end">
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {language === "th" ? "เลือกพนักงาน" : "Select Employees"}
                </p>
                <div className="max-h-64 overflow-auto space-y-1">
                  {employees.map((emp) => (
                    <div
                      key={emp.id}
                      className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                      onClick={() => toggleUser(emp.id)}
                    >
                      <Checkbox checked={selectedUserIds.includes(emp.id)} onCheckedChange={() => toggleUser(emp.id)} />
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={emp.avatarUrl ?? undefined} />
                        <AvatarFallback className="text-xs">{emp.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{emp.name}</span>
                    </div>
                  ))}
                </div>
                {selectedUserIds.length > 0 && (
                  <Button variant="ghost" size="sm" className="w-full" onClick={() => setSelectedUserIds([])}>
                    {language === "th" ? "ล้างการเลือก" : "Clear Selection"}
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* View Mode */}
          <Select value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="week">{language === "th" ? "รายสัปดาห์" : "Weekly"}</SelectItem>
              <SelectItem value="month">{language === "th" ? "รายเดือน" : "Monthly"}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Navigation */}
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
          {viewMode === "week" ? (
            <>{format(dates[0], "d MMM", { locale })} – {format(dates[dates.length - 1], "d MMM yyyy", { locale })}</>
          ) : (
            format(currentDate, "MMMM yyyy", { locale })
          )}
        </div>

        <Badge variant="outline" className="gap-1">
          <Clock className="h-3 w-3" />
          {language === "th" ? "รวม" : "Total"}: {formatHours(grandTotal)}
        </Badge>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              {language === "th" ? "กำลังโหลด…" : "Loading…"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="sticky left-0 bg-muted/50 p-3 text-left min-w-[200px] z-10">
                      {language === "th" ? "พนักงาน" : "Employee"}
                    </th>
                    {dates.map((date) => (
                      <th
                        key={date.toISOString()}
                        className={cn(
                          "p-2 text-center min-w-[80px] text-sm font-medium",
                          isSameDay(date, new Date()) && "bg-primary/10"
                        )}
                      >
                        <div>{format(date, "EEE", { locale })}</div>
                        <div className="text-muted-foreground">{format(date, "d")}</div>
                      </th>
                    ))}
                    <th className="p-3 text-center min-w-[80px] bg-muted/50">
                      {language === "th" ? "รวม" : "Total"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((emp) => {
                    const isExpanded = expandedUsers.has(emp.id);
                    const totalHours = getTotalHoursForUser(emp.id);

                    return (
                      <Fragment key={emp.id}>
                        {/* Summary Row */}
                        <tr
                          className="border-b hover:bg-muted/30 cursor-pointer"
                          onClick={() => toggleExpand(emp.id)}
                        >
                          <td className="sticky left-0 bg-background p-3 z-10">
                            <div className="flex items-center gap-3">
                              <Button
                                variant="ghost" size="icon" className="h-6 w-6"
                                onClick={(e) => { e.stopPropagation(); toggleExpand(emp.id); }}
                              >
                                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </Button>
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={emp.avatarUrl ?? undefined} />
                                <AvatarFallback>{emp.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{emp.name}</div>
                                <div className="text-xs text-muted-foreground">{emp.email ?? ""}</div>
                              </div>
                            </div>
                          </td>
                          {dates.map((date) => {
                            const hours = getHoursForUserOnDate(emp.id, date);
                            const count = getTasksForUserOnDate(emp.id, date).length;
                            return (
                              <td key={date.toISOString()} className={cn("p-2 text-center", isSameDay(date, new Date()) && "bg-primary/10")}>
                                {count > 0 ? (
                                  <div>
                                    <div className="font-medium">{formatHours(hours)}</div>
                                    <div className="text-xs text-muted-foreground">{count} {language === "th" ? "งาน" : "tasks"}</div>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="p-3 text-center bg-muted/30">
                            <div className="font-bold">{formatHours(totalHours)}</div>
                          </td>
                        </tr>

                        {/* Expanded Task Rows — ใช้เวลาจริงจาก time_sessions ต่อวัน */}
                        {isExpanded && (() => {
                          // รวม task ที่มี session จริงในช่วงนี้ของ user
                          const taskMap = new Map<string, {
                            id: string; title: string; status: string;
                            statusName: string | null; statusColor: string | null;
                          }>();
                          dailyTime
                            .filter((r) => r.employeeId === emp.id)
                            .forEach((r) => {
                              if (!taskMap.has(r.taskId)) {
                                taskMap.set(r.taskId, {
                                  id: r.taskId, title: r.taskTitle,
                                  status: r.status, statusName: r.statusName, statusColor: r.statusColor,
                                });
                              }
                            });
                          const uniq = Array.from(taskMap.values());
                          if (uniq.length === 0) return null;
                          return uniq.map((task) => {
                            const rowTotal = uniq.length > 0
                              ? dailyTime
                                  .filter((r) => r.employeeId === emp.id && r.taskId === task.id)
                                  .reduce((s, r) => s + r.durationMin, 0) / 60
                              : 0;
                            return (
                              <tr key={`${emp.id}-${task.id}`} className="border-b bg-muted/10">
                                <td className="sticky left-0 bg-muted/10 p-3 pl-14 z-10">
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      variant="outline" className="text-[10px]"
                                      style={{
                                        borderColor: task.statusColor ?? STATUS_COLORS[task.status] ?? "#6b7280",
                                        color:       task.statusColor ?? STATUS_COLORS[task.status] ?? "#6b7280",
                                      }}
                                    >
                                      {task.statusName ?? task.status}
                                    </Badge>
                                    <span className="text-sm truncate max-w-[140px]">{task.title}</span>
                                  </div>
                                </td>
                                {dates.map((d) => {
                                  const h = getTaskHoursForUserOnDate(emp.id, task.id, d);
                                  return (
                                    <td key={d.toISOString()} className={cn("p-2 text-center text-sm", isSameDay(d, new Date()) && "bg-primary/10")}>
                                      {h > 0 ? (
                                        <span className="text-muted-foreground">{formatHours(h)}</span>
                                      ) : ""}
                                    </td>
                                  );
                                })}
                                <td className="p-3 text-center bg-muted/30">
                                  <span className="text-sm text-muted-foreground">
                                    {formatHours(rowTotal)}
                                  </span>
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </Fragment>
                    );
                  })}

                  {filteredEmployees.length === 0 && (
                    <tr>
                      <td colSpan={dates.length + 2} className="p-8 text-center text-muted-foreground">
                        {language === "th" ? "ไม่พบข้อมูลพนักงาน" : "No employees found"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: language === "th" ? "รวมชั่วโมงทำงาน" : "Total Work Hours", value: formatHours(grandTotal) },
          { label: language === "th" ? "จำนวนพนักงาน" : "Employees", value: filteredEmployees.length.toString() },
          {
            label: language === "th" ? "จำนวนงานทั้งหมด" : "Total Tasks",
            value: String(
              filteredEmployees.reduce((sum, emp) =>
                sum + dates.reduce((d, date) => d + getTasksForUserOnDate(emp.id, date).length, 0), 0)
            ),
          },
          { label: language === "th" ? "เฉลี่ยต่อวัน" : "Avg per Day", value: formatHours(grandTotal / Math.max(dates.length, 1)) },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
