import { api } from "./client";

export interface Role {
  id: string;
  name: string;
  description: string | null;
  color: string;
  permissions: string[];
  createdAt: string;
}

export interface CreateRolePayload {
  name: string;
  description?: string;
  color: string;
  permissions: string[];
}

export const rolesApi = {
  list: () => api.get<Role[]>("/roles"),
  get:  (id: string) => api.get<Role>(`/roles/${id}`),
  create: (data: CreateRolePayload) => api.post<Role>("/roles", data),
  update: (id: string, data: CreateRolePayload) => api.put<Role>(`/roles/${id}`, data),
  delete: (id: string) => api.delete<null>(`/roles/${id}`),
};
