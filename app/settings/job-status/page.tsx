"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  CircleDot,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import type { Status, StatusPointCountType } from "@/lib/types";

const defaultColors = [
  "#6b7280", "#3b82f6", "#f59e0b", "#10b981", "#6366f1",
  "#ef4444", "#ec4899", "#8b5cf6", "#14b8a6", "#f97316",
];

const statusTypes: { value: Status["type"]; label: string; labelTh: string }[] = [
  { value: "open", label: "Open", labelTh: "เปิด" },
  { value: "in_progress", label: "In Progress", labelTh: "กำลังดำเนินการ" },
  { value: "review", label: "Review", labelTh: "รอตรวจสอบ" },
  { value: "done", label: "Done", labelTh: "เสร็จสิ้น" },
  { value: "closed", label: "Closed", labelTh: "ปิด" },
];

const pointCountTypes: { value: StatusPointCountType; label: string; labelTh: string; description: string; descriptionTh: string; color: string }[] = [
  { value: "not_counted", label: "Not Counted", labelTh: "ยังไม่นับ", description: "Tasks in this status don't count towards points", descriptionTh: "งานในสถานะนี้ยังไม่นับ Point", color: "#6b7280" },
  { value: "in_progress", label: "In Progress", labelTh: "กำลังดำเนินการ", description: "Tasks are being worked on (partial progress)", descriptionTh: "งานกำลังดำเนินการอยู่", color: "#3b82f6" },
  { value: "complete", label: "Complete", labelTh: "นับเป็นเสร็จ", description: "Tasks count as completed for points", descriptionTh: "งานเสร็จสมบูรณ์ นับ Point ได้", color: "#10b981" },
];

