import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/form';
import { PhotoGallery } from '@/components/ui/photo-gallery';
import { useVehicles, useCreateInsurance } from '@/lib/api/hooks';
import { CLOUDINARY_FOLDERS } from '@/lib/config';

// POST /insurance (CreateInsurance): logs an insurance renewal against a vehicle.
export function LogInsuranceModal({ open, onClose, vehicleId }: { open: boolean; onClose: () => void; vehicleId?: string | null }) {
  const { t } = useTranslation();
  const vehiclesQ = useVehicles();
  const create = useCreateInsurance();

  const [vehicle, setVehicle] = useState('');
  const [provider, setProvider] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [renewedAt, setRenewedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [expiryDate, setExpiryDate] = useState('');
  const [cost, setCost] = useState('');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const effectiveVehicle = vehicleId ?? vehicle;
  const canSubmit = effectiveVehicle && renewedAt && expiryDate;

  function reset() {
    setVehicle('');
    setProvider('');
    setPolicyNumber('');
    setRenewedAt(new Date().toISOString().slice(0, 10));
    setExpiryDate('');
    setCost('');
    setPhotoUrls([]);
    setErr(null);
  }

  function submit() {
    if (!canSubmit) return;
    setErr(null);
    create.mutate(
      {
        vehicleId: effectiveVehicle,
        renewedAt: new Date(`${renewedAt}T00:00:00Z`).toISOString(),
        expiryDate: new Date(`${expiryDate}T00:00:00Z`).toISOString(),
        ...(provider.trim() ? { provider: provider.trim() } : {}),
        ...(policyNumber.trim() ? { policyNumber: policyNumber.trim() } : {}),
        ...(cost.trim() ? { cost: Number(cost) } : {}),
        ...(photoUrls.length ? { photoUrls } : {}),
      },
      { onSuccess: () => { reset(); onClose(); }, onError: (e) => setErr(e instanceof Error ? e.message : t('forms.checkFields')) },
    );
  }

  return (
    <Modal
      open={open}
      onClose={() => { reset(); onClose(); }}
      title={t('insurance.logInsurance')}
      description={t('insurance.logInsuranceSub')}
      footer={
        <>
          <Button variant="outline" onClick={() => { reset(); onClose(); }} disabled={create.isPending}>{t('forms.cancel')}</Button>
          <Button onClick={submit} disabled={!canSubmit || create.isPending}>{create.isPending ? t('forms.saving') : t('insurance.logInsurance')}</Button>
        </>
      }
    >
      <div className="space-y-4">
        {err && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{err}</p>}
        {!vehicleId && (
          <Field label={t('forms.vehicle')} htmlFor="li-vehicle" required>
            <Select id="li-vehicle" value={vehicle} onChange={(e) => setVehicle(e.target.value)} disabled={vehiclesQ.isLoading}>
              <option value="" disabled>{t('forms.selectVehicle')}</option>
              {(vehiclesQ.data ?? []).map((v) => <option key={v.id} value={v.id}>{v.plateNumber}</option>)}
            </Select>
          </Field>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t('insurance.provider')} htmlFor="li-provider">
            <Input id="li-provider" value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="Sanlam, Radiant…" />
          </Field>
          <Field label={t('insurance.policyNumber')} htmlFor="li-policy">
            <Input id="li-policy" value={policyNumber} onChange={(e) => setPolicyNumber(e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t('insurance.renewedAt')} htmlFor="li-renewed" required>
            <Input id="li-renewed" type="date" value={renewedAt} onChange={(e) => setRenewedAt(e.target.value)} />
          </Field>
          <Field label={t('insurance.expiryDate')} htmlFor="li-expiry" required>
            <Input id="li-expiry" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
          </Field>
        </div>
        <Field label={t('insurance.cost')} htmlFor="li-cost" hint={t('forms.rwf')}>
          <Input id="li-cost" type="number" min={0} value={cost} onChange={(e) => setCost(e.target.value)} />
        </Field>
        <PhotoGallery value={photoUrls} onChange={setPhotoUrls} folder={CLOUDINARY_FOLDERS.insurance} hint={t('insurance.photoHint')} />
      </div>
    </Modal>
  );
}
