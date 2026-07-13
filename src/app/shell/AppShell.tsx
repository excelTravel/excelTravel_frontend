import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

// App layout: slim sidebar + top bar over the glass gradient ground; routed pages render in the outlet.
export function AppShell() {
  return (
    <div className="app-gradient min-h-dvh">
      <Sidebar />
      <div className="pl-24">
        <Header />
        <main className="px-8 pb-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
