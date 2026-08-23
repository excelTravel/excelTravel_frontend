import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { StaffPage } from './StaffPage';

// Integration test: renders the real page against MSW-mocked backend responses, proving the default
// Staff tab -> useUsers -> StaffPanel chain renders real user data, not stub rows.
describe('StaffPage (integration)', () => {
  it('renders staff rows from the mocked /users response on the default tab', async () => {
    renderWithProviders(<StaffPage />);

    expect(await screen.findByText('Test Admin')).toBeInTheDocument();
    expect(screen.getByText('admin@exceltravel.rw')).toBeInTheDocument();
  });
});
