import type { ReactElement, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import { useSession } from '@/lib/auth/session';
import '@/lib/i18n';

// A logged-in company_admin session — matches the shape RequireAuth/pages expect from useSession().
// Individual tests can override via useSession.setState({ user: {...} }) before rendering.
const testUser = {
  id: 'user-1',
  name: 'Test Admin',
  email: 'admin@exceltravel.rw',
  phone: '+250788000000',
  role: 'company_admin',
  companyId: 'company-1',
};

// Renders a page/component with the same providers the real app tree supplies (query client, router,
// i18n — imported for its side effect), and a seeded logged-in session so pages that read useSession()
// behave as they would post-login. Each call gets a fresh QueryClient so query cache never leaks
// between tests.
export function renderWithProviders(ui: ReactElement, { route = '/' }: { route?: string } = {}) {
  useSession.setState({ user: testUser, accessToken: 'test-token', ready: true });

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 }, mutations: { retry: false } },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  }

  return render(ui, { wrapper: Wrapper });
}
