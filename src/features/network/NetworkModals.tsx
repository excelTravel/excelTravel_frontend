import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Archive, MapPin } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/form';
import {
  useStops,
  useAgents,
  useUpsertFare,
  useCreateRoute,
  useCreateStop,
  useUpdateRoute,
  useArchiveRoute,
  useUpdateStop,
  useArchiveStop,
  useAssignAgentStation,
  useResolveZone,
  type ApiRoute,
  type ApiStop,
} from '@/lib/api/hooks';

// Live feedback the moment a pin/coordinate resolves to a real place — shown under the lat/lng
// fields in every stop/station form, before the row is even saved.
function ZoneFeedback({ lat, lng }: { lat: number | null; lng: number | null }) {
  const { t } = useTranslation();
  const q = useResolveZone(lat, lng);
  if (lat == null || lng == null) return null;
  if (q.isLoading) return <p className="text-xs text-muted-foreground">{t('network.resolvingZone')}</p>;
  if (q.isError || !q.data) return null;
  const { province, district, sector, cell } = q.data;
  const parts = [province?.name, district?.name, sector?.name, cell?.name].filter(Boolean);
  if (parts.length === 0) return <p className="text-xs text-warning">{t('network.zoneUnresolved')}</p>;
  return (
    <p className="flex items-center gap-1.5 text-xs text-teal">
      <MapPin className="size-3.5" /> {parts.join(' › ')}
    </p>
  );
}

function useCoords(pin?: { lat: number; lng: number } | null) {
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  useEffect(() => {
    if (pin) { setLat(pin.lat.toFixed(5)); setLng(pin.lng.toFixed(5)); }
  }, [pin]);
  const latN = Number(lat);
  const lngN = Number(lng);
  const valid = lat !== '' && lng !== '' && Number.isFinite(latN) && Number.isFinite(lngN);
  return { lat, setLat, lng, setLng, latN, lngN, valid };
}

