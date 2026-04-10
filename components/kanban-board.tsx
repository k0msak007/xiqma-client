"use client";

import { useMemo } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { Plus, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TaskCard } from "@/components/task-card";
import { useTaskStore } from "@/lib/store";
import type { Status, Task } from "@/lib/types";

interface KanbanBoardProps {
  listId: string;
  statuses: Status[];
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
  selectedTaskId?: string;
}

export function KanbanBoard({
  listId,
  statuses,
  tasks,
  onTaskClick,
  selectedTaskId,
}: KanbanBoardProps) {
  const { updateTaskStatus, reorderTasks, addTask } = useTaskStore();

  // Group tasks by status
  const columns = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    statuses.forEach((status) => {
      grouped[status.id] = tasks
        .filter((t) => t.statusId === status.id)
        .sort((a, b) => a.order - b.order);
    });
    return grouped;
  }, [tasks, statuses]);

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Dropped outside a droppable area
    if (!destination) return;

    // Dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceStatusId = source.droppableId;
    const destStatusId = destination.droppableId;

    // Get source and destination column tasks
    const sourceTasks = [...columns[sourceStatusId]];
    const destTasks =
      sourceStatusId === destStatusId
        ? sourceTasks
        : [...columns[destStatusId]];

    // Find the task being moved
    const [movedTask] = sourceTasks.splice(source.index, 1);

    // If moving to a different column
    if (sourceStatusId !== destStatusId) {
      destTasks.splice(destination.index, 0, movedTask);

      // Update task status and order
      updateTaskStatus(draggableId, destStatusId);

      // Reorder destination column
      const orderedDestTaskIds = destTasks.map((t) => t.id);
      reorderTasks(listId, destStatusId, orderedDestTaskIds);

      // Reorder source column
      const orderedSourceTaskIds = sourceTasks.map((t) => t.id);
      reorderTasks(listId, sourceStatusId, orderedSourceTaskIds);
    } else {
      // Moving within the same column
      sourceTasks.splice(destination.index, 0, movedTask);
      const orderedTaskIds = sourceTasks.map((t) => t.id);
      reorderTasks(listId, sourceStatusId, orderedTaskIds);
    }
  };

  const handleAddTask = (statusId: string) => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: "New Task",
      statusId,
      priority: "normal",
      assigneeIds: [],
      creatorId: "user-1",
      listId,
      tags: [],
      subtasks: [],
      comments: [],
      attachments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      order: columns[statusId]?.length || 0,
    };
    addTask(newTask);
    onTaskClick(newTask.id);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <ScrollArea className="h-full w-full">
        <div className="flex gap-4 p-4">
          {statuses.map((status) => {
            const columnTasks = columns[status.id] || [];

            return (
              <div
                key={status.id}
                className="flex w-[300px] shrink-0 flex-col rounded-lg bg-muted/30"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: status.color }}
                    />
                    <span className="text-sm font-medium">{status.name}</span>
                    <Badge
                      variant="secondary"
                      className="h-5 px-1.5 text-xs font-normal"
                    >
                      {columnTasks.length}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleAddTask(status.id)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Rename</DropdownMenuItem>
                        <DropdownMenuItem>Set WIP Limit</DropdownMenuItem>
                        <DropdownMenuItem>Hide Column</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Column Content */}
                <Droppable droppableId={status.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        "flex-1 space-y-2 px-2 pb-2",
                        "min-h-[200px]",
                        snapshot.isDraggingOver && "bg-muted/50"
                      )}
                    >
                      {columnTasks.map((task, index) => (
                        <Draggable
                          key={task.id}
                          draggableId={task.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={cn(
                                snapshot.isDragging && "opacity-80 shadow-lg"
                              )}
                            >
                              <TaskCard
                                task={task}
                                onClick={() => onTaskClick(task.id)}
                                isSelected={task.id === selectedTaskId}
                                variant="board"
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}

                      {/* Add Task Button at bottom */}
                      {columnTasks.length === 0 && (
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-muted-foreground"
                          onClick={() => handleAddTask(status.id)}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add task
                        </Button>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}

          {/* Add Column */}
          <div className="flex w-[300px] shrink-0 items-start">
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Status
            </Button>
          </div>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </DragDropContext>
  );
}
