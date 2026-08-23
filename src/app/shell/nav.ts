import { LayoutDashboard, Route, Bus, Ticket, Package, BarChart3, Map, Waypoints, UsersRound, User, type LucideIcon } from 'lucide-react';

export interface NavItem {
  to: string;
  labelKey: string; // i18n key (nav.*)
  icon: LucideIcon;
  roles?: string[]; // omitted = every ops role; present = only these roles see it
}

// Staff governance (invite/edit/deactivate staff accounts) is company_admin/super_admin only, never
// manager (see users.routes.ts) — enforced inside StaffPage, not at the nav/route level (manager still
// needs the Staff section for Drivers + Roster, see STAFF_ROLES below).
export const ADMIN_ROLES = ['super_admin', 'company_admin'];

// Drivers/roster access — matches backend authorization for drivers/driver-shifts/maintenance
// (features/drivers/drivers.routes.ts et al.), so manager keeps the access it already has via those APIs.
export const STAFF_ROLES = ['super_admin', 'company_admin', 'manager'];

// Ops-manager navigation (we start here). Role-based variants layer on later.
export const opsNav: NavItem[] = [
  { to: '/', labelKey: 'nav.overview', icon: LayoutDashboard },
  { to: '/fleet', labelKey: 'nav.fleet', icon: Bus },
  { to: '/staff', labelKey: 'nav.staff', icon: UsersRound, roles: STAFF_ROLES },
  { to: '/routes', labelKey: 'nav.routes', icon: Waypoints },
  { to: '/network', labelKey: 'nav.liveMap', icon: Map },
  { to: '/trips', labelKey: 'nav.trips', icon: Route },
  { to: '/bookings', labelKey: 'nav.bookings', icon: Ticket },
  { to: '/parcels', labelKey: 'nav.parcels', icon: Package },
  { to: '/analytics', labelKey: 'nav.analytics', icon: BarChart3 },
  { to: '/users', labelKey: 'nav.passengers', icon: User, roles: ADMIN_ROLES },
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
