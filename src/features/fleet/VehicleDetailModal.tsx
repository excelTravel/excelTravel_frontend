import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bus, Pencil } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/form';
import { StatusPill } from '@/components/ui/badge';
import type { Vehicle } from './data';

// View = GET /vehicles/{id}. Edit = PATCH /vehicles/{id} (UpdateVehicle): model, capacity, status, routeId.
// plate_number and year are immutable on the backend, so they're read-only.
export function VehicleDetailModal({ vehicle, open, onClose }: { vehicle: Vehicle | null; open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!vehicle) return null;

  function save() {
    setSaving(true);
    // PATCH /vehicles/{id} { model, capacity, status, routeId } — stubbed until the API client is wired.
    setTimeout(() => {
      setSaving(false);
      setEditing(false);
    }, 500);
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
            <Button variant="outline" onClick={() => setEditing(false)} disabled={saving}>{t('forms.cancel')}</Button>
            <Button onClick={save} disabled={saving}>{saving ? t('forms.saving') : t('forms.save')}</Button>
          </>
        ) : (
          <Button variant="outline" onClick={() => setEditing(true)}>
            <Pencil className="size-4" /> {t('forms.edit')}
          </Button>
        )
      }
    >
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary">
            <Bus className="size-6" />
          </span>
          <StatusPill status={vehicle.status}>{t(`vehicles.status.${vehicle.status}`)}</StatusPill>
        </div>

        {editing ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t('forms.model')} htmlFor="e-model">
              <Input id="e-model" defaultValue={vehicle.model} />
            </Field>
            <Field label={t('vehicles.colCapacity')} htmlFor="e-cap">
              <Input id="e-cap" type="number" defaultValue={vehicle.capacity} />
            </Field>
            <Field label={t('forms.status')} htmlFor="e-status">
              <Select id="e-status" defaultValue={vehicle.status}>
                <option value="active">{t('vehicles.status.active')}</option>
                <option value="maintenance">{t('vehicles.status.maintenance')}</option>
                <option value="retired">{t('vehicles.status.retired')}</option>
              </Select>
            </Field>
            <Field label={t('forms.route')} htmlFor="e-route">
              <Input id="e-route" defaultValue={vehicle.route} />
            </Field>
          </div>
        ) : (
          <dl className="grid grid-cols-2 gap-3">
            <Detail label={t('vehicles.colCapacity')} value={`${vehicle.capacity} ${t('vehicles.seats')}`} />
            <Detail label={t('vehicles.nextMaintenance')} value={vehicle.nextServiceDate} />
            <Detail label={t('forms.year')} value={String(vehicle.year)} />
            <Detail label={t('forms.route')} value={vehicle.route} />
            <Detail label={t('vehicles.colDriver')} value={vehicle.driver ?? t('vehicles.unassigned')} className="col-span-2" />
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
