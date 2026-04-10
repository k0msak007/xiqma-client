"use client";

import { useState, useRef } from "react";
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
import { Label } from "@/components/ui/label";
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
import { getUserById, getTagByName, users, getListById } from "@/lib/mock-data";
import {
  priorityConfig,
  storyPointsOptions,
  type Task,
  type Priority,
  type StoryPoints,
  type Attachment,
} from "@/lib/types";
import { format } from "date-fns";

interface TaskDetailProps {
  task: Task;
  onClose: () => void;
}

export function TaskDetail({ task, onClose }: TaskDetailProps) {
  const router = useRouter();
  const { updateTask, deleteTask, taskTypes, spaces, lists } = useTaskStore();
  
  // Get space type for task type filtering and assignment restrictions
  const currentList = lists.find(l => l.id === task.listId);
  const currentSpace = spaces.find(s => s.id === currentList?.spaceId);
  const isPrivateSpace = currentSpace?.type === "private";
  
  // Filter task types based on space type
  const filteredTaskTypes = taskTypes.filter(tt => 
    tt.category === (isPrivateSpace ? "private" : "organization")
  );
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [newSubtask, setNewSubtask] = useState("");
  const [isTimeTracking, setIsTimeTracking] = useState(false);
  const [showAssigneeDialog, setShowAssigneeDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const list = getListById(task.listId);
  const assignees = task.assigneeIds.map((id) => getUserById(id)).filter(Boolean);
  const priorityInfo = priorityConfig[task.priority];

  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
  const subtaskProgress = task.subtasks.length > 0 
    ? (completedSubtasks / task.subtasks.length) * 100 
    : 0;

  const handleTitleSave = () => {
    if (title.trim()) {
      updateTask(task.id, { title: title.trim() });
    }
    setIsEditingTitle(false);
  };

  const handleDescriptionSave = () => {
    updateTask(task.id, { description });
  };

  const handleStatusChange = (statusId: string) => {
    updateTask(task.id, { statusId });
  };

  const handlePriorityChange = (priority: Priority) => {
    updateTask(task.id, { priority });
  };

  const handleStoryPointsChange = (points: string) => {
    updateTask(task.id, {
      storyPoints: points ? (parseInt(points) as StoryPoints) : undefined,
    });
  };

  const handleDueDateChange = (date: Date | undefined) => {
    updateTask(task.id, { dueDate: date });
  };

  const handleActualStartChange = (date: Date | undefined) => {
    updateTask(task.id, { actualStart: date });
  };

  const handleActualFinishChange = (date: Date | undefined) => {
    updateTask(task.id, { actualFinish: date });
  };

  const handleToggleSubtask = (subtaskId: string) => {
    const updatedSubtasks = task.subtasks.map((s) =>
      s.id === subtaskId ? { ...s, completed: !s.completed } : s
    );
    updateTask(task.id, { subtasks: updatedSubtasks });
  };

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    const newSubtaskItem = {
      id: `subtask-${Date.now()}`,
      title: newSubtask.trim(),
      completed: false,
    };
    updateTask(task.id, { subtasks: [...task.subtasks, newSubtaskItem] });
    setNewSubtask("");
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    const updatedSubtasks = task.subtasks.filter((s) => s.id !== subtaskId);
    updateTask(task.id, { subtasks: updatedSubtasks });
  };

  const handleDelete = () => {
    deleteTask(task.id);
    onClose();
  };

  const handleAssigneeToggle = (userId: string) => {
    const newAssigneeIds = task.assigneeIds.includes(userId)
      ? task.assigneeIds.filter((id) => id !== userId)
      : [...task.assigneeIds, userId];
    updateTask(task.id, { assigneeIds: newAssigneeIds });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: Attachment[] = Array.from(files).map((file) => ({
      id: `attachment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      url: URL.createObjectURL(file),
      type: file.type,
      size: file.size,
      uploadedBy: "user-1",
      uploadedAt: new Date(),
    }));

    updateTask(task.id, {
      attachments: [...task.attachments, ...newAttachments],
    });
    e.target.value = "";
  };

  const handleRemoveAttachment = (attachmentId: string) => {
    updateTask(task.id, {
      attachments: task.attachments.filter((a) => a.id !== attachmentId),
    });
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
    const totalMinutes = (parseInt(hours || "0") * 60) + parseInt(minutes || "0");
    updateTask(task.id, { timeEstimate: totalMinutes > 0 ? totalMinutes : undefined });
  };

  const handleTimeSpentChange = (hours: string, minutes: string) => {
    const totalMinutes = (parseInt(hours || "0") * 60) + parseInt(minutes || "0");
    updateTask(task.id, { timeSpent: totalMinutes > 0 ? totalMinutes : undefined });
  };

  const toggleTimeTracking = () => {
    if (isTimeTracking) {
      // Stop tracking - add to time spent
      setIsTimeTracking(false);
    } else {
      // Start tracking
      if (!task.actualStart) {
        updateTask(task.id, { actualStart: new Date() });
      }
      setIsTimeTracking(true);
    }
  };

  return (
    <div className="flex h-full flex-col border-l bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {list?.name} / Task
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
                className="cursor-pointer text-lg font-semibold hover:text-primary"
                onClick={() => setIsEditingTitle(true)}
              >
                {task.title}
              </h2>
            )}
          </div>

          {/* Quick Actions Row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status */}
            <Select value={task.statusId} onValueChange={handleStatusChange}>
              <SelectTrigger className="h-8 w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {list?.statuses.map((status) => (
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
              onValueChange={(v) => handlePriorityChange(v as Priority)}
            >
              <SelectTrigger className="h-8 w-[120px]">
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
              onValueChange={handleStoryPointsChange}
            >
              <SelectTrigger className="h-8 w-[100px]">
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
                  {assignees.map((user) => (
                    <div
                      key={user!.id}
                      className="group flex items-center gap-2 rounded-full bg-muted px-2 py-1"
                    >
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={user!.avatar} />
                        <AvatarFallback className="text-[10px]">
                          {user!.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs">{user!.name}</span>
                      <button
                        onClick={() => handleAssigneeToggle(user!.id)}
                        className="hidden h-4 w-4 items-center justify-center rounded-full hover:bg-background group-hover:flex"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
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
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-7 justify-start text-left font-normal",
                        !task.dueDate && "text-muted-foreground",
                        task.dueDate && new Date(task.dueDate) < new Date() && "border-red-500 text-red-500"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-3 w-3" />
                      {task.dueDate
                        ? format(new Date(task.dueDate), "MMM d, yyyy")
                        : "Set date"}
                    </Button>
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
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "h-7 justify-start text-left font-normal",
                          !task.actualStart && "text-muted-foreground"
                        )}
                      >
                        <Play className="mr-1.5 h-3 w-3" />
                        {task.actualStart
                          ? format(new Date(task.actualStart), "MMM d")
                          : "Start"}
                      </Button>
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

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "h-7 justify-start text-left font-normal",
                          !task.actualFinish && "text-muted-foreground"
                        )}
                      >
                        <Square className="mr-1.5 h-3 w-3" />
                        {task.actualFinish
                          ? format(new Date(task.actualFinish), "MMM d")
                          : "Finish"}
                      </Button>
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
                          defaultValue={task.timeEstimate ? Math.floor(task.timeEstimate / 60) : ""}
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
                          defaultValue={task.timeEstimate ? (task.timeEstimate % 60) : ""}
                          onChange={(e) =>
                            handleTimeEstimateChange(
                              Math.floor((task.timeEstimate || 0) / 60).toString(),
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
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min="0"
                          defaultValue={task.timeSpent ? Math.floor(task.timeSpent / 60) : ""}
                          onChange={(e) =>
                            handleTimeSpentChange(
                              e.target.value,
                              ((task.timeSpent || 0) % 60).toString()
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
                          defaultValue={task.timeSpent ? (task.timeSpent % 60) : ""}
                          onChange={(e) =>
                            handleTimeSpentChange(
                              Math.floor((task.timeSpent || 0) / 60).toString(),
                              e.target.value
                            )
                          }
                          className="h-6 w-12 px-1 text-center text-xs"
                          placeholder="0"
                        />
                        <span className="text-xs text-muted-foreground">m</span>
                      </div>
                    </div>
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
                  </div>
                  {task.timeEstimate && (
                    <Progress
                      value={
                        task.timeSpent
                          ? Math.min((task.timeSpent / task.timeEstimate) * 100, 100)
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
                    onCheckedChange={() => handleToggleSubtask(subtask.id)}
                    className="h-4 w-4"
                  />
                  <span
                    className={cn(
                      "flex-1 text-sm",
                      subtask.completed && "text-muted-foreground line-through"
                    )}
                  >
                    {subtask.title}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
                    onClick={() => handleDeleteSubtask(subtask.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}

              {/* Add Subtask */}
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4 text-muted-foreground" />
                <Input
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddSubtask()}
                  placeholder="Add subtask..."
                  className="h-8 flex-1"
                />
              </div>
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
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-1 h-3 w-3" />
                Upload
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            <div className="space-y-2">
              {task.attachments.map((attachment) => (
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
                      onClick={() => handleRemoveAttachment(attachment.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              {task.attachments.length === 0 && (
                <p className="text-sm text-muted-foreground">No attachments</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t px-4 py-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Created {format(new Date(task.createdAt), "MMM d, yyyy")}
          </span>
          <span>
            Updated {format(new Date(task.updatedAt), "MMM d, yyyy")}
          </span>
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
              users.map((user) => {
                const isSelected = task.assigneeIds.includes(user.id);
                return (
                  <div
                    key={user.id}
                    onClick={() => handleAssigneeToggle(user.id)}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border hover:bg-muted"
                    )}
                  >
                    <Checkbox checked={isSelected} />
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                );
              })
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
