import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/form';
import { STATIONS } from './network';

function useSaver(onClose: () => void) {
  const [saving, setSaving] = useState(false);
  return {
    saving,
    go() {
      setSaving(true);
      setTimeout(() => {
        setSaving(false);
        onClose();
      }, 500);
    },
  };
}

// POST /routes (CreateRoute). Stubbed.
export function AddRouteModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const { saving, go } = useSaver(onClose);
  return (
    <Modal open={open} onClose={onClose} title={t('network.addRoute')} description={t('network.addRouteSub')}
      footer={<><Button variant="outline" onClick={onClose} disabled={saving}>{t('forms.cancel')}</Button><Button onClick={go} disabled={saving}>{saving ? t('forms.saving') : t('network.createRoute')}</Button></>}>
      <div className="space-y-4">
        <Field label={t('network.routeName')} htmlFor="nr-name" required><Input id="nr-name" placeholder="Kigali — Musanze" /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('network.origin')} htmlFor="nr-o"><Input id="nr-o" placeholder="Nyabugogo" /></Field>
          <Field label={t('network.destination')} htmlFor="nr-d"><Input id="nr-d" placeholder="Musanze" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('network.distance')} htmlFor="nr-km"><Input id="nr-km" type="number" placeholder="116" /></Field>
          <Field label={t('network.duration')} htmlFor="nr-min"><Input id="nr-min" type="number" placeholder="150" /></Field>
        </div>
        <Field label={t('network.times')} htmlFor="nr-t" hint={t('network.timesHint')}><Input id="nr-t" placeholder="06:00, 09:00, 12:00" /></Field>
      </div>
    </Modal>
  );
}

// POST /stops (CreateStop). Stubbed.
export function AddStopModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const { saving, go } = useSaver(onClose);
  const [type, setType] = useState<'station' | 'stop'>('station');
  return (
    <Modal open={open} onClose={onClose} title={t('network.addStop')} description={t('network.addStopSub')}
      footer={<><Button variant="outline" onClick={onClose} disabled={saving}>{t('forms.cancel')}</Button><Button onClick={go} disabled={saving}>{saving ? t('forms.saving') : t('network.createStop')}</Button></>}>
      <div className="space-y-4">
        <Field label={t('network.stopName')} htmlFor="ns-name" required><Input id="ns-name" placeholder="Shyorongi" /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('network.type')} htmlFor="ns-type">
            <Select id="ns-type" value={type} onChange={(e) => setType(e.target.value as 'station' | 'stop')}>
              <option value="station">{t('network.station')}</option>
              <option value="stop">{t('network.stop')}</option>
            </Select>
          </Field>
          <Field label={t('network.parentStation')} htmlFor="ns-parent" hint={type === 'stop' ? t('network.parentRequired') : undefined}>
            <Select id="ns-parent" defaultValue="" disabled={type === 'station'}>
              <option value="" disabled>{t('network.selectStation')}</option>
              {STATIONS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('network.latitude')} htmlFor="ns-lat"><Input id="ns-lat" type="number" step="any" placeholder="-1.9536" /></Field>
          <Field label={t('network.longitude')} htmlFor="ns-lng"><Input id="ns-lng" type="number" step="any" placeholder="30.0606" /></Field>
        </div>
        <Field label={t('network.phone')} htmlFor="ns-phone"><Input id="ns-phone" type="tel" placeholder="+250 788 000 000" /></Field>
      </div>
    </Modal>
  );
}

// POST /fares (UpsertFare) — station-to-station, same both ways. Stubbed.
export function AddFareModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const { saving, go } = useSaver(onClose);
  return (
    <Modal open={open} onClose={onClose} title={t('network.addFare')} description={t('network.addFareSub')}
      footer={<><Button variant="outline" onClick={onClose} disabled={saving}>{t('forms.cancel')}</Button><Button onClick={go} disabled={saving}>{saving ? t('forms.saving') : t('network.saveFare')}</Button></>}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('network.originStation')} htmlFor="nf-o">
            <Select id="nf-o" defaultValue="">
              <option value="" disabled>{t('network.selectStation')}</option>
              {STATIONS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </Field>
          <Field label={t('network.destStation')} htmlFor="nf-d">
            <Select id="nf-d" defaultValue="">
              <option value="" disabled>{t('network.selectStation')}</option>
              {STATIONS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </Field>
        </div>
        <Field label={t('network.fareAmount')} htmlFor="nf-amt" hint={t('network.fareHint')}>
          <Input id="nf-amt" type="number" min={0} placeholder="3500" />
        </Field>
      </div>
    </Modal>
  );
}
