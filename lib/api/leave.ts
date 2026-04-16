import { api } from "./client";

export interface LeaveRequest {
  id: string;
  displayId: string;
  employeeId: string;
  employeeName: string;
  leaveType: "annual" | "sick" | "personal" | "maternity" | "ordain" | "unpaid";
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string | null;
  status: "pending" | "approved" | "rejected" | "cancelled";
  createdAt: string;
}

export interface LeaveQuota {
  id: string;
  employeeId: string;
  year: number;
  leaveType: string;
  quotaDays: number;
  usedDays: number;
  remainingDays: number;
}

export interface AttendanceLog {
  id: string;
  employeeId: string;
  workDate: string;
  checkIn: string | null;
  checkOut: string | null;
  status: "present" | "late" | "absent" | "leave" | "holiday";
  note: string | null;
}

export interface CreateLeaveRequestPayload {
  leaveType: "annual" | "sick" | "personal" | "maternity" | "ordain" | "unpaid";
  startDate: string;
  endDate: string;
  reason?: string;
  medicalCertificateUrl?: string;
}

export interface UpdateLeaveQuotaPayload {
  year: number;
  leaveType: "annual" | "sick" | "personal" | "maternity" | "ordain" | "unpaid";
  quotaDays: number;
}

export const leaveApi = {
  // Leave Requests
  list: (params?: { employee_id?: string; status?: string; year?: number; month?: number }) => {
    const query = new URLSearchParams();
    if (params?.employee_id) query.set("employee_id", params.employee_id);
    if (params?.status) query.set("status", params.status);
    if (params?.year) query.set("year", String(params.year));
    if (params?.month) query.set("month", String(params.month));
    const q = query.toString();
    return api.get<LeaveRequest[]>(`/leave-requests${q ? `?${q}` : ""}`);
  },
  get: (id: string) => api.get<LeaveRequest>(`/leave-requests/${id}`),
  create: (data: CreateLeaveRequestPayload) => api.post<LeaveRequest>("/leave-requests", data),
  approve: (id: string) => api.patch<LeaveRequest>(`/leave-requests/${id}/approve`, {}),
  reject: (id: string, data: { rejectReason: string }) => api.patch<LeaveRequest>(`/leave-requests/${id}/reject`, data),
  cancel: (id: string) => api.patch<LeaveRequest>(`/leave-requests/${id}/cancel`, {}),

  // Leave Quotas
  getMyQuotas: (year?: number) => {
    const q = year ? `?year=${year}` : "";
    return api.get<LeaveQuota[]>(`/leave-quotas/me${q}`);
  },
  getQuotas: (params?: { employee_id?: string; year?: number }) => {
    const query = new URLSearchParams();
    if (params?.employee_id) query.set("employee_id", params.employee_id);
    if (params?.year) query.set("year", String(params.year));
    const q = query.toString();
    return api.get<LeaveQuota[]>(`/leave-quotas${q ? `?${q}` : ""}`);
  },
  updateQuota: (employeeId: string, data: UpdateLeaveQuotaPayload) => 
    api.put<LeaveQuota>(`/leave-quotas/${employeeId}`, data),
};

export const attendanceApi = {
  checkIn: () => api.post<AttendanceLog>("/attendance/check-in", {}),
  checkOut: () => api.post<AttendanceLog>("/attendance/check-out", {}),
  getToday: () => api.get<AttendanceLog | null>("/attendance/today"),
  list: (params?: { employee_id?: string; month?: number; year?: number }) => {
    const query = new URLSearchParams();
    if (params?.employee_id) query.set("employee_id", params.employee_id);
    if (params?.month) query.set("month", String(params.month));
    if (params?.year) query.set("year", String(params.year));
    const q = query.toString();
    return api.get<AttendanceLog[]>(`/attendance${q ? `?${q}` : ""}`);
  },
  getTeamAttendance: (date?: string) => {
    const q = date ? `?date=${date}` : "";
    return api.get<{ id: string; name: string; avatarUrl: string | null; workDate: string | null; checkIn: string | null; checkOut: string | null; status: string | null; note: string | null }[]>(`/attendance/team${q}`);
  },
};