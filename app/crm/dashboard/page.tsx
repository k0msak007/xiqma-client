"use client";

import { Dashboard } from "@/components/crm/dashboard";

export default function CRMDashboardPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">CRM Dashboard</h1>
        <p className="text-muted-foreground">
          ภาพรวม Leads, Opportunities และ Pipeline
        </p>
      </div>
      <Dashboard />
    </div>
  );
}
