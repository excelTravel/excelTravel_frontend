import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useSession } from '@/lib/auth/session';

// Blocks direct URL navigation to role-gated routes (e.g. a manager typing /users). Mirrors the backend's
// authorize(...) check — this is a UX nicety, not the security boundary (the API enforces it for real).
export function RequireRole({ roles, children }: { roles: string[]; children: ReactNode }) {
  const role = useSession((s) => s.user?.role);
  if (!role || !roles.includes(role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}
