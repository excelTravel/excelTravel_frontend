import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false } },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {/* Top-level boundary for lazy routes outside the app shell (e.g. Login) and initial load. */}
        <React.Suspense fallback={<div className="app-gradient min-h-dvh" />}>{children}</React.Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
