"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Building2,
  Clock,
  CheckCircle2,
  Star,
} from "lucide-react";
import { positionsApi, type Position } from "@/lib/api/positions";
import { workSchedulesApi, type WorkSchedule } from "@/lib/api/work-schedules";
import { ApiError } from "@/lib/api/client";

// ── Helpers ────────────────────────────────────────────────────────────────────

const levelLabels: Record<number, string> = {
  1: "Executive",
  2: "C-Level",
  3: "VP/Director",
  4: "Manager",
  5: "Senior Staff",
  6: "Staff",
};

const colorOptions = [
  "#ef4444", "#f97316", "#f59e0b", "#84cc16", "#22c55e",
  "#10b981", "#14b8a6", "#06b6d4", "#3b82f6", "#6366f1",
  "#8b5cf6", "#a855f7", "#ec4899", "#6b7280",
];

const dayNames = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

// ── Main Component ─────────────────────────────────────────────────────────────

export default function OrganizationPage() {
  // ── Positions State ──────────────────────────────────────────────────────────
  const [positions, setPositions] = useState<Position[]>([]);
  const [posLoading, setPosLoading] = useState(true);
  const [showPosDialog, setShowPosDialog] = useState(false);
  const [editingPos, setEditingPos] = useState<Position | null>(null);
  const [deletingPosId, setDeletingPosId] = useState<string | null>(null);

  // Position form
  const [posName, setPosName] = useState("");
  const [posDept, setPosDept] = useState("");
  const [posLevel, setPosLevel] = useState(6);
  const [posJobLevelCode, setPosJobLevelCode] = useState("");
  const [posColor, setPosColor] = useState("#3b82f6");
  const [posParentId, setPosParentId] = useState<string>("none");

  // ── Work Schedules State ─────────────────────────────────────────────────────
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [wsLoading, setWsLoading] = useState(true);
  const [showWsDialog, setShowWsDialog] = useState(false);
  const [editingWs, setEditingWs] = useState<WorkSchedule | null>(null);
  const [deletingWsId, setDeletingWsId] = useState<string | null>(null);

  // Work Schedule form
  const [wsName, setWsName] = useState("");
  const [wsDaysPerWeek, setWsDaysPerWeek] = useState(5);
  const [wsHoursPerDay, setWsHoursPerDay] = useState(8);
  const [wsStartTime, setWsStartTime] = useState("09:00");
  const [wsEndTime, setWsEndTime] = useState("18:00");
  const [wsWorkDays, setWsWorkDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [wsIsDefault, setWsIsDefault] = useState(false);

  // ── Load data ────────────────────────────────────────────────────────────────

  const loadPositions = async () => {
    try {
      setPosLoading(true);
      const data = await positionsApi.list();
      setPositions(data);
    } catch (err) {
      console.error(err);
      toast.error("ไม่สามารถโหลดข้อมูลตำแหน่งได้");
    } finally {
      setPosLoading(false);
    }
  };

  const loadSchedules = async () => {
    try {
      setWsLoading(true);
      const data = await workSchedulesApi.list();
      setSchedules(data);
    } catch (err) {
      console.error(err);
      toast.error("ไม่สามารถโหลดข้อมูลตารางเวลาได้");
    } finally {
      setWsLoading(false);
    }
  };

  useEffect(() => {
    loadPositions();
    loadSchedules();
  }, []);

  // ── Positions CRUD ───────────────────────────────────────────────────────────

  const resetPosForm = () => {
    setPosName("");
    setPosDept("");
    setPosLevel(6);
    setPosJobLevelCode("");
    setPosColor("#3b82f6");
    setPosParentId("none");
    setEditingPos(null);
  };

  const openCreatePos = () => {
    resetPosForm();
    setShowPosDialog(true);
  };

  const openEditPos = (pos: Position) => {
    setEditingPos(pos);
    setPosName(pos.name);
    setPosDept(pos.department ?? "");
    setPosLevel(pos.level);
    setPosJobLevelCode(pos.jobLevelCode ?? "");
    setPosColor(pos.color);
    setPosParentId(pos.parentPositionId ?? "none");
    setShowPosDialog(true);
  };

  const handleSavePos = async () => {
    if (!posName.trim()) return;
    const payload = {
      name: posName.trim(),
      department: posDept.trim() || undefined,
      level: posLevel,
      jobLevelCode: posJobLevelCode.trim() || undefined,
      color: posColor,
      parentPositionId: posParentId !== "none" ? posParentId : undefined,
    };
    try {
      if (editingPos) {
        await positionsApi.update(editingPos.id, payload);
        toast.success("แก้ไขตำแหน่งสำเร็จ");
      } else {
        await positionsApi.create(payload);
        toast.success("สร้างตำแหน่งสำเร็จ");
      }
      setShowPosDialog(false);
      resetPosForm();
      await loadPositions();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "เกิดข้อผิดพลาด";
      toast.error(msg);
    }
  };

  const handleDeletePos = async () => {
    if (!deletingPosId) return;
    try {
      await positionsApi.delete(deletingPosId);
      toast.success("ลบตำแหน่งสำเร็จ");
      setDeletingPosId(null);
      await loadPositions();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "เกิดข้อผิดพลาด";
      toast.error(msg);
      setDeletingPosId(null);
    }
  };

  // ── Work Schedules CRUD ──────────────────────────────────────────────────────

  const resetWsForm = () => {
    setWsName("");
    setWsDaysPerWeek(5);
    setWsHoursPerDay(8);
    setWsStartTime("09:00");
    setWsEndTime("18:00");
    setWsWorkDays([1, 2, 3, 4, 5]);
    setWsIsDefault(false);
    setEditingWs(null);
  };

  const openCreateWs = () => {
    resetWsForm();
    setShowWsDialog(true);
  };

  const openEditWs = (ws: WorkSchedule) => {
    setEditingWs(ws);
    setWsName(ws.name);
    setWsDaysPerWeek(Number(ws.daysPerWeek));
    setWsHoursPerDay(Number(ws.hoursPerDay));
    setWsStartTime(ws.workStartTime.slice(0, 5));
    setWsEndTime(ws.workEndTime.slice(0, 5));
    setWsWorkDays(ws.workDays ?? [1, 2, 3, 4, 5]);
    setWsIsDefault(ws.isDefault);
    setShowWsDialog(true);
  };

  const toggleWsDay = (day: number) => {
    setWsWorkDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const handleSaveWs = async () => {
    if (!wsName.trim()) return;
    const payload = {
      name: wsName.trim(),
      daysPerWeek: wsDaysPerWeek,
      hoursPerDay: wsHoursPerDay,
      workDays: wsWorkDays,
      workStartTime: wsStartTime,
      workEndTime: wsEndTime,
      isDefault: wsIsDefault,
    };
    try {
      if (editingWs) {
        await workSchedulesApi.update(editingWs.id, payload);
        toast.success("แก้ไขตารางเวลาสำเร็จ");
      } else {
        await workSchedulesApi.create(payload);
        toast.success("สร้างตารางเวลาสำเร็จ");
      }
      setShowWsDialog(false);
      resetWsForm();
      await loadSchedules();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "เกิดข้อผิดพลาด";
      toast.error(msg);
    }
  };

  const handleDeleteWs = async () => {
    if (!deletingWsId) return;
    try {
      await workSchedulesApi.delete(deletingWsId);
      toast.success("ลบตารางเวลาสำเร็จ");
      setDeletingWsId(null);
      await loadSchedules();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "เกิดข้อผิดพลาด";
      toast.error(msg);
      setDeletingWsId(null);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Organization</h1>
          <p className="text-muted-foreground">
            Manage positions and work schedules
          </p>
        </div>
      </div>

      <Tabs defaultValue="positions">
        <TabsList>
          <TabsTrigger value="positions">
            <Building2 className="mr-2 h-4 w-4" />
            Positions
          </TabsTrigger>
          <TabsTrigger value="schedules">
            <Clock className="mr-2 h-4 w-4" />
            Work Schedules
          </TabsTrigger>
        </TabsList>

        {/* ── Positions Tab ──────────────────────────────────────────────── */}
        <TabsContent value="positions" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">Positions</h2>
              <p className="text-sm text-muted-foreground">
                Define job positions and organizational hierarchy
              </p>
            </div>
            <Button onClick={openCreatePos}>
              <Plus className="mr-2 h-4 w-4" />
              Add Position
            </Button>
          </div>

          {posLoading ? (
            <div className="py-12 text-center text-muted-foreground">Loading...</div>
          ) : positions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">No positions yet</h3>
                <p className="mt-2 text-muted-foreground">
                  Create positions to build your org chart
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Position</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {positions.map((pos) => (
                      <TableRow key={pos.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div
                              className="h-8 w-8 rounded flex items-center justify-center"
                              style={{ backgroundColor: `${pos.color}20` }}
                            >
                              <Building2
                                className="h-4 w-4"
                                style={{ color: pos.color }}
                              />
                            </div>
                            <div>
                              <p className="font-medium">{pos.name}</p>
                              {pos.parentPositionId && (
                                <p className="text-xs text-muted-foreground">
                                  ↳ {positions.find((p) => p.id === pos.parentPositionId)?.name ?? "Sub-position"}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{pos.department ?? "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            L{pos.level} · {levelLabels[pos.level] ?? "Staff"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {pos.jobLevelCode ?? "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={pos.isActive ? "default" : "secondary"}>
                            {pos.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditPos(pos)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setDeletingPosId(pos.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Work Schedules Tab ─────────────────────────────────────────── */}
        <TabsContent value="schedules" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">Work Schedules</h2>
              <p className="text-sm text-muted-foreground">
                Define work hours and days for employee performance calculation
              </p>
            </div>
            <Button onClick={openCreateWs}>
              <Plus className="mr-2 h-4 w-4" />
              Add Schedule
            </Button>
          </div>

          {wsLoading ? (
            <div className="py-12 text-center text-muted-foreground">Loading...</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {schedules.map((ws) => (
                <Card key={ws.id} className={ws.isDefault ? "border-primary" : ""}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-base">{ws.name}</CardTitle>
                      </div>
                      <div className="flex gap-1 items-center">
                        {ws.isDefault && (
                          <Badge variant="default" className="text-xs gap-1">
                            <Star className="h-3 w-3" />
                            Default
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => openEditWs(ws)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setDeletingWsId(ws.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="text-center p-2 bg-muted/50 rounded">
                        <p className="text-muted-foreground text-xs">Days/Week</p>
                        <p className="font-bold">{ws.daysPerWeek}</p>
                      </div>
                      <div className="text-center p-2 bg-muted/50 rounded">
                        <p className="text-muted-foreground text-xs">Hrs/Day</p>
                        <p className="font-bold">{ws.hoursPerDay}</p>
                      </div>
                      <div className="text-center p-2 bg-muted/50 rounded">
                        <p className="text-muted-foreground text-xs">Hrs/Week</p>
                        <p className="font-bold">{ws.hoursPerWeek ?? "—"}</p>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {ws.workStartTime?.slice(0, 5)} – {ws.workEndTime?.slice(0, 5)}
                    </div>
                    <div className="flex gap-1">
                      {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                        <span
                          key={d}
                          className={`text-xs px-1.5 py-0.5 rounded ${
                            ws.workDays?.includes(d)
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {dayNames[d]}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {schedules.length === 0 && (
                <div className="col-span-3 py-12 text-center text-muted-foreground">
                  No work schedules defined yet
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Position Create/Edit Dialog ──────────────────────────────────── */}
      <Dialog
        open={showPosDialog}
        onOpenChange={(open) => {
          setShowPosDialog(open);
          if (!open) resetPosForm();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPos ? "Edit Position" : "Add Position"}</DialogTitle>
            <DialogDescription>
              {editingPos ? "Update position details." : "Create a new position in the organization."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={posName}
                onChange={(e) => setPosName(e.target.value)}
                placeholder="e.g., Software Engineer"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Department</Label>
                <Input
                  value={posDept}
                  onChange={(e) => setPosDept(e.target.value)}
                  placeholder="e.g., Engineering"
                />
              </div>
              <div className="space-y-2">
                <Label>Level</Label>
                <Select value={String(posLevel)} onValueChange={(v) => setPosLevel(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(levelLabels).map(([lvl, label]) => (
                      <SelectItem key={lvl} value={lvl}>
                        L{lvl} — {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Job Level Code</Label>
              <Input
                value={posJobLevelCode}
                onChange={(e) => setPosJobLevelCode(e.target.value)}
                placeholder="e.g., SE-L5"
              />
            </div>
            <div className="space-y-2">
              <Label>Parent Position</Label>
              <Select value={posParentId} onValueChange={setPosParentId}>
                <SelectTrigger>
                  <SelectValue placeholder="None (top-level)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (top-level)</SelectItem>
                  {positions
                    .filter((p) => !editingPos || p.id !== editingPos.id)
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`h-7 w-7 rounded-full transition-all ${
                      posColor === c ? "ring-2 ring-offset-2 ring-primary" : ""
                    }`}
                    style={{ backgroundColor: c }}
                    onClick={() => setPosColor(c)}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPosDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePos} disabled={!posName.trim()}>
              {editingPos ? "Save Changes" : "Create Position"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Work Schedule Create/Edit Dialog ────────────────────────────── */}
      <Dialog
        open={showWsDialog}
        onOpenChange={(open) => {
          setShowWsDialog(open);
          if (!open) resetWsForm();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingWs ? "Edit Work Schedule" : "Add Work Schedule"}</DialogTitle>
            <DialogDescription>
              {editingWs ? "Update schedule details." : "Create a new work schedule."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={wsName}
                onChange={(e) => setWsName(e.target.value)}
                placeholder="e.g., Mon-Fri Full Time"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Days / Week</Label>
                <Input
                  type="number"
                  min={1}
                  max={7}
                  value={wsDaysPerWeek}
                  onChange={(e) => setWsDaysPerWeek(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Hours / Day</Label>
                <Input
                  type="number"
                  min={1}
                  max={24}
                  value={wsHoursPerDay}
                  onChange={(e) => setWsHoursPerDay(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={wsStartTime}
                  onChange={(e) => setWsStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={wsEndTime}
                  onChange={(e) => setWsEndTime(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Work Days</Label>
              <div className="flex gap-2">
                {dayNames.map((day, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`h-9 w-9 rounded text-sm font-medium transition-colors ${
                      wsWorkDays.includes(idx)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                    onClick={() => toggleWsDay(idx)}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Set as Default</Label>
                <p className="text-xs text-muted-foreground">
                  Used as the default schedule for new employees
                </p>
              </div>
              <Switch checked={wsIsDefault} onCheckedChange={setWsIsDefault} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWsDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveWs} disabled={!wsName.trim()}>
              {editingWs ? "Save Changes" : "Create Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Position Confirmation ─────────────────────────────────── */}
      <AlertDialog
        open={!!deletingPosId}
        onOpenChange={(open) => { if (!open) setDeletingPosId(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Position?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate the position. Employees in this position must be reassigned first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeletePos}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Delete Work Schedule Confirmation ───────────────────────────── */}
      <AlertDialog
        open={!!deletingWsId}
        onOpenChange={(open) => { if (!open) setDeletingWsId(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Work Schedule?</AlertDialogTitle>
            <AlertDialogDescription>
              This schedule will be deleted. Employees assigned to it must be updated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteWs}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
