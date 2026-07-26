import { useCompanies } from './api/hooks';
import { useSession } from './auth/session';

export interface CurrentUser {
  firstName: string;
  fullName: string;
  email: string;
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

// The signed-in user from the auth session (set at login); company name resolved from GET /companies.
export function useCurrentUser(): CurrentUser {
  const user = useSession((s) => s.user);
  const companies = useCompanies();
  const firstName = user?.name?.split(' ')[0] ?? '…';
  const role = user ? ROLE_LABEL[user.role] ?? user.role : '';
  const location = companies.data?.find((c) => c.id === user?.companyId)?.name ?? '';
  return { firstName, fullName: user?.name ?? '', email: user?.email ?? '', role, location };
}

// Time-of-day period key ('morning' | 'afternoon' | 'evening') — translated in the header via i18n.
export function getGreetingPeriod(date = new Date()): 'morning' | 'afternoon' | 'evening' {
  const h = date.getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}
