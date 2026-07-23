import { config } from '../config';
import { ApiFetchError, normalizeError } from './errors';
import { useSession, getAccessToken, getRefreshToken, persistRefreshToken } from '../auth/session';

// The access token for non-fetch transports (the Socket.io handshake).
export function getAuthToken(): string | null {
  return getAccessToken();
}

// On app load, restore a session from the persisted refresh token (the access token is memory-only, so a
// reload has none). Marks the session ready so the auth gate can decide login vs. app.
export async function bootstrapSession(): Promise<void> {
  if (!getAccessToken() && getRefreshToken()) await refreshAccess();
  useSession.getState().setReady(true);
}

// Silently rotates the refresh session for a new access token. Returns the new access token, or null (and
// clears the session) when the refresh token is missing/expired — the gate then redirects to login.
let refreshing: Promise<string | null> | null = null;
async function refreshAccess(): Promise<string | null> {
  const rt = getRefreshToken();
  if (!rt) return null;
  // Collapse concurrent 401s into a single refresh call.
  if (!refreshing) {
    refreshing = (async () => {
      try {
        const res = await fetch(`${config.apiBaseUrl}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: rt }),
        });
        if (!res.ok) {
          useSession.getState().clear();
          return null;
        }
        const data = (await res.json()) as { accessToken: string; refreshToken: string };
        persistRefreshToken(data.refreshToken);
        useSession.getState().setAccessToken(data.accessToken);
        return data.accessToken;
      } finally {
        refreshing = null;
      }
    })();
  }
  return refreshing;
}

// The single fetch wrapper: attaches our access token, retries once through a silent refresh on 401,
// hits the backend directly, and normalizes errors.
export async function apiFetch<T>(path: string, init: RequestInit = {}, retried = false): Promise<T> {
  const token = getAccessToken();
  // For multipart uploads let the browser set Content-Type (with the boundary); JSON otherwise.
  const isForm = init.body instanceof FormData;
  const res = await fetch(`${config.apiBaseUrl}${path}`, {
    ...init,
    headers: {
      ...(isForm ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });

  if (res.status === 401 && !retried && getRefreshToken()) {
    const fresh = await refreshAccess();
    if (fresh) return apiFetch<T>(path, init, true);
  }

  if (!res.ok) throw new ApiFetchError(await normalizeError(res));
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
