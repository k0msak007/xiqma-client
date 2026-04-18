"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format, differenceInDays } from "date-fns";
import {
  Calendar,
  Clock,
  MoreHorizontal,
  MessageSquare,
  Play,
  Square,
  CheckCircle2,
  Timer,
  Flag,
  AlertCircle,
  Paperclip,
} from "lucide-react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

function formatElapsed(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function TaskCardBoard({
  task,
  onClick,
  isSelected,
  statuses = [],
  onUpdate,
  onDelete,
}: TaskCardBoardProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [localTimeSpent, setLocalTimeSpent] = useState(task.timeSpent || 0);
  const [runningTimer, setRunningTimer] = useState<{ id: string; startedAt: string } | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    setLocalTimeSpent(task.timeSpent || 0);
  }, [task.timeSpent]);

  const priorityInfo = priorityConfig[task.priority];
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
  const isCompleted = task.estimateProgress === 100;
  const canTimer = user && (user.role === "admin" || task.assigneeIds.includes(user.id));
  const isTracking = !!runningTimer;

  const daysUntilDue = task.dueDate
    ? differenceInDays(new Date(task.dueDate), new Date())
    : null;
  const isDueSoon = daysUntilDue !== null && daysUntilDue >= 0 && daysUntilDue <= 2;

  useEffect(() => {
    if (!runningTimer) return;
    const updateElapsed = () => {
      const startTime = new Date(runningTimer.startedAt).getTime();
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    };
    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [runningTimer]);

  useEffect(() => {
    const checkTimer = async () => {
      try {
        const sessions = await tasksApi.getTimer(task.id);
        const running = sessions.find((s) => !s.endedAt);
        if (running) setRunningTimer(running);
        else {
          setRunningTimer(null);
          setElapsedSeconds(0);
        }
      } catch {
        /* ignore */
      }
    };
    checkTimer();
  }, [task.id]);

  const toggleTimer = async () => {
    try {
      if (runningTimer) {
        const stopResult = await tasksApi.stopTimer(task.id);
        setRunningTimer(null);
        setElapsedSeconds(0);
        toast.success("Timer stopped");
        const addedMinutes = stopResult?.durationMin ?? 0;
        setLocalTimeSpent(localTimeSpent + addedMinutes);
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

  const currentStatus = statuses.find((s) => s.id === task.statusId);

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
    if (onUpdate) await onUpdate(task.id, { estimateProgress: value });
  };

  const handleDueDateChange = async (date: Date | undefined) => {
    if (onUpdate) {
      await onUpdate(task.id, { dueDate: date });
      toast.success("Due date updated");
    }
  };

  const handleActualStartChange = async (date: Date | undefined) => {
    if (onUpdate) {
      await onUpdate(task.id, { actualStart: date });
      toast.success("Actual start updated");
    }
  };

  const handleActualFinishChange = async (date: Date | undefined) => {
    if (onUpdate) {
      await onUpdate(task.id, { actualFinish: date });
      toast.success("Actual finish updated");
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div
        onClick={onClick}
        className={cn(
          "group relative cursor-pointer overflow-hidden rounded-xl border bg-card shadow-sm transition-all duration-200",
          "hover:-translate-y-0.5 hover:shadow-lg hover:border-primary/40",
          isSelected && "ring-2 ring-primary ring-offset-1 border-primary shadow-md",
          isCompleted && "bg-gradient-to-br from-green-50/60 to-card border-green-200/60",
          isTracking && "ring-1 ring-red-400/50"
        )}
      >
        {/* Colored top accent */}
        <div
          className="absolute inset-x-0 top-0 h-1"
          style={{ backgroundColor: currentStatus?.color || priorityInfo.color }}
        />

        {/* Tracking pulse indicator */}
        {isTracking && (
          <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-red-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-red-600">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
            </span>
            LIVE
          </div>
        )}

        <div className="p-3 pt-3.5">
          {/* Header: Status + Menu */}
          <div className="mb-2 flex items-center justify-between gap-2">
            <Select value={task.statusId} onValueChange={handleStatusChange}>
              <SelectTrigger
                className="h-6 w-fit gap-1 border-0 px-2 text-[10px] font-semibold uppercase tracking-wide shadow-none hover:opacity-80 focus:ring-0"
                style={{
                  backgroundColor: `${currentStatus?.color}18`,
                  color: currentStatus?.color,
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

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => router.push(`/task/${task.id}`)}>
                  Open in full page
                </DropdownMenuItem>
                {onUpdate && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProgressChange(100);
                    }}
                  >
                    <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                    Mark as Complete
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(task.id);
                      }}
                    >
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Title */}
          <h4
            className={cn(
              "mb-2 line-clamp-2 text-sm font-semibold leading-snug",
              isCompleted && "text-muted-foreground line-through decoration-1"
            )}
          >
            {task.title}
          </h4>

          {/* Progress */}
          {task.estimateProgress !== undefined && task.estimateProgress > 0 && (
            <div className="mb-2.5">
              <div className="mb-1 flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">Progress</span>
                <span
                  className={cn(
                    "font-semibold",
                    isCompleted ? "text-green-600" : "text-foreground"
                  )}
                >
                  {task.estimateProgress}%
                </span>
              </div>
              <Progress
                value={task.estimateProgress}
                className={cn("h-1.5", isCompleted && "[&>div]:bg-green-500")}
              />
            </div>
          )}

          {/* Meta chips: Priority + Due */}
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            {/* Priority */}
            <Select value={task.priority} onValueChange={handlePriorityChange}>
              <SelectTrigger
                className="h-6 w-fit gap-1 border px-1.5 text-[10px] font-medium shadow-none hover:bg-muted focus:ring-0"
                onClick={(e) => e.stopPropagation()}
              >
                {/* <Flag
                  className="h-2.5 w-2.5"
                  style={{ color: priorityInfo.color, fill: priorityInfo.color }}
                /> */}
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(priorityConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <Flag
                        className="h-3 w-3"
                        style={{ color: config.color, fill: config.color }}
                      />
                      {config.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Due date */}
            <Popover>
              <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                <button
                  className={cn(
                    "inline-flex h-6 items-center gap-1 rounded-md border px-1.5 text-[10px] font-medium transition-colors hover:bg-muted",
                    isOverdue &&
                      "border-red-300 bg-red-50 text-red-700 hover:bg-red-100",
                    isDueSoon &&
                      !isOverdue &&
                      "border-amber-300 bg-amber-50 text-amber-700"
                  )}
                >
                  {isOverdue ? (
                    <AlertCircle className="h-2.5 w-2.5" />
                  ) : (
                    <Calendar className="h-2.5 w-2.5" />
                  )}
                  <span>
                    {task.dueDate ? format(new Date(task.dueDate), "MMM d") : "Set due"}
                  </span>
                </button>
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

            {/* Actual Start */}
            <Popover>
              <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                <button
                  className={cn(
                    "inline-flex h-6 items-center gap-1 rounded-md border px-1.5 text-[10px] font-medium transition-colors hover:bg-muted",
                    task.actualStart && "border-green-200 bg-green-50 text-green-700"
                  )}
                >
                  <Play className="h-2.5 w-2.5" />
                  <span>
                    {task.actualStart
                      ? format(new Date(task.actualStart), "MMM d")
                      : "Start"}
                  </span>
                </button>
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
                <button
                  className={cn(
                    "inline-flex h-6 items-center gap-1 rounded-md border px-1.5 text-[10px] font-medium transition-colors hover:bg-muted",
                    task.actualFinish && "border-green-200 bg-green-50 text-green-700"
                  )}
                >
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  <span>
                    {task.actualFinish
                      ? format(new Date(task.actualFinish), "MMM d")
                      : "Finish"}
                  </span>
                </button>
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

          {/* Tags */}
          {task.tags.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1">
              {task.tags.slice(0, 3).map((tagName) => (
                <Badge
                  key={tagName}
                  variant="secondary"
                  className="h-4 rounded px-1.5 text-[9px] font-normal"
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

          {/* Footer */}
          <div className="mt-2 flex items-center justify-between border-t pt-2">
            {/* Left: stats */}
            <div className="flex items-center gap-2.5 text-[10px] text-muted-foreground">
              {task.storyPoints ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-md bg-primary/10 px-1.5 text-[10px] font-semibold text-primary">
                      {task.storyPoints}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Story points</TooltipContent>
                </Tooltip>
              ) : null}

              {isTracking ? (
                <span className="inline-flex items-center gap-1 font-semibold text-red-600">
                  <Timer className="h-3 w-3 animate-pulse" />
                  {formatElapsed(elapsedSeconds)}
                </span>
              ) : localTimeSpent > 0 ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTimeSpent(localTimeSpent)}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Time spent</TooltipContent>
                </Tooltip>
              ) : null}

              {task.comments.length > 0 && (
                <span className="inline-flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {task.comments.length}
                </span>
              )}

              {(task as any).attachments?.length > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Paperclip className="h-3 w-3" />
                  {(task as any).attachments.length}
                </span>
              )}
            </div>

            {/* Right: timer + assignees */}
            <div className="flex items-center gap-1.5">
              {canTimer && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isTracking ? "default" : "ghost"}
                      size="icon"
                      className={cn(
                        "h-6 w-6 rounded-full transition-all",
                        isTracking
                          ? "bg-red-500 text-white hover:bg-red-600"
                          : "opacity-60 hover:opacity-100"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTimer();
                      }}
                    >
                      {isTracking ? (
                        <Square className="h-3 w-3 fill-current" />
                      ) : (
                        <Play className="h-3 w-3 fill-current" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isTracking ? "Stop timer" : "Start timer"}
                  </TooltipContent>
                </Tooltip>
              )}

              <div className="flex -space-x-1.5">
                {task.assigneeIds.slice(0, 3).map((id) => {
                  const emp = getCachedEmployee(id);
                  return (
                    <Tooltip key={id}>
                      <TooltipTrigger asChild>
                        <Avatar className="h-6 w-6 border-2 border-background ring-0 transition-transform hover:z-10 hover:scale-110">
                          <AvatarImage src={emp?.avatar ?? undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-[9px] font-semibold">
                            {emp?.name
                              ? emp.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .slice(0, 2)
                                  .toUpperCase()
                              : id.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </TooltipTrigger>
                      <TooltipContent>{emp?.name || "Unassigned"}</TooltipContent>
                    </Tooltip>
                  );
                })}
                {task.assigneeIds.length > 3 && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-muted text-[9px] font-semibold text-muted-foreground">
                    +{task.assigneeIds.length - 3}
                  </div>
                )}
                {task.assigneeIds.length === 0 && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/30 text-[9px] text-muted-foreground">
                    ?
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
