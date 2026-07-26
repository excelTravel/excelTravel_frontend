import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Archive, MapPin } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/form';
import {
  useStops,
  useUpsertFare,
  useCreateRoute,
  useCreateStop,
  useUpdateRoute,
  useArchiveRoute,
  useUpdateStop,
  useArchiveStop,
  type ApiRoute,
  type ApiStop,
} from '@/lib/api/hooks';

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

// PATCH/DELETE /routes/{id} — DELETE is a soft archive, blocked while the route has an active trip.
export function EditRouteModal({ route, open, onClose }: { route: ApiRoute | null; open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const update = useUpdateRoute();
  const archive = useArchiveRoute();
  const [name, setName] = useState('');
  const [origin, setOrigin] = useState('');
  const [dest, setDest] = useState('');
  const [km, setKm] = useState('');
  const [min, setMin] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (route) {
      setName(route.name);
      setOrigin(route.origin);
      setDest(route.destination);
      setKm(route.distanceKm != null ? String(route.distanceKm) : '');
      setMin(route.estimatedDurationMin != null ? String(route.estimatedDurationMin) : '');
      setStatus(route.status);
      setConfirmArchive(false);
      setErr(null);
    }
  }, [route]);

  if (!route) return null;

  function save() {
    setErr(null);
    update.mutate(
      {
        id: route!.id,
        name: name.trim(),
        origin: origin.trim(),
        destination: dest.trim(),
        status,
        ...(km.trim() ? { distanceKm: Number(km) } : {}),
        ...(min.trim() ? { estimatedDurationMin: Number(min) } : {}),
      },
      { onSuccess: onClose, onError: (e) => setErr(e instanceof Error ? e.message : t('forms.checkFields')) },
    );
  }

  function doArchive() {
    setErr(null);
    archive.mutate({ id: route!.id }, { onSuccess: onClose, onError: (e) => setErr(e instanceof Error ? e.message : t('network.archiveRouteFailed')) });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('network.editRoute')}
      description={`${route.origin} → ${route.destination}`}
      footer={
        confirmArchive ? (
          <>
            <Button variant="outline" onClick={() => setConfirmArchive(false)} disabled={archive.isPending}>{t('forms.cancel')}</Button>
            <Button variant="destructive" onClick={doArchive} disabled={archive.isPending}>{archive.isPending ? t('forms.saving') : t('network.confirmArchive')}</Button>
          </>
        ) : (
          <>
            <Button variant="destructive" onClick={() => setConfirmArchive(true)} disabled={update.isPending}><Archive className="size-4" /> {t('network.archive')}</Button>
            <Button variant="outline" onClick={onClose} disabled={update.isPending}>{t('forms.cancel')}</Button>
            <Button onClick={save} disabled={update.isPending}>{update.isPending ? t('forms.saving') : t('forms.save')}</Button>
          </>
        )
      }
    >
      <div className="space-y-4">
        {err && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{err}</p>}
        <Field label={t('network.routeName')} htmlFor="er-name" required><Input id="er-name" value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('network.origin')} htmlFor="er-o"><Input id="er-o" value={origin} onChange={(e) => setOrigin(e.target.value)} /></Field>
          <Field label={t('network.destination')} htmlFor="er-d"><Input id="er-d" value={dest} onChange={(e) => setDest(e.target.value)} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('network.distance')} htmlFor="er-km"><Input id="er-km" type="number" value={km} onChange={(e) => setKm(e.target.value)} /></Field>
          <Field label={t('network.duration')} htmlFor="er-min"><Input id="er-min" type="number" value={min} onChange={(e) => setMin(e.target.value)} /></Field>
        </div>
        <Field label={t('forms.status')} htmlFor="er-status">
          <Select id="er-status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            <option value="active">{t('network.active')}</option>
            <option value="inactive">{t('network.inactive')}</option>
          </Select>
        </Field>
      </div>
    </Modal>
  );
}

// PATCH/DELETE /stops/{id} — DELETE is a soft archive, blocked while in active use or has child stops.
export function EditStopModal({ stop, open, onClose }: { stop: ApiStop | null; open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const update = useUpdateStop();
  const archive = useArchiveStop();
  const [name, setName] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (stop) {
      setName(stop.name);
      setLat(String(stop.latitude));
      setLng(String(stop.longitude));
      setPhone(stop.phone ?? '');
      setAddress(stop.address ?? '');
      setConfirmArchive(false);
      setErr(null);
    }
  }, [stop]);

  if (!stop) return null;

  function save() {
    setErr(null);
    const latN = Number(lat), lngN = Number(lng);
    if (!name.trim() || !Number.isFinite(latN) || !Number.isFinite(lngN)) { setErr(t('forms.checkFields')); return; }
    update.mutate(
      { id: stop!.id, name: name.trim(), latitude: latN, longitude: lngN, ...(phone.trim() ? { phone: phone.trim() } : {}), ...(address.trim() ? { address: address.trim() } : {}) },
      { onSuccess: onClose, onError: (e) => setErr(e instanceof Error ? e.message : t('forms.checkFields')) },
    );
  }

  function doArchive() {
    setErr(null);
    archive.mutate({ id: stop!.id }, { onSuccess: onClose, onError: (e) => setErr(e instanceof Error ? e.message : t('network.archiveStopFailed')) });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('network.editStop')}
      description={t(`network.${stop.type}`)}
      footer={
        confirmArchive ? (
          <>
            <Button variant="outline" onClick={() => setConfirmArchive(false)} disabled={archive.isPending}>{t('forms.cancel')}</Button>
            <Button variant="destructive" onClick={doArchive} disabled={archive.isPending}>{archive.isPending ? t('forms.saving') : t('network.confirmArchive')}</Button>
          </>
        ) : (
          <>
            <Button variant="destructive" onClick={() => setConfirmArchive(true)} disabled={update.isPending}><Archive className="size-4" /> {t('network.archive')}</Button>
            <Button variant="outline" onClick={onClose} disabled={update.isPending}>{t('forms.cancel')}</Button>
            <Button onClick={save} disabled={update.isPending}>{update.isPending ? t('forms.saving') : t('forms.save')}</Button>
          </>
        )
      }
    >
      <div className="space-y-4">
        {err && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{err}</p>}
        <Field label={t('network.stopName')} htmlFor="es-name" required><Input id="es-name" value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('network.latitude')} htmlFor="es-lat"><Input id="es-lat" type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value)} /></Field>
          <Field label={t('network.longitude')} htmlFor="es-lng"><Input id="es-lng" type="number" step="any" value={lng} onChange={(e) => setLng(e.target.value)} /></Field>
        </div>
        <Field label={t('network.phone')} htmlFor="es-phone"><Input id="es-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
        <Field label={t('forms.address', 'Address')} htmlFor="es-address"><Input id="es-address" value={address} onChange={(e) => setAddress(e.target.value)} /></Field>
      </div>
    </Modal>
  );
}
