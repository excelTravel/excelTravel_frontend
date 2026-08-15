import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/form';
import { ImageUpload } from '@/components/ui/image-upload';
import { useVehicles, useCreateMaintenance } from '@/lib/api/hooks';
import { CLOUDINARY_FOLDERS } from '@/lib/config';

// POST /maintenance (CreateMaintenance): logs a service/repair event against a vehicle.
export function LogMaintenanceModal({ open, onClose, vehicleId }: { open: boolean; onClose: () => void; vehicleId?: string | null }) {
  const { t } = useTranslation();
  const vehiclesQ = useVehicles();
  const create = useCreateMaintenance();

  const [vehicle, setVehicle] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [performedAt, setPerformedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');
  const [odometerKm, setOdometerKm] = useState('');
  const [nextServiceDate, setNextServiceDate] = useState('');
  const [nextServiceKm, setNextServiceKm] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const effectiveVehicle = vehicleId ?? vehicle;
  const canSubmit = effectiveVehicle && serviceType.trim() && performedAt;

  function reset() {
    setVehicle('');
    setServiceType('');
    setPerformedAt(new Date().toISOString().slice(0, 10));
    setDescription('');
    setCost('');
    setOdometerKm('');
    setNextServiceDate('');
    setNextServiceKm('');
    setPhotoUrl(null);
    setErr(null);
  }

  function submit() {
    if (!canSubmit) return;
    setErr(null);
    create.mutate(
      {
        vehicleId: effectiveVehicle,
        serviceType: serviceType.trim(),
        performedAt: new Date(`${performedAt}T00:00:00Z`).toISOString(),
        ...(description.trim() ? { description: description.trim() } : {}),
        ...(cost.trim() ? { cost: Number(cost) } : {}),
        ...(odometerKm.trim() ? { odometerKm: Number(odometerKm) } : {}),
        ...(nextServiceDate ? { nextServiceDate: new Date(`${nextServiceDate}T00:00:00Z`).toISOString() } : {}),
        ...(nextServiceKm.trim() ? { nextServiceKm: Number(nextServiceKm) } : {}),
        ...(photoUrl ? { photoUrl } : {}),
      },
      { onSuccess: () => { reset(); onClose(); }, onError: (e) => setErr(e instanceof Error ? e.message : t('forms.checkFields')) },
    );
  }

  return (
    <Modal
      open={open}
      onClose={() => { reset(); onClose(); }}
      title={t('maintenance.logMaintenance')}
      description={t('maintenance.logMaintenanceSub')}
      footer={
        <>
          <Button variant="outline" onClick={() => { reset(); onClose(); }} disabled={create.isPending}>{t('forms.cancel')}</Button>
          <Button onClick={submit} disabled={!canSubmit || create.isPending}>{create.isPending ? t('forms.saving') : t('maintenance.logMaintenance')}</Button>
        </>
      }
    >
      <div className="space-y-4">
        {err && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{err}</p>}
        {!vehicleId && (
          <Field label={t('forms.vehicle')} htmlFor="lm-vehicle" required>
            <Select id="lm-vehicle" value={vehicle} onChange={(e) => setVehicle(e.target.value)} disabled={vehiclesQ.isLoading}>
              <option value="" disabled>{t('forms.selectVehicle')}</option>
              {(vehiclesQ.data ?? []).map((v) => <option key={v.id} value={v.id}>{v.plateNumber}</option>)}
            </Select>
          </Field>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t('maintenance.serviceType')} htmlFor="lm-type" required>
            <Input id="lm-type" value={serviceType} onChange={(e) => setServiceType(e.target.value)} placeholder={t('maintenance.serviceTypePlaceholder')} />
          </Field>
          <Field label={t('maintenance.performedAt')} htmlFor="lm-date" required>
            <Input id="lm-date" type="date" value={performedAt} onChange={(e) => setPerformedAt(e.target.value)} />
          </Field>
        </div>
        <Field label={t('forms.description')} htmlFor="lm-desc">
          <Textarea id="lm-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t('maintenance.cost')} htmlFor="lm-cost" hint={t('forms.rwf')}>
            <Input id="lm-cost" type="number" min={0} value={cost} onChange={(e) => setCost(e.target.value)} />
          </Field>
          <Field label={t('vehicles.odometer')} htmlFor="lm-odo">
            <Input id="lm-odo" type="number" min={0} value={odometerKm} onChange={(e) => setOdometerKm(e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t('maintenance.nextServiceDate')} htmlFor="lm-next-date">
            <Input id="lm-next-date" type="date" value={nextServiceDate} onChange={(e) => setNextServiceDate(e.target.value)} />
          </Field>
          <Field label={t('maintenance.nextServiceKm')} htmlFor="lm-next-km">
            <Input id="lm-next-km" type="number" min={0} value={nextServiceKm} onChange={(e) => setNextServiceKm(e.target.value)} />
          </Field>
        </div>
        <ImageUpload value={photoUrl} onChange={setPhotoUrl} shape="square" folder={CLOUDINARY_FOLDERS.maintenance} hint={t('maintenance.photoHint')} />
      </div>
    </Modal>
  );
}
