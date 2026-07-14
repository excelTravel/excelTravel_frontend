import { useTranslation } from 'react-i18next';
import { Check, Truck, PackageCheck, ArrowRightLeft } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { StatusPill } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface ParcelLite {
  wb: string;
  sender: string;
  receiver: string;
  from: string;
  to: string;
  status: string;
}

// Journey = GET /packages/{id}.events[] (custody chain) + status. Canonical stages map to the custody
// actions POST /packages/{id}/hand-to-driver | /deliver | /collect. Stubbed timestamps until wired.
const STAGES = ['booking', 'sorting', 'inTransitStep', 'delivered', 'collected'] as const;
const STATUS_TO_STAGE: Record<string, number> = { pending: 0, at_hub: 1, in_transit: 2, delivered: 3, collected: 4 };
const STAGE_TIME = ['08:12', '08:40', '09:05', '—', '—'];

// The action available from the current stage → the backend endpoint it triggers.
const NEXT_ACTION: Record<number, { key: string; icon: typeof Truck } | undefined> = {
  0: { key: 'handToDriver', icon: Truck },
  1: { key: 'handToDriver', icon: Truck },
  2: { key: 'markDelivered', icon: PackageCheck },
  3: { key: 'collect', icon: Check },
};

export function ParcelJourneyModal({ parcel, open, onClose }: { parcel: ParcelLite | null; open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  if (!parcel) return null;
  const current = STATUS_TO_STAGE[parcel.status] ?? 0;
  const action = NEXT_ACTION[current];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('parcels.journey')}
      description={parcel.wb}
      footer={
        action ? (
          <>
            <Button variant="outline" onClick={onClose}>{t('forms.cancel')}</Button>
            <Button>
              <action.icon className="size-4" /> {t(`forms.${action.key}`)}
            </Button>
          </>
        ) : (
          <Button variant="outline" onClick={onClose}>{t('forms.close')}</Button>
        )
      }
    >
      <div className="space-y-5">
        {/* Sender → receiver + current status */}
        <div className="flex items-center justify-between rounded-xl bg-secondary/50 p-3">
          <div className="text-sm">
            <p className="font-medium">{parcel.sender} <span className="text-muted-foreground">→ {parcel.receiver}</span></p>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {parcel.from} <ArrowRightLeft className="size-3" /> {parcel.to}
            </p>
          </div>
          <StatusPill status={parcel.status} />
        </div>

        {/* Vertical stage timeline */}
        <ol className="relative">
          {STAGES.map((stage, i) => {
            const done = i < current;
            const isCurrent = i === current;
            return (
              <li key={stage} className="flex gap-3 pb-5 last:pb-0">
                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      'grid size-8 shrink-0 place-items-center rounded-full border-2',
                      done && 'border-primary bg-primary text-primary-foreground',
                      isCurrent && 'border-[hsl(var(--teal))] bg-[hsl(var(--teal))]/15 text-[hsl(var(--teal))]',
                      !done && !isCurrent && 'border-border bg-card text-muted-foreground',
                    )}
                  >
                    {done ? <Check className="size-4" /> : <span className="text-xs font-bold">{i + 1}</span>}
                  </span>
                  {i < STAGES.length - 1 && <span className={cn('w-0.5 flex-1', done ? 'bg-primary' : 'bg-border')} />}
                </div>
                <div className={cn('pt-1', !done && !isCurrent && 'opacity-60')}>
                  <p className="text-sm font-semibold leading-tight">{t(`parcels.${stage}`)}</p>
                  <p className="text-xs text-muted-foreground">
                    {isCurrent ? t('parcels.currentStage') : STAGE_TIME[i]}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </Modal>
  );
}
