"use client";

import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { usePermission } from "@/lib/use-permission";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/auth-store";

interface Props {
  /** User must have ANY of these permissions (admin always allowed) */
  requires: string[];
  children: React.ReactNode;
}

/**
 * Wrap a page's contents to show an Access Denied screen when the user
 * lacks the required permission. Use in page.tsx:
 *
 *   <PermissionGate requires={["manage_users"]}>
 *     ...page content...
 *   </PermissionGate>
 */
export function PermissionGate({ requires, children }: Props) {
  const { hasAny } = usePermission();
  const isLoading = useAuthStore((s) => s.isLoading);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!hasAny(requires)) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <ShieldAlert className="h-8 w-8 text-destructive" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Access Denied</h2>
          <p className="text-sm text-muted-foreground">
            You don&apos;t have permission to view this page.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Required: {requires.join(" or ")}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
