import { api } from "./client";

// ─── Request param types ───────────────────────────────────────────────────────

export interface PerformanceParams {
  employee_id?: string;
  period?: "week" | "month" | "quarter" | "year";
  start?: string; // YYYY-MM-DD
  end?: string;   // YYYY-MM-DD
}

export interface VelocityParams {
  employee_id?: string;
  weeks?: number; // default 8
}

export interface EfficiencyParams {
  period?: "week" | "month" | "quarter" | "year";
  employee_id?: string;
}

// ─── Response types ────────────────────────────────────────────────────────────

export interface PerformanceSummary {
  period: { start: string; end: string };
  employee_id: string | null;
  total_tasks: number;
  completed_tasks: number;
  active_tasks: number;
  cancelled_tasks: number;
  overdue_tasks: number;
  completed_points: number;
  assigned_points: number;
  total_actual_hours: number;
  total_estimate_hours: number;
  avg_completion_hours: number;
  completion_rate: number;
}

export interface VelocityRow {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_code: string;
  week_start: string;
  week_end: string;
  tasks_done: number;
  tasks_overdue: number;
  total_manday: number;
  actual_hours: number;
  expected_points: number | null;
  actual_points: number;
  performance_ratio: number | null;
  performance_label: string | null;
  avg_score: number | null;
  rank: number | null;
  prev_week_score: number | null;
}

export interface EfficiencyRow {
  employee_id: string;
  employee_name: string;
  employee_code: string;
  avatar_url: string | null;
  department: string | null;
  total_tasks: number;
  avg_estimate_hours: number;
  avg_actual_hours: number;
  accuracy_pct: number | null;
  overall_ratio_pct: number | null;
}

export interface EfficiencyResult {
  period: { start: string; end: string };
  data: EfficiencyRow[];
}

export interface BottleneckRow {
  status_id: string;
  status_name: string;
  color: string;
  status_type: string;
  list_id: string;
  list_name: string;
  task_count: number;
  avg_days_stuck: number;
  max_days_stuck: number;
  avg_story_points: number | null;
}

export interface TeamWorkloadRow {
  id: string;
  name: string;
  employee_code: string;
  avatar_url: string | null;
  department: string | null;
  role: string;
  active_tasks: number;
  done_this_week: number;
  active_points: number;
  estimate_hours: number;
  overdue_tasks: number;
}

// ─── API module ────────────────────────────────────────────────────────────────

function buildQuery(params: object): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== "");
  if (entries.length === 0) return "";
  return "?" + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v as string | number))}`).join("&");
}

export const analyticsApi = {
  /** GET /analytics/performance — สรุปผลงาน */
  performance: (params: PerformanceParams = {}): Promise<PerformanceSummary> =>
    api.get<PerformanceSummary>(`/analytics/performance${buildQuery(params)}`),

  /** GET /analytics/velocity — velocity ย้อนหลัง N สัปดาห์ */
  velocity: (params: VelocityParams = {}): Promise<VelocityRow[]> =>
    api.get<VelocityRow[]>(`/analytics/velocity${buildQuery(params)}`),

  /** GET /analytics/efficiency — ความแม่นยำ estimate ต่อคน */
  efficiency: (params: EfficiencyParams = {}): Promise<EfficiencyResult> =>
    api.get<EfficiencyResult>(`/analytics/efficiency${buildQuery(params)}`),

  /** GET /analytics/bottleneck — status columns ที่ค้างนานที่สุด */
  bottleneck: (): Promise<BottleneckRow[]> =>
    api.get<BottleneckRow[]>("/analytics/bottleneck"),

  /** GET /analytics/team-workload — workload ของแต่ละคนในทีม */
  teamWorkload: (): Promise<TeamWorkloadRow[]> =>
    api.get<TeamWorkloadRow[]>("/analytics/team-workload"),
};
