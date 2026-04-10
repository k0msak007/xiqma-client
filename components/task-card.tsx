"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Calendar, MessageSquare, Paperclip, User, Clock, ExternalLink, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { getUserById, getTagByName } from "@/lib/mock-data";
import { useTaskStore } from "@/lib/store";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { priorityConfig, type Task } from "@/lib/types";
import { format } from "date-fns";

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  isSelected?: boolean;
  variant?: "list" | "board";
}

export function TaskCard({ task, onClick, isSelected, variant = "list" }: TaskCardProps) {
  const router = useRouter();
  const { tasks } = useTaskStore();
  
  const assignees = useMemo(() => {
    return task.assigneeIds.map((id) => getUserById(id)).filter(Boolean);
  }, [task.assigneeIds]);
  
  // Get predecessor tasks
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
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.statusId !== "status-4";

  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
  const totalSubtasks = task.subtasks.length;

  if (variant === "board") {
    return (
      <div
        onClick={onClick}
        className={cn(
          "cursor-pointer rounded-lg border bg-card p-3 shadow-sm transition-all hover:shadow-md group",
          isSelected && "ring-2 ring-primary"
        )}
      >
        {/* Tags */}
        {task.tags.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1">
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
        )}

        {/* Title */}
        <h4 className="mb-2 text-sm font-medium leading-tight">{task.title}</h4>

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

            {/* Time Tracked */}
            {task.timeEstimate && (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Clock className="h-3 w-3" />
                {task.timeSpent ? Math.floor(task.timeSpent / 60) : 0}h/{Math.floor(task.timeEstimate / 60)}h
              </div>
            )}
          </div>

          {/* Assignees */}
          <div className="flex -space-x-1">
            {assignees.slice(0, 2).map((user) => (
              <Avatar key={user!.id} className="h-5 w-5 border-2 border-background">
                <AvatarImage src={user!.avatar} />
                <AvatarFallback className="text-[8px]">
                  {user!.name.charAt(0)}
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

        {/* Subtasks Progress */}
        {totalSubtasks > 0 && (
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1 flex-1 rounded-full bg-muted">
              <div
                className="h-1 rounded-full bg-primary"
                style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground">
              {completedSubtasks}/{totalSubtasks}
            </span>
          </div>
        )}

        {/* Footer Meta */}
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            {predecessors.length > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 cursor-help">
                      <Link2 className="h-3 w-3" />
                      {predecessors.length}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="font-medium text-xs mb-1">Predecessors:</p>
                    <ul className="text-xs space-y-0.5">
                      {predecessors.map((pred) => (
                        <li key={pred!.id} className="truncate">
                          {pred!.taskId}: {pred!.title}
                        </li>
                      ))}
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {task.comments.length > 0 && (
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                {task.comments.length}
              </div>
            )}
            {task.attachments.length > 0 && (
              <div className="flex items-center gap-1">
                <Paperclip className="h-3 w-3" />
                {task.attachments.length}
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleViewDetail}
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
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
      {/* Checkbox */}
      <Checkbox
        checked={task.statusId === "status-4" || task.statusId === "status-5"}
        className="h-4 w-4"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Priority Indicator */}
      <div
        className="h-3 w-1 rounded-full"
        style={{ backgroundColor: priorityInfo.color }}
      />

      {/* Title & Tags */}
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
        {task.description && (
          <p className="truncate text-xs text-muted-foreground">
            {task.description}
          </p>
        )}
      </div>

      {/* Predecessors */}
      {predecessors.length > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="h-5 shrink-0 px-1.5 text-[10px] gap-1 cursor-help">
                <Link2 className="h-3 w-3" />
                {predecessors.length}
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p className="font-medium text-xs mb-1">Predecessors:</p>
              <ul className="text-xs space-y-0.5">
                {predecessors.map((pred) => (
                  <li key={pred!.id} className="truncate">
                    {pred!.taskId}: {pred!.title}
                  </li>
                ))}
              </ul>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Story Points */}
      {task.storyPoints && (
        <Badge variant="outline" className="h-5 shrink-0 px-1.5 text-[10px]">
          {task.storyPoints} SP
        </Badge>
      )}

      {/* Due Date */}
      {task.dueDate && (
        <div
          className={cn(
            "flex shrink-0 items-center gap-1 text-xs",
            isOverdue ? "text-red-500" : "text-muted-foreground"
          )}
        >
          <Calendar className="h-3 w-3" />
          {format(new Date(task.dueDate), "MMM d")}
        </div>
      )}

      {/* Subtasks */}
      {totalSubtasks > 0 && (
        <div className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
          <Checkbox className="h-3 w-3" checked={completedSubtasks === totalSubtasks} />
          {completedSubtasks}/{totalSubtasks}
        </div>
      )}

      {/* Assignees */}
      <div className="flex shrink-0 -space-x-1">
        {assignees.length === 0 ? (
          <div className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed">
            <User className="h-3 w-3 text-muted-foreground" />
          </div>
        ) : (
          <>
            {assignees.slice(0, 3).map((user) => (
              <Avatar key={user!.id} className="h-6 w-6 border-2 border-background">
                <AvatarImage src={user!.avatar} />
                <AvatarFallback className="text-[10px]">
                  {user!.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            ))}
          </>
        )}
      </div>

      {/* View Detail */}
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0"
        onClick={handleViewDetail}
      >
        <ExternalLink className="h-3 w-3" />
      </Button>
    </div>
  );
}
