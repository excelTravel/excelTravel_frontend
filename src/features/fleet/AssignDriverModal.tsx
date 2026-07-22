import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UserRound } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Field, Select } from '@/components/ui/form';
import { useTrips, useRoutes, useVehicles, useUpdateTrip } from '@/lib/api/hooks';

export interface AssignTarget { id: string; name: string; license?: string | null }

const deskTime = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Kigali' });
const ASSIGNABLE = new Set(['scheduled', 'delayed', 'boarding']);

// A driver is put on the road by assigning them to a scheduled trip → PATCH /trips/:id { driverId, vehicleId }.
export function AssignDriverModal({ driver, open, onClose }: { driver: AssignTarget | null; open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const tripsQ = useTrips();
  const routesQ = useRoutes();
  const vehiclesQ = useVehicles();
  const update = useUpdateTrip();
  const [trip, setTrip] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const routeName = useMemo(() => {
    const m = new Map((routesQ.data ?? []).map((r) => [r.id, `${r.origin} → ${r.destination}`]));
    return (id: string) => m.get(id) ?? id;
  }, [routesQ.data]);
  const trips = (tripsQ.data ?? []).filter((tp) => ASSIGNABLE.has(tp.status)).sort((a, b) => a.departureTime.localeCompare(b.departureTime));

  if (!driver) return null;

  function submit() {
    setErr(null);
    if (!trip) return;
    update.mutate(
      { id: trip, driverId: driver!.id, ...(vehicle ? { vehicleId: vehicle } : {}) },
      { onSuccess: () => { setTrip(''); setVehicle(''); onClose(); }, onError: (e) => setErr(e instanceof Error ? e.message : t('forms.selectTrip')) },
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('drivers.assign')}
      description={t('forms.assignSub', { name: driver.name })}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={update.isPending}>{t('forms.cancel')}</Button>
          <Button onClick={submit} disabled={update.isPending || !trip}>{update.isPending ? t('forms.saving') : t('drivers.assign')}</Button>
        </>
      }
    >
      <div className="space-y-4">
        {err && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{err}</p>}
        <div className="flex items-center gap-3 rounded-xl bg-secondary/50 p-3">
          <span className="grid size-9 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            {driver.name.charAt(0)}
          </span>
          <div className="text-sm">
            <p className="font-medium">{driver.name}</p>
            {driver.license && <p className="flex items-center gap-1 text-xs text-muted-foreground"><UserRound className="size-3" /> {driver.license}</p>}
          </div>
        </div>

        <Field label={t('forms.trip')} htmlFor="a-trip" required>
          <Select id="a-trip" value={trip} onChange={(e) => setTrip(e.target.value)}>
            <option value="" disabled>{t('forms.selectTrip')}</option>
            {trips.map((tr) => (
              <option key={tr.id} value={tr.id}>{routeName(tr.routeId)} · {deskTime.format(new Date(tr.departureTime))}</option>
            ))}
          </Select>
        </Field>
        <Field label={t('forms.vehicle')} htmlFor="a-vehicle" hint={t('forms.vehicleHint')}>
          <Select id="a-vehicle" value={vehicle} onChange={(e) => setVehicle(e.target.value)}>
            <option value="">{t('forms.selectVehicle')}</option>
            {(vehiclesQ.data ?? []).filter((v) => v.status === 'active').map((v) => (
              <option key={v.id} value={v.id}>{v.plateNumber}</option>
            ))}
          </Select>
        </Field>
      </div>
    </Modal>
  );
}