export default function JobStatusPage() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const { statuses, tasks, addStatus, updateStatus, deleteStatus, reorderStatuses } = useTaskStore();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingStatus, setEditingStatus] = useState<Status | null>(null);
  const [statusToDelete, setStatusToDelete] = useState<Status | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [color, setColor] = useState(defaultColors[0]);
  const [type, setType] = useState<Status["type"]>("open");
  const [pointCountType, setPointCountType] = useState<StatusPointCountType>("not_counted");

  // Count tasks per status
  const taskCountByStatus = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach((task) => {
      counts[task.statusId] = (counts[task.statusId] || 0) + 1;
    });
    return counts;
  }, [tasks]);

  const resetForm = () => {
    setName("");
    setColor(defaultColors[0]);
    setType("open");
    setPointCountType("not_counted");
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowCreateDialog(true);
  };

  const handleOpenEdit = (status: Status) => {
    setName(status.name);
    setColor(status.color);
    setType(status.type);
    setPointCountType(status.pointCountType || "not_counted");
    setEditingStatus(status);
  };

  const handleSave = () => {
    if (!name.trim()) return;

    if (editingStatus) {
      updateStatus(editingStatus.id, {
        name: name.trim(),
        color,
        type,
        pointCountType,
      });
      setEditingStatus(null);
    } else {
      const maxOrder = Math.max(...statuses.map((s) => s.order), -1);
      const newStatus: Status = {
        id: `status-${Date.now()}`,
        name: name.trim(),
        color,
        type,
        pointCountType,
        order: maxOrder + 1,
      };
      addStatus(newStatus);
      setShowCreateDialog(false);
    }
    resetForm();
  };

  const handleDelete = () => {
    if (statusToDelete) {
      deleteStatus(statusToDelete.id);
      setStatusToDelete(null);
    }
  };

  const moveStatus = (statusId: string, direction: "up" | "down") => {
    const sortedStatuses = [...statuses].sort((a, b) => a.order - b.order);
    const currentIndex = sortedStatuses.findIndex((s) => s.id === statusId);
    
    if (direction === "up" && currentIndex > 0) {
      const newOrder = [...sortedStatuses];
      [newOrder[currentIndex], newOrder[currentIndex - 1]] = [newOrder[currentIndex - 1], newOrder[currentIndex]];
      reorderStatuses(newOrder.map((s) => s.id));
    } else if (direction === "down" && currentIndex < sortedStatuses.length - 1) {
      const newOrder = [...sortedStatuses];
      [newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]];
      reorderStatuses(newOrder.map((s) => s.id));
    }
  };

  const sortedStatuses = [...statuses].sort((a, b) => a.order - b.order);

  const getTypeLabel = (statusType: Status["type"]) => {
    const typeInfo = statusTypes.find((t) => t.value === statusType);
    return language === "th" ? typeInfo?.labelTh : typeInfo?.label;
  };

  const getTypeBadgeColor = (statusType: Status["type"]) => {
    switch (statusType) {
      case "open": return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
      case "in_progress": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "review": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "done": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "closed": return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
      default: return "";
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {language === "th" ? "Job Status Master" : "Job Status Master"}
            </h1>
            <p className="text-muted-foreground">
              {language === "th" 
                ? "จัดการสถานะของงาน เพิ่ม/แก้ไข/ลบ และจัดลำดับ" 
                : "Manage job statuses - add, edit, delete, and reorder"}
            </p>
          </div>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {language === "th" ? "เพิ่มสถานะ" : "Add Status"}
        </Button>
      </header>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {language === "th" ? "สถานะทั้งหมด" : "Total Statuses"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statuses.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Open / In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {statuses.filter((s) => s.type === "open" || s.type === "in_progress").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Done / Closed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statuses.filter((s) => s.type === "done" || s.type === "closed").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {language === "th" ? "งานทั้งหมด" : "Total Tasks"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{tasks.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Status Table */}
      <Card>
        <CardHeader>
          <CardTitle>{language === "th" ? "รายการสถานะ" : "Status List"}</CardTitle>
          <CardDescription>
            {language === "th" 
              ? "ลากเพื่อจัดลำดับ หรือใช้ปุ่มขึ้น/ลง สถานะที่มีงานอยู่จะไม่สามารถลบได้" 
              : "Drag to reorder or use up/down buttons. Statuses with tasks cannot be deleted."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>{language === "th" ? "สถานะ" : "Status"}</TableHead>
                <TableHead>{language === "th" ? "ประเภท" : "Type"}</TableHead>
                <TableHead>{language === "th" ? "นับ Point" : "Point Count"}</TableHead>
                <TableHead className="text-center">{language === "th" ? "จำนวนงาน" : "Tasks"}</TableHead>
                <TableHead className="text-right">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedStatuses.map((status, index) => (
                <TableRow key={status.id}>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      <span className="text-muted-foreground">{index + 1}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-full"
                        style={{ backgroundColor: `${status.color}20` }}
                      >
                        <CircleDot className="h-4 w-4" style={{ color: status.color }} />
                      </div>
                      <span className="font-medium">{status.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={getTypeBadgeColor(status.type)}>
                      {getTypeLabel(status.type)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const pct = pointCountTypes.find(p => p.value === status.pointCountType);
                      return pct ? (
                        <Badge 
                          variant="outline" 
                          style={{ borderColor: pct.color, color: pct.color }}
                        >
                          {language === "th" ? pct.labelTh : pct.label}
                        </Badge>
                      ) : (
                        <Badge variant="outline">-</Badge>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">{taskCountByStatus[status.id] || 0}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => moveStatus(status.id, "up")}
                        disabled={index === 0}
                      >
                        <span className="sr-only">Move up</span>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => moveStatus(status.id, "down")}
                        disabled={index === sortedStatuses.length - 1}
                      >
                        <span className="sr-only">Move down</span>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleOpenEdit(status)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => setStatusToDelete(status)}
                        disabled={(taskCountByStatus[status.id] || 0) > 0}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {statuses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {language === "th" ? "ยังไม่มีสถานะ" : "No statuses defined yet"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog || !!editingStatus} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false);
          setEditingStatus(null);
          resetForm();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingStatus 
                ? (language === "th" ? "แก้ไขสถานะ" : "Edit Status")
                : (language === "th" ? "เพิ่มสถานะใหม่" : "Add New Status")}
            </DialogTitle>
            <DialogDescription>
              {language === "th" 
                ? "กำหนดชื่อ สี และประเภทของสถานะ" 
                : "Set the name, color, and type for this status"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">{language === "th" ? "ชื่อสถานะ" : "Status Name"} *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={language === "th" ? "เช่น To Do, In Progress" : "e.g., To Do, In Progress"}
              />
            </div>

            <div className="space-y-2">
              <Label>{language === "th" ? "ประเภท" : "Type"} *</Label>
              <Select value={type} onValueChange={(v) => setType(v as Status["type"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusTypes.map((st) => (
                    <SelectItem key={st.value} value={st.value}>
                      {language === "th" ? st.labelTh : st.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {language === "th" 
                  ? "ประเภทกำหนดว่าสถานะนี้หมายถึงงานที่ยังไม่เสร็จ กำลังทำ หรือเสร็จแล้ว" 
                  : "Type determines if this status means work is pending, in progress, or complete"}
              </p>
            </div>

            <div className="space-y-2">
              <Label>{language === "th" ? "การนับ Point" : "Point Counting"} *</Label>
              <Select value={pointCountType} onValueChange={(v) => setPointCountType(v as StatusPointCountType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pointCountTypes.map((pct) => (
                    <SelectItem key={pct.value} value={pct.value}>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: pct.color }} />
                        {language === "th" ? pct.labelTh : pct.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {(() => {
                  const pct = pointCountTypes.find(p => p.value === pointCountType);
                  return pct ? (language === "th" ? pct.descriptionTh : pct.description) : "";
                })()}
              </p>
            </div>

            <div className="space-y-2">
              <Label>{language === "th" ? "สี" : "Color"}</Label>
              <div className="flex flex-wrap gap-2">
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

            {/* Preview */}
            <div className="space-y-2">
              <Label>{language === "th" ? "ตัวอย่าง" : "Preview"}</Label>
              <div className="flex items-center gap-3 p-3 rounded-lg border">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${color}20` }}
                >
                  <CircleDot className="h-4 w-4" style={{ color }} />
                </div>
                <span className="font-medium">{name || (language === "th" ? "ชื่อสถานะ" : "Status Name")}</span>
                <Badge variant="secondary" className={getTypeBadgeColor(type)}>
                  {getTypeLabel(type)}
                </Badge>
                {(() => {
                  const pct = pointCountTypes.find(p => p.value === pointCountType);
                  return pct ? (
                    <Badge variant="outline" style={{ borderColor: pct.color, color: pct.color }}>
                      {language === "th" ? pct.labelTh : pct.label}
                    </Badge>
                  ) : null;
                })()}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCreateDialog(false);
              setEditingStatus(null);
              resetForm();
            }}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSave} disabled={!name.trim()}>
              {editingStatus ? t("common.save") : (language === "th" ? "เพิ่ม" : "Add")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!statusToDelete} onOpenChange={(open) => !open && setStatusToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === "th" ? "ยืนยันการลบ" : "Confirm Delete"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === "th" 
                ? `คุณต้องการลบสถานะ "${statusToDelete?.name}" หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้`
                : `Are you sure you want to delete "${statusToDelete?.name}"? This action cannot be undone.`}
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
