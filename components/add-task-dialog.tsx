"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  CalendarIcon,
  Clock,
  Upload,
  X,
  FileIcon,
  Trash2,
  Link2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTaskStore } from "@/lib/store";
import { users, getListById } from "@/lib/mock-data";
import {
  priorityConfig,
  storyPointsOptions,
  type Task,
  type Priority,
  type StoryPoints,
  type Attachment,
} from "@/lib/types";

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listId: string;
}

export function AddTaskDialog({ open, onOpenChange, listId }: AddTaskDialogProps) {
  const { addTask, tasks, taskTypes, spaces, lists } = useTaskStore();
  const list = getListById(listId);
  
  // Get space for this list to determine task type category filter
  const currentList = lists.find(l => l.id === listId);
  const currentSpace = spaces.find(s => s.id === currentList?.spaceId);
  const spaceType = currentSpace?.type || "organization";
  
  // Filter task types based on space type
  const filteredTaskTypes = taskTypes.filter(tt => tt.category === spaceType);

  // Generate next task ID
  const generateTaskId = () => {
    const existingTaskIds = tasks
      .map(t => t.taskId)
      .filter(id => id && id.startsWith("TASK-"))
      .map(id => parseInt(id!.replace("TASK-", "")))
      .filter(n => !isNaN(n));
    const nextNum = existingTaskIds.length > 0 ? Math.max(...existingTaskIds) + 1 : 1;
    return `TASK-${nextNum.toString().padStart(3, "0")}`;
  };

  // Form state
  const [taskId, setTaskId] = useState(generateTaskId());
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [statusId, setStatusId] = useState(list?.statuses[0]?.id || "status-1");
  const [taskTypeId, setTaskTypeId] = useState<string | undefined>();
  const [priority, setPriority] = useState<Priority>("normal");
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [planStart, setPlanStart] = useState<Date | undefined>();
  const [duration, setDuration] = useState<string>("");
  const [actualStart, setActualStart] = useState<Date | undefined>();
  const [actualFinish, setActualFinish] = useState<Date | undefined>();
  const [storyPoints, setStoryPoints] = useState<StoryPoints | undefined>();
  const [timeEstimateHours, setTimeEstimateHours] = useState("");
  const [timeEstimateMinutes, setTimeEstimateMinutes] = useState("");
  const [timeSpentHours, setTimeSpentHours] = useState("");
  const [timeSpentMinutes, setTimeSpentMinutes] = useState("");
  const [predecessorIds, setPredecessorIds] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  
  // Get tasks in the same list for predecessor selection
  const listTasks = tasks.filter((t) => t.listId === listId);

  // Calculate Plan Finish from Plan Start + Duration
  const planFinish = planStart && duration 
    ? new Date(planStart.getTime() + parseInt(duration) * 24 * 60 * 60 * 1000)
    : undefined;

  const resetForm = () => {
    setTaskId(generateTaskId());
    setTitle("");
    setDescription("");
    setStatusId(list?.statuses[0]?.id || "status-1");
    setTaskTypeId(undefined);
    setPriority("normal");
    setAssigneeIds([]);
    setDueDate(undefined);
    setPlanStart(undefined);
    setDuration("");
    setActualStart(undefined);
    setActualFinish(undefined);
    setStoryPoints(undefined);
    setTimeEstimateHours("");
    setTimeEstimateMinutes("");
    setTimeSpentHours("");
    setTimeSpentMinutes("");
    setPredecessorIds([]);
    setAttachments([]);
  };

  const handleAssigneeToggle = (userId: string) => {
    setAssigneeIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
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

    setAttachments((prev) => [...prev, ...newAttachments]);
    e.target.value = "";
  };

  const handleRemoveAttachment = (attachmentId: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleSubmit = () => {
    if (!title.trim()) return;

    const timeEstimate =
      (parseInt(timeEstimateHours || "0") * 60) +
      parseInt(timeEstimateMinutes || "0");
    
    const timeSpent =
      (parseInt(timeSpentHours || "0") * 60) +
      parseInt(timeSpentMinutes || "0");

    const listTasks = tasks.filter((t) => t.listId === listId);

    const newTask: Task = {
      id: `task-${Date.now()}`,
      taskId: taskId,
      title: title.trim(),
      description: description.trim() || undefined,
      statusId,
      taskTypeId,
      priority,
      assigneeIds,
      creatorId: "user-1",
      listId,
      dueDate,
      planStart,
      duration: duration ? parseInt(duration) : undefined,
      actualStart,
      actualFinish,
      storyPoints,
      predecessorIds: predecessorIds.length > 0 ? predecessorIds : undefined,
      timeEstimate: timeEstimate > 0 ? timeEstimate : undefined,
      timeSpent: timeSpent > 0 ? timeSpent : undefined,
      tags: [],
      subtasks: [],
      comments: [],
      attachments,
      createdAt: new Date(),
      updatedAt: new Date(),
      order: listTasks.length,
    };

    addTask(newTask);
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new task.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Task ID & Task Name Row */}
          <div className="grid grid-cols-4 gap-4">
            {/* Task ID */}
            <div className="space-y-2">
              <Label htmlFor="taskId">Task ID</Label>
              <Input
                id="taskId"
                value={taskId}
                onChange={(e) => setTaskId(e.target.value)}
                placeholder="TASK-001"
                className="font-mono"
              />
            </div>

            {/* Task Name */}
            <div className="space-y-2 col-span-3">
              <Label htmlFor="title">
                Task Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter task name..."
                autoFocus
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description..."
              rows={4}
            />
          </div>

          <Separator />

          {/* Status, Task Type & Priority Row */}
          <div className="grid grid-cols-3 gap-4">
            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusId} onValueChange={setStatusId}>
                <SelectTrigger>
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
            </div>

            {/* Task Type */}
            <div className="space-y-2">
              <Label>Task Type</Label>
              <Select
                value={taskTypeId || "none"}
                onValueChange={(v) => setTaskTypeId(v === "none" ? undefined : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Type</SelectItem>
                  {filteredTaskTypes.map((tt) => (
                    <SelectItem key={tt.id} value={tt.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: tt.color }}
                        />
                        {tt.name}
                        {tt.countsForPoints && (
                          <Badge variant="outline" className="ml-auto text-[10px]">+Pts</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as Priority)}
              >
                <SelectTrigger>
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
            </div>
          </div>

          {/* Story Points */}
          <div className="space-y-2">
            <Label>Story Points</Label>
            <Select
              value={storyPoints?.toString() || ""}
              onValueChange={(v) =>
                setStoryPoints(v ? (parseInt(v) as StoryPoints) : undefined)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select story points..." />
              </SelectTrigger>
              <SelectContent>
                {storyPointsOptions.map((points) => (
                  <SelectItem key={points} value={points.toString()}>
                    {points} {points === 1 ? "point" : "points"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Predecessors */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Predecessors (Tasks that must finish first)
            </Label>
            {listTasks.length > 0 ? (
              <>
                <ScrollArea className="h-32 rounded border p-2">
                  <div className="space-y-1">
                    {listTasks.map((t) => {
                      const isSelected = predecessorIds.includes(t.id);
                      return (
                        <div
                          key={t.id}
                          className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                          onClick={() => {
                            setPredecessorIds((prev) =>
                              isSelected
                                ? prev.filter((id) => id !== t.id)
                                : [...prev, t.id]
                            );
                          }}
                        >
                          <Checkbox checked={isSelected} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{t.title}</p>
                            <p className="text-xs text-muted-foreground">{t.taskId}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
                {predecessorIds.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {predecessorIds.length} task(s) selected as predecessors
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No other tasks in this list to set as predecessors.
              </p>
            )}
          </div>

          <Separator />

          {/* Time Estimate */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Time Estimate
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                value={timeEstimateHours}
                onChange={(e) => setTimeEstimateHours(e.target.value)}
                placeholder="0"
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">hours</span>
              <Input
                type="number"
                min="0"
                max="59"
                value={timeEstimateMinutes}
                onChange={(e) => setTimeEstimateMinutes(e.target.value)}
                placeholder="0"
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">minutes</span>
            </div>
          </div>

          {/* Time Tracked */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Time Tracked (Manual Entry)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                value={timeSpentHours}
                onChange={(e) => setTimeSpentHours(e.target.value)}
                placeholder="0"
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">hours</span>
              <Input
                type="number"
                min="0"
                max="59"
                value={timeSpentMinutes}
                onChange={(e) => setTimeSpentMinutes(e.target.value)}
                placeholder="0"
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">minutes</span>
            </div>
          </div>

          <Separator />

          {/* Duration & Plan Dates */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Planning</Label>
            <div className="grid grid-cols-4 gap-4">
              {/* Duration */}
              <div className="space-y-2">
                <Label>Duration (days)</Label>
                <Input
                  type="number"
                  min="1"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="0"
                />
              </div>

              {/* Plan Start */}
              <div className="space-y-2">
                <Label>Plan Start</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !planStart && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {planStart ? format(planStart, "MMM d") : "Select"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={planStart}
                      onSelect={setPlanStart}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Plan Finish (calculated) */}
              <div className="space-y-2">
                <Label>Plan Finish</Label>
                <Input
                  value={planFinish ? format(planFinish, "MMM d, yyyy") : "-"}
                  readOnly
                  className="bg-muted"
                  placeholder="Auto-calculated"
                />
              </div>

              {/* Due Date */}
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "MMM d") : "Select"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={setDueDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <Separator />

          {/* Actual Dates */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Actuals</Label>
            <div className="grid grid-cols-2 gap-4">
              {/* Actual Start */}
              <div className="space-y-2">
                <Label>Actual Start</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !actualStart && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {actualStart ? format(actualStart, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={actualStart}
                      onSelect={setActualStart}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Actual Finish */}
              <div className="space-y-2">
                <Label>Actual Finish</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !actualFinish && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {actualFinish ? format(actualFinish, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={actualFinish}
                      onSelect={setActualFinish}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <Separator />

          {/* Assignees */}
          <div className="space-y-2">
            <Label>Assignees</Label>
            <div className="flex flex-wrap gap-2">
              {users.map((user) => {
                const isSelected = assigneeIds.includes(user.id);
                return (
                  <div
                    key={user.id}
                    onClick={() => handleAssigneeToggle(user.id)}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 transition-colors",
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border hover:bg-muted"
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      className="h-4 w-4"
                      onCheckedChange={() => handleAssigneeToggle(user.id)}
                    />
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback className="text-[10px]">
                        {user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{user.name}</span>
                  </div>
                );
              })}
            </div>
            {assigneeIds.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                <span className="text-xs text-muted-foreground">Selected:</span>
                {assigneeIds.map((id) => {
                  const user = users.find((u) => u.id === id);
                  return (
                    <Badge key={id} variant="secondary" className="text-xs">
                      {user?.name}
                      <button
                        onClick={() => handleAssigneeToggle(id)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          <Separator />

          {/* Attachments */}
          <div className="space-y-2">
            <Label>Attachments</Label>
            <div className="space-y-2">
              {/* Upload Area */}
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-6 transition-colors hover:border-primary hover:bg-muted/50">
                <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                <span className="text-sm font-medium">
                  Click to upload or drag and drop
                </span>
                <span className="text-xs text-muted-foreground">
                  All file types supported
                </span>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* File List */}
              {attachments.length > 0 && (
                <div className="space-y-2">
                  {attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between rounded-lg border bg-muted/50 p-2"
                    >
                      <div className="flex items-center gap-2">
                        <FileIcon className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">
                            {attachment.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(attachment.size)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleRemoveAttachment(attachment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim()}>
            Create Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
