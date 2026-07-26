import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/form';
import { useRoutes, useVehicles, useDrivers, useCreateTrip } from '@/lib/api/hooks';

// Create a trip → POST /trips (CreateTrip: routeId, vehicleId?, driverId?, direction, departureTime).
export function NewTripModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const routesQ = useRoutes();
  const vehiclesQ = useVehicles();
  const driversQ = useDrivers();
  const create = useCreateTrip();
  const [routeId, setRouteId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [direction, setDirection] = useState<'outbound' | 'return'>('outbound');
  const [err, setErr] = useState<string | null>(null);

  function done() {
    setRouteId(''); setDate(''); setTime(''); setVehicleId(''); setDriverId(''); setDirection('outbound'); setErr(null);
    onClose();
  }
  function create_() {
    setErr(null);
    if (!routeId || !date || !time) { setErr(t('forms.checkFields')); return; }
    create.mutate(
      {
        routeId,
        departureTime: new Date(`${date}T${time}`).toISOString(),
        direction,
        ...(vehicleId ? { vehicleId } : {}),
        ...(driverId ? { driverId } : {}),
      },
      { onSuccess: done, onError: (e) => setErr(e instanceof Error ? e.message : t('forms.checkFields')) },
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('tripsList.newTrip')}
      description={t('tripsList.mng.newTripSub')}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={create.isPending}>{t('forms.cancel')}</Button>
          <Button onClick={create_} disabled={create.isPending}>{create.isPending ? t('forms.saving') : t('tripsList.mng.createTrip')}</Button>
        </>
      }
    >
      <div className="space-y-4">
        {err && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{err}</p>}
        <Field label={t('forms.route')} htmlFor="nt-route" required>
          <Select id="nt-route" value={routeId} onChange={(e) => setRouteId(e.target.value)}>
            <option value="" disabled>{t('forms.selectRoute')}</option>
            {(routesQ.data ?? []).map((r) => <option key={r.id} value={r.id}>{r.origin} → {r.destination}</option>)}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('tripsList.mng.departDate')} htmlFor="nt-date" required><Input id="nt-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label={t('tripsList.mng.departTime')} htmlFor="nt-time" required><Input id="nt-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('forms.vehicle')} htmlFor="nt-bus">
            <Select id="nt-bus" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
              <option value="">{t('forms.selectVehicle')}</option>
              {(vehiclesQ.data ?? []).filter((v) => v.status === 'active').map((v) => <option key={v.id} value={v.id}>{v.plateNumber}</option>)}
            </Select>
          </Field>
          <Field label={t('drivers.colDriver')} htmlFor="nt-driver">
            <Select id="nt-driver" value={driverId} onChange={(e) => setDriverId(e.target.value)}>
              <option value="">{t('tripsList.mng.selectDriver')}</option>
              {(driversQ.data ?? []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
          </Field>
        </div>
        <Field label={t('tripsList.mng.direction')} htmlFor="nt-dir">
          <Select id="nt-dir" value={direction} onChange={(e) => setDirection(e.target.value as 'outbound' | 'return')}>
            <option value="outbound">{t('tripsList.mng.outbound')}</option>
            <option value="return">{t('tripsList.mng.return')}</option>
          </Select>
        </Field>
      </div>
    </Modal>
  );
}
