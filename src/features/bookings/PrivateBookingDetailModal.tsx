import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, XCircle, Send, Bus } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/form';
import { StatusPill } from '@/components/ui/badge';
import {
  usePrivateBooking,
  useUpdatePrivateBooking,
  useAssignPrivateBookingLeg,
  useVehicles,
  useDrivers,
} from '@/lib/api/hooks';
import { formatRWF } from '@/lib/utils';
import { useSession } from '@/lib/auth/session';
import { STAFF_ROLES } from '@/app/shell/nav';

export function PrivateBookingDetailModal({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { t } = useTranslation();
  const bookingQ = usePrivateBooking(id ?? undefined);
  const vehiclesQ = useVehicles();
  const driversQ = useDrivers();
  const update = useUpdatePrivateBooking();
  const assignLeg = useAssignPrivateBookingLeg();
  // Approve/reject/invoice/assign/confirm are manager-only on the backend (authorize(...MANAGERS)) — an
  // agent can reach this page (see /bookings nav) but should only see the read-only view, not controls
  // that would just 403 on click.
  const sessionUser = useSession((s) => s.user);
  const canManage = STAFF_ROLES.includes(sessionUser?.role ?? '');

  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [invoiceInstructions, setInvoiceInstructions] = useState('');
  const [invoiceDueDate, setInvoiceDueDate] = useState('');
  const [rejectNote, setRejectNote] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [requestRejectReason, setRequestRejectReason] = useState('');
  const [showRequestReject, setShowRequestReject] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const b = bookingQ.data;
  if (!id || !b) return null;

  const vehicles = vehiclesQ.data ?? [];
  const drivers = driversQ.data ?? [];
  const allLegsAssigned = b.legs.every((l) => l.vehicleId && l.driverId);

  const runOrShowError = async (fn: () => Promise<unknown>) => {
    setErr(null);
    try {
      await fn();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <Modal
      open={Boolean(id)}
      onClose={onClose}
      title={b.requesterName}
      description={`${b.pickupLocation} → ${b.destination}`}
      size="lg"
    >
      <div className="space-y-6">
        {err && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{err}</p>}

        <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div><p className="text-muted-foreground">{t('privateBookings.status', 'Status')}</p><StatusPill status={b.status} /></div>
          <div><p className="text-muted-foreground">{t('privateBookings.colWhen', 'Date/Time')}</p><p className="font-medium">{new Date(b.bookingDate).toLocaleDateString()} · {b.requestedTime}</p></div>
          <div><p className="text-muted-foreground">{t('privateBookings.colDuration', 'Duration')}</p><p className="font-medium">{b.durationDays} day(s)</p></div>
          <div><p className="text-muted-foreground">{t('privateBookings.passengers', 'Passengers')}</p><p className="font-medium">{b.passengerCount}</p></div>
          <div><p className="text-muted-foreground">{t('privateBookings.purpose', 'Purpose')}</p><p className="font-medium capitalize">{b.purpose}</p></div>
          <div><p className="text-muted-foreground">{t('privateBookings.phone', 'Phone')}</p><p className="font-medium">{b.requesterPhone}</p></div>
        </div>
        {b.specialRequests && <p className="text-sm text-muted-foreground">{b.specialRequests}</p>}
        {b.status === 'rejected' && b.notes && (
          <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{t('privateBookings.rejectReasonLabel', 'Rejection reason')}: {b.notes}</p>
        )}

        {b.status === 'pending' && canManage && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button onClick={() => runOrShowError(() => update.mutateAsync({ id: b.id, status: 'approved' }))} disabled={update.isPending}>
                <CheckCircle2 className="size-4" /> {t('privateBookings.approve', 'Approve')}
              </Button>
              <Button variant="outline" onClick={() => setShowRequestReject((s) => !s)} disabled={update.isPending}>
                <XCircle className="size-4" /> {t('privateBookings.reject', 'Reject')}
              </Button>
            </div>
            {showRequestReject && (
              <div className="space-y-2">
                <Textarea
                  value={requestRejectReason}
                  onChange={(e) => setRequestRejectReason(e.target.value)}
                  placeholder={t('privateBookings.rejectReason', 'Reason (sent back to the passenger)')}
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={update.isPending || !requestRejectReason.trim()}
                  onClick={() =>
                    runOrShowError(async () => {
                      await update.mutateAsync({ id: b.id, status: 'rejected', notes: requestRejectReason.trim() });
                      setShowRequestReject(false);
                      setRequestRejectReason('');
                    })
                  }
                >
                  {t('privateBookings.sendRejection', 'Send back to passenger')}
                </Button>
              </div>
            )}
          </div>
        )}

        <div>
          <h4 className="mb-2 text-sm font-semibold">{t('privateBookings.buses', 'Buses')} ({b.legs.length})</h4>
          <div className="space-y-2">
            {b.legs.map((leg) => (
              <div key={leg.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-3">
                <Bus className="size-4 shrink-0 text-muted-foreground" />
                <span className="text-sm font-medium">#{leg.legNo}</span>
                {canManage ? (
                  <>
                    <Select
                      className="w-40"
                      value={leg.vehicleId ?? ''}
                      onChange={(e) => runOrShowError(() => assignLeg.mutateAsync({ id: b.id, legId: leg.id, vehicleId: e.target.value || null }))}
                    >
                      <option value="">{t('privateBookings.pickVehicle', 'Pick vehicle…')}</option>
                      {vehicles.map((v) => <option key={v.id} value={v.id}>{v.plateNumber}</option>)}
                    </Select>
                    <Select
                      className="w-40"
                      value={leg.driverId ?? ''}
                      onChange={(e) => runOrShowError(() => assignLeg.mutateAsync({ id: b.id, legId: leg.id, driverId: e.target.value || null }))}
                    >
                      <option value="">{t('privateBookings.pickDriver', 'Pick driver…')}</option>
                      {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </Select>
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    {vehicles.find((v) => v.id === leg.vehicleId)?.plateNumber ?? t('privateBookings.pickVehicle', 'Pick vehicle…')}
                    {' · '}
                    {drivers.find((d) => d.id === leg.driverId)?.name ?? t('privateBookings.pickDriver', 'Pick driver…')}
                  </span>
                )}
                <StatusPill status={leg.status} />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 rounded-lg border border-border p-4">
          <h4 className="text-sm font-semibold">{t('privateBookings.invoice', 'Invoice')}</h4>
          {b.invoiceAmount != null && (
            <p className="text-sm text-muted-foreground">
              {formatRWF(b.invoiceAmount)} — <StatusPill status={b.invoiceStatus ?? 'draft'} />
            </p>
          )}
          {canManage && (b.invoiceStatus == null || b.invoiceStatus === 'draft' || b.invoiceStatus === 'sent' || b.invoiceStatus === 'rejected') && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Field label={t('privateBookings.amount', 'Amount (RWF)')}>
                <Input type="number" min={0} value={invoiceAmount} onChange={(e) => setInvoiceAmount(e.target.value)} />
              </Field>
              <Field label={t('privateBookings.dueDate', 'Due date')}>
                <Input type="date" value={invoiceDueDate} onChange={(e) => setInvoiceDueDate(e.target.value)} />
              </Field>
              <Field label={t('privateBookings.instructions', 'How to pay')}>
                <Input value={invoiceInstructions} onChange={(e) => setInvoiceInstructions(e.target.value)} placeholder="MTN MoMo 07xx…" />
              </Field>
            </div>
          )}
          {canManage && (b.invoiceStatus == null || b.invoiceStatus === 'draft' || b.invoiceStatus === 'sent' || b.invoiceStatus === 'rejected') && (
            <Button
              size="sm"
              disabled={update.isPending || !invoiceAmount}
              onClick={() =>
                runOrShowError(() =>
                  update.mutateAsync({
                    id: b.id,
                    invoiceAmount: Number(invoiceAmount),
                    invoiceInstructions: invoiceInstructions || undefined,
                    invoiceDueDate: invoiceDueDate ? new Date(invoiceDueDate).toISOString() : undefined,
                    invoiceStatus: 'sent',
                  }),
                )
              }
            >
              <Send className="size-4" /> {t('privateBookings.sendInvoice', 'Send invoice')}
            </Button>
          )}

          {b.invoiceStatus === 'proof_submitted' && (
            <div className="space-y-3">
              {b.proofUrl && (
                <a href={b.proofUrl} target="_blank" rel="noreferrer">
                  <img src={b.proofUrl} alt={t('privateBookings.proof', 'Payment proof')} className="max-h-64 rounded-lg border border-border" />
                </a>
              )}
              {canManage && !allLegsAssigned && (
                <p className="text-xs text-warning">{t('privateBookings.assignFirst', 'Assign a vehicle and driver to every bus before confirming payment.')}</p>
              )}
              {canManage && (
              <div className="flex gap-2">
                <Button disabled={update.isPending || !allLegsAssigned} onClick={() => runOrShowError(() => update.mutateAsync({ id: b.id, invoiceStatus: 'paid' }))}>
                  <CheckCircle2 className="size-4" /> {t('privateBookings.confirmPayment', 'Confirm payment')}
                </Button>
                <Button variant="outline" onClick={() => setShowReject((s) => !s)}>
                  <XCircle className="size-4" /> {t('privateBookings.rejectProof', 'Reject proof')}
                </Button>
              </div>
              )}
              {canManage && showReject && (
                <div className="space-y-2">
                  <Textarea value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} placeholder={t('privateBookings.rejectReason', 'Reason (sent back to the passenger)')} />
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={update.isPending || !rejectNote.trim()}
                    onClick={() =>
                      runOrShowError(async () => {
                        await update.mutateAsync({ id: b.id, invoiceStatus: 'rejected', paymentNote: rejectNote.trim() });
                        setShowReject(false);
                        setRejectNote('');
                      })
                    }
                  >
                    {t('privateBookings.sendRejection', 'Send back to passenger')}
                  </Button>
                </div>
              )}
            </div>
          )}
          {b.paymentNote && b.invoiceStatus !== 'proof_submitted' && (
            <p className="text-xs text-muted-foreground">{t('privateBookings.lastNote', 'Last note')}: {b.paymentNote}</p>
          )}
        </div>
      </div>
    </Modal>
  );
}
