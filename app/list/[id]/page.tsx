"use client";

import { useState, useMemo, use } from "react";
import { useSearchParams } from "next/navigation";
import {
  LayoutList,
  LayoutGrid,
  Plus,
  Filter,
  SortAsc,
  Search,
  MoreHorizontal,
  Settings,
  Calendar as CalendarIcon,
  Users,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskCard } from "@/components/task-card";
import { TaskDetail } from "@/components/task-detail";
import { KanbanBoard } from "@/components/kanban-board";
import { AddTaskDialog } from "@/components/add-task-dialog";
import { TaskTableRow } from "@/components/task-table-row";
import { useTaskStore } from "@/lib/store";
import { getListById, users } from "@/lib/mock-data";
import type { ViewType, Priority } from "@/lib/types";
import type { Task } from "@/lib/types";

type GroupByOption = "none" | "status" | "priority" | "assignee";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ListPage({ params }: PageProps) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const selectedTaskId = searchParams.get("task");

  const { tasks, navigation, setActiveView, setActiveTask, statuses: globalStatuses } = useTaskStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState<Priority | "all">("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterAssignee, setFilterAssignee] = useState<string>("all");
  const [planStartFrom, setPlanStartFrom] = useState<Date | undefined>();
  const [planStartTo, setPlanStartTo] = useState<Date | undefined>();
  const [sortBy, setSortBy] = useState<"created" | "due" | "priority" | "planStart">("created");
  const [groupBy, setGroupBy] = useState<GroupByOption>("none");
  const [showAddTaskDialog, setShowAddTaskDialog] = useState(false);

  const list = getListById(id);
  const view = navigation.activeView;

  // Filter and sort tasks
  const listTasks = useMemo(() => {
    let filtered = tasks.filter((t) => t.listId === id);

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query) ||
          t.taskId?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter((t) => t.statusId === filterStatus);
    }

    // Priority filter
    if (filterPriority !== "all") {
      filtered = filtered.filter((t) => t.priority === filterPriority);
    }

    // Assignee filter
    if (filterAssignee !== "all") {
      filtered = filtered.filter((t) => t.assigneeIds.includes(filterAssignee));
    }

    // Plan date range filter
    if (planStartFrom || planStartTo) {
      filtered = filtered.filter((t) => {
        if (!t.planStart) return false;
        const taskPlanStart = new Date(t.planStart);
        if (planStartFrom && taskPlanStart < planStartFrom) return false;
        if (planStartTo && taskPlanStart > planStartTo) return false;
        return true;
      });
    }

    // Sort
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "due":
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case "priority": {
          const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        case "planStart":
          if (!a.planStart) return 1;
          if (!b.planStart) return -1;
          return new Date(a.planStart).getTime() - new Date(b.planStart).getTime();
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [tasks, id, searchQuery, filterStatus, filterPriority, filterAssignee, planStartFrom, planStartTo, sortBy]);

  // Group tasks based on groupBy option
  const groupedTasks = useMemo(() => {
    if (groupBy === "none") {
      return { "All Tasks": listTasks };
    }

    const grouped: Record<string, Task[]> = {};

    listTasks.forEach((task) => {
      let groupKey: string;

      switch (groupBy) {
        case "status": {
          const status = globalStatuses.find((s) => s.id === task.statusId);
          groupKey = status?.name || "No Status";
          break;
        }
        case "priority":
          groupKey = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
          break;
        case "assignee": {
          if (task.assigneeIds.length === 0) {
            groupKey = "Unassigned";
          } else {
            const assignee = users.find((u) => u.id === task.assigneeIds[0]);
            groupKey = assignee?.name || "Unknown";
          }
          break;
        }
        default:
          groupKey = "All Tasks";
      }

      if (!grouped[groupKey]) {
        grouped[groupKey] = [];
      }
      grouped[groupKey].push(task);
    });

    return grouped;
  }, [listTasks, groupBy, globalStatuses]);

  // Get assignees in this list's tasks
  const listAssignees = useMemo(() => {
    const assigneeIds = new Set<string>();
    listTasks.forEach((task) => {
      task.assigneeIds.forEach((id) => assigneeIds.add(id));
    });
    return users.filter((u) => assigneeIds.has(u.id));
  }, [listTasks]);

  const clearFilters = () => {
    setSearchQuery("");
    setFilterStatus("all");
    setFilterPriority("all");
    setFilterAssignee("all");
    setPlanStartFrom(undefined);
    setPlanStartTo(undefined);
  };

  const hasActiveFilters = filterStatus !== "all" || filterPriority !== "all" || filterAssignee !== "all" || planStartFrom || planStartTo;

  const selectedTask = selectedTaskId
    ? tasks.find((t) => t.id === selectedTaskId)
    : null;

  if (!list) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">List not found</p>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold">{list.name}</h1>
              <Badge variant="secondary" className="font-normal">
                {listTasks.length} tasks
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={() => setShowAddTaskDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Task
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    List Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Export</DropdownMenuItem>
                  <DropdownMenuItem>Archive</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Toolbar */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {/* View Toggle */}
            <Tabs
              value={view}
              onValueChange={(v) => setActiveView(v as ViewType)}
            >
              <TabsList className="h-8">
                <TabsTrigger value="list" className="h-7 px-2">
                  <LayoutList className="mr-1 h-3.5 w-3.5" />
                  Table
                </TabsTrigger>
                <TabsTrigger value="board" className="h-7 px-2">
                  <LayoutGrid className="mr-1 h-3.5 w-3.5" />
                  Board
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="h-8 w-[160px] pl-8"
              />
            </div>

            {/* Group By */}
            <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupByOption)}>
              <SelectTrigger className="h-8 w-[120px]">
                <Users className="mr-1.5 h-3.5 w-3.5" />
                <SelectValue placeholder="Group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Grouping</SelectItem>
                <SelectItem value="status">By Status</SelectItem>
                <SelectItem value="priority">By Priority</SelectItem>
                <SelectItem value="assignee">By Assignee</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-8 w-[120px]">
                <Filter className="mr-1.5 h-3.5 w-3.5" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {globalStatuses.map((status) => (
                  <SelectItem key={status.id} value={status.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: status.color }}
                      />
                      {status.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Priority Filter */}
            <Select
              value={filterPriority}
              onValueChange={(v) => setFilterPriority(v as Priority | "all")}
            >
              <SelectTrigger className="h-8 w-[110px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            {/* Assignee Filter */}
            <Select value={filterAssignee} onValueChange={setFilterAssignee}>
              <SelectTrigger className="h-8 w-[120px]">
                <SelectValue placeholder="Assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All People</SelectItem>
                {listAssignees.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Plan Date Range */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-8 justify-start text-left font-normal",
                    !planStartFrom && !planStartTo && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                  {planStartFrom || planStartTo ? (
                    <span className="text-xs">
                      {planStartFrom ? format(planStartFrom, "MMM d") : "Start"} -{" "}
                      {planStartTo ? format(planStartTo, "MMM d") : "End"}
                    </span>
                  ) : (
                    <span className="text-xs">Plan Range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="flex">
                  <div className="border-r p-3">
                    <p className="mb-2 text-xs font-medium">From</p>
                    <Calendar
                      mode="single"
                      selected={planStartFrom}
                      onSelect={setPlanStartFrom}
                      initialFocus
                    />
                  </div>
                  <div className="p-3">
                    <p className="mb-2 text-xs font-medium">To</p>
                    <Calendar
                      mode="single"
                      selected={planStartTo}
                      onSelect={setPlanStartTo}
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Sort */}
            <Select
              value={sortBy}
              onValueChange={(v) => setSortBy(v as typeof sortBy)}
            >
              <SelectTrigger className="h-8 w-[120px]">
                <SortAsc className="mr-1.5 h-3.5 w-3.5" />
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created">Date Created</SelectItem>
                <SelectItem value="due">Due Date</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="planStart">Plan Start</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8"
                onClick={clearFilters}
              >
                <X className="mr-1 h-3.5 w-3.5" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {view === "calendar" ? (
            <CalendarView
              tasks={listTasks}
              statuses={globalStatuses}
              onTaskClick={(taskId) => setActiveTask(taskId)}
            />
          ) : view === "board" ? (
            <KanbanBoard
              listId={id}
              statuses={globalStatuses}
              tasks={listTasks}
              onTaskClick={(taskId) => setActiveTask(taskId)}
              selectedTaskId={selectedTaskId || undefined}
            />
          ) : (
            <div className="p-4">
              {listTasks.length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
                    <div key={groupName}>
                      {groupBy !== "none" && (
                        <div className="mb-3 flex items-center gap-2">
                          <h2 className="text-sm font-semibold">{groupName}</h2>
                          <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                            {groupTasks.length}
                          </Badge>
                        </div>
                      )}
                      <div className="rounded-lg border overflow-x-auto">
                        <table className="w-full min-w-[1700px]">
                          <thead className="bg-muted/50">
                            <tr className="text-left text-xs font-medium text-muted-foreground">
                              <th className="p-2 w-[80px]">ID</th>
                              <th className="p-2 w-[200px]">Task</th>
                              <th className="p-2 w-[110px]">Status</th>
                              <th className="p-2 w-[100px]">Type</th>
                              <th className="p-2 w-[100px]">Priority</th>
                              <th className="p-2 w-[60px]">Points</th>
                              <th className="p-2 w-[70px]">Duration</th>
                              <th className="p-2 w-[90px]">Plan Start</th>
                              <th className="p-2 w-[90px]">Plan Finish</th>
                              <th className="p-2 w-[90px]">Actual Start</th>
                              <th className="p-2 w-[90px]">Actual Finish</th>
                              <th className="p-2 w-[70px]">Plan %</th>
                              <th className="p-2 w-[70px]">Actual %</th>
                              <th className="p-2 w-[70px]">Variance</th>
                              <th className="p-2 w-[100px]">Time</th>
                              <th className="p-2 w-[100px]">Assignees</th>
                              <th className="p-2 w-[50px]"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {groupTasks.map((task) => (
                              <TaskTableRow
                                key={task.id}
                                task={task}
                                onClick={() => setActiveTask(task.id)}
                                isSelected={task.id === selectedTaskId}
                                statuses={globalStatuses}
                              />
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground">No tasks found</p>
                  <Button variant="outline" className="mt-4" onClick={() => setShowAddTaskDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create your first task
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Task Detail Panel */}
      {selectedTask && (
        <div className="w-[400px] shrink-0">
          <TaskDetail
            task={selectedTask}
            onClose={() => setActiveTask(undefined)}
          />
        </div>
      )}

      {/* Add Task Dialog */}
      <AddTaskDialog
        open={showAddTaskDialog}
        onOpenChange={setShowAddTaskDialog}
        listId={id}
      />
    </div>
  );
}
