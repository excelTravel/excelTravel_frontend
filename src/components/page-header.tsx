import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

// Per-section content heading. The section name now lives in the top bar, so `title` is optional —
// most sections pass only a subtitle + actions (or just actions in a slim toolbar row).
export function PageHeader({ title, subtitle, actions }: { title?: string; subtitle?: string; actions?: ReactNode }) {
  const hasText = Boolean(title || subtitle);
  return (
    <div className={cn('flex flex-wrap items-start gap-4', hasText ? 'justify-between' : 'justify-end')}>
      {hasText && (
        <div>
          {title && <h2 className="text-3xl font-bold tracking-tight text-[hsl(var(--navy))] dark:text-foreground">{title}</h2>}
          {subtitle && <p className={cn('text-sm text-muted-foreground', title && 'mt-1')}>{subtitle}</p>}
        </div>
      )}
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
