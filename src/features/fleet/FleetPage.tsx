import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Bus, Wrench, TriangleAlert } from 'lucide-react';
import { KpiCard } from '@/components/ui/kpi-card';
import { Reveal, RevealItem } from '@/components/motion/Motion';
import { cn } from '@/lib/utils';
import { useVehicles } from '@/lib/api/hooks';
import { VehiclesPanel } from './VehiclesPanel';
import { MaintenancePanel } from './MaintenancePanel';
import { AccidentsPanel } from './AccidentsPanel';

const TABS = [
  { key: 'vehicles', icon: Bus },
  { key: 'maintenance', icon: Wrench },
  { key: 'accidents', icon: TriangleAlert },
] as const;
type FleetTab = (typeof TABS)[number]['key'];

// Fleet management console — a stable fleet-wide KPI row, then sub-section tabs, then content. The cards
// and tab bar stay put when switching tabs (only the content below changes) so nothing shifts vertically.
// Drivers live in their own "Staff" section (src/features/staff/) — a people concern, not a vehicle one.
export function FleetPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<FleetTab>('vehicles');
  const vehiclesQ = useVehicles();
  const loading = vehiclesQ.isLoading;
  const vehicles = vehiclesQ.data ?? [];

  // One fixed set of cards across every sub-section — prevents layout shift when switching tabs.
  const cards = [
    { label: t('fleet.totalFleet'), value: vehicles.length },
    { label: t('fleet.activeNow'), value: vehicles.filter((v) => v.status === 'active').length },
    { label: t('fleet.openMaintenance'), value: vehicles.filter((v) => v.status === 'maintenance').length },
  ];

  return (
    <Reveal className="space-y-6">
      <RevealItem className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <KpiCard key={c.label} loading={loading} label={c.label} value={c.value.toLocaleString()} />
        ))}
      </RevealItem>

      <RevealItem className="overflow-x-auto">
        <div role="tablist" aria-label={t('fleet.consoleTitle')} className="inline-flex w-max gap-1 rounded-xl bg-secondary/60 p-1">
          {TABS.map((tb) => {
            const activeTab = tab === tb.key;
            return (
              <button
                key={tb.key}
                role="tab"
                aria-selected={activeTab}
                onClick={() => setTab(tb.key)}
                className={cn(
                  'relative inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                  activeTab ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {activeTab && (
                  <motion.span
                    layoutId="fleetTabIndicator"
                    className="absolute inset-0 rounded-lg bg-card shadow-sm"
                    transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <tb.icon className="size-4" /> {t(`fleet.tabs.${tb.key}`)}
                </span>
              </button>
            );
          })}
        </div>
      </RevealItem>

      <RevealItem>
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          {tab === 'vehicles' && <VehiclesPanel />}
          {tab === 'maintenance' && <MaintenancePanel />}
          {tab === 'accidents' && <AccidentsPanel />}
        </motion.div>
      </RevealItem>
    </Reveal>
  );
}
