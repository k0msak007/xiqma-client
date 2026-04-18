"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Calendar,
  Clock,
  User,
  Tag,
  MessageSquare,
  Paperclip,
  CheckSquare,
  MoreHorizontal,
  Plus,
  Trash2,
  CalendarIcon,
  Play,
  Square,
  Upload,
  FileIcon,
  Download,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useTaskStore } from "@/lib/store";
import { useListTaskStore } from "@/lib/list-task-store";
import { useWorkspaceStore } from "@/lib/workspace-store";
import { useAuthStore } from "@/lib/auth-store";
import type { AuthUser } from "@/lib/api/auth";
import { getCachedEmployee } from "@/lib/employee-cache";
import { getTagByName } from "@/lib/mock-data";
import { tasksApi } from "@/lib/api/tasks";
import {
  priorityConfig,
  storyPointsOptions,
  type Task,
  type Priority,
  type StoryPoints,
} from "@/lib/types";
import { format } from "date-fns";
import { toast } from "sonner";

interface TaskDetailProps {
  task: Task;
  onClose: () => void;
  onTaskChange?: (task: Task) => void;
  readOnly?: boolean;
}

export function TaskDetail({ task, onClose, onTaskChange, readOnly = false }: TaskDetailProps) {
  const router = useRouter();
  const { taskTypes } = useTaskStore();
  const {
    updateTask: apiUpdateTask,
    deleteTask: apiDeleteTask,
    refreshTask,
    statuses,
    loadSubtasks,
    toggleSubtask,
    addSubtask,
    deleteSubtask,
    loadComments,
    addComment,
    updateComment,
    deleteComment,
    loadAttachments,
    uploadAttachment,
    deleteAttachment,
  } = useListTaskStore();
  const { lists } = useWorkspaceStore();
  const user = useAuthStore((s) => s.user);

  // Get space type for task type filtering and assignment restrictions
  const currentList = lists.find((l) => l.id === task.listId);
  // Space type is not available from the API — always treat as organization space
  const isPrivateSpace = false;

  // Show all task types (space type not available in real API)
  const filteredTaskTypes = taskTypes;

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [newSubtask, setNewSubtask] = useState("");
  const [runningTimer, setRunningTimer] = useState<{ id: string; startedAt: string } | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showAssigneeDialog, setShowAssigneeDialog] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState("");
  const [employees, setEmployees] = useState<{ id: string; name: string; avatarUrl: string | null }[]>([]);
  const [dueDateOpen, setDueDateOpen] = useState(false);
  const [actualStartOpen, setActualStartOpen] = useState(false);
  const [actualFinishOpen, setActualFinishOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const listName = currentList?.name;
  const assignees = task.assigneeIds
    .map((id) => getCachedEmployee(id))
    .filter(Boolean);
  const priorityInfo = priorityConfig[task.priority];

  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
  const subtaskProgress =
    task.subtasks.length > 0
      ? (completedSubtasks / task.subtasks.length) * 100
      : 0;

  // Load real subtasks/comments/attachments on mount (replace stub items)
  useEffect(() => {
    if (task.subtasks.some((s) => s.id.startsWith("stub-"))) {
      loadSubtasks(task.id);
    }
    if (task.comments.some((c) => c.id.startsWith("stub-"))) {
      loadComments(task.id);
    }
    if (task.attachments.some((a) => a.id.startsWith("stub-"))) {
      loadAttachments(task.id);
    }
  }, [task.id, loadSubtasks, loadComments, loadAttachments]);

  // Load employees for assignee dialog
  useEffect(() => {
    if (showAssigneeDialog && employees.length === 0) {
      import("@/lib/api/employees").then(({ employeesApi }) => {
        employeesApi.list({ isActive: true, limit: 200 }).then((res) => {
          setEmployees(res.map((e) => ({ id: e.id, name: e.name, avatarUrl: e.avatarUrl })));
        }).catch(() => {});
      });
    }
  }, [showAssigneeDialog, employees.length]);

  // Check for running timer
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
    const interval = setInterval(checkTimer, 10000);
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

  const isTimeTracking = !!runningTimer;

  // Check if user can timer (admin or assignee)
  const canTimer = user && (user.role === "admin" || task.assigneeIds.includes(user.id));

  const handleTitleSave = () => {
    if (title.trim()) {
      apiUpdateTask(task.id, { title: title.trim() });
    }
    setIsEditingTitle(false);
  };

  const handleDescriptionSave = () => {
    apiUpdateTask(task.id, { description });
  };

  const handleStatusChange = (statusId: string) => {
    apiUpdateTask(task.id, { listStatusId: statusId });
  };

  const handlePriorityChange = (priority: Priority) => {
    apiUpdateTask(task.id, { priority });
  };

  const handleStoryPointsChange = (points: string) => {
    apiUpdateTask(task.id, {
      storyPoints: points ? parseInt(points) : null,
    });
  };

  const handleDueDateChange = (date: Date | undefined) => {
    setDueDateOpen(false);
    apiUpdateTask(task.id, { deadline: date?.toISOString() ?? null });
  };

  const handleActualStartChange = async (date: Date | undefined) => {
    if (!date) return;
    setActualStartOpen(false);
    try {
      await tasksApi.update(task.id, { startedAt: date.toISOString() });
      await refreshTask(task.id);
      toast.success("Actual start saved");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update start date");
    }
  };

  const handleActualFinishChange = async (date: Date | undefined) => {
    if (!date) return;
    setActualFinishOpen(false);
    try {
      await tasksApi.update(task.id, { completedAt: date.toISOString() });
      await refreshTask(task.id);
      toast.success("Actual finish saved");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update finish date");
    }
  };

  const handleToggleSubtask = (subtaskId: string) => {
    toggleSubtask(task.id, subtaskId);
  };

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    addSubtask(task.id, newSubtask.trim());
    setNewSubtask("");
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    deleteSubtask(task.id, subtaskId);
  };

  const handleDelete = async () => {
    await apiDeleteTask(task.id);
    onClose();
  };

  const handleAssigneeToggle = (userId: string) => {
    const newAssigneeId = task.assigneeIds.includes(userId) ? undefined : userId;
    if (newAssigneeId) {
      apiUpdateTask(task.id, { assigneeId: newAssigneeId });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      uploadAttachment(task.id, file);
    });
    e.target.value = "";
  };

  const handleRemoveAttachment = (attachmentId: string) => {
    deleteAttachment(task.id, attachmentId);
  };

  const formatTimeSpent = (minutes?: number) => {
    if (!minutes) return "0h 0m";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleTimeEstimateChange = (hours: string, minutes: string) => {
    const totalMinutes =
      parseInt(hours || "0") * 60 + parseInt(minutes || "0");
    apiUpdateTask(task.id, {
      timeEstimateHours: totalMinutes > 0 ? totalMinutes / 60 : null,
    });
  };

  const handleTimeSpentChange = (hours: string, minutes: string) => {
    // timeSpent (accumulated_minutes) is read-only from API; skip
  };

  const toggleTimeTracking = async () => {
    try {
      if (runningTimer) {
        // Stop timer
        await tasksApi.stopTimer(task.id);
        setRunningTimer(null);
        setElapsedSeconds(0);
        await refreshTask(task.id);
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

  // Use statuses from store; fall back to empty
  const displayStatuses = statuses.length > 0 ? statuses : [];

  // Filter employees for assignee dialog search
  const filteredEmployees = assigneeSearch
    ? employees.filter((e) =>
        e.name.toLowerCase().includes(assigneeSearch.toLowerCase())
      )
    : employees;

  return (
    <div className="flex h-full flex-col border-l bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {listName} / Task
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => router.push(`/task/${task.id}`)}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            View Detail
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              <DropdownMenuItem>Move to...</DropdownMenuItem>
              <DropdownMenuItem>Copy link</DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={handleDelete}
                disabled={readOnly}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-6 p-4">
          {/* Title */}
          <div>
            {isEditingTitle ? (
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={(e) => e.key === "Enter" && handleTitleSave()}
                autoFocus
                className="text-lg font-semibold"
              />
            ) : (
              <h2
                className={cn("text-lg font-semibold", !readOnly && "cursor-pointer hover:text-primary")}
                onClick={() => !readOnly && setIsEditingTitle(true)}
              >
                {task.title}
              </h2>
            )}
          </div>

          {/* Quick Actions Row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status */}
            <Select 
              value={task.statusId} 
              onValueChange={readOnly ? undefined : handleStatusChange}
              disabled={readOnly}
            >
              <SelectTrigger className="h-8 w-[140px]" disabled={readOnly}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {displayStatuses.map((status) => (
                  <SelectItem key={status.id} value={status.id}>
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

            {/* Priority */}
            <Select
              value={task.priority}
              onValueChange={readOnly ? undefined : (v) => handlePriorityChange(v as Priority)}
              disabled={readOnly}
            >
              <SelectTrigger className="h-8 w-[120px]" disabled={readOnly}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(priorityConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
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

            {/* Story Points */}
            <Select
              value={task.storyPoints?.toString() || ""}
              onValueChange={readOnly ? undefined : handleStoryPointsChange}
              disabled={readOnly}
            >
              <SelectTrigger className="h-8 w-[100px]" disabled={readOnly}>
                <SelectValue placeholder="SP" />
              </SelectTrigger>
              <SelectContent>
                {storyPointsOptions.map((points) => (
                  <SelectItem key={points} value={points.toString()}>
                    {points} SP
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Details Grid */}
          <div className="grid gap-4">
            {/* Assignees */}
            <div className="flex items-start gap-3">
              <User className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  Assignees
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {assignees.map((emp) => (
                    <div
                      key={emp!.id}
                      className="group flex items-center gap-2 rounded-full bg-muted px-2 py-1"
                    >
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={emp!.avatar} />
                        <AvatarFallback className="text-[10px]">
                          {emp!.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs">{emp!.name}</span>
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    disabled={readOnly}
                    onClick={() => setShowAssigneeDialog(true)}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Add
                  </Button>
                </div>
              </div>
            </div>

            {/* Due Date */}
            <div className="flex items-start gap-3">
              <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  Due Date
                </p>
                <Popover open={dueDateOpen} onOpenChange={readOnly ? undefined : setDueDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={readOnly}
                      className={cn(
                        "h-7 justify-start text-left font-normal",
                        !task.dueDate && "text-muted-foreground",
                        task.dueDate &&
                          new Date(task.dueDate) < new Date() &&
                          "border-red-500 text-red-500"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-3 w-3" />
                      {task.dueDate && !isNaN(new Date(task.dueDate).getTime())
                        ? format(new Date(task.dueDate), "MMM d, yyyy")
                        : "Set date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={task.dueDate && !isNaN(new Date(task.dueDate).getTime()) ? new Date(task.dueDate) : undefined}
                      onSelect={handleDueDateChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Actual Start & Finish */}
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  Actual Dates
                </p>
                <div className="flex flex-wrap gap-2">
                  <Popover open={readOnly ? false : actualStartOpen} onOpenChange={readOnly ? undefined : setActualStartOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={readOnly}
                        className={cn(
                          "h-7 justify-start text-left font-normal",
                          !task.actualStart && "text-muted-foreground"
                        )}
                      >
                        <Play className="mr-1.5 h-3 w-3" />
                        {task.actualStart && !isNaN(new Date(task.actualStart).getTime())
                          ? format(new Date(task.actualStart), "MMM d")
                          : "Start"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={
                          task.actualStart && !isNaN(new Date(task.actualStart).getTime())
                            ? new Date(task.actualStart)
                            : undefined
                        }
                        onSelect={handleActualStartChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  <Popover open={readOnly ? false : actualFinishOpen} onOpenChange={readOnly ? undefined : setActualFinishOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={readOnly}
                        className={cn(
                          "h-7 justify-start text-left font-normal",
                          !task.actualFinish && "text-muted-foreground"
                        )}
                      >
                        <Square className="mr-1.5 h-3 w-3" />
                        {task.actualFinish && !isNaN(new Date(task.actualFinish).getTime())
                          ? format(new Date(task.actualFinish), "MMM d")
                          : "Finish"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={
                          task.actualFinish && !isNaN(new Date(task.actualFinish).getTime())
                            ? new Date(task.actualFinish)
                            : undefined
                        }
                        onSelect={handleActualFinishChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* Time Tracking */}
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  Time Tracking
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">Estimate:</span>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min="0"
                          defaultValue={
                            task.timeEstimate
                              ? Math.floor(task.timeEstimate / 60)
                              : ""
                          }
                          onChange={(e) =>
                            handleTimeEstimateChange(
                              e.target.value,
                              ((task.timeEstimate || 0) % 60).toString()
                            )
                          }
                          className="h-6 w-12 px-1 text-center text-xs"
                          placeholder="0"
                        />
                        <span className="text-xs text-muted-foreground">h</span>
                        <Input
                          type="number"
                          min="0"
                          max="59"
                          defaultValue={
                            task.timeEstimate
                              ? task.timeEstimate % 60
                              : ""
                          }
                          onChange={(e) =>
                            handleTimeEstimateChange(
                              Math.floor(
                                (task.timeEstimate || 0) / 60
                              ).toString(),
                              e.target.value
                            )
                          }
                          className="h-6 w-12 px-1 text-center text-xs"
                          placeholder="0"
                        />
                        <span className="text-xs text-muted-foreground">m</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">Tracked:</span>
                      <span className="text-xs font-medium">
                        {runningTimer ? (
                          <>
                            {formatTimeSpent(task.timeSpent)}
                            <span className="ml-1 text-green-500">
                              +{formatTimeSpent(Math.floor(elapsedSeconds / 60))}
                            </span>
                          </>
                        ) : (
                          formatTimeSpent(task.timeSpent)
                        )}
                      </span>
                    </div>
                    {canTimer && !readOnly && (
                    <Button
                      variant={isTimeTracking ? "destructive" : "outline"}
                      size="sm"
                      className="h-6"
                      onClick={toggleTimeTracking}
                    >
                      {isTimeTracking ? (
                        <>
                          <Square className="mr-1 h-3 w-3" />
                          Stop
                        </>
                      ) : (
                        <>
                          <Play className="mr-1 h-3 w-3" />
                          Start
                        </>
                      )}
                    </Button>
                    )}
                  </div>
                  {task.timeEstimate && (
                    <Progress
                      value={
                        (task.timeSpent || 0) + Math.floor(elapsedSeconds / 60)
                          ? Math.min(
                              (((task.timeSpent || 0) + Math.floor(elapsedSeconds / 60)) / task.timeEstimate) * 100,
                              100
                            )
                          : 0
                      }
                      className="h-1.5"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Tags */}
            {task.tags.length > 0 && (
              <div className="flex items-start gap-3">
                <Tag className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    Tags
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {task.tags.map((tagName) => {
                      const tag = getTagByName(tagName);
                      return (
                        <Badge
                          key={tagName}
                          variant="secondary"
                          style={{
                            backgroundColor: `${tag?.color}20`,
                            color: tag?.color,
                          }}
                        >
                          {tagName}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Description */}
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Description
            </p>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleDescriptionSave}
              placeholder="Add a description..."
              className="min-h-[100px] resize-none"
            />
          </div>

          <Separator />

          {/* Subtasks */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs font-medium text-muted-foreground">
                  Subtasks
                </p>
              </div>
              {task.subtasks.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {completedSubtasks}/{task.subtasks.length} complete
                </span>
              )}
            </div>

            {task.subtasks.length > 0 && (
              <Progress value={subtaskProgress} className="mb-3 h-1" />
            )}

            <div className="space-y-2">
              {task.subtasks.map((subtask) => (
                <div
                  key={subtask.id}
                  className="group flex items-center gap-2 rounded-md px-2 py-1 hover:bg-muted"
                >
                  <Checkbox
                    checked={subtask.completed}
                    onCheckedChange={() => !readOnly && handleToggleSubtask(subtask.id)}
                    className="h-4 w-4"
                    disabled={subtask.id.startsWith("stub-") || readOnly}
                  />
                  <span
                    className={cn(
                      "flex-1 text-sm",
                      subtask.completed &&
                        "text-muted-foreground line-through"
                    )}
                  >
                    {subtask.title || (subtask.id.startsWith("stub-") ? "Loading..." : "")}
                  </span>
                  {!subtask.id.startsWith("stub-") && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={() => !readOnly && handleDeleteSubtask(subtask.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}

              {/* Add Subtask */}
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4 text-muted-foreground" />
                <Input
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !readOnly && handleAddSubtask()}
                  placeholder="Add subtask..."
                  className="h-8 flex-1"
                  disabled={readOnly}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Comments */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-medium text-muted-foreground">
                Comments ({task.comments.filter((c) => !c.id.startsWith("stub-")).length || task.comments.length})
              </p>
            </div>

            <div className="space-y-3">
              {task.comments
                .filter((c) => !c.id.startsWith("stub-"))
                .map((comment) => {
                  const author = getCachedEmployee(comment.authorId);
                  const canEdit = user?.id === comment.authorId;
                  return (
                    <div key={comment.id} className="flex gap-2">
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarImage src={author?.avatar} />
                        <AvatarFallback className="text-[10px]">
                          {author?.name?.charAt(0) ?? "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 rounded-lg bg-muted px-3 py-2">
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-xs font-medium">
                            {author?.name ?? "Unknown"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {comment.createdAt && !isNaN(new Date(comment.createdAt).getTime())
                              ? format(new Date(comment.createdAt), "MMM d")
                              : ""}
                          </span>
                        </div>
                        <p className="text-sm">{comment.content}</p>
                        {canEdit && (
                          <div className="mt-1 flex gap-2">
                            <button
                              className="text-xs text-muted-foreground hover:text-foreground"
                              onClick={() => !readOnly && deleteComment(task.id, comment.id)}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

              {/* Add Comment */}
              <AddCommentForm
                onSubmit={(text) => !readOnly && addComment(task.id, text)}
                currentUser={user}
                disabled={readOnly}
              />
            </div>
          </div>

          <Separator />

          {/* Attachments */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs font-medium text-muted-foreground">
                  Attachments
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                disabled={readOnly}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-1 h-3 w-3" />
                Upload
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                disabled={readOnly}
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            <div className="space-y-2">
              {task.attachments
                .filter((a) => !a.id.startsWith("stub-"))
                .map((attachment) => (
                  <div
                    key={attachment.id}
                    className="group flex items-center justify-between rounded-lg border bg-muted/50 p-2"
                  >
                    <div className="flex items-center gap-2">
                      <FileIcon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{attachment.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(attachment.size)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        asChild
                      >
                        <a href={attachment.url} download={attachment.name}>
                          <Download className="h-3 w-3" />
                        </a>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100"
                        onClick={() => !readOnly && handleRemoveAttachment(attachment.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              {task.attachments.filter((a) => !a.id.startsWith("stub-")).length === 0 && (
                <p className="text-sm text-muted-foreground">No attachments</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t px-4 py-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Created {task.createdAt && !isNaN(new Date(task.createdAt).getTime()) ? format(new Date(task.createdAt), "MMM d, yyyy") : "-"}</span>
          <span>Updated {task.updatedAt && !isNaN(new Date(task.updatedAt).getTime()) ? format(new Date(task.updatedAt), "MMM d, yyyy") : "-"}</span>
        </div>
      </div>

      {/* Assignee Dialog */}
      <Dialog open={showAssigneeDialog} onOpenChange={setShowAssigneeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Assignees</DialogTitle>
            <DialogDescription>
              {isPrivateSpace
                ? "Private tasks cannot be assigned to other team members."
                : "Select team members to assign to this task."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            {isPrivateSpace ? (
              <div className="text-center py-4 text-muted-foreground">
                <p>This is a private task and can only be assigned to yourself.</p>
              </div>
            ) : (
              <>
                <Input
                  placeholder="Search employees..."
                  value={assigneeSearch}
                  onChange={(e) => setAssigneeSearch(e.target.value)}
                  className="mb-2"
                />
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {filteredEmployees.map((emp) => {
                    const isSelected = task.assigneeIds.includes(emp.id);
                    return (
                      <div
                        key={emp.id}
                        onClick={() => handleAssigneeToggle(emp.id)}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
                          isSelected
                            ? "border-primary bg-primary/10"
                            : "border-border hover:bg-muted"
                        )}
                      >
                        <Checkbox checked={isSelected} />
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={emp.avatarUrl ?? undefined} />
                          <AvatarFallback>{emp.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{emp.name}</p>
                        </div>
                      </div>
                    );
                  })}
                  {employees.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-4">
                      Loading employees...
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowAssigneeDialog(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Inline comment form component
function AddCommentForm({
  onSubmit,
  currentUser,
  disabled,
}: {
  onSubmit: (text: string) => void;
  currentUser: AuthUser | null;
  disabled?: boolean;
}) {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    if (!text.trim()) return;
    onSubmit(text.trim());
    setText("");
  };

  return (
    <div className="flex gap-2">
      <Avatar className="h-7 w-7 shrink-0">
        <AvatarFallback className="text-[10px]">
          {currentUser?.name?.charAt(0) ?? "?"}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-1 gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSubmit()}
          placeholder="Add a comment..."
          disabled={disabled}
          className="h-8 flex-1"
        />
        <Button size="sm" className="h-8" onClick={handleSubmit} disabled={!text.trim() || disabled}>
          Send
        </Button>
      </div>
    </div>
  );
}
