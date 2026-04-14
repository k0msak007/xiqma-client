import { api } from "./client";

export interface Task {
  id: string;
  displayId: string;
  title: string;
  description: string | null;
  priority: "low" | "normal" | "high" | "urgent";
  status: string;
  assigneeId: string | null;
  listId: string;
  storyPoints: number | null;
  deadline: string | null;
  createdAt: string;
}

export interface TaskDetail extends Task {
  listStatusId: string;
  taskTypeId: string | null;
  creatorId: string;
  timeEstimateHours: number | null;
  planStart: string | null;
  durationDays: number | null;
  planFinish: string | null;
  accumulatedMinutes: number;
  actualHours: number;
  tags: string[];
  updatedAt: string;
}

export interface CreateTaskPayload {
  title: string;
  listId: string;
  assigneeId: string;
  description?: string;
  listStatusId?: string;
  taskTypeId?: string;
  priority?: "low" | "normal" | "high" | "urgent";
  storyPoints?: number;
  timeEstimateHours?: number;
  planStart?: string;
  durationDays?: number;
  deadline?: string;
  tags?: string[];
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  listStatusId?: string;
  taskTypeId?: string;
  priority?: "low" | "normal" | "high" | "urgent";
  assigneeId?: string;
  storyPoints?: number;
  timeEstimateHours?: number;
  planStart?: string;
  durationDays?: number;
  deadline?: string;
  tags?: string[];
}

export interface UpdateTaskStatusPayload {
  listStatusId: string;
  status?: string;
}

export interface ReorderTasksPayload {
  listId: string;
  statusId: string;
  orderedTaskIds: string[];
}

export interface TaskListResponse {
  rows: Task[];
  total: number;
  totalPages: number;
}

export const tasksApi = {
  list: (params?: {
    listId?: string;
    statusId?: string;
    assigneeId?: string;
    priority?: string;
    search?: string;
    page?: number;
    limit?: number;
    sort?: string;
    order?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.listId)     query.set("listId", params.listId);
    if (params?.statusId)    query.set("statusId", params.statusId);
    if (params?.assigneeId) query.set("assigneeId", params.assigneeId);
    if (params?.priority) query.set("priority", params.priority);
    if (params?.search)   query.set("search", params.search);
    if (params?.page)    query.set("page", String(params.page));
    if (params?.limit)   query.set("limit", String(params.limit));
    if (params?.sort)    query.set("sort", params.sort);
    if (params?.order)   query.set("order", params.order);
    return api.get<TaskListResponse>(`/tasks?${query.toString()}`);
  },
  get:         (id: string) => api.get<TaskDetail>(`/tasks/${id}`),
  create:      (data: CreateTaskPayload) => api.post<Task>("/tasks", data),
  update:      (id: string, data: UpdateTaskPayload) => api.put<Task>(`/tasks/${id}`, data),
  updateStatus: (id: string, data: UpdateTaskStatusPayload) => api.patch<Task>(`/tasks/${id}/status`, data),
  reorder:    (data: ReorderTasksPayload) => api.post<null>("/tasks/reorder", data),
  delete:     (id: string) => api.delete<null>(`/tasks/${id}`),
};