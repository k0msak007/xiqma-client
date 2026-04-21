import { api } from "./client";
import type { EmployeeDetail } from "./employees";

export interface UpdateProfilePayload {
  name?: string;
  email?: string;
}

export const profileApi = {
  get: () => api.get<EmployeeDetail>("/profile"),
  update: (body: UpdateProfilePayload) => api.put<EmployeeDetail>("/profile", body),
};
