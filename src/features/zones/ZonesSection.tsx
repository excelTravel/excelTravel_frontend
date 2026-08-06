import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Async } from '@/components/ui/async';
import { useZones, type ApiAdminZone } from '@/lib/api/hooks';
import { ZonesList } from './ZonesList';

// Rwanda's administrative geography (province → district → sector → cell), below the Live Map.
// Clicking any zone draws its polygon on the map above (see NetworkMap, which owns the selection and
// fetches that one zone's boundary on demand — this list itself never loads geometry, so browsing
// 2,600 zones stays cheap).
export function ZonesSection({ onSelectZone, selectedId }: { onSelectZone: (zone: ApiAdminZone) => void; selectedId: string | null }) {
  const { t } = useTranslation();
  const zonesQ = useZones();
  const total = zonesQ.data?.length ?? 0;

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-border p-5 pb-3">
        <h3 className="text-base font-semibold">{t('zones.title')}</h3>
        <p className="text-sm text-muted-foreground">{t('zones.subtitle')}</p>
      </div>
      <Async query={zonesQ} skeleton={<div className="space-y-2 p-5">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="shimmer h-9 rounded" />)}</div>}>
        {(zones) => <ZonesList zones={zones} maxHeight={420} onSelectZone={onSelectZone} selectedId={selectedId} />}
      </Async>
      {total > 0 && <p className="border-t border-border px-5 py-2.5 text-xs text-muted-foreground">{t('zones.totalCount', { count: total })}</p>}
    </Card>
  );
}
