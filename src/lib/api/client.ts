import { config } from '../config';
import { ApiFetchError, normalizeError } from './errors';

// Auth token getter — wired to Clerk at app start via setTokenGetter(). Defaults to none (backend dev-auth).
type TokenGetter = () => Promise<string | null>;
let getToken: TokenGetter = async () => null;
export function setTokenGetter(fn: TokenGetter): void {
  getToken = fn;
}

// The single fetch wrapper: attaches the Clerk token, hits the backend directly, normalizes errors.
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${config.apiBaseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) throw new ApiFetchError(await normalizeError(res));
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
