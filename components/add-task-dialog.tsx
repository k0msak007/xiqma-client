"use client";

import { useState, useEffect } from "react";
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
import { toast } from "sonner";
import { useTaskStore } from "@/lib/store";
import { useListTaskStore } from "@/lib/list-task-store";
import { useWorkspaceStore } from "@/lib/workspace-store";
import { employeesApi } from "@/lib/api/employees";
import { spacesApi } from "@/lib/api/spaces";
import {
  priorityConfig,
  storyPointsOptions,
  type Priority,
  type StoryPoints,
} from "@/lib/types";

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listId: string;
  defaultStatusId?: string;
  onSuccess?: () => void;
}

export function AddTaskDialog({ open, onOpenChange, listId, defaultStatusId, onSuccess }: AddTaskDialogProps) {
  const { taskTypes } = useTaskStore();
  const { createTask, statuses, tasks, saving } = useListTaskStore();
  const { lists, spaces } = useWorkspaceStore();

  const list = lists.find((l) => l.id === listId);
  const currentSpace = spaces.find((s) => s.id === list?.spaceId);
  const spaceType = (currentSpace as any)?.type || "organization";

  // Filter task types based on space type
  const filteredTaskTypes = taskTypes.filter((tt) => tt.category === spaceType);

  // Employees for assignee selection
  const [employees, setEmployees] = useState<{ id: string; name: string; avatarUrl: string | null }[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [employeesError, setEmployeesError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [statusId, setStatusId] = useState<string>("");
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
  const [predecessorIds, setPredecessorIds] = useState<string[]>([]);

  // Load employees (space members) when dialog opens
  useEffect(() => {
    if (open && list?.spaceId) {
      setEmployeesLoading(true);
      setEmployeesError(null);
      
      const loadEmployees = async () => {
        try {
          const spaceDetail = await spacesApi.get(list.spaceId);
          const members = spaceDetail.members || [];
          console.log("[AddTaskDialog] Space members loaded:", members.length);
          setEmployees(members.map((m) => ({ 
            id: m.employeeId, 
            name: m.employee.name, 
            avatarUrl: m.employee.avatarUrl ?? null 
          })));
        } catch (err) {
          console.error("Failed to load space members:", err);
          try {
            const empRes = await employeesApi.list({ isActive: true, limit: 200 });
            const empData = empRes as unknown as { rows?: { id: string; name: string; avatarUrl: string | null }[] };
            const employeeList = Array.isArray(empRes) ? empRes : (empData.rows || []);
            setEmployees(employeeList.map((e: { id: string; name: string; avatarUrl: string | null }) => ({ id: e.id, name: e.name, avatarUrl: e.avatarUrl })));
          } catch (empErr) {
            console.error("Failed to load employees:", empErr);
            setEmployeesError(empErr instanceof Error ? empErr.message : "Failed to load employees");
          }
        } finally {
          setEmployeesLoading(false);
        }
      };
      
      loadEmployees();
    }
  }, [open, list?.spaceId]);

  // Set initial statusId from statuses when dialog opens
  useEffect(() => {
    console.log("[AddTaskDialog] statuses:", statuses, "statusId:", statusId, "open:", open);
    if (open) {
      if (defaultStatusId && statuses.some(s => s.id === defaultStatusId)) {
        setStatusId(defaultStatusId);
      } else if (statuses.length > 0 && !statusId) {
        setStatusId(statuses[0].id);
      } else if (statuses.length === 0) {
        console.warn("[AddTaskDialog] No statuses found! Cannot create task.");
      }
    }
  }, [open, statuses, statusId, defaultStatusId]);

  // Get tasks in the same list for predecessor selection
  const listTasks = tasks.filter((t) => t.listId === listId);

  // Calculate Plan Finish from Plan Start + Duration
  const planFinish =
    planStart && duration
      ? new Date(
          planStart.getTime() + parseInt(duration) * 24 * 60 * 60 * 1000
        )
      : undefined;

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStatusId(statuses.length > 0 ? statuses[0].id : "");
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
    setPredecessorIds([]);
  };

  const handleAssigneeToggle = (userId: string) => {
    setAssigneeIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async () => {
    console.log("[AddTaskDialog] Submit clicked", { title, assigneeIds, statusId, statuses: statuses.length });
    
    if (!title.trim()) {
      toast.error("กรุณากรอกชื่อ task");
      return;
    }
    
    if (assigneeIds.length === 0) {
      toast.error("กรุณาเลือกผู้รับผิดชอบ");
      return;
    }
    
    if (statuses.length === 0) {
      toast.error("ไม่พบ status - กรุณาสร้าง status ก่อนสร้าง task");
      return;
    }

    const totalEstimateMinutes =
      parseInt(timeEstimateHours || "0") * 60 +
      parseInt(timeEstimateMinutes || "0");

    const payload = {
      title: title.trim(),
      listId,
      assigneeId: assigneeIds[0],
      description: description.trim() || undefined,
      listStatusId: statusId || statuses[0]?.id,
      priority,
      storyPoints: storyPoints || undefined,
      timeEstimateHours:
        totalEstimateMinutes > 0 ? totalEstimateMinutes / 60 : undefined,
      planStart: planStart
        ? planStart.toISOString().split("T")[0]
        : undefined,
      durationDays: duration ? parseInt(duration) : undefined,
      deadline: dueDate ? dueDate.toISOString() : undefined,
    };

    // Only add taskTypeId if it's a valid UUID format
    if (taskTypeId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(taskTypeId)) {
      Object.assign(payload, { taskTypeId });
    }

    console.log("[AddTaskDialog] Creating task with payload:", payload);
    
    const task = await createTask(payload);
    if (task) {
      resetForm();
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
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
          {/* Task Name */}
          <div className="space-y-2">
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
                  <SelectValue placeholder="Select status..." />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
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
                onValueChange={(v) =>
                  setTaskTypeId(v === "none" ? undefined : v)
                }
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
                          <Badge variant="outline" className="ml-auto text-[10px]">
                            +Pts
                          </Badge>
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
                            <p className="text-xs text-muted-foreground">
                              {t.taskId}
                            </p>
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

          {/* Assignees */}
          <div className="space-y-2">
            <Label>
              Assignee <span className="text-destructive">*</span>
            </Label>
<div className="flex flex-wrap gap-2">
              {employeesLoading ? (
                <p className="text-sm text-muted-foreground">Loading employees...</p>
              ) : employeesError ? (
                <p className="text-sm text-red-500">{employeesError}</p>
              ) : employees.length === 0 ? (
                <p className="text-sm text-muted-foreground">No employees found</p>
              ) : (
                <>
                  {employees.map((emp) => {
                    const isSelected = assigneeIds.includes(emp.id);
                    return (
                      <div
                        key={emp.id}
                        onClick={() => handleAssigneeToggle(emp.id)}
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
                          onCheckedChange={() => handleAssigneeToggle(emp.id)}
                        />
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={emp.avatarUrl ?? undefined} />
                          <AvatarFallback className="text-[10px]">
                            {emp.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{emp.name}</span>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
            {assigneeIds.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                <span className="text-xs text-muted-foreground">Selected:</span>
                {assigneeIds.map((id) => {
                  const emp = employees.find((e) => e.id === id);
                  return (
                    <Badge key={id} variant="secondary" className="text-xs">
                      {emp?.name}
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || assigneeIds.length === 0 || saving}
          >
            {saving ? "Creating..." : "Create Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
