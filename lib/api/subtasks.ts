import { api } from "./client";

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  isDone: boolean;
  doneAt: string | null;
  doneBy: string | null;
  doneByName: string | null;
  doneByAvatar: string | null;
  orderIndex: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubtaskPayload {
  title: string;
}

export interface UpdateSubtaskPayload {
  title?: string;
  isDone?: boolean;
  orderIndex?: number;
}

export const subtasksApi = {
  list:    (taskId: string) => api.get<Subtask[]>(`/tasks/${taskId}/subtasks`),
  create:  (taskId: string, data: CreateSubtaskPayload) => api.post<Subtask>(`/tasks/${taskId}/subtasks`, data),
  update:  (taskId: string, subtaskId: string, data: UpdateSubtaskPayload) => api.put<Subtask>(`/tasks/${taskId}/subtasks/${subtaskId}`, data),
  toggle:  (taskId: string, subtaskId: string) => api.patch<Subtask>(`/tasks/${taskId}/subtasks/${subtaskId}/toggle`, {}),
  delete:  (taskId: string, subtaskId: string) => api.delete<null>(`/tasks/${taskId}/subtasks/${subtaskId}`),
  reorder: (taskId: string, orderedIds: string[]) => api.patch<Subtask[]>(`/tasks/${taskId}/subtasks/reorder`, { orderedIds }),
};
