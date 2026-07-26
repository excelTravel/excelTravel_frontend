import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PackagePlus } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/form';
import { useRegisterPackage, useStops } from '@/lib/api/hooks';

export function RegisterParcelModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const stopsQ = useStops();
  const stops = stopsQ.data ?? [];
  const register = useRegisterPackage();

  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [fromStopId, setFromStopId] = useState('');
  const [toStopId, setToStopId] = useState('');
  const [description, setDescription] = useState('');
  const [fee, setFee] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const canSubmit =
    senderName.trim() && senderPhone.trim() && recipientName.trim() && recipientPhone.trim() && fromStopId && toStopId && fromStopId !== toStopId && description.trim();

  function reset() {
    setSenderName('');
    setSenderPhone('');
    setRecipientName('');
    setRecipientPhone('');
    setFromStopId('');
    setToStopId('');
    setDescription('');
    setFee('');
    setErr(null);
  }

  function submit() {
    if (!canSubmit) return;
    setErr(null);
    register.mutate(
      {
        senderName: senderName.trim(),
        senderPhone: senderPhone.trim(),
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim(),
        fromStopId,
        toStopId,
        description: description.trim(),
        ...(fee.trim() ? { fee: Number(fee) } : {}),
      },
      {
        onSuccess: () => {
          reset();
          onClose();
        },
        onError: (e) => setErr(e instanceof Error ? e.message : t('parcels.registerFailed')),
      },
    );
  }

  return (
    <Modal
      open={open}
      onClose={() => { reset(); onClose(); }}
      title={t('parcels.registerParcel')}
      description={t('parcels.registerParcelSub')}
      footer={
        <>
          <Button variant="outline" onClick={() => { reset(); onClose(); }} disabled={register.isPending}>{t('forms.cancel')}</Button>
          <Button onClick={submit} disabled={!canSubmit || register.isPending}>
            <PackagePlus className="size-4" /> {register.isPending ? t('forms.saving') : t('parcels.registerParcel')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('parcels.senderName')} htmlFor="pr-sender-name" required>
            <Input id="pr-sender-name" value={senderName} onChange={(e) => setSenderName(e.target.value)} autoComplete="name" />
          </Field>
          <Field label={t('parcels.senderPhone')} htmlFor="pr-sender-phone" required>
            <Input id="pr-sender-phone" type="tel" value={senderPhone} onChange={(e) => setSenderPhone(e.target.value)} placeholder="+250 788 000 000" autoComplete="tel" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('parcels.recipientName')} htmlFor="pr-recipient-name" required>
            <Input id="pr-recipient-name" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} autoComplete="name" />
          </Field>
          <Field label={t('parcels.recipientPhone')} htmlFor="pr-recipient-phone" required>
            <Input id="pr-recipient-phone" type="tel" value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} placeholder="+250 788 000 000" autoComplete="tel" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('parcels.fromStop')} htmlFor="pr-from" required>
            <Select id="pr-from" value={fromStopId} onChange={(e) => setFromStopId(e.target.value)} disabled={stopsQ.isLoading}>
              <option value="" disabled>{t('bookings.desk.selectStop')}</option>
              {stops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </Field>
          <Field label={t('parcels.toStop')} htmlFor="pr-to" required error={fromStopId && toStopId && fromStopId === toStopId ? t('parcels.sameStopError') : undefined}>
            <Select id="pr-to" value={toStopId} onChange={(e) => setToStopId(e.target.value)} disabled={stopsQ.isLoading}>
              <option value="" disabled>{t('bookings.desk.selectStop')}</option>
              {stops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </Field>
        </div>
        <Field label={t('parcels.description')} htmlFor="pr-desc" required>
          <Textarea id="pr-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('parcels.descriptionPlaceholder')} />
        </Field>
        <Field label={t('parcels.baseFee')} htmlFor="pr-fee" hint={t('forms.rwf')}>
          <Input id="pr-fee" type="number" min={0} value={fee} onChange={(e) => setFee(e.target.value)} placeholder={t('parcels.feeSetLater')} />
        </Field>
        {err && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{err}</p>}
      </div>
    </Modal>
  );
}
