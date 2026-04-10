"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  Home,
  FolderKanban,
  BarChart3,
  Settings,
  Users,
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
  Shield,
  UserCog,
  Archive,
  RotateCcw,
  Layers,
  Clock,
  GanttChart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTaskStore } from "@/lib/store";
import { getFoldersBySpaceId, getListsByFolderId, getListsWithoutFolder } from "@/lib/mock-data";
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
import { LanguageSwitcher } from "@/components/language-switcher";

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

const mainNavItems = [
  { label: "Home", icon: Home, href: "/" },
  { label: "My Tasks", icon: CheckCircle2, href: "/my-tasks" },
  { label: "My Calendar", icon: Calendar, href: "/my-calendar" },
  { label: "Search", icon: Search, href: "/search" },
];

const toolNavItems = [
  { label: "Resources", icon: Calendar, href: "/resources" },
  { label: "Time Sheet", icon: Clock, href: "/timesheet" },
  { label: "Gantt Chart", icon: GanttChart, href: "/gantt" },
  { label: "Analytics", icon: BarChart3, href: "/analytics" },
  { label: "Settings", icon: Settings, href: "/settings" },
];

export function AppSidebar() {
  const pathname = usePathname();
  const {
    spaces,
    folders,
    navigation,
    expandedSpaces,
    expandedFolders,
    toggleSpaceExpanded,
    toggleFolderExpanded,
    setActiveList,
    archiveFolder,
    restoreFolder,
  } = useTaskStore();

  const [hoveredSpace, setHoveredSpace] = useState<string | null>(null);
  const [showCreateSpaceDialog, setShowCreateSpaceDialog] = useState(false);
  const [archiveExpanded, setArchiveExpanded] = useState(false);

  // Get archived folders
  const archivedFolders = folders.filter((f) => f.archived);
  // Get active folders (for showing in spaces)
  const activeFolders = folders.filter((f) => !f.archived);

  return (
    <Sidebar className="border-r border-border/50">
      <SidebarHeader className="border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <FolderKanban className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Task Manager</span>
            <span className="text-xs text-muted-foreground">Workspace</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
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
            <SidebarGroupLabel className="text-xs font-medium text-muted-foreground">
              Spaces
            </SidebarGroupLabel>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-5 w-5"
              onClick={() => setShowCreateSpaceDialog(true)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {spaces.map((space) => {
                const spaceFolders = getFoldersBySpaceId(space.id).filter((f) => !f.archived);
                const listsWithoutFolder = getListsWithoutFolder(space.id);
                const isExpanded = expandedSpaces.includes(space.id);

                return (
                  <Collapsible
                    key={space.id}
                    open={isExpanded}
                    onOpenChange={() => toggleSpaceExpanded(space.id)}
                  >
                    <SidebarMenuItem
                      onMouseEnter={() => setHoveredSpace(space.id)}
                      onMouseLeave={() => setHoveredSpace(null)}
                    >
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton className="w-full">
                          <div
                            className="flex h-5 w-5 items-center justify-center rounded"
                            style={{ backgroundColor: space.color }}
                          >
                            {space.icon && spaceIcons[space.icon] ? (
                              <span className="text-white">
                                {spaceIcons[space.icon]}
                              </span>
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
                      {hoveredSpace === space.id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 opacity-0 group-hover:opacity-100"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Add Folder</DropdownMenuItem>
                            <DropdownMenuItem>Add List</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Settings</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </SidebarMenuItem>

                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {/* Folders */}
                        {spaceFolders.map((folder) => {
                          const listsInFolder = getListsByFolderId(folder.id);
                          const isFolderExpanded = expandedFolders.includes(folder.id);

                          return (
                            <Collapsible
                              key={folder.id}
                              open={isFolderExpanded}
                              onOpenChange={() => toggleFolderExpanded(folder.id)}
                            >
                              <SidebarMenuSubItem>
                                <CollapsibleTrigger asChild>
                                  <SidebarMenuSubButton className="w-full">
                                    {isFolderExpanded ? (
                                      <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                    ) : (
                                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                    )}
                                    <FolderKanban
                                      className="h-3.5 w-3.5"
                                      style={{ color: folder.color || space.color }}
                                    />
                                    <span className="flex-1 truncate text-sm">
                                      {folder.name}
                                    </span>
                                  </SidebarMenuSubButton>
                                </CollapsibleTrigger>
                              </SidebarMenuSubItem>

                              <CollapsibleContent>
                                <SidebarMenuSub className="ml-4">
                                  {listsInFolder.map((list) => (
                                    <SidebarMenuSubItem key={list.id}>
                                      <SidebarMenuSubButton
                                        asChild
                                        isActive={navigation.activeListId === list.id}
                                      >
                                        <Link
                                          href={`/list/${list.id}`}
                                          onClick={() => setActiveList(list.id)}
                                        >
                                          <ListTodo className="h-3.5 w-3.5" />
                                          <span className="text-sm">{list.name}</span>
                                        </Link>
                                      </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                  ))}
                                </SidebarMenuSub>
                              </CollapsibleContent>
                            </Collapsible>
                          );
                        })}

                        {/* Lists without folder */}
                        {listsWithoutFolder.map((list) => (
                          <SidebarMenuSubItem key={list.id}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={navigation.activeListId === list.id}
                            >
                              <Link
                                href={`/list/${list.id}`}
                                onClick={() => setActiveList(list.id)}
                              >
                                <ListTodo className="h-3.5 w-3.5" />
                                <span className="text-sm">{list.name}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
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
                    Archive
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
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground">
            Tools
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolNavItems.map((item) => (
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
        <div className="flex justify-center">
          <LanguageSwitcher />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-auto w-full justify-start gap-3 px-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" />
                <AvatarFallback>AJ</AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start text-left">
                <span className="text-sm font-medium">Alex Johnson</span>
                <span className="text-xs text-muted-foreground">Admin</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/profile">Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>Preferences</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>

      {/* Create Space Dialog */}
      <CreateSpaceDialog 
        open={showCreateSpaceDialog} 
        onOpenChange={setShowCreateSpaceDialog} 
      />
    </Sidebar>
  );
}
