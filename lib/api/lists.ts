import { api } from "./client";

export type StatusType = "open" | "in_progress" | "review" | "done" | "closed";

export interface ListStatus {
  id: string;
  listId: string;
  name: string;
  color: string;
  displayOrder: number;
  type: StatusType;
}

export interface List {
  id: string;
  name: string;
  spaceId: string;
  folderId?: string;
  color?: string;
  displayOrder: number;
  taskCount: number;
  doneCount: number;
  statuses: ListStatus[];
  createdAt: string;
}

export interface CreateListPayload {
  name: string;
  spaceId: string;
  folderId?: string;
  color?: string;
}

export interface UpdateListPayload {
  name?: string;
  color?: string;
  displayOrder?: number;
}

export interface CreateStatusPayload {
  name: string;
  color: string;
  type: StatusType;
}

export interface UpdateStatusPayload {
  name?: string;
  color?: string;
  type?: StatusType;
}

export const listsApi = {
  list: (spaceId: string, folderId?: string) => {
    const params = new URLSearchParams({ spaceId });
    if (folderId !== undefined) {
      params.set("folderId", folderId);
    }
    return api.get<List[]>(`/lists?${params.toString()}`);
  },
  create: (payload: CreateListPayload) => api.post<List>("/lists", payload),
  update: (id: string, payload: UpdateListPayload) => api.put<List>(`/lists/${id}`, payload),
  delete: (id: string) => api.delete<null>(`/lists/${id}`),
  getStatuses: (listId: string) => api.get<ListStatus[]>(`/lists/${listId}/statuses`),
  createStatus: (listId: string, payload: CreateStatusPayload) =>
    api.post<ListStatus>(`/lists/${listId}/statuses`, payload),
  updateStatus: (listId: string, statusId: string, payload: UpdateStatusPayload) =>
    api.put<ListStatus>(`/lists/${listId}/statuses/${statusId}`, payload),
  deleteStatus: (listId: string, statusId: string) =>
    api.delete<null>(`/lists/${listId}/statuses/${statusId}`),
  reorderStatuses: (listId: string, orderedIds: string[]) =>
    api.put<null>(`/lists/${listId}/statuses/reorder`, { orderedIds }),
};
