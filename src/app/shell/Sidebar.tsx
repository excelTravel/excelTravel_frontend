import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bus, LogOut } from 'lucide-react';
import { useUi } from '@/store/ui';
import { cn } from '@/lib/utils';
import { opsNav } from './nav';

// Slim navy glass rail: static on desktop (≥lg), an off-canvas drawer on mobile controlled by the UI store
// (open via the header menu, the edge handle, or a left-to-right swipe; closes on backdrop tap or nav).
export function Sidebar() {
  const { t } = useTranslation();
  const { sidebarOpen, closeSidebar } = useUi();

  return (
    <aside
      aria-label={t('nav.primary')}
      className={cn(
        'fixed inset-y-0 left-0 z-50 flex w-24 flex-col border-r border-white/10 bg-[hsl(var(--navy)/0.98)] shadow-[4px_0_24px_rgba(15,33,74,0.25)] backdrop-blur-md transition-transform duration-300 ease-out lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      )}
    >
      {/* Logo */}
      <div className="flex flex-col items-center gap-2 py-6">
        <div className="grid size-12 place-items-center rounded-3xl bg-gradient-to-br from-blue-500 to-teal shadow-lg">
          <div className="grid size-10 place-items-center rounded-2xl bg-white">
            <Bus className="size-5 text-[hsl(var(--navy))]" />
          </div>
        </div>
        <span className="text-[10px] font-bold tracking-wide text-white">ExcelTravel</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-2 overflow-y-auto px-2 py-2">
        {opsNav.map(({ to, labelKey, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={closeSidebar}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1.5 rounded-3xl px-2 py-3 text-center text-[10px] font-medium transition-colors',
                isActive
                  ? 'border border-white/10 bg-white/20 text-white shadow-[0_4px_12px_rgba(0,0,0,0.1)]'
                  : 'text-white/50 hover:bg-white/10 hover:text-white/80',
              )
            }
          >
            <Icon className="size-5" aria-hidden />
            {t(labelKey)}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="border-t border-white/10 py-4">
        <button
          type="button"
          className="flex w-full flex-col items-center gap-1.5 text-[10px] font-bold text-destructive transition-opacity hover:opacity-80"
        >
          <LogOut className="size-4" aria-hidden />
          {t('nav.logout')}
        </button>
      </div>
    </aside>
  );
}
