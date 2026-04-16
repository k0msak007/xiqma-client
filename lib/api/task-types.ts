import { api } from "./client";

export interface TaskType {
  id: string;
  name: string;
  description: string | null;
  color: string;
  category: "private" | "organization";
  countsForPoints: boolean;
  fixedPoints: number | null;
  createdAt: string;
}

export interface CreateTaskTypePayload {
  name: string;
  description?: string;
  color?: string;
  category?: "private" | "organization";
  countsForPoints?: boolean;
  fixedPoints?: number;
}

export interface ListTaskTypesParams {
  category?: "private" | "organization";
}

export const taskTypesApi = {
  list: (params?: ListTaskTypesParams) => {
    const qs = params?.category ? `?category=${params.category}` : "";
    return api.get<TaskType[]>(`/task-types${qs}`);
  },
  get:    (id: string) => api.get<TaskType>(`/task-types/${id}`),
  create: (data: CreateTaskTypePayload) => api.post<TaskType>("/task-types", data),
  update: (id: string, data: Partial<CreateTaskTypePayload>) => api.put<TaskType>(`/task-types/${id}`, data),
  delete: (id: string) => api.delete<null>(`/task-types/${id}`),
};
