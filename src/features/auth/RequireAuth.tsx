import { type ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useSession } from '@/lib/auth/session';
import { bootstrapSession } from '@/lib/api/client';

// Gates the app behind our in-house OTP session. On first mount it tries to restore a session from the
// persisted refresh token; while that settles it shows a spinner, then either renders the app or redirects
// to /login.
export function RequireAuth({ children }: { children: ReactNode }) {
  const user = useSession((s) => s.user);
  const ready = useSession((s) => s.ready);
  const [booting, setBooting] = useState(!ready);

  useEffect(() => {
    if (ready) return;
    bootstrapSession().finally(() => setBooting(false));
  }, [ready]);

  if (booting && !ready) {
    return (
      <div className="app-gradient grid min-h-dvh place-items-center">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-label="Loading" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
