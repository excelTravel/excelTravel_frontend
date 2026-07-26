import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarRange, AlertTriangle } from 'lucide-react';
import { GlassCard } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { useSession } from '@/lib/auth/session';
import { useCompanies, useDrivers, useDriverShifts, useSetDriverShift, useDeleteDriverShift, type ApiDriverShift } from '@/lib/api/hooks';

const WEEK_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
const DEFAULT_WEEKLY_CAP = 48; // fallback fair-work ceiling when the company hasn't set one yet
const MANAGERS = new Set(['super_admin', 'company_admin', 'manager']);

function minutesOf(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}
function shiftHours(s: ApiDriverShift): number {
  return (minutesOf(s.endTime) - minutesOf(s.startTime)) / 60;
}

type Load = 'off' | 'ok' | 'high' | 'over';
function loadOf(hours: number, cap: number): Load {
  if (hours === 0) return 'off';
  if (hours > cap) return 'over';
  if (hours >= cap * 0.8) return 'high';
  return 'ok';
}
const LOAD_COLOR: Record<Load, string> = {
  off: 'bg-muted-foreground/40',
  ok: 'bg-teal',
  high: 'bg-warning',
  over: 'bg-destructive',
};
const LOAD_TEXT: Record<Load, string> = {
  off: 'text-muted-foreground',
  ok: 'text-teal',
  high: 'text-warning',
  over: 'text-destructive',
};

