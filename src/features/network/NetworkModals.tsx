import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/form';
import { useStops, useUpsertFare, useCreateRoute, useCreateStop } from '@/lib/api/hooks';

// POST /routes (CreateRoute).
export function AddRouteModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const create = useCreateRoute();
  const [name, setName] = useState('');
  const [origin, setOrigin] = useState('');
  const [dest, setDest] = useState('');
  const [km, setKm] = useState('');
  const [min, setMin] = useState('');
  const [times, setTimes] = useState('');
  const [err, setErr] = useState<string | null>(null);

  function done() { setName(''); setOrigin(''); setDest(''); setKm(''); setMin(''); setTimes(''); setErr(null); onClose(); }
  function go() {
    setErr(null);
    if (!name.trim() || !origin.trim() || !dest.trim()) { setErr(t('forms.checkFields')); return; }
    const departureTimes = times.split(',').map((s) => s.trim()).filter(Boolean);
    create.mutate(
      {
        name: name.trim(), origin: origin.trim(), destination: dest.trim(),
        ...(km ? { distanceKm: Number(km) } : {}),
        ...(min ? { estimatedDurationMin: Number(min) } : {}),
        ...(departureTimes.length ? { departureTimes } : {}),
      },
      { onSuccess: done, onError: (e) => setErr(e instanceof Error ? e.message : t('forms.checkFields')) },
    );
  }
  return (
    <Modal open={open} onClose={onClose} title={t('network.addRoute')} description={t('network.addRouteSub')}
      footer={<><Button variant="outline" onClick={onClose} disabled={create.isPending}>{t('forms.cancel')}</Button><Button onClick={go} disabled={create.isPending}>{create.isPending ? t('forms.saving') : t('network.createRoute')}</Button></>}>
      <div className="space-y-4">
        {err && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{err}</p>}
        <Field label={t('network.routeName')} htmlFor="nr-name" required><Input id="nr-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Kigali — Musanze" /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('network.origin')} htmlFor="nr-o"><Input id="nr-o" value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="Nyabugogo" /></Field>
          <Field label={t('network.destination')} htmlFor="nr-d"><Input id="nr-d" value={dest} onChange={(e) => setDest(e.target.value)} placeholder="Musanze" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('network.distance')} htmlFor="nr-km"><Input id="nr-km" type="number" value={km} onChange={(e) => setKm(e.target.value)} placeholder="116" /></Field>
          <Field label={t('network.duration')} htmlFor="nr-min"><Input id="nr-min" type="number" value={min} onChange={(e) => setMin(e.target.value)} placeholder="150" /></Field>
        </div>
        <Field label={t('network.times')} htmlFor="nr-t" hint={t('network.timesHint')}><Input id="nr-t" value={times} onChange={(e) => setTimes(e.target.value)} placeholder="06:00, 09:00, 12:00" /></Field>
      </div>
    </Modal>
  );
}

