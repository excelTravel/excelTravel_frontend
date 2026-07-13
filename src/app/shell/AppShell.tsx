import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { PageTransition } from '@/components/motion/Motion';

// App layout: slim sidebar + top bar over the glass gradient ground; routed pages render in the outlet.
export function AppShell() {
  const location = useLocation();
  return (
    <div className="app-gradient min-h-dvh">
      <Sidebar />
      <div className="pl-24">
        <Header />
        <main className="px-8 pb-10">
          {/* Keyed on the path so each navigation animates the old page out and the new one in. */}
          <AnimatePresence mode="wait">
            <PageTransition key={location.pathname}>
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
