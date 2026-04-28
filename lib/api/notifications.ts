import { api } from "./client";

export interface NotificationItem {
  id: string;
  taskId: string | null;
  notifType: string;
  message: string | null;
  title: string | null;
  deepLink: string | null;
  relatedType: string | null;
  relatedId: string | null;
  actorId: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  taskTitle: string | null;
  taskDisplayId: string | null;
}

export interface ListNotificationsParams {
  unread?: boolean;
  page?: number;
  limit?: number;
}

function buildQuery(params: ListNotificationsParams = {}) {
  const qs = new URLSearchParams();
  if (params.unread !== undefined) qs.set("unread", String(params.unread));
  if (params.page)  qs.set("page",  String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export interface NotificationPref {
  eventType: string;
  channel:   "in_app" | "line" | "email";
  enabled:   boolean;
}

export interface QuietHours {
  start: string; // "HH:MM"
  end:   string;
}

export const notificationsApi = {
  list: (params?: ListNotificationsParams) =>
    api.get<NotificationItem[]>(`/notifications${buildQuery(params)}`),

  markRead: (id: string) =>
    api.patch<NotificationItem>(`/notifications/${id}/read`, {}),

  markAllRead: () =>
    api.patch<{ updated: number }>(`/notifications/read-all`, {}),

  // Preferences
  getPrefs:    () => api.get<NotificationPref[]>(`/notifications/prefs`),
  updatePrefs: (items: NotificationPref[]) =>
    api.put<NotificationPref[]>(`/notifications/prefs`, { items }),

  getQuietHours: () => api.get<QuietHours | null>(`/notifications/quiet-hours`),
  setQuietHours: (start: string, end: string) =>
    api.put<QuietHours>(`/notifications/quiet-hours`, { start, end }),
};
