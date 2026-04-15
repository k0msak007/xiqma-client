import { api } from "./client";

export interface ExtensionRequest {
  id: string;
  displayId: string;
  taskId: string;
  taskTitle?: string;
  requestedBy: string;
  requesterName: string;
  reviewedBy: string | null;
  reviewerName: string | null;
  newDeadline: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  reviewedAt: string | null;
  rejectReason: string | null;
  createdAt: string;
}

export interface CreateExtensionPayload { newDeadline: string; reason: string; }
export interface RejectExtensionPayload { rejectReason: string; }

export const extensionRequestsApi = {
  listForTask: (taskId: string) => api.get<ExtensionRequest[]>(`/tasks/${taskId}/extension-requests`),
  createForTask: (taskId: string, data: CreateExtensionPayload) => api.post<ExtensionRequest>(`/tasks/${taskId}/extension-requests`, data),
  list: (status?: string) => {
    const q = status ? `?status=${status}` : "";
    return api.get<ExtensionRequest[]>(`/extension-requests${q}`);
  },
  approve: (id: string) => api.patch<ExtensionRequest>(`/extension-requests/${id}/approve`, {}),
  reject:  (id: string, data: RejectExtensionPayload) => api.patch<ExtensionRequest>(`/extension-requests/${id}/reject`, data),
};
