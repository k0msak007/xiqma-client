import { api } from "./client";

export interface SavedFilter {
  id: string;
  name: string;
  listId: string;
  userId: string;
  config: Record<string, any>;
  isDefault: boolean;
  createdAt: string;
}

export const savedFiltersApi = {
  list: (listId: string) => api.get<SavedFilter[]>(`/saved-filters?listId=${encodeURIComponent(listId)}`),
  create: (body: { name: string; listId: string; config: Record<string, any> }) =>
    api.post<SavedFilter>("/saved-filters", body),
  remove: (id: string) => api.delete<null>(`/saved-filters/${id}`),
};
