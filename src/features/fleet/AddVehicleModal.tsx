import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/form';
import { useRoutes, useCreateVehicle } from '@/lib/api/hooks';

// POST /vehicles (CreateVehicle): plateNumber (required), model?, capacity?, year?, routeId?. Vehicles are
// route-locked, so route is part of creation.
export function AddVehicleModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const routesQ = useRoutes();
  const create = useCreateVehicle();
  const [plate, setPlate] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [capacity, setCapacity] = useState('');
  const [routeId, setRouteId] = useState('');
  const [err, setErr] = useState<string | null>(null);

  function done() { setPlate(''); setModel(''); setYear(''); setCapacity(''); setRouteId(''); setErr(null); onClose(); }
  function submit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!plate.trim()) { setErr(t('forms.checkFields')); return; }
    create.mutate(
      {
        plateNumber: plate.trim(),
        ...(model.trim() ? { model: model.trim() } : {}),
        ...(year ? { year: Number(year) } : {}),
        ...(capacity ? { capacity: Number(capacity) } : {}),
        ...(routeId ? { routeId } : {}),
      },
      { onSuccess: done, onError: (er) => setErr(er instanceof Error ? er.message : t('forms.checkFields')) },
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('fleet.addVehicle')}
      description={t('forms.addVehicleSub')}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={create.isPending}>{t('forms.cancel')}</Button>
          <Button type="submit" form="add-vehicle-form" disabled={create.isPending || !plate.trim()}>
            {create.isPending ? t('forms.saving') : t('fleet.addVehicle')}
          </Button>
        </>
      }
    >
      <form id="add-vehicle-form" onSubmit={submit} className="space-y-4">
        {err && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{err}</p>}
        <Field label={t('forms.plate')} htmlFor="v-plate" required hint={t('forms.plateHint')}>
          <Input id="v-plate" value={plate} onChange={(e) => setPlate(e.target.value.toUpperCase())} placeholder="RAB 402 C" autoComplete="off" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('forms.model')} htmlFor="v-model">
            <Input id="v-model" value={model} onChange={(e) => setModel(e.target.value)} placeholder="Yutong Bus" />
          </Field>
          <Field label={t('forms.year')} htmlFor="v-year">
            <Input id="v-year" type="number" min={1950} max={2100} value={year} onChange={(e) => setYear(e.target.value)} placeholder="2023" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('vehicles.colCapacity')} htmlFor="v-cap">
            <Input id="v-cap" type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="40" />
          </Field>
          <Field label={t('forms.route')} htmlFor="v-route" hint={t('forms.routeHint')}>
            <Select id="v-route" value={routeId} onChange={(e) => setRouteId(e.target.value)}>
              <option value="">{t('forms.selectRoute')}</option>
              {(routesQ.data ?? []).map((r) => (
                <option key={r.id} value={r.id}>{r.origin} → {r.destination}</option>
              ))}
            </Select>
          </Field>
        </div>
      </form>
    </Modal>
  );
}
