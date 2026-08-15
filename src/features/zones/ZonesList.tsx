import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ApiAdminZone } from '@/lib/api/hooks';

const LEVEL_DOT: Record<ApiAdminZone['level'], string> = {
  province: 'bg-[#0F766E]',
  district: 'bg-[#14B8A6]',
  sector: 'bg-[#F59E0B]',
  cell: 'bg-[#8B5CF6]',
};

// A province→district→sector→cell tree with no precedent elsewhere in this codebase (no
// Collapsible/Accordion component exists) — a plain expand/collapse button row per level, lazily
// rendering children only once expanded so 2,600 rows never all mount at once. Typing a search
// auto-expands the path down to every match instead of requiring manual drill-down. Clicking any row
// both expands it (if it has children) and selects it — the parent draws the selected zone's polygon
// on the live map.
export function ZonesList({
  zones,
  maxHeight = 560,
  onSelectZone,
  selectedId,
}: {
  zones: ApiAdminZone[];
  maxHeight?: number;
  onSelectZone?: (zone: ApiAdminZone) => void;
  selectedId?: string | null;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const childrenByParent = useMemo(() => {
    const map = new Map<string | null, ApiAdminZone[]>();
    for (const z of zones) {
      const list = map.get(z.parentZoneId) ?? [];
      list.push(z);
      map.set(z.parentZoneId, list);
    }
    for (const list of map.values()) list.sort((a, b) => a.name.localeCompare(b.name));
    return map;
  }, [zones]);

  const zoneById = useMemo(() => new Map(zones.map((z) => [z.id, z])), [zones]);

  const q = query.trim().toLowerCase();
  const matchIds = useMemo(() => {
    if (q.length < 2) return null;
    return new Set(zones.filter((z) => z.name.toLowerCase().includes(q)).map((z) => z.id));
  }, [zones, q]);

  // Every ancestor of a match — these render open so the match's path down is always visible.
  const autoExpand = useMemo(() => {
    if (!matchIds) return null;
    const set = new Set<string>();
    for (const id of matchIds) {
      let cur = zoneById.get(id)?.parentZoneId ?? null;
      while (cur) {
        set.add(cur);
        cur = zoneById.get(cur)?.parentZoneId ?? null;
      }
    }
    return set;
  }, [matchIds, zoneById]);

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function visibleChildren(parentId: string | null): ApiAdminZone[] {
    const kids = childrenByParent.get(parentId) ?? [];
    if (!matchIds || !autoExpand) return kids;
    return kids.filter((k) => matchIds.has(k.id) || autoExpand.has(k.id));
  }

  const roots = visibleChildren(null);

  return (
    <div>
      <div className="border-b border-border p-4">
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('zones.search')}
            aria-label={t('zones.search')}
            className="h-9 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>
      {roots.length === 0 ? (
        <p className="p-10 text-center text-sm text-muted-foreground">{t('zones.noMatches')}</p>
      ) : (
        <ul className="overflow-y-auto p-2" style={{ maxHeight }}>
          {roots.map((z) => (
            <ZoneNode
              key={z.id}
              zone={z}
              depth={0}
              visibleChildren={visibleChildren}
              expanded={expanded}
              autoExpand={autoExpand}
              toggle={toggle}
              onSelectZone={onSelectZone}
              selectedId={selectedId}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function ZoneNode({
  zone,
  depth,
  visibleChildren,
  expanded,
  autoExpand,
  toggle,
  onSelectZone,
  selectedId,
}: {
  zone: ApiAdminZone;
  depth: number;
  visibleChildren: (parentId: string | null) => ApiAdminZone[];
  expanded: Set<string>;
  autoExpand: Set<string> | null;
  toggle: (id: string) => void;
  onSelectZone?: (zone: ApiAdminZone) => void;
  selectedId?: string | null;
}) {
  const kids = visibleChildren(zone.id);
  const hasKids = kids.length > 0;
  const isOpen = expanded.has(zone.id) || (autoExpand?.has(zone.id) ?? false);
  const isSelected = zone.id === selectedId;

  return (
    <li>
      <button
        type="button"
        onClick={() => {
          onSelectZone?.(zone);
          if (hasKids) toggle(zone.id);
        }}
        className={cn(
          'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors',
          isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-secondary/50',
        )}
        style={{ paddingLeft: 8 + depth * 20 }}
      >
        {hasKids ? (
          isOpen ? <ChevronDown className="size-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        ) : (
          <span className="size-4 shrink-0" />
        )}
        <span className={cn('size-2 shrink-0 rounded-full', LEVEL_DOT[zone.level])} aria-hidden />
        <span className="truncate font-medium">{zone.name}</span>
        {hasKids && <span className="ml-auto shrink-0 rounded-full bg-secondary px-1.5 text-xs tabular-nums text-muted-foreground">{kids.length}</span>}
      </button>
      {isOpen && hasKids && (
        <ul>
          {kids.map((k) => (
            <ZoneNode
              key={k.id}
              zone={k}
              depth={depth + 1}
              visibleChildren={visibleChildren}
              expanded={expanded}
              autoExpand={autoExpand}
              toggle={toggle}
              onSelectZone={onSelectZone}
              selectedId={selectedId}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
