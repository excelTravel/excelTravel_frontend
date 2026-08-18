import { useTranslation } from 'react-i18next';
import { GlassCard } from '@/components/ui/card';
import { KpiCard } from '@/components/ui/kpi-card';
import { Badge } from '@/components/ui/badge';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Async } from '@/components/ui/async';
import { Reveal, RevealItem } from '@/components/motion/Motion';
import { usePassengers, type ApiPassengerSummary } from '@/lib/api/hooks';
import { formatRWF } from '@/lib/utils';

const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

// Passengers who have booked with this company. Staff/agent/driver management moved to its own "Staff"
// section (src/features/staff/) — this page is passengers only.
export function TeamPage() {
  const { t } = useTranslation();
  const passengersQ = usePassengers();

  return (
    <Reveal className="space-y-6">
      <RevealItem className="grid grid-cols-1 gap-4 sm:max-w-xs">
        <KpiCard label={t('team.kpiPassengers')} value={(passengersQ.data?.length ?? 0).toLocaleString()} />
      </RevealItem>

      <RevealItem>
        <PassengersPanel query={passengersQ} />
      </RevealItem>
    </Reveal>
  );
}

// Passengers who have booked with this company (GET /passengers, derived from bookings). Booking count,
// last booking and total spend are all real; there is no login history for passengers here.
function PassengersPanel({ query }: { query: ReturnType<typeof usePassengers> }) {
  const { t } = useTranslation();
  const cols: Column<ApiPassengerSummary>[] = [
    {
      key: 'user', header: t('team.colUser'), sort: (p) => p.name,
      cell: (p) => (
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">{p.name.charAt(0)}</span>
          <p className="font-medium">{p.name}</p>
        </div>
      ),
    },
    { key: 'phone', header: t('team.colPhone'), cell: (p) => p.phone, td: 'whitespace-nowrap tabular-nums text-muted-foreground' },
    {
      key: 'bookings', header: t('team.colBookings'), sort: (p) => p.bookings,
      cell: (p) => (
        <span className="inline-flex items-center gap-2">
          <span className="font-semibold tabular-nums">{p.bookings}</span>
          {p.bookings >= 10 && <Badge tone="teal">{t('team.paxFilter.frequent')}</Badge>}
        </span>
      ),
    },
    { key: 'spend', header: t('team.colSpend'), align: 'right', sort: (p) => p.totalSpend, cell: (p) => formatRWF(p.totalSpend), td: 'whitespace-nowrap font-semibold tabular-nums' },
    { key: 'lastBooking', header: t('team.colLastBooking'), align: 'right', sort: (p) => p.lastBookingAt ?? '', cell: (p) => fmtDate(p.lastBookingAt), td: 'whitespace-nowrap tabular-nums text-muted-foreground' },
  ];
  return (
    <GlassCard className="overflow-hidden">
      <Async query={query} isEmpty={(d) => d.length === 0} skeleton={<div className="space-y-2 p-5">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="shimmer h-9 rounded" />)}</div>} empty={<div className="px-6 py-12 text-center text-sm text-muted-foreground">{t('team.noPax')}</div>}>
        {(data) => (
          <DataTable
            rows={data}
            columns={cols}
            rowKey={(p) => p.phone}
            search={(p) => `${p.name} ${p.phone}`}
            searchPlaceholder={t('team.searchPax')}
            empty={t('team.noPax')}
          />
        )}
      </Async>
    </GlassCard>
  );
}
