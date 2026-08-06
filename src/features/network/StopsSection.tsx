import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusPill } from '@/components/ui/badge';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Async } from '@/components/ui/async';
import { useStops, type ApiStop } from '@/lib/api/hooks';
import { AddStationModal, AddStopModal, EditStopModal } from './NetworkModals';

// Stops & stations — every physical location the company serves (stations = boarding hubs, stops = pickup
// points under a parent station). Lives on the Live Map, beside Administrative geography (both are
// location reference data, not route config — routes only link to stops, they don't own them).
export function StopsSection() {
  const { t } = useTranslation();
  const stopsQ = useStops();
  const stops = stopsQ.data ?? [];
  const [addStation, setAddStation] = useState(false);
  const [addStop, setAddStop] = useState(false);
  const [editStop, setEditStop] = useState<ApiStop | null>(null);

  const nameById = (id: string | null) => (id ? stops.find((s) => s.id === id)?.name ?? '—' : '—');

  const cols: Column<ApiStop>[] = [
    { key: 'name', header: t('network.colName'), cell: (s) => <span className="font-medium">{s.name}</span>, sort: (s) => s.name, td: 'whitespace-nowrap' },
    { key: 'type', header: t('network.colType'), cell: (s) => <StatusPill status={s.type === 'station' ? 'active' : 'idle'}>{t(`network.${s.type}`)}</StatusPill>, filter: (s) => s.type },
    { key: 'parent', header: t('network.colParent'), cell: (s) => nameById(s.parentStationId), filter: (s) => nameById(s.parentStationId), td: 'whitespace-nowrap text-muted-foreground' },
    { key: 'phone', header: t('network.colPhone'), cell: (s) => s.phone ?? '—', td: 'whitespace-nowrap text-muted-foreground' },
  ];

  return (
    <Card className="overflow-hidden">
      <AddStationModal open={addStation} onClose={() => setAddStation(false)} />
      <AddStopModal open={addStop} onClose={() => setAddStop(false)} />
      <EditStopModal stop={editStop} open={editStop !== null} onClose={() => setEditStop(null)} />
      <div className="border-b border-border p-5 pb-3">
        <h3 className="text-base font-semibold">{t('network.tabs.stops')}</h3>
      </div>
      <Async query={stopsQ} skeleton={<div className="space-y-2 p-5">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="shimmer h-9 rounded" />)}</div>}>
        {(data) => (
          <DataTable
            rows={data}
            columns={cols}
            rowKey={(s) => s.id}
            onRowClick={(s) => setEditStop(s)}
            search={(s) => s.name}
            searchPlaceholder={t('routesMgmt.searchStops')}
            empty={t('network.noStops')}
            filtersInline
            toolbarRight={
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setAddStation(true)}><Plus className="size-4" /> {t('network.addStation')}</Button>
                <Button size="sm" onClick={() => setAddStop(true)}><Plus className="size-4" /> {t('network.addStop')}</Button>
              </div>
            }
          />
        )}
      </Async>
    </Card>
  );
}
