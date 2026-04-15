import { api } from "./client";

export interface SearchResult {
  type: "task" | "employee" | "space";
  id: string;
  title: string;
  subtitle?: string;
  url: string;
  priority?: string;
  status?: string;
  avatar?: string;
}

export const searchApi = {
  search: (q: string, types?: string, limit?: number) => {
    const params = new URLSearchParams({ q });
    if (types) params.set("types", types);
    if (limit) params.set("limit", String(limit));
    return api.get<SearchResult[]>(`/search?${params.toString()}`);
  },
};
