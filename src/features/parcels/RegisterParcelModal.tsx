import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PackagePlus, UserRound } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/form';
import { useRegisterPackage, useStops, useTrips, useRoutes, useCompanies, useAgents } from '@/lib/api/hooks';
import { useSession } from '@/lib/auth/session';
import { formatRWF } from '@/lib/utils';

// A parcel travels on a specific trip — its driver + vehicle then come free (resolved via that trip) for
// whoever picks it up. Only trips that haven't finished yet are offerable.
const ASSIGNABLE_TRIP_STATUSES = new Set(['scheduled', 'delayed', 'boarding', 'departed', 'in_transit', 'arriving']);
const deskTime = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Kigali' });

export function RegisterParcelModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const sessionUser = useSession((s) => s.user);
  const stopsQ = useStops();
  const stops = stopsQ.data ?? [];
  const tripsQ = useTrips();
  const routesQ = useRoutes();
  const companiesQ = useCompanies();
  const agentsQ = useAgents();
  const register = useRegisterPackage();

  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [fromStopId, setFromStopId] = useState('');
  const [toStopId, setToStopId] = useState('');
  const [description, setDescription] = useState('');
  const [tripId, setTripId] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const routeName = useMemo(() => {
    const m = new Map((routesQ.data ?? []).map((r) => [r.id, `${r.origin} → ${r.destination}`]));
    return (id: string) => m.get(id) ?? id;
  }, [routesQ.data]);
  const trips = (tripsQ.data ?? [])
    .filter((tp) => ASSIGNABLE_TRIP_STATUSES.has(tp.status))
    .sort((a, b) => a.departureTime.localeCompare(b.departureTime));

  const myCompany = companiesQ.data?.find((c) => c.id === sessionUser?.companyId);
  const baseFee = myCompany?.parcelBaseFeeRwf ?? 0;
  const perKg = myCompany?.parcelSurchargePerKgRwf ?? 0;
  const estimatedFee = baseFee + perKg * (Number(weightKg) || 0);

  // Whoever's assigned to the origin station is who hands this parcel off — shown so the sender/agent
  // registering it (and whoever later picks it up) knows who to ask.
  const handlingAgents = (agentsQ.data ?? []).filter((a) => fromStopId && a.stationIds.includes(fromStopId));

  const canSubmit =
    senderName.trim() && senderPhone.trim() && recipientName.trim() && recipientPhone.trim() && fromStopId && toStopId && fromStopId !== toStopId && description.trim();

  function reset() {
    setSenderName('');
    setSenderPhone('');
    setRecipientName('');
    setRecipientPhone('');
    setFromStopId('');
    setToStopId('');
    setDescription('');
    setTripId('');
    setWeightKg('');
    setErr(null);
  }

  function submit() {
    if (!canSubmit) return;
    setErr(null);
    register.mutate(
      {
        senderName: senderName.trim(),
        senderPhone: senderPhone.trim(),
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim(),
        fromStopId,
        toStopId,
        description: description.trim(),
        ...(tripId ? { tripId } : {}),
        ...(weightKg.trim() ? { weightKg: Number(weightKg) } : {}),
      },
      {
        onSuccess: () => {
          reset();
          onClose();
        },
        onError: (e) => setErr(e instanceof Error ? e.message : t('parcels.registerFailed')),
      },
    );
  }

  return (
    <Modal
      open={open}
      onClose={() => { reset(); onClose(); }}
      title={t('parcels.registerParcel')}
      description={t('parcels.registerParcelSub')}
      footer={
        <>
          <Button variant="outline" onClick={() => { reset(); onClose(); }} disabled={register.isPending}>{t('forms.cancel')}</Button>
          <Button onClick={submit} disabled={!canSubmit || register.isPending}>
            <PackagePlus className="size-4" /> {register.isPending ? t('forms.saving') : t('parcels.registerParcel')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('parcels.senderName')} htmlFor="pr-sender-name" required>
            <Input id="pr-sender-name" value={senderName} onChange={(e) => setSenderName(e.target.value)} autoComplete="name" />
          </Field>
          <Field label={t('parcels.senderPhone')} htmlFor="pr-sender-phone" required>
            <Input id="pr-sender-phone" type="tel" value={senderPhone} onChange={(e) => setSenderPhone(e.target.value)} placeholder="+250 788 000 000" autoComplete="tel" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('parcels.recipientName')} htmlFor="pr-recipient-name" required>
            <Input id="pr-recipient-name" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} autoComplete="name" />
          </Field>
          <Field label={t('parcels.recipientPhone')} htmlFor="pr-recipient-phone" required>
            <Input id="pr-recipient-phone" type="tel" value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} placeholder="+250 788 000 000" autoComplete="tel" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('parcels.fromStop')} htmlFor="pr-from" required>
            <Select id="pr-from" value={fromStopId} onChange={(e) => setFromStopId(e.target.value)} disabled={stopsQ.isLoading}>
              <option value="" disabled>{t('bookings.desk.selectStop')}</option>
              {stops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </Field>
          <Field label={t('parcels.toStop')} htmlFor="pr-to" required error={fromStopId && toStopId && fromStopId === toStopId ? t('parcels.sameStopError') : undefined}>
            <Select id="pr-to" value={toStopId} onChange={(e) => setToStopId(e.target.value)} disabled={stopsQ.isLoading}>
              <option value="" disabled>{t('bookings.desk.selectStop')}</option>
              {stops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </Field>
        </div>
        {fromStopId && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <UserRound className="size-3.5 shrink-0" />
            {handlingAgents.length > 0
              ? t('parcels.handlingAgents', { names: handlingAgents.map((a) => a.name).join(', ') })
              : t('parcels.noHandlingAgent')}
          </p>
        )}
        <Field label={t('parcels.description')} htmlFor="pr-desc" required>
          <Textarea id="pr-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('parcels.descriptionPlaceholder')} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('parcels.trip')} htmlFor="pr-trip" hint={t('parcels.tripHint')}>
            <Select id="pr-trip" value={tripId} onChange={(e) => setTripId(e.target.value)} disabled={tripsQ.isLoading}>
              <option value="">{t('parcels.noTripYet')}</option>
              {trips.map((tr) => (
                <option key={tr.id} value={tr.id}>{routeName(tr.routeId)} · {deskTime.format(new Date(tr.departureTime))}</option>
              ))}
            </Select>
          </Field>
          <Field label={t('parcels.weight')} htmlFor="pr-weight" hint={t('parcels.kg')}>
            <Input id="pr-weight" type="number" min={0} step="0.1" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} />
          </Field>
        </div>
        <div className="rounded-xl bg-secondary/50 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{t('parcels.baseFee')}</p>
          <p className="mt-0.5 text-lg font-bold tabular-nums">{formatRWF(estimatedFee)}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{t('parcels.autoFeeHint')}</p>
        </div>
        {err && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{err}</p>}
      </div>
    </Modal>
  );
}
