import { api } from "./client";

export interface Position {
  id: string;
  name: string;
  department: string | null;
  level: number;
  jobLevelCode: string | null;
  color: string;
  parentPositionId: string | null;
  isActive: boolean;
  employeeCount?: number;
  parentName?: string | null;
  createdAt: string;
}

export interface CreatePositionPayload {
  name: string;
  department?: string;
  level?: number;
  jobLevelCode?: string;
  color?: string;
  parentPositionId?: string;
}

export const positionsApi = {
  list: (department?: string) => api.get<Position[]>(`/positions${department ? `?department=${department}` : ""}`),
  get:  (id: string) => api.get<Position>(`/positions/${id}`),
  create: (data: CreatePositionPayload) => api.post<Position>("/positions", data),
  update: (id: string, data: Partial<CreatePositionPayload>) => api.put<Position>(`/positions/${id}`, data),
  delete: (id: string) => api.delete<null>(`/positions/${id}`),
};
