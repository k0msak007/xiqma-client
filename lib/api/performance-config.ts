import { api } from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PerformanceConfig {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_code: string;
  work_schedule_id: string;
  work_schedule_name: string;
  days_per_week: number;
  hours_per_day: number;
  hours_per_week: number;
  work_start_time: string;
  work_end_time: string;
  expected_ratio: number;
  pointed_work_percent: number;
  non_pointed_work_percent: number;
  point_target: number | null;
  point_period: "day" | "week" | "month" | "year";
  effective_from: string;
  created_at: string;
  updated_at: string;
}

export interface UpsertPerformanceConfigInput {
  employee_id: string;
  work_schedule_id: string;
  expected_ratio?: number;
  pointed_work_percent?: number;
  point_target?: number;
  point_period?: "day" | "week" | "month" | "year";
  effective_from?: string;
}

// ─── API module ────────────────────────────────────────────────────────────────

export const performanceConfigApi = {
  /** GET /performance-config/me — ดู config ของตัวเอง */
  getMe: (): Promise<PerformanceConfig> =>
    api.get<PerformanceConfig>("/performance-config/me"),

  /** GET /performance-config/:employee_id — ดู config ของพนักงานคนอื่น */
  getByEmployee: (employeeId: string): Promise<PerformanceConfig> =>
    api.get<PerformanceConfig>(`/performance-config/${employeeId}`),

  /** POST /performance-config — สร้าง/อัปเดต config (upsert) */
  upsert: (data: UpsertPerformanceConfigInput): Promise<PerformanceConfig> =>
    api.post<PerformanceConfig>("/performance-config", data),
};
