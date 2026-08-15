import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowRight,
  Bus,
  ChevronRight,
  Download,
  Megaphone,
  MessageSquare,
  Radio,
  Shuffle,
  UserCog,
  Users,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge, StatusPill } from '@/components/ui/badge';
import { Field, Select, Textarea } from '@/components/ui/form';
import { Table, Thead, Th, Tbody, Td, Tr } from '@/components/ui/table';
import { Reveal, RevealItem } from '@/components/motion/Motion';
import { Async } from '@/components/ui/async';
import { MapPreview } from '@/features/map/MapPreview';
import {
  useTrip,
  useRoutes,
  useVehicles,
  useDrivers,
  useTripManifest,
  useTripLog,
  useMessageDriver,
  useBroadcastPassengers,
  useUpdateTrip,
  qk,
  type ApiTrip,
  type ApiManifestEntry,
  type ApiTripLogEntry,
} from '@/lib/api/hooks';
import { useTripLive } from '@/lib/socket';
import { downloadCsv } from '@/lib/csv';
import { formatRWF, cn } from '@/lib/utils';

// Trips are live/operational only while boarding or en route. A completed trip still has final data, so its
// occupancy + log stay readable; a scheduled/delayed/cancelled trip has nothing operational yet → greyed.
const LIVE = new Set(['boarding', 'departed', 'in_transit', 'arriving']);

const timeFmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Kigali' });
const dateFmt = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', timeZone: 'Africa/Kigali' });
const fmtTime = (iso: string | null) => (iso ? timeFmt.format(new Date(iso)) : '—');

