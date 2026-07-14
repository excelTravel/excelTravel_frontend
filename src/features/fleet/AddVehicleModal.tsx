import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/form';

// Maps 1:1 to backend POST /vehicles (CreateVehicle): plateNumber (required), model?, capacity?, year?, routeId?.
// Vehicles are route-locked, so route is part of creation. Wired to the API when the client lands.
const ROUTES = [
  { id: 'r1', name: 'Kigali — Musanze' },
  { id: 'r2', name: 'Kigali — Rubavu' },
  { id: 'r3', name: 'Kigali — Huye' },
  { id: 'r4', name: 'Kigali — Nyagatare' },
];

export function AddVehicleModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const [plate, setPlate] = useState('');
  const [saving, setSaving] = useState(false);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!plate.trim()) return;
    setSaving(true);
    // POST /vehicles { plateNumber, model, capacity, year, routeId } — stubbed until the API client is wired.
    setTimeout(() => {
      setSaving(false);
      onClose();
    }, 500);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('fleet.addVehicle')}
      description={t('forms.addVehicleSub')}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>{t('forms.cancel')}</Button>
          <Button type="submit" form="add-vehicle-form" disabled={saving || !plate.trim()}>
            {saving ? t('forms.saving') : t('fleet.addVehicle')}
          </Button>
        </>
      }
    >
      <form id="add-vehicle-form" onSubmit={submit} className="space-y-4">
        <Field label={t('forms.plate')} htmlFor="v-plate" required hint={t('forms.plateHint')}>
          <Input id="v-plate" value={plate} onChange={(e) => setPlate(e.target.value.toUpperCase())} placeholder="RAB-402" autoComplete="off" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('forms.model')} htmlFor="v-model">
            <Input id="v-model" placeholder="Yutong Bus" />
          </Field>
          <Field label={t('forms.year')} htmlFor="v-year">
            <Input id="v-year" type="number" min={1950} max={2100} placeholder="2023" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('vehicles.colCapacity')} htmlFor="v-cap">
            <Input id="v-cap" type="number" min={1} placeholder="40" />
          </Field>
          <Field label={t('forms.route')} htmlFor="v-route" hint={t('forms.routeHint')}>
            <Select id="v-route" defaultValue="">
              <option value="" disabled>{t('forms.selectRoute')}</option>
              {ROUTES.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </Select>
          </Field>
        </div>
      </form>
    </Modal>
  );
}
