import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  Bus,
  ChevronRight,
  Download,
  Megaphone,
  MessageSquare,
  Phone,
  Repeat,
  Route,
  Shuffle,
  Star,
  Ticket,
  Users,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge, StatusPill } from '@/components/ui/badge';
import { Table, Thead, Th, Tbody, Td, Tr } from '@/components/ui/table';
import { Reveal, RevealItem } from '@/components/motion/Motion';
import { MapPreview } from '@/features/map/MapPreview';
import { MessageDriverModal } from './MessageDriverModal';
import { RerouteModal, EmergencyBroadcastModal } from './DispatchModals';
import { downloadCsv } from '@/lib/csv';
import { formatRWF, cn } from '@/lib/utils';

const DRIVER_NAME = 'Sarah Uwase';
const CAPACITY = 40;

// This timed trip belongs to a recurring route. A route (Kigali → Musanze) is always there; each timed
// departure is one independent trip that still accounts to the route. Stub — wired later to /trips/{id}.
const ROUTE = { name: 'Kigali → Musanze', frequency: 'Daily' };
const SIBLING_TRIPS = [
  { id: 'TRP-8488', bus: 'RAA-000-Z', departs: '06:30', status: 'completed', current: false },
  { id: 'TRP-8492', bus: 'RAB-402-C', departs: '08:30', status: 'in_transit', current: true },
  { id: 'TRP-8510', bus: 'RAB-001-Z', departs: '11:30', status: 'scheduled', current: false },
];

// Segment-based capacity (no assigned seats): a seat freed at one stop is available onward. `onboard` is the
// running count on the bus after each stop; `free` = capacity − onboard (unbooked seats from that stop).
const STOPS = [
  { name: 'Nyabugogo', arrival: '08:30', boarded: 22, alighted: 0 },
  { name: 'Shyorongi', arrival: '09:12', boarded: 8, alighted: 2 },
  { name: 'Muhanga', arrival: '09:50', boarded: 6, alighted: 5 },
  { name: 'Musanze', arrival: '10:45', boarded: 0, alighted: 29 }, // terminus — everyone still aboard alights
];

// Manifest + event log (stub). Wired later to /bookings (manifest), /tracking (map/ETA), /me (driver).
const manifest = [
  { name: 'Jean-Paul N.', ticket: '#ET-8921', source: 'App' },
  { name: 'Marie-Claire U.', ticket: '#ET-8922', source: 'Agent' },
  { name: 'Emmanuel K.', ticket: '#ET-8923', source: 'Web' },
];

const log = [
  { title: 'Passing Shyorongi', meta: '09:12 · 45 km/h' },
  { title: 'Departed Kigali Central', meta: '08:30 · On-time' },
  { title: 'Engine ignition / pre-check', meta: '08:15 · Status: optimal' },
];

