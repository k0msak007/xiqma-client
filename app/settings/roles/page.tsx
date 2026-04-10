"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Shield,
  Users,
  Target,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTaskStore } from "@/lib/store";
import type { Role, RolePermission, PointRatio, PointTarget, PointTargetPeriod } from "@/lib/types";
import { defaultPointRatios, calculatePointSplit } from "@/lib/types";

const allPermissions: { value: RolePermission; label: string; description: string }[] = [
  { value: "view_tasks", label: "View Tasks", description: "Can view tasks and task details" },
  { value: "create_tasks", label: "Create Tasks", description: "Can create new tasks" },
  { value: "edit_tasks", label: "Edit Tasks", description: "Can edit existing tasks" },
  { value: "delete_tasks", label: "Delete Tasks", description: "Can delete tasks" },
  { value: "assign_tasks", label: "Assign Tasks", description: "Can assign tasks to users" },
  { value: "manage_users", label: "Manage Users", description: "Can add and remove users" },
  { value: "manage_roles", label: "Manage Roles", description: "Can create and edit roles" },
  { value: "manage_workspace", label: "Manage Workspace", description: "Can edit workspace settings" },
  { value: "view_analytics", label: "View Analytics", description: "Can access analytics dashboard" },
  { value: "admin", label: "Full Admin", description: "Full administrative access" },
];

const colorOptions = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", 
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1"
];

