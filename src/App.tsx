import { Routes, Route } from 'react-router-dom';
import { AppShell } from './app/shell/AppShell';
import { PlaceholderPage } from './app/pages/PlaceholderPage';
import { OverviewPage } from './features/overview/OverviewPage';
import { FleetPage } from './features/fleet/FleetPage';
import { TripDetailPage } from './features/trips/TripDetailPage';

// Ops-manager routes under the app shell. Screens are filled in one by one from the Figma designs.
export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<OverviewPage />} />
        <Route path="/map" element={<PlaceholderPage title="Live Map" />} />
        <Route path="/trips" element={<TripDetailPage />} />
        <Route path="/fleet" element={<FleetPage />} />
        <Route path="/bookings" element={<PlaceholderPage title="Bookings" />} />
        <Route path="/parcels" element={<PlaceholderPage title="Parcels" />} />
        <Route path="/analytics" element={<PlaceholderPage title="Analytics" />} />
        <Route path="*" element={<PlaceholderPage title="Not found" />} />
      </Route>
    </Routes>
  );
}
