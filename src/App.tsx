import { useTranslation } from 'react-i18next';
import { Bus, Moon, Sun } from 'lucide-react';
import { useTheme } from './store/theme';

// Placeholder shell that proves the token system (teal accent, glass, dark mode, i18n) works.
// Real screens replace this once the designs land.
export function App() {
  const { theme, toggle } = useTheme();
  const { t, i18n } = useTranslation();

  return (
    <div className="app-gradient min-h-dvh">
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2 font-semibold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Bus className="h-5 w-5" />
          </span>
          {t('app.name')}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => i18n.changeLanguage(i18n.language === 'kin' ? 'en' : 'kin')}
            className="glass rounded-lg px-3 py-2 text-sm font-medium"
          >
            {i18n.language === 'kin' ? 'EN' : 'KIN'}
          </button>
          <button onClick={toggle} className="glass rounded-lg px-3 py-2" aria-label={t('common.toggleTheme')}>
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16">
        <div className="glass rounded-2xl p-8 shadow-sm">
          <h1 className="text-2xl font-bold tracking-tight">{t('foundation.title')}</h1>
          <p className="mt-2 text-muted-foreground">{t('foundation.body')}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <span className="rounded-full bg-primary px-3 py-1 text-sm text-primary-foreground">Primary · teal</span>
            <span className="rounded-full bg-success px-3 py-1 text-sm text-white">Success</span>
            <span className="rounded-full bg-warning px-3 py-1 text-sm text-white">Warning</span>
            <span className="rounded-full bg-destructive px-3 py-1 text-sm text-destructive-foreground">Danger</span>
          </div>
        </div>
      </main>
    </div>
  );
}
