import { api, apiRequest } from "./client";

export interface Attachment {
  id: string;
  taskId: string;
  uploadedBy: string;
  uploaderName: string;
  fileUrl: string;
  fileName: string | null;
  fileDescription: string | null;
  fileSizeBytes: number | null;
  mimeType: string | null;
  createdAt: string;
}

export const attachmentsApi = {
  list:   (taskId: string) => api.get<Attachment[]>(`/tasks/${taskId}/attachments`),
  upload: (taskId: string, file: File, description?: string) => {
    const form = new FormData();
    form.append("file", file);
    if (description) form.append("description", description);
    return apiRequest<Attachment>(`/tasks/${taskId}/attachments`, { method: "POST", body: form });
  },
  delete: (taskId: string, attachmentId: string) => api.delete<null>(`/tasks/${taskId}/attachments/${attachmentId}`),
};