export function DriverScheduling() {
  const { t } = useTranslation();
  const sessionUser = useSession((s) => s.user);
  const canEdit = MANAGERS.has(sessionUser?.role ?? '');
  const driversQ = useDrivers();
  const shiftsQ = useDriverShifts();
  const companiesQ = useCompanies();
  const myCompany = companiesQ.data?.find((c) => c.id === sessionUser?.companyId);
  const cap = myCompany?.driverWeeklyHourCap ?? DEFAULT_WEEKLY_CAP;

  const [editCell, setEditCell] = useState<{ driverId: string; driverName: string; dayOfWeek: number; existing: ApiDriverShift | null } | null>(null);

  const drivers = driversQ.data ?? [];
  const shifts = shiftsQ.data ?? [];
  const shiftsByDriver = new Map<string, ApiDriverShift[]>();
  for (const s of shifts) {
    const list = shiftsByDriver.get(s.driverId) ?? [];
    list.push(s);
    shiftsByDriver.set(s.driverId, list);
  }
  const weeklyHours = (driverId: string) => (shiftsByDriver.get(driverId) ?? []).reduce((sum, s) => sum + shiftHours(s), 0);

  const hours = drivers.map((d) => ({ d, h: weeklyHours(d.id) }));
  const working = hours.filter((x) => x.h > 0);
  const avg = working.length ? Math.round(working.reduce((s, x) => s + x.h, 0) / working.length) : 0;
  const overCap = hours.filter((x) => x.h > cap).length;
  const offWeek = hours.filter((x) => x.h === 0).length;

  return (
    <GlassCard className="p-6">
      <ShiftEditModal cell={editCell} onClose={() => setEditCell(null)} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold">
            <CalendarRange className="size-4" /> {t('drivers.rosterTitle')}
          </h3>
          <p className="text-sm text-muted-foreground">{t('drivers.rosterSub')}</p>
        </div>
        {overCap > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
            <AlertTriangle className="size-3.5" /> {t('drivers.overCapAlert', { count: overCap })}
          </span>
        )}
      </div>

      {/* Fairness strip */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label={t('drivers.avgHours')} value={`${avg}h`} />
        <MiniStat label={t('drivers.capLabel')} value={`${cap}h`} />
        <MiniStat label={t('drivers.overCap')} value={String(overCap)} danger={overCap > 0} />
        <MiniStat label={t('drivers.offWeek')} value={String(offWeek)} />
      </div>

      {/* Weekly roster grid */}
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[720px] border-separate border-spacing-y-1 text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-2 pb-2 text-left font-medium">{t('drivers.colDriver')}</th>
              {WEEK_DAYS.map((day) => (
                <th key={day} className="px-1 pb-2 text-center font-medium">{t(`analytics.day.${day}`)}</th>
              ))}
              <th className="px-2 pb-2 text-right font-medium">{t('drivers.colTotal')}</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((d) => {
              const driverShifts = shiftsByDriver.get(d.id) ?? [];
              const h = weeklyHours(d.id);
              const load = loadOf(h, cap);
              return (
                <tr key={d.id}>
                  <td className="whitespace-nowrap px-2">
                    <div className="flex items-center gap-2">
                      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">{d.name.charAt(0)}</span>
                      <span className="font-medium">{d.name}</span>
                    </div>
                  </td>
                  {WEEK_DAYS.map((day, i) => {
                    const s = driverShifts.find((x) => x.dayOfWeek === i) ?? null;
                    const cellClick = () => canEdit && setEditCell({ driverId: d.id, driverName: d.name, dayOfWeek: i, existing: s });
                    return (
                      <td key={day} className="px-1">
                        {s ? (
                          <button
                            type="button"
                            onClick={cellClick}
                            disabled={!canEdit}
                            className="grid h-9 w-full place-items-center rounded-md bg-[hsl(var(--teal))]/15 text-[11px] font-semibold text-[hsl(var(--teal))] transition-opacity disabled:cursor-default enabled:hover:opacity-80"
                          >
                            {s.startTime}–{s.endTime}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={cellClick}
                            disabled={!canEdit}
                            className="grid h-9 w-full place-items-center rounded-md border border-dashed border-border text-muted-foreground/50 transition-colors disabled:cursor-default enabled:hover:border-primary/40 enabled:hover:text-primary"
                          >
                            ·
                          </button>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-2">
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-secondary">
                        <div className={cn('h-full rounded-full', LOAD_COLOR[load])} style={{ width: `${Math.min(100, (h / cap) * 100)}%` }} />
                      </div>
                      <span className={cn('w-10 text-right font-semibold tabular-nums', LOAD_TEXT[load])}>{h}h</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{t('drivers.rosterHint2')}</p>
    </GlassCard>
  );
}

function MiniStat({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-secondary/40 p-3">
      <p className={danger ? 'text-[11px] font-medium text-destructive' : 'text-[11px] font-medium text-muted-foreground'}>{label}</p>
      <p className="mt-0.5 text-xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

interface EditCell {
  driverId: string;
  driverName: string;
  dayOfWeek: number;
  existing: ApiDriverShift | null;
}

function ShiftEditModal({ cell, onClose }: { cell: EditCell | null; onClose: () => void }) {
  const { t } = useTranslation();
  const setShift = useSetDriverShift();
  const deleteShift = useDeleteDriverShift();
  const [start, setStart] = useState('06:00');
  const [end, setEnd] = useState('14:00');
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (cell) {
      setStart(cell.existing?.startTime ?? '06:00');
      setEnd(cell.existing?.endTime ?? '14:00');
      setErr(null);
    }
  }, [cell]);

  if (!cell) return null;
  const busy = setShift.isPending || deleteShift.isPending;

  function save() {
    if (!cell) return;
    setErr(null);
    if (end <= start) {
      setErr(t('drivers.shiftEndError'));
      return;
    }
    setShift.mutate(
      { driverId: cell.driverId, dayOfWeek: cell.dayOfWeek, startTime: start, endTime: end },
      { onSuccess: onClose, onError: (e) => setErr(e instanceof Error ? e.message : t('parcels.actionFailed')) },
    );
  }

  function clear() {
    if (!cell?.existing) return;
    setErr(null);
    deleteShift.mutate({ id: cell.existing.id }, { onSuccess: onClose, onError: (e) => setErr(e instanceof Error ? e.message : t('parcels.actionFailed')) });
  }

  return (
    <Modal
      open={cell !== null}
      onClose={onClose}
      title={t('drivers.editShift')}
      description={`${cell.driverName} · ${t(`analytics.day.${WEEK_DAYS[cell.dayOfWeek]}`)}`}
      footer={
        <>
          {cell.existing && (
            <Button variant="destructive" onClick={clear} disabled={busy}>{t('drivers.clearShift')}</Button>
          )}
          <Button variant="outline" onClick={onClose} disabled={busy}>{t('forms.cancel')}</Button>
          <Button onClick={save} disabled={busy}>{busy ? t('forms.saving') : t('forms.save')}</Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <Field label={t('drivers.shiftStart')} htmlFor="shift-start">
          <Input id="shift-start" type="time" value={start} onChange={(e) => setStart(e.target.value)} />
        </Field>
        <Field label={t('drivers.shiftEnd')} htmlFor="shift-end">
          <Input id="shift-end" type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
        </Field>
      </div>
      {err && <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{err}</p>}
    </Modal>
  );
}
