import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { PageSkeleton } from '@/app/pages/PageSkeleton';

// App layout: slim sidebar + top bar over the glass gradient ground; routed pages render in the outlet.
// Each page provides its own entrance motion (via <Reveal>), so there's no page-level AnimatePresence
// wrapper here — a mode="wait" wrapper was stranding pages at opacity:0 after repeated navigation.
export function AppShell() {
  return (
    <div className="app-gradient min-h-dvh">
      <Sidebar />
      <div className="pl-24">
        <Header />
        <main className="px-8 pb-10">
          <Suspense fallback={<PageSkeleton />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
