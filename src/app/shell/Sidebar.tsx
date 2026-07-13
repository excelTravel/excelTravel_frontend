import { NavLink } from 'react-router-dom';
import { Bus, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { opsNav } from './nav';

// Slim 96px navy glass rail (from the Figma design): logo badge, stacked icon+label nav with a frosted
// active state, red logout pinned to the bottom.
export function Sidebar() {
  return (
    <aside
      aria-label="Primary navigation"
      className="fixed inset-y-0 left-0 z-30 flex w-24 flex-col border-r border-white/10 bg-[hsl(var(--navy)/0.96)] shadow-[4px_0_24px_rgba(15,33,74,0.15)] backdrop-blur-md"
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
        {opsNav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1.5 rounded-3xl px-2 py-3 text-[10px] font-medium transition-colors',
                isActive
                  ? 'border border-white/10 bg-white/20 text-white shadow-[0_4px_12px_rgba(0,0,0,0.1)]'
                  : 'text-white/50 hover:bg-white/10 hover:text-white/80',
              )
            }
          >
            <Icon className="size-5" aria-hidden />
            {label}
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
          LOGOUT
        </button>
      </div>
    </aside>
  );
}
