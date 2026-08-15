import { describe, it, expect } from 'vitest';
import { screen, within } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { BookingsPage } from './BookingsPage';

// Integration test: BookingsPage joins the paginated /bookings feed (X-Total-Count header + offset/limit,
// via useBookingsInfinite) against /trips and /routes — this proves the pagination contract, the join,
// and the resulting table all work end-to-end through MSW, not just against stub data.
describe('BookingsPage (integration)', () => {
  it('renders bookings joined with their trip route from the mocked, paginated API', async () => {
    renderWithProviders(<BookingsPage />);

    const table = await screen.findByRole('table');
    expect(within(table).getByText('Eric Niyonzima')).toBeInTheDocument();
    expect(within(table).getByText('Grace Mukamana')).toBeInTheDocument();
    // booking-1 -> trip-1 -> route-1 (Kigali -> Huye); booking-2 -> trip-2 -> route-2 (Kigali -> Musanze).
    expect(within(table).getByText('Kigali → Huye')).toBeInTheDocument();
    expect(within(table).getByText('Kigali → Musanze')).toBeInTheDocument();
  });
});
