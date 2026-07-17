import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, ArrowRight, Info } from 'lucide-react';
import { GlassCard } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge, StatusPill } from '@/components/ui/badge';
import { Table, Thead, Th, Tbody, Td, Tr } from '@/components/ui/table';
import { Reveal, RevealItem } from '@/components/motion/Motion';
import { formatRWF, cn } from '@/lib/utils';
import { Async } from '@/components/ui/async';
import { useRoutes, useStops, useFares } from '@/lib/api/hooks';
import { AddRouteModal, AddStopModal, AddFareModal } from './NetworkModals';
import { NetworkMap } from './NetworkMap';
import { RouteFares } from './RouteFares';

// Flattened: map + routes + stops + fares all stack on one scrolling page (no sub-tabs), Bookings-style.
export function NetworkPage() {
  return (
    <Reveal className="space-y-6">
      <RevealItem><NetworkMap /></RevealItem>
      <RevealItem><RoutesPanel /></RevealItem>
      <RevealItem><StopsPanel /></RevealItem>
      <RevealItem><FaresPanel /></RevealItem>
    </Reveal>
  );
}

function RoutesPanel() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const routes = useRoutes();
  const fmtDuration = (min: number | null) => (min == null ? '—' : `${Math.floor(min / 60)}h ${min % 60}m`);
  return (
    <GlassCard className="overflow-hidden">
      <AddRouteModal open={open} onClose={() => setOpen(false)} />
      <div className="flex items-center justify-between p-5">
        <h3 className="text-base font-semibold">{t('network.tabs.routes')}</h3>
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="size-4" /> {t('network.addRoute')}</Button>
      </div>
      <Async query={routes} isEmpty={(d) => d.length === 0} skeleton={<TableSkeleton cols={5} />} empty={<p className="p-10 text-center text-sm text-muted-foreground">{t('network.noRoutes')}</p>}>
        {(data) => (
          <Table>
            <Thead>
              <Th>{t('network.colRoute')}</Th>
              <Th>{t('network.colDistance')}</Th>
              <Th>{t('network.colDuration')}</Th>
              <Th>{t('network.colTimes')}</Th>
              <Th>{t('network.colStatus')}</Th>
            </Thead>
            <Tbody>
              {data.map((r) => (
                <Tr key={r.id}>
                  <Td className="whitespace-nowrap">
                    <p className="font-medium">{r.name}</p>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">{r.origin} <ArrowRight className="size-3" /> {r.destination}</p>
                  </Td>
                  <Td className="whitespace-nowrap tabular-nums">{r.distanceKm == null ? '—' : `${r.distanceKm} km`}</Td>
                  <Td className="whitespace-nowrap tabular-nums">{fmtDuration(r.estimatedDurationMin)}</Td>
                  <Td className="whitespace-nowrap tabular-nums text-muted-foreground">{r.departureTimes.length ? r.departureTimes.join(' · ') : '—'}</Td>
                  <Td><Badge tone={r.status === 'active' ? 'success' : 'neutral'}>{t(`network.${r.status}`)}</Badge></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Async>
    </GlassCard>
  );
}

function StopsPanel() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const stops = useStops();
  // Resolve a stop's parent-station id to its name from the same list.
  const nameById = (list: { id: string; name: string }[], id: string | null) => (id ? list.find((s) => s.id === id)?.name ?? '—' : '—');
  return (
    <GlassCard className="overflow-hidden">
      <AddStopModal open={open} onClose={() => setOpen(false)} />
      <div className="flex items-center justify-between p-5">
        <h3 className="text-base font-semibold">{t('network.tabs.stops')}</h3>
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="size-4" /> {t('network.addStop')}</Button>
      </div>
      <Async query={stops} isEmpty={(d) => d.length === 0} skeleton={<TableSkeleton cols={4} />} empty={<p className="p-10 text-center text-sm text-muted-foreground">{t('network.noStops')}</p>}>
        {(data) => (
          <Table>
            <Thead>
              <Th>{t('network.colName')}</Th>
              <Th>{t('network.colType')}</Th>
              <Th>{t('network.colParent')}</Th>
              <Th>{t('network.colPhone')}</Th>
            </Thead>
            <Tbody>
              {data.map((s) => (
                <Tr key={s.id}>
                  <Td className="whitespace-nowrap font-medium">{s.name}</Td>
                  <Td><StatusPill status={s.type === 'station' ? 'active' : 'idle'}>{t(`network.${s.type}`)}</StatusPill></Td>
                  <Td className="whitespace-nowrap text-muted-foreground">{nameById(data, s.parentStationId)}</Td>
                  <Td className="whitespace-nowrap text-muted-foreground">{s.phone ?? '—'}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Async>
    </GlassCard>
  );
}

// Simple shimmer rows while a table loads.
function TableSkeleton({ cols }: { cols: number }) {
  return (
    <div className="space-y-2 p-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((__, j) => <div key={j} className="shimmer h-5 rounded" />)}
        </div>
      ))}
    </div>
  );
}

function FaresPanel() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'byRoute' | 'matrix'>('byRoute');
  const stopsQ = useStops();
  const faresQ = useFares();
  const stations = (stopsQ.data ?? []).filter((s) => s.type === 'station');
  // Live national fare lookup, keyed by the canonical (sorted) station-id pair.
  const fareMap = new Map((faresQ.data ?? []).map((f) => [[f.originStationId, f.destinationStationId].sort().join('|'), f.fareAmount]));
  const liveFare = (a: string, b: string) => (a === b ? null : fareMap.get([a, b].sort().join('|')) ?? null);
  const matrixLoading = stopsQ.isLoading || faresQ.isLoading;
  const matrixError = stopsQ.isError || faresQ.isError;
  return (
    <GlassCard className="overflow-hidden">
      <AddFareModal open={open} onClose={() => setOpen(false)} />
      <div className="flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <h3 className="text-base font-semibold">{mode === 'byRoute' ? t('network.faresByRoute') : t('network.matrixTitle')}</h3>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Info className="size-3.5" /> {t('network.ruraNote')}</p>
        </div>
        <div className="flex items-center gap-2">
          <div role="tablist" className="inline-flex gap-1 rounded-lg bg-secondary/60 p-1">
            {(['byRoute', 'matrix'] as const).map((m) => (
              <button key={m} role="tab" aria-selected={mode === m} onClick={() => setMode(m)}
                className={cn('rounded-md px-3 py-1.5 text-sm font-medium transition-colors', mode === m ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
                {t(`network.fareMode.${m}`)}
              </button>
            ))}
          </div>
          <Button size="sm" onClick={() => setOpen(true)}><Plus className="size-4" /> {t('network.addFare')}</Button>
        </div>
      </div>
      {mode === 'byRoute' && <div className="p-5 pt-0"><RouteFares /></div>}
      {mode === 'matrix' && (
        matrixLoading ? <TableSkeleton cols={6} /> :
        matrixError ? <p className="p-10 text-center text-sm text-muted-foreground">{t('common.loadError')}</p> :
        stations.length === 0 ? <p className="p-10 text-center text-sm text-muted-foreground">{t('network.noStops')}</p> : (
      <div className="overflow-x-auto p-2">
        <table className="w-full min-w-[640px] border-separate border-spacing-1 text-center text-sm">
          <thead>
            <tr>
              <th className="p-2" />
              {stations.map((s) => (
                <th key={s.id} className="p-2 text-xs font-semibold text-muted-foreground">{s.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stations.map((row) => (
              <tr key={row.id}>
                <th className="whitespace-nowrap p-2 text-right text-xs font-semibold text-muted-foreground">{row.name}</th>
                {stations.map((col) => {
                  const fare = liveFare(row.id, col.id);
                  return (
                    <td key={col.id} className={cn('rounded-lg p-2 tabular-nums', row.id === col.id ? 'bg-secondary/40 text-muted-foreground/40' : fare ? 'bg-[hsl(var(--teal))]/10 font-medium text-foreground' : 'bg-secondary/30 text-muted-foreground/50')}>
                      {row.id === col.id ? '—' : fare ? formatRWF(fare) : '·'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      ))}
    </GlassCard>
  );
}
