import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { config } from './lib/config';
import '@fontsource-variable/inter';
import './lib/i18n';
import './styles/index.css';
import { App } from './App';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false } },
});

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {/* Top-level boundary for lazy routes outside the app shell (e.g. Login) and initial load. */}
        <React.Suspense fallback={<div className="app-gradient min-h-dvh" />}>{children}</React.Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root')!);

// Clerk wraps everything when a key is set; without one, the app still boots (dev-auth on the backend).
root.render(
  <React.StrictMode>
    {config.clerkPublishableKey ? (
      <ClerkProvider publishableKey={config.clerkPublishableKey} afterSignOutUrl="/login">
        <Providers>
          <App />
        </Providers>
      </ClerkProvider>
    ) : (
      <Providers>
        <App />
      </Providers>
    )}
  </React.StrictMode>,
);
