import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Rocket, Radio, X } from 'lucide-react';
import { GlassCard } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Field, Input, Select } from '@/components/ui/form';
import { Async } from '@/components/ui/async';
import { cn } from '@/lib/utils';
import { useTripRequests, useDispatchTripRequest, useDenyTripRequest, useRoutes, useStops, useVehicles, useDrivers, type ApiTripRequest } from '@/lib/api/hooks';

// Live agent demand-pooling board (GET /trip-requests?status=open). Each row is one agent's own estimate
// for a route; several agents can pool onto the same corridor. Ops dispatches (POST /trip-requests/:id/dispatch
// — pools EVERY open request on that route into the same trip) or denies a single request with a reason.
export function TripRequestsBoard() {
  const { t } = useTranslation();
  const requestsQ = useTripRequests('open');
  const routesQ = useRoutes();
  const stopsQ = useStops();
  const [dispatch, setDispatch] = useState<ApiTripRequest | null>(null);
  const deny = useDenyTripRequest();
  const hasRequests = (requestsQ.data ?? []).length > 0;

  const routeName = useMemo(() => {
    const m = new Map((routesQ.data ?? []).map((r) => [r.id, `${r.origin} → ${r.destination}`]));
    return (id: string) => m.get(id) ?? id;
  }, [routesQ.data]);
  const stopName = useMemo(() => {
    const m = new Map((stopsQ.data ?? []).map((s) => [s.id, s.name]));
    return (id: string) => m.get(id) ?? '—';
  }, [stopsQ.data]);

  // Pool by route so ops sees the combined demand, not just one agent's slice of it.
  const pools = useMemo(() => {
    const byRoute = new Map<string, ApiTripRequest[]>();
    (requestsQ.data ?? []).forEach((r) => {
      const list = byRoute.get(r.routeId) ?? [];
      list.push(r);
      byRoute.set(r.routeId, list);
    });
    return [...byRoute.entries()].map(([routeId, requests]) => ({
      routeId,
      requests,
      totalPassengers: requests.reduce((sum, r) => sum + r.passengerCount, 0),
    }));
  }, [requestsQ.data]);

  return (
    <GlassCard className={cn('flex h-full flex-col p-6', hasRequests && 'ring-1 ring-destructive/40')}>
      <DispatchTripRequestModal request={dispatch} routeName={dispatch ? routeName(dispatch.routeId) : ''} onClose={() => setDispatch(null)} />
      <h3 className="flex items-center gap-2 text-base font-semibold">
        <span className={cn('grid size-7 place-items-center rounded-full', hasRequests ? 'bg-destructive/15 text-destructive' : 'bg-secondary text-muted-foreground')}>
          <Radio className={cn('size-4', hasRequests && 'animate-pulse')} />
        </span>
        {t('sched.tripRequests')}
        {hasRequests && (
          <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-semibold text-destructive">
            {t('sched.tripRequestsOpenCount', { count: requestsQ.data!.length })}
          </span>
        )}
      </h3>
      <p className="text-sm text-muted-foreground">{t('sched.tripRequestsSub')}</p>

      <Async
        query={requestsQ}
        isEmpty={(d) => d.length === 0}
        skeleton={<div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="shimmer h-40 rounded-xl" />)}</div>}
        empty={<p className="mt-6 rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">{t('sched.tripRequestsEmpty')}</p>}
      >
        {() => (
          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
            {pools.map((pool) => (
              <div key={pool.routeId} className="flex flex-col rounded-xl border border-border p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="flex items-center gap-2 font-semibold">{routeName(pool.routeId)}</p>
                  <span className="text-sm font-semibold tabular-nums">{t('sched.paxCount', { n: pool.totalPassengers })}</span>
                </div>
                <ul className="mt-3 max-h-40 space-y-1.5 overflow-y-auto">
                  {pool.requests.map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-2 text-xs">
                      <span className="min-w-0 truncate"><span className="font-medium">{r.agentName}</span> · {t('sched.paxCount', { n: r.passengerCount })}</span>
                      <span className="shrink-0 text-muted-foreground">{stopName(r.originStopId)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex-1" />
                <div className="mt-3 flex gap-2 border-t border-border pt-3">
                  <Button size="sm" className="flex-1" onClick={() => setDispatch(pool.requests[0]!)}>
                    <Rocket className="size-4" /> {t('sched.dispatchBus')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-destructive hover:text-destructive"
                    disabled={deny.isPending}
                    onClick={() => {
                      const reason = window.prompt(t('sched.tripRequestDenyPrompt'));
                      if (reason && reason.trim()) deny.mutate({ id: pool.requests[0]!.id, reason: reason.trim() });
                    }}
                  >
                    <X className="size-4" /> {t('sched.deny')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Async>
    </GlassCard>
  );
}

// Dispatch a route's pooled trip requests into a real bookable trip: pick a departure time and
// (optionally) a bus + driver. Resolves EVERY open request on the route, not just the one clicked.
function DispatchTripRequestModal({ request, routeName, onClose }: { request: ApiTripRequest | null; routeName: string; onClose: () => void }) {
  const { t } = useTranslation();
  const vehiclesQ = useVehicles();
  const driversQ = useDrivers();
  const dispatch = useDispatchTripRequest();
  const [departAt, setDepartAt] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [err, setErr] = useState<string | null>(null);
  if (!request) return null;

  function go() {
    setErr(null);
    if (!departAt) { setErr(t('sched.departRequired')); return; }
    dispatch.mutate(
      { id: request!.id, departureTime: new Date(departAt).toISOString(), vehicleId: vehicleId || undefined, driverId: driverId || undefined },
      { onSuccess: () => { setDepartAt(''); setVehicleId(''); setDriverId(''); onClose(); }, onError: (e) => setErr(e instanceof Error ? e.message : t('sched.departRequired')) },
    );
  }

  return (
    <Modal
      open={request !== null}
      onClose={onClose}
      title={t('sched.dispatchTitle')}
      description={routeName}
      footer={<><Button variant="outline" onClick={onClose} disabled={dispatch.isPending}>{t('forms.cancel')}</Button><Button onClick={go} disabled={dispatch.isPending}>{dispatch.isPending ? t('forms.saving') : t('sched.dispatchBus')}</Button></>}
    >
      <div className="space-y-4">
        {err && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{err}</p>}
        <Field label={t('sched.departAt')} htmlFor="dtr-depart" required>
          <Input id="dtr-depart" type="datetime-local" value={departAt} onChange={(e) => setDepartAt(e.target.value)} />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t('trip.vehicleDetails')} htmlFor="dtr-vehicle">
            <Select id="dtr-vehicle" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
              <option value="">{t('forms.selectVehicle')}</option>
              {(vehiclesQ.data ?? []).filter((v) => v.status === 'active').map((v) => <option key={v.id} value={v.id}>{v.plateNumber}</option>)}
            </Select>
          </Field>
          <Field label={t('trip.assignedDriver')} htmlFor="dtr-driver">
            <Select id="dtr-driver" value={driverId} onChange={(e) => setDriverId(e.target.value)}>
              <option value="">{t('drivers.noVehicle', '—')}</option>
              {(driversQ.data ?? []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
          </Field>
        </div>
      </div>
    </Modal>
  );
}
