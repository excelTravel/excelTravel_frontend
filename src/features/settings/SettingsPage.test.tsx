import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { SettingsPage } from './SettingsPage';

// Integration test: renders the real page against MSW-mocked backend responses, proving the profile
// and company fields (useMe -> GET /me, useCompanies -> GET /companies) populate from real data, not
// stub placeholders.
describe('SettingsPage (integration)', () => {
  it('populates profile and company fields from the mocked /me and /companies responses', async () => {
    renderWithProviders(<SettingsPage />);

    await waitFor(() => expect(screen.getByLabelText('Display name')).toHaveValue('Test Admin'));
    await waitFor(() => expect(screen.getByLabelText('Company name')).toHaveValue('Excel Travel and Tours'));
  });
});
