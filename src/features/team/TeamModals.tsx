import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/form';
import { cn } from '@/lib/utils';

const ROLES = ['company_admin', 'manager', 'agent'] as const;

// POST /users/invite (InviteUser: email, phone, name, role). One general invite for any staff role.
// Role is picked with a segmented selector (not a dropdown). Stubbed.
export function InviteUserModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [role, setRole] = useState<(typeof ROLES)[number]>('manager');
  function go() {
    setSaving(true);
    setTimeout(() => { setSaving(false); onClose(); }, 500);
  }
  return (
    <Modal open={open} onClose={onClose} title={t('team.inviteUser')} description={t('team.inviteUserSub')}
      footer={<><Button variant="outline" onClick={onClose} disabled={saving}>{t('forms.cancel')}</Button><Button onClick={go} disabled={saving}>{saving ? t('forms.saving') : t('team.sendInvite')}</Button></>}>
      <div className="space-y-4">
        <Field label={t('team.fullName')} htmlFor="iu-name" required><Input id="iu-name" placeholder="Jane Uwase" /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('team.email')} htmlFor="iu-email" required><Input id="iu-email" type="email" placeholder="jane@exceltravel.rw" /></Field>
          <Field label={t('team.phone')} htmlFor="iu-phone" required><Input id="iu-phone" type="tel" placeholder="+250 788 000 000" /></Field>
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
