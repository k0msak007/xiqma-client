"use client";

import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Play, Square, MoreHorizontal, UserPlus, Check } from "lucide-react";
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

  const getVarianceColor = (v: number) => {
    if (v > 10) return "text-red-500"; // Behind schedule
    if (v < -10) return "text-green-500"; // Ahead of schedule
    return "text-muted-foreground"; // On track
  };

  return (
    <>
      <tr 
        className={cn(
          "border-b hover:bg-muted/50 transition-colors cursor-pointer",
          isSelected && "bg-muted"
        )}
        onClick={onClick}
      >
        {/* Task ID */}
        <td className="p-2 text-xs text-muted-foreground font-mono" onClick={onClick}>
          {task.taskId || "-"}
        </td>

        {/* Title */}
        <td className="p-2" onClick={onClick}>
          <div className="flex items-center gap-2">
            <Checkbox 
              checked={status?.type === "completed" || status?.type === "closed"}
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
            />
            <span className="text-sm font-medium truncate max-w-[180px]">{task.title}</span>
          </div>
        </td>

        {/* Status */}
        <td className="p-2" onClick={(e) => e.stopPropagation()}>
          <Select
            value={task.statusId}
            onValueChange={(value) => handleUpdate({ statusId: value })}
          >
            <SelectTrigger className="h-7 w-[100px] text-xs">
              <div className="flex items-center gap-1.5">
                <div 
                  className="h-2 w-2 rounded-full shrink-0" 
                  style={{ backgroundColor: status?.color }}
                />
                <span className="truncate">{status?.name}</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              {statuses.map(s => (
                <SelectItem key={s.id} value={s.id}>
                  <div className="flex items-center gap-1.5">
                    <div 
                      className="h-2 w-2 rounded-full" 
                      style={{ backgroundColor: s.color }}
                    />
                    {s.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </td>

        {/* Task Type */}
        <td className="p-2" onClick={(e) => e.stopPropagation()}>
          <Select
            value={task.taskTypeId || "none"}
            onValueChange={(value) => handleUpdate({ 
              taskTypeId: value === "none" ? undefined : value 
            })}
          >
            <SelectTrigger className="h-7 w-[90px] text-xs">
              {taskType ? (
                <div className="flex items-center gap-1.5">
                  <div 
                    className="h-2 w-2 rounded-full shrink-0" 
                    style={{ backgroundColor: taskType.color }}
                  />
                  <span className="truncate">{taskType.name}</span>
                </div>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">-</SelectItem>
              {taskTypes.map(tt => (
                <SelectItem key={tt.id} value={tt.id}>
                  <div className="flex items-center gap-1.5">
                    <div 
                      className="h-2 w-2 rounded-full" 
                      style={{ backgroundColor: tt.color }}
                    />
                    {tt.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </td>

        {/* Priority */}
        <td className="p-2" onClick={(e) => e.stopPropagation()}>
          <Select
            value={task.priority}
            onValueChange={(value) => handleUpdate({ priority: value as Priority })}
          >
            <SelectTrigger className="h-7 w-[90px] text-xs">
              <div className="flex items-center gap-1.5">
                <div 
                  className="h-2 w-2 rounded-full shrink-0" 
                  style={{ backgroundColor: priorityConfig[task.priority].color }}
                />
                <span className="truncate">{priorityConfig[task.priority].label}</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(priorityConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-1.5">
                    <div 
                      className="h-2 w-2 rounded-full" 
                      style={{ backgroundColor: config.color }}
                    />
                    {config.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </td>

        {/* Points */}
        <td className="p-2" onClick={(e) => e.stopPropagation()}>
          <Select
            value={task.storyPoints?.toString() || "none"}
            onValueChange={(value) => handleUpdate({ 
              storyPoints: value === "none" ? undefined : parseInt(value) as StoryPoints 
            })}
          >
            <SelectTrigger className="h-7 w-[60px] text-xs">
              <SelectValue placeholder="-" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">-</SelectItem>
              {storyPointsOptions.map(point => (
                <SelectItem key={point} value={point.toString()}>
                  {point}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </td>

        {/* Duration (days) */}
        <td className="p-2" onClick={(e) => e.stopPropagation()}>
          <Input
            type="number"
            min="1"
            value={task.duration || ""}
            onChange={(e) => handleUpdate({ 
              duration: e.target.value ? parseInt(e.target.value) : undefined 
            })}
            className="h-7 w-[60px] text-xs"
            placeholder="-"
          />
        </td>

        {/* Plan Start */}
        <td className="p-2" onClick={(e) => e.stopPropagation()}>
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className={cn(
                  "h-7 text-xs justify-start px-2 w-[85px]",
                  !task.planStart && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-1 h-3 w-3" />
                {task.planStart 
                  ? format(new Date(task.planStart), "MM/dd") 
                  : "-"}
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
        <td className="p-2 text-xs text-muted-foreground">
          {planFinish ? format(planFinish, "MM/dd") : "-"}
        </td>

        {/* Actual Start */}
        <td className="p-2" onClick={(e) => e.stopPropagation()}>
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className={cn(
                  "h-7 text-xs justify-start px-2 w-[85px]",
                  !task.actualStart && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-1 h-3 w-3" />
                {task.actualStart && !isNaN(new Date(task.actualStart).getTime())
                  ? format(new Date(task.actualStart), "MM/dd") 
                  : "-"}
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
        <td className="p-2" onClick={(e) => e.stopPropagation()}>
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className={cn(
                  "h-7 text-xs justify-start px-2 w-[85px]",
                  !task.actualFinish && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-1 h-3 w-3" />
                {task.actualFinish && !isNaN(new Date(task.actualFinish).getTime())
                  ? format(new Date(task.actualFinish), "MM/dd") 
                  : "-"}
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

        {/* %Plan Progress */}
        <td className="p-2 text-xs">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="outline" className="font-mono">
                  {planProgress.toFixed(0)}%
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                Plan Progress: (Today - PlanStart) / Duration
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </td>

        {/* %Actual Progress */}
        <td className="p-2 text-xs">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="secondary" className="font-mono">
                  {actualProgress.toFixed(0)}%
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                Actual Progress: TimeSpent / TimeEstimate
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </td>

        {/* %Variance */}
        <td className="p-2 text-xs">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <span className={cn("font-mono font-medium", getVarianceColor(variance))}>
                  {variance > 0 ? "+" : ""}{variance.toFixed(0)}%
                </span>
              </TooltipTrigger>
              <TooltipContent>
                Variance: Plan Progress - Actual Progress
                {variance > 0 && " (Behind schedule)"}
                {variance < 0 && " (Ahead of schedule)"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </td>

        {/* Time Tracking */}
        <td className="p-2" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1">
            {isTracking ? (
              <>
                <Badge variant="destructive" className="font-mono text-[10px] animate-pulse">
                  {formatElapsedTime(elapsedTime)}
                </Badge>
                {canTimer && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 text-destructive hover:text-destructive"
                  onClick={handleToggleTracking}
                >
                  <Square className="h-3 w-3 fill-current" />
                </Button>
                )}
              </>
            ) : (
              <>
                <span className="text-xs text-muted-foreground min-w-[40px]">
                  {localTimeSpent || elapsedTime > 0 ? (
                    <>
                      {(() => {
                        const totalMinutes = localTimeSpent + Math.floor(elapsedTime / 60);
                        const h = Math.floor(totalMinutes / 60);
                        const m = totalMinutes % 60;
                        return h > 0 ? `${h}h ${m}m` : `${m}m`;
                      })()}
                    </>
                  ) : "-"}
                </span>
                {canTimer && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 text-primary hover:text-primary"
                  onClick={handleToggleTracking}
                >
                  <Play className="h-3 w-3 fill-current" />
                </Button>
                )}
              </>
            )}
          </div>
        </td>

        {/* Assignees */}
        <td className="p-2" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1">
            <div className="flex -space-x-1">
              {assignees.slice(0, 2).map(user => user && (
                <TooltipProvider key={user.id}>
                  <Tooltip>
                    <TooltipTrigger>
                      <Avatar className="h-6 w-6 border-2 border-background">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="text-[10px]">
                          {user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>{user.name}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
              {assignees.length > 2 && (
                <Badge variant="secondary" className="h-6 px-1 text-[10px]">
                  +{assignees.length - 2}
                </Badge>
)}
            </div>
          </div>
        </td>

        {/* Actions */}
        <td className="p-2" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onClick}>View Details</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowReassignDialog(true)}>
                Re-assign
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  if (onUpdate) {
                    onUpdate(task.id, { 
                      estimateProgress: 100
                    });
                    toast.success("Marked as complete");
                  }
                }}
              >
                Mark as Complete
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive"
                onClick={() => {
                  if (onDelete) {
                    onDelete(task.id);
                  } else {
                    deleteTask(task.id);
                  }
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
