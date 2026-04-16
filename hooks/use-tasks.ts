"use client";

import { useState, useCallback } from "react";
import {
  tasksApi,
  type ApiTaskRow,
  type ApiTaskDetail,
  type CreateTaskPayload,
  type UpdateTaskPayload,
  type UpdateTaskStatusPayload,
  type ReorderTasksPayload,
} from "@/lib/api/tasks";

interface UseTasksOptions {
  initialData?: ApiTaskRow[];
}

export function useTasks(options: UseTasksOptions = {}) {
  const [tasks,     setTasks]     = useState<ApiTaskRow[]>(options.initialData ?? []);
  const [task,      setTask]      = useState<ApiTaskDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const fetchTasks = useCallback(async (params: Parameters<typeof tasksApi.list>[0]) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await tasksApi.list(params);
      setTasks(response.data);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch tasks");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchTask = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await tasksApi.get(id);
      setTask(response);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch task");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createTask = useCallback(async (data: CreateTaskPayload) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await tasksApi.create(data);
      setTask(response);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateTask = useCallback(async (id: string, data: UpdateTaskPayload) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await tasksApi.update(id, data);
      if (task?.id === id) setTask(response);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [task?.id]);

  const updateTaskStatus = useCallback(async (id: string, data: UpdateTaskStatusPayload) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await tasksApi.updateStatus(id, data);
      if (task?.id === id) setTask(response);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task status");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [task?.id]);

  const reorderTasks = useCallback(async (data: ReorderTasksPayload) => {
    setIsLoading(true);
    setError(null);
    try {
      await tasksApi.reorder(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reorder tasks");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await tasksApi.delete(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete task");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    tasks,
    task,
    isLoading,
    error,
    fetchTasks,
    fetchTask,
    createTask,
    updateTask,
    updateTaskStatus,
    reorderTasks,
    deleteTask,
  };
}
