import { api } from "./client";

export interface StandupRow {
  id:          string;
  employeeId:  string;
  date:        string;
  draftText:   string;
  status:      "pending" | "sent" | "skipped";
  model:       string | null;
  generatedAt: string;
  sentAt:      string | null;
  editedAt:    string | null;
  /** Only present in /standups/team responses */
  employeeName?: string | null;
}

export interface StandupContext {
  employee: { id: string; name: string; code: string | null };
  yesterday: {
    date: string;
    completedTasks:  Array<{ displayId: string | null; title: string; statusName: string | null; minutes: number }>;
    inProgressTasks: Array<{ displayId: string | null; title: string; statusName: string | null }>;
    timeMinutes:     number;
    timeSessions:    number;
    commentsLeft:    number;
    incomingMentionsUnread: Array<unknown>;
  };
  today: {
    date: string;
    plannedTasks: Array<{ displayId: string | null; title: string; statusName: string | null; deadline: string | null; priority: string }>;
    onLeave:      boolean;
  };
  blockers: {
    overdueCount:      number;
    waitingOnComment:  Array<unknown>;
    pendingExtensions: number;
  };
}

export interface MyStandupResponse extends StandupRow {
  context: StandupContext;
}

export const standupsApi = {
  /** GET /standups/today — auto-generates if missing */
  today: () => api.get<MyStandupResponse>("/standups/today"),

  /** POST /standups/regenerate — force new draft */
  regenerate: () => api.post<StandupRow>("/standups/regenerate", {}),

  /** PATCH /standups/:id — edit draft */
  update: (id: string, draftText: string) =>
    api.patch<StandupRow>(`/standups/${id}`, { draftText }),

  /** POST /standups/:id/send */
  send: (id: string) => api.post<StandupRow>(`/standups/${id}/send`, {}),

  /** POST /standups/:id/skip */
  skip: (id: string) => api.post<StandupRow>(`/standups/${id}/skip`, {}),

  /** GET /standups/team?date= — manager/admin team view */
  team: (date?: string) =>
    api.get<StandupRow[]>(`/standups/team${date ? `?date=${date}` : ""}`),

  // ── Settings (admin) ──────────────────────────────────────────────────────
  getSettings: () => api.get<StandupSettings>("/standups/settings"),
  updateSettings: (s: Partial<StandupSettings>) =>
    api.put<StandupSettings>("/standups/settings", s),
  runNow: () =>
    api.post<{ generated: number; skipped: number; failed: number }>("/standups/run-now", {}),
};

export interface StandupSettings {
  enabled:         boolean;
  sendTime:        string;     // "HH:MM:SS" or "HH:MM"
  sendDays:        number[];   // ISO weekday 1=Mon..7=Sun
  respectWorkDays: boolean;
}
