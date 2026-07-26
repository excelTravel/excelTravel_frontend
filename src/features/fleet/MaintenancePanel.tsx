import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Wrench } from 'lucide-react';
import { GlassCard } from '@/components/ui/card';
import { KpiCard } from '@/components/ui/kpi-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Async } from '@/components/ui/async';
import { Reveal, RevealItem } from '@/components/motion/Motion';
import { useMaintenanceLogs, useVehicles, type ApiMaintenanceLog } from '@/lib/api/hooks';
import { maintenanceStatus } from '@/lib/fleetStatus';
import { formatRWF } from '@/lib/utils';
import { LogMaintenanceModal } from './LogMaintenanceModal';

const dateFmt = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

export function MaintenancePanel() {
  const { t } = useTranslation();
  const logsQ = useMaintenanceLogs();
  const vehiclesQ = useVehicles();
  const [logOpen, setLogOpen] = useState(false);

  const logs = logsQ.data ?? [];
  const vehicles = vehiclesQ.data ?? [];
  const plateById = (id: string) => vehicles.find((v) => v.id === id)?.plateNumber ?? '—';

  // Newest log per vehicle drives the "how many are due/overdue right now" KPI.
  const latestByVehicle = new Map<string, ApiMaintenanceLog>();
  for (const log of [...logs].sort((a, b) => b.performedAt.localeCompare(a.performedAt))) {
    if (!latestByVehicle.has(log.vehicleId)) latestByVehicle.set(log.vehicleId, log);
  }
  const dueSoon = [...latestByVehicle.values()].filter((l) => maintenanceStatus(l.nextServiceDate).tone === 'warning').length;
  const overdue = [...latestByVehicle.values()].filter((l) => maintenanceStatus(l.nextServiceDate).tone === 'danger').length;
  const totalCost = logs.reduce((sum, l) => sum + (l.cost ?? 0), 0);

  const cols: Column<ApiMaintenanceLog>[] = [
    {
      key: 'vehicle', header: t('vehicles.colVehicle'), sort: (l) => plateById(l.vehicleId), filter: (l) => plateById(l.vehicleId),
      cell: (l) => <span className="font-semibold">{plateById(l.vehicleId)}</span>, td: 'whitespace-nowrap',
    },
    { key: 'serviceType', header: t('maintenance.serviceType'), cell: (l) => l.serviceType, sort: (l) => l.serviceType },
    { key: 'performedAt', header: t('maintenance.performedAt'), cell: (l) => dateFmt.format(new Date(l.performedAt)), sort: (l) => l.performedAt, td: 'whitespace-nowrap tabular-nums text-muted-foreground' },
    { key: 'cost', header: t('maintenance.cost'), align: 'right', cell: (l) => (l.cost != null ? formatRWF(l.cost) : '—'), sort: (l) => l.cost ?? 0, td: 'whitespace-nowrap tabular-nums' },
    { key: 'odometer', header: t('vehicles.odometer'), align: 'right', cell: (l) => (l.odometerKm != null ? l.odometerKm.toLocaleString() : '—'), sort: (l) => l.odometerKm ?? 0, td: 'whitespace-nowrap tabular-nums text-muted-foreground' },
    {
      key: 'next', header: t('vehicles.nextMaintenance'),
      cell: (l) => {
        const s = maintenanceStatus(l.nextServiceDate);
        return (
          <div className="flex items-center gap-2">
            <span>{l.nextServiceDate ? dateFmt.format(new Date(l.nextServiceDate)) : '—'}</span>
            {l.nextServiceDate && <Badge tone={s.tone === 'danger' ? 'danger' : s.tone === 'warning' ? 'warning' : 'success'}>{t(`maintenance.urgency.${s.tone}`)}</Badge>}
          </div>
        );
      },
      td: 'whitespace-nowrap',
    },
  ];

  return (
    <Reveal className="space-y-6">
      <LogMaintenanceModal open={logOpen} onClose={() => setLogOpen(false)} />

      <RevealItem className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard loading={logsQ.isLoading} label={t('maintenance.totalLogs')} value={logs.length.toLocaleString()} />
        <KpiCard loading={logsQ.isLoading} label={t('maintenance.dueSoon')} value={dueSoon.toLocaleString()} />
        <KpiCard loading={logsQ.isLoading} label={t('maintenance.overdue')} value={overdue.toLocaleString()} />
        <KpiCard loading={logsQ.isLoading} label={t('maintenance.totalCost')} value={formatRWF(totalCost)} />
      </RevealItem>

      <RevealItem>
        <GlassCard className="overflow-hidden">
          <div className="border-b border-border p-5 pb-3">
            <h3 className="flex items-center gap-2 text-base font-semibold"><Wrench className="size-4" /> {t('maintenance.title')}</h3>
          </div>
          <Async
            query={logsQ}
            isEmpty={(d) => d.length === 0}
            skeleton={<div className="space-y-2 p-5">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="shimmer h-9 rounded" />)}</div>}
            empty={<div className="grid place-items-center gap-2 px-6 py-16 text-center"><Wrench className="size-8 text-muted-foreground" /><p className="text-sm text-muted-foreground">{t('maintenance.empty')}</p></div>}
          >
            {(data) => (
              <DataTable
                rows={data}
                columns={cols}
                rowKey={(l) => l.id}
                search={(l) => `${plateById(l.vehicleId)} ${l.serviceType}`}
                searchPlaceholder={t('maintenance.search')}
                filtersInline
                toolbarRight={<Button size="sm" onClick={() => setLogOpen(true)}><Plus className="size-4" /> {t('maintenance.logMaintenance')}</Button>}
              />
            )}
          </Async>
        </GlassCard>
      </RevealItem>
    </Reveal>
  );
}
