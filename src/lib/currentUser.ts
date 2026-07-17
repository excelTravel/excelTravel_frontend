import { useMe, useCompanies } from './api/hooks';

export interface CurrentUser {
  firstName: string;
  role: string;
  location: string;
}

const ROLE_LABEL: Record<string, string> = {
  super_admin: 'Super admin',
  company_admin: 'Company admin',
  manager: 'Manager',
  agent: 'Agent',
  driver: 'Driver',
  passenger: 'Passenger',
};

// The signed-in user from GET /api/v1/me; company name resolved from GET /companies. Both are cached
// TanStack queries, so this is cheap to call from the header on every page.
export function useCurrentUser(): CurrentUser {
  const me = useMe();
  const companies = useCompanies();
  const firstName = me.data?.name?.split(' ')[0] ?? '…';
  const role = me.data ? ROLE_LABEL[me.data.role] ?? me.data.role : '';
  const location = companies.data?.find((c) => c.id === me.data?.companyId)?.name ?? '';
  return { firstName, role, location };
}

// Time-of-day period key ('morning' | 'afternoon' | 'evening') — translated in the header via i18n.
export function getGreetingPeriod(date = new Date()): 'morning' | 'afternoon' | 'evening' {
  const h = date.getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}
