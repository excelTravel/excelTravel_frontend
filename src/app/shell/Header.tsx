import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Moon, Sun, Menu } from 'lucide-react';
import { useTheme } from '@/store/theme';
import { useUi } from '@/store/ui';
import { useCurrentUser, getGreetingPeriod } from '@/lib/currentUser';
import { NotificationBell } from '@/features/notifications/NotificationBell';
import { DateRangePicker } from '@/components/date-range-picker';
import { cn } from '@/lib/utils';

// Sticky, blurred top bar so page content scrolls cleanly beneath it. Left side greets the manager and
// names the section they're viewing; the date range sits centred; controls stay on the right.
export function Header() {
  const { theme, toggle } = useTheme();
  const openSidebar = useUi((s) => s.openSidebar);
  const { t, i18n } = useTranslation();
  const lang = i18n.language === 'kin' ? 'kin' : 'en';
  const user = useCurrentUser();

  return (
    <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between gap-3 border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={openSidebar}
          aria-label={t('nav.openMenu')}
          className="grid size-10 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground lg:hidden"
        >
          <Menu className="size-5" />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold tracking-tight text-[hsl(var(--navy))] dark:text-foreground sm:text-2xl">
            {t(`home.${getGreetingPeriod()}`, { name: user.fullName || user.firstName })}
          </h1>
        </div>
      </div>

      {/* Date range — centred over the layout on large screens. */}
      <div className="pointer-events-none absolute inset-x-0 hidden justify-center lg:flex">
        <div className="pointer-events-auto">
          <DateRangePicker />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <button
          type="button"
          onClick={toggle}
          aria-label={t('common.toggleTheme')}
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          {theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </button>

        <NotificationBell />

        <div className="hidden h-6 w-px bg-border sm:block" aria-hidden />

        <div className="hidden items-center gap-1 sm:flex" role="group" aria-label="Language">
          {(['en', 'kin'] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => void i18n.changeLanguage(l)}
              aria-pressed={lang === l}
              className={cn(
                'rounded-md px-2.5 py-1 text-sm font-semibold transition-colors',
                lang === l ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>

        <Link to="/settings" className="flex items-center gap-3 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={t('nav.settings')}>
          <div className="grid size-10 place-items-center rounded-full border-2 border-card bg-primary/10 text-sm font-bold text-primary">
            {user.firstName.slice(0, 1)}
          </div>
          <div className="hidden leading-tight sm:block">
            <div className="text-sm font-bold text-foreground">{user.role}</div>
            <div className="text-[11px] font-medium text-muted-foreground">{user.location}</div>
          </div>
        </Link>
      </div>
    </header>
  );
}
