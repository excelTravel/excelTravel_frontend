import { apiFetch } from './client';
import type { SessionUser } from '../auth/session';

// Public auth endpoints (in-house OTP auth). Codes are always SMS'd to the account phone; in dev the
// backend returns a `devCode` so the flow can be completed without reading a real SMS.
export interface PendingVerification {
  status: 'pending_verification';
  devCode?: string;
}
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: SessionUser;
}

export const authApi = {
  // Passenger self-signup (phone + name). Sends a signup OTP.
  register: (b: { name: string; phone: string; email?: string }) => apiFetch<PendingVerification>('/auth/register', { method: 'POST', body: JSON.stringify(b) }),
  // Verify the signup OTP → activates + logs in.
  verifyPhone: (b: { phone: string; code: string }) => apiFetch<AuthTokens>('/auth/verify-phone', { method: 'POST', body: JSON.stringify(b) }),
  // Request a login OTP — phone (passenger) or email (staff).
  requestOtp: (b: { phone: string }) => apiFetch<PendingVerification>('/auth/login/otp/request', { method: 'POST', body: JSON.stringify(b) }),
  // Verify a login OTP → logs in.
  verifyOtp: (b: { phone: string; code: string }) => apiFetch<AuthTokens>('/auth/login/otp/verify', { method: 'POST', body: JSON.stringify(b) }),
  logout: (refreshToken: string) => apiFetch<{ message: string }>('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken }) }),
};
