import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import { Bus, Wrench } from 'lucide-react';
import { GlassCard } from '@/components/ui/card';
import { StatusPill } from '@/components/ui/badge';
import { RadialGauge } from '@/components/ui/radial-gauge';
import { CountUp } from '@/components/ui/count-up';
import { Reveal, RevealItem } from '@/components/motion/Motion';
import { VehicleCard } from './VehicleCard';
import { VehicleDetailModal } from './VehicleDetailModal';
import { VEHICLES, DRIVERS, JOBS, FLEET_SUMMARY, type Vehicle } from './data';

const COMPOSITION = [
  { key: 'active', count: FLEET_SUMMARY.active, color: 'hsl(var(--teal))' },
  { key: 'maintenance', count: FLEET_SUMMARY.maintenance, color: 'hsl(var(--warning))' },
  { key: 'retired', count: FLEET_SUMMARY.retired, color: 'hsl(var(--muted-foreground))' },
] as const;

export function VehiclesPanel() {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const onDuty = DRIVERS.filter((d) => d.status === 'on_trip');
  const attention = JOBS.filter((j) => j.urgency !== 'logged');
  const [selected, setSelected] = useState<Vehicle | null>(null);

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3 2xl:grid-cols-4">
      <VehicleDetailModal vehicle={selected} open={selected !== null} onClose={() => setSelected(null)} />
      {/* Gallery */}
      <Reveal className="grid gap-5 sm:grid-cols-2 xl:col-span-2 2xl:col-span-3">
        {VEHICLES.map((v) => (
          <RevealItem key={v.plate}>
            <VehicleCard vehicle={v} onOpenDetails={() => setSelected(v)} />
          </RevealItem>
        ))}
      </Reveal>

      {/* Side rails: fleet snapshot + drivers on the road + maintenance attention */}
      <aside className="space-y-6">
        <GlassCard className="p-5">
          <div className="flex items-center gap-4">
            <RadialGauge value={FLEET_SUMMARY.utilization} label={t('fleet.utilShort')} size={112} />
            <div>
              <p className="text-3xl font-bold tabular-nums leading-none">
                <CountUp value={FLEET_SUMMARY.total} />
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{t('fleet.vehiclesTracked')}</p>
            </div>
          </div>
          <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-secondary">
            {COMPOSITION.map((s, i) => (
              <motion.div
                key={s.key}
                initial={{ width: reduce ? `${(s.count / FLEET_SUMMARY.total) * 100}%` : 0 }}
                animate={{ width: `${(s.count / FLEET_SUMMARY.total) * 100}%` }}
                transition={{ duration: 0.9, delay: 0.1 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                style={{ background: s.color }}
              />
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
            {COMPOSITION.map((s) => (
              <span key={s.key} className="inline-flex items-center gap-1.5 text-xs">
                <span className="size-2.5 rounded-full" style={{ background: s.color }} />
                <span className="font-semibold tabular-nums">{s.count}</span>
                <span className="text-muted-foreground">{t(`vehicles.status.${s.key}`)}</span>
              </span>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <h3 className="text-sm font-semibold">{t('fleet.onDuty')}</h3>
          <ul className="mt-3 space-y-3">
            {onDuty.map((d) => (
              <li key={d.id} className="flex items-center gap-3">
                <span className="grid size-8 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
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

        <GlassCard className="p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Wrench className="size-4" /> {t('fleet.needsAttention')}
          </h3>
          <ul className="mt-3 space-y-3">
            {attention.map((j) => (
              <li key={j.id} className="flex items-center gap-3">
                <span className="grid size-8 place-items-center rounded-lg bg-secondary text-muted-foreground">
                  <Bus className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium leading-tight">{j.vehicle} · {j.serviceType}</p>
                  <p className="text-xs text-muted-foreground">{j.when}</p>
                </div>
                <StatusPill status={j.urgency}>{t(`maintenance.urgency.${j.urgency}`)}</StatusPill>
              </li>
            ))}
          </ul>
        </GlassCard>
      </aside>
    </div>
  );
}
