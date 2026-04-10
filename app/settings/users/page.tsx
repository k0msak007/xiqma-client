"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  UserPlus,
  Settings2,
  Shield,
  Building2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTaskStore } from "@/lib/store";
import type { User, PointRatio } from "@/lib/types";
import { defaultPointRatios } from "@/lib/types";
import { format } from "date-fns";

export default function UsersPage() {
  const { users, roles, positions, tasks, addUser, updateUser, deleteUser, setUserPointRatio } = useTaskStore();
  const [showDialog, setShowDialog] = useState(false);
  const [showPointRatioDialog, setShowPointRatioDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUserForRatio, setSelectedUserForRatio] = useState<User | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState<string>("");
  const [selectedPositionIds, setSelectedPositionIds] = useState<string[]>([]);
  const [legacyRole, setLegacyRole] = useState<"admin" | "member" | "viewer">("member");

  // Point ratio form state
  const [useCustomRatio, setUseCustomRatio] = useState(false);
  const [pointRatioType, setPointRatioType] = useState<string>("80/20");
  const [customPointedPercent, setCustomPointedPercent] = useState(80);

  const resetForm = () => {
    setName("");
    setEmail("");
    setRoleId("");
    setSelectedPositionIds([]);
    setLegacyRole("member");
    setEditingUser(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setShowDialog(true);
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setRoleId(user.roleId || "");
    setSelectedPositionIds(user.positionIds || []);
    setLegacyRole(user.role);
    setShowDialog(true);
  };

  const openPointRatioDialog = (user: User) => {
    setSelectedUserForRatio(user);
    setUseCustomRatio(!!user.customPointRatio);
    
    if (user.customPointRatio) {
      const ratioKey = Object.entries(defaultPointRatios).find(
        ([, ratio]) => ratio.pointedWorkPercent === user.customPointRatio?.pointedWorkPercent
      )?.[0];
      
      if (ratioKey) {
        setPointRatioType(ratioKey);
      } else {
        setPointRatioType("custom");
        setCustomPointedPercent(user.customPointRatio.pointedWorkPercent);
      }
    } else {
      setPointRatioType("80/20");
      setCustomPointedPercent(80);
    }
    
    setShowPointRatioDialog(true);
  };

  const handleSubmit = () => {
    if (!name.trim() || !email.trim()) return;

    const userData: Partial<User> = {
      name: name.trim(),
      email: email.trim(),
      role: legacyRole,
      roleId: roleId || undefined,
      positionIds: selectedPositionIds.length > 0 ? selectedPositionIds : undefined,
    };

    if (editingUser) {
      updateUser(editingUser.id, userData);
    } else {
      const newUser: User = {
        id: `user-${Date.now()}`,
        name: name.trim(),
        email: email.trim(),
        role: legacyRole,
        roleId: roleId || undefined,
        positionIds: selectedPositionIds.length > 0 ? selectedPositionIds : undefined,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name.trim().replace(/\s/g, "")}`,
        createdAt: new Date(),
      };
      addUser(newUser);
    }

    setShowDialog(false);
    resetForm();
  };

  const handleSavePointRatio = () => {
    if (!selectedUserForRatio) return;

    if (!useCustomRatio) {
      setUserPointRatio(selectedUserForRatio.id, undefined);
    } else {
      let ratio: PointRatio;
      if (pointRatioType === "custom") {
        ratio = {
          pointedWorkPercent: customPointedPercent,
          nonPointedWorkPercent: 100 - customPointedPercent,
        };
      } else {
        ratio = defaultPointRatios[pointRatioType] || defaultPointRatios["80/20"];
      }
      setUserPointRatio(selectedUserForRatio.id, ratio);
    }

    setShowPointRatioDialog(false);
    setSelectedUserForRatio(null);
  };

  const getRoleForUser = (user: User) => {
    if (user.roleId) {
      return roles.find((r) => r.id === user.roleId);
    }
    return null;
  };

  const getPositionsForUser = (user: User) => {
    if (user.positionIds && user.positionIds.length > 0) {
      return user.positionIds
        .map((id) => positions.find((p) => p.id === id))
        .filter(Boolean) as typeof positions;
    }
    return [];
  };

  const getEffectivePointRatio = (user: User) => {
    if (user.customPointRatio) {
      return user.customPointRatio;
    }
    const role = getRoleForUser(user);
    if (role) {
      return role.pointRatio;
    }
    return { pointedWorkPercent: 80, nonPointedWorkPercent: 20 };
  };

  const getTaskCountForUser = (userId: string) => {
    return tasks.filter((t) => t.assigneeIds.includes(userId)).length;
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
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Create users, assign roles, and configure individual point ratios.
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-sm text-muted-foreground">Total Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{users.filter((u) => u.role === "admin").length}</div>
            <p className="text-sm text-muted-foreground">Admins</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{users.filter((u) => u.customPointRatio).length}</div>
            <p className="text-sm text-muted-foreground">Custom Ratios</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{roles.length}</div>
            <p className="text-sm text-muted-foreground">Roles</p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            Manage user accounts, roles, and point ratio settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Point Ratio</TableHead>
                <TableHead>Tasks</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const role = getRoleForUser(user);
                const userPositions = getPositionsForUser(user);
                const pointRatio = getEffectivePointRatio(user);
                const taskCount = getTaskCountForUser(user.id);

                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {userPositions.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {userPositions.map((position) => (
                            <Badge 
                              key={position.id}
                              variant="secondary" 
                              className="text-xs"
                              style={{ 
                                backgroundColor: `${position.color}20`,
                                color: position.color,
                              }}
                            >
                              {position.name}
                              {position.jobLevel && (
                                <span className="ml-1 opacity-70">({position.jobLevel})</span>
                              )}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {role ? (
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: role.color }}
                          />
                          <span>{role.name}</span>
                        </div>
                      ) : (
                        <Badge variant="secondary">{user.role}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={user.customPointRatio ? "default" : "outline"}>
                          {pointRatio.pointedWorkPercent}/{pointRatio.nonPointedWorkPercent}
                        </Badge>
                        {user.customPointRatio && (
                          <span className="text-xs text-muted-foreground">(Custom)</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{taskCount}</TableCell>
                    <TableCell>
                      {format(new Date(user.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openPointRatioDialog(user)}
                          title="Configure Point Ratio"
                        >
                          <Settings2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(user)}
                          title="Edit User"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              title="Delete User"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete User?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will remove {user.name} from the workspace. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => deleteUser(user.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit User Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUser ? "Edit User" : "Add User"}</DialogTitle>
            <DialogDescription>
              {editingUser
                ? "Update user details and role assignment."
                : "Add a new user to the workspace."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="user-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="user-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="user-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@company.com"
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Positions (can select multiple)</Label>
              <div className="border rounded-md p-3 space-y-2 max-h-[200px] overflow-y-auto">
                {positions.filter((pos) => pos.id).sort((a, b) => a.level - b.level).map((pos) => {
                  const isSelected = selectedPositionIds.includes(pos.id);
                  return (
                    <div 
                      key={pos.id}
                      className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                        isSelected ? "bg-primary/10" : "hover:bg-muted"
                      }`}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedPositionIds(selectedPositionIds.filter(id => id !== pos.id));
                        } else {
                          setSelectedPositionIds([...selectedPositionIds, pos.id]);
                        }
                      }}
                    >
                      <Checkbox checked={isSelected} />
                      <Building2 
                        className="h-3.5 w-3.5 shrink-0"
                        style={{ color: pos.color || "#6b7280" }}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm">{pos.name}</span>
                        {pos.jobLevel && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({pos.jobLevel})
                          </span>
                        )}
                        {pos.department && (
                          <p className="text-xs text-muted-foreground truncate">{pos.department}</p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">
                        L{pos.level}
                      </Badge>
                    </div>
                  );
                })}
              </div>
              {selectedPositionIds.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {selectedPositionIds.length} position(s) selected
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Assign Role</Label>
              <Select value={roleId || "none"} onValueChange={(v) => setRoleId(v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Role</SelectItem>
                  {roles.filter((role) => role.id).map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: role.color }}
                        />
                        {role.name}
                        <span className="text-xs text-muted-foreground ml-2">
                          ({role.pointRatio.pointedWorkPercent}/{role.pointRatio.nonPointedWorkPercent})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                The role determines default permissions and point ratio.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Access Level</Label>
              <Select value={legacyRole} onValueChange={(v) => setLegacyRole(v as typeof legacyRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!name.trim() || !email.trim()}>
              {editingUser ? "Save Changes" : "Add User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Point Ratio Configuration Dialog */}
      <Dialog open={showPointRatioDialog} onOpenChange={setShowPointRatioDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configure Point Ratio</DialogTitle>
            <DialogDescription>
              {selectedUserForRatio && (
                <>Set a custom point ratio for {selectedUserForRatio.name} or use the role default.</>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {selectedUserForRatio && (
              <>
                {/* Current Role Info */}
                {getRoleForUser(selectedUserForRatio) && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        Role: {getRoleForUser(selectedUserForRatio)?.name}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Default ratio: {getRoleForUser(selectedUserForRatio)?.pointRatio.pointedWorkPercent}/
                      {getRoleForUser(selectedUserForRatio)?.pointRatio.nonPointedWorkPercent}
                    </p>
                  </div>
                )}

                {/* Custom Ratio Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Use Custom Ratio</p>
                    <p className="text-sm text-muted-foreground">
                      Override the role&apos;s default point ratio
                    </p>
                  </div>
                  <Switch
                    checked={useCustomRatio}
                    onCheckedChange={setUseCustomRatio}
                  />
                </div>

                {useCustomRatio && (
                  <>
                    <Separator />

                    <div className="space-y-4">
                      <Label>Point Ratio Preset</Label>
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
                  </>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPointRatioDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePointRatio}>
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
