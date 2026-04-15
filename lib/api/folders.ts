import { api } from "./client";

export interface Folder {
  id: string;
  name: string;
  spaceId: string;
  color?: string;
  displayOrder: number;
  isArchived: boolean;
  archivedAt?: string;
  listCount: number;
  createdAt: string;
}

export interface CreateFolderPayload {
  name: string;
  spaceId: string;
  color?: string;
}

export interface UpdateFolderPayload {
  name?: string;
  color?: string;
  displayOrder?: number;
}

export const foldersApi = {
  list: (spaceId: string, includeArchived?: boolean) => {
    const params = new URLSearchParams({ spaceId });
    if (includeArchived !== undefined) {
      params.set("includeArchived", String(includeArchived));
    }
    return api.get<Folder[]>(`/folders?${params.toString()}`);
  },
  create: (payload: CreateFolderPayload) => api.post<Folder>("/folders", payload),
  update: (id: string, payload: UpdateFolderPayload) => api.put<Folder>(`/folders/${id}`, payload),
  archive: (id: string) => api.patch<Folder>(`/folders/${id}/archive`, {}),
  restore: (id: string) => api.patch<Folder>(`/folders/${id}/restore`, {}),
  delete: (id: string) => api.delete<null>(`/folders/${id}`),
};
