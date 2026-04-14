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
} from "lucide-react";
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

  // Create form state
  const [employeeCode, setEmployeeCode] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"employee" | "manager" | "hr" | "admin">("employee");
  const [roleId, setRoleId] = useState("");
  const [positionId, setPositionId] = useState("");
  const [department, setDepartment] = useState("");
  const [isActive, setIsActive] = useState(true);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [empRes, rolesData, positionsData] = await Promise.all([
        employeesApi.list({ limit: 100 }),
        rolesApi.list(),
        positionsApi.list(),
      ]);
      setEmployees(empRes.rows);
      setTotalEmployees(empRes.total);
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
    setIsActive(true);
    setEditingEmployee(null);
  };

  const openCreateDialog = () => {
    resetForm();
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
    setIsActive(emp.isActive);
    setShowDialog(true);
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setIsSaving(true);

    try {
      if (editingEmployee) {
        const payload: UpdateEmployeePayload = {
          name: name.trim(),
          email: email.trim() || undefined,
          roleId: roleId || undefined,
          positionId: positionId || undefined,
          department: department.trim() || undefined,
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

  const deactivatingEmployee = employees.find((e) => e.id === deactivateEmployeeId);
  const activeCount = employees.filter((e) => e.isActive).length;
  const adminCount = employees.filter((e) => e.role === "admin").length;

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
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingEmployee ? "Edit Employee" : "Add Employee"}</DialogTitle>
            <DialogDescription>
              {editingEmployee
                ? "Update employee details and assignments."
                : "Add a new employee to the system."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
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

            <div className="space-y-2">
              <Label>System Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="hr">HR</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Assign Role</Label>
              <Select value={roleId || "none"} onValueChange={(v) => setRoleId(v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Role</SelectItem>
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
            </div>

            <div className="space-y-2">
              <Label>Position</Label>
              <Select value={positionId || "none"} onValueChange={(v) => setPositionId(v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Position</SelectItem>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="emp-dept">Department</Label>
              <Input
                id="emp-dept"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g., Engineering"
              />
            </div>

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

          <DialogFooter>
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
