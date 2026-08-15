import { describe, it, expect } from 'vitest';
import { screen, within } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { TripsPage } from './TripsPage';

// Integration test: TripsPage composes useTripRows (joins /trips with /routes) and useWaitlists — this
// proves that join + the resulting table actually render real, joined data through MSW.
describe('TripsPage (integration)', () => {
  it('renders trip rows joined with their route origin/destination from the mocked API', async () => {
    renderWithProviders(<TripsPage />);

    const table = await screen.findByRole('table');
    expect(within(table).getByText('#101')).toBeInTheDocument();
    expect(within(table).getByText('#102')).toBeInTheDocument();
    // route-1 (trip-1) is Kigali -> Huye; route-2 (trip-2) is Kigali -> Musanze — both origins render,
    // proving the client-side join against /routes actually resolved (not left as raw ids).
    expect(within(table).getAllByText('Kigali').length).toBeGreaterThan(0);
    expect(within(table).getByText('Huye')).toBeInTheDocument();
    expect(within(table).getByText('Musanze')).toBeInTheDocument();
  });
});
