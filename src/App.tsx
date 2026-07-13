import { Routes, Route } from 'react-router-dom';
import { authEnabled } from './lib/config';
import { AppShell } from './app/shell/AppShell';
import { RequireAuth } from './features/auth/RequireAuth';
import { LoginPage } from './features/auth/LoginPage';
import { PlaceholderPage } from './app/pages/PlaceholderPage';
import { OverviewPage } from './features/overview/OverviewPage';
import { FleetPage } from './features/fleet/FleetPage';
import { TripDetailPage } from './features/trips/TripDetailPage';
import { BookingsPage } from './features/bookings/BookingsPage';
import { ParcelsPage } from './features/parcels/ParcelsPage';
import { AnalyticsPage } from './features/analytics/AnalyticsPage';

// Ops-manager routes under the app shell. When a Clerk key is set, the shell is gated behind login.
export function App() {
  return (
    <Routes>
      {authEnabled && <Route path="/login/*" element={<LoginPage />} />}
      <Route element={authEnabled ? <RequireAuth><AppShell /></RequireAuth> : <AppShell />}>
        <Route path="/" element={<OverviewPage />} />
        <Route path="/map" element={<PlaceholderPage title="Live Map" />} />
        <Route path="/trips" element={<TripDetailPage />} />
        <Route path="/fleet" element={<FleetPage />} />
        <Route path="/bookings" element={<BookingsPage />} />
        <Route path="/parcels" element={<ParcelsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="*" element={<PlaceholderPage title="Not found" />} />
      </Route>
    </Routes>
  );
}
