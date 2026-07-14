import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/form';

// Per-package fees today go through PATCH /packages/{id}/fee. A GLOBAL parcel pricing config (base fee +
// weight surcharge) has no backend endpoint yet — flagged in docs/integration-map.md. Stubbed for now.
export function UpdatePricingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);

  function save() {
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
      title={t('parcels.updatePricing')}
      description={t('forms.pricingSub')}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>{t('forms.cancel')}</Button>
          <Button onClick={save} disabled={saving}>{saving ? t('forms.saving') : t('forms.save')}</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t('parcels.baseFee')} htmlFor="p-base" hint={t('forms.rwf')}>
          <Input id="p-base" type="number" min={0} defaultValue={1200} />
        </Field>
        <Field label={t('parcels.wtSurcharge')} htmlFor="p-kg" hint={t('forms.perKg')}>
          <Input id="p-kg" type="number" min={0} defaultValue={500} />
        </Field>
      </div>
    </Modal>
  );
}
