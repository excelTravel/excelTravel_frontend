import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/store/theme';
import { useCurrentUser, getGreetingPeriod } from '@/lib/currentUser';
import { NotificationBell } from '@/features/notifications/NotificationBell';
import { DateRangePicker } from '@/components/date-range-picker';
import { cn } from '@/lib/utils';
import { opsNav } from './nav';

function usePageTitle(): string {
  const { pathname } = useLocation();
  const match = opsNav.find((n) => (n.to === '/' ? pathname === '/' : pathname.startsWith(n.to)));
  return match?.label ?? 'excelTravel';
}

// 88px top bar. On the home route it greets the manager; elsewhere it shows the page title.
export function Header() {
  const { pathname } = useLocation();
  const isHome = pathname === '/';
  const title = usePageTitle();
  const { theme, toggle } = useTheme();
  const { t, i18n } = useTranslation();
  const lang = i18n.language === 'kin' ? 'kin' : 'en';
  const user = useCurrentUser();

  return (
    <header className="sticky top-0 z-20 flex h-[88px] items-center justify-between gap-4 px-8">
      {isHome ? (
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[hsl(var(--navy))] dark:text-foreground">
            {t(`home.${getGreetingPeriod()}`, { name: user.firstName })}
          </h1>
          <p className="text-sm text-muted-foreground">{t('home.subtitle')}</p>
        </div>
      ) : (
        <h1 className="text-3xl font-bold tracking-tight text-[hsl(var(--navy))] dark:text-foreground">{title}</h1>
      )}

      <div className="flex items-center gap-4">
        <DateRangePicker />

        <button
          type="button"
          onClick={toggle}
          aria-label={t('common.toggleTheme')}
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          {theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </button>

        <NotificationBell />

        <div className="h-6 w-px bg-border" aria-hidden />

        <div className="flex items-center gap-1" role="group" aria-label="Language">
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

        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-full border-2 border-card bg-primary/10 text-sm font-bold text-primary">
            {user.firstName.slice(0, 1)}
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold text-foreground">{user.role}</div>
            <div className="text-[11px] font-medium text-muted-foreground">{user.location}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
