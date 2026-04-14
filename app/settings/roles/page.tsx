"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Pencil, Trash2, Shield } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
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
import { rolesApi, type Role, type CreateRolePayload } from "@/lib/api/roles";

const allPermissions: { value: string; label: string; description: string }[] = [
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
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1",
];

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteRoleId, setDeleteRoleId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [permissions, setPermissions] = useState<string[]>([]);

  const loadRoles = async () => {
    try {
      setIsLoading(true);
      const data = await rolesApi.list();
      setRoles(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load roles");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const resetForm = () => {
    setName("");
    setDescription("");
    setColor("#3b82f6");
    setPermissions([]);
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
    setShowDialog(true);
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setIsSaving(true);

    const payload: CreateRolePayload = {
      name: name.trim(),
      description: description.trim() || undefined,
      color,
      permissions,
    };

    try {
      if (editingRole) {
        await rolesApi.update(editingRole.id, payload);
        toast.success("Role updated successfully");
      } else {
        await rolesApi.create(payload);
        toast.success("Role created successfully");
      }
      setShowDialog(false);
      resetForm();
      await loadRoles();
    } catch (err) {
      console.error(err);
      toast.error(editingRole ? "Failed to update role" : "Failed to create role");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteRoleId) return;
    try {
      await rolesApi.delete(deleteRoleId);
      toast.success("Role deleted");
      setDeleteRoleId(null);
      await loadRoles();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete role");
    }
  };

  const togglePermission = (permission: string) => {
    if (permissions.includes(permission)) {
      setPermissions(permissions.filter((p) => p !== permission));
    } else {
      setPermissions([...permissions, permission]);
    }
  };

  const getPermissionLabel = (value: string) => {
    return allPermissions.find((p) => p.value === value)?.label ?? value;
  };

  const deletingRole = roles.find((r) => r.id === deleteRoleId);

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
            Create and manage roles with permissions.
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Create Role
        </Button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading roles...</p>
        </div>
      )}

      {/* Roles Grid */}
      {!isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => (
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
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteRoleId(role.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Separator />
                {/* Permissions Preview */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Permissions</p>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.includes("admin") ? (
                      <Badge variant="default" className="text-xs">Full Admin</Badge>
                    ) : role.permissions.length === 0 ? (
                      <span className="text-xs text-muted-foreground">No permissions</span>
                    ) : (
                      <>
                        {role.permissions.slice(0, 3).map((perm) => (
                          <Badge key={perm} variant="outline" className="text-xs">
                            {getPermissionLabel(perm)}
                          </Badge>
                        ))}
                        {role.permissions.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{role.permissions.length - 3} more
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {roles.length === 0 && (
            <div className="col-span-full py-12 text-center">
              <Shield className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No roles yet. Create your first role.</p>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Role Dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => { if (!open) { setShowDialog(false); resetForm(); } else { setShowDialog(true); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRole ? "Edit Role" : "Create Role"}</DialogTitle>
            <DialogDescription>
              {editingRole
                ? "Update the role details and permissions."
                : "Create a new role with specific permissions."}
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
                <div className="flex gap-2 flex-wrap">
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
            <Button variant="outline" onClick={() => { setShowDialog(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!name.trim() || isSaving}>
              {isSaving ? "Saving..." : editingRole ? "Save Changes" : "Create Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteRoleId} onOpenChange={(open) => { if (!open) setDeleteRoleId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the role &quot;{deletingRole?.name}&quot;. Users with this role will need to be reassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
