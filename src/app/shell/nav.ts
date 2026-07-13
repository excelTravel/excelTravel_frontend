import { LayoutDashboard, Map, Route, Bus, Ticket, Package, BarChart3, type LucideIcon } from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

// Ops-manager navigation (we start here). Role-based variants layer on later.
export const opsNav: NavItem[] = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/map', label: 'Live Map', icon: Map },
  { to: '/trips', label: 'Trips', icon: Route },
  { to: '/fleet', label: 'Fleet', icon: Bus },
  { to: '/bookings', label: 'Bookings', icon: Ticket },
  { to: '/parcels', label: 'Parcels', icon: Package },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
];
