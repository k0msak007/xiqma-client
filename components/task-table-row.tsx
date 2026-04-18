"use client";

import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Play, Square, MoreHorizontal, UserPlus, Check, Flag, TrendingUp, TrendingDown, Minus, Timer, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
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
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTaskStore } from "@/lib/store";
import { getUserById, getTaskTypeById } from "@/lib/mock-data";
import { 
  priorityConfig, 
  storyPointsOptions,
  calculatePlanFinish,
  calculatePlanProgress,
  calculateActualProgress,
  calculateVariance 
} from "@/lib/types";
import { employeesApi, type Employee } from "@/lib/api/employees";
import { toast } from "sonner";
import type { Task, Priority, StoryPoints, Status } from "@/lib/types";

interface TaskTableRowProps {
  task: Task;
  onClick: () => void;
  isSelected: boolean;
  statuses: Status[];
  onUpdate?: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onDelete?: (taskId: string) => Promise<void>;
}

export function TaskTableRow({ task, onClick, isSelected, statuses, onUpdate, onDelete }: TaskTableRowProps) {
  const store = useTaskStore();
  const { updateTask: storeUpdateTask, deleteTask, taskTypes } = store;
  const user = useAuthStore((s) => s.user);
  const [runningTimer, setRunningTimer] = useState<{ id: string; startedAt: string } | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [localTimeSpent, setLocalTimeSpent] = useState(task.timeSpent || 0);
  const [showReassignDialog, setShowReassignDialog] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState<string>(task.assigneeIds[0] || "");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  // Sync localTimeSpent when task.timeSpent changes
  useEffect(() => {
    setLocalTimeSpent(task.timeSpent || 0);
  }, [task.timeSpent]);

  // Check if user can timer (admin or assignee)
  const canTimer = user && (user.role === "admin" || task.assigneeIds.includes(user.id));

  // Check for running timer on mount and periodically
  useEffect(() => {
    const checkTimer = async () => {
      try {
        const sessions = await tasksApi.getTimer(task.id);
        const running = sessions.find(s => !s.endedAt);
        if (running) {
          setRunningTimer(running);
          const startTime = new Date(running.startedAt).getTime();
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          setElapsedTime(elapsed);
        } else {
          setRunningTimer(null);
          setElapsedTime(0);
        }
      } catch { /* ignore */ }
    };
    
    checkTimer();
    const interval = setInterval(checkTimer, 10000);
    return () => clearInterval(interval);
  }, [task.id]);

  // Update elapsed time every second when tracking
  useEffect(() => {
    if (!runningTimer) return;
    const interval = setInterval(() => {
      const startTime = new Date(runningTimer.startedAt).getTime();
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedTime(elapsed);
    }, 1000);
    return () => clearInterval(interval);
  }, [runningTimer]);

  const isTracking = !!runningTimer;

  // Load employees when reassign dialog opens
  useEffect(() => {
    if (showReassignDialog && employees.length === 0) {
      setLoadingEmployees(true);
      employeesApi.listAll()
        .then((emps) => setEmployees(emps.filter(e => e.isActive)))
        .catch(console.error)
        .finally(() => setLoadingEmployees(false));
    }
  }, [showReassignDialog]);
  
  const status = statuses.find(s => s.id === task.statusId);
  const taskType = task.taskTypeId ? getTaskTypeById(task.taskTypeId) : null;
  const assignees = task.assigneeIds.map(id => getUserById(id)).filter(Boolean);

  // Calculate plan finish from plan start + duration
  const planFinish = useMemo(() => {
    return calculatePlanFinish(task.planStart, task.duration);
  }, [task.planStart, task.duration]);

  // Calculate progress values
  const planProgress = useMemo(() => {
    return calculatePlanProgress(task.planStart, planFinish);
}, [task.planStart, planFinish]);

  // Actual % shows user's estimated progress (from estimateProgress field)
  const actualProgress = task.estimateProgress ?? 0;

const variance = useMemo(() => {
    return calculateVariance(planProgress, actualProgress);
  }, [planProgress, actualProgress]);

  // Sync selected assignee when task changes
  useEffect(() => {
    setSelectedAssignee(task.assigneeIds[0] || "");
  }, [task.assigneeIds]);

  // Handle update - call API if available, otherwise update local store
  const handleUpdate = async (updates: Partial<Task>) => {
    // If assigning to someone, also set assigneeId for API compatibility
    const apiUpdates: any = { ...updates };
    if (updates.assigneeIds && updates.assigneeIds.length > 0) {
      apiUpdates.assigneeId = updates.assigneeIds[0];
    }
    
    if (onUpdate) {
      await onUpdate(task.id, apiUpdates);
    }
    // Only update local store for non-timeSpent fields (timeSpent will be updated after API returns)
    const { timeSpent, ...localUpdates } = updates;
    if (Object.keys(localUpdates).length > 0) {
      storeUpdateTask(task.id, localUpdates);
    }
  };

  const handleToggleTracking = async () => {
    try {
      if (runningTimer) {
        // Stop timer
        await tasksApi.stopTimer(task.id);
        setRunningTimer(null);
        setElapsedTime(0);
        toast.success("Timer stopped");
        // Refresh task to get updated accumulated time
        const updatedTask = await tasksApi.get(task.id);
        const newTimeSpent = (updatedTask as any).accumulated_minutes || (updatedTask as any).accumulatedMinutes || 0;
        setLocalTimeSpent(newTimeSpent);
      } else {
        // Start timer
        const session = await tasksApi.startTimer(task.id);
        setRunningTimer(session);
        const startTime = new Date(session.startedAt).getTime();
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setElapsedTime(elapsed);
        
        // Set actual start if not set
        if (!task.actualStart) {
          handleUpdate({ actualStart: new Date() });
        }
      }
    } catch (err: any) {
      if (err?.data?.error === "SESSION_ALREADY_RUNNING") {
        alert(`มี timer กำลังทำงานอยู่แล้ว (task: ${err.data.runningTaskId})`);
      } else {
        alert("Failed to toggle timer");
      }
    }
  };

  const handleReassign = async () => {
    if (onUpdate) {
      // Pass both assigneeId (for API) and assigneeIds (for local store)
      await onUpdate(task.id, { 
        assigneeId: selectedAssignee || null,
        assigneeIds: selectedAssignee ? [selectedAssignee] : []
      } as any);
      toast.success("Task reassigned successfully");
    }
    setShowReassignDialog(false);
  };

  const toggleAssignee = (userId: string) => {
    setSelectedAssignee(userId);
  };

  const formatElapsedTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatTimeSpent = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  const getVarianceMeta = (v: number) => {
    if (v > 10) return { color: "text-red-600 bg-red-50 border-red-200", icon: TrendingDown, label: "Behind" };
    if (v < -10) return { color: "text-green-600 bg-green-50 border-green-200", icon: TrendingUp, label: "Ahead" };
    return { color: "text-muted-foreground bg-muted border-transparent", icon: Minus, label: "On track" };
  };

  const isCompleted = status?.type === "completed" || status?.type === "closed";
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !isCompleted;
  const varianceMeta = getVarianceMeta(variance);
  const VarianceIcon = varianceMeta.icon;

  return (
    <>
      <tr
        className={cn(
          "group relative border-b transition-all cursor-pointer",
          "hover:bg-primary/[0.03]",
          isSelected && "bg-primary/5",
          isTracking && "bg-red-50/40",
          isCompleted && "opacity-75"
        )}
        onClick={onClick}
      >
        {/* Task ID (with priority accent bar) */}
        <td className="relative px-2 py-2.5 text-[11px] text-muted-foreground font-mono" onClick={onClick}>
          <div
            className={cn(
              "absolute inset-y-0 left-0 w-1 transition-all opacity-40 group-hover:opacity-100",
              isSelected && "opacity-100"
            )}
            style={{ backgroundColor: priorityConfig[task.priority].color }}
          />
          <span className="rounded bg-muted/60 px-1.5 py-0.5">{task.taskId || "-"}</span>
        </td>

        {/* Title */}
        <td className="px-2 py-2.5" onClick={onClick}>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={isCompleted}
              onCheckedChange={(checked) => {
                const newStatus = checked
                  ? statuses.find(s => s.type === "completed")?.id
                  : statuses.find(s => s.type === "pending")?.id;
                if (newStatus) {
                  handleUpdate({
                    statusId: newStatus,
                    completedAt: checked ? new Date() : undefined,
                    actualFinish: checked ? new Date() : undefined
                  });
                }
              }}
              onClick={(e) => e.stopPropagation()}
              className="shrink-0"
            />
            <div className="flex min-w-0 flex-1 flex-col">
              <span
                className={cn(
                  "text-sm font-medium truncate max-w-[220px]",
                  isCompleted && "line-through text-muted-foreground"
                )}
              >
                {task.title}
              </span>
              {(task.tags?.length > 0 || isOverdue) && (
                <div className="mt-0.5 flex items-center gap-1">
                  {isOverdue && (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-red-600">
                      <AlertCircle className="h-2.5 w-2.5" /> OVERDUE
                    </span>
                  )}
                  {task.tags?.slice(0, 2).map(t => (
                    <span key={t} className="text-[9px] text-muted-foreground bg-muted/60 rounded px-1">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </td>

        {/* Status — colored pill */}
        <td className="px-2 py-2.5" onClick={(e) => e.stopPropagation()}>
          <Select value={task.statusId} onValueChange={(v) => handleUpdate({ statusId: v })}>
            <SelectTrigger
              className="h-6 w-[108px] border-0 px-2 text-[11px] font-semibold shadow-none focus:ring-0 hover:brightness-95"
              style={{
                backgroundColor: `${status?.color}1a`,
                color: status?.color,
              }}
            >
              <span className="truncate">{status?.name}</span>
            </SelectTrigger>
            <SelectContent>
              {statuses.map(s => (
                <SelectItem key={s.id} value={s.id}>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                    {s.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </td>

        {/* Task Type */}
        <td className="px-2 py-2.5" onClick={(e) => e.stopPropagation()}>
          <Select
            value={task.taskTypeId || "none"}
            onValueChange={(value) => handleUpdate({ taskTypeId: value === "none" ? undefined : value })}
          >
            <SelectTrigger className="h-7 w-[100px] border-transparent bg-transparent text-xs hover:bg-muted focus:ring-0">
              {taskType ? (
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: taskType.color }} />
                  <span className="truncate">{taskType.name}</span>
                </div>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">—</SelectItem>
              {taskTypes.map(tt => (
                <SelectItem key={tt.id} value={tt.id}>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: tt.color }} />
                    {tt.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </td>

        {/* Priority — flag icon */}
        <td className="px-2 py-2.5" onClick={(e) => e.stopPropagation()}>
          <Select value={task.priority} onValueChange={(v) => handleUpdate({ priority: v as Priority })}>
            <SelectTrigger className="h-7 w-[96px] border-transparent bg-transparent text-xs hover:bg-muted focus:ring-0">
              <div className="flex items-center gap-1.5">
                <Flag
                  className="h-3 w-3 shrink-0"
                  style={{ color: priorityConfig[task.priority].color, fill: priorityConfig[task.priority].color }}
                />
                <span className="truncate">{priorityConfig[task.priority].label}</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(priorityConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-1.5">
                    <Flag className="h-3 w-3" style={{ color: config.color, fill: config.color }} />
                    {config.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </td>

        {/* Points */}
        <td className="px-2 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
          <Select
            value={task.storyPoints?.toString() || "none"}
            onValueChange={(value) => handleUpdate({ storyPoints: value === "none" ? undefined : parseInt(value) as StoryPoints })}
          >
            <SelectTrigger className="mx-auto h-7 w-[52px] border-transparent bg-transparent text-xs font-semibold hover:bg-muted focus:ring-0 [&>svg]:hidden justify-center">
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">—</SelectItem>
              {storyPointsOptions.map(point => (
                <SelectItem key={point} value={point.toString()}>{point}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </td>

        {/* Duration */}
        <td className="px-2 py-2.5" onClick={(e) => e.stopPropagation()}>
          <Input
            type="number"
            min="1"
            value={task.duration || ""}
            onChange={(e) => handleUpdate({ duration: e.target.value ? parseInt(e.target.value) : undefined })}
            className="h-7 w-[56px] border-transparent bg-transparent text-xs hover:bg-muted focus:bg-background"
            placeholder="—"
          />
        </td>

        {/* Plan Start */}
        <td className="px-2 py-2.5" onClick={(e) => e.stopPropagation()}>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-7 justify-start px-2 text-xs font-normal w-[92px]",
                  !task.planStart && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-1 h-3 w-3 opacity-60" />
                {task.planStart ? format(new Date(task.planStart), "MMM d") : "—"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={task.planStart ? new Date(task.planStart) : undefined}
                onSelect={(date) => handleUpdate({ planStart: date || undefined })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </td>

        {/* Plan Finish (calculated) */}
        <td className="px-2 py-2.5 text-xs text-muted-foreground">
          <span className="rounded bg-muted/40 px-2 py-1">
            {planFinish ? format(planFinish, "MMM d") : "—"}
          </span>
        </td>

        {/* Actual Start */}
        <td className="px-2 py-2.5" onClick={(e) => e.stopPropagation()}>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-7 justify-start px-2 text-xs font-normal w-[92px]",
                  task.actualStart ? "text-green-700" : "text-muted-foreground"
                )}
              >
                <Play className="mr-1 h-3 w-3" />
                {task.actualStart && !isNaN(new Date(task.actualStart).getTime())
                  ? format(new Date(task.actualStart), "MMM d")
                  : "—"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={task.actualStart && !isNaN(new Date(task.actualStart).getTime()) ? new Date(task.actualStart) : undefined}
                onSelect={(date) => handleUpdate({ actualStart: date || undefined })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </td>

        {/* Actual Finish */}
        <td className="px-2 py-2.5" onClick={(e) => e.stopPropagation()}>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-7 justify-start px-2 text-xs font-normal w-[92px]",
                  task.actualFinish ? "text-green-700" : "text-muted-foreground"
                )}
              >
                <Check className="mr-1 h-3 w-3" />
                {task.actualFinish && !isNaN(new Date(task.actualFinish).getTime())
                  ? format(new Date(task.actualFinish), "MMM d")
                  : "—"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={task.actualFinish && !isNaN(new Date(task.actualFinish).getTime()) ? new Date(task.actualFinish) : undefined}
                onSelect={(date) => handleUpdate({ actualFinish: date || undefined })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </td>

        {/* %Plan Progress — bar */}
        <td className="px-2 py-2.5">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex w-[80px] items-center gap-1.5">
                  <Progress value={planProgress} className="h-1.5 flex-1 [&>div]:bg-slate-400" />
                  <span className="text-[10px] font-mono font-medium tabular-nums text-muted-foreground w-7 text-right">
                    {planProgress.toFixed(0)}%
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>Plan Progress: (Today − PlanStart) / Duration</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </td>

        {/* %Actual Progress — bar */}
        <td className="px-2 py-2.5">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex w-[80px] items-center gap-1.5">
                  <Progress
                    value={actualProgress}
                    className={cn(
                      "h-1.5 flex-1",
                      actualProgress >= 100 ? "[&>div]:bg-green-500" : "[&>div]:bg-primary"
                    )}
                  />
                  <span className="text-[10px] font-mono font-semibold tabular-nums w-7 text-right">
                    {actualProgress.toFixed(0)}%
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>Actual Progress: Estimated by user</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </td>

        {/* %Variance — with icon */}
        <td className="px-2 py-2.5">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-mono font-semibold tabular-nums",
                    varianceMeta.color
                  )}
                >
                  <VarianceIcon className="h-2.5 w-2.5" />
                  {variance > 0 ? "+" : ""}{variance.toFixed(0)}%
                </span>
              </TooltipTrigger>
              <TooltipContent>{varianceMeta.label} — Plan − Actual</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </td>

        {/* Time Tracking */}
        <td className="px-2 py-2.5" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1.5">
            {isTracking ? (
              <>
                <span className="inline-flex items-center gap-1 rounded-md bg-red-500/10 px-1.5 py-1 text-[10px] font-mono font-semibold text-red-600">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
                  </span>
                  {formatElapsedTime(elapsedTime)}
                </span>
                {canTimer && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-full bg-red-500 text-white hover:bg-red-600 hover:text-white"
                          onClick={handleToggleTracking}
                        >
                          <Square className="h-2.5 w-2.5 fill-current" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Stop timer</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </>
            ) : (
              <>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground min-w-[52px]">
                  {localTimeSpent > 0 ? (
                    <>
                      <Timer className="h-3 w-3" />
                      {formatTimeSpent(localTimeSpent)}
                    </>
                  ) : (
                    <span className="text-muted-foreground/60">—</span>
                  )}
                </span>
                {canTimer && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 hover:bg-primary/10 hover:text-primary"
                          onClick={handleToggleTracking}
                        >
                          <Play className="h-3 w-3 fill-current" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Start timer</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </>
            )}
          </div>
        </td>

        {/* Assignees */}
        <td className="px-2 py-2.5" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center">
            <div className="flex -space-x-1.5">
              {assignees.slice(0, 3).map(user => user && (
                <TooltipProvider key={user.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Avatar className="h-6 w-6 border-2 border-background transition-transform hover:z-10 hover:scale-110 cursor-pointer">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-[9px] font-semibold">
                          {user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>{user.name}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
              {assignees.length > 3 && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-muted text-[9px] font-semibold text-muted-foreground">
                  +{assignees.length - 3}
                </div>
              )}
              {assignees.length === 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setShowReassignDialog(true)}
                        className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                      >
                        <UserPlus className="h-3 w-3" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Assign</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </td>

        {/* Actions */}
        <td className="px-2 py-2.5" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={onClick}>View Details</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowReassignDialog(true)}>
                <UserPlus className="mr-2 h-3.5 w-3.5" /> Re-assign
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  if (onUpdate) {
                    onUpdate(task.id, { estimateProgress: 100 });
                    toast.success("Marked as complete");
                  }
                }}
              >
                <Check className="mr-2 h-3.5 w-3.5" /> Mark as Complete
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => {
                  if (onDelete) onDelete(task.id);
                  else deleteTask(task.id);
                }}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </td>
      </tr>

      {/* Re-assign Dialog */}
      <Dialog open={showReassignDialog} onOpenChange={setShowReassignDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Re-assign Task</DialogTitle>
            <DialogDescription>
              Select team members to assign to this task.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 max-h-[300px] overflow-auto">
            {loadingEmployees ? (
              <div className="text-center text-muted-foreground py-4">Loading...</div>
            ) : employees.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">No employees found</div>
            ) : (
              <div className="space-y-2">
                {employees.map(emp => (
                  <div 
                    key={emp.id}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted transition-colors",
                      selectedAssignee.includes(emp.id) && "bg-muted"
                    )}
                    onClick={() => toggleAssignee(emp.id)}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={emp.avatarUrl ?? undefined} />
                      <AvatarFallback>{emp.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{emp.name}</p>
                      <p className="text-xs text-muted-foreground">{emp.role}</p>
                    </div>
                    {selectedAssignee.includes(emp.id) && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReassignDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleReassign}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
