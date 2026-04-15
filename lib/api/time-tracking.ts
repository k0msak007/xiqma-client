import { api } from "./client";

export interface TimeSession {
  id: string;
  taskId: string;
  employeeId: string;
  employeeName: string;
  startedAt: string;
  endedAt: string | null;
  durationMin: number | null;
  note: string | null;
}

export const timeTrackingApi = {
  start:    (taskId: string) => api.post<TimeSession>(`/tasks/${taskId}/time/start`, {}),
  pause:    (taskId: string) => api.post<TimeSession>(`/tasks/${taskId}/time/pause`, {}),
  complete: (taskId: string) => api.post<null>(`/tasks/${taskId}/time/complete`, {}),
  list:     (taskId: string) => api.get<TimeSession[]>(`/tasks/${taskId}/time`),
};
