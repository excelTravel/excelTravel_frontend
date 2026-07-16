import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Ticket, ArrowRight, Banknote, Smartphone, CheckCircle2, Users, RotateCcw } from 'lucide-react';
import { GlassCard } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/form';
import { Reveal, RevealItem } from '@/components/motion/Motion';
import { formatRWF, cn } from '@/lib/utils';

// Agent sell-ticket flow → POST /bookings (CreateBooking). Fare is computed server-side (lookup_fare);
// here it's a stub from the segment length. Capacity is enforced by the backend transaction. Stubbed.
const TRIPS = [
  { id: 'TRP-8510', label: 'Kigali → Nyagatare · 11:30', stops: ['Nyabugogo', 'Rwamagana', 'Kayonza', 'Nyagatare'], free: 18, cap: 33 },
  { id: 'TRP-8514', label: 'Musanze → Kigali · 12:00', stops: ['Musanze', 'Muhanga', 'Nyabugogo'], free: 6, cap: 40 },
  { id: 'TRP-8520', label: 'Kigali → Huye · 13:15', stops: ['Nyabugogo', 'Muhanga', 'Nyanza', 'Huye'], free: 24, cap: 44 },
];
type Pay = 'cash' | 'mobile_money';

interface IssuedTicket { no: string; fare: number; route: string; name: string; pay: Pay }

export function BookingDesk() {
  const { t } = useTranslation();
  const [tripId, setTripId] = useState('');
  const [board, setBoard] = useState('');
  const [alight, setAlight] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pay, setPay] = useState<Pay>('cash');
  const [ticket, setTicket] = useState<IssuedTicket | null>(null);
  const [sold, setSold] = useState({ count: 12, revenue: 58200 });

  const trip = TRIPS.find((tp) => tp.id === tripId);
  const stops = trip?.stops ?? [];
  const bi = stops.indexOf(board);
  const ai = stops.indexOf(alight);
  const validSeg = bi >= 0 && ai >= 0 && ai > bi;
  const fare = validSeg ? 1000 + (ai - bi) * 1200 : 0;
  const canIssue = Boolean(trip && validSeg && name.trim());

  function reset() {
    setTicket(null);
    setBoard('');
    setAlight('');
    setName('');
    setPhone('');
  }
  function issue() {
    if (!canIssue) return;
    const t2: IssuedTicket = { no: `ET-${Math.floor(1000 + Math.random() * 9000)}`, fare, route: `${board} → ${alight}`, name, pay };
    setTicket(t2);
    setSold((s) => ({ count: s.count + 1, revenue: s.revenue + fare }));
  }

  return (
    <Reveal className="grid gap-6 lg:grid-cols-[1fr_360px]">
      {/* Form */}
      <RevealItem>
        <GlassCard className="p-6">
          <h3 className="flex items-center gap-2 text-base font-semibold"><Ticket className="size-4" /> {t('bookings.desk.title')}</h3>
          <p className="text-sm text-muted-foreground">{t('bookings.desk.sub')}</p>

          <div className="mt-5 space-y-4">
            <Field label={t('bookings.desk.trip')} htmlFor="bd-trip" required>
              <Select id="bd-trip" value={tripId} onChange={(e) => { setTripId(e.target.value); setBoard(''); setAlight(''); }}>
                <option value="" disabled>{t('bookings.desk.selectTrip')}</option>
                {TRIPS.map((tp) => <option key={tp.id} value={tp.id}>{tp.label}</option>)}
              </Select>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label={t('bookings.desk.board')} htmlFor="bd-board" required>
                <Select id="bd-board" value={board} onChange={(e) => setBoard(e.target.value)} disabled={!trip}>
                  <option value="" disabled>{t('bookings.desk.selectStop')}</option>
                  {stops.map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
              </Field>
              <Field label={t('bookings.desk.alight')} htmlFor="bd-alight" required error={bi >= 0 && ai >= 0 && ai <= bi ? t('bookings.desk.segError') : undefined}>
                <Select id="bd-alight" value={alight} onChange={(e) => setAlight(e.target.value)} disabled={!trip}>
                  <option value="" disabled>{t('bookings.desk.selectStop')}</option>
                  {stops.map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label={t('bookings.desk.passenger')} htmlFor="bd-name" required>
                <Input id="bd-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jean Uwase" />
              </Field>
              <Field label={t('bookings.desk.phone')} htmlFor="bd-phone">
                <Input id="bd-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+250 788 000 000" />
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
        {ticket ? (
          <GlassCard className="overflow-hidden">
            <div className="flex flex-col items-center gap-2 bg-success/10 px-6 py-6 text-center">
              <CheckCircle2 className="size-9 text-success" />
              <p className="text-sm font-semibold text-success">{t('bookings.desk.issued')}</p>
            </div>
            <div className="space-y-3 p-5">
              <TicketRow label={t('bookings.desk.ticketNo')} value={`#${ticket.no}`} strong />
              <TicketRow label={t('bookings.desk.route')} value={ticket.route} />
              <TicketRow label={t('bookings.desk.passenger')} value={ticket.name} />
              <TicketRow label={t('bookings.desk.payment')} value={t(`bookings.desk.${ticket.pay}`)} />
              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="text-sm text-muted-foreground">{t('bookings.desk.fare')}</span>
                <span className="text-xl font-bold tabular-nums">{formatRWF(ticket.fare)}</span>
              </div>
              <Button variant="outline" className="w-full" onClick={reset}><RotateCcw className="size-4" /> {t('bookings.desk.newTicket')}</Button>
            </div>
          </GlassCard>
        ) : (
          <GlassCard className="p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t('bookings.desk.preview')}</p>
            <div className="mt-2 rounded-2xl border border-dashed border-border p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 font-semibold">
                  {board || '—'} <ArrowRight className="size-3.5 text-muted-foreground" /> {alight || '—'}
                </span>
                {trip && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Users className="size-3" /> {trip.free}/{trip.cap}</span>}
              </div>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">{t('bookings.desk.fare')}</p>
                  <p className="text-2xl font-bold tabular-nums">{fare ? formatRWF(fare) : '—'}</p>
                </div>
                <span className="grid size-10 place-items-center rounded-md bg-secondary text-[8px] font-bold text-muted-foreground">QR</span>
              </div>
            </div>
            <Button className="mt-4 w-full" disabled={!canIssue} onClick={issue}>
              <Ticket className="size-4" /> {t('bookings.desk.issue')}
            </Button>
          </GlassCard>
        )}

        <GlassCard className="p-5">
          <p className="text-sm font-semibold">{t('bookings.desk.todaySales')}</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-secondary/50 p-3">
              <p className="text-[10px] uppercase text-muted-foreground">{t('bookings.desk.tickets')}</p>
              <p className="text-xl font-bold tabular-nums">{sold.count}</p>
            </div>
            <div className="rounded-xl bg-secondary/50 p-3">
              <p className="text-[10px] uppercase text-muted-foreground">{t('bookings.revenueToday')}</p>
              <p className="text-xl font-bold tabular-nums">{formatRWF(sold.revenue)}</p>
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
