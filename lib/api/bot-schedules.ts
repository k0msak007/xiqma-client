import { api } from "./client";

export interface BotSchedule {
  id:                string;
  name:              string;
  description:       string | null;
  enabled:           boolean;
  sendTime:          string;            // "HH:MM" or "HH:MM:SS"
  sendDays:          number[];          // ISO 1..7
  sendDayOfMonth:    number | null;
  audienceType:      "all" | "role" | "employee";
  audienceValues:    string[];
  respectWorkDays:   boolean;
  mode:              "static" | "ai";
  titleTemplate:     string;
  bodyTemplate:      string;
  contextKind:       "today" | "yesterday" | "week" | "morning_briefing" | "leave_reminder" | "time_reminder" | "none";
  channels:          string[];
  notifType:         string;
  deepLink:          string | null;
  createdAt:         string;
  updatedAt:         string;
}

export type BotScheduleInput = Omit<BotSchedule, "id" | "createdAt" | "updatedAt">;

export const botSchedulesApi = {
  list:    () => api.get<BotSchedule[]>("/bot-schedules"),
  get:     (id: string) => api.get<BotSchedule>(`/bot-schedules/${id}`),
  create:  (body: BotScheduleInput) => api.post<BotSchedule>("/bot-schedules", body),
  update:  (id: string, body: BotScheduleInput) => api.put<BotSchedule>(`/bot-schedules/${id}`, body),
  remove:  (id: string) => api.delete<null>(`/bot-schedules/${id}`),
  runNow:  (id: string) =>
    api.post<{ recipients: number; failed: number }>(`/bot-schedules/${id}/run-now`, {}),
};
