import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bus, CheckCircle2, CircleDot, Rocket, Send, Shuffle, Users } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/form';

const ROUTES = [
  { id: 'r1', name: 'Kigali → Musanze' },
  { id: 'r2', name: 'Kigali → Rubavu' },
  { id: 'r3', name: 'Kigali → Huye' },
  { id: 'r4', name: 'Nyagatare → Remera' },
];
const VEHICLES = [
  { id: 'RAE 027 B', label: 'RAE 027 B · Coaster (33)' },
  { id: 'RAD 088 A', label: 'RAD 088 A · Yutong (44)' },
  { id: 'RAF 051 C', label: 'RAF 051 C · Coach (40)' },
];
const DRIVERS = [
  { id: 'd4', name: 'Jean Mugabo' },
  { id: 'd5', name: 'Claudine Umutoni' },
  { id: 'd1', name: 'Sarah Uwase' },
];

// Create a trip → POST /trips (CreateTrip: routeId, vehicleId, driverId, direction, departureTime). Stubbed.
export function NewTripModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  function create() {
    setSaving(true);
    setTimeout(() => { setSaving(false); onClose(); }, 500);
  }
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('tripsList.newTrip')}
      description={t('tripsList.mng.newTripSub')}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>{t('forms.cancel')}</Button>
          <Button onClick={create} disabled={saving}>{saving ? t('forms.saving') : t('tripsList.mng.createTrip')}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label={t('forms.route')} htmlFor="nt-route" required>
          <Select id="nt-route" defaultValue="">
            <option value="" disabled>{t('forms.selectRoute')}</option>
            {ROUTES.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('tripsList.mng.departDate')} htmlFor="nt-date"><Input id="nt-date" type="date" /></Field>
          <Field label={t('tripsList.mng.departTime')} htmlFor="nt-time"><Input id="nt-time" type="time" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('forms.vehicle')} htmlFor="nt-bus">
            <Select id="nt-bus" defaultValue="">
              <option value="" disabled>{t('forms.selectVehicle')}</option>
              {VEHICLES.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
            </Select>
          </Field>
          <Field label={t('drivers.colDriver')} htmlFor="nt-driver">
            <Select id="nt-driver" defaultValue="">
              <option value="" disabled>{t('tripsList.mng.selectDriver')}</option>
              {DRIVERS.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
          </Field>
        </div>
        <Field label={t('tripsList.mng.direction')} htmlFor="nt-dir">
          <Select id="nt-dir" defaultValue="outbound">
            <option value="outbound">{t('tripsList.mng.outbound')}</option>
            <option value="return">{t('tripsList.mng.return')}</option>
          </Select>
        </Field>
      </div>
    </Modal>
  );
}

export interface ManageTrip {
  id: string;
  from: string;
  to: string;
  departs: string;
  bus: string;
  driver: string;
  published: boolean;
}

const WAITLIST = [
  { name: 'Aline U.', seg: 'Nyabugogo → Musanze' },
  { name: 'K. Mugabo', seg: 'Nyabugogo → Muhanga' },
  { name: 'S. Karekezi', seg: 'Nyabugogo → Musanze' },
];

// Manage an existing trip: publish for booking, change/assign vehicle, reroute, view waitlist.
// Publish → a bookable flag (no backend field yet); vehicle/route → PATCH /trips/{id}. Stubbed.
export function TripManageModal({ trip, open, onClose }: { trip: ManageTrip | null; open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const [published, setPublished] = useState(false);
  if (!trip) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={t('tripsList.mng.manageTitle')}
      description={`${trip.id} · ${trip.from} → ${trip.to} · ${trip.departs}`}
      footer={<Button variant="outline" onClick={onClose}>{t('forms.close')}</Button>}
    >
      <div className="space-y-5">
        {/* Publish */}
        <section className="rounded-xl border border-border p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold">
                {published ? <CheckCircle2 className="size-4 text-success" /> : <CircleDot className="size-4 text-muted-foreground" />}
                {published ? t('tripsList.mng.published') : t('tripsList.mng.draft')}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{t('tripsList.mng.publishHint')}</p>
            </div>
            <Button size="sm" variant={published ? 'outline' : 'default'} onClick={() => setPublished((p) => !p)}>
              {published ? t('tripsList.mng.unpublish') : (<><Send className="size-4" /> {t('tripsList.mng.publish')}</>)}
            </Button>
          </div>
        </section>

        {/* Vehicle + reroute */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t('tripsList.mng.changeVehicle')} htmlFor="mt-bus" hint={`${t('accidents.currentBus')}: ${trip.bus}`}>
            <Select id="mt-bus" defaultValue="">
              <option value="" disabled>{t('forms.selectVehicle')}</option>
              {VEHICLES.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
            </Select>
          </Field>
          <Field label={t('tripsList.mng.reroute')} htmlFor="mt-route" hint={`${t('tripsList.mng.currentRoute')}: ${trip.from} → ${trip.to}`}>
            <Select id="mt-route" defaultValue="">
              <option value="" disabled>{t('forms.selectRoute')}</option>
              {ROUTES.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </Select>
          </Field>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline"><Bus className="size-4" /> {t('tripsList.mng.assignVehicle')}</Button>
          <Button size="sm" variant="outline"><Shuffle className="size-4" /> {t('trip.reroute')}</Button>
        </div>

        {/* Waitlist */}
        <section>
          <h4 className="flex items-center gap-2 text-sm font-semibold">
            <Users className="size-4" /> {t('tripsList.mng.waitlist')}
            <span className="rounded-full bg-secondary px-2 text-xs font-semibold tabular-nums">{WAITLIST.length}</span>
          </h4>
          <ul className="mt-2 divide-y divide-border rounded-xl border border-border">
            {WAITLIST.map((w) => (
              <li key={w.name} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                <span className="font-medium">{w.name}</span>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">{w.seg}</span>
              </li>
            ))}
          </ul>
          <Button size="sm" className="mt-3 w-full"><Rocket className="size-4" /> {t('tripsList.mng.dispatchWaitlist')}</Button>
        </section>
      </div>
    </Modal>
  );
}
