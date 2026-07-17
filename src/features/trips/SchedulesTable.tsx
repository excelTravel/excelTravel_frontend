import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, CalendarClock, Pencil, Repeat, Snowflake, Play, Trash2, Plus } from 'lucide-react';
import { GlassCard } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, Thead, Th, Tbody, Td, Tr } from '@/components/ui/table';
import { RoutineModal } from './SchedulingModals';
import { ROUTINES } from './scheduling';
import { cn } from '@/lib/utils';

// Route schedules the ops manager manages: per-row edit / freeze / delete, plus multi-select so several
// routes can be set to recur at once. Freeze pauses a schedule without deleting it. Stubbed mutations.
export function SchedulesTable() {
  const { t } = useTranslation();
  const [addOpen, setAddOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [frozen, setFrozen] = useState<Set<string>>(new Set(ROUTINES.filter((r) => !r.active).map((r) => r.id)));

  const allSelected = selected.size === ROUTINES.length && ROUTINES.length > 0;
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(ROUTINES.map((r) => r.id)));
  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleFreeze = (id: string) =>
    setFrozen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <GlassCard className="overflow-hidden">
      <RoutineModal open={addOpen} onClose={() => setAddOpen(false)} />
      <div className="flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold"><CalendarClock className="size-4" /> {t('schedules.title')}</h3>
          <p className="text-sm text-muted-foreground">{t('schedules.sub')}</p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}><Plus className="size-4" /> {t('schedules.add')}</Button>
      </div>

      {/* Bulk action bar — only when routes are selected */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-y border-border bg-teal/5 px-5 py-2.5">
          <span className="text-sm font-medium">{t('schedules.selected', { n: selected.size })}</span>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setSelected(new Set())}><Repeat className="size-4" /> {t('schedules.recurSelected')}</Button>
            <Button size="sm" variant="outline" onClick={() => setSelected(new Set())}>{t('schedules.clear')}</Button>
          </div>
        </div>
      )}

      <Table>
        <Thead>
          <Th className="w-10">
            <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label={t('schedules.selectAll')}
              className="size-4 rounded border-border accent-[hsl(var(--primary))]" />
          </Th>
          <Th>{t('sched.colRoute')}</Th>
          <Th>{t('sched.colFrequency')}</Th>
          <Th>{t('sched.colTimes')}</Th>
          <Th>{t('sched.colBus')}</Th>
          <Th>{t('sched.colStatus')}</Th>
          <Th className="text-right">{t('schedules.colActions')}</Th>
        </Thead>
        <Tbody>
          {ROUTINES.map((r) => {
            const isFrozen = frozen.has(r.id);
            const isSel = selected.has(r.id);
            return (
              <Tr key={r.id} className={cn(isSel && 'bg-teal/5')}>
                <Td className="w-10">
                  <input type="checkbox" checked={isSel} onChange={() => toggleOne(r.id)} aria-label={`${r.from} ${r.to}`}
                    className="size-4 rounded border-border accent-[hsl(var(--primary))]" />
                </Td>
                <Td className="whitespace-nowrap">
                  <span className="flex items-center gap-2 font-medium">{r.from} <ArrowRight className="size-3.5 text-muted-foreground" /> {r.to}</span>
                </Td>
                <Td className="whitespace-nowrap text-muted-foreground">{t(`sched.freq.${r.frequency}`)}</Td>
                <Td className="whitespace-nowrap tabular-nums">{r.times.join(' · ')}</Td>
                <Td className="whitespace-nowrap text-muted-foreground">{r.bus}</Td>
                <Td>
                  <Badge tone={isFrozen ? 'neutral' : 'success'}>{isFrozen ? t('schedules.frozen') : t('sched.active')}</Badge>
                </Td>
                <Td className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <IconBtn label={t('schedules.edit')} onClick={() => {}}><Pencil className="size-4" /></IconBtn>
                    <IconBtn label={isFrozen ? t('schedules.unfreeze') : t('schedules.freeze')} onClick={() => toggleFreeze(r.id)} active={isFrozen}>
                      {isFrozen ? <Play className="size-4" /> : <Snowflake className="size-4" />}
                    </IconBtn>
                    <IconBtn label={t('schedules.delete')} onClick={() => {}} danger><Trash2 className="size-4" /></IconBtn>
                  </div>
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </GlassCard>
  );
}

function IconBtn({ label, onClick, children, danger, active }: { label: string; onClick: () => void; children: React.ReactNode; danger?: boolean; active?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        'grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground',
        danger && 'hover:bg-destructive/10 hover:text-destructive',
        active && 'text-teal',
      )}
    >
      {children}
    </button>
  );
}
