"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Search, Filter, X, FileText, Users, FolderKanban } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { searchApi, type SearchResult } from "@/lib/api/search";
import { priorityConfig } from "@/lib/types";

type SearchTab = "all" | "tasks" | "spaces" | "people";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<SearchTab>("all");
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const activeTypes =
          activeTab === "all"
            ? undefined
            : activeTab === "tasks"
            ? "task"
            : activeTab === "spaces"
            ? "space"
            : "employee";
        const res = await searchApi.search(query, activeTypes, 30);
        setResults(res);
      } catch {
        /* silent */
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query, activeTab]);

  // Derive typed result groups
  const searchResults = useMemo(
    () => ({
      tasks: results.filter(
        (r) =>
          r.type === "task" &&
          (selectedPriorities.length === 0 ||
            (r.priority && selectedPriorities.includes(r.priority)))
      ),
      spaces: results.filter((r) => r.type === "space"),
      people: results.filter((r) => r.type === "employee"),
    }),
    [results, selectedPriorities]
  );

  const totalResults =
    searchResults.tasks.length +
    searchResults.spaces.length +
    searchResults.people.length;

  const togglePriority = (priority: string) => {
    setSelectedPriorities((prev) =>
      prev.includes(priority)
        ? prev.filter((p) => p !== priority)
        : [...prev, priority]
    );
  };

  const clearFilters = () => {
    setSelectedPriorities([]);
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
        {selectedPriorities.length > 0 && (
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
      {query.length >= 2 ? (
        <>
          <div className="text-sm text-muted-foreground">
            {searching
              ? "Searching..."
              : `${totalResults} result${totalResults !== 1 ? "s" : ""} for "${query}"`}
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as SearchTab)}
          >
            <TabsList>
              <TabsTrigger value="all">All ({totalResults})</TabsTrigger>
              <TabsTrigger value="tasks">
                Tasks ({searchResults.tasks.length})
              </TabsTrigger>
              <TabsTrigger value="spaces">
                Spaces ({searchResults.spaces.length})
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
                    {searchResults.tasks.slice(0, 5).map((result) => (
                      <SearchResultItem key={result.id} result={result} />
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

              {/* Spaces */}
              {searchResults.spaces.length > 0 && (
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <FolderKanban className="h-4 w-4" />
                    Spaces
                  </h3>
                  <div className="grid gap-2 md:grid-cols-2">
                    {searchResults.spaces.map((result) => (
                      <SearchResultItem key={result.id} result={result} />
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
                    {searchResults.people.map((result) => (
                      <SearchResultItem key={result.id} result={result} />
                    ))}
                  </div>
                </div>
              )}

              {!searching && totalResults === 0 && (
                <p className="py-8 text-center text-muted-foreground">
                  No results found for &quot;{query}&quot;
                </p>
              )}
            </TabsContent>

            <TabsContent value="tasks" className="mt-4">
              <div className="space-y-2">
                {searchResults.tasks.map((result) => (
                  <SearchResultItem key={result.id} result={result} />
                ))}
                {searchResults.tasks.length === 0 && !searching && (
                  <p className="py-8 text-center text-muted-foreground">
                    No tasks found
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="spaces" className="mt-4">
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {searchResults.spaces.map((result) => (
                  <SearchResultItem key={result.id} result={result} />
                ))}
                {searchResults.spaces.length === 0 && !searching && (
                  <p className="py-8 text-center text-muted-foreground col-span-3">
                    No spaces found
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="people" className="mt-4">
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {searchResults.people.map((result) => (
                  <SearchResultItem key={result.id} result={result} />
                ))}
                {searchResults.people.length === 0 && !searching && (
                  <p className="py-8 text-center text-muted-foreground col-span-3">
                    No people found
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <h3 className="text-lg font-medium">Start searching</h3>
          <p className="text-muted-foreground">
            Type at least 2 characters to search across tasks, spaces, and people.
          </p>
        </div>
      )}
    </div>
  );
}

// Generic result card component
function SearchResultItem({ result }: { result: SearchResult }) {
  const content = (
    <div className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
      {result.type === "employee" ? (
        <Avatar className="h-9 w-9">
          <AvatarImage src={result.avatar} />
          <AvatarFallback>{result.title.charAt(0)}</AvatarFallback>
        </Avatar>
      ) : result.type === "space" ? (
        <div className="flex h-9 w-9 items-center justify-center rounded bg-primary/10">
          <FolderKanban className="h-4 w-4 text-primary" />
        </div>
      ) : (
        <div className="flex h-9 w-9 items-center justify-center rounded bg-muted">
          <FileText className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{result.title}</p>
        {result.subtitle && (
          <p className="text-xs text-muted-foreground truncate">
            {result.subtitle}
          </p>
        )}
      </div>
      {result.priority && (
        <Badge variant="outline" className="text-xs shrink-0">
          {result.priority}
        </Badge>
      )}
      {result.status && (
        <Badge variant="secondary" className="text-xs shrink-0">
          {result.status}
        </Badge>
      )}
    </div>
  );

  if (result.url) {
    return (
      <Link href={result.url} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
