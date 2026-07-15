import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image as ImageIcon, Check, X, ArrowRight, UserRound } from 'lucide-react';
import { GlassCard } from '@/components/ui/card';
import { StatusPill } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Field, Select } from '@/components/ui/form';
import { Reveal, RevealItem } from '@/components/motion/Motion';
import { cn } from '@/lib/utils';

// Aligned to the backend `incidents` module: GET /incidents, POST /{id}/approve { newVehicleId }, POST /{id}/reject.
// A driver reports an on-road accident (photo + description); ops approves (reassigns a bus) or rejects.
type IncidentStatus = 'pending' | 'approved' | 'rejected';
interface Incident {
  id: string;
  tripCode: string;
  route: string;
  driver: string;
  description: string;
  status: IncidentStatus;
  oldVehicle: string;
  newVehicle: string | null;
  when: string;
  hasPhoto: boolean;
}

const INITIAL: Incident[] = [
  { id: 'INC-3021', tripCode: 'TRP-8492', route: 'Kigali → Musanze', driver: 'Sarah Uwase', description: 'Rear-left tyre burst near Shyorongi; bus stopped safely, no injuries.', status: 'pending', oldVehicle: 'RAB 402 C', newVehicle: null, when: '22m ago', hasPhoto: true },
  { id: 'INC-3020', tripCode: 'TRP-8495', route: 'Kigali → Rubavu', driver: 'Patrick Habimana', description: 'Engine overheating warning; pulled over at Muhanga.', status: 'pending', oldVehicle: 'RAC 112 D', newVehicle: null, when: '48m ago', hasPhoto: false },
  { id: 'INC-3018', tripCode: 'TRP-8471', route: 'Kigali → Nyamata', driver: 'Eric Nkusi', description: 'Minor fender collision at Nyabugogo junction; no injuries.', status: 'approved', oldVehicle: 'RAG 014 B', newVehicle: 'RAE 027 B', when: '2h ago', hasPhoto: true },
  { id: 'INC-3009', tripCode: 'TRP-8455', route: 'Huye → Kigali', driver: 'M. Uwase', description: 'Windscreen crack reported; deemed non-critical, trip continued.', status: 'rejected', oldVehicle: 'RAH 009 A', newVehicle: null, when: '1d ago', hasPhoto: false },
];

const REPLACEMENTS = [
  { id: 'RAE 027 B', label: 'RAE 027 B · Coaster (idle)' },
  { id: 'RAF 051 C', label: 'RAF 051 C · Coach' },
  { id: 'RAD 088 A', label: 'RAD 088 A · Yutong' },
];

const FILTERS = ['all', 'pending', 'approved', 'rejected'] as const;

export function AccidentsPanel() {
  const { t } = useTranslation();
  const [incidents, setIncidents] = useState(INITIAL);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');
  const [approve, setApprove] = useState<Incident | null>(null);

  const rows = filter === 'all' ? incidents : incidents.filter((i) => i.status === filter);
  const count = (s: IncidentStatus) => incidents.filter((i) => i.status === s).length;

  function reject(id: string) {
    setIncidents((prev) => prev.map((i) => (i.id === id ? { ...i, status: 'rejected' } : i)));
  }
  function confirmApprove(id: string, newVehicle: string) {
    // POST /incidents/{id}/approve { newVehicleId } — stubbed.
    setIncidents((prev) => prev.map((i) => (i.id === id ? { ...i, status: 'approved', newVehicle } : i)));
    setApprove(null);
  }

  return (
    <div className="space-y-6">
      <ApproveModal incident={approve} onClose={() => setApprove(null)} onConfirm={confirmApprove} />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <MiniStat label={t('accidents.pending')} value={count('pending')} danger={count('pending') > 0} />
        <MiniStat label={t('accidents.approved')} value={count('approved')} />
        <MiniStat label={t('accidents.rejected')} value={count('rejected')} />
        <MiniStat label={t('accidents.total')} value={incidents.length} />
      </div>

      <div role="tablist" aria-label={t('accidents.title')} className="inline-flex flex-wrap gap-1 rounded-xl bg-secondary/60 p-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              filter === f ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t(`accidents.filter.${f}`)}
          </button>
        ))}
      </div>

      <Reveal className="grid gap-5 lg:grid-cols-2">
        {rows.map((inc) => (
          <RevealItem key={inc.id}>
            <GlassCard className="flex h-full gap-4 p-5">
              <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-secondary/50 text-muted-foreground">
                <ImageIcon className="size-6" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 font-semibold">{inc.tripCode}</p>
                    <p className="truncate text-xs text-muted-foreground">{inc.route}</p>
                  </div>
                  <StatusPill status={inc.status}>{t(`accidents.status.${inc.status}`)}</StatusPill>
                </div>
                <p className="mt-2 line-clamp-2 text-sm">{inc.description}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><UserRound className="size-3" /> {inc.driver}</span>
                  <span>· {inc.when}</span>
                  {inc.newVehicle && (
                    <span className="inline-flex items-center gap-1 font-medium text-foreground">
                      {inc.oldVehicle} <ArrowRight className="size-3" /> {inc.newVehicle}
                    </span>
                  )}
                </div>
                {inc.status === 'pending' && (
                  <div className="mt-3 flex gap-2 border-t border-border pt-3">
                    <Button size="sm" className="flex-1" onClick={() => setApprove(inc)}>
                      <Check className="size-4" /> {t('accidents.approve')}
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 text-destructive hover:text-destructive" onClick={() => reject(inc.id)}>
                      <X className="size-4" /> {t('accidents.reject')}
                    </Button>
                  </div>
                )}
              </div>
            </GlassCard>
          </RevealItem>
        ))}
      </Reveal>

      {rows.length === 0 && (
        <GlassCard className="p-10 text-center">
          <p className="text-sm font-medium">{t('accidents.emptyTitle')}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t('accidents.emptySub')}</p>
        </GlassCard>
      )}
    </div>
  );
}

function ApproveModal({ incident, onClose, onConfirm }: { incident: Incident | null; onClose: () => void; onConfirm: (id: string, v: string) => void }) {
  const { t } = useTranslation();
  const [vehicle, setVehicle] = useState('');
  if (!incident) return null;
  return (
    <Modal
      open={incident !== null}
      onClose={onClose}
      title={t('accidents.approveTitle')}
      description={t('accidents.approveSub')}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>{t('forms.cancel')}</Button>
          <Button disabled={!vehicle} onClick={() => onConfirm(incident.id, vehicle)}>
            <Check className="size-4" /> {t('accidents.approveReassign')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-secondary/40 p-3 text-sm">
          <p className="font-semibold">{incident.tripCode} · {incident.route}</p>
          <p className="mt-1 text-muted-foreground">{incident.description}</p>
        </div>
        <Field label={t('accidents.currentBus')}>
          <div className="flex h-10 items-center rounded-lg border border-input bg-secondary/40 px-3 text-sm">{incident.oldVehicle}</div>
        </Field>
        <Field label={t('accidents.replacementBus')} htmlFor="ap-vehicle" required>
          <Select id="ap-vehicle" value={vehicle} onChange={(e) => setVehicle(e.target.value)}>
            <option value="" disabled>{t('forms.selectVehicle')}</option>
            {REPLACEMENTS.map((r) => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </Select>
        </Field>
      </div>
    </Modal>
  );
}

function MiniStat({ label, value, danger }: { label: string; value: number; danger?: boolean }) {
  return (
    <GlassCard className="p-4">
      <p className={danger ? 'text-sm font-medium text-destructive' : 'text-sm font-medium text-muted-foreground'}>{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
    </GlassCard>
  );
}
