import { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { authEnabled } from './lib/config';
import { AppShell } from './app/shell/AppShell';
import { RequireAuth } from './features/auth/RequireAuth';
import { RequireRole } from './features/auth/RequireRole';
import { ADMIN_ROLES } from './app/shell/nav';
import { NotFoundPage } from './app/pages/NotFoundPage';

// Routes are code-split so the initial bundle stays small and each screen (and its heavy deps like
// Recharts / MapLibre) loads on demand behind a Suspense skeleton (see AppShell). Named exports are
// re-mapped to default for React.lazy.
const LoginPage = lazy(() => import('./features/auth/LoginPage').then((m) => ({ default: m.LoginPage })));
const OverviewPage = lazy(() => import('./features/overview/OverviewPage').then((m) => ({ default: m.OverviewPage })));
const FleetPage = lazy(() => import('./features/fleet/FleetPage').then((m) => ({ default: m.FleetPage })));
const TripsPage = lazy(() => import('./features/trips/TripsPage').then((m) => ({ default: m.TripsPage })));
const TripDetailPage = lazy(() => import('./features/trips/TripDetailPage').then((m) => ({ default: m.TripDetailPage })));
const BookingsPage = lazy(() => import('./features/bookings/BookingsPage').then((m) => ({ default: m.BookingsPage })));
const ParcelsPage = lazy(() => import('./features/parcels/ParcelsPage').then((m) => ({ default: m.ParcelsPage })));
const AnalyticsPage = lazy(() => import('./features/analytics/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })));
const SettingsPage = lazy(() => import('./features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const NetworkPage = lazy(() => import('./features/network/NetworkPage').then((m) => ({ default: m.NetworkPage })));
const RouteManagementPage = lazy(() => import('./features/routes/RouteManagementPage').then((m) => ({ default: m.RouteManagementPage })));
const NotificationsPage = lazy(() => import('./features/notifications/NotificationsPage').then((m) => ({ default: m.NotificationsPage })));
const TeamPage = lazy(() => import('./features/team/TeamPage').then((m) => ({ default: m.TeamPage })));

// Ops-manager routes under the app shell. Login is always enforced (in-house OTP auth; see lib/config).
export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={authEnabled ? <RequireAuth><AppShell /></RequireAuth> : <AppShell />}>
        <Route path="/" element={<OverviewPage />} />
        <Route path="/trips" element={<TripsPage />} />
        <Route path="/trips/:id" element={<TripDetailPage />} />
        <Route path="/fleet" element={<FleetPage />} />
        <Route path="/network" element={<NetworkPage />} />
        <Route path="/routes" element={<RouteManagementPage />} />
        <Route path="/bookings" element={<BookingsPage />} />
        <Route path="/parcels" element={<ParcelsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/users" element={<RequireRole roles={ADMIN_ROLES}><TeamPage /></RequireRole>} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
