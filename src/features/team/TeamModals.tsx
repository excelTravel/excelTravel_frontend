import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/form';
import { STATIONS } from '@/features/network/network';
import type { Agent } from './team';

function useSaver(onClose: () => void) {
  const [saving, setSaving] = useState(false);
  return { saving, go() { setSaving(true); setTimeout(() => { setSaving(false); onClose(); }, 500); } };
}

// POST /users/invite (InviteUser: email, phone, name, role). Stubbed.
export function InviteUserModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const { saving, go } = useSaver(onClose);
  return (
    <Modal open={open} onClose={onClose} title={t('team.inviteUser')} description={t('team.inviteUserSub')}
      footer={<><Button variant="outline" onClick={onClose} disabled={saving}>{t('forms.cancel')}</Button><Button onClick={go} disabled={saving}>{saving ? t('forms.saving') : t('team.sendInvite')}</Button></>}>
      <div className="space-y-4">
        <Field label={t('team.fullName')} htmlFor="iu-name" required><Input id="iu-name" placeholder="Jane Uwase" /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('team.email')} htmlFor="iu-email" required><Input id="iu-email" type="email" placeholder="jane@exceltravel.rw" /></Field>
          <Field label={t('team.phone')} htmlFor="iu-phone" required><Input id="iu-phone" type="tel" placeholder="+250 788 000 000" /></Field>
        </div>
        <Field label={t('team.role')} htmlFor="iu-role" hint={t('team.roleHint')}>
          <Select id="iu-role" defaultValue="manager">
            <option value="company_admin">{t('team.roles.company_admin')}</option>
            <option value="manager">{t('team.roles.manager')}</option>
            <option value="agent">{t('team.roles.agent')}</option>
          </Select>
        </Field>
      </div>
    </Modal>
  );
}

// POST /agents (InviteAgent: email, phone, name). Stubbed.
export function InviteAgentModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const { saving, go } = useSaver(onClose);
  return (
    <Modal open={open} onClose={onClose} title={t('team.inviteAgent')} description={t('team.inviteAgentSub')}
      footer={<><Button variant="outline" onClick={onClose} disabled={saving}>{t('forms.cancel')}</Button><Button onClick={go} disabled={saving}>{saving ? t('forms.saving') : t('team.sendInvite')}</Button></>}>
      <div className="space-y-4">
        <Field label={t('team.fullName')} htmlFor="ia-name" required><Input id="ia-name" placeholder="Jean Habimana" /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('team.email')} htmlFor="ia-email" required><Input id="ia-email" type="email" /></Field>
          <Field label={t('team.phone')} htmlFor="ia-phone" required><Input id="ia-phone" type="tel" /></Field>
        </div>
      </div>
    </Modal>
  );
}

// POST /agents/{id}/stations (AssignStation: stationId). Stubbed.
export function AssignStationModal({ agent, onClose, onAssign }: { agent: Agent | null; onClose: () => void; onAssign: (id: string, station: string) => void }) {
  const { t } = useTranslation();
  const [station, setStation] = useState('');
  if (!agent) return null;
  const available = STATIONS.filter((s) => !agent.stations.includes(s.name));
  return (
    <Modal open={agent !== null} onClose={onClose} title={t('team.assignStation')} description={t('team.assignStationSub', { name: agent.name })}
      footer={<><Button variant="outline" onClick={onClose}>{t('forms.cancel')}</Button><Button disabled={!station} onClick={() => onAssign(agent.id, station)}>{t('team.assign')}</Button></>}>
      <Field label={t('network.station')} htmlFor="as-station" required>
        <Select id="as-station" value={station} onChange={(e) => setStation(e.target.value)}>
          <option value="" disabled>{t('network.selectStation')}</option>
          {available.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
        </Select>
      </Field>
    </Modal>
  );
}
