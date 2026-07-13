import { type ReactNode, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { setTokenGetter } from '@/lib/api/client';

// Gates the app behind Clerk auth and wires the Clerk session token into every API call.
// Only rendered when authEnabled (a Clerk key is present), so ClerkProvider is guaranteed above it.
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  useEffect(() => {
    setTokenGetter(() => getToken());
  }, [getToken]);

  if (!isLoaded) {
    return (
      <div className="app-gradient grid min-h-dvh place-items-center">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-label="Loading" />
      </div>
    );
  }
  if (!isSignedIn) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
