import { api } from "./client";

// ─── Response types from API (snake_case from raw SQL joins) ──────────────────

/** Task row from GET /tasks (list view) — includes joined fields */
export interface ApiTaskRow {
  id: string;
  display_id: string;
  title: string;
  description: string | null;
  list_id: string;
  list_status_id: string | null;
  task_type_id: string | null;
  priority: "low" | "normal" | "high" | "urgent";
  assignee_id: string;
  creator_id: string;
  source: string;
  story_points: number | null;
  manday_estimate: number | null;
  time_estimate_hours: number | null;
  accumulated_minutes: number;
  actual_hours: number;
  plan_start: string | null;
  duration_days: number | null;
  plan_finish: string | null;
  deadline: string | null;
  started_at: string | null;
  completed_at: string | null;
  status: string;
  display_order: number;
  estimate_progress: number | null;
  blocked_note: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  // Joined fields
  status_name: string | null;
  status_color: string | null;
  status_type: string | null;
  assignee_name: string;
  assignee_avatar: string | null;
  creator_name: string;
  subtask_count: number;
  comment_count: number;
  attachment_count: number;
}

export interface ApiTaskListResponse {
  data: ApiTaskRow[];
  total: number;
}

/** Camelcase task detail from GET /tasks/:id */
export interface ApiTaskDetail {
  id: string;
  displayId: string;
  title: string;
  description: string | null;
  listId: string;
  listStatusId: string | null;
  taskTypeId: string | null;
  priority: "low" | "normal" | "high" | "urgent";
  assigneeId: string;
  creatorId: string;
  storyPoints: number | null;
  timeEstimateHours: number | null;
  accumulatedMinutes: number;
  actualHours: number;
  planStart: string | null;
  durationDays: number | null;
  planFinish: string | null;
  deadline: string | null;
  startedAt: string | null;
  completedAt: string | null;
  status: string;
  displayOrder: number;
  estimateProgress: number;
  blockedNote: string | null;
  reworkCount: number;
  lastReworkedAt: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  // joined
  statusName: string | null;
  statusColor: string | null;
  statusType: string | null;
  assigneeName: string | null;
  assigneeAvatar: string | null;
  creatorName: string | null;
  subtaskCount: number;
  commentCount: number;
  attachmentCount: number;
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
  planStart?: string;         // "YYYY-MM-DD"
  planFinish?: string;        // "YYYY-MM-DD"
  durationDays?: number;
  deadline?: string;          // ISO datetime
  tags?: string[];
  source?: string;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string | null;
  listStatusId?: string | null;
  taskTypeId?: string | null;
  priority?: "low" | "normal" | "high" | "urgent";
  assigneeId?: string;
  storyPoints?: number | null;
  timeEstimateHours?: number | null;
  planStart?: string | null;
  planFinish?: string | null;
  durationDays?: number | null;
  deadline?: string | null;
  tags?: string[];
  estimateProgress?: number | null;
  blockedNote?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
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

export interface MyTasksRow {
  id: string;
  display_id: string;
  title: string;
  list_id: string;
  list_status_id: string | null;
  priority: string;
  deadline: string | null;
  plan_start: string | null;
  duration_days: number | null;
  started_at: string | null;
  status: string;
  display_order: number;
  tags: string[];
  story_points: number | null;
  time_estimate_hours: number | null;
  accumulated_minutes: number;
  estimate_progress: number | null;
  created_at: string;
  updated_at: string;
  // joined
  status_name: string | null;
  status_color: string | null;
  status_type: string | null;
  assignee_name: string;
  assignee_avatar: string | null;
  assignee_id: string;
  creator_id: string;
  subtask_count: number;
  comment_count: number;
  attachment_count: number;
}

export interface CalendarTaskRow {
  id: string;
  display_id: string;
  title: string;
  list_id: string;
  list_status_id: string | null;
  priority: string;
  deadline: string | null;
  plan_start: string | null;
  plan_finish: string | null;
  duration_days: number | null;
  status: string;
  tags: string[];
  story_points: number | null;
  accumulated_minutes: number;
  time_estimate_hours: number | null;
  created_at: string;
  // joined
  status_name: string | null;
  status_color: string | null;
  status_type: string | null;
  task_type_id: string | null;
  task_type_name: string | null;
  task_type_color: string | null;
  list_name: string | null;
  assignee_name: string;
  assignee_avatar: string | null;
  assignee_id: string;
}

export const tasksApi = {
  list: (params: {
    listId: string;
    statusId?: string;
    assigneeId?: string;
    priority?: string;
    search?: string;
    page?: number;
    limit?: number;
    sort?: string;
  }) => {
    const q = new URLSearchParams({ listId: params.listId });
    if (params.statusId)   q.set("statusId",   params.statusId);
    if (params.assigneeId) q.set("assigneeId", params.assigneeId);
    if (params.priority)   q.set("priority",   params.priority);
    if (params.search)     q.set("search",     params.search);
    if (params.page)       q.set("page",       String(params.page));
    if (params.limit)      q.set("limit",      String(params.limit));
    if (params.sort)       q.set("sort",       params.sort);
    return api.get<ApiTaskListResponse>(`/tasks?${q.toString()}`);
  },
  myTasks: (range?: "today" | "week" | "month") => {
    const q = range ? `?range=${range}` : "";
    return api.get<MyTasksRow[]>(`/tasks/my${q}`);
  },
  calendar: (start: string, end: string) => {
    return api.get<CalendarTaskRow[]>(`/tasks/calendar?start=${start}&end=${end}`);
  },
  get:          (id: string) => api.get<ApiTaskDetail>(`/tasks/${id}`),
  create:       (data: CreateTaskPayload) => api.post<ApiTaskDetail>("/tasks", data),
  update:       (id: string, data: UpdateTaskPayload) => api.put<ApiTaskDetail>(`/tasks/${id}`, data),
  updateStatus: (id: string, data: UpdateTaskStatusPayload) => api.patch<ApiTaskDetail>(`/tasks/${id}/status`, data),
  move:         (id: string, toListId: string) => api.patch<ApiTaskDetail>(`/tasks/${id}/move`, { toListId }),
  reorder:      (data: ReorderTasksPayload) => api.put<null>("/tasks/reorder", data),
  delete:       (id: string) => api.delete<null>(`/tasks/${id}`),
  addTime:      (id: string, minutes: number) => api.put<ApiTaskDetail>(`/tasks/${id}`, { accumulatedMinutes: minutes }),
  
  // Timer (server-side)
  startTimer:  (id: string) => api.post<{ id: string; taskId: string; startedAt: string }>(`/tasks/${id}/time/start`, {}),
  stopTimer:   (id: string) => api.post<{ durationMin: number }>(`/tasks/${id}/time/pause`, {}),
  getTimer:    (id: string) => api.get<{ id: string; taskId: string; startedAt: string; endedAt: string | null }[]>(`/tasks/${id}/time`),
  getRunningTimers: () => api.get<{ id: string; taskId: string; startedAt: string }[]>(`/tasks/time/running`),
};