// POST /routes (CreateRoute). A route IS its origin and destination — name is always derived
// server-side from these two stops, never typed. This picker only sets the two endpoints; adding
// intermediate waypoints to a route isn't available from the console yet.
export function AddRouteModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const stopsQ = useStops();
  const create = useCreateRoute();
  const [originId, setOriginId] = useState('');
  const [destId, setDestId] = useState('');
  const [km, setKm] = useState('');
  const [min, setMin] = useState('');
  const [times, setTimes] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const stations = (stopsQ.data ?? []).filter((s) => s.type === 'station');

  function done() { setOriginId(''); setDestId(''); setKm(''); setMin(''); setTimes(''); setErr(null); onClose(); }
  function go() {
    setErr(null);
    if (!originId || !destId || originId === destId) { setErr(t('network.originDestRequired')); return; }
    const departureTimes = times.split(',').map((s) => s.trim()).filter(Boolean);
    create.mutate(
      {
        stops: [{ stopId: originId, stopOrder: 1 }, { stopId: destId, stopOrder: 2 }],
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
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('network.originStation')} htmlFor="nr-o" required>
            <Select id="nr-o" value={originId} onChange={(e) => setOriginId(e.target.value)}>
              <option value="" disabled>{t('network.selectStation')}</option>
              {stations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </Field>
          <Field label={t('network.destStation')} htmlFor="nr-d" required>
            <Select id="nr-d" value={destId} onChange={(e) => setDestId(e.target.value)}>
              <option value="" disabled>{t('network.selectStation')}</option>
              {stations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </Field>
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

// POST /stops (CreateStop, type: station). A station is a bus park: it has its own phone line and
// (optionally) an agent working from it. `pin` prefills coordinates when dropped on the map; the
// zone (district/sector/cell) resolves live from those coordinates.
export function AddStationModal({ open, onClose, pin }: { open: boolean; onClose: () => void; pin?: { lat: number; lng: number } | null }) {
  const { t } = useTranslation();
  const create = useCreateStop();
  const assignAgent = useAssignAgentStation();
  const agentsQ = useAgents();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [agentId, setAgentId] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const { lat, setLat, lng, setLng, latN, lngN, valid } = useCoords(pin);

  function done() { setName(''); setPhone(''); setAgentId(''); setLat(''); setLng(''); setErr(null); onClose(); }
  function go() {
    setErr(null);
    if (!name.trim() || !phone.trim() || !valid) { setErr(t('forms.checkFields')); return; }
    create.mutate(
      { name: name.trim(), type: 'station', latitude: latN, longitude: lngN, phone: phone.trim() },
      {
        onSuccess: (station) => {
          if (agentId) assignAgent.mutate({ id: agentId, stationId: station.id });
          done();
        },
        onError: (e) => setErr(e instanceof Error ? e.message : t('forms.checkFields')),
      },
    );
  }
  return (
    <Modal open={open} onClose={onClose} title={t('network.addStation')} description={t('network.addStationSub')}
      footer={<><Button variant="outline" onClick={onClose} disabled={create.isPending}>{t('forms.cancel')}</Button><Button onClick={go} disabled={create.isPending}>{create.isPending ? t('forms.saving') : t('network.createStation')}</Button></>}>
      <div className="space-y-4">
        {err && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{err}</p>}
        <Field label={t('network.stationName')} htmlFor="nst-name" required><Input id="nst-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nyabugogo" /></Field>
        <Field label={t('network.phone')} htmlFor="nst-phone" required><Input id="nst-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+250 788 000 000" /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('network.latitude')} htmlFor="nst-lat" hint={pin ? t('network.fromMap') : undefined}><Input id="nst-lat" type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="-1.9536" /></Field>
          <Field label={t('network.longitude')} htmlFor="nst-lng"><Input id="nst-lng" type="number" step="any" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="30.0606" /></Field>
        </div>
        <ZoneFeedback lat={valid ? latN : null} lng={valid ? lngN : null} />
        <Field label={t('network.assignAgent')} htmlFor="nst-agent" hint={t('network.assignAgentHint')}>
          <Select id="nst-agent" value={agentId} onChange={(e) => setAgentId(e.target.value)}>
            <option value="">{t('network.noAgentYet')}</option>
            {(agentsQ.data ?? []).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </Select>
        </Field>
      </div>
    </Modal>
  );
}

// POST /stops (CreateStop, type: stop). A stop is just a pickup point on the way to a station — no
// phone (only the parent station has one), but it must belong to one. Zone resolves live, same as
// the station form.
export function AddStopModal({ open, onClose, pin }: { open: boolean; onClose: () => void; pin?: { lat: number; lng: number } | null }) {
  const { t } = useTranslation();
  const stopsQ = useStops();
  const create = useCreateStop();
  const [name, setName] = useState('');
  const [parent, setParent] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const stations = (stopsQ.data ?? []).filter((s) => s.type === 'station');
  const { lat, setLat, lng, setLng, latN, lngN, valid } = useCoords(pin);

  function done() { setName(''); setParent(''); setLat(''); setLng(''); setErr(null); onClose(); }
  function go() {
    setErr(null);
    if (!name.trim() || !parent || !valid) { setErr(t('forms.checkFields')); return; }
    create.mutate(
      { name: name.trim(), type: 'stop', parentStationId: parent, latitude: latN, longitude: lngN },
      { onSuccess: done, onError: (e) => setErr(e instanceof Error ? e.message : t('forms.checkFields')) },
    );
  }
  return (
    <Modal open={open} onClose={onClose} title={t('network.addStop')} description={t('network.addStopSub')}
      footer={<><Button variant="outline" onClick={onClose} disabled={create.isPending}>{t('forms.cancel')}</Button><Button onClick={go} disabled={create.isPending}>{create.isPending ? t('forms.saving') : t('network.createStop')}</Button></>}>
      <div className="space-y-4">
        {err && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{err}</p>}
        <Field label={t('network.stopName')} htmlFor="ns-name" required><Input id="ns-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Shyorongi" /></Field>
        <Field label={t('network.parentStation')} htmlFor="ns-parent" required>
          <Select id="ns-parent" value={parent} onChange={(e) => setParent(e.target.value)}>
            <option value="" disabled>{t('network.selectStation')}</option>
            {stations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('network.latitude')} htmlFor="ns-lat" hint={pin ? t('network.fromMap') : undefined}><Input id="ns-lat" type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="-1.9536" /></Field>
          <Field label={t('network.longitude')} htmlFor="ns-lng"><Input id="ns-lng" type="number" step="any" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="30.0606" /></Field>
        </div>
        <ZoneFeedback lat={valid ? latN : null} lng={valid ? lngN : null} />
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
// Name/origin/destination aren't editable here — they're derived from the route's stops at creation;
// changing a route's endpoints (or adding waypoints) isn't exposed yet, since a blind replace could
// silently break fares/capacity for trips already keyed to the current stop chain.
export function EditRouteModal({ route, open, onClose }: { route: ApiRoute | null; open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const update = useUpdateRoute();
  const archive = useArchiveRoute();
  const [km, setKm] = useState('');
  const [min, setMin] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (route) {
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
      title={route.name}
      description={route.origin && route.destination ? `${route.origin} → ${route.destination}` : t('network.originDestPending')}
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
        <p className="text-xs text-muted-foreground">{t('network.routeEndpointsLocked')}</p>
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
// Phone only shows for a station (a stop can't have one — see AddStopModal). Zone re-resolves live if
// the coordinates are edited.
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
  const isStation = stop.type === 'station';
  const latN = Number(lat);
  const lngN = Number(lng);
  const validCoords = Number.isFinite(latN) && Number.isFinite(lngN);

  function save() {
    setErr(null);
    if (!name.trim() || !validCoords) { setErr(t('forms.checkFields')); return; }
    if (isStation && !phone.trim()) { setErr(t('forms.checkFields')); return; }
    update.mutate(
      {
        id: stop!.id,
        name: name.trim(),
        latitude: latN,
        longitude: lngN,
        ...(isStation ? { phone: phone.trim() } : {}),
        ...(address.trim() ? { address: address.trim() } : {}),
      },
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
        <Field label={t(isStation ? 'network.stationName' : 'network.stopName')} htmlFor="es-name" required><Input id="es-name" value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('network.latitude')} htmlFor="es-lat"><Input id="es-lat" type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value)} /></Field>
          <Field label={t('network.longitude')} htmlFor="es-lng"><Input id="es-lng" type="number" step="any" value={lng} onChange={(e) => setLng(e.target.value)} /></Field>
        </div>
        <ZoneFeedback lat={validCoords ? latN : null} lng={validCoords ? lngN : null} />
        {isStation && <Field label={t('network.phone')} htmlFor="es-phone" required><Input id="es-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>}
        <Field label={t('forms.address', 'Address')} htmlFor="es-address"><Input id="es-address" value={address} onChange={(e) => setAddress(e.target.value)} /></Field>
      </div>
    </Modal>
  );
}
