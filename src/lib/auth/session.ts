import { create } from 'zustand';

// Client auth session. The short-lived access token lives in memory only; the opaque refresh token +
// a copy of the user are persisted so a page reload can silently restore the session via /auth/refresh.
export interface SessionUser {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  role: string;
  companyId: string | null;
}

const REFRESH_KEY = 'excel.refresh';
const USER_KEY = 'excel.user';

function loadUser(): SessionUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

interface SessionState {
  accessToken: string | null;
  user: SessionUser | null;
  // False until the initial refresh-on-load attempt has settled, so the gate doesn't flash the login page.
  ready: boolean;
  setSession: (t: { accessToken: string; refreshToken: string; user: SessionUser }) => void;
  setAccessToken: (accessToken: string) => void;
  setReady: (ready: boolean) => void;
  clear: () => void;
}

export const useSession = create<SessionState>((set) => ({
  accessToken: null,
  user: loadUser(),
  ready: false,
  setSession: ({ accessToken, refreshToken, user }) => {
    localStorage.setItem(REFRESH_KEY, refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ accessToken, user, ready: true });
  },
  setAccessToken: (accessToken) => set({ accessToken }),
  setReady: (ready) => set({ ready }),
  clear: () => {
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    set({ accessToken: null, user: null });
  },
}));

// Non-hook accessors for the fetch/socket layers (outside React).
export const getAccessToken = (): string | null => useSession.getState().accessToken;
export const getRefreshToken = (): string | null => localStorage.getItem(REFRESH_KEY);
export function persistRefreshToken(token: string): void {
  localStorage.setItem(REFRESH_KEY, token);
}
