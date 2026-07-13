import { useTranslation } from 'react-i18next';
import { AlertTriangle, Wrench, MoreVertical } from 'lucide-react';
import { GlassCard } from '@/components/ui/card';
import { StatusPill, Badge } from '@/components/ui/badge';
import { formatRWF } from '@/lib/utils';

// Stub maintenance records (Rwanda). Wired later to /maintenance.
interface Job {
  id: string;
  vehicle: string;
  type: string;
  priority: 'high' | 'medium' | 'low';
  status: string;
  due: string;
  cost: number;
}

const JOBS: Job[] = [
  { id: 'MT-2041', vehicle: 'RAE-27', type: 'Brake system', priority: 'high', status: 'overdue', due: '2d ago', cost: 320000 },
  { id: 'MT-2044', vehicle: 'RAC-112', type: 'Full service', priority: 'high', status: 'open', due: 'Today', cost: 180000 },
  { id: 'MT-2047', vehicle: 'RAF-51', type: 'Engine repair', priority: 'medium', status: 'in_progress', due: 'In progress', cost: 640000 },
  { id: 'MT-2050', vehicle: 'RAD-88', type: 'Tyre replacement', priority: 'low', status: 'scheduled', due: '12 Jul', cost: 220000 },
  { id: 'MT-2038', vehicle: 'RAB-402', type: 'Oil & filter', priority: 'low', status: 'done', due: 'Completed', cost: 95000 },
];

const priorityTone = { high: 'danger', medium: 'warning', low: 'neutral' } as const;

export function MaintenancePanel() {
  const { t } = useTranslation();
  const open = JOBS.filter((j) => j.status === 'open' || j.status === 'overdue').length;
  const inProgress = JOBS.filter((j) => j.status === 'in_progress').length;
  const overdue = JOBS.filter((j) => j.status === 'overdue').length;
  const monthCost = JOBS.reduce((s, j) => s + j.cost, 0);

  return (
    <div className="space-y-6">
      {/* Monitoring stat strip */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <MiniStat label={t('maintenance.open')} value={String(open)} />
        <MiniStat label={t('maintenance.inProgress')} value={String(inProgress)} />
        <MiniStat label={t('maintenance.overdue')} value={String(overdue)} danger />
        <MiniStat label={t('maintenance.monthCost')} value={formatRWF(monthCost)} />
      </div>

      {/* Overdue alert */}
      {overdue > 0 && (
        <GlassCard className="flex items-start gap-3 border-l-4 border-l-destructive p-4">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
          <div>
            <p className="text-sm font-semibold text-destructive">{t('maintenance.alertTitle', { count: overdue })}</p>
            <p className="text-sm text-muted-foreground">{t('maintenance.alertSub')}</p>
          </div>
        </GlassCard>
      )}

      {/* Records table */}
      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">{t('maintenance.colJob')}</th>
                <th className="px-5 py-3 font-medium">{t('maintenance.colVehicle')}</th>
                <th className="px-5 py-3 font-medium">{t('maintenance.colPriority')}</th>
                <th className="px-5 py-3 font-medium">{t('maintenance.colStatus')}</th>
                <th className="px-5 py-3 font-medium">{t('maintenance.colDue')}</th>
                <th className="px-5 py-3 text-right font-medium">{t('maintenance.colCost')}</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {JOBS.map((j) => (
                <tr key={j.id} className="transition-colors hover:bg-secondary/40">
                  <td className="whitespace-nowrap px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 place-items-center rounded-lg bg-secondary text-muted-foreground">
                        <Wrench className="size-4" />
                      </span>
                      <div>
                        <p className="font-medium">{j.type}</p>
                        <p className="text-xs text-muted-foreground">{j.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">{j.vehicle}</td>
                  <td className="px-5 py-3">
                    <Badge tone={priorityTone[j.priority]}>{t(`maintenance.priority.${j.priority}`)}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    <StatusPill status={j.status}>{t(`maintenance.state.${j.status}`)}</StatusPill>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">{j.due}</td>
                  <td className="whitespace-nowrap px-5 py-3 text-right font-semibold tabular-nums">{formatRWF(j.cost)}</td>
                  <td className="px-5 py-3 text-right">
                    <button type="button" aria-label={t('maintenance.actions')} className="text-muted-foreground hover:text-foreground">
                      <MoreVertical className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}

function MiniStat({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <GlassCard className="p-4">
      <p className={danger ? 'text-sm font-medium text-destructive' : 'text-sm font-medium text-muted-foreground'}>{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
    </GlassCard>
  );
}
