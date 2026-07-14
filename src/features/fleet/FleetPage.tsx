import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Bus, Users, Wrench, Filter, Plus } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
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

// Fleet management console — vehicles, drivers and maintenance, aligned to the backend data model.
export function FleetPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<FleetTab>('vehicles');

  // One primary CTA, contextual to the active tab.
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
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            {tab === 'vehicles' && <VehiclesPanel />}
            {tab === 'drivers' && <DriversPanel />}
            {tab === 'maintenance' && <MaintenancePanel />}
          </motion.div>
        </AnimatePresence>
      </RevealItem>
    </Reveal>
  );
}
