import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Ticket, ArrowRight, Banknote, Smartphone, CheckCircle2, Clock, RotateCcw } from 'lucide-react';
import { GlassCard } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/form';
import { StatusPill } from '@/components/ui/badge';
import { Reveal, RevealItem } from '@/components/motion/Motion';
import {
  useTrips,
  useRoutes,
  useTrip,
  useCreateBooking,
  useUpdatePayment,
  useBoardBooking,
  useLookupPassenger,
  type ApiBooking,
} from '@/lib/api/hooks';
import { formatRWF, cn } from '@/lib/utils';

type Pay = 'cash' | 'mobile_money';
const BOOKABLE = new Set(['scheduled', 'delayed', 'boarding']);
const PAID = new Set(['paid', 'ticket_issued', 'used']);
const deskTime = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Kigali' });

// Agent sell-ticket flow (the "agent" booking source; walk-ins are booked this way too). Per the booking
// model: create the booking → a payment request goes to the passenger's phone → once paid, Tap&Go issues
// the ticket → the agent boards them. Fare + capacity are enforced server-side (lookup_fare / the booking
// transaction); this desk never computes fare locally.
export function BookingDesk() {
  const { t } = useTranslation();
  const tripsQ = useTrips();
  const routesQ = useRoutes();
  const [tripId, setTripId] = useState('');
  const [boardStopId, setBoardStopId] = useState('');
  const [alightStopId, setAlightStopId] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pay, setPay] = useState<Pay>('cash');
  const [booking, setBooking] = useState<ApiBooking | null>(null);
  const [session, setSession] = useState({ count: 0, revenue: 0 });
  const [err, setErr] = useState<string | null>(null);

  const tripDetailQ = useTrip(tripId || undefined);
  const create = useCreateBooking();
  const updatePayment = useUpdatePayment();
  const board = useBoardBooking();
  const lookup = useLookupPassenger();

  const routeName = useMemo(() => {
    const byId = new Map((routesQ.data ?? []).map((r) => [r.id, `${r.origin} → ${r.destination}`]));
    return (id: string) => byId.get(id) ?? id;
  }, [routesQ.data]);

  const bookable = (tripsQ.data ?? [])
    .filter((tp) => BOOKABLE.has(tp.status))
    .sort((a, b) => a.departureTime.localeCompare(b.departureTime));

  const stops = [...(tripDetailQ.data?.stops ?? [])].sort((a, b) => a.stopOrder - b.stopOrder);
  const boardOrder = stops.find((s) => s.id === boardStopId)?.stopOrder ?? -1;
  const alightOrder = stops.find((s) => s.id === alightStopId)?.stopOrder ?? -1;
  const segError = boardStopId !== '' && alightStopId !== '' && alightOrder <= boardOrder;
  const canCreate = Boolean(tripId && boardStopId && alightStopId && !segError && name.trim());

  function resetForm() {
    setBooking(null);
    setBoardStopId('');
    setAlightStopId('');
    setName('');
    setPhone('');
    setErr(null);
  }

  function onPhoneBlur() {
    const p = phone.trim();
    if (!p || name.trim() || p.length < 7) return;
    lookup.mutate({ phone: p }, { onSuccess: (r) => { if (r.found && r.name) setName(r.name); } });
  }

  function submit() {
    if (!canCreate) return;
    setErr(null);
    create.mutate(
      { tripId, boardStopId, alightStopId, passengerName: name.trim(), passengerPhone: phone.trim() || undefined, paymentMethod: pay, bookingSource: 'agent' },
      {
        onSuccess: (b) => { setBooking(b); setSession((s) => ({ count: s.count + 1, revenue: s.revenue + b.fareAmount })); },
        onError: (e) => setErr(e instanceof Error ? e.message : t('bookings.desk.createFailed')),
      },
    );
  }

  const isPaid = booking ? PAID.has(booking.paymentStatus) : false;
  const boarded = booking?.status === 'used' || booking?.status === 'boarded';

  return (
    <Reveal className="grid gap-6 lg:grid-cols-[1fr_360px]">
      {/* Form */}
      <RevealItem>
        <GlassCard className="p-6">
          <h3 className="flex items-center gap-2 text-base font-semibold"><Ticket className="size-4" /> {t('bookings.desk.title')}</h3>
          <p className="text-sm text-muted-foreground">{t('bookings.desk.sub')}</p>

          <div className="mt-5 space-y-4">
            <Field label={t('bookings.desk.trip')} htmlFor="bd-trip" required>
              <Select id="bd-trip" value={tripId} onChange={(e) => { setTripId(e.target.value); setBoardStopId(''); setAlightStopId(''); setBooking(null); }} disabled={tripsQ.isLoading}>
                <option value="" disabled>{bookable.length ? t('bookings.desk.selectTrip') : t('bookings.desk.noBookableTrips')}</option>
                {bookable.map((tp) => (
                  <option key={tp.id} value={tp.id}>{routeName(tp.routeId)} · {deskTime.format(new Date(tp.departureTime))}</option>
                ))}
              </Select>
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t('bookings.desk.board')} htmlFor="bd-board" required>
                <Select id="bd-board" value={boardStopId} onChange={(e) => setBoardStopId(e.target.value)} disabled={!tripId || tripDetailQ.isLoading}>
                  <option value="" disabled>{t('bookings.desk.selectStop')}</option>
                  {stops.map((s) => <option key={s.id} value={s.id}>{s.stopName}</option>)}
                </Select>
              </Field>
              <Field label={t('bookings.desk.alight')} htmlFor="bd-alight" required error={segError ? t('bookings.desk.segError') : undefined}>
                <Select id="bd-alight" value={alightStopId} onChange={(e) => setAlightStopId(e.target.value)} disabled={!tripId || tripDetailQ.isLoading}>
                  <option value="" disabled>{t('bookings.desk.selectStop')}</option>
                  {stops.map((s) => <option key={s.id} value={s.id}>{s.stopName}</option>)}
                </Select>
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t('bookings.desk.passenger')} htmlFor="bd-name" required>
                <Input id="bd-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jean Uwase" autoComplete="name" />
              </Field>
              <Field label={t('bookings.desk.phone')} htmlFor="bd-phone">
                <Input id="bd-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} onBlur={onPhoneBlur} placeholder="+250 788 000 000" autoComplete="tel" />
              </Field>
            </div>

            <Field label={t('bookings.desk.payment')}>
              <div className="grid grid-cols-2 gap-2">
                {([['cash', Banknote], ['mobile_money', Smartphone]] as const).map(([m, Icon]) => (
                  <button key={m} type="button" onClick={() => setPay(m)} aria-pressed={pay === m}
                    className={cn('flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors', pay === m ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:bg-secondary')}>
                    <Icon className="size-4" /> {t(`bookings.desk.${m}`)}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        </GlassCard>
      </RevealItem>

      {/* Live ticket / summary */}
      <RevealItem className="space-y-6">
        {booking ? (
          <GlassCard className="overflow-hidden">
            <div className={cn('flex flex-col items-center gap-2 px-6 py-6 text-center', isPaid ? 'bg-success/10' : 'bg-warning/10')}>
              {isPaid ? <CheckCircle2 className="size-9 text-success" /> : <Clock className="size-9 text-warning" />}
              <p className={cn('text-sm font-semibold', isPaid ? 'text-success' : 'text-warning')}>
                {boarded ? t('bookings.desk.boarded') : isPaid ? t('bookings.desk.ticketReady') : t('bookings.desk.awaitingPayment')}
              </p>
              {!isPaid && <p className="text-xs text-muted-foreground">{t('bookings.desk.paymentRequested')}</p>}
            </div>
            <div className="space-y-3 p-5">
              <TicketRow label={t('bookings.desk.passenger')} value={booking.passengerName} strong />
              <TicketRow label={t('bookings.desk.payment')} value={t(`bookings.desk.${booking.paymentMethod ?? pay}`)} />
              <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">{t('bookings.colStatus', 'Status')}</span><StatusPill status={booking.paymentStatus}>{booking.paymentStatus}</StatusPill></div>
              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="text-sm text-muted-foreground">{t('bookings.desk.fare')}</span>
                <span className="text-xl font-bold tabular-nums">{formatRWF(booking.fareAmount)}</span>
              </div>
              {!isPaid && (
                <Button className="w-full" disabled={updatePayment.isPending}
                  onClick={() => updatePayment.mutate({ id: booking.id, paymentStatus: 'paid', paymentMethod: pay }, { onSuccess: (b) => setBooking(b) })}>
                  <Banknote className="size-4" /> {updatePayment.isPending ? t('forms.saving') : t('bookings.desk.markPaid')}
                </Button>
              )}
              {isPaid && !boarded && (
                <Button className="w-full" disabled={board.isPending}
                  onClick={() => board.mutate({ id: booking.id }, { onSuccess: (b) => setBooking(b) })}>
                  <CheckCircle2 className="size-4" /> {board.isPending ? t('forms.saving') : t('bookings.desk.boardPassenger')}
                </Button>
              )}
              <Button variant="outline" className="w-full" onClick={resetForm}><RotateCcw className="size-4" /> {t('bookings.desk.newTicket')}</Button>
            </div>
          </GlassCard>
        ) : (
          <GlassCard className="p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t('bookings.desk.preview')}</p>
            <div className="mt-2 rounded-2xl border border-dashed border-border p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 font-semibold">
                  {stops.find((s) => s.id === boardStopId)?.stopName || '—'} <ArrowRight className="size-3.5 text-muted-foreground" /> {stops.find((s) => s.id === alightStopId)?.stopName || '—'}
                </span>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{t('bookings.desk.paymentRequested')}</p>
            </div>
            {err && <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{err}</p>}
            <Button className="mt-4 w-full" disabled={!canCreate || create.isPending} onClick={submit}>
              <Ticket className="size-4" /> {create.isPending ? t('forms.saving') : t('bookings.desk.createBooking')}
            </Button>
          </GlassCard>
        )}

        <GlassCard className="p-5">
          <p className="text-sm font-semibold">{t('bookings.desk.todaySales')}</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-secondary/50 p-3">
              <p className="text-[10px] uppercase text-muted-foreground">{t('bookings.desk.tickets')}</p>
              <p className="text-xl font-bold tabular-nums">{session.count}</p>
            </div>
            <div className="rounded-xl bg-secondary/50 p-3">
              <p className="text-[10px] uppercase text-muted-foreground">{t('bookings.revenueToday')}</p>
              <p className="text-xl font-bold tabular-nums">{formatRWF(session.revenue)}</p>
            </div>
          </div>
        </GlassCard>
      </RevealItem>
    </Reveal>
  );
}

function TicketRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('text-right', strong ? 'font-bold' : 'font-medium')}>{value}</span>
    </div>
  );
}
