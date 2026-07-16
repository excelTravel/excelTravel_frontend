import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Route as RouteIcon, MapPin, Coins, ArrowRight, Info } from 'lucide-react';
import { GlassCard } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge, StatusPill } from '@/components/ui/badge';
import { Reveal, RevealItem } from '@/components/motion/Motion';
import { formatRWF, cn } from '@/lib/utils';
import { AddRouteModal, AddStopModal, AddFareModal } from './NetworkModals';
import { ROUTES, STOPS, STATIONS, fareBetween } from './network';

const TABS = [
  { key: 'routes', icon: RouteIcon },
  { key: 'stops', icon: MapPin },
  { key: 'fares', icon: Coins },
] as const;
type NetTab = (typeof TABS)[number]['key'];

export function NetworkPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<NetTab>('routes');

  return (
    <Reveal className="space-y-6">
      <RevealItem>
        <div role="tablist" aria-label={t('nav.network')} className="inline-flex gap-1 rounded-xl bg-secondary/60 p-1">
          {TABS.map((tb) => (
            <button
              key={tb.key}
              role="tab"
              aria-selected={tab === tb.key}
              onClick={() => setTab(tb.key)}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                tab === tb.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <tb.icon className="size-4" /> {t(`network.tabs.${tb.key}`)}
            </button>
          ))}
        </div>
      </RevealItem>

      <RevealItem>
        {tab === 'routes' && <RoutesPanel />}
        {tab === 'stops' && <StopsPanel />}
        {tab === 'fares' && <FaresPanel />}
      </RevealItem>
    </Reveal>
  );
}

function RoutesPanel() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <GlassCard className="overflow-hidden">
      <AddRouteModal open={open} onClose={() => setOpen(false)} />
      <div className="flex items-center justify-between p-5">
        <h3 className="text-base font-semibold">{t('network.tabs.routes')}</h3>
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="size-4" /> {t('network.addRoute')}</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-y border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-5 py-3 font-medium">{t('network.colRoute')}</th>
              <th className="px-5 py-3 font-medium">{t('network.colDistance')}</th>
              <th className="px-5 py-3 font-medium">{t('network.colDuration')}</th>
              <th className="px-5 py-3 font-medium">{t('network.colTimes')}</th>
              <th className="px-5 py-3 font-medium">{t('network.colStatus')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {ROUTES.map((r) => (
              <tr key={r.id} className="transition-colors hover:bg-secondary/40">
                <td className="whitespace-nowrap px-5 py-3">
                  <p className="font-medium">{r.name}</p>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">{r.origin} <ArrowRight className="size-3" /> {r.destination}</p>
                </td>
                <td className="whitespace-nowrap px-5 py-3 tabular-nums">{r.distanceKm} km</td>
                <td className="whitespace-nowrap px-5 py-3 tabular-nums">{Math.floor(r.durationMin / 60)}h {r.durationMin % 60}m</td>
                <td className="whitespace-nowrap px-5 py-3 tabular-nums text-muted-foreground">{r.times.join(' · ')}</td>
                <td className="px-5 py-3"><Badge tone={r.status === 'active' ? 'success' : 'neutral'}>{t(`network.${r.status}`)}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}

function StopsPanel() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <GlassCard className="overflow-hidden">
      <AddStopModal open={open} onClose={() => setOpen(false)} />
      <div className="flex items-center justify-between p-5">
        <h3 className="text-base font-semibold">{t('network.tabs.stops')}</h3>
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="size-4" /> {t('network.addStop')}</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-y border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-5 py-3 font-medium">{t('network.colName')}</th>
              <th className="px-5 py-3 font-medium">{t('network.colType')}</th>
              <th className="px-5 py-3 font-medium">{t('network.colParent')}</th>
              <th className="px-5 py-3 font-medium">{t('network.colPhone')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {STOPS.map((s) => (
              <tr key={s.id} className="transition-colors hover:bg-secondary/40">
                <td className="whitespace-nowrap px-5 py-3 font-medium">{s.name}</td>
                <td className="px-5 py-3"><StatusPill status={s.type === 'station' ? 'active' : 'idle'}>{t(`network.${s.type}`)}</StatusPill></td>
                <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">{s.parent ?? '—'}</td>
                <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">{s.phone ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}

function FaresPanel() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <GlassCard className="overflow-hidden">
      <AddFareModal open={open} onClose={() => setOpen(false)} />
      <div className="flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <h3 className="text-base font-semibold">{t('network.matrixTitle')}</h3>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Info className="size-3.5" /> {t('network.ruraNote')}</p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="size-4" /> {t('network.addFare')}</Button>
      </div>
      <div className="overflow-x-auto p-2">
        <table className="w-full min-w-[640px] border-separate border-spacing-1 text-center text-sm">
          <thead>
            <tr>
              <th className="p-2" />
              {STATIONS.map((s) => (
                <th key={s.id} className="p-2 text-xs font-semibold text-muted-foreground">{s.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {STATIONS.map((row) => (
              <tr key={row.id}>
                <th className="whitespace-nowrap p-2 text-right text-xs font-semibold text-muted-foreground">{row.name}</th>
                {STATIONS.map((col) => {
                  const fare = fareBetween(row.id, col.id);
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
    </GlassCard>
  );
}
