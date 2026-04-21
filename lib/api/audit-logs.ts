import { api } from "./client";

export interface AuditLogItem {
  id: string;
  actorId: string | null;
  action: string;
  tableName: string | null;
  recordId: string | null;
  beforeData: unknown;
  afterData: unknown;
  ipAddress: string | null;
  createdAt: string;
  actorName: string | null;
  actorCode: string | null;
}

export interface ListAuditLogsParams {
  actor_id?: string;
  table_name?: string;
  action?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

function buildQuery(params: ListAuditLogsParams = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
  });
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export const auditLogsApi = {
  list: (params?: ListAuditLogsParams) =>
    api.get<AuditLogItem[]>(`/audit-logs${buildQuery(params)}`),
};
