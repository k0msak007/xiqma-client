"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Calendar, Clock, MoreHorizontal, User, MessageSquare, Play, Square, CheckCircle2, Circle, GripVertical, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { tasksApi } from "@/lib/api/tasks";
import { useAuthStore } from "@/lib/auth-store";
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
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { priorityConfig, type Task, type Status, type Priority } from "@/lib/types";
import { getCachedEmployee } from "@/lib/employee-cache";
import { toast } from "sonner";

interface TaskCardBoardProps {
  task: Task;
  onClick?: () => void;
  isSelected?: boolean;
  statuses?: Status[];
  onUpdate?: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onDelete?: (taskId: string) => Promise<void>;
}

function formatTimeSpent(minutes: number) {
  if (!minutes) return "0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function TaskCardBoard({ task, onClick, isSelected, statuses = [], onUpdate, onDelete }: TaskCardBoardProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [localTimeSpent, setLocalTimeSpent] = useState(task.timeSpent || 0);
  const [runningTimer, setRunningTimer] = useState<{ id: string; startedAt: string } | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  
  // Sync localTimeSpent when task.timeSpent changes (e.g., from parent refresh)
  useEffect(() => {
    setLocalTimeSpent(task.timeSpent || 0);
  }, [task.timeSpent]);
  
  const priorityInfo = priorityConfig[task.priority];
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
  const isCompleted = task.estimateProgress === 100;
  const canTimer = user && (user.role === "admin" || task.assigneeIds.includes(user.id));
  const isTracking = !!runningTimer;
  
  // Update elapsed time every second when tracking
  useEffect(() => {
    if (!runningTimer) return;
    
    const updateElapsed = () => {
      if (runningTimer) {
        const startTime = new Date(runningTimer.startedAt).getTime();
        setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
      }
    };
    
    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [runningTimer]);
  
  // Check for running timer on mount
  useEffect(() => {
    const checkTimer = async () => {
      try {
        const sessions = await tasksApi.getTimer(task.id);
        const running = sessions.find(s => !s.endedAt);
        if (running) {
          setRunningTimer(running);
        } else {
          setRunningTimer(null);
          setElapsedSeconds(0);
        }
      } catch { /* ignore */ }
    };
    checkTimer();
  }, [task.id]);
  
  // Timer toggle
  const toggleTimer = async () => {
    try {
      if (runningTimer) {
        const stopResult = await tasksApi.stopTimer(task.id);
        setRunningTimer(null);
        setElapsedSeconds(0);
        toast.success("Timer stopped");
        
        // Use duration from stop result (this is the time added in this session)
        const addedMinutes = stopResult?.durationMin ?? 0;
        const newTimeSpent = localTimeSpent + addedMinutes;
        setLocalTimeSpent(newTimeSpent);
      } else {
        const session = await tasksApi.startTimer(task.id);
        setRunningTimer(session);
        const startTime = new Date(session.startedAt).getTime();
        setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
        toast.success("Timer started");
      }
    } catch (err: any) {
      if (err?.data?.error === "SESSION_ALREADY_RUNNING") {
        toast.error("Timer already running");
      } else {
        toast.error("Failed to toggle timer");
      }
    }
  };
  
  const formatElapsed = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };
  
  // Get current status
  const currentStatus = statuses.find(s => s.id === task.statusId);
  
  // Quick edit handlers
  const handleStatusChange = async (newStatusId: string) => {
    if (onUpdate) {
      await onUpdate(task.id, { statusId: newStatusId });
      toast.success("Status updated");
    }
  };
  
  const handlePriorityChange = async (newPriority: Priority) => {
    if (onUpdate) {
      await onUpdate(task.id, { priority: newPriority });
      toast.success("Priority updated");
    }
  };
  
  const handleProgressChange = async (value: number) => {
    if (onUpdate) {
      await onUpdate(task.id, { estimateProgress: value });
    }
  };
  
  const handleDueDateChange = async (date: Date | undefined) => {
    if (onUpdate) {
      await onUpdate(task.id, { 
        dueDate: date
      });
      toast.success("Due date updated");
    }
  };
  
  const handleActualStartChange = async (date: Date | undefined) => {
    if (onUpdate) {
      await onUpdate(task.id, { 
        actualStart: date
      });
      toast.success("Actual start updated");
    }
  };
  
  const handleActualFinishChange = async (date: Date | undefined) => {
    if (onUpdate) {
      await onUpdate(task.id, { 
        actualFinish: date
      });
      toast.success("Actual finish updated");
    }
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative cursor-pointer rounded-xl border-2 bg-card p-3 shadow-sm transition-all hover:shadow-md",
        isSelected && "ring-2 ring-primary border-primary",
        isCompleted && "border-green-200 bg-green-50/50"
      )}
      style={{ 
        borderLeftColor: currentStatus?.color || priorityInfo.color,
        borderLeftWidth: '4px'
      }}
    >
      {/* Status Badge - Click to change */}
      <div className="mb-2 flex items-center justify-between">
        <Select 
          value={task.statusId} 
          onValueChange={handleStatusChange}
          onOpenChange={(open) => {
            if (!open) return;
            event?.stopPropagation();
          }}
        >
          <SelectTrigger 
            className="h-6 w-fit px-2 text-[10px] font-medium"
            style={{ 
              backgroundColor: `${currentStatus?.color}20`,
              color: currentStatus?.color 
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((status) => (
              <SelectItem key={status.id} value={status.id} className="text-xs">
                <div className="flex items-center gap-2">
                  <div 
                    className="h-2 w-2 rounded-full" 
                    style={{ backgroundColor: status.color }} 
                  />
                  {status.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push(`/task/${task.id}`)}>
              Open in full page
            </DropdownMenuItem>
            {onUpdate && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleProgressChange(100); }}>
                Mark as Complete
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {onDelete && (
              <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}>
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Title */}
      <h4 className="text-sm font-semibold leading-tight mb-2 line-clamp-2">
        {task.title}
      </h4>

      {/* Progress Bar */}
      {task.estimateProgress !== undefined && task.estimateProgress > 0 && (
        <div className="mb-2">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
            <span>Progress</span>
            <span className="font-medium">{task.estimateProgress}%</span>
          </div>
          <Progress value={task.estimateProgress} className="h-1.5" />
        </div>
      )}

      {/* Dates Grid */}
      <div className="grid grid-cols-2 gap-1 mb-2 text-[10px]">
        {/* Due Date */}
        <Popover>
          <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
            <div 
              className={cn(
                "flex items-center gap-1 rounded px-1.5 py-1 cursor-pointer hover:bg-muted",
                isOverdue && "text-red-600 bg-red-50"
              )}
            >
              <Calendar className="h-3 w-3" />
              <span className="truncate">
                {task.dueDate ? format(new Date(task.dueDate), "MMM d") : "Due"}
              </span>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="single"
              selected={task.dueDate ? new Date(task.dueDate) : undefined}
              onSelect={handleDueDateChange}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* Priority */}
        <Select value={task.priority} onValueChange={handlePriorityChange}>
          <SelectTrigger 
            className="h-6 text-[10px] justify-start px-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              className="h-2 w-2 rounded-full mr-1.5" 
              style={{ backgroundColor: priorityInfo.color }} 
            />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(priorityConfig).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                <div className="flex items-center gap-2">
                  {config.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Actual Start */}
        <Popover>
          <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-1 rounded px-1.5 py-1 cursor-pointer hover:bg-muted text-green-600">
              <Play className="h-3 w-3" />
              <span className="truncate">
                {task.actualStart ? format(new Date(task.actualStart), "MMM d") : "Start"}
              </span>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="single"
              selected={task.actualStart ? new Date(task.actualStart) : undefined}
              onSelect={handleActualStartChange}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* Actual Finish */}
        <Popover>
          <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-1 rounded px-1.5 py-1 cursor-pointer hover:bg-muted text-green-600">
              <Square className="h-3 w-3" />
              <span className="truncate">
                {task.actualFinish ? format(new Date(task.actualFinish), "MMM d") : "Finish"}
              </span>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="single"
              selected={task.actualFinish ? new Date(task.actualFinish) : undefined}
              onSelect={handleActualFinishChange}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Bottom Row */}
      <div className="flex items-center justify-between">
        {/* Story Points */}
        {task.storyPoints && (
          <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-medium">
            {task.storyPoints} SP
          </Badge>
        )}

        {/* Time Spent & Timer */}
        {(task.timeSpent || 0) > 0 || isTracking ? (
          <div className="flex items-center gap-1 text-[10px]">
            {isTracking && (
              <span className="flex items-center gap-1 text-red-500 font-medium">
                <Timer className="h-3 w-3 animate-pulse" />
                {formatElapsed(elapsedSeconds)}
              </span>
            )}
            {!isTracking && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatTimeSpent(localTimeSpent)}
              </div>
            )}
          </div>
        ) : null}

        {/* Timer Button */}
        {canTimer && (
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-6 w-6", isTracking && "text-red-500")}
            onClick={(e) => { e.stopPropagation(); toggleTimer(); }}
          >
            {isTracking ? (
              <Square className="h-3 w-3 fill-current" />
            ) : (
              <Play className="h-3 w-3" />
            )}
          </Button>
        )}

        {/* Comments */}
        {task.comments.length > 0 && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <MessageSquare className="h-3 w-3" />
            {task.comments.length}
          </div>
        )}

        {/* Assignees */}
        <div className="flex -space-x-1">
          {task.assigneeIds.slice(0, 2).map((id) => {
            const emp = getCachedEmployee(id);
            return (
              <Avatar key={id} className="h-5 w-5 border-2 border-background">
                <AvatarImage src={emp?.avatar ?? undefined} />
                <AvatarFallback className="text-[8px]">
                  {emp?.name ? emp.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : id.charAt(0)}
                </AvatarFallback>
              </Avatar>
            );
          })}
          {task.assigneeIds.length > 2 && (
            <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-background bg-muted text-[8px]">
              +{task.assigneeIds.length - 2}
            </div>
          )}
        </div>
      </div>

      {/* Tags */}
      {task.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {task.tags.slice(0, 3).map((tagName) => (
            <Badge
              key={tagName}
              variant="secondary"
              className="h-4 px-1.5 text-[9px]"
            >
              {tagName}
            </Badge>
          ))}
          {task.tags.length > 3 && (
            <span className="text-[9px] text-muted-foreground">
              +{task.tags.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
}