import { api } from "./client";

export interface TaskTemplate {
  id: string;
  name: string;
  title: string;
  description: string | null;
  taskTypeId: string | null;
  priority: "low" | "normal" | "high" | "urgent" | null;
  timeEstimateHours: number | null;
  storyPoints: number | null;
  tags: string[];
  isPublic: boolean;
}

export const taskTemplatesApi = {
  list: () => api.get<TaskTemplate[]>("/task-templates"),
  get: (id: string) => api.get<TaskTemplate>(`/task-templates/${id}`),
  create: (body: {
    name: string; title: string; description?: string | null;
    taskTypeId?: string | null; priority?: string | null;
    timeEstimateHours?: number | null; storyPoints?: number | null; tags?: string[];
  }) => api.post<TaskTemplate>("/task-templates", body),
  remove: (id: string) => api.delete<null>(`/task-templates/${id}`),
};
