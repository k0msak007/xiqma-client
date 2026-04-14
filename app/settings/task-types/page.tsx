"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Layers,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { taskTypesApi, type TaskType, type CreateTaskTypePayload } from "@/lib/api/task-types";

const defaultColors = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#6b7280", "#14b8a6",
];

type FilterCategory = "all" | "private" | "organization";

export default function TaskTypesPage() {
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTaskType, setEditingTaskType] = useState<TaskType | null>(null);
  const [deleteTaskTypeId, setDeleteTaskTypeId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [filterCategory, setFilterCategory] = useState<FilterCategory>("all");

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(defaultColors[0]);
  const [category, setCategory] = useState<"private" | "organization">("organization");
  const [countsForPoints, setCountsForPoints] = useState(true);
  const [fixedPoints, setFixedPoints] = useState(0);

  const loadTaskTypes = async () => {
    try {
      setIsLoading(true);
      const data = await taskTypesApi.list();
      setTaskTypes(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load task types");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTaskTypes();
  }, []);

  const filteredTaskTypes = useMemo(() => {
    if (filterCategory === "all") return taskTypes;
    return taskTypes.filter((tt) => tt.category === filterCategory);
  }, [taskTypes, filterCategory]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setColor(defaultColors[0]);
    setCategory("organization");
    setCountsForPoints(true);
    setFixedPoints(0);
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowCreateDialog(true);
  };

  const handleOpenEdit = (taskType: TaskType) => {
    setName(taskType.name);
    setDescription(taskType.description || "");
    setColor(taskType.color);
    setCategory(taskType.category || "organization");
    setCountsForPoints(taskType.countsForPoints);
    setFixedPoints(taskType.fixedPoints || 0);
    setEditingTaskType(taskType);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsSaving(true);

    const payload: CreateTaskTypePayload = {
      name: name.trim(),
      description: description.trim() || undefined,
      color,
      category,
      countsForPoints,
      fixedPoints: category === "private" ? fixedPoints : undefined,
    };

    try {
      if (editingTaskType) {
        await taskTypesApi.update(editingTaskType.id, payload);
        toast.success("Task type updated");
        setEditingTaskType(null);
      } else {
        await taskTypesApi.create(payload);
        toast.success("Task type created");
        setShowCreateDialog(false);
      }
      resetForm();
      await loadTaskTypes();
    } catch (err) {
      console.error(err);
      toast.error(editingTaskType ? "Failed to update task type" : "Failed to create task type");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTaskTypeId) return;
    try {
      await taskTypesApi.delete(deleteTaskTypeId);
      toast.success("Task type deleted");
      setDeleteTaskTypeId(null);
      await loadTaskTypes();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete task type");
    }
  };

  const closeDialog = () => {
    setShowCreateDialog(false);
    setEditingTaskType(null);
    resetForm();
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Task Type Master</h1>
          <p className="text-muted-foreground">
            Define task types and whether they count for points
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Task Type
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Task Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskTypes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Organization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {taskTypes.filter((tt) => tt.category === "organization").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Private</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {taskTypes.filter((tt) => tt.category === "private").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Counts for Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {taskTypes.filter((tt) => tt.countsForPoints).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task Types Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Task Types</CardTitle>
              <CardDescription>
                Organization tasks use role-based point ratio. Private tasks have fixed point values.
              </CardDescription>
            </div>
            <Tabs value={filterCategory} onValueChange={(v) => setFilterCategory(v as FilterCategory)}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="organization">Organization</TabsTrigger>
                <TabsTrigger value="private">Private</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-center">Points</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTaskTypes.map((taskType) => (
                  <TableRow key={taskType.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded"
                          style={{ backgroundColor: `${taskType.color}20` }}
                        >
                          <Layers className="h-4 w-4" style={{ color: taskType.color }} />
                        </div>
                        <span className="font-medium">{taskType.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={taskType.category === "organization" ? "default" : "secondary"}
                        className={
                          taskType.category === "organization"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                        }
                      >
                        {taskType.category === "organization" ? "Organization" : "Private"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {taskType.description || "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {taskType.category === "private" ? (
                        taskType.countsForPoints ? (
                          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            {taskType.fixedPoints || 0} pts
                          </Badge>
                        ) : (
                          <Badge variant="secondary">0 pts</Badge>
                        )
                      ) : taskType.countsForPoints ? (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          <Check className="mr-1 h-3 w-3" />
                          Ratio
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <X className="mr-1 h-3 w-3" />
                          No
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(taskType)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteTaskTypeId(taskType.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredTaskTypes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No task types defined yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog
        open={showCreateDialog || !!editingTaskType}
        onOpenChange={(open) => { if (!open) closeDialog(); }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTaskType ? "Edit Task Type" : "Add Task Type"}
            </DialogTitle>
            <DialogDescription>
              {editingTaskType
                ? "Update the task type details."
                : "Create a new task type to categorize your tasks."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tt-name">Name *</Label>
              <Input
                id="tt-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Development, Design, Bug Fix"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tt-description">Description</Label>
              <Textarea
                id="tt-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as "private" | "organization")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="organization">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                      Organization Task
                    </div>
                  </SelectItem>
                  <SelectItem value="private">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-purple-500" />
                      Private Task
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {category === "organization"
                  ? "Organization tasks use role-based point ratio calculation."
                  : "Private tasks award a fixed number of points."}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {defaultColors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`h-8 w-8 rounded-full ring-2 ring-offset-2 ring-offset-background transition-all ${
                      color === c ? "ring-primary" : "ring-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>

            {category === "private" && (
              <div className="space-y-2">
                <Label htmlFor="tt-fixedPoints">Fixed Points</Label>
                <Input
                  id="tt-fixedPoints"
                  type="number"
                  min="0"
                  max="100"
                  value={fixedPoints}
                  onChange={(e) => setFixedPoints(parseInt(e.target.value) || 0)}
                  placeholder="e.g., 2"
                />
                <p className="text-xs text-muted-foreground">
                  Each task of this type will award exactly {fixedPoints} point(s).
                </p>
              </div>
            )}

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">Counts for Points</p>
                <p className="text-sm text-muted-foreground">
                  {category === "private"
                    ? `Enable to award ${fixedPoints} point(s) per task`
                    : "Tasks of this type will contribute to point calculations"}
                </p>
              </div>
              <Switch
                checked={countsForPoints}
                onCheckedChange={setCountsForPoints}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!name.trim() || isSaving}>
              {isSaving ? "Saving..." : editingTaskType ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTaskTypeId} onOpenChange={(open) => { if (!open) setDeleteTaskTypeId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task Type?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Tasks with this type will remain but will have no type assigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
