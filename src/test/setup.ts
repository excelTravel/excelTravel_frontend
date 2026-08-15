import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './msw/server';

// MSW intercepts every apiFetch call for the whole test run; each test starts from the same baseline
// handlers (src/test/msw/handlers.ts) and can layer overrides with server.use(...), reset automatically
// after itself by afterEach.
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// jsdom doesn't implement URL.createObjectURL — MapLibre GL (lazy-loaded behind Suspense on pages with
// a live map) touches it on init; the map itself isn't under test, this just keeps the console clean.
if (typeof window !== 'undefined' && !window.URL.createObjectURL) {
  window.URL.createObjectURL = () => 'blob:mock';
}

// jsdom doesn't implement ResizeObserver — Recharts' ResponsiveContainer needs one to measure its box.
if (typeof window !== 'undefined' && !window.ResizeObserver) {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// jsdom doesn't implement matchMedia — provide a minimal stub for the theme store.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
