"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuthStore } from "@/lib/auth-store";

const PUBLIC_ROUTES = ["/login"];

interface AuthShellProps {
  children: React.ReactNode;
}

export function AuthShell({ children }: AuthShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading, initialize } = useAuthStore();

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  // Restore auth session from stored tokens on first mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isPublicRoute) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, isPublicRoute, router]);

  // Redirect already-authenticated users away from login
  useEffect(() => {
    if (!isLoading && isAuthenticated && isPublicRoute) {
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, isPublicRoute, router]);

  // ---- Login / public page — no sidebar ----
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // ---- Loading state — spinner while restoring session ----
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
          <p className="text-sm text-muted-foreground">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  // ---- Authenticated — render with sidebar ----
  if (isAuthenticated) {
    return (
      <SidebarProvider>
        <div className="flex h-screen w-full">
          <AppSidebar />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </SidebarProvider>
    );
  }

  // Unauthenticated — render nothing while redirect happens
  return null;
}
