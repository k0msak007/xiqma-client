import { create } from "zustand";
import { authApi, type AuthUser, type LoginCredentials } from "./api/auth";
import { tokenManager } from "./token";
import { useWorkspaceStore } from "./workspace-store";

interface AuthState {
  // State
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean; // true while checking stored token on app start

  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string, confirmPassword: string) => Promise<void>;

  /**
   * Call once on app mount to restore auth state from stored tokens.
   * Tries stored access token → auto-refreshes if expired → clears if refresh also fails.
   */
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  // ---- Login ----
  login: async (credentials) => {
    const data = await authApi.login(credentials);

    tokenManager.setTokens(data.access_token, data.refresh_token, data.expires_in);
    tokenManager.saveUser(data.user);

    set({ user: data.user, isAuthenticated: true });

    // Load workspace data after successful login
    useWorkspaceStore.getState().loadWorkspace();
  },

  // ---- Logout ----
  logout: async () => {
    const refreshToken = tokenManager.getRefreshToken();
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch {
        // Best-effort — clear local state regardless
      }
    }
    tokenManager.clearTokens();
    set({ user: null, isAuthenticated: false, isLoading: false });

    // Clear workspace data on logout
    useWorkspaceStore.setState({ spaces: [], folders: [], lists: [] });
  },

  // ---- Change Password ----
  changePassword: async (currentPassword, newPassword, confirmPassword) => {
    await authApi.changePassword({ currentPassword, newPassword, confirmPassword });
  },

  // ---- Initialize (restore session on page reload) ----
  initialize: async () => {
    const accessToken = tokenManager.getAccessToken();

    if (!accessToken) {
      set({ isLoading: false });
      return;
    }

    // Restore cached user immediately to avoid loading flicker
    const cachedUser = tokenManager.loadUser<AuthUser>();
    if (cachedUser) {
      set({ user: cachedUser, isAuthenticated: true });
    }

    try {
      // Verify token is still valid (apiRequest auto-refreshes on 401)
      const me = await authApi.me();

      // Construct fresh user from server response
      // ถ้ามี cachedUser → patch ด้วยข้อมูลล่าสุด, ถ้าไม่มี → สร้างใหม่จาก /me
      set((state) => ({
        user: {
          id:          me.id,
          name:        me.name  || state.user?.name  || "",
          email:       me.email || state.user?.email || "",
          role:        me.role,
          permissions: me.permissions,
        },
        isAuthenticated: true,
        isLoading: false,
      }));

      // Load workspace after session restored
      useWorkspaceStore.getState().loadWorkspace();
    } catch {
      tokenManager.clearTokens();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
