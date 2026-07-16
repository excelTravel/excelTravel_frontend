import { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { authEnabled } from './lib/config';
import { AppShell } from './app/shell/AppShell';
import { RequireAuth } from './features/auth/RequireAuth';
import { PlaceholderPage } from './app/pages/PlaceholderPage';

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
const LiveMapPage = lazy(() => import('./features/map/LiveMapPage').then((m) => ({ default: m.LiveMapPage })));
const SettingsPage = lazy(() => import('./features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const NetworkPage = lazy(() => import('./features/network/NetworkPage').then((m) => ({ default: m.NetworkPage })));
const NotificationsPage = lazy(() => import('./features/notifications/NotificationsPage').then((m) => ({ default: m.NotificationsPage })));
const TeamPage = lazy(() => import('./features/team/TeamPage').then((m) => ({ default: m.TeamPage })));
const AdminPage = lazy(() => import('./features/admin/AdminPage').then((m) => ({ default: m.AdminPage })));

// Ops-manager routes under the app shell. When a Clerk key is set, the shell is gated behind login.
export function App() {
  return (
    <Routes>
      {authEnabled && <Route path="/login/*" element={<LoginPage />} />}
      <Route element={authEnabled ? <RequireAuth><AppShell /></RequireAuth> : <AppShell />}>
        <Route path="/" element={<OverviewPage />} />
        <Route path="/map" element={<LiveMapPage />} />
        <Route path="/trips" element={<TripsPage />} />
        <Route path="/trips/:id" element={<TripDetailPage />} />
        <Route path="/fleet" element={<FleetPage />} />
        <Route path="/network" element={<NetworkPage />} />
        <Route path="/bookings" element={<BookingsPage />} />
        <Route path="/parcels" element={<ParcelsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/team" element={<TeamPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="*" element={<PlaceholderPage title="Not found" />} />
      </Route>
    </Routes>
  );
}
