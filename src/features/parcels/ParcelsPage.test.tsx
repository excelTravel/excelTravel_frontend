import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { ParcelsPage } from './ParcelsPage';

// Integration test: renders the real page against MSW-mocked backend responses, proving the master
// manifest (usePackages -> GET /packages, joined client-side with useStops -> GET /stops) renders real
// package data, not stub rows.
describe('ParcelsPage (integration)', () => {
  it('renders manifest rows from the mocked /packages response', async () => {
    renderWithProviders(<ParcelsPage />);

    expect(await screen.findByText('Eric Niyonzima')).toBeInTheDocument();
    expect(screen.getByText((_, el) => el?.textContent === '→ Grace Mukamana')).toBeInTheDocument();
    expect(screen.getByText('Documents')).toBeInTheDocument();
  });
});
