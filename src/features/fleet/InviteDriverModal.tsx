import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/form';
import { useInviteDriver } from '@/lib/api/hooks';

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

// Invite a driver by email → POST /drivers (pre-creates the driver row + email invitation). The
// driver claims the row on first sign-in with that email.
export function InviteDriverModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const invite = useInviteDriver();

  function done() {
    setName(''); setEmail(''); setPhone(''); setLicenseNumber(''); setLicenseExpiry(''); setErr(null);
    onClose();
  }
  function go() {
    setErr(null);
    if (!name.trim() || !emailOk(email) || !phone.trim() || !licenseNumber.trim() || !licenseExpiry) {
      setErr(t('forms.checkFields', 'Please complete every field with a valid email.'));
      return;
    }
    invite.mutate(
      {
        email: email.trim(),
        phone: phone.trim(),
        name: name.trim(),
        licenseNumber: licenseNumber.trim(),
        licenseExpiry: new Date(`${licenseExpiry}T00:00:00Z`).toISOString(),
      },
      { onSuccess: done, onError: (e) => setErr(e instanceof Error ? e.message : t('forms.checkFields', 'Something went wrong.')) },
    );
  }

  return (
    <Modal open={open} onClose={onClose} title={t('drivers.inviteDriver')} description={t('drivers.inviteDriverSub')}
      footer={<><Button variant="outline" onClick={onClose} disabled={invite.isPending}>{t('forms.cancel')}</Button><Button onClick={go} disabled={invite.isPending}>{invite.isPending ? t('forms.saving') : t('drivers.sendInvite')}</Button></>}>
      <div className="space-y-4">
        {err && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{err}</p>}
        <Field label={t('team.fullName')} htmlFor="id-name" required>
          <Input id="id-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Eric Habimana" autoComplete="name" />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t('team.email')} htmlFor="id-email" required>
            <Input id="id-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="eric@exceltravel.rw" autoComplete="email" />
          </Field>
          <Field label={t('team.phone')} htmlFor="id-phone" required>
            <Input id="id-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+250 788 000 000" autoComplete="tel" />
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t('drivers.licenseNumber')} htmlFor="id-license" required>
            <Input id="id-license" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} placeholder="RW-DL-000000" />
          </Field>
          <Field label={t('drivers.licenseExpires')} htmlFor="id-expiry" required>
            <Input id="id-expiry" type="date" value={licenseExpiry} onChange={(e) => setLicenseExpiry(e.target.value)} />
          </Field>
        </div>
      </div>
    </Modal>
  );
}