export function TripDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [msgOpen, setMsgOpen] = useState(false);
  const [rerouteOpen, setRerouteOpen] = useState(false);
  const [emergencyOpen, setEmergencyOpen] = useState(false);

  // Manifest export — client CSV from the trip's bookings (GET /bookings?tripId once wired).
  function downloadManifest() {
    downloadCsv(
      `manifest-${id ?? 'trip'}.csv`,
      ['Passenger', 'Ticket', 'Source'],
      manifest.map((p) => [p.name, p.ticket, p.source]),
    );
  }

  return (
    <Reveal className="space-y-6">
      <MessageDriverModal open={msgOpen} onClose={() => setMsgOpen(false)} driverName={DRIVER_NAME} />
      <RerouteModal open={rerouteOpen} onClose={() => setRerouteOpen(false)} />
      <EmergencyBroadcastModal open={emergencyOpen} onClose={() => setEmergencyOpen(false)} />
      {/* Breadcrumb + title + trip pills */}
      <RevealItem>
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link to="/trips" className="rounded font-medium hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {t('trip.breadcrumb')}
          </Link>
          <ChevronRight className="size-3.5" aria-hidden />
          <span className="font-medium text-foreground">{id ?? 'TRX-8921'}</span>
        </nav>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-[hsl(var(--navy))] dark:text-foreground">
              {ROUTE.name}
            </h2>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
              <Repeat className="size-3.5" /> {t('trip.recurs', { freq: t(`sched.freq.${ROUTE.frequency.toLowerCase()}`) })}
              <span className="text-muted-foreground/50">·</span>
              {t('trip.thisTrip', { id: id ?? 'TRP-8492', departs: '08:30' })}
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold">
            <span className="grid size-6 place-items-center rounded-full bg-primary/10 text-primary">
              <Bus className="size-3.5" />
            </span>
            RAB-402-C
          </span>
        </div>
      </RevealItem>

      {/* Route context — sibling trips on the same recurring route today */}
      <RevealItem>
        <GlassCard className="p-4">
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <Route className="size-3.5" /> {t('trip.otherTrips')}
          </p>
          <div className="flex flex-wrap gap-2">
            {SIBLING_TRIPS.map((s) => (
              <Link
                key={s.id}
                to={`/trips/${s.id}`}
                aria-current={s.current ? 'page' : undefined}
                className={cn(
                  'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors',
                  s.current ? 'border-primary/50 bg-primary/5 font-semibold' : 'border-border hover:bg-secondary/50',
                )}
              >
                <span className="tabular-nums">{s.departs}</span>
                <span className="text-muted-foreground">{s.bus}</span>
                <StatusPill status={s.status}>{t(`tripsList.status.${s.status}`)}</StatusPill>
              </Link>
            ))}
          </div>
        </GlassCard>
      </RevealItem>

      <RevealItem className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Left: map + ETA strip, manifest, trip log */}
        <div className="space-y-6 xl:col-span-2">
          <GlassCard className="overflow-hidden">
            <MapPreview className="h-[360px] border-b border-border" />
            <div className="flex flex-wrap items-center gap-x-8 gap-y-2 p-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('trip.estimatedArrival')}
                </p>
                <p className="text-sm font-bold">
                  11:45 <span className="font-normal text-muted-foreground">(in 2h 15m)</span>
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('trip.delayRisk')}
                </p>
                <p className="text-sm font-bold text-success">{t('trip.delayLow')}</p>
              </div>
              <div className="ml-auto flex items-center gap-1.5 text-sm font-medium text-warning">
                <AlertTriangle className="size-4" /> {t('trip.constructionZones', { count: 2 })}
              </div>
            </div>
          </GlassCard>

          {/* Boarding & free seats per stop — segment-based occupancy for THIS trip */}
          <GlassCard className="overflow-hidden">
            <div className="flex items-center justify-between p-5 pb-3">
              <div>
                <h3 className="text-base font-semibold">{t('trip.stopsTitle')}</h3>
                <p className="text-sm text-muted-foreground">{t('trip.stopsSub', { capacity: CAPACITY })}</p>
              </div>
              <Badge tone="neutral">{t('trip.capacity', { n: CAPACITY })}</Badge>
            </div>
            <Table>
              <Thead>
                <Th>{t('trip.colStop')}</Th>
                <Th>{t('trip.colArrival')}</Th>
                <Th className="text-right">{t('trip.colBoarded')}</Th>
                <Th className="text-right">{t('trip.colAlighted')}</Th>
                <Th className="text-right">{t('trip.colOnboard')}</Th>
                <Th className="text-right">{t('trip.colFree')}</Th>
              </Thead>
              <Tbody>
                {(() => {
                  let onboard = 0;
                  return STOPS.map((s) => {
                    onboard = Math.max(0, onboard + s.boarded - s.alighted);
                    const free = Math.max(0, CAPACITY - onboard);
                    return (
                      <Tr key={s.name}>
                        <Td className="whitespace-nowrap font-medium">{s.name}</Td>
                        <Td className="whitespace-nowrap tabular-nums text-muted-foreground">{s.arrival}</Td>
                        <Td className="text-right tabular-nums text-teal">{s.boarded ? `+${s.boarded}` : '—'}</Td>
                        <Td className="text-right tabular-nums text-muted-foreground">{s.alighted ? `−${s.alighted}` : '—'}</Td>
                        <Td className="text-right font-semibold tabular-nums">{onboard}</Td>
                        <Td className="text-right tabular-nums">
                          <span className={cn('font-semibold', free === 0 ? 'text-warning' : 'text-foreground')}>{free}</span>
                        </Td>
                      </Tr>
                    );
                  });
                })()}
              </Tbody>
            </Table>
          </GlassCard>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <GlassCard className="p-5">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-base font-semibold">
                  <Users className="size-4" /> {t('trip.manifest')}
                </h3>
                <Badge tone="neutral">{t('trip.booked', { n: 38, total: 40 })}</Badge>
              </div>
              <ul className="mt-4 space-y-2">
                {manifest.map((p, i) => (
                  <li key={p.ticket} className="flex items-center gap-3 rounded-xl bg-secondary/40 p-3">
                    <span className="grid size-9 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      S{i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Ticket {p.ticket} · {p.source}
                      </p>
                    </div>
                    <Ticket className="size-4 text-muted-foreground" aria-hidden />
                  </li>
                ))}
              </ul>
              <Button className="mt-4 w-full" onClick={downloadManifest}>
                <Download className="size-4" /> {t('trip.downloadManifest')}
              </Button>
            </GlassCard>

            <GlassCard className="p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold">{t('trip.tripLog')}</h3>
                <button type="button" className="text-xs font-medium text-primary hover:underline">
                  {t('trip.viewFull')}
                </button>
              </div>
              <ol className="mt-4">
                {log.map((e, i) => (
                  <li key={e.title} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span
                        className={cn('size-3 rounded-full', i === 0 ? 'bg-primary' : 'border-2 border-border bg-card')}
                        aria-hidden
                      />
                      {i < log.length - 1 && <span className="w-px flex-1 bg-border" aria-hidden />}
                    </div>
                    <div className={cn('pb-5', i > 1 && 'opacity-60')}>
                      <p className="text-sm font-medium leading-tight">{e.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{e.meta}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </GlassCard>
          </div>
        </div>

        {/* Right: driver, vehicle, revenue, dispatch */}
        <div className="space-y-6">
          <GlassCard className="p-5">
            <div className="flex items-start gap-4">
              <span className="grid size-14 shrink-0 place-items-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                S
              </span>
              <div className="flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('trip.assignedDriver')}
                </p>
                <p className="text-lg font-bold leading-tight">Sarah Uwase</p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="size-3 fill-warning text-warning" /> 4.92 · {t('trip.trips', { count: 1240 })}
                </p>
              </div>
              <Button variant="outline" size="icon" aria-label="Call driver">
                <Phone className="size-4" />
              </Button>
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('trip.vehicleDetails')}
                </p>
                <p className="text-lg font-bold">RAB-402</p>
                <p className="text-xs text-muted-foreground">2023 Executive Coach</p>
              </div>
              <Badge tone="success">{t('trip.active')}</Badge>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-secondary/50 p-3">
                <p className="text-xs text-muted-foreground">{t('trip.lastServiced')}</p>
                <p className="text-sm font-semibold tabular-nums">01/05/2026</p>
              </div>
              <div className="rounded-lg bg-secondary/50 p-3">
                <p className="text-xs text-muted-foreground">{t('trip.passengerCount')}</p>
                <p className="text-sm font-semibold tabular-nums">20</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="border-t-2 border-t-primary p-5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t('trip.tripRevenueLive')}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="text-3xl font-bold tabular-nums">{formatRWF(1482000)}</span>
              <Badge tone="success">+12% {t('trip.vsAvg')}</Badge>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-secondary/50 p-3 text-center">
                <p className="text-xs text-muted-foreground">{t('trip.webApp')}</p>
                <p className="text-sm font-bold tabular-nums">{formatRWF(940000)}</p>
              </div>
              <div className="rounded-lg bg-secondary/50 p-3 text-center">
                <p className="text-xs text-muted-foreground">{t('trip.agents')}</p>
                <p className="text-sm font-bold tabular-nums">{formatRWF(542000)}</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <h3 className="text-base font-semibold">{t('trip.dispatchControls')}</h3>
            <div className="mt-4 space-y-3">
              <button
                type="button"
                onClick={() => setMsgOpen(true)}
                className="flex w-full items-center justify-between rounded-xl bg-secondary px-4 py-3 text-sm font-medium transition-colors hover:bg-secondary/70"
              >
                <span className="flex items-center gap-2">
                  <MessageSquare className="size-4" /> {t('trip.messageDriver')}
                </span>
                <ChevronRight className="size-4 text-muted-foreground" />
              </button>
              <button
                type="button"
                onClick={() => setRerouteOpen(true)}
                className="flex w-full items-center justify-between rounded-xl bg-primary/10 px-4 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/15"
              >
                <span className="flex items-center gap-2">
                  <Shuffle className="size-4" /> {t('trip.reroute')}
                </span>
                <ChevronRight className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setEmergencyOpen(true)}
                className="flex w-full items-center justify-between rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/15"
              >
                <span className="flex items-center gap-2">
                  <Megaphone className="size-4" /> {t('trip.emergencyBroadcast')}
                </span>
                <ChevronRight className="size-4" />
              </button>
            </div>
          </GlassCard>
        </div>
      </RevealItem>
    </Reveal>
  );
}
