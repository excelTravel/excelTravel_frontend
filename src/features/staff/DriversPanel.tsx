import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { startOfDay, endOfDay } from 'date-fns';
import { Phone, CalendarClock, UserPlus } from 'lucide-react';
import { GlassCard } from '@/components/ui/card';
import { StatusPill } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MotionCard, Reveal, RevealItem } from '@/components/motion/Motion';
import { Async } from '@/components/ui/async';
import { InviteDriverModal } from './InviteDriverModal';
import { EditDriverModal } from './EditDriverModal';
import { DriverDetailModal } from './DriverDetailModal';
import { DriverScheduling } from './DriverScheduling';
import { useDrivers, useTrips, useRoutes, type ApiDriver } from '@/lib/api/hooks';
import { kigaliHM, kigaliHour } from '@/lib/kigaliTime';

const DAY_START = 5;
const DAY_END = 23;
const SPAN = DAY_END - DAY_START;
const TICKS = [6, 9, 12, 15, 18, 21];
const clampPct = (hour: number) => Math.max(0, Math.min(100, ((hour - DAY_START) / SPAN) * 100));

export function DriversPanel() {
  const { t } = useTranslation();
  const driversQ = useDrivers();
  const today = new Date();
  const tripsQ = useTrips({ from: startOfDay(today).toISOString(), to: endOfDay(today).toISOString() });
  const routesQ = useRoutes();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editDriver, setEditDriver] = useState<ApiDriver | null>(null);
  const [detailDriver, setDetailDriver] = useState<ApiDriver | null>(null);
  const now = new Date();
  const nowHour = now.getHours() + now.getMinutes() / 60;
  const nowPct = clampPct(nowHour);
  const nowVisible = nowHour >= DAY_START && nowHour <= DAY_END;

  const drivers = driversQ.data ?? [];
  const trips = tripsQ.data ?? [];
  const routeName = (routeId: string) => {
    const r = routesQ.data?.find((x) => x.id === routeId);
    return r ? `${r.origin} → ${r.destination}` : '—';
  };
  const tripsByDriver = new Map<string, typeof trips>();
  for (const trip of trips) {
    if (!trip.driverId) continue;
    const list = tripsByDriver.get(trip.driverId) ?? [];
    list.push(trip);
    tripsByDriver.set(trip.driverId, list);
  }

  return (
    <div className="space-y-6">
      <InviteDriverModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
      <EditDriverModal driver={editDriver} open={editDriver !== null} onClose={() => setEditDriver(null)} />
      <DriverDetailModal driver={detailDriver} open={detailDriver !== null} onClose={() => setDetailDriver(null)} />
      {/* Trip schedule board (derived from assigned trips) */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-base font-semibold">
            <CalendarClock className="size-4" /> {t('drivers.schedule')}
          </h3>
          <p className="text-xs text-muted-foreground">{t('drivers.scheduleHint')}</p>
        </div>

        <div className="mt-5 flex pl-44">
          {TICKS.map((h) => (
            <div key={h} className="flex-1 text-[10px] tabular-nums text-muted-foreground">{h}:00</div>
          ))}
        </div>

        <div className="relative mt-1 space-y-2">
          {nowVisible && (
            <div className="pointer-events-none absolute bottom-0 top-0 z-10 w-px bg-destructive/70" style={{ left: `calc(11.75rem + (100% - 11.75rem) * ${(nowPct / 100).toFixed(4)})` }}>
              <span className="absolute -top-1 -translate-x-1/2 rounded-full bg-destructive px-1 py-0.5 text-[8px] font-bold text-white">
                {t('drivers.now')}
              </span>
            </div>
          )}
          {driversQ.isLoading ? (
            <div className="shimmer h-24 rounded-lg" />
          ) : (
            drivers.map((d) => {
              const dayTrips = tripsByDriver.get(d.id) ?? [];
              return (
                <div key={d.id} className="flex items-center gap-3">
                  <div className="flex w-44 shrink-0 items-center gap-2">
                    <span className="grid size-8 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {d.name.charAt(0)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium leading-tight">{d.name}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{dayTrips[0]?.vehiclePlate ?? t('drivers.noVehicle')}</p>
                    </div>
                  </div>
                  <div className="relative h-8 flex-1 rounded-lg bg-secondary/60">
                    {dayTrips.length === 0 ? (
                      <span className="absolute inset-0 grid place-items-center text-[11px] text-muted-foreground">{t('drivers.noTrips')}</span>
                    ) : (
                      dayTrips.map((trip) => {
                        const start = kigaliHour(trip.departureTime);
                        const end = trip.arrivalTime ? kigaliHour(trip.arrivalTime) : start + 1;
                        const label = routeName(trip.routeId);
                        return (
                          <motion.div
                            key={trip.id}
                            initial={{ scaleX: 0, opacity: 0 }}
                            animate={{ scaleX: 1, opacity: 1 }}
                            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                            style={{ left: `${clampPct(start)}%`, width: `${Math.max(clampPct(end) - clampPct(start), 3)}%`, transformOrigin: 'left' }}
                            className="absolute inset-y-1 grid place-items-center overflow-hidden rounded-md bg-[hsl(var(--teal))]/85 px-2 text-[11px] font-semibold text-white"
                            title={`${label} · ${kigaliHM.format(new Date(trip.departureTime))}${trip.arrivalTime ? `–${kigaliHM.format(new Date(trip.arrivalTime))}` : ''}`}
                          >
                            {label}
                          </motion.div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </GlassCard>

      {/* Weekly roster + workload/fairness */}
      <DriverScheduling />

      {/* Driver roster */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">{t('drivers.roster')}</h3>
        <Button size="sm" onClick={() => setInviteOpen(true)}><UserPlus className="size-4" /> {t('drivers.inviteDriver')}</Button>
      </div>

      {/* Driver cards — live roster from GET /drivers, click through to view documents */}
      <Async
        query={driversQ}
        isEmpty={(d) => d.length === 0}
        skeleton={<div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="shimmer h-56 rounded-2xl" />)}</div>}
        empty={<GlassCard className="p-10 text-center text-sm text-muted-foreground">{t('drivers.rosterEmpty')}</GlassCard>}
      >
        {(drivers) => (
          <Reveal className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {drivers.map((d) => (
              <RevealItem key={d.id}>
                <MotionCard className="flex cursor-pointer flex-col gap-4 p-5" onClick={() => setDetailDriver(d)}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-3">
                      {d.photoUrl ? (
                        <img src={d.photoUrl} alt="" className="size-12 shrink-0 rounded-full object-cover" />
                      ) : (
                        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary/10 text-base font-bold text-primary">
                          {d.name.charAt(0)}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-semibold leading-tight">{d.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{d.licenseNumber ?? '—'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 rounded-xl bg-secondary/40 p-3">
                    <DriverRow icon={<CalendarClock className="size-3.5" />} label={t('drivers.licenseExpires')} value={d.licenseExpiry ? new Date(d.licenseExpiry).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'} />
                    <DriverRow icon={<Phone className="size-3.5" />} label={t('drivers.contact')} value={d.phone} />
                  </div>

                  <div className="flex items-center gap-2 border-t border-border pt-3">
                    <StatusPill status={d.status}>{t(`drivers.state.${d.status}`, d.status)}</StatusPill>
                    <div className="ml-auto flex gap-2">
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setEditDriver(d); }}>{t('forms.edit')}</Button>
                      <a
                        href={`tel:${d.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={t('drivers.call')}
                        className="grid size-9 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                      >
                        <Phone className="size-4" />
                      </a>
                    </div>
                  </div>
                </MotionCard>
              </RevealItem>
            ))}
          </Reveal>
        )}
      </Async>
    </div>
  );
}

function DriverRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span className="flex items-center gap-1.5 text-muted-foreground">{icon} {label}</span>
      <span className="truncate font-medium tabular-nums">{value}</span>
    </div>
  );
}
