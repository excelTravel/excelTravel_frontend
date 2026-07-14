import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import type { SortDir } from '@/lib/useSort';
import { cn } from '@/lib/utils';

// A clickable, accessible sortable column header. Reports aria-sort and shows the current direction.
export function SortableTh({
  label,
  sortKey,
  activeKey,
  dir,
  onSort,
  align = 'left',
  className,
}: {
  label: string;
  sortKey: string;
  activeKey: string;
  dir: SortDir;
  onSort: (key: string) => void;
  align?: 'left' | 'right';
  className?: string;
}) {
  const active = activeKey === sortKey;
  return (
    <th
      className={cn('px-4 py-3 font-medium', align === 'right' && 'text-right', className)}
      aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          'inline-flex items-center gap-1 rounded transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          align === 'right' && 'flex-row-reverse',
        )}
      >
        {label}
        {active ? (
          dir === 'asc' ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />
        ) : (
          <ChevronsUpDown className="size-3.5 opacity-40" />
        )}
      </button>
    </th>
  );
}
