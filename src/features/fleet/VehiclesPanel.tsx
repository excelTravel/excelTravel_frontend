import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { GlassCard } from '@/components/ui/card';
import { StatusPill } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SegmentedDonut } from '@/components/ui/segmented-donut';
import { CountUp } from '@/components/ui/count-up';
import { Reveal, RevealItem } from '@/components/motion/Motion';
import { VehicleCard } from './VehicleCard';
import { VehicleDetailModal } from './VehicleDetailModal';
import { AddVehicleModal } from './AddVehicleModal';
import { VEHICLES, DRIVERS, FLEET_SUMMARY, type Vehicle } from './data';

const COMPOSITION = [
  { key: 'active', count: FLEET_SUMMARY.active, color: 'hsl(var(--teal))' },
  { key: 'maintenance', count: FLEET_SUMMARY.maintenance, color: 'hsl(var(--warning))' },
  { key: 'retired', count: FLEET_SUMMARY.retired, color: 'hsl(var(--muted-foreground))' },
] as const;

export function VehiclesPanel() {
  const { t } = useTranslation();
  const onDuty = DRIVERS.filter((d) => d.status === 'on_trip');
  const [selected, setSelected] = useState<Vehicle | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="space-y-4">
      <VehicleDetailModal vehicle={selected} open={selected !== null} onClose={() => setSelected(null)} />
      <AddVehicleModal open={addOpen} onClose={() => setAddOpen(false)} />

      {/* Toolbar above the cards */}
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="size-4" /> {t('fleet.addVehicle')}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3 2xl:grid-cols-4">
        {/* Gallery */}
        <Reveal className="grid gap-5 sm:grid-cols-2 xl:col-span-2 2xl:col-span-3">
          {VEHICLES.map((v) => (
            <RevealItem key={v.plate}>
              <VehicleCard vehicle={v} onOpenDetails={() => setSelected(v)} />
            </RevealItem>
          ))}
        </Reveal>

        {/* Side rail: 3-colour fleet composition ring + drivers on the road */}
        <aside className="space-y-6">
          <GlassCard className="p-5">
            <div className="flex items-center gap-4">
              <SegmentedDonut
                size={116}
                segments={COMPOSITION.map((s) => ({ value: s.count, color: s.color }))}
              >
                <span className="text-2xl font-bold tabular-nums leading-none">
                  <CountUp value={FLEET_SUMMARY.utilization} format={(n) => `${Math.round(n)}%`} />
                </span>
                <span className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">{t('fleet.utilShort')}</span>
              </SegmentedDonut>
              <div>
                <p className="text-3xl font-bold tabular-nums leading-none">
                  <CountUp value={FLEET_SUMMARY.total} />
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{t('fleet.vehiclesTracked')}</p>
              </div>
            </div>
            <div className="mt-5 space-y-2">
              {COMPOSITION.map((s) => (
                <div key={s.key} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm odd:bg-secondary/40">
                  <span className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full" style={{ background: s.color }} />
                    {t(`vehicles.status.${s.key}`)}
                  </span>
                  <span className="font-semibold tabular-nums">
                    <CountUp value={s.count} />
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <h3 className="text-sm font-semibold">{t('fleet.onDuty')}</h3>
            <ul className="mt-3 divide-y divide-border/60">
              {onDuty.map((d) => (
                <li key={d.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {d.name.charAt(0)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium leading-tight">{d.name}</p>
                    <p className="text-xs text-muted-foreground">{d.vehicle}</p>
                  </div>
                  <StatusPill status="on_trip">{t('drivers.state.on_trip')}</StatusPill>
                </li>
              ))}
            </ul>
          </GlassCard>
        </aside>
      </div>
    </div>
  );
}
