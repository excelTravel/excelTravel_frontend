import { useMemo, useState } from 'react';

export type SortDir = 'asc' | 'desc';

// Reusable client-side table sorting. `accessor(row, key)` returns the comparable value for a column key.
export function useSort<T>(
  rows: T[],
  accessor: (row: T, key: string) => string | number,
  initial?: { key: string; dir: SortDir },
) {
  const [key, setKey] = useState(initial?.key ?? '');
  const [dir, setDir] = useState<SortDir>(initial?.dir ?? 'asc');

  const sorted = useMemo(() => {
    if (!key) return rows;
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = accessor(a, key);
      const bv = accessor(b, key);
      const cmp =
        typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return dir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [rows, key, dir, accessor]);

  function toggle(k: string) {
    if (k === key) setDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setKey(k);
      setDir('asc');
    }
  }

  return { sorted, sortKey: key, sortDir: dir, toggle };
}
