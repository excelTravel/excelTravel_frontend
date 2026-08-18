import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { TeamPage } from './TeamPage';

// Integration test: renders the real page against MSW-mocked backend responses, proving the
// useEndpoints -> PassengersPanel chain renders real passenger data, not stub rows. Staff/agent/driver
// management lives in its own Staff section (src/features/staff/) — this page is passengers only.
describe('TeamPage (integration)', () => {
  it('renders passenger rows from the mocked /passengers response', async () => {
    renderWithProviders(<TeamPage />);

    expect(await screen.findByText('Eric Niyonzima')).toBeInTheDocument();
    expect(screen.getByText('+250788000001')).toBeInTheDocument();
  });
});
