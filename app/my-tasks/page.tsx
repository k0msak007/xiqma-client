"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  LayoutList,
  LayoutGrid,
  Filter,
  SortAsc,
  Search,
  Calendar as CalendarIcon,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskDetail } from "@/components/task-detail";
import { TaskTableRow } from "@/components/task-table-row";
import { useTaskStore } from "@/lib/store";
import { users, getListById } from "@/lib/mock-data";
import type { Priority, Status } from "@/lib/types";

// Current user ID (in a real app, this would come from auth)
const CURRENT_USER_ID = "user-1";

type GroupByOption = "none" | "status" | "priority" | "dueDate" | "list";

export default function MyTasksPage() {
  const searchParams = useSearchParams();
  const selectedTaskId = searchParams.get("task");

  const { tasks, setActiveTask } = useTaskStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<Priority | "all">("all");
  const [planStartFrom, setPlanStartFrom] = useState<Date | undefined>();
  const [planStartTo, setPlanStartTo] = useState<Date | undefined>();
  const [sortBy, setSortBy] = useState<"created" | "due" | "priority" | "planStart">("due");
  const [groupBy, setGroupBy] = useState<GroupByOption>("status");

  // Get my tasks (assigned to current user)
  const myTasks = useMemo(() => {
    let filtered = tasks.filter((t) => t.assigneeIds.includes(CURRENT_USER_ID));

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
  }, [tasks, searchQuery, filterStatus, filterPriority, planStartFrom, planStartTo, sortBy]);

  // Get unique statuses from all tasks
  const allStatuses = useMemo(() => {
    const statusMap = new Map<string, Status>();
    myTasks.forEach((task) => {
      const list = getListById(task.listId);
      const status = list?.statuses.find((s) => s.id === task.statusId);
      if (status && !statusMap.has(status.id)) {
        statusMap.set(status.id, status);
      }
    });
    return Array.from(statusMap.values());
  }, [myTasks]);

  // Group tasks
  const groupedTasks = useMemo(() => {
    if (groupBy === "none") {
      return { "All Tasks": myTasks };
    }

    const grouped: Record<string, typeof myTasks> = {};

    myTasks.forEach((task) => {
      let groupKey: string;

      switch (groupBy) {
        case "status": {
          const list = getListById(task.listId);
          const status = list?.statuses.find((s) => s.id === task.statusId);
          groupKey = status?.name || "No Status";
          break;
        }
        case "priority":
          groupKey = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
          break;
        case "dueDate":
          if (!task.dueDate) {
            groupKey = "No Due Date";
          } else {
            const today = new Date();
            const dueDate = new Date(task.dueDate);
            const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays < 0) groupKey = "Overdue";
            else if (diffDays === 0) groupKey = "Today";
            else if (diffDays <= 7) groupKey = "This Week";
            else if (diffDays <= 30) groupKey = "This Month";
            else groupKey = "Later";
          }
          break;
        case "list": {
          const list = getListById(task.listId);
          groupKey = list?.name || "Unknown List";
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
  }, [myTasks, groupBy]);

  const selectedTask = selectedTaskId
    ? tasks.find((t) => t.id === selectedTaskId)
    : null;

  // Get status for table row (from first task's list)
  const getStatusesForTask = (taskListId: string) => {
    const list = getListById(taskListId);
    return list?.statuses || [];
  };

  // Stats
  const stats = useMemo(() => {
    const total = myTasks.length;
    const completed = myTasks.filter((t) => t.statusId === "status-4").length;
    const inProgress = myTasks.filter((t) => t.statusId === "status-2").length;
    const overdue = myTasks.filter((t) => {
      if (!t.dueDate) return false;
      return new Date(t.dueDate) < new Date() && t.statusId !== "status-4";
    }).length;
    return { total, completed, inProgress, overdue };
  }, [myTasks]);

  const currentUser = users.find((u) => u.id === CURRENT_USER_ID);

  const clearFilters = () => {
    setSearchQuery("");
    setFilterStatus("all");
    setFilterPriority("all");
    setPlanStartFrom(undefined);
    setPlanStartTo(undefined);
  };

  const hasActiveFilters = filterStatus !== "all" || filterPriority !== "all" || planStartFrom || planStartTo;

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-xl font-semibold">My Tasks</h1>
                <p className="text-sm text-muted-foreground">
                  Tasks assigned to {currentUser?.name || "you"}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm">{stats.completed} completed</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-1.5">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-sm">{stats.inProgress} in progress</span>
              </div>
              {stats.overdue > 0 && (
                <div className="flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-1.5">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-500">{stats.overdue} overdue</span>
                </div>
              )}
            </div>
          </div>

          {/* Toolbar */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="h-8 w-[180px] pl-8"
              />
            </div>

            {/* Group By */}
            <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupByOption)}>
              <SelectTrigger className="h-8 w-[130px]">
                <Users className="mr-1.5 h-3.5 w-3.5" />
                <SelectValue placeholder="Group By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Grouping</SelectItem>
                <SelectItem value="status">By Status</SelectItem>
                <SelectItem value="priority">By Priority</SelectItem>
                <SelectItem value="dueDate">By Due Date</SelectItem>
                <SelectItem value="list">By List</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-8 w-[130px]">
                <Filter className="mr-1.5 h-3.5 w-3.5" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {allStatuses.map((status) => (
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
              <SelectTrigger className="h-8 w-[120px]">
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
                    <span className="text-xs">Plan Date Range</span>
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
              <SelectTrigger className="h-8 w-[130px]">
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

            <div className="ml-auto">
              <Badge variant="secondary" className="font-normal">
                {myTasks.length} tasks
              </Badge>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {myTasks.length > 0 ? (
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
                            statuses={getStatusesForTask(task.listId)}
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
              <CheckCircle2 className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">No tasks assigned to you</p>
              <p className="text-sm text-muted-foreground">
                Tasks assigned to you will appear here
              </p>
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
    </div>
  );
}
