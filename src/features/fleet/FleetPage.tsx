import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bus, Users, Wrench, Filter, Plus } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { KpiCard } from '@/components/ui/kpi-card';
import { Reveal, RevealItem } from '@/components/motion/Motion';
import { cn } from '@/lib/utils';
import { VehiclesPanel } from './VehiclesPanel';
import { DriversPanel } from './DriversPanel';
import { MaintenancePanel } from './MaintenancePanel';

const TABS = [
  { key: 'vehicles', icon: Bus },
  { key: 'drivers', icon: Users },
  { key: 'maintenance', icon: Wrench },
] as const;
type FleetTab = (typeof TABS)[number]['key'];

// Fleet management console — vehicles, drivers (schedules/shifts/assignment), and maintenance in one place.
export function FleetPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<FleetTab>('vehicles');

  // The primary CTA is contextual to the active tab (one primary action per screen).
  const primaryLabel: Record<FleetTab, string> = {
    vehicles: t('fleet.addVehicle'),
    drivers: t('drivers.add'),
    maintenance: t('maintenance.log'),
  };

  return (
    <Reveal className="space-y-6">
      <RevealItem>
        <PageHeader
          title={t('fleet.consoleTitle')}
          subtitle={t('fleet.consoleSub')}
          actions={
            <>
              <Button variant="outline" size="sm">
                <Filter className="size-4" /> {t('fleet.filter')}
              </Button>
              <Button size="sm">
                <Plus className="size-4" /> {primaryLabel[tab]}
              </Button>
            </>
          }
        />
      </RevealItem>

      <RevealItem className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label={t('fleet.totalFleet')} value="142" delta={{ value: '+2%', direction: 'up' }} />
        <KpiCard label={t('fleet.activeDrivers')} value="96" />
        <KpiCard label={t('fleet.openMaintenance')} value="12" tone="danger" badge={{ text: t('fleet.actionRequired'), tone: 'danger' }} />
        <KpiCard label={t('fleet.utilization')} value="87%" badge={{ text: t('fleet.optimal'), tone: 'success' }} />
      </RevealItem>

      <RevealItem>
        <div role="tablist" aria-label={t('fleet.consoleTitle')} className="inline-flex flex-wrap gap-1 rounded-xl bg-secondary/60 p-1">
          {TABS.map((tb) => (
            <button
              key={tb.key}
              role="tab"
              aria-selected={tab === tb.key}
              onClick={() => setTab(tb.key)}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                tab === tb.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <tb.icon className="size-4" /> {t(`fleet.tabs.${tb.key}`)}
            </button>
          ))}
        </div>
      </RevealItem>

      <RevealItem>
        {tab === 'vehicles' && <VehiclesPanel />}
        {tab === 'drivers' && <DriversPanel />}
        {tab === 'maintenance' && <MaintenancePanel />}
      </RevealItem>
    </Reveal>
  );
}
