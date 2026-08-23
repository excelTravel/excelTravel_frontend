import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { FleetPage } from './FleetPage';

// Integration test: renders the real page against MSW-mocked backend responses, proving the default
// Vehicles tab -> useVehicles -> VehicleCard chain renders real fleet data, not stub cards.
describe('FleetPage (integration)', () => {
  it('renders vehicle cards from the mocked /vehicles response on the default tab', async () => {
    renderWithProviders(<FleetPage />);

    expect(await screen.findByText('RAA 001 A')).toBeInTheDocument();
    expect(screen.getByText('RAA 002 B')).toBeInTheDocument();
    expect(screen.getByText((_, el) => el?.textContent === 'Yutong ZK6122 · 2022')).toBeInTheDocument();
    expect(screen.getByText((_, el) => el?.textContent === 'Toyota Coaster · 2021')).toBeInTheDocument();
  });
});