// POST /stops (CreateStop). `pin` prefills coordinates when the stop was dropped on the map.
export function AddStopModal({ open, onClose, pin }: { open: boolean; onClose: () => void; pin?: { lat: number; lng: number } | null }) {
  const { t } = useTranslation();
  const stopsQ = useStops();
  const create = useCreateStop();
  const [name, setName] = useState('');
  const [type, setType] = useState<'station' | 'stop'>('station');
  const [parent, setParent] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [phone, setPhone] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const stations = (stopsQ.data ?? []).filter((s) => s.type === 'station');
  // A fresh map pin fills the coordinate fields.
  useEffect(() => {
    if (pin) { setLat(pin.lat.toFixed(5)); setLng(pin.lng.toFixed(5)); }
  }, [pin]);

  function done() { setName(''); setType('station'); setParent(''); setLat(''); setLng(''); setPhone(''); setErr(null); onClose(); }
  function go() {
    setErr(null);
    const latN = Number(lat), lngN = Number(lng);
    if (!name.trim() || !Number.isFinite(latN) || !Number.isFinite(lngN) || (type === 'stop' && !parent)) { setErr(t('forms.checkFields')); return; }
    create.mutate(
      {
        name: name.trim(), type, latitude: latN, longitude: lngN,
        ...(type === 'stop' ? { parentStationId: parent } : {}),
        ...(phone.trim() ? { phone: phone.trim() } : {}),
      },
      { onSuccess: done, onError: (e) => setErr(e instanceof Error ? e.message : t('forms.checkFields')) },
    );
  }
  return (
    <Modal open={open} onClose={onClose} title={t('network.addStop')} description={t('network.addStopSub')}
      footer={<><Button variant="outline" onClick={onClose} disabled={create.isPending}>{t('forms.cancel')}</Button><Button onClick={go} disabled={create.isPending}>{create.isPending ? t('forms.saving') : t('network.createStop')}</Button></>}>
      <div className="space-y-4">
        {err && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{err}</p>}
        <Field label={t('network.stopName')} htmlFor="ns-name" required><Input id="ns-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Shyorongi" /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('network.type')} htmlFor="ns-type">
            <Select id="ns-type" value={type} onChange={(e) => setType(e.target.value as 'station' | 'stop')}>
              <option value="station">{t('network.station')}</option>
              <option value="stop">{t('network.stop')}</option>
            </Select>
          </Field>
          <Field label={t('network.parentStation')} htmlFor="ns-parent" hint={type === 'stop' ? t('network.parentRequired') : undefined}>
            <Select id="ns-parent" value={parent} onChange={(e) => setParent(e.target.value)} disabled={type === 'station'}>
              <option value="" disabled>{t('network.selectStation')}</option>
              {stations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('network.latitude')} htmlFor="ns-lat" hint={pin ? t('network.fromMap') : undefined}><Input id="ns-lat" type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="-1.9536" /></Field>
          <Field label={t('network.longitude')} htmlFor="ns-lng"><Input id="ns-lng" type="number" step="any" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="30.0606" /></Field>
        </div>
        {pin && (
          <p className="flex items-center gap-1.5 text-xs text-teal"><MapPin className="size-3.5" /> {t('network.pinnedHint')}</p>
        )}
        <Field label={t('network.phone')} htmlFor="ns-phone"><Input id="ns-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+250 788 000 000" /></Field>
      </div>
    </Modal>
  );
}

// POST /fares (UpsertFare) — station-to-station, same both ways. Stubbed.
// POST /fares (upsert_fare — canonical ordering + same-both-ways handled server-side). Live stations.
export function AddFareModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const stopsQ = useStops();
  const upsert = useUpsertFare();
  const [origin, setOrigin] = useState('');
  const [dest, setDest] = useState('');
  const [amount, setAmount] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const stations = (stopsQ.data ?? []).filter((s) => s.type === 'station');

  function done() {
    setOrigin(''); setDest(''); setAmount(''); setErr(null);
    onClose();
  }
  function go() {
    setErr(null);
    const fareAmount = Number(amount);
    if (!origin || !dest || origin === dest || !Number.isFinite(fareAmount) || fareAmount <= 0) {
      setErr(t('network.fareInvalid'));
      return;
    }
    upsert.mutate(
      { originStationId: origin, destinationStationId: dest, fareAmount, fareSource: 'manual' },
      { onSuccess: done, onError: (e) => setErr(e instanceof Error ? e.message : t('network.fareInvalid')) },
    );
  }

  return (
    <Modal open={open} onClose={onClose} title={t('network.addFare')} description={t('network.addFareSub')}
      footer={<><Button variant="outline" onClick={onClose} disabled={upsert.isPending}>{t('forms.cancel')}</Button><Button onClick={go} disabled={upsert.isPending}>{upsert.isPending ? t('forms.saving') : t('network.saveFare')}</Button></>}>
      <div className="space-y-4">
        {err && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{err}</p>}
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('network.originStation')} htmlFor="nf-o">
            <Select id="nf-o" value={origin} onChange={(e) => setOrigin(e.target.value)}>
              <option value="" disabled>{t('network.selectStation')}</option>
              {stations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </Field>
          <Field label={t('network.destStation')} htmlFor="nf-d">
            <Select id="nf-d" value={dest} onChange={(e) => setDest(e.target.value)}>
              <option value="" disabled>{t('network.selectStation')}</option>
              {stations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </Field>
        </div>
        <Field label={t('network.fareAmount')} htmlFor="nf-amt" hint={t('network.fareHint')}>
          <Input id="nf-amt" type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="3500" />
        </Field>
      </div>
    </Modal>
  );
}
