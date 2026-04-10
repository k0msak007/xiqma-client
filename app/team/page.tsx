"use client";

import { useMemo, useState } from "react";
import {
  Search,
  Plus,
  MoreHorizontal,
  Mail,
  Shield,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { users, spaces } from "@/lib/mock-data";
import { useTaskStore } from "@/lib/store";
import { format } from "date-fns";

const roleColors = {
  admin: "bg-red-500/10 text-red-500",
  member: "bg-blue-500/10 text-blue-500",
  viewer: "bg-gray-500/10 text-gray-500",
};

export default function TeamPage() {
  const { tasks } = useTaskStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const getUserStats = (userId: string) => {
    const userTasks = tasks.filter((t) => t.assigneeIds.includes(userId));
    const completedTasks = userTasks.filter(
      (t) => t.statusId === "status-4" || t.statusId === "status-5"
    );
    const activeTasks = userTasks.filter(
      (t) => t.statusId !== "status-4" && t.statusId !== "status-5"
    );
    const overdueTasks = userTasks.filter(
      (t) =>
        t.dueDate &&
        new Date(t.dueDate) < new Date() &&
        t.statusId !== "status-4" &&
        t.statusId !== "status-5"
    );

    return {
      total: userTasks.length,
      completed: completedTasks.length,
      active: activeTasks.length,
      overdue: overdueTasks.length,
      completionRate:
        userTasks.length > 0
          ? Math.round((completedTasks.length / userTasks.length) * 100)
          : 0,
    };
  };

  const getUserSpaces = (userId: string) => {
    return spaces.filter((s) => s.memberIds.includes(userId));
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
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Send an invitation to join your workspace.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@company.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Select defaultValue="member">
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
              <div className="grid gap-2">
                <Label htmlFor="spaces">Add to spaces</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select spaces..." />
                  </SelectTrigger>
                  <SelectContent>
                    {spaces.map((space) => (
                      <SelectItem key={space.id} value={space.id}>
                        {space.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setInviteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={() => setInviteDialogOpen(false)}>
                Send Invitation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Stats */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search team members..."
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{users.length} members</span>
          <span>|</span>
          <span>{users.filter((u) => u.role === "admin").length} admins</span>
        </div>
      </div>

      {/* Team Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredUsers.map((user) => {
          const stats = getUserStats(user.id);
          const userSpaces = getUserSpaces(user.id);

          return (
            <Card key={user.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">{user.name}</CardTitle>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {user.email}
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
                      <DropdownMenuItem>Edit Permissions</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        Remove from Team
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={roleColors[user.role]}
                  >
                    <Shield className="mr-1 h-3 w-3" />
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Joined {format(new Date(user.createdAt), "MMM yyyy")}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Task Stats */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-muted/50 p-2">
                    <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Active
                    </div>
                    <div className="text-lg font-semibold">{stats.active}</div>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2">
                    <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                      <CheckCircle2 className="h-3 w-3" />
                      Done
                    </div>
                    <div className="text-lg font-semibold">{stats.completed}</div>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2">
                    <div className="text-xs text-muted-foreground">Rate</div>
                    <div className="text-lg font-semibold">
                      {stats.completionRate}%
                    </div>
                  </div>
                </div>

                {/* Completion Progress */}
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Task completion rate
                    </span>
                    <span>{stats.completionRate}%</span>
                  </div>
                  <Progress value={stats.completionRate} className="h-1.5" />
                </div>

                {/* Spaces */}
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    Spaces
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {userSpaces.length > 0 ? (
                      userSpaces.map((space) => (
                        <Badge
                          key={space.id}
                          variant="outline"
                          className="text-xs"
                          style={{
                            borderColor: space.color,
                            color: space.color,
                          }}
                        >
                          {space.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        No spaces assigned
                      </span>
                    )}
                  </div>
                </div>

                {/* Overdue Warning */}
                {stats.overdue > 0 && (
                  <div className="flex items-center gap-2 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-500">
                    <Clock className="h-4 w-4" />
                    {stats.overdue} overdue task{stats.overdue > 1 ? "s" : ""}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredUsers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">No team members found</p>
        </div>
      )}
    </div>
  );
}
