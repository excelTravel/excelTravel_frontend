import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { TripRequestsBoard } from './TripRequestsBoard';

// Integration test: renders the real board against the MSW-mocked /trip-requests response, proving
// two open requests from different agents on the same route pool into a single card with a summed count.
describe('TripRequestsBoard (integration)', () => {
  it('pools two agents’ open requests on the same route into one card', async () => {
    renderWithProviders(<TripRequestsBoard />);

    expect(await screen.findByText('Kigali → Huye')).toBeInTheDocument();
    expect(screen.getByText('10 pax')).toBeInTheDocument();
    expect(screen.getByText((_, el) => el?.textContent === 'Claudine Ingabire · 6 pax')).toBeInTheDocument();
    expect(screen.getByText((_, el) => el?.textContent === 'Eric Habimana · 4 pax')).toBeInTheDocument();
  });
});
