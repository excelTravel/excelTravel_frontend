import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Bus, Users, Wrench, TriangleAlert } from 'lucide-react';
import { KpiCard } from '@/components/ui/kpi-card';
import { Reveal, RevealItem } from '@/components/motion/Motion';
import { cn } from '@/lib/utils';
import { VehiclesPanel } from './VehiclesPanel';
import { DriversPanel } from './DriversPanel';
import { MaintenancePanel } from './MaintenancePanel';
import { AccidentsPanel } from './AccidentsPanel';
import { FLEET_SUMMARY } from './data';

const TABS = [
  { key: 'vehicles', icon: Bus },
  { key: 'drivers', icon: Users },
  { key: 'maintenance', icon: Wrench },
  { key: 'accidents', icon: TriangleAlert },
] as const;
type FleetTab = (typeof TABS)[number]['key'];

// Fleet management console — a stable fleet-wide KPI row, then sub-section tabs, then content. The cards
// and tab bar stay put when switching tabs (only the content below changes) so nothing shifts vertically.
export function FleetPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<FleetTab>('vehicles');
  const s = FLEET_SUMMARY;

  // One fixed set of cards across every sub-section — prevents layout shift when switching tabs.
  const cards = [
    { label: t('fleet.totalFleet'), value: s.total },
    { label: t('fleet.activeNow'), value: s.active },
    { label: t('fleet.totalDrivers'), value: s.totalDrivers },
    { label: t('fleet.openMaintenance'), value: s.maintenance },
  ];

  return (
    <Reveal className="space-y-6">
      <RevealItem className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {cards.map((c) => (
          <KpiCard key={c.label} label={c.label} value={c.value.toLocaleString()} />
        ))}
      </RevealItem>

      <RevealItem>
        <div role="tablist" aria-label={t('fleet.consoleTitle')} className="inline-flex gap-1 rounded-xl bg-secondary/60 p-1">
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
          {tab === 'drivers' && <DriversPanel />}
          {tab === 'maintenance' && <MaintenancePanel />}
          {tab === 'accidents' && <AccidentsPanel />}
        </motion.div>
      </RevealItem>
    </Reveal>
  );
}
