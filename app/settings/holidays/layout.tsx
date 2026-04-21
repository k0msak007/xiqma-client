"use client";

import { PermissionGate } from "@/components/permission-gate";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <PermissionGate requires={["manage_users", "manage_workspace"]}>
      {children}
    </PermissionGate>
  );
}
