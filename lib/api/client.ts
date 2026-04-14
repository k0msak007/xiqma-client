import { tokenManager } from "@/lib/token";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";

// ---- Types ----

type SuccessResponse<T> = {
  success: true;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
};

type ErrorResponse = {
  success: false;
  message: string;
  error: string;
  details?: unknown;
};

type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ---- Token Refresh Queue ----
// Ensures concurrent requests wait for a single refresh instead of racing

let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenManager.getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    const json = (await res.json()) as ApiResponse<{
      access_token: string;
      refresh_token: string;
      expires_in: number;
    }>;

    if (!res.ok || !json.success) {
      tokenManager.clearTokens();
      return null;
    }

    tokenManager.setTokens(
      json.data.access_token,
      json.data.refresh_token,
      json.data.expires_in
    );
    return json.data.access_token;
  } catch {
    tokenManager.clearTokens();
    return null;
  }
}

function waitForRefresh(): Promise<string | null> {
  return new Promise((resolve) => {
    refreshQueue.push(resolve);
  });
}

function resolveRefreshQueue(token: string | null) {
  refreshQueue.forEach((resolve) => resolve(token));
  refreshQueue = [];
}

// ---- Core Request Function ----

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const accessToken = tokenManager.getAccessToken();

  const makeHeaders = (token: string | null, isFormData = false): HeadersInit => {
    const headers: Record<string, string> = {};
    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return { ...headers, ...options.headers };
  };

  const isFormData = options.body instanceof FormData;

  const doFetch = (token: string | null) =>
    fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: makeHeaders(token, isFormData),
    });

  let res = await doFetch(accessToken);

  // ---- Auto-refresh on 401 ----
  if (res.status === 401) {
    if (isRefreshing) {
      // Another request is already refreshing — wait for it
      const newToken = await waitForRefresh();
      if (!newToken) throw new ApiError("Session expired", "TOKEN_EXPIRED", 401);
      res = await doFetch(newToken);
    } else {
      // This request handles the refresh
      isRefreshing = true;
      const newToken = await refreshAccessToken();
      isRefreshing = false;
      resolveRefreshQueue(newToken);

      if (!newToken) {
        // Redirect to login on client side
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        throw new ApiError("Session expired", "TOKEN_EXPIRED", 401);
      }

      res = await doFetch(newToken);
    }
  }

  const json = (await res.json()) as ApiResponse<T>;

  if (!json.success) {
    throw new ApiError(json.message, json.error, res.status);
  }

  return json.data;
}

// ---- Convenience helpers ----

export const api = {
  get: <T>(path: string, options?: RequestInit) =>
    apiRequest<T>(path, { ...options, method: "GET" }),

  post: <T>(path: string, body: unknown, options?: RequestInit) =>
    apiRequest<T>(path, {
      ...options,
      method: "POST",
      body: JSON.stringify(body),
    }),

  put: <T>(path: string, body: unknown, options?: RequestInit) =>
    apiRequest<T>(path, {
      ...options,
      method: "PUT",
      body: JSON.stringify(body),
    }),

  patch: <T>(path: string, body: unknown, options?: RequestInit) =>
    apiRequest<T>(path, {
      ...options,
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  delete: <T>(path: string, options?: RequestInit) =>
    apiRequest<T>(path, { ...options, method: "DELETE" }),

  upload: <T>(path: string, body: FormData, options?: RequestInit) =>
    apiRequest<T>(path, {
      ...options,
      method: "PATCH",
      body,
    }),
};
