const ACCESS_TOKEN_KEY = "xiqma_access_token";
const REFRESH_TOKEN_KEY = "xiqma_refresh_token";
const USER_KEY = "xiqma_user";

export const tokenManager = {
  getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setTokens(accessToken: string, refreshToken: string, expiresIn = 900): void {
    if (typeof window === "undefined") return;
    if (!accessToken || !refreshToken) return; // guard: ป้องกันเก็บ undefined เป็น string
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    // Store in cookie so Next.js middleware can read it for route protection
    document.cookie = `${ACCESS_TOKEN_KEY}=${accessToken}; path=/; max-age=${expiresIn}; SameSite=Strict`;
  },

  setAccessToken(accessToken: string, expiresIn = 900): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    document.cookie = `${ACCESS_TOKEN_KEY}=${accessToken}; path=/; max-age=${expiresIn}; SameSite=Strict`;
  },

  clearTokens(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    // Expire the cookie immediately
    document.cookie = `${ACCESS_TOKEN_KEY}=; path=/; max-age=0; SameSite=Strict`;
  },

  saveUser(user: unknown): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  loadUser<T>(): T | null {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
};
