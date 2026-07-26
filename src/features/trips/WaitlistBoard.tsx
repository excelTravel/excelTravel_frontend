import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Rocket, Users, X } from 'lucide-react';
import { GlassCard } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Field, Input, Select } from '@/components/ui/form';
import { Async } from '@/components/ui/async';
import { useWaitlists, useDispatchWaitlist, useDenyWaitlist, useRoutes, useStops, useVehicles, useDrivers, type ApiWaitlist } from '@/lib/api/hooks';

// Live per-route waitlist (GET /waitlist?status=open). Passengers/agents join a corridor; ops dispatch a bus
// (POST /waitlist/:id/dispatch → creates a bookable trip) or deny with a reason (POST /waitlist/:id/deny).
export function WaitlistBoard() {
  const { t } = useTranslation();
  const waitlistsQ = useWaitlists('open');
  const routesQ = useRoutes();
  const stopsQ = useStops();
  const [dispatch, setDispatch] = useState<ApiWaitlist | null>(null);
  const deny = useDenyWaitlist();

  const routeName = useMemo(() => {
    const m = new Map((routesQ.data ?? []).map((r) => [r.id, `${r.origin} → ${r.destination}`]));
    return (id: string) => m.get(id) ?? id;
  }, [routesQ.data]);
  const stopName = useMemo(() => {
    const m = new Map((stopsQ.data ?? []).map((s) => [s.id, s.name]));
    return (id: string) => m.get(id) ?? '—';
  }, [stopsQ.data]);

  return (
    <GlassCard className="flex h-full flex-col p-6">
      <DispatchWaitlistModal waitlist={dispatch} routeName={dispatch ? routeName(dispatch.routeId) : ''} onClose={() => setDispatch(null)} />
      <h3 className="flex items-center gap-2 text-base font-semibold">
        <Users className="size-4" /> {t('sched.waitlist')}
      </h3>
      <p className="text-sm text-muted-foreground">{t('sched.waitlistSub')}</p>

      <Async
        query={waitlistsQ}
        isEmpty={(d) => d.length === 0}
        skeleton={<div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="shimmer h-40 rounded-xl" />)}</div>}
        empty={<p className="mt-6 rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">{t('sched.waitEmpty')}</p>}
      >
        {(data) => (
          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
            {data.map((w) => (
              <div key={w.id} className="flex flex-col rounded-xl border border-border p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="flex items-center gap-2 font-semibold">{routeName(w.routeId)}</p>
                  <span className="text-sm font-semibold tabular-nums">{t('sched.paxCount', { n: w.joinerCount })}</span>
                </div>
                <ul className="mt-3 max-h-40 space-y-1.5 overflow-y-auto">
                  {w.joiners.map((j) => (
                    <li key={j.id} className="flex items-center justify-between gap-2 text-xs">
                      <span className="min-w-0 truncate"><span className="font-medium">{j.passengerName}</span> · {j.passengerPhone}</span>
                      <span className="shrink-0 text-muted-foreground">{stopName(j.currentOriginStopId)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex-1" />
                <div className="mt-3 flex gap-2 border-t border-border pt-3">
                  <Button size="sm" className="flex-1" onClick={() => setDispatch(w)}>
                    <Rocket className="size-4" /> {t('sched.dispatchBus')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-destructive hover:text-destructive"
                    disabled={deny.isPending}
                    onClick={() => {
                      const reason = window.prompt(t('sched.denyReasonPrompt'));
                      if (reason && reason.trim()) deny.mutate({ id: w.id, reason: reason.trim() });
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

// Dispatch a waitlist pool into a real bookable trip: pick a departure time and (optionally) a bus + driver.
function DispatchWaitlistModal({ waitlist, routeName, onClose }: { waitlist: ApiWaitlist | null; routeName: string; onClose: () => void }) {
  const { t } = useTranslation();
  const vehiclesQ = useVehicles();
  const driversQ = useDrivers();
  const dispatch = useDispatchWaitlist();
  const [departAt, setDepartAt] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [err, setErr] = useState<string | null>(null);
  if (!waitlist) return null;

  function go() {
    setErr(null);
    if (!departAt) { setErr(t('sched.departRequired')); return; }
    dispatch.mutate(
      { id: waitlist!.id, departureTime: new Date(departAt).toISOString(), vehicleId: vehicleId || undefined, driverId: driverId || undefined },
      { onSuccess: () => { setDepartAt(''); setVehicleId(''); setDriverId(''); onClose(); }, onError: (e) => setErr(e instanceof Error ? e.message : t('sched.departRequired')) },
    );
  }

  return (
    <Modal
      open={waitlist !== null}
      onClose={onClose}
      title={t('sched.dispatchTitle')}
      description={`${routeName} · ${t('sched.paxCount', { n: waitlist.joinerCount })}`}
      footer={<><Button variant="outline" onClick={onClose} disabled={dispatch.isPending}>{t('forms.cancel')}</Button><Button onClick={go} disabled={dispatch.isPending}>{dispatch.isPending ? t('forms.saving') : t('sched.dispatchBus')}</Button></>}
    >
      <div className="space-y-4">
        {err && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{err}</p>}
        <Field label={t('sched.departAt')} htmlFor="dw-depart" required>
          <Input id="dw-depart" type="datetime-local" value={departAt} onChange={(e) => setDepartAt(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('trip.vehicleDetails')} htmlFor="dw-vehicle">
            <Select id="dw-vehicle" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
              <option value="">{t('forms.selectVehicle')}</option>
              {(vehiclesQ.data ?? []).filter((v) => v.status === 'active').map((v) => <option key={v.id} value={v.id}>{v.plateNumber}</option>)}
            </Select>
          </Field>
          <Field label={t('trip.assignedDriver')} htmlFor="dw-driver">
            <Select id="dw-driver" value={driverId} onChange={(e) => setDriverId(e.target.value)}>
              <option value="">{t('drivers.noVehicle', '—')}</option>
              {(driversQ.data ?? []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
          </Field>
        </div>
      </div>
    </Modal>
  );
}
