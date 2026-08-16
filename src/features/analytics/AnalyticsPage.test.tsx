import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { AnalyticsPage } from './AnalyticsPage';

// Integration test: renders the real page against MSW-mocked backend responses, proving the route
// performance table (useRouteRevenue -> GET /analytics/routes/revenue) renders real route data.
describe('AnalyticsPage (integration)', () => {
  it('renders route performance rows from the mocked /analytics/routes/revenue response', async () => {
    renderWithProviders(<AnalyticsPage />);

    expect(await screen.findByText('Kigali → Huye')).toBeInTheDocument();
    expect(screen.getByText('Kigali → Musanze')).toBeInTheDocument();
  });
});
