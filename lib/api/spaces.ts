import { api } from "./client";

export interface Space {
  id: string;
  name: string;
  color: string;
  icon?: string;
  displayOrder: number;
  memberCount: number;
  listCount: number;
  createdAt: string;
}

export interface SpaceDetail extends Space {
  members: Array<{
    id: string;
    employeeId: string;
    joinedAt: string;
    employee: {
      id: string;
      name: string;
      email: string;
      avatarUrl?: string;
    };
  }>;
}

export interface CreateSpacePayload {
  name: string;
  color?: string;
  icon?: string;
  memberIds?: string[];
}

export interface UpdateSpacePayload {
  name?: string;
  color?: string;
  icon?: string;
  displayOrder?: number;
}

export const spacesApi = {
  list: () => api.get<Space[]>("/spaces"),
  get: (id: string) => api.get<SpaceDetail>(`/spaces/${id}`),
  create: (payload: CreateSpacePayload) => api.post<Space>("/spaces", payload),
  update: (id: string, payload: UpdateSpacePayload) => api.put<Space>(`/spaces/${id}`, payload),
  delete: (id: string) => api.delete<null>(`/spaces/${id}`),
  addMembers: (id: string, employeeIds: string[]) =>
    api.post<null>(`/spaces/${id}/members`, { employeeIds }),
  removeMember: (id: string, employeeId: string) =>
    api.delete<null>(`/spaces/${id}/members/${employeeId}`),
};
