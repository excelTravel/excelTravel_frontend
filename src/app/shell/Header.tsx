import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, Calendar, ChevronDown, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/store/theme';
import { cn } from '@/lib/utils';
import { opsNav } from './nav';

// Derive the page title from the active route (the design's big navy heading).
function usePageTitle(): string {
  const { pathname } = useLocation();
  const match = opsNav.find((n) => (n.to === '/' ? pathname === '/' : pathname.startsWith(n.to)));
  return match?.label ?? 'excelTravel';
}

// 88px top bar: page title · date range · theme · notifications · EN/KIN · profile (from the Figma design).
export function Header() {
  const title = usePageTitle();
  const { theme, toggle } = useTheme();
  const { i18n } = useTranslation();
  const lang = i18n.language === 'kin' ? 'kin' : 'en';

  return (
    <header className="sticky top-0 z-20 flex h-[88px] items-center justify-between gap-4 px-8">
      <h1 className="text-3xl font-bold tracking-tight text-[hsl(var(--navy))] dark:text-foreground">{title}</h1>

      <div className="flex items-center gap-4">
        {/* Date range — placeholder trigger; wired to a real range picker when Analytics lands.
            Deep-teal (not the mint #1FD59F) so the white label is readable (contrast fix). */}
        <button
          type="button"
          className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-transform active:scale-[0.98]"
        >
          <Calendar className="size-4" aria-hidden />
          Oct 12 – Oct 18, 2023
          <ChevronDown className="size-3.5" aria-hidden />
        </button>

        <button
          type="button"
          onClick={toggle}
          aria-label="Toggle theme"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          {theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </button>

        <button
          type="button"
          aria-label="Notifications"
          className="relative text-muted-foreground transition-colors hover:text-foreground"
        >
          <Bell className="size-5" />
          <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-destructive" aria-hidden />
        </button>

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
            OM
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold text-foreground">Ops Manager</div>
            <div className="text-[11px] font-medium text-muted-foreground">Kigali HQ</div>
          </div>
        </div>
      </div>
    </header>
  );
}
