import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, CalendarClock, Snowflake, Play, Trash2, Plus, CalendarRange } from 'lucide-react';
import { GlassCard } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Field, Input } from '@/components/ui/form';
import { Table, Thead, Th, Tbody, Td, Tr } from '@/components/ui/table';
import { Async } from '@/components/ui/async';
import { RoutineModal } from './SchedulingModals';
import { useTripTemplates, useRoutes, useUpdateTemplate, useDeleteTemplate, useGenerateTrips, type ApiTripTemplate } from '@/lib/api/hooks';
import { cn } from '@/lib/utils';

// Live route schedules (trip templates). Per-row: generate trips over a date range, freeze/unfreeze (active),
// delete. Add opens the routine modal (POST /trip-templates).
export function SchedulesTable() {
  const { t } = useTranslation();
  const templatesQ = useTripTemplates();
  const routesQ = useRoutes();
  const update = useUpdateTemplate();
  const del = useDeleteTemplate();
  const [addOpen, setAddOpen] = useState(false);
  const [generateFor, setGenerateFor] = useState<ApiTripTemplate | null>(null);

  const routeName = useMemo(() => {
    const m = new Map((routesQ.data ?? []).map((r) => [r.id, `${r.origin} → ${r.destination}`]));
    return (id: string) => m.get(id) ?? id;
  }, [routesQ.data]);

  return (
    <GlassCard className="overflow-hidden">
      <RoutineModal open={addOpen} onClose={() => setAddOpen(false)} />
      <GenerateModal template={generateFor} routeName={generateFor ? routeName(generateFor.routeId) : ''} onClose={() => setGenerateFor(null)} />
      <div className="flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold"><CalendarClock className="size-4" /> {t('schedules.title')}</h3>
          <p className="text-sm text-muted-foreground">{t('schedules.sub')}</p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}><Plus className="size-4" /> {t('schedules.add')}</Button>
      </div>

      <Async
        query={templatesQ}
        isEmpty={(d) => d.length === 0}
        skeleton={<div className="space-y-2 p-5">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="shimmer h-9 rounded" />)}</div>}
        empty={<div className="px-6 py-12 text-center text-sm text-muted-foreground">{t('schedules.empty')}</div>}
      >
        {(templates) => (
          <Table>
            <Thead>
              <Th>{t('sched.colRoute')}</Th>
              <Th>{t('sched.colFrequency')}</Th>
              <Th>{t('sched.colTimes')}</Th>
              <Th>{t('sched.colStatus')}</Th>
              <Th className="text-right">{t('schedules.colActions')}</Th>
            </Thead>
            <Tbody>
              {templates.map((tpl) => (
                <Tr key={tpl.id}>
                  <Td className="whitespace-nowrap">
                    <span className="flex items-center gap-2 font-medium">{routeName(tpl.routeId).replace(' → ', ' ')} <ArrowRight className="size-3.5 text-muted-foreground" /></span>
                  </Td>
                  <Td className="whitespace-nowrap text-muted-foreground">{t(`sched.freq.${tpl.frequency}`, tpl.frequency)}</Td>
                  <Td className="whitespace-nowrap tabular-nums">{tpl.departureTimes.join(' · ')}</Td>
                  <Td><Badge tone={tpl.active ? 'success' : 'neutral'}>{tpl.active ? t('sched.active') : t('schedules.frozen')}</Badge></Td>
                  <Td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <IconBtn label={t('schedules.generate')} onClick={() => setGenerateFor(tpl)}><CalendarRange className="size-4" /></IconBtn>
                      <IconBtn
                        label={tpl.active ? t('schedules.freeze') : t('schedules.unfreeze')}
                        active={!tpl.active}
                        onClick={() => update.mutate({ id: tpl.id, active: !tpl.active })}
                      >
                        {tpl.active ? <Snowflake className="size-4" /> : <Play className="size-4" />}
                      </IconBtn>
                      <IconBtn
                        label={t('schedules.delete')}
                        danger
                        onClick={() => { if (window.confirm(t('schedules.deleteConfirm'))) del.mutate({ id: tpl.id }); }}
                      >
                        <Trash2 className="size-4" />
                      </IconBtn>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Async>
    </GlassCard>
  );
}

// Materialize trips from a template over a date range → POST /trip-templates/:id/generate.
function GenerateModal({ template, routeName, onClose }: { template: ApiTripTemplate | null; routeName: string; onClose: () => void }) {
  const { t } = useTranslation();
  const generate = useGenerateTrips();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const result = generate.data;

  function close() { setFrom(''); setTo(''); setErr(null); generate.reset(); onClose(); }
  function go() {
    setErr(null);
    if (!from || !to || from > to) { setErr(t('schedules.rangeInvalid')); return; }
    generate.mutate({ id: template!.id, from, to }, { onError: (e) => setErr(e instanceof Error ? e.message : t('schedules.rangeInvalid')) });
  }
  if (!template) return null;

  return (
    <Modal
      open={template !== null}
      onClose={close}
      title={t('schedules.generateTitle')}
      description={routeName}
      footer={<><Button variant="outline" onClick={close}>{t('forms.close')}</Button><Button onClick={go} disabled={generate.isPending}>{generate.isPending ? t('forms.saving') : t('schedules.generate')}</Button></>}
    >
      <div className="space-y-4">
        {err && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{err}</p>}
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('schedules.from')} htmlFor="g-from" required><Input id="g-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
          <Field label={t('schedules.to')} htmlFor="g-to" required><Input id="g-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} /></Field>
        </div>
        {result && (
          <p className="rounded-lg bg-success/10 p-3 text-sm text-success">
            <span className="font-medium">{t('schedules.generated', { created: result.created, skipped: result.skipped })}</span>{' '}
            {t('schedules.generatedHint')}
          </p>
        )}
      </div>
    </Modal>
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
