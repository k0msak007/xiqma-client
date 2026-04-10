"use client";

import { useState, useMemo } from "react";
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isToday, isSameDay, addWeeks, subWeeks, startOfMonth, endOfMonth, isWithinInterval, differenceInDays } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar, Users, Filter } from "lucide-react";
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
import { useTaskStore } from "@/lib/store";
import { users, getListById } from "@/lib/mock-data";
import type { Task } from "@/lib/types";

type ViewMode = "week" | "2weeks" | "month";

export default function ResourcesPage() {
  const { tasks } = useTaskStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("2weeks");
  const [selectedUserId, setSelectedUserId] = useState<string>("all");

  // Calculate date range based on view mode
  const dateRange = useMemo(() => {
    const start = viewMode === "month" 
      ? startOfMonth(currentDate)
      : startOfWeek(currentDate, { weekStartsOn: 1 });
    
    const end = viewMode === "month"
      ? endOfMonth(currentDate)
      : viewMode === "2weeks"
        ? endOfWeek(addWeeks(currentDate, 1), { weekStartsOn: 1 })
        : endOfWeek(currentDate, { weekStartsOn: 1 });
    
    return { start, end };
  }, [currentDate, viewMode]);

  const days = useMemo(() => {
    return eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
  }, [dateRange]);

  // Navigate through time
  const navigate = (direction: "prev" | "next") => {
    const amount = viewMode === "month" ? 1 : viewMode === "2weeks" ? 2 : 1;
    if (direction === "prev") {
      setCurrentDate(viewMode === "month" 
        ? new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
        : subWeeks(currentDate, amount));
    } else {
      setCurrentDate(viewMode === "month"
        ? new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
        : addWeeks(currentDate, amount));
    }
  };

  // Filter users
  const filteredUsers = useMemo(() => {
    if (selectedUserId === "all") return users;
    return users.filter(u => u.id === selectedUserId);
  }, [selectedUserId]);

  // Get tasks for each user within the date range
  const userTasks = useMemo(() => {
    const result: Record<string, typeof tasks> = {};
    
    filteredUsers.forEach(user => {
      result[user.id] = tasks.filter(task => {
        // Check if user is assigned
        if (!task.assigneeIds.includes(user.id)) return false;
        
        // Check if task has dates that fall within range
        const taskStart = task.actualStart || task.startDate || task.createdAt;
        const taskEnd = task.actualFinish || task.dueDate;
        
        if (!taskStart && !taskEnd) return false;
        
        const startDate = new Date(taskStart);
        const endDate = taskEnd ? new Date(taskEnd) : addDays(startDate, 1);
        
        // Check if task overlaps with date range
        return startDate <= dateRange.end && endDate >= dateRange.start;
      });
    });
    
    return result;
  }, [filteredUsers, tasks, dateRange]);

  // Calculate task bar position and width based on Duration counting backwards from Due Date
  const getTaskBarStyle = (task: Task) => {
    // If we have dueDate and duration, calculate start from dueDate - duration
    let startDate: Date;
    let endDate: Date;
    
    if (task.dueDate && task.duration) {
      endDate = new Date(task.dueDate);
      startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - task.duration);
    } else if (task.planStart && task.duration) {
      startDate = new Date(task.planStart);
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + task.duration);
    } else {
      // Fallback to actual dates or created date
      const taskStart = task.actualStart || task.startDate || task.createdAt;
      const taskEnd = task.actualFinish || task.dueDate;
      startDate = new Date(taskStart);
      endDate = taskEnd ? new Date(taskEnd) : addDays(startDate, 1);
    }
    
    // Clamp dates to range
    const clampedStart = startDate < dateRange.start ? dateRange.start : startDate;
    const clampedEnd = endDate > dateRange.end ? dateRange.end : endDate;
    
    const totalDays = days.length;
    const startOffset = differenceInDays(clampedStart, dateRange.start);
    const duration = differenceInDays(clampedEnd, clampedStart) + 1;
    
    const left = (startOffset / totalDays) * 100;
    const width = (duration / totalDays) * 100;
    
    return { left: `${Math.max(0, left)}%`, width: `${Math.min(100 - left, width)}%` };
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold">Resources</h1>
            <Badge variant="secondary" className="font-normal">
              Gantt Chart
            </Badge>
          </div>
        </div>

        {/* Toolbar */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Navigation */}
            <Button variant="outline" size="icon" onClick={() => navigate("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigate("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            <span className="ml-2 font-medium">
              {format(dateRange.start, "MMM d")} - {format(dateRange.end, "MMM d, yyyy")}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* User Filter */}
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="h-8 w-[180px]">
                <Users className="mr-1.5 h-3.5 w-3.5" />
                <SelectValue placeholder="Filter by user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Team Members</SelectItem>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* View Mode */}
            <Select value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <SelectTrigger className="h-8 w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">1 Week</SelectItem>
                <SelectItem value="2weeks">2 Weeks</SelectItem>
                <SelectItem value="month">Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="flex flex-1 overflow-hidden">
        {/* User Column */}
        <div className="w-[200px] shrink-0 border-r bg-muted/30">
          {/* Header */}
          <div className="h-16 border-b px-4 py-2 flex items-end">
            <span className="text-sm font-medium text-muted-foreground">Team Member</span>
          </div>
          
          {/* User Rows */}
          {filteredUsers.map(user => {
            const taskCount = userTasks[user.id]?.length || 0;
            return (
              <div 
                key={user.id} 
                className="flex items-center gap-3 border-b px-4 py-3 h-[80px]"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium truncate">{user.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {taskCount} task{taskCount !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            );
          })}
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
                    <span className="text-xs text-muted-foreground">
                      {format(day, "EEE")}
                    </span>
                    <span className={cn(
                      "text-sm font-medium",
                      isToday(day) && "text-primary"
                    )}>
                      {format(day, "d")}
                    </span>
                  </div>
                ))}
              </div>

              {/* Task Rows */}
              {filteredUsers.map(user => {
                const userTaskList = userTasks[user.id] || [];
                
                return (
                  <div 
                    key={user.id} 
                    className="relative flex h-[80px] border-b"
                  >
                    {/* Grid Lines */}
                    {days.map((day, idx) => (
                      <div 
                        key={idx}
                        className={cn(
                          "flex-1 border-r",
                          isToday(day) && "bg-primary/5"
                        )}
                      />
                    ))}
                    
                    {/* Task Bars */}
                    <div className="absolute inset-0 p-2 flex flex-col gap-1 overflow-hidden">
                      {userTaskList.slice(0, 3).map((task, idx) => {
                        const style = getTaskBarStyle(task);
                        const list = getListById(task.listId);
                        const status = list?.statuses.find(s => s.id === task.statusId);
                        const taskDuration = task.duration || (task.dueDate && task.planStart 
                          ? Math.ceil((new Date(task.dueDate).getTime() - new Date(task.planStart).getTime()) / (1000 * 60 * 60 * 24))
                          : null);
                        
                        return (
                          <div
                            key={task.id}
                            className="absolute h-6 rounded px-2 flex items-center gap-1 text-xs text-white truncate cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
                            style={{
                              left: style.left,
                              width: style.width,
                              top: `${8 + idx * 24}px`,
                              backgroundColor: status?.color || "#6b7280",
                            }}
                            title={`${task.title} - ${status?.name || "No Status"}${taskDuration ? ` (${taskDuration} days)` : ""}`}
                          >
                            <span className="truncate font-medium">{task.title}</span>
                            {taskDuration && (
                              <Badge variant="secondary" className="h-4 px-1 text-[10px] bg-white/20 text-white shrink-0">
                                {taskDuration}d
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                      {userTaskList.length > 3 && (
                        <div 
                          className="absolute bottom-1 right-2 text-xs text-muted-foreground"
                        >
                          +{userTaskList.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredUsers.length === 0 && (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  No team members found
                </div>
              )}
            </div>
        </ScrollArea>
      </div>

      {/* Legend - Show status colors from a sample list */}
      <div className="border-t px-6 py-3 bg-muted/30">
        <div className="flex items-center gap-6">
          <span className="text-xs text-muted-foreground">Status Colors:</span>
          {(() => {
            // Get unique statuses from all lists
            const allStatuses = new Map<string, { name: string; color: string }>();
            tasks.forEach(task => {
              const list = getListById(task.listId);
              const status = list?.statuses.find(s => s.id === task.statusId);
              if (status && !allStatuses.has(status.name)) {
                allStatuses.set(status.name, { name: status.name, color: status.color });
              }
            });
            return Array.from(allStatuses.values()).slice(0, 6).map((status) => (
              <div key={status.name} className="flex items-center gap-1.5">
                <div 
                  className="h-3 w-3 rounded"
                  style={{ backgroundColor: status.color }}
                />
                <span className="text-xs">{status.name}</span>
              </div>
            ));
          })()}
        </div>
      </div>
    </div>
  );
}
