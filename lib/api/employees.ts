import { api } from "./client";

export interface Employee {
  id: string;
  employeeCode: string;
  name: string;
  email: string | null;
  avatarUrl: string | null;
  role: "employee" | "manager" | "hr" | "admin";
  department: string | null;
  isActive: boolean;
  roleName: string | null;
  positionName: string | null;
  createdAt: string;
}

export interface EmployeeDetail extends Employee {
  roleId: string | null;
  positionId: string | null;
  managerId: string | null;
  leaveQuotaAnnual: number;
  leaveQuotaSick: number;
  leaveQuotaPersonal: number;
}

export interface CreateEmployeePayload {
  employeeCode: string;
  name: string;
  email?: string;
  password: string;
  role?: "employee" | "manager" | "hr" | "admin";
  roleId?: string;
  positionId?: string;
  managerId?: string;
  department?: string;
  leaveQuotaAnnual?: number;
  leaveQuotaSick?: number;
  leaveQuotaPersonal?: number;
}

export interface UpdateEmployeePayload {
  name?: string;
  email?: string;
  roleId?: string;
  positionId?: string;
  managerId?: string;
  department?: string;
  isActive?: boolean;
}

export interface EmployeeListResponse {
  rows: Employee[];
  total: number;
  totalPages?: number;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export const employeesApi = {
  listAll: () => api.get<{ rows: Employee[] }>("/employees/all").then((res) => res.rows),
  list: (params?: { search?: string; department?: string; isActive?: boolean; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.search)     query.set("search", params.search);
    if (params?.department) query.set("department", params.department);
    if (params?.isActive !== undefined) query.set("isActive", String(params.isActive));
    if (params?.page)       query.set("page", String(params.page));
    if (params?.limit)      query.set("limit", String(params.limit));
    return api.get<EmployeeListResponse>(`/employees?${query.toString()}`);
  },
  get:        (id: string) => api.get<EmployeeDetail>(`/employees/${id}`),
  create:     (data: CreateEmployeePayload) => api.post<Employee>("/employees", data),
  update:     (id: string, data: UpdateEmployeePayload) => api.put<Employee>(`/employees/${id}`, data),
  deactivate:   (id: string) => api.patch<Employee>(`/employees/${id}/deactivate`, {}),
  uploadAvatar: (id: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.upload<Employee>(`/employees/${id}/avatar`, formData);
  },
  changePassword: (data: ChangePasswordPayload) => api.put<null>("/employees/me/password", data),
};
