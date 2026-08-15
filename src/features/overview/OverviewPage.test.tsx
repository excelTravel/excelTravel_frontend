import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { OverviewPage } from './OverviewPage';

// Integration test: renders the real page against MSW-mocked backend responses (src/test/msw), proving
// the OverviewPage -> useOverview -> apiFetch -> live data chain actually renders real content, not stub
// data — this is exactly the wiring the (now-corrected) CLAUDE.md screen checklist claims is live.
describe('OverviewPage (integration)', () => {
  it('renders live KPIs and the top-routes list from the mocked /analytics/overview response', async () => {
    renderWithProviders(<OverviewPage />);

    // KPI row — the fixture's dailyRevenue (160,000) is formatted through the app's own K() abbreviator.
    expect(await screen.findByText('160K')).toBeInTheDocument();
    expect(screen.getByText('32')).toBeInTheDocument(); // ticketsToday
    expect(screen.getByText('4')).toBeInTheDocument(); // busesActive

    // Top routes list — real route names joined from the fixture, not placeholder text.
    expect(await screen.findByText('Kigali → Huye')).toBeInTheDocument();
    expect(screen.getByText('Kigali → Musanze')).toBeInTheDocument();
  });
});
