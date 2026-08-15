import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UserX, X } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/form';
import {
  useInviteUser,
  useInviteAgent,
  useInviteDriver,
  useUpdateUser,
  useDeactivateUser,
  useDeactivateAgent,
  useAssignAgentStation,
  useRemoveAgentStation,
  useStops,
  type ApiUser,
  type ApiAgent,
} from '@/lib/api/hooks';
import { cn } from '@/lib/utils';

const ROLES = ['company_admin', 'manager', 'agent', 'driver'] as const;
type Role = (typeof ROLES)[number];

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

// Invite any staff role by email. Each routes to the endpoint that builds the right rows: managers/admins →
// /users/invite; agents → /agents (agents row); drivers → /drivers (driver row + licence). All pre-create
// the account so the person can log in by email + OTP.
export function InviteUserModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const [role, setRole] = useState<Role>('manager');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const inviteUser = useInviteUser();
  const inviteAgent = useInviteAgent();
  const inviteDriver = useInviteDriver();
  const saving = inviteUser.isPending || inviteAgent.isPending || inviteDriver.isPending;

  function reset() {
    setName(''); setEmail(''); setPhone(''); setLicenseNumber(''); setLicenseExpiry(''); setRole('manager'); setErr(null);
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
    const base = { email: email.trim(), phone: phone.trim(), name: name.trim() };
    if (role === 'driver') {
      if (!licenseNumber.trim() || !licenseExpiry) { setErr(t('forms.checkFields', 'Add the licence number and expiry.')); return; }
      inviteDriver.mutate({ ...base, licenseNumber: licenseNumber.trim(), licenseExpiry: new Date(`${licenseExpiry}T00:00:00Z`).toISOString() }, { onSuccess: done, onError });
    } else if (role === 'agent') {
      inviteAgent.mutate(base, { onSuccess: done, onError });
    } else {
      inviteUser.mutate({ ...base, role }, { onSuccess: done, onError });
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
        {role === 'driver' && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t('drivers.licenseNumber')} htmlFor="iu-license" required>
              <Input id="iu-license" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} placeholder="RW-DL-000000" />
            </Field>
            <Field label={t('drivers.licenseExpires')} htmlFor="iu-expiry" required>
              <Input id="iu-expiry" type="date" value={licenseExpiry} onChange={(e) => setLicenseExpiry(e.target.value)} />
            </Field>
          </div>
        )}
      </div>
    </Modal>
  );
}

const EDIT_ROLES = ['company_admin', 'manager', 'agent'] as const;
const STATUSES = ['active', 'inactive', 'suspended'] as const;

// PATCH /users/{id} (role/status) + DELETE /users/{id} (soft deactivate — users are never hard-deleted).
// When the target is an agent, deactivation instead goes through DELETE /agents/{id} (also clears their
// station assignments), and a station-assignment section is shown.
export function EditUserModal({ user, agent, open, onClose }: { user: ApiUser | null; agent?: ApiAgent | null; open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const update = useUpdateUser();
  const deactivateUser = useDeactivateUser();
  const deactivateAgent = useDeactivateAgent();
  const assignStation = useAssignAgentStation();
  const removeStation = useRemoveAgentStation();
  const stopsQ = useStops();
  const [role, setRole] = useState<(typeof EDIT_ROLES)[number]>('manager');
  const [status, setStatus] = useState<(typeof STATUSES)[number]>('active');
  const [newStation, setNewStation] = useState('');
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setRole(EDIT_ROLES.includes(user.role as (typeof EDIT_ROLES)[number]) ? (user.role as (typeof EDIT_ROLES)[number]) : 'manager');
      setStatus(user.status as (typeof STATUSES)[number]);
      setNewStation('');
      setErr(null);
    }
  }, [user]);

  if (!user) return null;
  const deactivate = agent ? deactivateAgent : deactivateUser;
  const stations = stopsQ.data?.filter((s) => s.type === 'station') ?? [];
  const assignedStations = agent ? stations.filter((s) => agent.stationIds.includes(s.id)) : [];
  const availableStations = agent ? stations.filter((s) => !agent.stationIds.includes(s.id)) : [];

  function save() {
    setErr(null);
    update.mutate({ id: user!.id, role, status }, { onSuccess: onClose, onError: (e) => setErr(e instanceof Error ? e.message : t('forms.checkFields')) });
  }
  function doDeactivate() {
    setErr(null);
    const payload = agent ? { id: agent.id } : { id: user!.id };
    deactivate.mutate(payload, { onSuccess: onClose, onError: (e) => setErr(e instanceof Error ? e.message : t('forms.checkFields')) });
  }
  function addStation() {
    if (!agent || !newStation) return;
    setErr(null);
    assignStation.mutate({ id: agent.id, stationId: newStation }, { onSuccess: () => setNewStation(''), onError: (e) => setErr(e instanceof Error ? e.message : t('forms.checkFields')) });
  }
  function dropStation(stationId: string) {
    if (!agent) return;
    setErr(null);
    removeStation.mutate({ id: agent.id, stationId }, { onError: (e) => setErr(e instanceof Error ? e.message : t('forms.checkFields')) });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={user.name}
      description={user.email ?? user.phone}
      footer={
        <>
          {user.status !== 'inactive' && (
            <Button variant="destructive" onClick={doDeactivate} disabled={update.isPending || deactivate.isPending}>
              <UserX className="size-4" /> {deactivate.isPending ? t('forms.saving') : t('team.deactivate')}
            </Button>
          )}
          <Button variant="outline" onClick={onClose} disabled={update.isPending || deactivate.isPending}>{t('forms.cancel')}</Button>
          <Button onClick={save} disabled={update.isPending || deactivate.isPending}>{update.isPending ? t('forms.saving') : t('forms.save')}</Button>
        </>
      }
    >
      <div className="space-y-4">
        {err && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{err}</p>}
        <Field label={t('team.role')} htmlFor="eu-role">
          <Select id="eu-role" value={role} onChange={(e) => setRole(e.target.value as typeof role)}>
            {EDIT_ROLES.map((r) => <option key={r} value={r}>{t(`team.roles.${r}`)}</option>)}
          </Select>
        </Field>
        <Field label={t('team.colStatus')} htmlFor="eu-status">
          <Select id="eu-status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            {STATUSES.map((s) => <option key={s} value={s}>{t(`team.status.${s}`)}</option>)}
          </Select>
        </Field>

        {agent && (
          <Field label={t('team.stations')} htmlFor="eu-station">
            <div className="space-y-2">
              {assignedStations.length === 0 ? (
                <p className="text-xs text-muted-foreground">{t('team.noStations')}</p>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {assignedStations.map((s) => (
                    <li key={s.id} className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium">
                      {s.name}
                      <button type="button" onClick={() => dropStation(s.id)} aria-label={t('team.removeStation')} disabled={removeStation.isPending} className="text-muted-foreground hover:text-destructive">
                        <X className="size-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex gap-2">
                <Select id="eu-station" value={newStation} onChange={(e) => setNewStation(e.target.value)}>
                  <option value="">{t('network.selectStation')}</option>
                  {availableStations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </Select>
                <Button type="button" variant="outline" onClick={addStation} disabled={!newStation || assignStation.isPending}>{t('team.assignStation')}</Button>
              </div>
            </div>
          </Field>
        )}
      </div>
    </Modal>
  );
}