export function TripDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();

  const qc = useQueryClient();
  const tripQ = useTrip(id);
  const routesQ = useRoutes();
  const vehiclesQ = useVehicles();
  const driversQ = useDrivers();
  const manifestQ = useTripManifest(id);
  const logQ = useTripLog(id);

  // Live feed for this trip: a trip:status event refetches the trip + its log so the page tracks reality.
  const onStatus = useCallback(() => {
    void qc.invalidateQueries({ queryKey: qk.trips });
    void qc.invalidateQueries({ queryKey: ['tripLog', id] });
  }, [qc, id]);
  const live = useTripLive(id, onStatus);

  const trip = tripQ.data;
  const routes = routesQ.data ?? [];
  const route = routes.find((r) => r.id === trip?.routeId);
  const routeName = route ? `${route.origin} → ${route.destination}` : (trip?.routeId ?? id ?? '');
  const isLive = trip ? LIVE.has(trip.status) : false;
  const hasOps = isLive || trip?.status === 'completed';
  // Vehicle/driver can be assigned or changed any time before the trip wraps up — not just while it's
  // live. Only a finished or cancelled trip is locked (nothing left to dispatch).
  const assignable = trip ? trip.status !== 'completed' && trip.status !== 'cancelled' : false;

  const manifest = manifestQ.data ?? [];
  const appCount = manifest.filter((m) => m.bookingSource === 'app').length;
  const agentCount = manifest.filter((m) => m.bookingSource === 'agent').length;
  const appRevenue = manifest.filter((m) => m.bookingSource === 'app').reduce((s, m) => s + m.fareAmount, 0);
  const agentRevenue = manifest.filter((m) => m.bookingSource === 'agent').reduce((s, m) => s + m.fareAmount, 0);
  const capacity = trip?.capacity ?? 0;

  function downloadManifest() {
    downloadCsv(
      `manifest-${id ?? 'trip'}.csv`,
      ['Passenger', 'Phone', 'From', 'To', 'Booked via', 'Fare', 'Status'],
      manifest.map((p) => [p.passengerName, p.passengerPhone ?? '', p.boardStopName, p.alightStopName, p.bookingSource, String(p.fareAmount), p.status]),
    );
  }

  return (
    <Reveal className="space-y-6">
      {/* Breadcrumb + title */}
      <RevealItem>
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link to="/trips" className="rounded font-medium hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {t('trip.breadcrumb')}
          </Link>
          <ChevronRight className="size-3.5" aria-hidden />
          <span className="font-medium text-foreground">{id}</span>
        </nav>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-[hsl(var(--navy))] dark:text-foreground">{routeName}</h2>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
              {trip && <StatusPill status={trip.status}>{t(`tripsList.status.${trip.status}`)}</StatusPill>}
              {trip && <span className="text-muted-foreground/50">·</span>}
              {trip && <span className="tabular-nums">{dateFmt.format(new Date(trip.departureTime))} · {fmtTime(trip.departureTime)}</span>}
            </p>
          </div>
          {trip?.vehiclePlate && (
            <span className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold">
              <span className="grid size-6 place-items-center rounded-full bg-primary/10 text-primary"><Bus className="size-3.5" /></span>
              {trip.vehiclePlate}
            </span>
          )}
        </div>
      </RevealItem>

      <RevealItem className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Left: map, manifest + trip log, occupancy logs */}
        <div className="space-y-6 xl:col-span-2">
          <GlassCard className={cn('overflow-hidden', !isLive && 'opacity-60')}>
            {live.alert && (
              <div className="flex items-center gap-2 border-b border-warning/30 bg-warning/10 px-4 py-2 text-sm text-warning">
                <AlertTriangle className="size-4 shrink-0" /> {live.alert.message}
              </div>
            )}
            <MapPreview className="h-[360px] border-b border-border" />
            <div className="flex flex-wrap items-center gap-x-8 gap-y-2 p-4 text-sm">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{t('trip.tripRevenueLive')}</p>
                <p className="font-bold tabular-nums">{trip ? formatRWF(trip.revenue) : '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{t('trip.booked', { n: trip?.booked ?? 0, total: capacity })}</p>
                <p className="font-bold tabular-nums">{trip?.booked ?? 0}/{capacity || '—'}</p>
              </div>
              {live.location?.speed != null && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{t('trip.liveSpeed')}</p>
                  <p className="flex items-center gap-1.5 font-bold tabular-nums text-success">
                    <Radio className="size-3.5 animate-pulse" /> {Math.round(live.location.speed)} km/h
                  </p>
                </div>
              )}
              {!isLive && <span className="ml-auto text-xs text-muted-foreground">{t('trip.inactiveHint')}</span>}
            </div>
          </GlassCard>

          {/* Manifest + trip log */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <GlassCard className="flex flex-col p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 text-base font-semibold"><Users className="size-4" /> {t('trip.manifest')}</h3>
                <Badge tone="neutral">{t('trip.manifestChannels', { app: appCount, agent: agentCount })}</Badge>
              </div>
              <Async
                query={manifestQ}
                isEmpty={(d) => d.length === 0}
                skeleton={<div className="mt-4 space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="shimmer h-12 rounded-xl" />)}</div>}
                empty={<div className="mt-4 grid place-items-center gap-2 py-10 text-center text-sm text-muted-foreground"><Users className="size-7" />{t('tripsList.emptyTitle')}</div>}
              >
                {(rows: ApiManifestEntry[]) => (
                  <ul className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
                    {rows.map((p, i) => (
                      <li key={p.bookingId} className="flex items-center gap-3 rounded-xl bg-secondary/40 p-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{p.passengerName}</p>
                          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">{p.boardStopName} <ArrowRight className="size-3" /> {p.alightStopName}</p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <Badge tone={p.bookingSource === 'app' ? 'info' : 'neutral'}>{t(`trip.via.${p.bookingSource}`, p.bookingSource)}</Badge>
                          <span className="text-[11px] tabular-nums text-muted-foreground">{formatRWF(p.fareAmount)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Async>
              <Button className="mt-4 w-full" onClick={downloadManifest} disabled={manifest.length === 0}>
                <Download className="size-4" /> {t('trip.downloadManifest')}
              </Button>
            </GlassCard>

            <GlassCard className={cn('flex flex-col p-5', !hasOps && 'opacity-60')}>
              <h3 className="text-base font-semibold">{t('trip.tripLog')}</h3>
              <Async
                query={logQ}
                isEmpty={(d) => d.length === 0}
                skeleton={<div className="mt-4 space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="shimmer h-8 rounded" />)}</div>}
                empty={<div className="mt-4 py-10 text-center text-sm text-muted-foreground">{t('trip.logEmpty')}</div>}
              >
                {(entries: ApiTripLogEntry[]) => {
                  const ordered = [...entries].reverse(); // newest first
                  return (
                    <ol className="mt-4 max-h-72 overflow-y-auto pr-1">
                      {ordered.map((e, i) => (
                        <li key={`${e.type}-${e.at}`} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <span className={cn('mt-1 size-3 rounded-full', i === 0 ? 'bg-primary' : 'border-2 border-border bg-card')} aria-hidden />
                            {i < ordered.length - 1 && <span className="w-px flex-1 bg-border" aria-hidden />}
                          </div>
                          <div className="pb-5">
                            <p className="text-sm font-medium leading-tight">{logLabel(t, e)}</p>
                            <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">{dateFmt.format(new Date(e.at))} · {fmtTime(e.at)}</p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  );
                }}
              </Async>
            </GlassCard>
          </div>

          {/* Bus occupancy logs by stop (renamed from Boarding & free seats) — derived from stops + manifest */}
          <GlassCard className={cn('overflow-hidden', !hasOps && 'opacity-60')}>
            <div className="flex items-center justify-between p-5 pb-3">
              <div>
                <h3 className="text-base font-semibold">{t('trip.occupancyTitle')}</h3>
                <p className="text-sm text-muted-foreground">{t('trip.occupancySub', { capacity: capacity || '—' })}</p>
              </div>
              <Badge tone="neutral">{t('trip.capacity', { n: capacity || '—' })}</Badge>
            </div>
            <div className="max-h-96 overflow-auto">
              <Table>
                <Thead>
                  <Th>{t('trip.colStop')}</Th>
                  <Th>{t('trip.colArrival')}</Th>
                  <Th className="text-right">{t('trip.colIn')}</Th>
                  <Th className="text-right">{t('trip.colBoarded')}</Th>
                  <Th className="text-right">{t('trip.colAlighted')}</Th>
                  <Th className="text-right">{t('trip.colOnboard')}</Th>
                  <Th className="text-right">{t('trip.colFree')}</Th>
                </Thead>
                <Tbody>
                  {(() => {
                    const stops = [...(trip?.stops ?? [])].sort((a, b) => a.stopOrder - b.stopOrder);
                    let onboard = 0;
                    return stops.map((s, i) => {
                      const boarded = manifest.filter((m) => m.boardStopOrder === s.stopOrder).length;
                      const alighted = manifest.filter((m) => m.alightStopOrder === s.stopOrder).length;
                      const carriedIn = onboard;
                      onboard = Math.max(0, onboard + boarded - alighted);
                      const free = Math.max(0, capacity - onboard);
                      return (
                        <Tr key={s.id}>
                          <Td className="whitespace-nowrap font-medium">
                            {s.stopName}
                            {i === 0 && <span className="ml-2 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">{t('trip.startBadge')}</span>}
                          </Td>
                          <Td className="whitespace-nowrap tabular-nums text-muted-foreground">{fmtTime(s.actualArrival ?? s.estimatedArrival)}</Td>
                          <Td className="text-right tabular-nums text-muted-foreground">{i === 0 ? '—' : carriedIn}</Td>
                          <Td className="text-right tabular-nums text-teal">{boarded ? `+${boarded}` : '—'}</Td>
                          <Td className="text-right tabular-nums text-muted-foreground">{alighted ? `−${alighted}` : '—'}</Td>
                          <Td className="text-right font-semibold tabular-nums">{onboard}</Td>
                          <Td className="text-right tabular-nums"><span className={cn('font-semibold', free === 0 ? 'text-warning' : 'text-foreground')}>{capacity ? free : '—'}</span></Td>
                        </Tr>
                      );
                    });
                  })()}
                </Tbody>
              </Table>
            </div>
          </GlassCard>
        </div>

        {/* Right: driver, vehicle, revenue, dispatch */}
        <div className="space-y-6">
          {trip && (
            <AssignmentCard
              trip={trip}
              assignable={assignable}
              vehicles={vehiclesQ.data ?? []}
              drivers={driversQ.data ?? []}
            />
          )}

          <GlassCard className="border-t-2 border-t-primary p-5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{t('trip.tripRevenueLive')}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="text-3xl font-bold tabular-nums">{trip ? formatRWF(trip.revenue) : '—'}</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-secondary/50 p-3 text-center">
                <p className="text-xs text-muted-foreground">{t('trip.webApp')}</p>
                <p className="text-sm font-bold tabular-nums">{formatRWF(appRevenue)}</p>
              </div>
              <div className="rounded-lg bg-secondary/50 p-3 text-center">
                <p className="text-xs text-muted-foreground">{t('trip.agents')}</p>
                <p className="text-sm font-bold tabular-nums">{formatRWF(agentRevenue)}</p>
              </div>
            </div>
          </GlassCard>

          <DispatchControls tripId={id ?? ''} enabled={isLive} vehicles={vehiclesQ.data ?? []} hasDriver={Boolean(trip?.driverId)} />
        </div>
      </RevealItem>
    </Reveal>
  );
}

function logLabel(t: ReturnType<typeof useTranslation>['t'], e: ApiTripLogEntry): string {
  switch (e.type) {
    case 'published': return e.stopName ? t('trip.log.published', { stop: e.stopName }) : t('trip.log.publishedNoStop');
    case 'first_booking': return t('trip.log.firstBooking');
    case 'departed': return e.stopName ? t('trip.log.departed', { stop: e.stopName }) : t('trip.log.departedNoStop');
    case 'stop_arrival': return t('trip.log.stopArrival', { stop: e.stopName ?? '' });
    case 'completed': return e.stopName ? t('trip.log.completed', { stop: e.stopName }) : t('trip.log.completedNoStop');
    default: return e.type;
  }
}

// Assign or change this trip's vehicle and driver — the one place that's done now (vehicle cards on
// Fleet are read-only). Available any time before the trip completes or is cancelled, not just once it's
// live, since a scheduled trip needs a bus and a driver put on it before it can depart at all.
function AssignmentCard({ trip, assignable, vehicles, drivers }: {
  trip: ApiTrip;
  assignable: boolean;
  vehicles: { id: string; plateNumber: string }[];
  drivers: { id: string; name: string }[];
}) {
  const { t } = useTranslation();
  const update = useUpdateTrip();
  const [vehicleId, setVehicleId] = useState(trip.vehicleId ?? '');
  const [driverId, setDriverId] = useState(trip.driverId ?? '');
  const [err, setErr] = useState<string | null>(null);

  const dirty = vehicleId !== (trip.vehicleId ?? '') || driverId !== (trip.driverId ?? '');

  function save() {
    setErr(null);
    update.mutate(
      { id: trip.id, vehicleId: vehicleId || null, driverId: driverId || null },
      { onError: (e) => setErr(e instanceof Error ? e.message : t('trip.sendFailed')) },
    );
  }

  return (
    <GlassCard className="p-5">
      <h3 className="flex items-center gap-2 text-base font-semibold"><UserCog className="size-4" /> {t('trip.assignVehicleDriver')}</h3>
      {!assignable && <p className="mt-1 text-xs text-muted-foreground">{t('trip.assignLockedHint')}</p>}
      {err && <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{err}</p>}

      <div className="mt-4 space-y-3">
        <Field label={t('trip.vehicleDetails')} htmlFor="td-vehicle">
          <Select id="td-vehicle" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} disabled={!assignable}>
            <option value="">{t('trip.noVehicle')}</option>
            {vehicles.map((v) => <option key={v.id} value={v.id}>{v.plateNumber}</option>)}
          </Select>
        </Field>
        <Field label={t('trip.assignedDriver')} htmlFor="td-driver">
          <Select id="td-driver" value={driverId} onChange={(e) => setDriverId(e.target.value)} disabled={!assignable}>
            <option value="">{t('trip.noDriver')}</option>
            {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
        </Field>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs" aria-live="polite">{update.isSuccess && !dirty && <span className="text-success">{t('trip.assignSaved')}</span>}</span>
          <Button size="sm" disabled={!assignable || !dirty || update.isPending} onClick={save}>
            {update.isPending ? t('forms.saving') : t('forms.save')}
          </Button>
        </div>
      </div>
    </GlassCard>
  );
}

// Inline dispatch composers (no modals): message the driver, broadcast to passengers, or swap the vehicle.
// All post to live endpoints. Greyed with a hint when the trip isn't live.
function DispatchControls({ tripId, enabled, vehicles, hasDriver }: {
  tripId: string;
  enabled: boolean;
  vehicles: { id: string; plateNumber: string }[];
  hasDriver: boolean;
}) {
  const { t } = useTranslation();
  const [driverMsg, setDriverMsg] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const message = useMessageDriver();
  const broadcast = useBroadcastPassengers();
  const reroute = useUpdateTrip();

  return (
    <GlassCard className={cn('p-5', !enabled && 'opacity-60')}>
      <h3 className="text-base font-semibold">{t('trip.dispatchControls')}</h3>
      {!enabled && <p className="mt-1 text-xs text-muted-foreground">{t('trip.inactiveHint')}</p>}

      {/* Message driver */}
      <div className="mt-4 space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium"><MessageSquare className="size-4" /> {t('trip.messageDriver')}</label>
        <Textarea
          value={driverMsg}
          onChange={(e) => setDriverMsg(e.target.value)}
          placeholder={t('trip.messagePlaceholder')}
          maxLength={500}
          disabled={!enabled || !hasDriver}
          className="min-h-16"
        />
        {!hasDriver && enabled && <p className="text-xs text-muted-foreground">{t('trip.noDriver')}</p>}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs" aria-live="polite">
            {message.isSuccess && <span className="text-success">{t('trip.messageSent')}</span>}
            {message.isError && <span className="text-destructive">{t('trip.sendFailed')}</span>}
          </span>
          <Button
            size="sm"
            disabled={!enabled || !hasDriver || !driverMsg.trim() || message.isPending}
            onClick={() => message.mutate({ id: tripId, message: driverMsg.trim() }, { onSuccess: () => setDriverMsg('') })}
          >
            {message.isPending ? t('trip.sending') : t('trip.send')}
          </Button>
        </div>
      </div>

      {/* Broadcast passengers */}
      <div className="mt-5 space-y-2 border-t border-border pt-4">
        <label className="flex items-center gap-2 text-sm font-medium"><Megaphone className="size-4" /> {t('trip.broadcastPassengers')}</label>
        <Textarea
          value={broadcastMsg}
          onChange={(e) => setBroadcastMsg(e.target.value)}
          placeholder={t('trip.broadcastPlaceholder')}
          maxLength={500}
          disabled={!enabled}
          className="min-h-16"
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs" aria-live="polite">
            {broadcast.isSuccess && <span className="text-success">{t('trip.broadcastSent', { n: broadcast.data?.notified ?? 0 })}</span>}
            {broadcast.isError && <span className="text-destructive">{t('trip.sendFailed')}</span>}
          </span>
          <Button
            size="sm"
            disabled={!enabled || !broadcastMsg.trim() || broadcast.isPending}
            onClick={() => broadcast.mutate({ id: tripId, message: broadcastMsg.trim() }, { onSuccess: () => setBroadcastMsg('') })}
          >
            {broadcast.isPending ? t('trip.sending') : t('trip.send')}
          </Button>
        </div>
      </div>

      {/* Reroute / vehicle swap */}
      <div className="mt-5 space-y-2 border-t border-border pt-4">
        <label className="flex items-center gap-2 text-sm font-medium"><Shuffle className="size-4" /> {t('trip.reroute')}</label>
        <Select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} disabled={!enabled}>
          <option value="" disabled>{t('trip.selectVehicle')}</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>{v.plateNumber}</option>
          ))}
        </Select>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs" aria-live="polite">
            {reroute.isSuccess && <span className="text-success">{t('trip.swapDone')}</span>}
            {reroute.isError && <span className="text-destructive">{t('trip.sendFailed')}</span>}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={!enabled || !vehicleId || reroute.isPending}
            onClick={() => reroute.mutate({ id: tripId, vehicleId }, { onSuccess: () => setVehicleId('') })}
          >
            {reroute.isPending ? t('trip.sending') : t('trip.confirmSwap')}
          </Button>
        </div>
      </div>
    </GlassCard>
  );
}
