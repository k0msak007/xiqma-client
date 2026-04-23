import { api } from "./client";

export interface ReworkEvent {
  id: string;
  taskId: string;
  fromStatusId: string | null;
  toStatusId: string | null;
  fromStatusName: string | null;
  toStatusName: string | null;
  reason: string;
  requestedBy: string;
  requestedByName: string | null;
  requestedByAvatar: string | null;
  createdAt: string;
}

export const reworkApi = {
  list:   (taskId: string) => api.get<ReworkEvent[]>(`/tasks/${taskId}/rework`),
  create: (taskId: string, data: { toStatusId: string; reason: string }) =>
            api.post<ReworkEvent>(`/tasks/${taskId}/rework`, data),
};
