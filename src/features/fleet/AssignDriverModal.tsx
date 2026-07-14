import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UserRound } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Field, Select } from '@/components/ui/form';
import type { Driver } from './data';

// Backend: a driver is put on the road by assigning them to a scheduled trip →
// PATCH /trips/{id} { driverId, vehicleId }. Trips/vehicles come from GET /trips (scheduled) + GET /vehicles.
const SCHEDULED_TRIPS = [
  { id: 'TRP-8510', label: 'Kigali → Nyagatare · 11:30' },
  { id: 'TRP-8514', label: 'Musanze → Kigali · 12:00' },
  { id: 'TRP-8520', label: 'Kigali → Huye · 13:15' },
];
const VEHICLES = [
  { id: 'RAB-402', label: 'RAB-402 · Executive Coach' },
  { id: 'RAE-27', label: 'RAE-27 · Coaster' },
  { id: 'RAD-88', label: 'RAD-88 · Yutong Bus' },
];

export function AssignDriverModal({ driver, open, onClose }: { driver: Driver | null; open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const [trip, setTrip] = useState('');
  const [saving, setSaving] = useState(false);

  if (!driver) return null;

  function submit() {
    if (!trip) return;
    setSaving(true);
    // PATCH /trips/{trip} { driverId: driver.id, vehicleId } — stubbed until the API client is wired.
    setTimeout(() => {
      setSaving(false);
      setTrip('');
      onClose();
    }, 500);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('drivers.assign')}
      description={t('forms.assignSub', { name: driver.name })}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>{t('forms.cancel')}</Button>
          <Button onClick={submit} disabled={saving || !trip}>{saving ? t('forms.saving') : t('drivers.assign')}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-xl bg-secondary/50 p-3">
          <span className="grid size-9 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            {driver.name.charAt(0)}
          </span>
          <div className="text-sm">
            <p className="font-medium">{driver.name}</p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <UserRound className="size-3" /> {driver.license}
            </p>
          </div>
        </div>

        <Field label={t('forms.trip')} htmlFor="a-trip" required>
          <Select id="a-trip" value={trip} onChange={(e) => setTrip(e.target.value)}>
            <option value="" disabled>{t('forms.selectTrip')}</option>
            {SCHEDULED_TRIPS.map((tr) => (
              <option key={tr.id} value={tr.id}>{tr.label}</option>
            ))}
          </Select>
        </Field>
        <Field label={t('forms.vehicle')} htmlFor="a-vehicle" hint={t('forms.vehicleHint')}>
          <Select id="a-vehicle" defaultValue="">
            <option value="" disabled>{t('forms.selectVehicle')}</option>
            {VEHICLES.map((v) => (
              <option key={v.id} value={v.id}>{v.label}</option>
            ))}
          </Select>
        </Field>
      </div>
    </Modal>
  );
}
