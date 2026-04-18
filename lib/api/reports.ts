import { api } from "./client";

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
};
