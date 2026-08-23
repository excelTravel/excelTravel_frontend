import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GlassCard } from '@/components/ui/card';
import { StatusPill } from '@/components/ui/badge';
import { DataTable, type Column } from '@/components/ui/data-table';
import { usePrivateBookings, type ApiPrivateBooking } from '@/lib/api/hooks';
import { formatRWF } from '@/lib/utils';
import { PrivateBookingDetailModal } from './PrivateBookingDetailModal';

// Whole-bus charter requests — passengers self-submit from the mobile app, or staff logs one on a
// customer's behalf; managers review, assign buses/drivers per leg, invoice, and confirm payment here.
export function PrivateBookingsPanel() {
  const { t } = useTranslation();
  const bookingsQ = usePrivateBookings();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const rows = bookingsQ.data ?? [];

  const cols: Column<ApiPrivateBooking>[] = [
    {
      key: 'requester',
      header: t('privateBookings.colRequester', 'Requester'),
      sort: (r) => r.requesterName,
      cell: (r) => (
        <div>
          <p className="font-medium">{r.requesterName}</p>
          <p className="text-xs text-muted-foreground tabular-nums">{r.requesterPhone}</p>
        </div>
      ),
    },
    {
      key: 'route',
      header: t('privateBookings.colRoute', 'Route'),
      filter: (r) => `${r.pickupLocation} → ${r.destination}`,
      sort: (r) => r.pickupLocation,
      cell: (r) => `${r.pickupLocation} → ${r.destination}`,
      td: 'whitespace-nowrap text-muted-foreground',
    },
    {
      key: 'when',
      header: t('privateBookings.colWhen', 'Date/Time'),
      sort: (r) => `${r.bookingDate}T${r.requestedTime}`,
      cell: (r) => `${new Date(r.bookingDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} · ${r.requestedTime}`,
      td: 'whitespace-nowrap tabular-nums text-muted-foreground',
    },
    {
      key: 'duration',
      header: t('privateBookings.colDuration', 'Duration'),
      sort: (r) => r.durationDays,
      cell: (r) => `${r.durationDays} ${r.durationDays === 1 ? t('privateBookings.day', 'day') : t('privateBookings.daysPlural', 'days')}`,
      td: 'whitespace-nowrap text-muted-foreground',
    },
    {
      key: 'buses',
      header: t('privateBookings.colBuses', 'Buses'),
      sort: (r) => r.busCount,
      cell: (r) => `${r.busCount}${r.busSize ? ` (${r.busSize})` : ''}`,
      td: 'whitespace-nowrap text-muted-foreground',
    },
    {
      key: 'status',
      header: t('privateBookings.colStatus', 'Status'),
      filter: (r) => r.status,
      sort: (r) => r.status,
      cell: (r) => <StatusPill status={r.status} />,
    },
    {
      key: 'invoice',
      header: t('privateBookings.colInvoice', 'Invoice'),
      filter: (r) => r.invoiceStatus ?? 'draft',
      sort: (r) => r.invoiceStatus ?? '',
      cell: (r) => (
        <div className="flex flex-col gap-0.5">
          <StatusPill status={r.invoiceStatus ?? 'draft'} />
          {r.invoiceAmount != null && <span className="text-xs tabular-nums text-muted-foreground">{formatRWF(r.invoiceAmount)}</span>}
        </div>
      ),
    },
  ];

  return (
    <>
      <GlassCard className="overflow-hidden">
        <div className="border-b border-border p-5 pb-3">
          <h3 className="text-base font-semibold">{t('privateBookings.title', 'Charter requests')}</h3>
          <p className="text-sm text-muted-foreground">{t('privateBookings.subtitle', 'Whole-bus hires — review, assign buses, invoice, confirm payment.')}</p>
        </div>
        {bookingsQ.isLoading ? (
          <div className="shimmer m-5 h-72 rounded-xl" />
        ) : bookingsQ.isError ? (
          <div className="px-6 py-12 text-center text-sm text-destructive">{t('common.error', 'Could not load requests.')}</div>
        ) : rows.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">{t('privateBookings.empty', 'No charter requests yet.')}</div>
        ) : (
          <DataTable
            rows={rows}
            columns={cols}
            rowKey={(r) => r.id}
            onRowClick={(r) => setSelectedId(r.id)}
            search={(r) => `${r.requesterName} ${r.requesterPhone} ${r.pickupLocation} ${r.destination}`}
            searchPlaceholder={t('privateBookings.search', 'Search requests…')}
            empty={t('privateBookings.empty', 'No charter requests yet.')}
            filtersInline
          />
        )}
      </GlassCard>
      <PrivateBookingDetailModal id={selectedId} onClose={() => setSelectedId(null)} />
    </>
  );
}
