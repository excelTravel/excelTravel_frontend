import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowRightLeft,
  CheckCheck,
  CheckCircle2,
  ChevronRight,
  Filter,
  Route as RouteIcon,
  Package,
  Tag,
  Truck,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/card';
import { KpiCard } from '@/components/ui/kpi-card';
import { StatusPill } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDateRange } from '@/store/dateRange';
import { Reveal, RevealItem } from '@/components/motion/Motion';
import { ParcelJourneyModal, type ParcelLite } from './ParcelJourneyModal';
import { UpdatePricingModal } from './UpdatePricingModal';
import { cn } from '@/lib/utils';

// Stub data (Rwanda). Wired later to /packages (custody chain) + ops pricing (setFee).
const manifest = [
  { wb: 'WB-99210', note: 'Exp 08:30 · Trip #402', sender: 'K. Mugabo', receiver: 'J. Mutoni', from: 'Kigali', to: 'Musanze', weight: '12.5 kg', status: 'in_transit' },
  { wb: 'WB-99214', note: 'Late scan', sender: 'P. Habimana', receiver: 'S. Karekezi', from: 'Kigali', to: 'Rubavu', weight: '4.2 kg', status: 'at_hub' },
  { wb: 'WB-99220', note: 'Exp 10:45 · Trip #408', sender: 'M. Umutoni', receiver: 'C. Ngabo', from: 'Kigali', to: 'Huye', weight: '25.0 kg', status: 'pending' },
];

export function ParcelsPage() {
  const { t } = useTranslation();
  const [journey, setJourney] = useState<ParcelLite | null>(null);
  const [pricingOpen, setPricingOpen] = useState(false);
  const preset = useDateRange((s) => s.preset);
  const compare = t(`range.compare.${preset}`);

  const steps = [
    { icon: CheckCircle2, label: t('parcels.booking'), meta: t('parcels.flowNew', { n: 248 }), done: true },
    { icon: Package, label: t('parcels.sorting'), meta: t('parcels.flowSorting', { n: 85 }), done: true },
    { icon: Truck, label: t('parcels.inTransitStep'), meta: t('parcels.flowTrucks', { n: 12 }), done: true },
    { icon: CheckCheck, label: t('parcels.delivered'), meta: t('parcels.flowToday', { n: 0 }), done: false },
  ];

  return (
    <Reveal className="space-y-6">
      <ParcelJourneyModal parcel={journey} open={journey !== null} onClose={() => setJourney(null)} />
      <UpdatePricingModal open={pricingOpen} onClose={() => setPricingOpen(false)} />
      {/* KPI row */}
      <RevealItem className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label={t('parcels.mostRoutes')} value="10" unit={t('parcels.parcels')} badge={{ text: 'KGL — MUS', tone: 'teal' }} />
        <KpiCard label={t('parcels.revenueDaily')} value="4,250K" unit="RWF" delta={{ value: '+12.5%', direction: 'up', comparison: compare }} />
        <KpiCard label={t('parcels.inTransit')} value="1,245" />
        <KpiCard label={t('parcels.delayed')} value="18" tone="danger" badge={{ text: t('parcels.criticalAlerts'), tone: 'danger' }} />
      </RevealItem>

      {/* Live logistics flow */}
      <RevealItem>
      <GlassCard className="p-6">
        <h3 className="text-base font-semibold">{t('parcels.logisticsFlow')}</h3>
        <div className="mt-8 flex items-start">
          {steps.map((s, i) => (
            <div key={s.label} className="relative flex flex-1 flex-col items-center text-center">
              {i < steps.length - 1 && (
                <div className={cn('absolute left-1/2 top-6 h-0.5 w-full', s.done ? 'bg-primary' : 'bg-border')} aria-hidden />
              )}
              <div
                className={cn(
                  'relative z-10 grid size-12 place-items-center rounded-full',
                  s.done ? 'bg-primary text-primary-foreground' : 'border-2 border-border bg-card text-muted-foreground',
                )}
              >
                <s.icon className="size-5" />
              </div>
              <p className="mt-2 text-sm font-semibold">{s.label}</p>
              <p className="text-xs text-muted-foreground">{s.meta}</p>
            </div>
          ))}
        </div>
      </GlassCard>
      </RevealItem>

      {/* Manifest + pricing */}
      <RevealItem className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <GlassCard className="overflow-hidden xl:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 p-5">
            <h3 className="flex items-center gap-2 text-base font-semibold">
              <Package className="size-4" /> {t('parcels.masterManifest')}
              <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold uppercase text-success">
                {t('parcels.live')}
              </span>
            </h3>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Filter className="size-4" /> {t('parcels.filter')}
              </Button>
              <Button size="sm">
                <Tag className="size-4" /> {t('parcels.bulkLabels')}
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-y border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <input type="checkbox" className="size-4 rounded border-border accent-[hsl(var(--primary))]" aria-label="Select all" />
                  </th>
                  <th className="px-4 py-3 font-medium">{t('parcels.colWaybill')}</th>
                  <th className="px-4 py-3 font-medium">{t('parcels.colSenderReceiver')}</th>
                  <th className="px-4 py-3 font-medium">{t('parcels.colRoute')}</th>
                  <th className="px-4 py-3 font-medium">{t('parcels.colWeight')}</th>
                  <th className="px-4 py-3 font-medium">{t('parcels.colStatus')}</th>
                  <th className="px-4 py-3 font-medium">{t('parcels.colAction')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {manifest.map((p) => (
                  <tr key={p.wb} className="transition-colors hover:bg-secondary/40">
                    <td className="px-4 py-3">
                      <input type="checkbox" className="size-4 rounded border-border accent-[hsl(var(--primary))]" aria-label={`Select ${p.wb}`} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <p className="font-semibold">{p.wb}</p>
                      <p className="text-xs text-muted-foreground">{p.note}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <p className="font-medium">{p.sender}</p>
                      <p className="text-xs text-muted-foreground">→ {p.receiver}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        {p.from} <ArrowRightLeft className="size-3.5" /> {p.to}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums">{p.weight}</td>
                    <td className="px-4 py-3">
                      <StatusPill status={p.status} />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setJourney({ wb: p.wb, sender: p.sender, receiver: p.receiver, from: p.from, to: p.to, status: p.status })}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                      >
                        <RouteIcon className="size-3.5" /> {t('parcels.viewJourney')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-5">
            <p className="text-sm text-muted-foreground">{t('parcels.showing', { shown: 25, total: '1,245' })}</p>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">{t('parcels.pricingMatrix')}</h3>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t('parcels.base')}
            </span>
          </div>
          <div className="mt-4 space-y-3">
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-xl bg-secondary/50 p-4 text-left transition-colors hover:bg-secondary"
            >
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('parcels.baseFee')}
                </p>
                <p className="text-xl font-bold tabular-nums">
                  1,200 <span className="text-sm font-normal text-muted-foreground">RWF</span>
                </p>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </button>
            <div className="rounded-xl bg-secondary/50 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {t('parcels.wtSurcharge')}
              </p>
              <p className="text-xl font-bold tabular-nums">
                500 <span className="text-sm font-normal text-muted-foreground">/kg</span>
              </p>
            </div>
          </div>
          <Button className="mt-4 w-full" onClick={() => setPricingOpen(true)}>{t('parcels.updatePricing')}</Button>
        </GlassCard>
      </RevealItem>
    </Reveal>
  );
}
