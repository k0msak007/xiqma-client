"use client";

import { PermissionGate } from "@/components/permission-gate";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <PermissionGate requires={["view_analytics", "manage_users"]}>
      {children}
    </PermissionGate>
  );
}
