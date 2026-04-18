"use client";

import { useAuthStore } from "./auth-store";

/**
 * Check if the current user has a permission.
 * "admin" / "Full Admin" permission grants everything.
 */
export function usePermission(): {
  has: (perm: string) => boolean;
  hasAny: (perms: string[]) => boolean;
  isAdmin: boolean;
  role: string | undefined;
} {
  const user = useAuthStore((s) => s.user);
  const perms = user?.permissions ?? [];
  const isAdmin = user?.role === "admin" || perms.includes("admin");

  const has = (perm: string) => isAdmin || perms.includes(perm);
  const hasAny = (list: string[]) => isAdmin || list.some((p) => perms.includes(p));

  return { has, hasAny, isAdmin, role: user?.role };
}
