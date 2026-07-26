import { useTranslation } from 'react-i18next';
import { Wrench, Sparkles } from 'lucide-react';
import { GlassCard } from '@/components/ui/card';

// Maintenance management is deferred — a polished placeholder until it's built (if needed).
export function MaintenancePanel() {
  const { t } = useTranslation();
  return (
    <GlassCard className="relative overflow-hidden">
      <div className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-[hsl(var(--teal))]/10 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-20 -left-10 size-56 rounded-full bg-primary/10 blur-3xl" aria-hidden />
      <div className="relative grid place-items-center gap-4 px-6 py-16 text-center">
        <span className="grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-[hsl(var(--teal))] to-primary text-white shadow-lg">
          <Wrench className="size-7" />
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--teal))]/12 px-3 py-1 text-xs font-semibold text-[hsl(var(--teal))]">
          <Sparkles className="size-3.5" /> {t('maintenance.badge')}
        </span>
        <h3 className="text-2xl font-bold tracking-tight">{t('maintenance.comingSoon')}</h3>
        <p className="max-w-md text-sm text-muted-foreground">{t('maintenance.comingSoonSub')}</p>
      </div>
    </GlassCard>
  );
}
