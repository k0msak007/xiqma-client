"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  Home,
  FolderKanban,
  BarChart3,
  Settings,
  Plus,
  Search,
  Code,
  Megaphone,
  Palette,
  MoreHorizontal,
  ListTodo,
  Briefcase,
  Rocket,
  Target,
  Lightbulb,
  Heart,
  Calendar,
  CheckCircle2,
  Archive,
  RotateCcw,
  Clock,
  GanttChart,
  Loader2,
  Trash2,
  FileText,
  Sun,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/lib/workspace-store";
import { useTaskStore } from "@/lib/store";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { CreateSpaceDialog } from "@/components/create-space-dialog";
import { CreateFolderDialog } from "@/components/create-folder-dialog";
import { CreateListDialog } from "@/components/create-list-dialog";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { LanguageSwitcher } from "@/components/language-switcher";
import { NotificationsBell } from "@/components/notifications-bell";
import { SpaceMembersDialog } from "@/components/space-members-dialog";
import { useAuthStore } from "@/lib/auth-store";
import { usePermission } from "@/lib/use-permission";

const spaceIcons: Record<string, React.ReactNode> = {
  Code: <Code className="h-4 w-4" />,
  Megaphone: <Megaphone className="h-4 w-4" />,
  Palette: <Palette className="h-4 w-4" />,
  Briefcase: <Briefcase className="h-4 w-4" />,
  Rocket: <Rocket className="h-4 w-4" />,
  Target: <Target className="h-4 w-4" />,
  Lightbulb: <Lightbulb className="h-4 w-4" />,
  Heart: <Heart className="h-4 w-4" />,
};

type NavItem = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  /** If set, user must have AT LEAST ONE of these permissions (admin always allowed) */
  requires?: string[];
};

// Personal menus — always visible to any authenticated user
const mainNavItems: NavItem[] = [
  { label: "Home", icon: Home, href: "/" },
  { label: "My Tasks", icon: CheckCircle2, href: "/my-tasks" },
  { label: "My Calendar", icon: Calendar, href: "/my-calendar" },
  { label: "Daily Standup", icon: Sun, href: "/standups" },
  { label: "Search", icon: Search, href: "/search" },
];

