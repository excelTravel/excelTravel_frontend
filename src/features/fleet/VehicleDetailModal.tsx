import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Archive, Bus, Pencil } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/form';
import { StatusPill } from '@/components/ui/badge';
import { ImageUpload } from '@/components/ui/image-upload';
import { useRoutes, useUpdateVehicle, useArchiveVehicle } from '@/lib/api/hooks';
import { CLOUDINARY_FOLDERS } from '@/lib/config';
import type { Vehicle } from './data';

// View = GET /vehicles/{id}. Edit = PATCH /vehicles/{id} (UpdateVehicle): model, capacity, status, routeId.
// Archive = DELETE /vehicles/{id} (soft; blocked while on an active trip). plate_number and year are
// immutable on the backend, so they're read-only.
export function VehicleDetailModal({ vehicle, open, onClose }: { vehicle: Vehicle | null; open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const routesQ = useRoutes();
  const update = useUpdateVehicle();
  const archive = useArchiveVehicle();
  const [editing, setEditing] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [model, setModel] = useState('');
  const [capacity, setCapacity] = useState('');
  const [status, setStatus] = useState<'active' | 'maintenance' | 'retired'>('active');
  const [routeId, setRouteId] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (vehicle) {
      setModel(vehicle.model);
      setCapacity(String(vehicle.capacity));
      setStatus(vehicle.status);
      setPhotoUrl(vehicle.photoUrl);
      setEditing(false);
      setConfirmArchive(false);
      setErr(null);
    }
  }, [vehicle]);

  if (!vehicle) return null;

  function save() {
    setErr(null);
    update.mutate(
      {
        id: vehicle!.id,
        model: model.trim(),
        capacity: Number(capacity),
        status,
        photoUrl,
        ...(routeId ? { routeId } : {}),
      },
      { onSuccess: () => setEditing(false), onError: (e) => setErr(e instanceof Error ? e.message : t('forms.checkFields')) },
    );
  }

  function doArchive() {
    setErr(null);
    archive.mutate({ id: vehicle!.id }, { onSuccess: onClose, onError: (e) => setErr(e instanceof Error ? e.message : t('vehicles.archiveFailed')) });
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        setEditing(false);
        onClose();
      }}
      size="lg"
      title={vehicle.plate}
      description={`${vehicle.model} · ${vehicle.year}`}
      footer={
        editing ? (
          <>
            <Button variant="outline" onClick={() => setEditing(false)} disabled={update.isPending}>{t('forms.cancel')}</Button>
            <Button onClick={save} disabled={update.isPending}>{update.isPending ? t('forms.saving') : t('forms.save')}</Button>
          </>
        ) : confirmArchive ? (
          <>
            <Button variant="outline" onClick={() => setConfirmArchive(false)} disabled={archive.isPending}>{t('forms.cancel')}</Button>
            <Button variant="destructive" onClick={doArchive} disabled={archive.isPending}>
              {archive.isPending ? t('forms.saving') : t('vehicles.confirmArchive')}
            </Button>
          </>
        ) : (
          <>
            {vehicle.status !== 'retired' && (
              <Button variant="destructive" onClick={() => setConfirmArchive(true)}>
                <Archive className="size-4" /> {t('vehicles.archive')}
              </Button>
            )}
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="size-4" /> {t('forms.edit')}
            </Button>
          </>
        )
      }
    >
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          {vehicle.photoUrl ? (
            <img src={vehicle.photoUrl} alt="" className="size-12 rounded-xl object-cover" />
          ) : (
            <span className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary">
              <Bus className="size-6" />
            </span>
          )}
          <StatusPill status={vehicle.status}>{t(`vehicles.status.${vehicle.status}`)}</StatusPill>
        </div>

        {err && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{err}</p>}

        {editing ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <ImageUpload value={photoUrl} onChange={setPhotoUrl} shape="square" folder={CLOUDINARY_FOLDERS.busPictures} hint={t('vehicles.photoHint')} />
            </div>
            <Field label={t('forms.model')} htmlFor="e-model">
              <Input id="e-model" value={model} onChange={(e) => setModel(e.target.value)} />
            </Field>
            <Field label={t('vehicles.colCapacity')} htmlFor="e-cap">
              <Input id="e-cap" type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} />
            </Field>
            <Field label={t('forms.status')} htmlFor="e-status">
              <Select id="e-status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
                <option value="active">{t('vehicles.status.active')}</option>
                <option value="maintenance">{t('vehicles.status.maintenance')}</option>
                <option value="retired">{t('vehicles.status.retired')}</option>
              </Select>
            </Field>
            <Field label={t('forms.route')} htmlFor="e-route">
              <Select id="e-route" value={routeId} onChange={(e) => setRouteId(e.target.value)}>
                <option value="">{t('forms.selectRoute')}</option>
                {(routesQ.data ?? []).map((r) => (
                  <option key={r.id} value={r.id}>{r.origin} → {r.destination}</option>
                ))}
              </Select>
            </Field>
          </div>
        ) : (
          <dl className="grid grid-cols-2 gap-3">
            <Detail label={t('vehicles.colCapacity')} value={`${vehicle.capacity} ${t('vehicles.seats')}`} />
            <Detail label={t('vehicles.nextMaintenance')} value={vehicle.nextServiceDate} />
            <Detail label={t('forms.year')} value={String(vehicle.year)} />
            <Detail
              label={t('vehicles.colStatus')}
              value={
                vehicle.currentTrip
                  ? `${vehicle.currentTrip.code} · ${vehicle.currentTrip.route}`
                  : vehicle.nextTrip
                    ? `${vehicle.nextTrip.code} · ${vehicle.nextTrip.route} · ${vehicle.nextTrip.time}`
                    : vehicle.lastDestination
                      ? t('vehicles.lastSeenAt', { place: vehicle.lastDestination })
                      : t(`vehicles.status.${vehicle.status}`)
              }
              className="col-span-2"
            />
          </dl>
        )}
      </div>
    </Modal>
  );
}

function Detail({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={`rounded-xl border border-border bg-secondary/40 p-3 ${className ?? ''}`}>
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-foreground">{value}</dd>
    </div>
  );
}
