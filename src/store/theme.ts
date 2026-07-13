import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  toggle: () => void;
  set: (t: Theme) => void;
}

function initialTheme(): Theme {
  const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('theme') : null;
  if (saved === 'light' || saved === 'dark') return saved;
  const prefersDark = typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

function apply(theme: Theme): void {
  if (typeof document !== 'undefined') document.documentElement.classList.toggle('dark', theme === 'dark');
  if (typeof localStorage !== 'undefined') localStorage.setItem('theme', theme);
}

const first = initialTheme();
apply(first);

export const useTheme = create<ThemeState>((set, get) => ({
  theme: first,
  toggle: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    apply(next);
    set({ theme: next });
  },
  set: (t) => {
    apply(t);
    set({ theme: t });
  },
}));
