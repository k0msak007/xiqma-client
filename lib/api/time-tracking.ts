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

export interface DailyTimeRow {
  employeeId: string;
  taskId: string;
  day: string;          // YYYY-MM-DD
  durationMin: number;
  taskTitle: string;
  taskDisplayId: string | null;
  status: string;
  statusName: string | null;
  statusColor: string | null;
}

export const timeTrackingApi = {
  daily: (start: string, end: string) =>
    api.get<DailyTimeRow[]>(`/tasks/time/daily?start=${start}&end=${end}`),
  start:    (taskId: string) => api.post<TimeSession>(`/tasks/${taskId}/time/start`, {}),
  pause:    (taskId: string) => api.post<TimeSession>(`/tasks/${taskId}/time/pause`, {}),
  complete: (taskId: string) => api.post<null>(`/tasks/${taskId}/time/complete`, {}),
  list:     (taskId: string) => api.get<TimeSession[]>(`/tasks/${taskId}/time`),
  log:      (taskId: string, data: { durationMin: number; note?: string; startedAt?: string }) =>
              api.post<TimeSession>(`/tasks/${taskId}/time/log`, data),
  deleteSession: (taskId: string, sessionId: string) =>
              api.delete<null>(`/tasks/${taskId}/time/${sessionId}`),
};
