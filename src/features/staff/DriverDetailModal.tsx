import { useTranslation } from 'react-i18next';
import { CalendarClock, Phone, UserRound } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { StatusPill } from '@/components/ui/badge';
import type { ApiDriver } from '@/lib/api/hooks';

const dateFmt = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

// Read-only — photo/license/ID images are managed by the driver from their own account (see
// drivers.editHint in EditDriverModal), so there's no upload here, just a view.
export function DriverDetailModal({ driver, open, onClose }: { driver: ApiDriver | null; open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  if (!driver) return null;

  const docs: { key: string; label: string; url: string | null }[] = [
    { key: 'profile', label: t('drivers.docProfile'), url: driver.photoUrl },
    { key: 'license', label: t('drivers.docLicense'), url: driver.licenseImageUrl },
    { key: 'id', label: t('drivers.docId'), url: driver.idImageUrl },
  ];

  return (
    <Modal open={open} onClose={onClose} size="lg" title={driver.name} description={driver.licenseNumber ?? undefined}>
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          {driver.photoUrl ? (
            <img src={driver.photoUrl} alt="" className="size-12 rounded-full object-cover" />
          ) : (
            <span className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
              <UserRound className="size-6" />
            </span>
          )}
          <StatusPill status={driver.status}>{t(`drivers.state.${driver.status}`, driver.status)}</StatusPill>
        </div>

        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Detail icon={<CalendarClock className="size-3.5" />} label={t('drivers.licenseExpires')} value={driver.licenseExpiry ? dateFmt.format(new Date(driver.licenseExpiry)) : '—'} />
          <Detail icon={<Phone className="size-3.5" />} label={t('drivers.contact')} value={driver.phone} />
        </dl>

        <div>
          <p className="text-sm font-semibold">{t('drivers.documents')}</p>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {docs.map((doc) => (
              <div key={doc.key} className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">{doc.label}</p>
                <div className="grid aspect-square place-items-center overflow-hidden rounded-xl border border-border bg-secondary/40">
                  {doc.url ? (
                    <img src={doc.url} alt={doc.label} className="size-full object-cover" />
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><UserRound className="size-3.5" /> {t('drivers.editHint')}</p>
      </div>
    </Modal>
  );
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-secondary/40 p-3">
      <dt className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{icon} {label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-foreground">{value}</dd>
    </div>
  );
}
