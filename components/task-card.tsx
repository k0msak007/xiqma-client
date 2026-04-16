"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, ExternalLink, Link2, MoreHorizontal, User, MessageSquare, Paperclip, Play, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { getTagByName } from "@/lib/mock-data";
import { useTaskStore } from "@/lib/store";
import { getCachedEmployee } from "@/lib/employee-cache";
import { tasksApi } from "@/lib/api/tasks";
import { useAuthStore } from "@/lib/auth-store";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { priorityConfig, type Task } from "@/lib/types";
import { format } from "date-fns";

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  isSelected?: boolean;
  variant?: "list" | "board";
  onUpdate?: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onDelete?: (taskId: string) => Promise<void>;
}

function formatTimeSpent(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function TaskCard({ task, onClick, isSelected, variant = "board", onUpdate, onDelete }: TaskCardProps) {
  const router = useRouter();
  const { tasks } = useTaskStore();
  const user = useAuthStore((s) => s.user);
  const [runningTimer, setRunningTimer] = useState<{ id: string; startedAt: string } | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

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
          setElapsedSeconds(elapsed);
        } else {
          setRunningTimer(null);
          setElapsedSeconds(0);
        }
      } catch { /* ignore */ }
    };
    
    checkTimer();
    const interval = setInterval(checkTimer, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, [task.id]);

  // Update elapsed time every second when tracking
  useEffect(() => {
    if (!runningTimer) return;
    const interval = setInterval(() => {
      const startTime = new Date(runningTimer.startedAt).getTime();
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedSeconds(elapsed);
    }, 1000);
    return () => clearInterval(interval);
  }, [runningTimer]);

  const isTracking = !!runningTimer;

  const assignees = useMemo(() => {
    return task.assigneeIds
      .map((id) => {
        const emp = getCachedEmployee(id);
        return emp ? { id: emp.id, name: emp.name, avatarUrl: emp.avatarUrl } : null;
      })
      .filter(Boolean) as { id: string; name: string; avatarUrl: string | null }[];
  }, [task.assigneeIds]);

  const predecessors = useMemo(() => {
    if (!task.predecessorIds || task.predecessorIds.length === 0) return [];
    return task.predecessorIds
      .map((id) => tasks.find((t) => t.id === id))
      .filter(Boolean);
  }, [task.predecessorIds, tasks]);

  const handleViewDetail = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/task/${task.id}`);
  };

  const priorityInfo = priorityConfig[task.priority];
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
  const totalSubtasks = task.subtasks.length;
  const progressPercent = task.estimateProgress ?? 0;

  // Timer functions - use server-side timer
  const toggleTimer = async () => {
    try {
      if (runningTimer) {
        // Stop timer
        await tasksApi.stopTimer(task.id);
        setRunningTimer(null);
        setElapsedSeconds(0);
        toast.success("Timer stopped");
      } else {
        // Start timer
        const session = await tasksApi.startTimer(task.id);
        setRunningTimer(session);
        const startTime = new Date(session.startedAt).getTime();
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setElapsedSeconds(elapsed);
        toast.success("Timer started");
      }
    } catch (err: any) {
      if (err?.data?.error === "SESSION_ALREADY_RUNNING") {
        toast.error(`มี timer กำลังทำงานอยู่แล้ว (task: ${err.data.runningTaskId})`);
      } else {
        toast.error("Failed to toggle timer");
      }
    }
  };

  const formatElapsed = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    return `${m}:${s.toString().padStart(2, "0")}`;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Board variant
  if (variant === "board") {
    return (
      <div
        onClick={onClick}
        className={cn(
          "cursor-pointer rounded-lg border bg-card p-3 shadow-sm transition-all hover:shadow-md group",
          isSelected && "ring-2 ring-primary"
        )}
      >
        {/* Header: Tags + Menu */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex flex-wrap gap-1 flex-1">
            {task.tags.slice(0, 2).map((tagName) => {
              const tag = getTagByName(tagName);
              return (
                <Badge
                  key={tagName}
                  variant="secondary"
                  className="h-5 px-1.5 text-[10px]"
                  style={{ backgroundColor: `${tag?.color}20`, color: tag?.color }}
                >
                  {tagName}
                </Badge>
              );
            })}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onClick}>View Details</DropdownMenuItem>
              {onUpdate && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdate(task.id, { estimateProgress: 100 });
                    toast.success("Marked as complete");
                  }}
                >
                  Mark as Complete
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onDelete && (
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(task.id);
                  }}
                >
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Title */}
        <h4 className="text-sm font-medium leading-tight mb-2">{task.title}</h4>

        {/* Timer Display - when tracking */}
        {isTracking && (
          <div className="mb-2 flex items-center gap-2 rounded-md bg-red-50 px-2 py-1">
            <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
            <span className="text-xs font-medium text-red-600">
              {formatElapsed(elapsedSeconds)}
            </span>
            <span className="text-xs text-red-400">(tracking)</span>
          </div>
        )}

        {/* Progress Bar */}
        {progressPercent > 0 && (
          <div className="mb-2">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
              <span>Progress</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  progressPercent === 100 ? "bg-green-500" : "bg-primary"
                )}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Meta Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Priority */}
            <div
              className="flex h-5 w-5 items-center justify-center rounded"
              style={{ backgroundColor: `${priorityInfo.color}20` }}
            >
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: priorityInfo.color }}
              />
            </div>

            {/* Story Points */}
            {task.storyPoints && (
              <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                {task.storyPoints} SP
              </Badge>
            )}

            {/* Due Date */}
            {task.dueDate && (
              <div
                className={cn(
                  "flex items-center gap-1 text-[10px]",
                  isOverdue ? "text-red-500" : "text-muted-foreground"
                )}
              >
                <Calendar className="h-3 w-3" />
                {format(new Date(task.dueDate), "MMM d")}
              </div>
            )}
          </div>

          {/* Assignees */}
          <div className="flex -space-x-1">
            {assignees.slice(0, 2).map((user) => (
              <Avatar key={user.id} className="h-5 w-5 border-2 border-background">
                <AvatarImage src={user.avatarUrl ?? undefined} />
                <AvatarFallback className="text-[8px]">
                  {user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            ))}
            {assignees.length > 2 && (
              <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-background bg-muted text-[8px]">
                +{assignees.length - 2}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
          <div className="flex items-center gap-2">
            {predecessors.length > 0 && (
              <div className="flex items-center gap-1">
                <Link2 className="h-3 w-3" />
                {predecessors.length}
              </div>
            )}
            {task.comments.length > 0 && (
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                {task.comments.length}
              </div>
            )}
            {(task.timeSpent || 0) > 0 || elapsedSeconds > 0 ? (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {(() => {
                  const totalMinutes = (task.timeSpent || 0) + Math.floor(elapsedSeconds / 60);
                  const h = Math.floor(totalMinutes / 60);
                  const m = totalMinutes % 60;
                  return h > 0 ? `${h}h ${m}m` : `${m}m`;
                })()}
                {isTracking && elapsedSeconds > 0 && (
                  <span className="text-green-500">+{formatElapsed(elapsedSeconds)}</span>
                )}
              </div>
            ) : null}
          </div>
          <div className="flex items-center gap-1">
            {canTimer && (
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-5 w-5", isTracking && "text-red-500")}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleTimer();
                }}
              >
                {isTracking ? (
                  <Square className="h-3 w-3 fill-current" />
                ) : (
                  <Play className="h-3 w-3" />
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={handleViewDetail}
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // List variant
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-lg border bg-card px-3 py-2 transition-colors hover:bg-muted/50",
        isSelected && "bg-muted"
      )}
    >
      <Checkbox
        checked={false}
        className="h-4 w-4"
        onClick={(e) => e.stopPropagation()}
      />

      <div className="h-3 w-1 rounded-full" style={{ backgroundColor: priorityInfo.color }} />

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{task.title}</span>
          {task.tags.slice(0, 2).map((tagName) => {
            const tag = getTagByName(tagName);
            return (
              <Badge
                key={tagName}
                variant="secondary"
                className="h-4 px-1 text-[10px]"
                style={{ backgroundColor: `${tag?.color}20`, color: tag?.color }}
              >
                {tagName}
              </Badge>
            );
          })}
        </div>
      </div>

      {task.storyPoints && (
        <Badge variant="outline" className="h-5 shrink-0 px-1.5 text-[10px]">
          {task.storyPoints} SP
        </Badge>
      )}

      {task.dueDate && (
        <div className={cn("flex shrink-0 items-center gap-1 text-xs", isOverdue ? "text-red-500" : "text-muted-foreground")}>
          <Calendar className="h-3 w-3" />
          {format(new Date(task.dueDate), "MMM d")}
        </div>
      )}

      {totalSubtasks > 0 && (
        <div className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
          {completedSubtasks}/{totalSubtasks}
        </div>
      )}

      <div className="flex shrink-0 -space-x-1">
        {assignees.length === 0 ? (
          <div className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed">
            <User className="h-3 w-3 text-muted-foreground" />
          </div>
        ) : (
          <>
            {assignees.slice(0, 3).map((user) => (
              <Avatar key={user.id} className="h-6 w-6 border-2 border-background">
                <AvatarImage src={user.avatarUrl ?? undefined} />
                <AvatarFallback className="text-[10px]">
                  {user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            ))}
          </>
        )}
      </div>

      <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={handleViewDetail}>
        <ExternalLink className="h-3 w-3" />
      </Button>
    </div>
  );
}