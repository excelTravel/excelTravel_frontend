import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/form';
import { useInviteUser, useInviteAgent } from '@/lib/api/hooks';
import { cn } from '@/lib/utils';

const ROLES = ['company_admin', 'manager', 'agent', 'driver'] as const;
type Role = (typeof ROLES)[number];

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

// Invite any staff role by email. Managers/admins → POST /users/invite; agents → POST /agents (so the
// agents extension row exists). Both pre-create the row and fire a Clerk email invitation.
export function InviteUserModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const [role, setRole] = useState<Role>('manager');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const inviteUser = useInviteUser();
  const inviteAgent = useInviteAgent();
  const saving = inviteUser.isPending || inviteAgent.isPending;

  function reset() {
    setName(''); setEmail(''); setPhone(''); setRole('manager'); setErr(null);
  }
  function done() {
    reset();
    onClose();
  }
  function go() {
    setErr(null);
    if (!name.trim() || !emailOk(email) || !phone.trim()) {
      setErr(t('forms.checkFields', 'Please complete every field with a valid email.'));
      return;
    }
    const onError = (e: unknown) => setErr(e instanceof Error ? e.message : t('forms.checkFields', 'Something went wrong.'));
    if (role === 'agent') {
      inviteAgent.mutate({ email: email.trim(), phone: phone.trim(), name: name.trim() }, { onSuccess: done, onError });
    } else {
      inviteUser.mutate({ email: email.trim(), phone: phone.trim(), name: name.trim(), role }, { onSuccess: done, onError });
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={t('team.inviteUser')} description={t('team.inviteUserSub')}
      footer={<><Button variant="outline" onClick={onClose} disabled={saving}>{t('forms.cancel')}</Button><Button onClick={go} disabled={saving}>{saving ? t('forms.saving') : t('team.sendInvite')}</Button></>}>
      <div className="space-y-4">
        {err && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{err}</p>}
        <Field label={t('team.fullName')} htmlFor="iu-name" required>
          <Input id="iu-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Uwase" autoComplete="name" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('team.email')} htmlFor="iu-email" required>
            <Input id="iu-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@exceltravel.rw" autoComplete="email" />
          </Field>
          <Field label={t('team.phone')} htmlFor="iu-phone" required>
            <Input id="iu-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+250 788 000 000" autoComplete="tel" />
          </Field>
        </div>
        <Field label={t('team.role')} hint={t('team.roleHint')}>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={t('team.role')}>
            {ROLES.map((r) => (
              <button
                key={r}
                type="button"
                role="radio"
                aria-checked={role === r}
                onClick={() => setRole(r)}
                className={cn(
                  'rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                  role === r ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:bg-secondary',
                )}
              >
                {t(`team.roles.${r}`)}
              </button>
            ))}
          </div>
        </Field>
      </div>
    </Modal>
  );
}
