import { api } from "./client";

export interface WorkSchedule {
  id: string;
  name: string;
  daysPerWeek: string;
  hoursPerDay: string;
  hoursPerWeek: string | null;
  workDays: number[];
  workStartTime: string;
  workEndTime: string;
  isDefault: boolean;
  createdAt: string;
}

export interface CreateWorkSchedulePayload {
  name: string;
  daysPerWeek?: number;
  hoursPerDay?: number;
  workDays?: number[];
  workStartTime?: string;
  workEndTime?: string;
  isDefault?: boolean;
}

export const workSchedulesApi = {
  list:   () => api.get<WorkSchedule[]>("/work-schedules"),
  get:    (id: string) => api.get<WorkSchedule>(`/work-schedules/${id}`),
  create: (data: CreateWorkSchedulePayload) => api.post<WorkSchedule>("/work-schedules", data),
  update: (id: string, data: Partial<CreateWorkSchedulePayload>) => api.put<WorkSchedule>(`/work-schedules/${id}`, data),
  delete: (id: string) => api.delete<null>(`/work-schedules/${id}`),
};
