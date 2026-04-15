import { api } from "./client";

export interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  commentText: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateCommentPayload { commentText: string; }
export interface UpdateCommentPayload { commentText: string; }

export const commentsApi = {
  list:   (taskId: string) => api.get<Comment[]>(`/tasks/${taskId}/comments`),
  create: (taskId: string, data: CreateCommentPayload) => api.post<Comment>(`/tasks/${taskId}/comments`, data),
  update: (taskId: string, commentId: string, data: UpdateCommentPayload) => api.put<Comment>(`/tasks/${taskId}/comments/${commentId}`, data),
  delete: (taskId: string, commentId: string) => api.delete<null>(`/tasks/${taskId}/comments/${commentId}`),
};
