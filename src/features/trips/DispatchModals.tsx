import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Megaphone } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Field, Select, Textarea } from '@/components/ui/form';

const VEHICLES = [
  { id: 'RAE-27', label: 'RAE-27 · Coaster (idle)' },
  { id: 'RAD-88', label: 'RAD-88 · Yutong Bus' },
  { id: 'RAF-51', label: 'RAF-51 · Executive Coach' },
];

// Reroute / vehicle swap → PATCH /trips/{id} { vehicleId } (UpdateTrip). Stubbed until the client is wired.
export function RerouteModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const [vehicle, setVehicle] = useState('');
  const [saving, setSaving] = useState(false);

  function submit() {
    if (!vehicle) return;
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setVehicle('');
      onClose();
    }, 500);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('trip.reroute')}
      description={t('forms.rerouteSub')}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>{t('forms.cancel')}</Button>
          <Button onClick={submit} disabled={saving || !vehicle}>{saving ? t('forms.saving') : t('forms.confirmSwap')}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label={t('forms.newVehicle')} htmlFor="rr-vehicle" required>
          <Select id="rr-vehicle" value={vehicle} onChange={(e) => setVehicle(e.target.value)}>
            <option value="" disabled>{t('forms.selectVehicle')}</option>
            {VEHICLES.map((v) => (
              <option key={v.id} value={v.id}>{v.label}</option>
            ))}
          </Select>
        </Field>
        <Field label={t('forms.reason')} htmlFor="rr-reason" hint={t('forms.reasonHint')}>
          <Textarea id="rr-reason" placeholder={t('forms.reasonPlaceholder')} className="min-h-20" />
        </Field>
      </div>
    </Modal>
  );
}

// Emergency broadcast → POST /notifications to the trip's passengers/driver. Destructive-styled confirm.
export function EmergencyBroadcastModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  function send() {
    if (!message.trim()) return;
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setMessage('');
      onClose();
    }, 500);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('trip.emergencyBroadcast')}
      description={t('forms.emergencySub')}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>{t('forms.cancel')}</Button>
          <Button variant="destructive" onClick={send} disabled={saving || !message.trim()}>
            <Megaphone className="size-4" /> {saving ? t('forms.saving') : t('forms.broadcast')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p>{t('forms.broadcastNote')}</p>
        </div>
        <Field label={t('forms.message')} htmlFor="eb-message" required>
          <Textarea id="eb-message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t('forms.emergencyPlaceholder')} maxLength={320} />
        </Field>
        <p className="text-right text-xs text-muted-foreground tabular-nums">{message.length}/320</p>
      </div>
    </Modal>
  );
}
