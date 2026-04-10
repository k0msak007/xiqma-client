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
import { getUserById, users, getTaskTypeById } from "@/lib/mock-data";
import { 
  priorityConfig, 
  storyPointsOptions,
  calculatePlanFinish,
  calculatePlanProgress,
  calculateActualProgress,
  calculateVariance 
} from "@/lib/types";
import type { Task, Priority, StoryPoints, Status } from "@/lib/types";

interface TaskTableRowProps {
  task: Task;
  onClick: () => void;
  isSelected: boolean;
  statuses: Status[];
}

export function TaskTableRow({ task, onClick, isSelected, statuses }: TaskTableRowProps) {
  const { updateTask, deleteTask, taskTypes } = useTaskStore();
  const [isTracking, setIsTracking] = useState(false);
  const [trackingStartTime, setTrackingStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showReassignDialog, setShowReassignDialog] = useState(false);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>(task.assigneeIds);
  
  const status = statuses.find(s => s.id === task.statusId);
  const taskType = task.taskTypeId ? getTaskTypeById(task.taskTypeId) : null;
  const assignees = task.assigneeIds.map(id => getUserById(id)).filter(Boolean);

  // Calculate plan finish from plan start + duration
  const planFinish = useMemo(() => {
    return calculatePlanFinish(task.planStart, task.duration);
  }, [task.planStart, task.duration]);

  // Calculate progress values
  const planProgress = useMemo(() => {
    return calculatePlanProgress(task.planStart, task.duration);
  }, [task.planStart, task.duration]);

  const actualProgress = useMemo(() => {
    return calculateActualProgress(task.timeSpent, task.timeEstimate);
  }, [task.timeSpent, task.timeEstimate]);

  const variance = useMemo(() => {
    return calculateVariance(planProgress, actualProgress);
  }, [planProgress, actualProgress]);

  // Time tracking effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTracking && trackingStartTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - trackingStartTime.getTime()) / 1000));
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTracking, trackingStartTime]);

  // Sync selected assignees when task changes
  useEffect(() => {
    setSelectedAssignees(task.assigneeIds);
  }, [task.assigneeIds]);

  const handleStartTracking = () => {
    setIsTracking(true);
    setTrackingStartTime(new Date());
    setElapsedTime(0);
    
    // Set actual start if not set
    if (!task.actualStart) {
      updateTask(task.id, { actualStart: new Date() });
    }
  };

  const handleStopTracking = () => {
    if (trackingStartTime) {
      const trackedMinutes = Math.round((Date.now() - trackingStartTime.getTime()) / 60000);
      updateTask(task.id, {
        timeSpent: (task.timeSpent || 0) + trackedMinutes,
      });
    }
    setIsTracking(false);
    setTrackingStartTime(null);
    setElapsedTime(0);
  };

  const handleReassign = () => {
    updateTask(task.id, { assigneeIds: selectedAssignees });
    setShowReassignDialog(false);
  };

  const toggleAssignee = (userId: string) => {
    setSelectedAssignees(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
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
      >
        {/* Task ID */}
        <td className="p-2 text-xs text-muted-foreground font-mono" onClick={onClick}>
          {task.taskId || "-"}
        </td>

        {/* Title */}
        <td className="p-2" onClick={onClick}>
          <div className="flex items-center gap-2">
            <Checkbox 
              checked={status?.type === "done" || status?.type === "closed"}
              onCheckedChange={(checked) => {
                const newStatus = checked 
                  ? statuses.find(s => s.type === "done")?.id 
                  : statuses.find(s => s.type === "open")?.id;
                if (newStatus) {
                  updateTask(task.id, { 
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
            onValueChange={(value) => updateTask(task.id, { statusId: value })}
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
            onValueChange={(value) => updateTask(task.id, { 
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
            onValueChange={(value) => updateTask(task.id, { priority: value as Priority })}
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
            onValueChange={(value) => updateTask(task.id, { 
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
            onChange={(e) => updateTask(task.id, { 
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
                onSelect={(date) => updateTask(task.id, { planStart: date || undefined })}
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
                {task.actualStart 
                  ? format(new Date(task.actualStart), "MM/dd") 
                  : "-"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={task.actualStart ? new Date(task.actualStart) : undefined}
                onSelect={(date) => updateTask(task.id, { actualStart: date || undefined })}
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
                {task.actualFinish 
                  ? format(new Date(task.actualFinish), "MM/dd") 
                  : "-"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={task.actualFinish ? new Date(task.actualFinish) : undefined}
                onSelect={(date) => updateTask(task.id, { actualFinish: date || undefined })}
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
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 text-destructive hover:text-destructive"
                  onClick={handleStopTracking}
                >
                  <Square className="h-3 w-3 fill-current" />
                </Button>
              </>
            ) : (
              <>
                <span className="text-xs text-muted-foreground min-w-[40px]">
                  {task.timeSpent ? formatTimeSpent(task.timeSpent) : "-"}
                </span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 text-primary hover:text-primary"
                  onClick={handleStartTracking}
                >
                  <Play className="h-3 w-3 fill-current" />
                </Button>
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
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setShowReassignDialog(true)}
            >
              <UserPlus className="h-3 w-3" />
            </Button>
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
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive"
                onClick={() => deleteTask(task.id)}
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
            <div className="space-y-2">
              {users.map(user => (
                <div 
                  key={user.id}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted transition-colors",
                    selectedAssignees.includes(user.id) && "bg-muted"
                  )}
                  onClick={() => toggleAssignee(user.id)}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.role}</p>
                  </div>
                  {selectedAssignees.includes(user.id) && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
              ))}
            </div>
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
