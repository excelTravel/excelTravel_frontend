import { useTranslation } from 'react-i18next';
import { Bus, CalendarDays, MapPin, MoreVertical, Navigation, CalendarClock, Wrench } from 'lucide-react';
import { MotionCard } from '@/components/motion/Motion';
import { StatusPill } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Vehicle } from './data';

// The status accent that runs along the top of each card.
const ACCENT: Record<Vehicle['status'], string> = {
  active: 'hsl(var(--teal))',
  maintenance: 'hsl(var(--warning))',
  retired: 'hsl(var(--muted-foreground))',
};

function maintenanceFor(sinceISO: string) {
  const totalH = Math.max(0, Math.floor((Date.now() - new Date(sinceISO).getTime()) / 3_600_000));
  return { d: Math.floor(totalH / 24), h: totalH % 24, since: new Date(sinceISO).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) };
}

// Four distinct tag colours for "what's this vehicle doing right now": green = on a trip, gold =
// scheduled next, yellow = idle, sitting wherever its last trip left it, red = in maintenance.
type TagTone = 'green' | 'gold' | 'yellow' | 'red' | 'neutral';
const TAG_TONE: Record<TagTone, string> = {
  green: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  gold: 'bg-amber-600/15 text-amber-700 dark:text-amber-500',
  yellow: 'bg-yellow-400/20 text-yellow-700 dark:text-yellow-400',
  red: 'bg-red-500/15 text-red-600 dark:text-red-400',
  neutral: 'bg-secondary text-muted-foreground',
};

function StatusTag({ tone, icon, children }: { tone: TagTone; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className={cn('flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium', TAG_TONE[tone])}>
      {icon}
      <span className="truncate">{children}</span>
    </div>
  );
}

export function VehicleCard({ vehicle, onOpenDetails }: { vehicle: Vehicle; onOpenDetails?: () => void }) {
  const { t } = useTranslation();

  return (
    <MotionCard className="flex flex-col overflow-hidden p-0">
      <div className="h-1 w-full" style={{ background: ACCENT[vehicle.status] }} aria-hidden />
      <div className="flex flex-col gap-4 p-5">
        {/* Identity + status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {vehicle.photoUrl ? (
              <img src={vehicle.photoUrl} alt="" className="size-11 rounded-xl object-cover" />
            ) : (
              <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <Bus className="size-5" />
              </span>
            )}
            <div>
              <p className="text-lg font-bold leading-tight tracking-tight">{vehicle.plate}</p>
              <p className="text-xs text-muted-foreground">{vehicle.model}{vehicle.year ? ` · ${vehicle.year}` : ''}</p>
            </div>
          </div>
          <StatusPill status={vehicle.status}>{t(`vehicles.status.${vehicle.status}`)}</StatusPill>
        </div>

        {/* Telemetry tiles */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-secondary/50 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{t('vehicles.colCapacity')}</p>
            <p className="mt-0.5 text-base font-bold tabular-nums">{vehicle.capacity} <span className="text-xs font-normal text-muted-foreground">{t('vehicles.seats')}</span></p>
          </div>
          <div className="rounded-xl bg-secondary/50 p-3">
            <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              <CalendarDays className="size-3" /> {t('vehicles.nextMaintenance')}
            </p>
            <p className="mt-0.5 text-base font-bold">{vehicle.nextServiceDate}</p>
          </div>
        </div>

        {/* What it's doing right now — one of exactly four states, colour-coded so it reads at a glance:
            in maintenance (red) > on a trip now (green) > next scheduled trip (gold) > idle at its last
            trip's destination (yellow). A vehicle with no trip history at all falls back to neutral. */}
        {vehicle.status === 'maintenance' ? (
          <StatusTag tone="red" icon={<Wrench className="size-3.5 shrink-0" />}>
            {vehicle.maintenanceSince
              ? (() => { const m = maintenanceFor(vehicle.maintenanceSince!); return `${t('vehicles.inMaintenanceFor', { d: m.d, h: m.h })} · ${t('vehicles.since', { date: m.since })}`; })()
              : t('vehicles.status.maintenance')}
          </StatusTag>
        ) : vehicle.currentTrip ? (
          <StatusTag tone="green" icon={<Navigation className="size-3.5 shrink-0" />}>
            {t('vehicles.onTrip', { code: vehicle.currentTrip.code })} · {vehicle.currentTrip.route}
          </StatusTag>
        ) : vehicle.nextTrip ? (
          <StatusTag tone="gold" icon={<CalendarClock className="size-3.5 shrink-0" />}>
            {t('vehicles.scheduledTrip', { code: vehicle.nextTrip.code, time: vehicle.nextTrip.time })} · {vehicle.nextTrip.route}
          </StatusTag>
        ) : vehicle.lastDestination ? (
          <StatusTag tone="yellow" icon={<MapPin className="size-3.5 shrink-0" />}>
            {t('vehicles.lastSeenAt', { place: vehicle.lastDestination })}
          </StatusTag>
        ) : (
          <StatusTag tone="neutral" icon={<MapPin className="size-3.5 shrink-0" />}>
            {t('vehicles.noTripsYet')}
          </StatusTag>
        )}

        {/* Details action */}
        <div className="flex items-center justify-end border-t border-border pt-3">
          <button
            type="button"
            onClick={onOpenDetails}
            aria-label={t('vehicles.actions')}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <MoreVertical className="size-4" />
          </button>
        </div>
      </div>
    </MotionCard>
  );
}
