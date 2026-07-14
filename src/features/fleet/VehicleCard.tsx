import { useTranslation } from 'react-i18next';
import { Bus, CalendarDays, MoreVertical, Phone, UserRound } from 'lucide-react';
import { MotionCard } from '@/components/motion/Motion';
import { StatusPill } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { serviceProgress, serviceDueSoon, type Vehicle } from './data';

// The status accent that runs along the top of each card.
const ACCENT: Record<Vehicle['status'], string> = {
  active: 'hsl(var(--teal))',
  maintenance: 'hsl(var(--warning))',
  retired: 'hsl(var(--muted-foreground))',
};

export function VehicleCard({ vehicle, onOpenDetails }: { vehicle: Vehicle; onOpenDetails?: () => void }) {
  const { t } = useTranslation();
  const pct = serviceProgress(vehicle);
  const soon = serviceDueSoon(vehicle);
  const kmLeft = vehicle.nextServiceKm - vehicle.currentKm;

  return (
    <MotionCard className="flex flex-col overflow-hidden p-0">
      <div className="h-1 w-full" style={{ background: ACCENT[vehicle.status] }} aria-hidden />
      <div className="flex flex-col gap-4 p-5">
        {/* Identity + status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
              <Bus className="size-5" />
            </span>
            <div>
              <p className="text-lg font-bold leading-tight tracking-tight">{vehicle.plate}</p>
              <p className="text-xs text-muted-foreground">{vehicle.model} · {vehicle.year}</p>
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

        {/* Service progress */}
        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{t('vehicles.colService')}</span>
            <span className={cn('font-medium tabular-nums', soon ? 'text-warning' : 'text-muted-foreground')}>
              {vehicle.status === 'retired' ? '—' : `${kmLeft.toLocaleString()} km`}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
            <div className={cn('h-full rounded-full', soon ? 'bg-warning' : 'bg-teal')} style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* Driver + actions */}
        <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
          <div className="flex min-w-0 items-center gap-2">
            {vehicle.driver ? (
              <>
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                  {vehicle.driver.charAt(0)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium leading-tight">{vehicle.driver}</p>
                  <a href={`tel:${vehicle.driverPhone ?? ''}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                    <Phone className="size-3" /> {vehicle.driverPhone}
                  </a>
                </div>
              </>
            ) : (
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <UserRound className="size-4" /> {t('vehicles.unassigned')}
              </span>
            )}
          </div>
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
