import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SectionTab<T extends string> {
  key: T;
  label: string;
  icon?: LucideIcon;
  count?: number;
}

// The standard sub-section switcher: a pill row that sits between the KPI cards and the content. It renders
// at a fixed height so switching tabs never nudges the cards or headers above it (only the content below
// changes). Reuse this everywhere for a consistent look + no layout shift.
export function SectionTabs<T extends string>({
  tabs,
  active,
  onChange,
  ariaLabel,
}: {
  tabs: SectionTab<T>[];
  active: T;
  onChange: (t: T) => void;
  ariaLabel?: string;
}) {
  return (
    <div role="tablist" aria-label={ariaLabel} className="inline-flex flex-wrap gap-1 rounded-xl bg-secondary/60 p-1">
      {tabs.map((t) => (
        <button
          key={t.key}
          role="tab"
          aria-selected={active === t.key}
          onClick={() => onChange(t.key)}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
            active === t.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {t.icon && <t.icon className="size-4" />}
          {t.label}
          {t.count !== undefined && (
            <span className="rounded-full bg-secondary px-1.5 text-xs tabular-nums text-muted-foreground">{t.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
