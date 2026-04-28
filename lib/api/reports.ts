import { api } from "./client";
import { tokenManager } from "@/lib/token";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WeeklyReport {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_code: string;
  avatar_url: string | null;
  department: string | null;
  week_start: string;
  tasks_done: number;
  tasks_overdue: number;
  total_manday: number;
  actual_hours: number;
  expected_points: number | null;
  actual_points: number;
  performance_ratio: number | null;
  performance_label: "Excellent" | "Good" | "Fair" | "Poor" | "N/A" | null;
  avg_score: number | null;
  rank: number | null;
  prev_week_score: number | null;
}

export interface WeeklyTeamReport {
  week_start: string;
  data: WeeklyReport[];
}

export interface GenerateWeeklyReportResult {
  generated: number;
  week_start: string;
}

export interface MonthlyHrReport {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_code: string;
  avatar_url: string | null;
  department: string | null;
  year: number;
  month: number;
  leave_days_taken: number;
  absent_days: number;
  late_days: number;
  total_hours_worked: number;
}

export interface MonthlyHrReportResult {
  year: number;
  month: number;
  data: MonthlyHrReport[];
}

// ─── API module ────────────────────────────────────────────────────────────────

function buildQuery(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== "");
  if (entries.length === 0) return "";
  return "?" + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join("&");
}

export const reportsApi = {
  /** GET /reports/weekly — รายงานสัปดาห์ส่วนตัว */
  weekly: (params: { employee_id?: string; week?: string } = {}): Promise<WeeklyReport | null> =>
    api.get<WeeklyReport | null>(`/reports/weekly${buildQuery(params)}`),

  /** GET /reports/weekly/team — รายงานสัปดาห์ของทีม เรียงตาม rank */
  weeklyTeam: (params: { week?: string } = {}): Promise<WeeklyTeamReport> =>
    api.get<WeeklyTeamReport>(`/reports/weekly/team${buildQuery(params)}`),

  /** POST /reports/weekly/generate — trigger สร้างรายงาน (admin) */
  generateWeekly: (params: {
    week_start?: string;
    employee_id?: string;
  } = {}): Promise<GenerateWeeklyReportResult> =>
    api.post<GenerateWeeklyReportResult>("/reports/weekly/generate", params),

  /** GET /reports/monthly-hr — รายงาน HR รายเดือน */
  monthlyHr: (params: {
    employee_id?: string;
    year?: number;
    month?: number;
  } = {}): Promise<MonthlyHrReportResult> =>
    api.get<MonthlyHrReportResult>(`/reports/monthly-hr${buildQuery(params)}`),

  // ── Per-employee report (admin/manager) ──────────────────────────────────────
  /** GET /reports/employee/:id?from=&to= — JSON สรุปผลงาน */
  employee: (employeeId: string, from: string, to: string): Promise<EmployeeReport> =>
    api.get<EmployeeReport>(`/reports/employee/${employeeId}?from=${from}&to=${to}`),

  /** GET /reports/employee/:id/export — download Excel (returns Blob) */
  exportEmployee: async (employeeId: string, from: string, to: string): Promise<Blob> => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";
    const token = tokenManager.getAccessToken();
    const res = await fetch(
      `${baseUrl}/reports/employee/${employeeId}/export?from=${from}&to=${to}`,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} },
    );
    if (!res.ok) throw new Error(`Export failed: ${res.status}`);
    return await res.blob();
  },

  /** POST /reports/employee/:id/ai-summary — AI narrative */
  aiSummary: (employeeId: string, body: { from: string; to: string; language?: "th" | "en"; refresh?: boolean }) =>
    api.post<{ text: string; model: string; cached: boolean }>(`/reports/employee/${employeeId}/ai-summary`, body),

  // ── Team-wide (one click for everyone the caller can see) ────────────────
  /** GET /reports/team/export — single .xlsx with overview + per-member sheets */
  exportTeam: async (from: string, to: string): Promise<Blob> => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";
    const token = tokenManager.getAccessToken();
    const res = await fetch(
      `${baseUrl}/reports/team/export?from=${from}&to=${to}`,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} },
    );
    if (!res.ok) throw new Error(`Export failed: ${res.status}`);
    return await res.blob();
  },

  /** POST /reports/team/ai-summary — team-level AI narrative */
  teamAiSummary: (body: { from: string; to: string; language?: "th" | "en"; refresh?: boolean }) =>
    api.post<{ text: string; model: string; cached: boolean; memberCount: number }>(`/reports/team/ai-summary`, body),
};

// ── Types for per-employee report ──────────────────────────────────────────────
export interface EmployeeReport {
  employee: {
    id: string;
    name: string;
    code: string | null;
    avatarUrl: string | null;
    role: string | null;
    workSchedule: string | null;
  };
  range: { from: string; to: string };
  tasks: {
    total: number;
    completed: number;
    overdue: number;
    inProgress: number;
    cancelled: number;
    onTimeRate: number;
    completedLate: number;
    avgLateDays: number;
    reworkTotal: number;
    storyPointsCompleted: number;
  };
  time: {
    totalMinutes: number;
    sessions: number;
    perDay: Array<{ day: string; minutes: number }>;
  };
  topTasks: Array<{
    id: string;
    displayId: string | null;
    title: string;
    statusName: string | null;
    statusColor: string | null;
    completedAt: string | null;
    deadline: string | null;
    durationMin: number;
    reworkCount: number;
  }>;
}
