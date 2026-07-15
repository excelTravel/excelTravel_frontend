import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Rocket } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/form';

const BUSES = [
  { id: 'RAE-27', label: 'RAE-27 · Coaster (33)' },
  { id: 'RAD-88', label: 'RAD-88 · Yutong (44)' },
  { id: 'RAF-51', label: 'RAF-51 · Coach (40)' },
];

// Dispatch an unplanned / early bus for pooled demand or a full waitlist → POST /trips (stubbed).
export function DispatchModal({
  open,
  onClose,
  from,
  to,
  pax,
  note,
}: {
  open: boolean;
  onClose: () => void;
  from: string;
  to: string;
  pax: number;
  note?: string;
}) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  function go() {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      onClose();
    }, 500);
  }
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('sched.dispatchTitle')}
      description={t('sched.dispatchSub')}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>{t('forms.cancel')}</Button>
          <Button onClick={go} disabled={saving}>
            <Rocket className="size-4" /> {saving ? t('forms.saving') : t('sched.dispatchBus')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 p-3">
          <span className="flex items-center gap-2 font-semibold">{from} <ArrowRight className="size-4 text-muted-foreground" /> {to}</span>
          <span className="rounded-full bg-[hsl(var(--teal))]/15 px-2.5 py-0.5 text-sm font-semibold text-[hsl(var(--teal))]">
            {t('sched.paxCount', { n: pax })}
          </span>
        </div>
        {note && <p className="text-sm text-muted-foreground">{note}</p>}
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('forms.vehicle')} htmlFor="d-bus">
            <Select id="d-bus" defaultValue="">
              <option value="" disabled>{t('forms.selectVehicle')}</option>
              {BUSES.map((b) => (
                <option key={b.id} value={b.id}>{b.label}</option>
              ))}
            </Select>
          </Field>
          <Field label={t('sched.departAt')} htmlFor="d-time">
            <Input id="d-time" type="time" />
          </Field>
        </div>
      </div>
    </Modal>
  );
}

// Create a recurring trip routine (template) → future backend recurring-trips endpoint (stubbed).
export function RoutineModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  function create() {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      onClose();
    }, 500);
  }
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('sched.newRoutine')}
      description={t('sched.newRoutineSub')}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>{t('forms.cancel')}</Button>
          <Button onClick={create} disabled={saving}>{saving ? t('forms.saving') : t('sched.createRoutine')}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('sched.origin')} htmlFor="r-from"><Input id="r-from" placeholder="Nyagatare" /></Field>
          <Field label={t('sched.destination')} htmlFor="r-to"><Input id="r-to" placeholder="Remera" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('sched.frequency')} htmlFor="r-freq">
            <Select id="r-freq" defaultValue="daily">
              <option value="daily">{t('sched.freq.daily')}</option>
              <option value="weekdays">{t('sched.freq.weekdays')}</option>
              <option value="weekends">{t('sched.freq.weekends')}</option>
              <option value="weekly">{t('sched.freq.weekly')}</option>
            </Select>
          </Field>
          <Field label={t('forms.vehicle')} htmlFor="r-bus">
            <Select id="r-bus" defaultValue="">
              <option value="" disabled>{t('forms.selectVehicle')}</option>
              {BUSES.map((b) => (
                <option key={b.id} value={b.id}>{b.label}</option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label={t('sched.times')} htmlFor="r-times" hint={t('sched.timesHint')}>
          <Input id="r-times" placeholder="06:00, 12:00, 17:30" />
        </Field>
      </div>
    </Modal>
  );
}
