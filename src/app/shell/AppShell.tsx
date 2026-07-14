import { Suspense, useRef, type TouchEvent } from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useUi } from '@/store/ui';
import { PageSkeleton } from '@/app/pages/PageSkeleton';

// App layout: navy rail + blurred top bar over the glass gradient ground. On mobile the rail is a drawer,
// openable by the header menu, the left-edge handle, or a left-to-right swipe.
export function AppShell() {
  const { t } = useTranslation();
  const { sidebarOpen, openSidebar, closeSidebar } = useUi();
  const touch = useRef<{ x: number; y: number } | null>(null);

  function onTouchStart(e: TouchEvent) {
    const p = e.touches[0];
    if (p) touch.current = { x: p.clientX, y: p.clientY };
  }
  function onTouchEnd(e: TouchEvent) {
    const start = touch.current;
    const end = e.changedTouches[0];
    touch.current = null;
    if (!start || !end) return;
    const dx = end.clientX - start.x;
    const dy = end.clientY - start.y;
    if (Math.abs(dx) < 55 || Math.abs(dy) > Math.abs(dx)) return; // horizontal intent only
    if (dx > 0 && start.x < 32 && !sidebarOpen) openSidebar();
    else if (dx < 0 && sidebarOpen) closeSidebar();
  }

  return (
    <div className="app-gradient min-h-dvh" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <Sidebar />

      {/* Mobile backdrop when the drawer is open */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label={t('nav.closeMenu')}
          onClick={closeSidebar}
          className="fixed inset-0 z-40 bg-[hsl(var(--navy))]/50 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Left-edge handle — the affordance that the drawer is there (mobile, when closed) */}
      {!sidebarOpen && (
        <button
          type="button"
          onClick={openSidebar}
          aria-label={t('nav.openMenu')}
          className="fixed left-0 top-1/2 z-30 grid h-16 w-4 -translate-y-1/2 place-items-center rounded-r-lg bg-[hsl(var(--navy))]/90 text-white/80 shadow-lg lg:hidden"
        >
          <ChevronRight className="size-3.5" />
        </button>
      )}

      <div className="lg:pl-24">
        <Header />
        <main className="px-4 pb-10 sm:px-6 lg:px-8">
          <Suspense fallback={<PageSkeleton />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
