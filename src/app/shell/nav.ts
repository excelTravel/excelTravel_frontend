import { LayoutDashboard, Map, Route, Bus, Ticket, Package, BarChart3, Waypoints, type LucideIcon } from 'lucide-react';

export interface NavItem {
  to: string;
  labelKey: string; // i18n key (nav.*)
  icon: LucideIcon;
}

// Ops-manager navigation (we start here). Role-based variants layer on later.
export const opsNav: NavItem[] = [
  { to: '/', labelKey: 'nav.overview', icon: LayoutDashboard },
  { to: '/map', labelKey: 'nav.map', icon: Map },
  { to: '/trips', labelKey: 'nav.trips', icon: Route },
  { to: '/fleet', labelKey: 'nav.fleet', icon: Bus },
  { to: '/network', labelKey: 'nav.network', icon: Waypoints },
  { to: '/bookings', labelKey: 'nav.bookings', icon: Ticket },
  { to: '/parcels', labelKey: 'nav.parcels', icon: Package },
  { to: '/analytics', labelKey: 'nav.analytics', icon: BarChart3 },
];

// The i18n key for the section title shown in the top bar for a given path.
export function sectionTitleKey(pathname: string): string {
  if (pathname.startsWith('/trips/')) return 'nav.tripDetail';
  if (pathname.startsWith('/settings')) return 'nav.settings';
  const match = [...opsNav]
    .filter((n) => n.to !== '/')
    .find((n) => pathname.startsWith(n.to));
  return match?.labelKey ?? 'nav.overview';
}
