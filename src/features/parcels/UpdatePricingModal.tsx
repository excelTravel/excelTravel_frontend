import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/form';
import { useUpdateCompany, type ApiCompany } from '@/lib/api/hooks';

// Global parcel pricing (base fee + per-kg surcharge) lives on the company row (PATCH /companies/{id}).
export function UpdatePricingModal({ open, onClose, company }: { open: boolean; onClose: () => void; company: ApiCompany | null }) {
  const { t } = useTranslation();
  const updateCompany = useUpdateCompany();
  const [base, setBase] = useState('');
  const [perKg, setPerKg] = useState('');
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (open && company) {
      setBase(company.parcelBaseFeeRwf !== null ? String(company.parcelBaseFeeRwf) : '');
      setPerKg(company.parcelSurchargePerKgRwf !== null ? String(company.parcelSurchargePerKgRwf) : '');
      setErr(null);
    }
  }, [open, company]);

  function save() {
    if (!company) return;
    setErr(null);
    updateCompany.mutate(
      {
        id: company.id,
        ...(base.trim() ? { parcelBaseFeeRwf: Number(base) } : {}),
        ...(perKg.trim() ? { parcelSurchargePerKgRwf: Number(perKg) } : {}),
      },
      {
        onSuccess: () => onClose(),
        onError: (e) => setErr(e instanceof Error ? e.message : t('forms.checkFields')),
      },
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('parcels.updatePricing')}
      description={t('forms.pricingSub')}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={updateCompany.isPending}>{t('forms.cancel')}</Button>
          <Button onClick={save} disabled={updateCompany.isPending || !company}>{updateCompany.isPending ? t('forms.saving') : t('forms.save')}</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t('parcels.baseFee')} htmlFor="p-base" hint={t('forms.rwf')}>
          <Input id="p-base" type="number" min={0} value={base} onChange={(e) => setBase(e.target.value)} />
        </Field>
        <Field label={t('parcels.wtSurcharge')} htmlFor="p-kg" hint={t('forms.perKg')}>
          <Input id="p-kg" type="number" min={0} value={perKg} onChange={(e) => setPerKg(e.target.value)} />
        </Field>
      </div>
      {err && <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{err}</p>}
    </Modal>
  );
}