export default function RolesPage() {
  const { roles, users, addRole, updateRole, deleteRole } = useTaskStore();
  const [showDialog, setShowDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [pointRatioType, setPointRatioType] = useState<string>("80/20");
  const [customPointedPercent, setCustomPointedPercent] = useState(80);
  
  // Point Target state
  const [hasPointTarget, setHasPointTarget] = useState(false);
  const [targetPoints, setTargetPoints] = useState(40);
  const [targetPeriod, setTargetPeriod] = useState<PointTargetPeriod>("week");

  const resetForm = () => {
    setName("");
    setDescription("");
    setColor("#3b82f6");
    setPermissions([]);
    setPointRatioType("80/20");
    setCustomPointedPercent(80);
    setHasPointTarget(false);
    setTargetPoints(40);
    setTargetPeriod("week");
    setEditingRole(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setShowDialog(true);
  };

  const openEditDialog = (role: Role) => {
    setEditingRole(role);
    setName(role.name);
    setDescription(role.description || "");
    setColor(role.color);
    setPermissions(role.permissions);
    
    // Determine point ratio type
    const ratioKey = Object.entries(defaultPointRatios).find(
      ([, ratio]) => ratio.pointedWorkPercent === role.pointRatio.pointedWorkPercent
    )?.[0];
    
    if (ratioKey) {
      setPointRatioType(ratioKey);
    } else {
      setPointRatioType("custom");
      setCustomPointedPercent(role.pointRatio.pointedWorkPercent);
    }
    
    // Point target
    if (role.pointTarget) {
      setHasPointTarget(true);
      setTargetPoints(role.pointTarget.totalPoints);
      setTargetPeriod(role.pointTarget.period);
    } else {
      setHasPointTarget(false);
      setTargetPoints(40);
      setTargetPeriod("week");
    }
    
    setShowDialog(true);
  };

  const getPointRatio = (): PointRatio => {
    if (pointRatioType === "custom") {
      return {
        pointedWorkPercent: customPointedPercent,
        nonPointedWorkPercent: 100 - customPointedPercent,
      };
    }
    return defaultPointRatios[pointRatioType] || defaultPointRatios["80/20"];
  };

  const handleSubmit = () => {
    if (!name.trim()) return;

    const pointTarget: PointTarget | undefined = hasPointTarget
      ? { totalPoints: targetPoints, period: targetPeriod }
      : undefined;

    const roleData = {
      name: name.trim(),
      description: description.trim() || undefined,
      color,
      permissions,
      pointRatio: getPointRatio(),
      pointTarget,
    };

    if (editingRole) {
      updateRole(editingRole.id, roleData);
    } else {
      const newRole: Role = {
        id: `role-${Date.now()}`,
        ...roleData,
        createdAt: new Date(),
      };
      addRole(newRole);
    }

    setShowDialog(false);
    resetForm();
  };

  const togglePermission = (permission: RolePermission) => {
    if (permissions.includes(permission)) {
      setPermissions(permissions.filter((p) => p !== permission));
    } else {
      setPermissions([...permissions, permission]);
    }
  };

  const getUsersWithRole = (roleId: string) => {
    return users.filter((u) => u.roleId === roleId);
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
          <h1 className="text-2xl font-bold tracking-tight">Role Management</h1>
          <p className="text-muted-foreground">
            Create and manage roles with permissions and point ratios.
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Create Role
        </Button>
      </div>

      {/* Roles Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => {
          const roleUsers = getUsersWithRole(role.id);
          
          return (
            <Card key={role.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${role.color}20` }}
                    >
                      <Shield className="h-5 w-5" style={{ color: role.color }} />
                    </div>
                    <div>
                      <CardTitle className="text-base">{role.name}</CardTitle>
                      {role.description && (
                        <CardDescription className="text-xs mt-0.5">
                          {role.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEditDialog(role)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Role?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will delete the role &quot;{role.name}&quot;. Users with this role will need to be reassigned.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => deleteRole(role.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Point Target */}
                {role.pointTarget && (
                  <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1.5">
                        <Target className="h-3.5 w-3.5 text-primary" />
                        <span className="font-medium">Point Target</span>
                      </div>
                      <Badge variant="default">
                        {role.pointTarget.totalPoints} pts/{role.pointTarget.period}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {(() => {
                        const split = calculatePointSplit(role.pointTarget.totalPoints, role.pointRatio);
                        return `Pointed: ${split.pointedPoints} | Non-Pointed: ${split.nonPointedPoints}`;
                      })()}
                    </div>
                  </div>
                )}

                {/* Point Ratio */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Point Ratio</span>
                  <Badge variant="secondary">
                    {role.pointRatio.pointedWorkPercent}/{role.pointRatio.nonPointedWorkPercent}
                  </Badge>
                </div>

                {/* Users Count */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Users</span>
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{roleUsers.length}</span>
                  </div>
                </div>

                <Separator />

                {/* Permissions Preview */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Permissions</p>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.includes("admin") ? (
                      <Badge variant="default" className="text-xs">Full Admin</Badge>
                    ) : (
                      role.permissions.slice(0, 3).map((perm) => (
                        <Badge key={perm} variant="outline" className="text-xs">
                          {allPermissions.find((p) => p.value === perm)?.label}
                        </Badge>
                      ))
                    )}
                    {!role.permissions.includes("admin") && role.permissions.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{role.permissions.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Create/Edit Role Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRole ? "Edit Role" : "Create Role"}</DialogTitle>
            <DialogDescription>
              {editingRole
                ? "Update the role details, permissions, and point ratio."
                : "Create a new role with specific permissions and point calculation settings."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="role-name">
                  Role Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="role-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Developer"
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2">
                  {colorOptions.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`h-8 w-8 rounded-full transition-all ${
                        color === c ? "ring-2 ring-offset-2 ring-primary" : ""
                      }`}
                      style={{ backgroundColor: c }}
                      onClick={() => setColor(c)}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role-desc">Description</Label>
              <Textarea
                id="role-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this role..."
                rows={2}
              />
            </div>

            <Separator />

            {/* Point Ratio */}
            <div className="space-y-4">
              <div>
                <Label className="text-base">Point Ratio</Label>
                <p className="text-sm text-muted-foreground">
                  Define how points are calculated for this role. The first number is the percentage of work that earns points.
                </p>
              </div>

              <Select value={pointRatioType} onValueChange={setPointRatioType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="80/20">80/20 (Standard)</SelectItem>
                  <SelectItem value="70/30">70/30</SelectItem>
                  <SelectItem value="60/40">60/40 (Management)</SelectItem>
                  <SelectItem value="90/10">90/10 (Technical)</SelectItem>
                  <SelectItem value="100/0">100/0 (Full Points)</SelectItem>
                  <SelectItem value="custom">Custom Ratio</SelectItem>
                </SelectContent>
              </Select>

              {pointRatioType === "custom" && (
                <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Pointed Work</span>
                    <span className="text-sm font-medium">{customPointedPercent}%</span>
                  </div>
                  <Slider
                    value={[customPointedPercent]}
                    onValueChange={([value]) => setCustomPointedPercent(value)}
                    min={0}
                    max={100}
                    step={5}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Non-Pointed: {100 - customPointedPercent}%</span>
                    <span>Pointed: {customPointedPercent}%</span>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Point Target */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Point Target</Label>
                  <p className="text-sm text-muted-foreground">
                    Set a target for how many points this role should assign per time period.
                  </p>
                </div>
                <Checkbox
                  checked={hasPointTarget}
                  onCheckedChange={(checked) => setHasPointTarget(checked === true)}
                />
              </div>

              {hasPointTarget && (
                <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Total Points</Label>
                      <Input
                        type="number"
                        value={targetPoints}
                        onChange={(e) => setTargetPoints(parseInt(e.target.value) || 0)}
                        min={1}
                        max={999}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Period</Label>
                      <Select value={targetPeriod} onValueChange={(v) => setTargetPeriod(v as PointTargetPeriod)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="day">Per Day</SelectItem>
                          <SelectItem value="week">Per Week</SelectItem>
                          <SelectItem value="month">Per Month</SelectItem>
                          <SelectItem value="year">Per Year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Calculated Split Preview */}
                  <div className="pt-3 border-t">
                    <p className="text-sm font-medium mb-2">Calculated Split (based on ratio {getPointRatio().pointedWorkPercent}/{getPointRatio().nonPointedWorkPercent})</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-background rounded-lg border">
                        <p className="text-xs text-muted-foreground">Pointed Work</p>
                        <p className="text-lg font-bold text-primary">
                          {calculatePointSplit(targetPoints, getPointRatio()).pointedPoints} pts
                        </p>
                      </div>
                      <div className="p-3 bg-background rounded-lg border">
                        <p className="text-xs text-muted-foreground">Non-Pointed Work</p>
                        <p className="text-lg font-bold text-muted-foreground">
                          {calculatePointSplit(targetPoints, getPointRatio()).nonPointedPoints} pts
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Permissions */}
            <div className="space-y-4">
              <div>
                <Label className="text-base">Permissions</Label>
                <p className="text-sm text-muted-foreground">
                  Select the permissions for this role.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {allPermissions.map((perm) => (
                  <div
                    key={perm.value}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      permissions.includes(perm.value)
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => togglePermission(perm.value)}
                  >
                    <Checkbox
                      checked={permissions.includes(perm.value)}
                      onCheckedChange={() => togglePermission(perm.value)}
                    />
                    <div>
                      <p className="text-sm font-medium">{perm.label}</p>
                      <p className="text-xs text-muted-foreground">{perm.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!name.trim()}>
              {editingRole ? "Save Changes" : "Create Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
