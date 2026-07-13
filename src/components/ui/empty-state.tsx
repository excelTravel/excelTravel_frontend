import type { LucideIcon } from 'lucide-react';
import { Button } from './button';

// A helpful empty state — contextual copy + one primary action, never a blank card.
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border p-10 text-center">
      <div className="grid size-12 place-items-center rounded-full bg-secondary text-muted-foreground">
        <Icon className="size-6" aria-hidden />
      </div>
      <div>
        <p className="font-semibold">{title}</p>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && (
        <Button size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
