import { useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, Search, SlidersHorizontal } from 'lucide-react';
import { Button } from './button';
import { Table, Thead, Tbody, Td, Tr } from './table';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  sort?: (row: T) => string | number; // sortable when provided
  filter?: (row: T) => string; // filterable when provided (distinct-value dropdown)
  align?: 'right';
  th?: string;
  td?: string;
}

interface DataTableProps<T> {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  search?: (row: T) => string; // searchable text; enables the search box
  searchPlaceholder?: string;
  pageSize?: number;
  toolbarRight?: ReactNode; // extra actions (e.g. an Add button)
  empty?: ReactNode;
}

// One table component with search, per-column filtering (only on columns given a `filter`), sortable
// headers, and fixed 10-row pagination. Everything is client-side over the passed rows.
export function DataTable<T>({
  rows,
  columns,
  rowKey,
  onRowClick,
  search,
  searchPlaceholder,
  pageSize = 10,
  toolbarRight,
  empty,
}: DataTableProps<T>) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);

  const filterCols = columns.filter((c) => c.filter);

  // Distinct values per filterable column (for its dropdown).
  const options = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const c of filterCols) {
      map[c.key] = [...new Set(rows.map((r) => c.filter!(r)).filter(Boolean))].sort();
    }
    return map;
  }, [rows, filterCols]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (q && search && !search(r).toLowerCase().includes(q)) return false;
      for (const c of filterCols) {
        const val = filters[c.key];
        if (val && c.filter!(r) !== val) return false;
      }
      return true;
    });
  }, [rows, query, filters, search, filterCols]);

  const sorted = useMemo(() => {
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sort) return filtered;
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = col.sort!(a);
      const bv = col.sort!(b);
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
  }, [filtered, columns, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const clampedPage = Math.min(page, pageCount - 1);
  const paged = sorted.slice(clampedPage * pageSize, clampedPage * pageSize + pageSize);

  function toggleSort(key: string) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  }
  function setFilter(key: string, val: string) {
    setFilters((f) => ({ ...f, [key]: val }));
    setPage(0);
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          {search && (
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(0); }}
                placeholder={searchPlaceholder ?? t('table.search')}
                aria-label={searchPlaceholder ?? t('table.search')}
                className="h-9 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-56"
              />
            </div>
          )}
          {filterCols.length > 0 && (
            <Button variant={showFilters ? 'default' : 'outline'} size="sm" onClick={() => setShowFilters((v) => !v)}>
              <SlidersHorizontal className="size-4" /> {t('table.filter')}
            </Button>
          )}
        </div>
        {toolbarRight}
      </div>

      {/* Filter row */}
      {showFilters && filterCols.length > 0 && (
        <div className="flex flex-wrap gap-3 border-t border-border bg-secondary/30 px-4 py-3">
          {filterCols.map((c) => (
            <label key={c.key} className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              {c.header}
              <select
                value={filters[c.key] ?? ''}
                onChange={(e) => setFilter(c.key, e.target.value)}
                className="h-8 rounded-lg border border-border bg-card px-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">{t('table.all')}</option>
                {options[c.key]?.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </label>
          ))}
        </div>
      )}

      <Table>
        <Thead>
          {columns.map((c) => (
            <th
              key={c.key}
              className={cn('whitespace-nowrap border-y border-border/70 px-5 py-3 font-semibold first:pl-6 last:pr-6', c.align === 'right' && 'text-right', c.th)}
              aria-sort={c.sort ? (sortKey === c.key ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none') : undefined}
            >
              {c.sort ? (
                <button
                  type="button"
                  onClick={() => toggleSort(c.key)}
                  className={cn('inline-flex items-center gap-1 rounded transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', c.align === 'right' && 'flex-row-reverse')}
                >
                  {c.header}
                  {sortKey === c.key ? (sortDir === 'asc' ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />) : <ChevronsUpDown className="size-3.5 opacity-40" />}
                </button>
              ) : c.header}
            </th>
          ))}
        </Thead>
        <Tbody>
          {paged.map((r) => (
            <Tr key={rowKey(r)} onClick={onRowClick ? () => onRowClick(r) : undefined}>
              {columns.map((c) => (
                <Td key={c.key} className={cn(c.align === 'right' && 'text-right', c.td)}>{c.cell(r)}</Td>
              ))}
            </Tr>
          ))}
        </Tbody>
      </Table>

      {paged.length === 0 && (
        <div className="p-10 text-center text-sm text-muted-foreground">{empty ?? t('table.empty')}</div>
      )}

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <p className="text-sm text-muted-foreground">
          {sorted.length === 0
            ? t('table.showingNone')
            : t('table.showing', { from: clampedPage * pageSize + 1, to: Math.min(sorted.length, (clampedPage + 1) * pageSize), total: sorted.length })}
        </p>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="size-8" disabled={clampedPage === 0} onClick={() => setPage(clampedPage - 1)} aria-label={t('table.prev')}>
            <ChevronLeft className="size-4" />
          </Button>
          <span className="px-2 text-sm tabular-nums text-muted-foreground">{clampedPage + 1} / {pageCount}</span>
          <Button variant="outline" size="icon" className="size-8" disabled={clampedPage >= pageCount - 1} onClick={() => setPage(clampedPage + 1)} aria-label={t('table.next')}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
