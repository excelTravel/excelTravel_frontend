import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { StopsSection } from './StopsSection';

// Integration test: renders the real Stops table against the MSW-mocked /stops response, proving
// useStops -> DataTable renders real station data. Kept separate from NetworkPage/NetworkMap, which
// mounts a live MapLibre GL canvas that jsdom (no WebGL) can't render.
describe('StopsSection (integration)', () => {
  it('renders stop rows from the mocked /stops response', async () => {
    renderWithProviders(<StopsSection />);

    expect(await screen.findByText('Nyabugogo Station')).toBeInTheDocument();
    expect(screen.getByText('Huye Station')).toBeInTheDocument();
  });
});
