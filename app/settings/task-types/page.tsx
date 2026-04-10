"use client";

import { useState, useMemo } from "react";
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
import { useTaskStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";
import type { TaskType, TaskTypeCategory } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const defaultColors = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#6b7280", "#14b8a6",
];

export default function TaskTypesPage() {
  const { t } = useTranslation();
  const { taskTypes, tasks, addTaskType, updateTaskType, deleteTaskType } = useTaskStore();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTaskType, setEditingTaskType] = useState<TaskType | null>(null);
  const [deleteTaskTypeId, setDeleteTaskTypeId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(defaultColors[0]);
  const [category, setCategory] = useState<TaskTypeCategory>("organization");
  const [countsForPoints, setCountsForPoints] = useState(true);
  const [fixedPoints, setFixedPoints] = useState<number>(0);
  
  // Filter state
  const [filterCategory, setFilterCategory] = useState<"all" | TaskTypeCategory>("all");

  // Count tasks per task type
  const taskTypeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach((task) => {
      if (task.taskTypeId) {
        counts[task.taskTypeId] = (counts[task.taskTypeId] || 0) + 1;
      }
    });
    return counts;
  }, [tasks]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setColor(defaultColors[0]);
    setCategory("organization");
    setCountsForPoints(true);
    setFixedPoints(0);
  };
  
  // Filtered task types
  const filteredTaskTypes = useMemo(() => {
    if (filterCategory === "all") return taskTypes;
    return taskTypes.filter((tt) => tt.category === filterCategory);
  }, [taskTypes, filterCategory]);

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

  const handleSave = () => {
    if (!name.trim()) return;

    if (editingTaskType) {
      updateTaskType(editingTaskType.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        color,
        category,
        countsForPoints,
        fixedPoints: category === "private" ? fixedPoints : undefined,
      });
      setEditingTaskType(null);
    } else {
      const newTaskType: TaskType = {
        id: `tasktype-${Date.now()}`,
        name: name.trim(),
        description: description.trim() || undefined,
        color,
        category,
        countsForPoints,
        fixedPoints: category === "private" ? fixedPoints : undefined,
        createdAt: new Date(),
      };
      addTaskType(newTaskType);
      setShowCreateDialog(false);
    }
    resetForm();
  };

  const handleDelete = () => {
    if (deleteTaskTypeId) {
      deleteTaskType(deleteTaskTypeId);
      setDeleteTaskTypeId(null);
    }
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
          <h1 className="text-2xl font-bold tracking-tight">{t("settings.taskTypeMaster")}</h1>
          <p className="text-muted-foreground">
            Define task types and whether they count for points
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t("common.add")} Task Type
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Task Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskTypes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Organization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {taskTypes.filter((tt) => tt.category === "organization").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Private
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {taskTypes.filter((tt) => tt.category === "private").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("settings.countsForPoints")}
            </CardTitle>
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
            <Tabs value={filterCategory} onValueChange={(v) => setFilterCategory(v as "all" | TaskTypeCategory)}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="organization">Organization</TabsTrigger>
                <TabsTrigger value="private">Private</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-center">Points</TableHead>
                <TableHead className="text-center">{t("task.tasks")}</TableHead>
                <TableHead className="text-right">{t("common.actions")}</TableHead>
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
                      className={taskType.category === "organization" 
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
                  <TableCell className="text-center">
                    {taskTypeCounts[taskType.id] || 0}
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
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No task types defined yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog
        open={showCreateDialog || !!editingTaskType}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateDialog(false);
            setEditingTaskType(null);
            resetForm();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTaskType ? `${t("common.edit")} Task Type` : `${t("common.add")} Task Type`}
            </DialogTitle>
            <DialogDescription>
              {editingTaskType
                ? "Update the task type details."
                : "Create a new task type to categorize your tasks."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Development, Design, Bug Fix"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as TaskTypeCategory)}>
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
                <Label htmlFor="fixedPoints">Fixed Points</Label>
                <Input
                  id="fixedPoints"
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
                <p className="font-medium">{t("settings.countsForPoints")}</p>
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
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setEditingTaskType(null);
                resetForm();
              }}
            >
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSave} disabled={!name.trim()}>
              {editingTaskType ? t("common.save") : t("common.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTaskTypeId} onOpenChange={() => setDeleteTaskTypeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task Type?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Tasks with this type will remain but will have no type assigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
