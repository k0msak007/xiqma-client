import { api } from "./client";

// ---- Request Types ----

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// ---- Response Types ----

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
}

// API returns snake_case keys
export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: AuthUser;
}

export interface RefreshResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface MeResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
}

// ---- Auth API ----

export const authApi = {
  /**
   * Login with email + password.
   * Returns access token, refresh token and full user info.
   */
  login: (credentials: LoginCredentials) =>
    api.post<LoginResponse>("/auth/login", credentials),

  /**
   * Refresh access token using refresh token.
   * Called automatically by the API client on 401 — rarely needed directly.
   */
  refresh: (refreshToken: string) =>
    api.post<RefreshResponse>("/auth/refresh", { refreshToken }),

  /**
   * Logout — revokes the refresh token on the server.
   */
  logout: (refreshToken: string) =>
    api.post<{ message: string }>("/auth/logout", { refreshToken }),

  /**
   * Get current authenticated user info from JWT payload.
   */
  me: () => api.get<MeResponse>("/auth/me"),

  /**
   * Change password for the current user.
   */
  changePassword: (payload: ChangePasswordPayload) =>
    api.put<{ message: string }>("/auth/me/password", payload),
};
