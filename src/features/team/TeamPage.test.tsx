import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { TeamPage } from './TeamPage';

// Integration test: renders the real page against MSW-mocked backend responses, proving the default
// Staff tab -> useUsers -> StaffPanel chain renders real user data, not stub rows.
describe('TeamPage (integration)', () => {
  it('renders staff rows from the mocked /users response on the default tab', async () => {
    renderWithProviders(<TeamPage />);

    expect(await screen.findByText('Test Admin')).toBeInTheDocument();
    expect(screen.getByText('admin@exceltravel.rw')).toBeInTheDocument();
  });
});
