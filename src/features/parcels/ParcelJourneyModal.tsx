import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRightLeft, Ban, Bus, Check, PackageCheck, Truck, UserRound } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/form';
import { StatusPill } from '@/components/ui/badge';
import { Async } from '@/components/ui/async';
import { usePackage, useStops, useTrips, useAgents, useHandToDriver, useDeliverPackage, useCollectPackage, useCancelPackage, useSetPackageFee, useMarkPackagePaid } from '@/lib/api/hooks';
import { useSession } from '@/lib/auth/session';
import { formatRWF } from '@/lib/utils';
import { cn } from '@/lib/utils';

const eventTime = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Kigali' });

const AGENTS = new Set(['super_admin', 'company_admin', 'manager', 'agent']);
const DRIVERS = new Set(['super_admin', 'company_admin', 'manager', 'driver']);
const OPS = new Set(['super_admin', 'company_admin', 'manager']);

const EVENT_ICON: Record<string, typeof Truck> = {
  received_by_agent: PackageCheck,
  received_by_driver: PackageCheck,
  handed_to_driver: Truck,
  delivered_to_agent: PackageCheck,
  delivered_to_recipient: Check,
  collected: Check,
  cancelled: Ban,
};

export function ParcelJourneyModal({ packageId, open, onClose }: { packageId: string | null; open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const sessionUser = useSession((s) => s.user);
  const role = sessionUser?.role ?? '';
  const pkgQ = usePackage(packageId ?? undefined);
  const stopsQ = useStops();
  const tripsQ = useTrips();
  const agentsQ = useAgents();
  const stopName = (id: string) => stopsQ.data?.find((s) => s.id === id)?.name ?? '—';

  const handToDriver = useHandToDriver();
  const deliver = useDeliverPackage();
  const collect = useCollectPackage();
  const cancel = useCancelPackage();
  const setFee = useSetPackageFee();
  const markPaid = useMarkPackagePaid();

  const [feeInput, setFeeInput] = useState('');
  const [actionErr, setActionErr] = useState<string | null>(null);

  if (!packageId) return null;
  const pkg = pkgQ.data;
  const busy = handToDriver.isPending || deliver.isPending || collect.isPending || cancel.isPending || setFee.isPending || markPaid.isPending;

  function runAction(mutate: () => void) {
    setActionErr(null);
    mutate();
  }

  const nextAction =
    pkg?.status === 'registered' && AGENTS.has(role)
      ? { icon: Truck, label: t('forms.handToDriver'), run: () => runAction(() => handToDriver.mutate({ id: pkg.id }, { onError: (e) => setActionErr(e instanceof Error ? e.message : t('parcels.actionFailed')) })) }
      : pkg?.status === 'in_transit' && DRIVERS.has(role)
        ? { icon: PackageCheck, label: t('forms.markDelivered'), run: () => runAction(() => deliver.mutate({ id: pkg.id }, { onError: (e) => setActionErr(e instanceof Error ? e.message : t('parcels.actionFailed')) })) }
        : pkg?.status === 'arrived' && AGENTS.has(role)
          ? { icon: Check, label: t('forms.collect'), run: () => runAction(() => collect.mutate({ id: pkg.id }, { onError: (e) => setActionErr(e instanceof Error ? e.message : t('parcels.actionFailed')) })) }
          : undefined;

  const canCancel = pkg && pkg.status !== 'collected' && pkg.status !== 'cancelled' && OPS.has(role);
  const canSetFee = pkg && pkg.fee === null && OPS.has(role);
  const canMarkPaid = pkg && pkg.fee !== null && pkg.paymentStatus !== 'paid' && AGENTS.has(role);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('parcels.journey')}
      description={pkg ? `${pkg.senderName} → ${pkg.recipientName}` : undefined}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>{t('forms.close')}</Button>
          {canCancel && (
            <Button variant="destructive" disabled={busy} onClick={() => runAction(() => cancel.mutate({ id: pkg!.id }, { onError: (e) => setActionErr(e instanceof Error ? e.message : t('parcels.actionFailed')) }))}>
              <Ban className="size-4" /> {t('parcels.cancelParcel')}
            </Button>
          )}
          {nextAction && (
            <Button disabled={busy} onClick={nextAction.run}>
              <nextAction.icon className="size-4" /> {nextAction.label}
            </Button>
          )}
        </>
      }
    >
      <Async query={pkgQ} skeleton={<div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="shimmer h-8 rounded" />)}</div>}>
        {(p) => {
          const trip = p.tripId ? tripsQ.data?.find((tr) => tr.id === p.tripId) : undefined;
          const handlingAgents = (agentsQ.data ?? []).filter((a) => a.stationIds.includes(p.fromStopId));
          return (
          <div className="space-y-5">
            <div className="flex items-center justify-between rounded-xl bg-secondary/50 p-3">
              <div className="text-sm">
                <p className="font-medium">{p.senderName} <span className="text-muted-foreground">→ {p.recipientName}</span></p>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {stopName(p.fromStopId)} <ArrowRightLeft className="size-3" /> {stopName(p.toStopId)}
                </p>
              </div>
              <StatusPill status={p.status} />
            </div>

            {/* Who's carrying it + who to ask — the trip's driver/vehicle, and the origin station's agent(s) */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border p-3">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"><Bus className="size-3" /> {t('parcels.trip')}</p>
                {trip ? (
                  <>
                    <p className="mt-1 text-sm font-semibold">{trip.driverName ?? t('trip.noDriver')}</p>
                    <p className="text-xs text-muted-foreground">{trip.vehiclePlate ?? '—'}</p>
                  </>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">{t('parcels.noTripYet')}</p>
                )}
              </div>
              <div className="rounded-xl border border-border p-3">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"><UserRound className="size-3" /> {t('parcels.handlingAgent')}</p>
                <p className="mt-1 text-sm font-semibold">
                  {handlingAgents.length > 0 ? handlingAgents.map((a) => a.name).join(', ') : t('parcels.noHandlingAgent')}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border p-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{t('parcels.baseFee')}</p>
                <p className="text-lg font-bold tabular-nums">{p.fee !== null ? formatRWF(p.fee) : t('parcels.feeNotSet')}</p>
              </div>
              {canSetFee && (
                <div className="flex items-center gap-2">
                  <Input type="number" min={0} value={feeInput} onChange={(e) => setFeeInput(e.target.value)} placeholder={t('parcels.baseFee')} className="h-9 w-28" />
                  <Button size="sm" disabled={!feeInput.trim() || busy} onClick={() => runAction(() => setFee.mutate({ id: p.id, fee: Number(feeInput) }, { onSuccess: () => setFeeInput(''), onError: (e) => setActionErr(e instanceof Error ? e.message : t('parcels.actionFailed')) }))}>
                    {t('parcels.setFee')}
                  </Button>
                </div>
              )}
              {canMarkPaid && (
                <Button size="sm" variant="outline" disabled={busy} onClick={() => runAction(() => markPaid.mutate({ id: p.id }, { onError: (e) => setActionErr(e instanceof Error ? e.message : t('parcels.actionFailed')) }))}>
                  {t('parcels.markPaidAction')}
                </Button>
              )}
              {!canSetFee && !canMarkPaid && <StatusPill status={p.paymentStatus} />}
            </div>

            {actionErr && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{actionErr}</p>}

            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t('parcels.custodyLog')}</p>
              {!p.events || p.events.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('parcels.noEvents')}</p>
              ) : (
                <ol className="relative">
                  {p.events.map((ev, i) => {
                    const Icon = EVENT_ICON[ev.event] ?? Check;
                    const last = i === p.events!.length - 1;
                    return (
                      <li key={ev.id} className="flex gap-3 pb-5 last:pb-0">
                        <div className="flex flex-col items-center">
                          <span className={cn('grid size-8 shrink-0 place-items-center rounded-full border-2', ev.event === 'cancelled' ? 'border-destructive bg-destructive/15 text-destructive' : 'border-primary bg-primary text-primary-foreground')}>
                            <Icon className="size-4" />
                          </span>
                          {!last && <span className="w-0.5 flex-1 bg-border" />}
                        </div>
                        <div className="pt-1">
                          <p className="text-sm font-semibold leading-tight">{t(`parcels.event.${ev.event}`, ev.event)}</p>
                          <p className="text-xs text-muted-foreground">{eventTime.format(new Date(ev.createdAt))}</p>
                          {ev.notes && <p className="mt-0.5 text-xs text-muted-foreground">{ev.notes}</p>}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          </div>
          );
        }}
      </Async>
    </Modal>
  );
}
