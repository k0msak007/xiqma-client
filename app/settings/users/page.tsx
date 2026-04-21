"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Pencil,
  UserPlus,
  Building2,
  UserX,
  Check,
  ChevronsUpDown,
  Crown,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Switch } from "@/components/ui/switch";
import { employeesApi, type Employee, type CreateEmployeePayload, type UpdateEmployeePayload } from "@/lib/api/employees";
import { rolesApi, type Role } from "@/lib/api/roles";
import { positionsApi, type Position } from "@/lib/api/positions";
import { format } from "date-fns";

function roleColorClass(role: string) {
  switch (role) {
    case "admin":   return "bg-red-50 text-red-600 border-red-200";
    case "manager": return "bg-amber-50 text-amber-700 border-amber-200";
    case "hr":      return "bg-purple-50 text-purple-600 border-purple-200";
    default:        return "bg-blue-50 text-blue-600 border-blue-200";
  }
}

export default function UsersPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [roles, setRoles] = useState<Role[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showDialog, setShowDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deactivateEmployeeId, setDeactivateEmployeeId] = useState<string | null>(null);
  const [managerPopoverOpen, setManagerPopoverOpen] = useState(false);

  // Create form state
  const [employeeCode, setEmployeeCode] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"employee" | "manager" | "hr" | "admin">("employee");
  const [roleId, setRoleId] = useState("");
  const [positionId, setPositionId] = useState("");
  const [department, setDepartment] = useState("");
  const [managerId, setManagerId] = useState("");
  const [isActive, setIsActive] = useState(true);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [empRes, rolesData, positionsData] = await Promise.all([
        employeesApi.list({ limit: 100 }),
        rolesApi.list(),
        positionsApi.list(),
      ]);
      setEmployees(empRes);
      setTotalEmployees(empRes.length);
      setRoles(rolesData);
      setPositions(positionsData);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setEmployeeCode("");
    setName("");
    setEmail("");
    setPassword("");
    setRole("employee");
    setRoleId("");
    setPositionId("");
    setDepartment("");
    setManagerId("");
    setIsActive(true);
    setEditingEmployee(null);
  };

  const defaultAdminId = () =>
    employees.find((e) => e.isActive && e.role === "admin")?.id ?? "";

  const openCreateDialog = () => {
    resetForm();
    setManagerId(defaultAdminId());
    setShowDialog(true);
  };

  const openEditDialog = (emp: Employee) => {
    setEditingEmployee(emp);
    setName(emp.name);
    setEmail(emp.email || "");
    setRole(emp.role);
    setRoleId("");
    setPositionId("");
    setDepartment(emp.department || "");
    // ถ้าไม่ใช่ admin และยังไม่มีหัวหน้า → default เป็น admin
    setManagerId(emp.managerId || (emp.role !== "admin" ? defaultAdminId() : ""));
    setIsActive(emp.isActive);
    setShowDialog(true);
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    if (role !== "admin" && !managerId) {
      toast.error("ต้องระบุหัวหน้า (ยกเว้น role = admin)");
      return;
    }
    setIsSaving(true);

    try {
      if (editingEmployee) {
        const payload: UpdateEmployeePayload = {
          name: name.trim(),
          email: email.trim() || undefined,
          roleId: roleId || undefined,
          positionId: positionId || undefined,
          department: department.trim() || undefined,
          managerId: managerId || undefined,
          isActive,
        };
        await employeesApi.update(editingEmployee.id, payload);
        toast.success("Employee updated");
      } else {
        if (!employeeCode.trim() || !password.trim()) return;
        const payload: CreateEmployeePayload = {
          employeeCode: employeeCode.trim(),
          name: name.trim(),
          email: email.trim() || undefined,
          password: password.trim(),
          role,
          roleId: roleId || undefined,
          positionId: positionId || undefined,
          department: department.trim() || undefined,
          managerId: managerId || undefined,
        };
        await employeesApi.create(payload);
        toast.success("Employee created");
      }
      setShowDialog(false);
      resetForm();
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error(editingEmployee ? "Failed to update employee" : "Failed to create employee");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateEmployeeId) return;
    try {
      await employeesApi.deactivate(deactivateEmployeeId);
      toast.success("Employee deactivated");
      setDeactivateEmployeeId(null);
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to deactivate employee");
    }
  };

  const deactivatingEmployee = employees?.find((e) => e.id === deactivateEmployeeId);
  const activeCount = employees?.filter((e) => e.isActive).length ?? 0;
  const adminCount = employees?.filter((e) => e.role === "admin").length ?? 0;

  const isCreateFormValid = !editingEmployee
    ? name.trim() && employeeCode.trim() && password.trim()
    : name.trim();

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
          <h1 className="text-2xl font-bold tracking-tight">Employee Management</h1>
          <p className="text-muted-foreground">
            Create employees, assign roles and positions.
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Employee
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{totalEmployees}</div>
            <p className="text-sm text-muted-foreground">Total Employees</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{activeCount}</div>
            <p className="text-sm text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{adminCount}</div>
            <p className="text-sm text-muted-foreground">Admins</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{roles.length}</div>
            <p className="text-sm text-muted-foreground">Roles</p>
          </CardContent>
        </Card>
      </div>

      {/* Employees Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Employees</CardTitle>
          <CardDescription>
            Manage employee accounts, roles, and positions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={emp.avatarUrl || undefined} />
                          <AvatarFallback>{emp.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{emp.name}</p>
                          <p className="text-sm text-muted-foreground">{emp.email || "-"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{emp.employeeCode}</code>
                    </TableCell>
                    <TableCell>
                      {emp.department ? (
                        <Badge variant="secondary" className="text-xs">
                          <Building2 className="mr-1 h-3 w-3" />
                          {emp.department}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {emp.roleName ? (
                        <Badge variant="outline" className="text-xs">{emp.roleName}</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">{emp.role}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {emp.positionName ? (
                        <span className="text-sm">{emp.positionName}</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {emp.managerId ? (
                        (() => {
                          const mgr = employees.find((x) => x.id === emp.managerId);
                          return mgr ? (
                            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50/60 pl-0.5 pr-2 py-0.5">
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={mgr.avatarUrl || undefined} />
                                <AvatarFallback className="text-[9px] bg-gradient-to-br from-amber-100 to-orange-100 text-amber-700">
                                  {mgr.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs font-medium text-amber-900 truncate max-w-[120px]">
                                {mgr.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          );
                        })()
                      ) : (
                        <span className="text-muted-foreground text-sm italic">ไม่มี</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={emp.isActive ? "default" : "secondary"}>
                        {emp.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(emp.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(emp)}
                          title="Edit Employee"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {emp.isActive && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            title="Deactivate Employee"
                            onClick={() => setDeactivateEmployeeId(emp.id)}
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {employees.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No employees yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Employee Dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => { if (!open) { setShowDialog(false); resetForm(); } else { setShowDialog(true); } }}>
        <DialogContent className="max-w-md max-h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="p-6 pb-2 shrink-0 border-b">
            <DialogTitle>{editingEmployee ? "Edit Employee" : "Add Employee"}</DialogTitle>
            <DialogDescription>
              {editingEmployee
                ? "Update employee details and assignments."
                : "Add a new employee to the system."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-6 py-4 overflow-y-auto flex-1">
            {!editingEmployee && (
              <div className="space-y-2">
                <Label htmlFor="emp-code">
                  Employee Code <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="emp-code"
                  value={employeeCode}
                  onChange={(e) => setEmployeeCode(e.target.value)}
                  placeholder="e.g., EMP001"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="emp-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="emp-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emp-email">Email</Label>
              <Input
                id="emp-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@company.com"
              />
            </div>

            {!editingEmployee && (
              <div className="space-y-2">
                <Label htmlFor="emp-password">
                  Password <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="emp-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Set initial password"
                />
              </div>
            )}

            <Separator />

            <div className="space-y-1 rounded-lg border bg-muted/20 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                สิทธิ์ & โครงสร้าง
              </p>
              <p className="text-[11px] text-muted-foreground">
                กำหนดว่าเข้าถึงอะไรได้ และเป็นลูกน้องของใคร (สำคัญต่อความปลอดภัย)
              </p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                สิทธิ์การเข้าถึง (Access Level)
                <span className="text-destructive">*</span>
              </Label>
              <Select value={role} onValueChange={(v) => {
                const next = v as typeof role;
                setRole(next);
                if (next !== "admin" && !managerId) setManagerId(defaultAdminId());
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">
                    <div className="flex flex-col items-start">
                      <span>Employee — พนักงานทั่วไป</span>
                      <span className="text-[10px] text-muted-foreground">เห็นเฉพาะงานของตัวเอง</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="manager">
                    <div className="flex flex-col items-start">
                      <span>Manager — หัวหน้าทีม</span>
                      <span className="text-[10px] text-muted-foreground">เห็นงาน/วิเคราะห์เฉพาะทีมตัวเอง</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="hr">
                    <div className="flex flex-col items-start">
                      <span>HR — ฝ่ายบุคคล</span>
                      <span className="text-[10px] text-muted-foreground">เห็นข้อมูลพนักงานทุกคน (HR analytics)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex flex-col items-start">
                      <span>Admin — ผู้ดูแลระบบ</span>
                      <span className="text-[10px] text-muted-foreground">เข้าถึงทุกอย่าง รวมถึงตั้งค่าระบบ</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                {role === "employee"   && "⚪ ดูงานตัวเอง · check-in · ลา"}
                {role === "manager"    && "🟠 ดูทีม · อนุมัติลา · ดู analytics ทีม"}
                {role === "hr"         && "🟣 ดูทุกคน · รายงาน HR · จัดการลา"}
                {role === "admin"      && "🔴 เต็มสิทธิ์ · จัดการระบบ · ไม่ถูก scope"}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Crown className="h-3.5 w-3.5 text-amber-500" />
                หัวหน้า (Manager)
                {role !== "admin" && <span className="text-destructive">*</span>}
              </Label>
              {(() => {
                const selected = managerId ? employees.find((e) => e.id === managerId) : null;
                const candidates = employees.filter(
                  (m) =>
                    m.isActive &&
                    m.id !== editingEmployee?.id &&
                    (m.role === "manager" || m.role === "admin" || m.role === "hr"),
                );
                const reportCount = (mgrId: string) =>
                  employees.filter((e) => e.managerId === mgrId && e.isActive).length;

                return (
                  <Popover open={managerPopoverOpen} onOpenChange={setManagerPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={managerPopoverOpen}
                        className="w-full justify-between h-auto min-h-10 py-2 px-3 font-normal"
                      >
                        {selected ? (
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <Avatar className="h-7 w-7 border-2 border-amber-100 shrink-0">
                              <AvatarImage src={selected.avatarUrl || undefined} />
                              <AvatarFallback className="text-xs bg-gradient-to-br from-amber-100 to-orange-100 text-amber-700">
                                {selected.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col items-start min-w-0 text-left">
                              <span className="text-sm font-medium truncate w-full">
                                {selected.name}
                              </span>
                              <span className="text-[10px] text-muted-foreground truncate w-full">
                                <span className={cn("inline-block px-1 rounded mr-1", roleColorClass(selected.role))}>
                                  {selected.role}
                                </span>
                                {selected.department && <>· {selected.department}</>}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            ยังไม่ได้กำหนดหัวหน้า — คลิกเพื่อเลือก
                          </span>
                        )}
                        <div className="flex items-center gap-1 shrink-0">
                          {selected && role === "admin" && (
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(e) => {
                                e.stopPropagation();
                                setManagerId("");
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setManagerId("");
                                }
                              }}
                              className="inline-flex h-6 w-6 items-center justify-center rounded-md hover:bg-muted cursor-pointer"
                              title="Clear"
                            >
                              <X className="h-3.5 w-3.5 text-muted-foreground" />
                            </span>
                          )}
                          <ChevronsUpDown className="h-4 w-4 opacity-50" />
                        </div>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="ค้นหา ชื่อ / รหัส / แผนก…" className="h-9" />
                        <CommandList>
                          <CommandEmpty>ไม่พบพนักงานที่ตรง</CommandEmpty>
                          <CommandGroup heading="ผู้มีสิทธิ์เป็นหัวหน้า">
                            {role === "admin" && (
                              <CommandItem
                                value="__none__"
                                onSelect={() => {
                                  setManagerId("");
                                  setManagerPopoverOpen(false);
                                }}
                                className="gap-2"
                              >
                                <div className="h-7 w-7 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center shrink-0">
                                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                                </div>
                                <span className="flex-1">ไม่มีหัวหน้า (admin เท่านั้น)</span>
                                {!managerId && <Check className="h-4 w-4 text-primary" />}
                              </CommandItem>
                            )}
                            {candidates.map((m) => {
                              const n = reportCount(m.id);
                              const isSelected = managerId === m.id;
                              return (
                                <CommandItem
                                  key={m.id}
                                  value={`${m.name} ${m.employeeCode} ${m.department ?? ""}`}
                                  onSelect={() => {
                                    setManagerId(m.id);
                                    setManagerPopoverOpen(false);
                                  }}
                                  className="gap-2.5 py-2"
                                >
                                  <Avatar className="h-8 w-8 shrink-0">
                                    <AvatarImage src={m.avatarUrl || undefined} />
                                    <AvatarFallback className="text-xs bg-gradient-to-br from-amber-100 to-orange-100 text-amber-700">
                                      {m.name.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-sm font-medium truncate">{m.name}</span>
                                      <Badge variant="outline" className={cn("text-[9px] px-1 py-0 h-4", roleColorClass(m.role))}>
                                        {m.role}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                      <span>{m.employeeCode}</span>
                                      {m.department && <><span>·</span><span className="truncate">{m.department}</span></>}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {n > 0 && (
                                      <Badge variant="secondary" className="h-5 text-[10px] gap-1">
                                        <UserPlus className="h-2.5 w-2.5" />
                                        {n}
                                      </Badge>
                                    )}
                                    {isSelected && <Check className="h-4 w-4 text-primary" />}
                                  </div>
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                );
              })()}
              <p className="text-xs text-muted-foreground">
                พนักงานคนนี้จะเป็น direct report ของ manager ที่เลือก
                {managerId &&
                  ` · หัวหน้ามีลูกน้องอยู่แล้ว ${employees.filter((e) => e.managerId === managerId && e.isActive && e.id !== editingEmployee?.id).length} คน`}
              </p>
            </div>

            <details className="group rounded-lg border bg-muted/10">
              <summary className="flex cursor-pointer items-center justify-between gap-2 px-3 py-2.5 text-sm font-medium hover:bg-muted/30 rounded-lg [&::-webkit-details-marker]:hidden">
                <span className="flex items-center gap-2">
                  <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-open:rotate-180" />
                  ข้อมูลประกอบ (ไม่บังคับ)
                </span>
                <span className="text-[10px] text-muted-foreground font-normal">
                  Permission Group · ตำแหน่ง · แผนก
                </span>
              </summary>
              <div className="space-y-4 border-t p-3">
                <div className="space-y-2">
                  <Label>
                    ชุดสิทธิ์เฉพาะ (Permission Group)
                  </Label>
                  <Select value={roleId || "none"} onValueChange={(v) => setRoleId(v === "none" ? "" : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="ไม่กำหนด" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">ไม่กำหนด</SelectItem>
                      {roles.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: r.color }} />
                            {r.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">
                    เพิ่มสิทธิ์ย่อยเฉพาะเจาะจง เช่น view_reports, manage_users (นอกเหนือจาก Access Level ด้านบน)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>ตำแหน่งงาน (สำหรับแสดงผล)</Label>
                  <Select value={positionId || "none"} onValueChange={(v) => setPositionId(v === "none" ? "" : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="ไม่ระบุ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">ไม่ระบุ</SelectItem>
                      {positions.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                          {p.department && (
                            <span className="text-xs text-muted-foreground ml-2">({p.department})</span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">
                    เช่น Senior Developer, Team Lead — ใช้แสดงผลเท่านั้น ไม่มีผลต่อสิทธิ์
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emp-dept">แผนก (Department)</Label>
                  <Input
                    id="emp-dept"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="เช่น Engineering, Design, Sales"
                  />
                </div>
              </div>
            </details>

            {editingEmployee && (
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium text-sm">Active Status</p>
                  <p className="text-xs text-muted-foreground">Enable or disable this employee</p>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            )}
          </div>

          <DialogFooter className="p-6 pt-3 shrink-0 border-t bg-background">
            <Button variant="outline" onClick={() => { setShowDialog(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!isCreateFormValid || isSaving}>
              {isSaving ? "Saving..." : editingEmployee ? "Save Changes" : "Add Employee"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Confirmation */}
      <AlertDialog open={!!deactivateEmployeeId} onOpenChange={(open) => { if (!open) setDeactivateEmployeeId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Employee?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate {deactivatingEmployee?.name}. They will no longer be able to log in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeactivate}
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