const toolNavItems: NavItem[] = [
  { label: "Resources", icon: Calendar, href: "/resources", requires: ["view_analytics", "manage_users"] },
  { label: "Time Sheet", icon: Clock, href: "/timesheet", requires: ["view_tasks"] },
  { label: "Gantt Chart", icon: GanttChart, href: "/gantt", requires: ["view_tasks"] },
  { label: "Analytics", icon: BarChart3, href: "/analytics", requires: ["view_analytics"] },
  { label: "Reports", icon: FileText, href: "/reports", requires: ["view_analytics", "manage_users"] },
  { label: "Settings", icon: Settings, href: "/settings", requires: ["manage_users", "manage_roles", "manage_workspace", "view_analytics"] },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { hasAny } = usePermission();

  const canSee = (item: NavItem) => !item.requires || hasAny(item.requires);
  const visibleMainItems = mainNavItems.filter(canSee);
  const visibleToolItems = toolNavItems.filter(canSee);

  const {
    spaces,
    folders,
    lists,
    loading,
    expandedSpaces,
    expandedFolders,
    toggleSpaceExpanded,
    toggleFolderExpanded,
    loadWorkspace,
    archiveFolder,
    restoreFolder,
    deleteSpace,
    deleteFolder,
    deleteList,
  } = useWorkspaceStore();

  const { navigation, setActiveList } = useTaskStore();
  const { logout } = useAuthStore();

  const [showCreateSpaceDialog, setShowCreateSpaceDialog] = useState(false);
  const [archiveExpanded, setArchiveExpanded] = useState(false);
  const [membersDialogState, setMembersDialogState] = useState<{ open: boolean; spaceId: string; spaceName: string }>({
    open: false,
    spaceId: "",
    spaceName: "",
  });

  // Create dialog state
  const [createFolderSpaceId, setCreateFolderSpaceId] = useState<string | null>(null);
  const [createListState, setCreateListState] = useState<{ spaceId: string; folderId?: string } | null>(null);

  // Delete confirm dialog state
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "space" | "folder" | "list";
    id: string;
    name: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    if (deleteTarget.type === "space")  await deleteSpace(deleteTarget.id);
    if (deleteTarget.type === "folder") await deleteFolder(deleteTarget.id);
    if (deleteTarget.type === "list")   await deleteList(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
  };

  // Load workspace data on mount
  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  const archivedFolders = folders.filter((f) => f.isArchived);

  return (
    <Sidebar className="border-r border-border/50">
      <SidebarHeader className="border-b border-border/50 px-4 py-3">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 via-pink-500 to-rose-500 text-white shadow-md shadow-rose-500/25 transition group-hover:shadow-rose-500/40">
            <span className="text-sm font-bold">X</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight">Xiqma</span>
            <span className="text-[11px] text-muted-foreground">Workspace</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleMainItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Spaces */}
        <SidebarGroup>
          <div className="flex items-center justify-between px-2">
            <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Spaces
            </SidebarGroupLabel>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={() => setShowCreateSpaceDialog(true)}
              title="Create Space"
            >
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
            </Button>
          </div>

          <SidebarGroupContent>
            <SidebarMenu>
              {spaces.map((space) => {
                const spaceFolders = folders.filter(
                  (f) => f.spaceId === space.id && !f.isArchived
                );
                const listsWithoutFolder = lists.filter(
                  (l) => l.spaceId === space.id && !l.folderId
                );
                const isExpanded = expandedSpaces.includes(space.id);

                return (
                  <Collapsible
                    key={space.id}
                    open={isExpanded}
                    onOpenChange={() => toggleSpaceExpanded(space.id)}
                  >
                    <SidebarMenuItem className="group/space">
                      <div className="flex items-center w-full">
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton className="flex-1">
                            <div
                              className="flex h-5 w-5 items-center justify-center rounded flex-shrink-0"
                              style={{ backgroundColor: space.color }}
                            >
                              {space.icon && spaceIcons[space.icon] ? (
                                <span className="text-white">{spaceIcons[space.icon]}</span>
                              ) : (
                                <span className="text-xs font-bold text-white">
                                  {space.name.charAt(0)}
                                </span>
                              )}
                            </div>
                            <span className="flex-1 truncate">{space.name}</span>
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </SidebarMenuButton>
                        </CollapsibleTrigger>

                        {/* Space context menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover/space:opacity-100 flex-shrink-0"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem
                              onClick={() => setCreateFolderSpaceId(space.id)}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Folder
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setCreateListState({ spaceId: space.id })}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add List
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setMembersDialogState({ open: true, spaceId: space.id, spaceName: space.name })}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Manage Members
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteTarget({ type: "space", id: space.id, name: space.name })}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Space
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </SidebarMenuItem>

                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {/* Folders */}
                        {spaceFolders.map((folder) => {
                          const listsInFolder = lists.filter(
                            (l) => l.folderId === folder.id
                          );
                          const isFolderExpanded = expandedFolders.includes(folder.id);

                          return (
                            <Collapsible
                              key={folder.id}
                              open={isFolderExpanded}
                              onOpenChange={() => toggleFolderExpanded(folder.id)}
                            >
                              <SidebarMenuSubItem className="group/folder">
                                <div className="flex items-center w-full">
                                  <CollapsibleTrigger asChild>
                                    <SidebarMenuSubButton className="flex-1">
                                      {isFolderExpanded ? (
                                        <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                      ) : (
                                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                      )}
                                      <FolderKanban
                                        className="h-3.5 w-3.5"
                                        style={{ color: folder.color || space.color }}
                                      />
                                      <span className="flex-1 truncate text-sm">{folder.name}</span>
                                    </SidebarMenuSubButton>
                                  </CollapsibleTrigger>

                                  {/* Folder context menu */}
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 opacity-0 group-hover/folder:opacity-100 flex-shrink-0"
                                      >
                                        <MoreHorizontal className="h-3 w-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-44">
                                      <DropdownMenuItem
                                        onClick={() =>
                                          setCreateListState({
                                            spaceId: space.id,
                                            folderId: folder.id,
                                          })
                                        }
                                      >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add List
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => archiveFolder(folder.id)}
                                      >
                                        <Archive className="h-4 w-4 mr-2" />
                                        Archive Folder
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        className="text-destructive focus:text-destructive"
                                        onClick={() => setDeleteTarget({ type: "folder", id: folder.id, name: folder.name })}
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete Folder
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </SidebarMenuSubItem>

                              <CollapsibleContent>
                                <SidebarMenuSub className="ml-4">
                                  {listsInFolder.map((list) => (
                                    <SidebarMenuSubItem key={list.id} className="group/list">
                                      <div className="flex items-center w-full">
                                        <SidebarMenuSubButton
                                          asChild
                                          isActive={navigation.activeListId === list.id}
                                          className="flex-1"
                                        >
                                          <Link
                                            href={`/list/${list.id}`}
                                            onClick={() => setActiveList(list.id)}
                                          >
                                            <ListTodo className="h-3.5 w-3.5" />
                                            <span className="text-sm flex-1 truncate">{list.name}</span>
                                            {list.taskCount > 0 && (
                                              <span className="text-xs text-muted-foreground ml-auto">
                                                {list.doneCount}/{list.taskCount}
                                              </span>
                                            )}
                                          </Link>
                                        </SidebarMenuSubButton>
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover/list:opacity-100 flex-shrink-0">
                                              <MoreHorizontal className="h-3 w-3" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end" className="w-36">
                                            <DropdownMenuItem
                                              className="text-destructive focus:text-destructive"
                                              onClick={() => setDeleteTarget({ type: "list", id: list.id, name: list.name })}
                                            >
                                              <Trash2 className="h-4 w-4 mr-2" />
                                              Delete List
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </div>
                                    </SidebarMenuSubItem>
                                  ))}
                                </SidebarMenuSub>
                              </CollapsibleContent>
                            </Collapsible>
                          );
                        })}

                        {/* Lists without folder */}
                        {listsWithoutFolder.map((list) => (
                          <SidebarMenuSubItem key={list.id} className="group/list">
                            <div className="flex items-center w-full">
                              <SidebarMenuSubButton
                                asChild
                                isActive={navigation.activeListId === list.id}
                                className="flex-1"
                              >
                                <Link
                                  href={`/list/${list.id}`}
                                  onClick={() => setActiveList(list.id)}
                                >
                                  <ListTodo className="h-3.5 w-3.5" />
                                  <span className="text-sm">{list.name}</span>
                                  {list.taskCount > 0 && (
                                    <span className="text-xs text-muted-foreground ml-auto">
                                      {list.doneCount}/{list.taskCount}
                                    </span>
                                  )}
                                </Link>
                              </SidebarMenuSubButton>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover/list:opacity-100 flex-shrink-0">
                                    <MoreHorizontal className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-36">
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => setDeleteTarget({ type: "list", id: list.id, name: list.name })}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete List
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}

              {/* Empty state */}
              {!loading && spaces.length === 0 && (
                <div className="px-2 py-4 text-center">
                  <p className="text-xs text-muted-foreground">No spaces yet</p>
                  <Button
                    variant="link"
                    size="sm"
                    className="text-xs h-auto p-0 mt-1"
                    onClick={() => setShowCreateSpaceDialog(true)}
                  >
                    Create your first space
                  </Button>
                </div>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Archive */}
        {archivedFolders.length > 0 && (
          <SidebarGroup>
            <Collapsible open={archiveExpanded} onOpenChange={setArchiveExpanded}>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between px-2 cursor-pointer">
                  <SidebarGroupLabel className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                    <Archive className="h-3.5 w-3.5" />
                    Archive ({archivedFolders.length})
                  </SidebarGroupLabel>
                  {archiveExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {archivedFolders.map((folder) => {
                      const space = spaces.find((s) => s.id === folder.spaceId);
                      return (
                        <SidebarMenuItem key={folder.id}>
                          <SidebarMenuButton className="w-full group">
                            <FolderKanban
                              className="h-3.5 w-3.5"
                              style={{ color: folder.color || space?.color || "#6b7280" }}
                            />
                            <span className="flex-1 truncate text-sm">{folder.name}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 opacity-0 group-hover:opacity-100"
                              title="Restore folder"
                              onClick={(e) => {
                                e.stopPropagation();
                                restoreFolder(folder.id);
                              }}
                            >
                              <RotateCcw className="h-3 w-3" />
                            </Button>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </Collapsible>
          </SidebarGroup>
        )}

        {/* Tools */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Tools
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleToolItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/50 p-3 space-y-2">
        <div className="flex items-center justify-center gap-2">
          <LanguageSwitcher />
          <NotificationsBell />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-auto w-full justify-start gap-3 px-2">
              <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                <AvatarImage src={(user as any)?.avatarUrl} />
                <AvatarFallback className="bg-gradient-to-br from-orange-400 via-pink-500 to-rose-500 text-white text-xs font-semibold">
                  {user?.name?.charAt(0) ?? "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start text-left">
                <span className="text-sm font-medium">{user?.name ?? "User"}</span>
                <span className="text-xs text-muted-foreground">{user?.role ?? ""}</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/profile">Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => logout()}
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>

      {/* Dialogs */}
      <CreateSpaceDialog
        open={showCreateSpaceDialog}
        onOpenChange={setShowCreateSpaceDialog}
      />

      <CreateFolderDialog
        spaceId={createFolderSpaceId}
        onOpenChange={(open) => !open && setCreateFolderSpaceId(null)}
      />

      <CreateListDialog
        spaceId={createListState?.spaceId ?? null}
        folderId={createListState?.folderId}
        onOpenChange={(open) => !open && setCreateListState(null)}
      />

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        loading={deleting}
        title={
          !deleteTarget ? "" :
          deleteTarget.type === "space"  ? `Delete Space "${deleteTarget.name}"?` :
          deleteTarget.type === "folder" ? `Delete Folder "${deleteTarget.name}"?` :
                                           `Delete List "${deleteTarget.name}"?`
        }
        description={
          !deleteTarget ? "" :
          deleteTarget.type === "space"
            ? "This will permanently delete the space, all folders, lists, and tasks inside. This action cannot be undone."
            : deleteTarget.type === "folder"
            ? "This will permanently delete the folder, all lists, and tasks inside. This action cannot be undone."
            : "This will permanently delete the list and all tasks inside. This action cannot be undone."
        }
        onConfirm={handleDeleteConfirm}
      />

      <SpaceMembersDialog
        open={membersDialogState.open}
        onOpenChange={(open) => setMembersDialogState(prev => ({ ...prev, open }))}
        spaceId={membersDialogState.spaceId}
        spaceName={membersDialogState.spaceName}
      />
    </Sidebar>
  );
}
