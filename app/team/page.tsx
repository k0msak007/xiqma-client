"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  MoreHorizontal,
  Mail,
  Shield,
  UserX,
  Building2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { employeesApi, type Employee } from "@/lib/api/employees";
import { attendanceApi, leaveApi, type LeaveRequest } from "@/lib/api/leave";
import { useAuthStore } from "@/lib/auth-store";
import { format } from "date-fns";
import { toast } from "sonner";

const roleColors: Record<string, string> = {
  admin:    "bg-red-500/10 text-red-500",
  manager:  "bg-orange-500/10 text-orange-500",
  hr:       "bg-purple-500/10 text-purple-500",
  employee: "bg-blue-500/10 text-blue-500",
};

export default function TeamPage() {
  const user = useAuthStore((s) => s.user);
  const [employees, setEmployees]       = useState<Employee[]>([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [searchQuery, setSearchQuery]   = useState("");
  const [inviteOpen, setInviteOpen]     = useState(false);
  const [deactivateId, setDeactivateId] = useState<string | null>(null);
  const [teamAttendance, setTeamAttendance] = useState<Record<string, { checkIn: string | null; checkOut: string | null; status: string | null }>>({});
  
  // Leave requests
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([]);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

  // invite form
  const [inviteName,  setInviteName]  = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteCode,  setInviteCode]  = useState("");
  const [inviteRole,  setInviteRole]  = useState<"employee" | "manager" | "hr" | "admin">("employee");
  const [invitePass,  setInvitePass]  = useState("");
  const [isSaving,    setIsSaving]    = useState(false);

  const canManageLeaves = user?.role === "admin" || user?.role === "manager" || user?.role === "hr";

  const load = async () => {
    try {
      setIsLoading(true);
      const promises = [
        employeesApi.listAll(),
        attendanceApi.getTeamAttendance().catch(() => []),
      ];
      
      // Add pending leaves fetch if user can manage
      if (canManageLeaves) {
        promises.push(leaveApi.list({ status: "pending" }).catch(() => []));
      }
      
      const results = await Promise.all(promises);
      setEmployees(results[0] as Employee[]);
      
      // Map attendance by employee id
      const attRes = results[1] as any[];
      const attMap: Record<string, { checkIn: string | null; checkOut: string | null; status: string | null }> = {};
      for (const emp of attRes) {
        attMap[emp.id] = {
          checkIn: emp.checkIn,
          checkOut: emp.checkOut,
          status: emp.status,
        };
      }
      setTeamAttendance(attMap);
      
      // Set pending leaves
      if (canManageLeaves && results[2]) {
        setPendingLeaves(results[2] as LeaveRequest[]);
      }
    } catch {
      toast.error("โหลดข้อมูลพนักงานไม่สำเร็จ");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!searchQuery) return employees;
    const q = searchQuery.toLowerCase();
    return employees.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        (e.email ?? "").toLowerCase().includes(q) ||
        (e.department ?? "").toLowerCase().includes(q)
    );
  }, [employees, searchQuery]);

  const handleInvite = async () => {
    if (!inviteName.trim() || !inviteCode.trim() || !invitePass.trim()) {
      toast.error("กรุณากรอกข้อมูลให้ครบ (ชื่อ, รหัสพนักงาน, รหัสผ่าน)");
      return;
    }
    setIsSaving(true);
    try {
      await employeesApi.create({
        name: inviteName.trim(),
        email: inviteEmail.trim() || undefined,
        employeeCode: inviteCode.trim(),
        password: invitePass,
        role: inviteRole,
      });
      toast.success("เพิ่มพนักงานสำเร็จ");
      setInviteOpen(false);
      setInviteName(""); setInviteEmail(""); setInviteCode(""); setInvitePass("");
      await load();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "เพิ่มพนักงานไม่สำเร็จ";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateId) return;
    try {
      await employeesApi.deactivate(deactivateId);
      toast.success("ปิดการใช้งานพนักงานสำเร็จ");
      setDeactivateId(null);
      await load();
    } catch {
      toast.error("ดำเนินการไม่สำเร็จ");
    }
  };

  const handleApproveLeave = async (id: string) => {
    try {
      await leaveApi.approve(id);
      toast.success("อนุมัติการลาสำเร็จ");
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "อนุมัติไม่สำเร็จ");
    }
  };

  const handleRejectLeave = async (id: string) => {
    try {
      await leaveApi.reject(id, { rejectReason: "ปฏิเสธโดยผู้จัดการ" });
      toast.success("ปฏิเสธการลาสำเร็จ");
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "ปฏิเสธไม่สำเร็จ");
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team</h1>
          <p className="text-muted-foreground">
            Manage your team members and their permissions.
          </p>
        </div>

        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Team Member</DialogTitle>
              <DialogDescription>Create a new employee account.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 py-4">
              <div className="grid gap-1.5">
                <Label>Full Name *</Label>
                <Input value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="สมชาย ใจดี" />
              </div>
              <div className="grid gap-1.5">
                <Label>Employee Code *</Label>
                <Input value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} placeholder="EMP001" />
              </div>
              <div className="grid gap-1.5">
                <Label>Email</Label>
                <Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="somchai@company.com" />
              </div>
              <div className="grid gap-1.5">
                <Label>Role</Label>
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as typeof inviteRole)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="hr">HR</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Password *</Label>
                <div className="flex gap-2">
                  <Input 
                    type={invitePass ? "text" : "password"} 
                    value={invitePass} 
                    onChange={(e) => setInvitePass(e.target.value)} 
                    placeholder="อย่างน้อย 8 ตัวอักษร" 
                    className="flex-1" 
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => {
                    const random = Math.random().toString(36).slice(-8);
                    setInvitePass(random);
                  }}>
                    Random
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
              <Button onClick={handleInvite} disabled={isSaving}>
                {isSaving ? "Saving…" : "Add Member"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Pending Leave Requests Button */}
        {canManageLeaves && pendingLeaves.length > 0 && (
          <Button variant="outline" onClick={() => setShowLeaveDialog(true)} className="gap-2">
            <span>คำขอลารออนุมัติ</span>
            <Badge variant="destructive" className="rounded-full">{pendingLeaves.length}</Badge>
          </Button>
        )}
      </div>

      {/* Search + Stats */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search team members…"
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{employees.filter((e) => e.isActive).length} active</span>
          <span>|</span>
          <span>{employees.filter((e) => e.role === "admin").length} admins</span>
        </div>
      </div>

      {/* Team Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse"><CardContent className="h-40" /></Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((emp) => (
            <Card key={emp.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={emp.avatarUrl ?? undefined} />
                      <AvatarFallback>{emp.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">{emp.name}</CardTitle>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {emp.email ?? "—"}
                      </div>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Profile</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {emp.isActive && (
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeactivateId(emp.id)}
                        >
                          Deactivate
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className={roleColors[emp.role] ?? roleColors.employee}>
                    <Shield className="mr-1 h-3 w-3" />
                    {emp.role.charAt(0).toUpperCase() + emp.role.slice(1)}
                  </Badge>
                  {!emp.isActive && (
                    <Badge variant="outline" className="text-muted-foreground">
                      <UserX className="mr-1 h-3 w-3" />
                      Inactive
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(emp.createdAt), "MMM yyyy")}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="space-y-2">
                {emp.positionName && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5" />
                    <span>{emp.positionName}</span>
                  </div>
                )}
                {/* Attendance Status */}
                {teamAttendance[emp.id] && (
                  <div className="flex items-center gap-2 text-sm">
                    {teamAttendance[emp.id].checkIn ? (
                      <>
                        <Badge variant="outline" className={teamAttendance[emp.id].status === "present" ? "bg-green-500/10 text-green-500" : "bg-orange-500/10 text-orange-500"}>
                          {teamAttendance[emp.id].status === "present" ? "มาแล้ว" : "สาย"}
                        </Badge>
                        <span className="text-muted-foreground text-xs">
                          {teamAttendance[emp.id].checkIn && format(new Date(teamAttendance[emp.id].checkIn!), "HH:mm")}
                          {teamAttendance[emp.id].checkOut && ` - ${format(new Date(teamAttendance[emp.id].checkOut!), "HH:mm")}`}
                        </span>
                      </>
                    ) : (
                      <Badge variant="outline" className="bg-gray-500/10 text-gray-500">
                        ยังไม่เช็คอิน
                      </Badge>
                    )}
                  </div>
                )}
                {emp.department && (
                  <div className="text-sm text-muted-foreground">
                    Dept: <span className="font-medium text-foreground">{emp.department}</span>
                  </div>
                )}
                {emp.roleName && (
                  <div className="text-sm text-muted-foreground">
                    Role: <span className="font-medium text-foreground">{emp.roleName}</span>
                  </div>
                )}
                <div className="text-xs text-muted-foreground font-mono">{emp.employeeCode}</div>
              </CardContent>
            </Card>
          ))}

          {filtered.length === 0 && !isLoading && (
            <div className="col-span-3 flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">No team members found</p>
            </div>
          )}
        </div>
      )}

      {/* Pending Leave Requests Dialog */}
      <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>คำขอลารออนุมัติ</DialogTitle>
            <DialogDescription>
              {pendingLeaves.length} รายการรอการอนุมัติ
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto space-y-3">
            {pendingLeaves.map((leave) => (
              <Card key={leave.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">{leave.employeeName}</p>
                    <p className="text-sm text-muted-foreground">
                      {leave.leaveType === "annual" ? "ลาพักร้อน" : 
                       leave.leaveType === "sick" ? "ลาป่วย" : 
                       leave.leaveType === "personal" ? "ลากิจ" : leave.leaveType}
                    </p>
                    <p className="text-sm">
                      {format(new Date(leave.startDate), "d MMM")} - {format(new Date(leave.endDate), "d MMM yyyy")}
                    </p>
                    <p className="text-xs text-muted-foreground">{leave.totalDays} วัน</p>
                    {leave.reason && (
                      <p className="text-xs text-muted-foreground mt-1">เหตุผล: {leave.reason}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleRejectLeave(leave.id)}>
                      ปฏิเสธ
                    </Button>
                    <Button size="sm" onClick={() => handleApproveLeave(leave.id)}>
                      อนุมัติ
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Deactivate Confirm */}
      <AlertDialog open={!!deactivateId} onOpenChange={(o) => { if (!o) setDeactivateId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate this employee?</AlertDialogTitle>
            <AlertDialogDescription>
              พนักงานจะไม่สามารถ login ได้ แต่ข้อมูลยังคงอยู่ในระบบ
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeactivate} className="bg-destructive text-destructive-foreground">
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
