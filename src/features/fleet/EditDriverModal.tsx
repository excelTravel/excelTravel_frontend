import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRightLeft, Star, UserRound, UserX } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/form';
import { useCompanies, useUpdateDriver, useDeactivateDriver, useTransferDriver, type ApiDriver } from '@/lib/api/hooks';
import { useSession } from '@/lib/auth/session';

const STATUSES = ['available', 'on_trip', 'off_duty', 'suspended'] as const;
const END_REASONS = ['transferred', 'resigned', 'terminated', 'contract_ended'] as const;

type Mode = 'edit' | 'transfer' | 'confirmDeactivate';

// PATCH /drivers/{id} (status/rating/license) + DELETE /drivers/{id} (soft deactivate) + POST
// /drivers/{id}/transfer (super_admin only — moves the driver to another company).
export function EditDriverModal({ driver, open, onClose }: { driver: ApiDriver | null; open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const sessionUser = useSession((s) => s.user);
  const companiesQ = useCompanies();
  const update = useUpdateDriver();
  const deactivate = useDeactivateDriver();
  const transfer = useTransferDriver();
  const [mode, setMode] = useState<Mode>('edit');
  const [status, setStatus] = useState<(typeof STATUSES)[number]>('available');
  const [rating, setRating] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [toCompanyId, setToCompanyId] = useState('');
  const [endReason, setEndReason] = useState<(typeof END_REASONS)[number]>('transferred');
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (driver) {
      setStatus(driver.status as (typeof STATUSES)[number]);
      setRating(driver.rating != null ? String(driver.rating) : '');
      setLicenseNumber(driver.licenseNumber ?? '');
      setLicenseExpiry(driver.licenseExpiry ? driver.licenseExpiry.slice(0, 10) : '');
      setMode('edit');
      setToCompanyId('');
      setErr(null);
    }
  }, [driver]);

  if (!driver) return null;
  const busy = update.isPending || deactivate.isPending || transfer.isPending;

  function save() {
    setErr(null);
    update.mutate(
      {
        id: driver!.id,
        status,
        ...(rating.trim() ? { rating: Number(rating) } : {}),
        ...(licenseNumber.trim() ? { licenseNumber: licenseNumber.trim() } : {}),
        ...(licenseExpiry ? { licenseExpiry: new Date(`${licenseExpiry}T00:00:00Z`).toISOString() } : {}),
      },
      { onSuccess: onClose, onError: (e) => setErr(e instanceof Error ? e.message : t('forms.checkFields')) },
    );
  }

  function doTransfer() {
    setErr(null);
    if (!toCompanyId) return;
    transfer.mutate(
      { id: driver!.id, toCompanyId, endReason },
      { onSuccess: onClose, onError: (e) => setErr(e instanceof Error ? e.message : t('drivers.transferFailed')) },
    );
  }

  function doDeactivate() {
    setErr(null);
    deactivate.mutate({ id: driver!.id }, { onSuccess: onClose, onError: (e) => setErr(e instanceof Error ? e.message : t('forms.checkFields')) });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={driver.name}
      description={driver.licenseNumber ?? undefined}
      footer={
        mode === 'confirmDeactivate' ? (
          <>
            <Button variant="outline" onClick={() => setMode('edit')} disabled={busy}>{t('forms.cancel')}</Button>
            <Button variant="destructive" onClick={doDeactivate} disabled={busy}>{deactivate.isPending ? t('forms.saving') : t('drivers.confirmDeactivate')}</Button>
          </>
        ) : mode === 'transfer' ? (
          <>
            <Button variant="outline" onClick={() => setMode('edit')} disabled={busy}>{t('forms.cancel')}</Button>
            <Button onClick={doTransfer} disabled={busy || !toCompanyId}>{transfer.isPending ? t('forms.saving') : t('drivers.transfer')}</Button>
          </>
        ) : (
          <>
            <Button variant="destructive" onClick={() => setMode('confirmDeactivate')} disabled={busy}>
              <UserX className="size-4" /> {t('drivers.deactivate')}
            </Button>
            {sessionUser?.role === 'super_admin' && (
              <Button variant="outline" onClick={() => setMode('transfer')} disabled={busy}>
                <ArrowRightLeft className="size-4" /> {t('drivers.transfer')}
              </Button>
            )}
            <Button onClick={save} disabled={busy}>{update.isPending ? t('forms.saving') : t('forms.save')}</Button>
          </>
        )
      }
    >
      <div className="space-y-4">
        {err && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{err}</p>}

        {mode === 'transfer' ? (
          <Field label={t('drivers.transferTo')} htmlFor="ed-company" required>
            <Select id="ed-company" value={toCompanyId} onChange={(e) => setToCompanyId(e.target.value)}>
              <option value="" disabled>{t('forms.selectCompany')}</option>
              {(companiesQ.data ?? []).filter((c) => c.id !== driver!.companyId).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
            <div className="mt-3">
              <Select value={endReason} onChange={(e) => setEndReason(e.target.value as typeof endReason)}>
                {END_REASONS.map((r) => <option key={r} value={r}>{t(`drivers.endReason.${r}`)}</option>)}
              </Select>
            </div>
          </Field>
        ) : (
          <>
            <div className="flex items-center gap-3 rounded-xl bg-secondary/50 p-3">
              <span className="grid size-9 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">{driver.name.charAt(0)}</span>
              <div className="text-sm">
                <p className="font-medium">{driver.name}</p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground"><UserRound className="size-3" /> {driver.phone}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label={t('forms.status')} htmlFor="ed-status">
                <Select id="ed-status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
                  {STATUSES.map((s) => <option key={s} value={s}>{t(`drivers.state.${s}`, s)}</option>)}
                </Select>
              </Field>
              <Field label={t('drivers.colRating')} htmlFor="ed-rating" hint={t('drivers.ratingHint')}>
                <Input id="ed-rating" type="number" min={0} max={5} step={0.1} value={rating} onChange={(e) => setRating(e.target.value)} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label={t('drivers.licenseNumber')} htmlFor="ed-license">
                <Input id="ed-license" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} />
              </Field>
              <Field label={t('drivers.licenseExpires')} htmlFor="ed-expiry">
                <Input id="ed-expiry" type="date" value={licenseExpiry} onChange={(e) => setLicenseExpiry(e.target.value)} />
              </Field>
            </div>
          </>
        )}

        {mode !== 'transfer' && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Star className="size-3.5" /> {t('drivers.editHint')}</p>
        )}
      </div>
    </Modal>
  );
}
