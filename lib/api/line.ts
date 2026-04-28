import { api } from "./client";

export interface LineLinkStatus {
  linked:    boolean;
  lineUserId: string | null;
  verifiedAt: string | null;
}

export interface LineLinkToken {
  token:      string;
  expiresAt:  string;
  botBasicId?: string;
}

export const lineApi = {
  /** GET /line/status */
  status: () => api.get<LineLinkStatus>("/line/status"),

  /** POST /line/link-token — returns 6-digit pairing token */
  createLinkToken: () => api.post<LineLinkToken>("/line/link-token", {}),

  /** DELETE /line/link */
  unlink: () => api.delete<null>("/line/link"),

  /** POST /line/test — push a test message */
  test: () => api.post<null>("/line/test", {}),
};
