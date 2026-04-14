import { api } from "./client";

export interface Holiday {
  id: string;
  name: string;
  holidayDate: string; // YYYY-MM-DD
  isRecurring: boolean;
  note: string | null;
  createdAt: string;
}

export interface CreateHolidayPayload {
  name: string;
  holidayDate: string;
  isRecurring?: boolean;
  note?: string;
}

export interface WorkingDaysResponse {
  workingDays: number;
}

export const holidaysApi = {
  list:   (year?: number) => api.get<Holiday[]>(`/holidays${year ? `?year=${year}` : ""}`),
  get:    (id: string) => api.get<Holiday>(`/holidays/${id}`),
  create: (data: CreateHolidayPayload) => api.post<Holiday>("/holidays", data),
  update: (id: string, data: Partial<CreateHolidayPayload>) => api.put<Holiday>(`/holidays/${id}`, data),
  delete: (id: string) => api.delete<null>(`/holidays/${id}`),
  getWorkingDays: (start: string, end: string) =>
    api.get<WorkingDaysResponse>(`/holidays/working-days?start=${start}&end=${end}`),
};
