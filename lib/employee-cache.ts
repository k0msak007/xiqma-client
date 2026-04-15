import type { User } from "@/lib/types";

// In-memory cache — populated when tasks are loaded from API
const cache = new Map<string, User>();

export function cacheEmployee(emp: {
  id: string;
  name: string;
  avatarUrl?: string | null;
}) {
  if (!cache.has(emp.id)) {
    cache.set(emp.id, {
      id:        emp.id,
      name:      emp.name,
      email:     "",
      role:      "member",
      avatar:    emp.avatarUrl ?? undefined,
      createdAt: new Date(),
    });
  }
}

export function getCachedEmployee(id: string): User | undefined {
  return cache.get(id);
}

export function clearEmployeeCache() {
  cache.clear();
}
