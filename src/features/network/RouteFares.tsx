import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Info } from 'lucide-react';
import { Select } from '@/components/ui/form';
import { Async } from '@/components/ui/async';
import { useRoutes, useRoute, useStops, useFares } from '@/lib/api/hooks';
import { formatRWF } from '@/lib/utils';

// Per-route view of the national RURA fares: read each consecutive station-pair fare straight from the
// national matrix (no per-route pricing — the matrix is the single source of truth). A route stop that is a
// child stop resolves to its parent station for the lookup, mirroring the backend lookup_fare().
export function RouteFares() {
  const { t } = useTranslation();
  const routesQ = useRoutes();
  const stopsQ = useStops();
  const faresQ = useFares();
  const routes = routesQ.data ?? [];
  const [routeId, setRouteId] = useState('');
  const activeRouteId = routeId || routes[0]?.id;
  const routeQ = useRoute(activeRouteId);

  // Resolve any stop to its fare station (parent station for a child stop, else itself).
  const stationOf = useMemo(() => {
    const byId = new Map((stopsQ.data ?? []).map((s) => [s.id, s]));
    return (stopId: string) => byId.get(stopId)?.parentStationId ?? stopId;
  }, [stopsQ.data]);
  const nameOf = useMemo(() => {
    const byId = new Map((stopsQ.data ?? []).map((s) => [s.id, s.name]));
    return (stopId: string) => byId.get(stopId) ?? '—';
  }, [stopsQ.data]);

  // National fare matrix keyed by the unordered station pair (fares are the same both ways).
  const fareOf = useMemo(() => {
    const m = new Map<string, number>();
    for (const f of faresQ.data ?? []) {
      m.set([f.originStationId, f.destinationStationId].sort().join('|'), f.fareAmount);
    }
    return (a: string, b: string) => m.get([stationOf(a), stationOf(b)].sort().join('|'));
  }, [faresQ.data, stationOf]);

  const stops = [...(routeQ.data?.stops ?? [])].sort((a, b) => a.stopOrder - b.stopOrder);
  const legs = stops.slice(0, -1).map((s, i) => {
    const to = stops[i + 1]!;
    return { fromId: s.stopId, toId: to.stopId, fare: fareOf(s.stopId, to.stopId) };
  });
  const endToEnd = stops.length >= 2 ? fareOf(stops[0]!.stopId, stops[stops.length - 1]!.stopId) : undefined;

  return (
    <div>
      <div className="mb-4 max-w-xs">
        <Select value={activeRouteId ?? ''} onChange={(e) => setRouteId(e.target.value)} aria-label={t('network.selectRoute')} disabled={routesQ.isLoading}>
          {routes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </Select>
      </div>

      <Async
        query={routeQ}
        isEmpty={() => legs.length === 0}
        skeleton={<div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="shimmer h-11 rounded-xl" />)}</div>}
        empty={<p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">{t('network.noStops')}</p>}
      >
        {() => (
          <>
            <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
              {legs.map((leg) => (
                <li key={`${leg.fromId}-${leg.toId}`} className="flex items-center justify-between gap-2 px-4 py-3 text-sm">
                  <span className="flex items-center gap-2 font-medium">
                    {nameOf(leg.fromId)} <ArrowRight className="size-3.5 text-muted-foreground" /> {nameOf(leg.toId)}
                  </span>
                  <span className="font-semibold tabular-nums">{leg.fare != null ? formatRWF(leg.fare) : t('network.notSet')}</span>
                </li>
              ))}
            </ul>

            {stops.length >= 2 && (
              <div className="mt-3 flex items-center justify-between rounded-xl border border-teal/40 bg-teal/5 px-4 py-3 text-sm">
                <span className="flex items-center gap-2 font-semibold">
                  {nameOf(stops[0]!.stopId)} <ArrowRight className="size-3.5 text-muted-foreground" /> {nameOf(stops[stops.length - 1]!.stopId)}
                  <span className="text-xs font-normal text-muted-foreground">· {t('network.endToEnd')}</span>
                </span>
                <span className="font-bold tabular-nums">{endToEnd != null ? formatRWF(endToEnd) : t('network.notSet')}</span>
              </div>
            )}
          </>
        )}
      </Async>

      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Info className="size-3.5" /> {t('network.perRouteNote')}
      </p>
    </div>
  );
}
