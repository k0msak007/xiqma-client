"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Filter, X, FileText, Users, FolderKanban } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { TaskCard } from "@/components/task-card";
import { useTaskStore } from "@/lib/store";
import { users, spaces, lists, getUserById, getListById } from "@/lib/mock-data";
import { priorityConfig } from "@/lib/types";

type SearchTab = "all" | "tasks" | "spaces" | "people";

export default function SearchPage() {
  const { tasks, setActiveTask } = useTaskStore();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<SearchTab>("all");
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  // Search results
  const searchResults = useMemo(() => {
    if (!query.trim()) {
      return { tasks: [], spaces: [], people: [], lists: [] };
    }

    const lowerQuery = query.toLowerCase();

    const filteredTasks = tasks.filter((task) => {
      const matchesQuery =
        task.title.toLowerCase().includes(lowerQuery) ||
        task.description?.toLowerCase().includes(lowerQuery) ||
        task.tags.some((tag) => tag.toLowerCase().includes(lowerQuery));

      const matchesPriority =
        selectedPriorities.length === 0 ||
        selectedPriorities.includes(task.priority);

      const matchesStatus =
        selectedStatuses.length === 0 ||
        selectedStatuses.includes(task.statusId);

      return matchesQuery && matchesPriority && matchesStatus;
    });

    const filteredSpaces = spaces.filter(
      (space) =>
        space.name.toLowerCase().includes(lowerQuery)
    );

    const filteredPeople = users.filter(
      (user) =>
        user.name.toLowerCase().includes(lowerQuery) ||
        user.email.toLowerCase().includes(lowerQuery)
    );

    const filteredLists = lists.filter(
      (list) =>
        list.name.toLowerCase().includes(lowerQuery)
    );

    return {
      tasks: filteredTasks,
      spaces: filteredSpaces,
      people: filteredPeople,
      lists: filteredLists,
    };
  }, [query, tasks, selectedPriorities, selectedStatuses]);

  const totalResults =
    searchResults.tasks.length +
    searchResults.spaces.length +
    searchResults.people.length +
    searchResults.lists.length;

  const togglePriority = (priority: string) => {
    setSelectedPriorities((prev) =>
      prev.includes(priority)
        ? prev.filter((p) => p !== priority)
        : [...prev, priority]
    );
  };

  const clearFilters = () => {
    setSelectedPriorities([]);
    setSelectedStatuses([]);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Search</h1>
        <p className="text-muted-foreground">
          Find tasks, spaces, lists, and team members.
        </p>
      </div>

      {/* Search Input */}
      <div className="relative max-w-2xl">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for tasks, spaces, people..."
          className="h-12 pl-10 text-lg"
          autoFocus
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2"
            onClick={() => setQuery("")}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted-foreground">Filter by:</span>
        <div className="flex flex-wrap gap-2">
          {Object.entries(priorityConfig).map(([key, config]) => (
            <Badge
              key={key}
              variant={selectedPriorities.includes(key) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => togglePriority(key)}
            >
              <div
                className="mr-1 h-2 w-2 rounded-full"
                style={{ backgroundColor: config.color }}
              />
              {config.label}
            </Badge>
          ))}
        </div>
        {(selectedPriorities.length > 0 || selectedStatuses.length > 0) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-7"
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Results */}
      {query.trim() ? (
        <>
          <div className="text-sm text-muted-foreground">
            {totalResults} result{totalResults !== 1 ? "s" : ""} for &quot;{query}&quot;
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as SearchTab)}
          >
            <TabsList>
              <TabsTrigger value="all">
                All ({totalResults})
              </TabsTrigger>
              <TabsTrigger value="tasks">
                Tasks ({searchResults.tasks.length})
              </TabsTrigger>
              <TabsTrigger value="spaces">
                Spaces ({searchResults.spaces.length + searchResults.lists.length})
              </TabsTrigger>
              <TabsTrigger value="people">
                People ({searchResults.people.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4 space-y-6">
              {/* Tasks */}
              {searchResults.tasks.length > 0 && (
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    Tasks
                  </h3>
                  <div className="space-y-2">
                    {searchResults.tasks.slice(0, 5).map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onClick={() => setActiveTask(task.id)}
                        variant="list"
                      />
                    ))}
                    {searchResults.tasks.length > 5 && (
                      <Button
                        variant="ghost"
                        className="w-full"
                        onClick={() => setActiveTab("tasks")}
                      >
                        View all {searchResults.tasks.length} tasks
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Spaces & Lists */}
              {(searchResults.spaces.length > 0 ||
                searchResults.lists.length > 0) && (
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <FolderKanban className="h-4 w-4" />
                    Spaces & Lists
                  </h3>
                  <div className="grid gap-2 md:grid-cols-2">
                    {searchResults.spaces.map((space) => (
                      <div
                        key={space.id}
                        className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                      >
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded"
                          style={{ backgroundColor: space.color }}
                        >
                          <span className="text-sm font-bold text-white">
                            {space.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{space.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {space.memberIds.length} members
                          </p>
                        </div>
                      </div>
                    ))}
                    {searchResults.lists.map((list) => (
                      <Link
                        key={list.id}
                        href={`/list/${list.id}`}
                        className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded bg-muted">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">{list.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {tasks.filter((t) => t.listId === list.id).length}{" "}
                            tasks
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* People */}
              {searchResults.people.length > 0 && (
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Users className="h-4 w-4" />
                    People
                  </h3>
                  <div className="grid gap-2 md:grid-cols-2">
                    {searchResults.people.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                      >
                        <Avatar>
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                        <Badge variant="secondary" className="ml-auto">
                          {user.role}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="tasks" className="mt-4">
              <div className="space-y-2">
                {searchResults.tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={() => setActiveTask(task.id)}
                    variant="list"
                  />
                ))}
                {searchResults.tasks.length === 0 && (
                  <p className="py-8 text-center text-muted-foreground">
                    No tasks found
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="spaces" className="mt-4">
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {searchResults.spaces.map((space) => (
                  <div
                    key={space.id}
                    className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded"
                      style={{ backgroundColor: space.color }}
                    >
                      <span className="font-bold text-white">
                        {space.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{space.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {space.memberIds.length} members
                      </p>
                    </div>
                  </div>
                ))}
                {searchResults.lists.map((list) => (
                  <Link
                    key={list.id}
                    href={`/list/${list.id}`}
                    className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{list.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {tasks.filter((t) => t.listId === list.id).length} tasks
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="people" className="mt-4">
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {searchResults.people.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 rounded-lg border p-4"
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                    <Badge variant="secondary">{user.role}</Badge>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <h3 className="text-lg font-medium">Start searching</h3>
          <p className="text-muted-foreground">
            Type something to search across tasks, spaces, and people.
          </p>
        </div>
      )}
    </div>
  );
}
