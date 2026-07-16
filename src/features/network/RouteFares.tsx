import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Info } from 'lucide-react';
import { Select } from '@/components/ui/form';
import { ROUTES, fareBetween, stationName } from './network';
import { formatRWF } from '@/lib/utils';

// Per-route view of the national RURA fares: for the selected route we read each consecutive station-pair
// fare straight from the national matrix (no per-route pricing — the matrix stays the single source of truth).
export function RouteFares() {
  const { t } = useTranslation();
  const [routeId, setRouteId] = useState(ROUTES[0]!.id);
  const route = ROUTES.find((r) => r.id === routeId)!;

  const legs = route.stationIds.slice(0, -1).map((from, i) => {
    const to = route.stationIds[i + 1]!;
    return { from, to, fare: fareBetween(from, to) };
  });
  const endToEnd = fareBetween(route.stationIds[0]!, route.stationIds[route.stationIds.length - 1]!);

  return (
    <div>
      <div className="mb-4 max-w-xs">
        <Select value={routeId} onChange={(e) => setRouteId(e.target.value)} aria-label={t('network.selectRoute')}>
          {ROUTES.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </Select>
      </div>

      <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
        {legs.map((leg) => (
          <li key={`${leg.from}-${leg.to}`} className="flex items-center justify-between gap-2 px-4 py-3 text-sm">
            <span className="flex items-center gap-2 font-medium">
              {stationName(leg.from)} <ArrowRight className="size-3.5 text-muted-foreground" /> {stationName(leg.to)}
            </span>
            <span className="font-semibold tabular-nums">{leg.fare ? formatRWF(leg.fare) : t('network.notSet')}</span>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex items-center justify-between rounded-xl border border-teal/40 bg-teal/5 px-4 py-3 text-sm">
        <span className="flex items-center gap-2 font-semibold">
          {stationName(route.stationIds[0]!)} <ArrowRight className="size-3.5 text-muted-foreground" /> {stationName(route.stationIds[route.stationIds.length - 1]!)}
          <span className="text-xs font-normal text-muted-foreground">· {t('network.endToEnd')}</span>
        </span>
        <span className="font-bold tabular-nums">{endToEnd ? formatRWF(endToEnd) : t('network.notSet')}</span>
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Info className="size-3.5" /> {t('network.perRouteNote')}
      </p>
    </div>
  );
}
