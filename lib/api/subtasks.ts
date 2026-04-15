import { api } from "./client";

export interface Subtask {
  id: string;
  parentTaskId: string;
  title: string;
  isCompleted: boolean;
  assigneeId: string | null;
  assigneeName: string | null;
  displayOrder: number;
  createdAt: string;
}

export interface CreateSubtaskPayload {
  title: string;
  assigneeId?: string;
}

export interface UpdateSubtaskPayload {
  title?: string;
  assigneeId?: string | null;
  displayOrder?: number;
}

export const subtasksApi = {
  list:   (taskId: string) => api.get<Subtask[]>(`/tasks/${taskId}/subtasks`),
  create: (taskId: string, data: CreateSubtaskPayload) => api.post<Subtask>(`/tasks/${taskId}/subtasks`, data),
  update: (taskId: string, subtaskId: string, data: UpdateSubtaskPayload) => api.put<Subtask>(`/tasks/${taskId}/subtasks/${subtaskId}`, data),
  toggle: (taskId: string, subtaskId: string) => api.patch<Subtask>(`/tasks/${taskId}/subtasks/${subtaskId}/toggle`, {}),
  delete: (taskId: string, subtaskId: string) => api.delete<null>(`/tasks/${taskId}/subtasks/${subtaskId}`),
};
