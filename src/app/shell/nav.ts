import { LayoutDashboard, Route, Bus, Ticket, Package, BarChart3, Map, Waypoints, UsersRound, type LucideIcon } from 'lucide-react';

export interface NavItem {
  to: string;
  labelKey: string; // i18n key (nav.*)
  icon: LucideIcon;
  roles?: string[]; // omitted = every ops role; present = only these roles see it
}

// Users/Team is a governance privilege — company_admin/super_admin only, never manager (see users.routes.ts).
export const ADMIN_ROLES = ['super_admin', 'company_admin'];

// Ops-manager navigation (we start here). Role-based variants layer on later.
export const opsNav: NavItem[] = [
  { to: '/', labelKey: 'nav.overview', icon: LayoutDashboard },
  { to: '/fleet', labelKey: 'nav.fleet', icon: Bus },
  { to: '/routes', labelKey: 'nav.routes', icon: Waypoints },
  { to: '/network', labelKey: 'nav.liveMap', icon: Map },
  { to: '/trips', labelKey: 'nav.trips', icon: Route },
  { to: '/bookings', labelKey: 'nav.bookings', icon: Ticket },
  { to: '/parcels', labelKey: 'nav.parcels', icon: Package },
  { to: '/analytics', labelKey: 'nav.analytics', icon: BarChart3 },
  { to: '/users', labelKey: 'nav.users', icon: UsersRound, roles: ADMIN_ROLES },
];

// The nav items visible to a given role — filters out roles-gated items the caller can't use.
export function navForRole(role: string | undefined): NavItem[] {
  return opsNav.filter((item) => !item.roles || (role && item.roles.includes(role)));
}

// The i18n key for the section title shown in the top bar for a given path.
export function sectionTitleKey(pathname: string): string {
  if (pathname.startsWith('/trips/')) return 'nav.tripDetail';
  if (pathname.startsWith('/settings')) return 'nav.settings';
  if (pathname.startsWith('/notifications')) return 'nav.notifications';
  const match = [...opsNav]
    .filter((n) => n.to !== '/')
    .find((n) => pathname.startsWith(n.to));
  return match?.labelKey ?? 'nav.overview';
}
