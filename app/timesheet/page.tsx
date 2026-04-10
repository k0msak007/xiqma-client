"use client";

import { useState, useMemo, Fragment } from "react";
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
  Calendar as CalendarIcon,
  Users,
  Filter,
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
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useTaskStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";
import { calculatePlanFinish } from "@/lib/types";

type ViewMode = "week" | "month";

export default function TimeSheetPage() {
  const { tasks, users, statuses } = useTaskStore();
  const { t, language } = useTranslation();
  const locale = language === "th" ? th : enUS;

  // State
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfWeek(new Date(), { weekStartsOn: 1 }),
    to: endOfWeek(new Date(), { weekStartsOn: 1 }),
  });

  // Calculate date range based on view mode
  const dates = useMemo(() => {
    if (viewMode === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end });
    } else {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      return eachDayOfInterval({ start, end });
    }
  }, [currentDate, viewMode]);

  // Filter users
  const filteredUsers = useMemo(() => {
    if (selectedUserIds.length === 0) return users;
    return users.filter((u) => selectedUserIds.includes(u.id));
  }, [users, selectedUserIds]);

  // Get tasks for a specific user on a specific date
  const getTasksForUserOnDate = (userId: string, date: Date) => {
    return tasks.filter((task) => {
      if (!task.assigneeIds.includes(userId)) return false;
      
      // Check if task is active on this date
      if (task.planStart) {
        const planFinish = calculatePlanFinish(task.planStart, task.duration || 1);
        if (planFinish) {
          return isWithinInterval(date, {
            start: new Date(task.planStart),
            end: planFinish,
          }) || isSameDay(date, new Date(task.planStart)) || isSameDay(date, planFinish);
        }
        return isSameDay(date, new Date(task.planStart));
      }
      
      if (task.createdAt) {
        return isSameDay(date, new Date(task.createdAt));
      }
      
      return false;
    });
  };

  // Get total hours for a user on a specific date
  const getTotalHoursForUserOnDate = (userId: string, date: Date) => {
    const userTasks = getTasksForUserOnDate(userId, date);
    const totalMinutes = userTasks.reduce((sum, task) => {
      return sum + (task.timeSpent || task.timeEstimate || 0);
    }, 0);
    return totalMinutes / 60;
  };

  // Get total hours for a user across all dates
  const getTotalHoursForUser = (userId: string) => {
    return dates.reduce((sum, date) => {
      return sum + getTotalHoursForUserOnDate(userId, date);
    }, 0);
  };

  // Navigation
  const navigatePrevious = () => {
    if (viewMode === "week") {
      setCurrentDate(addDays(currentDate, -7));
    } else {
      setCurrentDate(addDays(currentDate, -30));
    }
  };

  const navigateNext = () => {
    if (viewMode === "week") {
      setCurrentDate(addDays(currentDate, 7));
    } else {
      setCurrentDate(addDays(currentDate, 30));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Toggle user expansion
  const toggleUserExpanded = (userId: string) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
  };

  // Toggle user selection
  const toggleUserSelection = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter((id) => id !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  // Format hours display
  const formatHours = (hours: number) => {
    if (hours === 0) return "-";
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    return `${hours.toFixed(1)}h`;
  };

  // Get status for task
  const getStatus = (statusId: string) => {
    return statuses.find((s) => s.id === statusId);
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {language === "th" ? "Time Sheet" : "Time Sheet"}
          </h1>
          <p className="text-muted-foreground">
            {language === "th"
              ? "ดูภาพรวมการทำงานของแต่ละคนในแต่ละวัน"
              : "View work overview for each person by day"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* User Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Users className="h-4 w-4" />
                {selectedUserIds.length > 0
                  ? `${selectedUserIds.length} ${language === "th" ? "คน" : "selected"}`
                  : language === "th"
                  ? "ทุกคน"
                  : "All Users"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="end">
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {language === "th" ? "เลือกคน" : "Select Users"}
                </p>
                <div className="space-y-2 max-h-64 overflow-auto">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                      onClick={() => toggleUserSelection(user.id)}
                    >
                      <Checkbox
                        checked={selectedUserIds.includes(user.id)}
                        onCheckedChange={() => toggleUserSelection(user.id)}
                      />
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="text-xs">
                          {user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{user.name}</span>
                    </div>
                  ))}
                </div>
                {selectedUserIds.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => setSelectedUserIds([])}
                  >
                    {language === "th" ? "ล้างการเลือก" : "Clear Selection"}
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* View Mode */}
          <Select value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">
                {language === "th" ? "รายสัปดาห์" : "Weekly"}
              </SelectItem>
              <SelectItem value="month">
                {language === "th" ? "รายเดือน" : "Monthly"}
              </SelectItem>
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
            <>
              {format(dates[0], "d MMM", { locale })} -{" "}
              {format(dates[dates.length - 1], "d MMM yyyy", { locale })}
            </>
          ) : (
            format(currentDate, "MMMM yyyy", { locale })
          )}
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            {language === "th" ? "รวมทั้งหมด" : "Total"}:{" "}
            {formatHours(
              filteredUsers.reduce((sum, user) => sum + getTotalHoursForUser(user.id), 0)
            )}
          </Badge>
        </div>
      </div>

      {/* Time Sheet Table */}
      <Card>
        <CardContent className="p-0">
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
                        "p-2 text-center min-w-[100px] text-sm font-medium",
                        isSameDay(date, new Date()) && "bg-primary/10"
                      )}
                    >
                      <div>{format(date, "EEE", { locale })}</div>
                      <div className="text-muted-foreground">
                        {format(date, "d", { locale })}
                      </div>
                    </th>
                  ))}
                  <th className="p-3 text-center min-w-[80px] bg-muted/50">
                    {language === "th" ? "รวม" : "Total"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const isExpanded = expandedUsers.has(user.id);
                  const userTotalHours = getTotalHoursForUser(user.id);

                  return (
                    <Fragment key={user.id}>
                      {/* User Summary Row */}
                      <tr
                        className="border-b hover:bg-muted/30 cursor-pointer"
                        onClick={() => toggleUserExpanded(user.id)}
                      >
                        <td className="sticky left-0 bg-background p-3 z-10">
                          <div className="flex items-center gap-3">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleUserExpanded(user.id);
                              }}
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatar} />
                              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        {dates.map((date) => {
                          const hours = getTotalHoursForUserOnDate(user.id, date);
                          const taskCount = getTasksForUserOnDate(user.id, date).length;
                          return (
                            <td
                              key={date.toISOString()}
                              className={cn(
                                "p-2 text-center",
                                isSameDay(date, new Date()) && "bg-primary/10"
                              )}
                            >
                              {taskCount > 0 ? (
                                <div>
                                  <div className="font-medium">{formatHours(hours)}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {taskCount} {language === "th" ? "งาน" : "tasks"}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="p-3 text-center bg-muted/30">
                          <div className="font-bold">{formatHours(userTotalHours)}</div>
                        </td>
                      </tr>

                      {/* Expanded Task Rows */}
                      {isExpanded &&
                        dates.map((date) => {
                          const userTasks = getTasksForUserOnDate(user.id, date);
                          if (userTasks.length === 0) return null;

                          return userTasks.map((task, idx) => (
                            <tr
                              key={`${user.id}-${date.toISOString()}-${task.id}`}
                              className="border-b bg-muted/10"
                            >
                              <td className="sticky left-0 bg-muted/10 p-3 pl-14 z-10">
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant="outline"
                                    className="text-[10px]"
                                    style={{
                                      borderColor: getStatus(task.statusId)?.color,
                                      color: getStatus(task.statusId)?.color,
                                    }}
                                  >
                                    {getStatus(task.statusId)?.name}
                                  </Badge>
                                  <span className="text-sm truncate max-w-[150px]">
                                    {task.title}
                                  </span>
                                </div>
                              </td>
                              {dates.map((d) => {
                                const isTaskDate = isSameDay(d, date);
                                return (
                                  <td
                                    key={d.toISOString()}
                                    className={cn(
                                      "p-2 text-center text-sm",
                                      isSameDay(d, new Date()) && "bg-primary/10"
                                    )}
                                  >
                                    {isTaskDate ? (
                                      <span className="text-muted-foreground">
                                        {formatHours(
                                          (task.timeSpent || task.timeEstimate || 0) / 60
                                        )}
                                      </span>
                                    ) : (
                                      ""
                                    )}
                                  </td>
                                );
                              })}
                              <td className="p-3 text-center bg-muted/30">
                                <span className="text-sm text-muted-foreground">
                                  {formatHours(
                                    (task.timeSpent || task.timeEstimate || 0) / 60
                                  )}
                                </span>
                              </td>
                            </tr>
                          ));
                        })}
                    </Fragment>
                  );
                })}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td
                      colSpan={dates.length + 2}
                      className="p-8 text-center text-muted-foreground"
                    >
                      {language === "th"
                        ? "ไม่พบข้อมูลพนักงาน"
                        : "No employees found"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {language === "th" ? "รวมชั่วโมงทำงาน" : "Total Work Hours"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatHours(
                filteredUsers.reduce((sum, user) => sum + getTotalHoursForUser(user.id), 0)
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {language === "th" ? "จำนวนพนักงาน" : "Employees"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredUsers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {language === "th" ? "จำนวนงานทั้งหมด" : "Total Tasks"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredUsers.reduce((sum, user) => {
                return (
                  sum +
                  dates.reduce((d, date) => d + getTasksForUserOnDate(user.id, date).length, 0)
                );
              }, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {language === "th" ? "เฉลี่ยต่อวัน" : "Avg per Day"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatHours(
                filteredUsers.reduce((sum, user) => sum + getTotalHoursForUser(user.id), 0) /
                  dates.length
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
