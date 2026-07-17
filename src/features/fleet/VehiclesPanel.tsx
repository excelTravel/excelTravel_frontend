import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { GlassCard } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SegmentedDonut } from '@/components/ui/segmented-donut';
import { CountUp } from '@/components/ui/count-up';
import { Async } from '@/components/ui/async';
import { Reveal, RevealItem } from '@/components/motion/Motion';
import { useVehicles, type ApiVehicle } from '@/lib/api/hooks';
import { VehicleCard } from './VehicleCard';
import { VehicleDetailModal } from './VehicleDetailModal';
import { AddVehicleModal } from './AddVehicleModal';
import { type Vehicle, type VehicleStatus } from './data';

// Map a live /vehicles row onto the Vehicle shape the card renders. Driver / current-trip / maintenance /
// next-service aren't in the vehicles endpoint yet, so they degrade to unassigned / idle / — (see integration-map).
function toVehicle(v: ApiVehicle): Vehicle {
  return {
    plate: v.plateNumber,
    model: v.model ?? '—',
    capacity: v.capacity,
    year: v.year ?? 0,
    status: (['active', 'maintenance', 'retired'].includes(v.status) ? v.status : 'active') as VehicleStatus,
    driver: null,
    driverPhone: null,
    nextServiceDate: '—',
    currentTrip: null,
    nextTrip: null,
    maintenanceSince: null,
  };
}

const STATUS_COLOR: Record<VehicleStatus, string> = {
  active: 'hsl(var(--teal))',
  maintenance: 'hsl(var(--warning))',
  retired: 'hsl(var(--muted-foreground))',
};

export function VehiclesPanel() {
  const { t } = useTranslation();
  const vehiclesQ = useVehicles();
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

      <Async query={vehiclesQ} isEmpty={(d) => d.length === 0} skeleton={<div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"><div className="shimmer h-56 rounded-2xl" /><div className="shimmer h-56 rounded-2xl" /></div>}>
        {(apiVehicles) => {
          const vehicles = apiVehicles.map(toVehicle);
          const counts = { active: 0, maintenance: 0, retired: 0 } as Record<VehicleStatus, number>;
          for (const v of vehicles) counts[v.status] += 1;
          const total = vehicles.length;
          const utilization = total ? Math.round((counts.active / total) * 100) : 0;
          const composition: { key: VehicleStatus; count: number; color: string }[] = [
            { key: 'active', count: counts.active, color: STATUS_COLOR.active },
            { key: 'maintenance', count: counts.maintenance, color: STATUS_COLOR.maintenance },
            { key: 'retired', count: counts.retired, color: STATUS_COLOR.retired },
          ];
          return (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3 2xl:grid-cols-4">
              <Reveal className="grid gap-5 sm:grid-cols-2 xl:col-span-2 2xl:col-span-3">
                {vehicles.map((v) => (
                  <RevealItem key={v.plate}>
                    <VehicleCard vehicle={v} onOpenDetails={() => setSelected(v)} />
                  </RevealItem>
                ))}
              </Reveal>

              {/* Side rail: live 3-colour fleet composition ring */}
              <aside className="space-y-6">
                <GlassCard className="p-5">
                  <div className="flex items-center gap-4">
                    <SegmentedDonut size={116} segments={composition.map((s) => ({ value: s.count, color: s.color }))}>
                      <span className="text-2xl font-bold tabular-nums leading-none">
                        <CountUp value={utilization} format={(n) => `${Math.round(n)}%`} />
                      </span>
                      <span className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">{t('fleet.utilShort')}</span>
                    </SegmentedDonut>
                    <div>
                      <p className="text-3xl font-bold tabular-nums leading-none"><CountUp value={total} /></p>
                      <p className="mt-1 text-xs text-muted-foreground">{t('fleet.vehiclesTracked')}</p>
                    </div>
                  </div>
                  <div className="mt-5 space-y-2">
                    {composition.map((s) => (
                      <div key={s.key} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm odd:bg-secondary/40">
                        <span className="flex items-center gap-2">
                          <span className="size-2.5 rounded-full" style={{ background: s.color }} />
                          {t(`vehicles.status.${s.key}`)}
                        </span>
                        <span className="font-semibold tabular-nums"><CountUp value={s.count} /></span>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </aside>
            </div>
          );
        }}
      </Async>
    </div>
  );
}
