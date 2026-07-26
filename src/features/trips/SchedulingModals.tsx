import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/form';
import { useRoutes, useVehicles, useDrivers, useCreateTemplate } from '@/lib/api/hooks';
import { cn } from '@/lib/utils';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DOW = [1, 2, 3, 4, 5, 6, 0]; // Mon..Sun (backend uses 0=Sun..6=Sat)
const DOW_LABEL: Record<number, string> = { 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat', 0: 'Sun' };

// Create a recurring trip template → POST /trip-templates. Weekly needs weekdays; monthly needs a day-of-month.
export function RoutineModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const routesQ = useRoutes();
  const vehiclesQ = useVehicles();
  const driversQ = useDrivers();
  const create = useCreateTemplate();
  const [routeId, setRouteId] = useState('');
  const [direction, setDirection] = useState<'outbound' | 'return'>('outbound');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [days, setDays] = useState<Set<number>>(new Set());
  const [dayOfMonth, setDayOfMonth] = useState('');
  const [times, setTimes] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [err, setErr] = useState<string | null>(null);

  function toggleDay(d: number) {
    setDays((prev) => { const n = new Set(prev); if (n.has(d)) n.delete(d); else n.add(d); return n; });
  }
  function done() {
    setRouteId(''); setDirection('outbound'); setFrequency('daily'); setDays(new Set()); setDayOfMonth(''); setTimes(''); setVehicleId(''); setDriverId(''); setErr(null);
    onClose();
  }
  function go() {
    setErr(null);
    const departureTimes = times.split(',').map((s) => s.trim()).filter(Boolean);
    if (!routeId || departureTimes.length === 0 || !departureTimes.every((x) => TIME_RE.test(x))) { setErr(t('sched.routineInvalid')); return; }
    if (frequency === 'weekly' && days.size === 0) { setErr(t('sched.routineInvalid')); return; }
    if (frequency === 'monthly' && !dayOfMonth) { setErr(t('sched.routineInvalid')); return; }
    create.mutate(
      {
        routeId, direction, frequency, departureTimes,
        ...(frequency === 'weekly' ? { daysOfWeek: [...days] } : {}),
        ...(frequency === 'monthly' ? { dayOfMonth: Number(dayOfMonth) } : {}),
        ...(vehicleId ? { vehicleId } : {}),
        ...(driverId ? { driverId } : {}),
      },
      { onSuccess: done, onError: (e) => setErr(e instanceof Error ? e.message : t('sched.routineInvalid')) },
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('sched.newRoutine')}
      description={t('sched.newRoutineSub')}
      footer={<><Button variant="outline" onClick={onClose} disabled={create.isPending}>{t('forms.cancel')}</Button><Button onClick={go} disabled={create.isPending}>{create.isPending ? t('forms.saving') : t('sched.createRoutine')}</Button></>}
    >
      <div className="space-y-4">
        {err && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{err}</p>}
        <Field label={t('forms.route')} htmlFor="r-route" required>
          <Select id="r-route" value={routeId} onChange={(e) => setRouteId(e.target.value)}>
            <option value="" disabled>{t('forms.selectRoute')}</option>
            {(routesQ.data ?? []).map((r) => <option key={r.id} value={r.id}>{r.origin} → {r.destination}</option>)}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('sched.frequency')} htmlFor="r-freq">
            <Select id="r-freq" value={frequency} onChange={(e) => setFrequency(e.target.value as 'daily' | 'weekly' | 'monthly')}>
              <option value="daily">{t('sched.freq.daily')}</option>
              <option value="weekly">{t('sched.freq.weekly')}</option>
              <option value="monthly">{t('sched.freq.monthly')}</option>
            </Select>
          </Field>
          <Field label={t('tripsList.mng.direction')} htmlFor="r-dir">
            <Select id="r-dir" value={direction} onChange={(e) => setDirection(e.target.value as 'outbound' | 'return')}>
              <option value="outbound">{t('tripsList.mng.outbound')}</option>
              <option value="return">{t('tripsList.mng.return')}</option>
            </Select>
          </Field>
        </div>
        {frequency === 'weekly' && (
          <Field label={t('sched.weekdays')}>
            <div className="flex flex-wrap gap-1.5">
              {DOW.map((d) => (
                <button key={d} type="button" onClick={() => toggleDay(d)} aria-pressed={days.has(d)}
                  className={cn('rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors', days.has(d) ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-secondary')}>
                  {DOW_LABEL[d]}
                </button>
              ))}
            </div>
          </Field>
        )}
        {frequency === 'monthly' && (
          <Field label={t('sched.dayOfMonth')} htmlFor="r-dom" required>
            <Input id="r-dom" type="number" min={1} max={31} value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)} placeholder="1" />
          </Field>
        )}
        <Field label={t('sched.times')} htmlFor="r-times" hint={t('sched.timesHint')}>
          <Input id="r-times" value={times} onChange={(e) => setTimes(e.target.value)} placeholder="06:00, 12:00, 17:30" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('forms.vehicle')} htmlFor="r-bus">
            <Select id="r-bus" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
              <option value="">{t('forms.selectVehicle')}</option>
              {(vehiclesQ.data ?? []).filter((v) => v.status === 'active').map((v) => <option key={v.id} value={v.id}>{v.plateNumber}</option>)}
            </Select>
          </Field>
          <Field label={t('drivers.colDriver')} htmlFor="r-driver">
            <Select id="r-driver" value={driverId} onChange={(e) => setDriverId(e.target.value)}>
              <option value="">{t('tripsList.mng.selectDriver')}</option>
              {(driversQ.data ?? []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
          </Field>
        </div>
      </div>
    </Modal>
  );
}
