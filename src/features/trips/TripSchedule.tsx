import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { GlassCard } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusPill } from '@/components/ui/badge';
import { Async } from '@/components/ui/async';
import { useTripRows } from './useTripRows';
import { type TripRow } from './trips';
import { cn } from '@/lib/utils';

type ScheduleView = 'day' | 'week' | 'month';

const HOURS = Array.from({ length: 24 }, (_, h) => h);

function viewBounds(view: ScheduleView, anchor: Date): { from: Date; to: Date } {
  if (view === 'day') return { from: startOfDay(anchor), to: startOfDay(addDays(anchor, 1)) };
  if (view === 'week') return { from: startOfWeek(anchor, { weekStartsOn: 1 }), to: addDays(startOfWeek(anchor, { weekStartsOn: 1 }), 7) };
  return { from: startOfWeek(startOfMonth(anchor), { weekStartsOn: 1 }), to: addDays(endOfWeek(endOfMonth(anchor), { weekStartsOn: 1 }), 1) };
}

function step(view: ScheduleView, anchor: Date, dir: 1 | -1): Date {
  if (view === 'day') return addDays(anchor, dir);
  if (view === 'week') return addWeeks(anchor, dir);
  return addMonths(anchor, dir);
}

// What's planned, laid out as an actual timetable — day (hour-by-hour), week (agenda per day), or month
// (calendar grid) — independent of the header's global date-range filter, which is for reporting, not
// "what departs when". This is also where a just-generated batch of trips (SchedulesTable → Generate)
// becomes visible at a glance, since every trip shows here by its planned departure regardless of status.
export function TripSchedule({ onNewTrip }: { onNewTrip: () => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [view, setView] = useState<ScheduleView>('day');
  const [anchor, setAnchor] = useState(() => new Date());

  const bounds = useMemo(() => viewBounds(view, anchor), [view, anchor]);
  const rowsQ = useTripRows({ from: bounds.from.toISOString(), to: bounds.to.toISOString() });

  const periodLabel = useMemo(() => {
    if (view === 'day') return format(anchor, 'EEEE, d MMMM yyyy');
    if (view === 'week') return `${format(bounds.from, 'd MMM')} – ${format(addDays(bounds.to, -1), 'd MMM yyyy')}`;
    return format(anchor, 'MMMM yyyy');
  }, [view, anchor, bounds]);

  return (
    <GlassCard className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5 pb-3">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold"><CalendarDays className="size-4" /> {t('tripSchedule.title')}</h3>
          <p className="text-sm text-muted-foreground">{t('tripSchedule.sub')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-border p-0.5">
            {(['day', 'week', 'month'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
                  view === v ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t(`tripSchedule.view.${v}`)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="outline" className="size-8" aria-label={t('tripSchedule.prev')} onClick={() => setAnchor((a) => step(view, a, -1))}><ChevronLeft className="size-4" /></Button>
            <Button size="sm" variant="outline" onClick={() => setAnchor(new Date())}>{t('tripSchedule.today')}</Button>
            <Button size="icon" variant="outline" className="size-8" aria-label={t('tripSchedule.next')} onClick={() => setAnchor((a) => step(view, a, 1))}><ChevronRight className="size-4" /></Button>
          </div>
          <Button size="sm" onClick={onNewTrip}><Plus className="size-4" /> {t('tripsList.newTrip')}</Button>
        </div>
      </div>

      <div className="border-b border-border px-5 py-2.5 text-sm font-semibold">{periodLabel}</div>

      <Async
        query={rowsQ}
        isEmpty={(d) => d.length === 0}
        skeleton={<div className="space-y-2 p-5">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="shimmer h-9 rounded" />)}</div>}
        empty={<div className="px-6 py-12 text-center text-sm text-muted-foreground">{t('tripSchedule.empty')}</div>}
      >
        {(rows) => (
          <>
            {view === 'day' && <DayView rows={rows} onOpen={(id) => navigate(`/trips/${id}`)} />}
            {view === 'week' && <WeekView rows={rows} anchor={anchor} onOpen={(id) => navigate(`/trips/${id}`)} />}
            {view === 'month' && <MonthView rows={rows} anchor={anchor} onPickDay={(d) => { setAnchor(d); setView('day'); }} />}
          </>
        )}
      </Async>
    </GlassCard>
  );
}

function TripChip({ row, onOpen, compact }: { row: TripRow; onOpen: (id: string) => void; compact?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(row.id)}
      className={cn(
        'flex w-full items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-1.5 text-left text-xs transition-colors hover:border-primary/40 hover:bg-secondary/40',
        compact && 'py-1',
      )}
    >
      <span className="shrink-0 font-semibold tabular-nums text-muted-foreground">{row.departs}</span>
      <span className="min-w-0 flex-1 truncate font-medium">{row.origin} <ArrowRight className="inline size-3" /> {row.destination}</span>
      <span className="shrink-0 tabular-nums text-muted-foreground">#{row.tripNo ?? '—'}</span>
      <StatusPill status={row.status} />
    </button>
  );
}

function DayView({ rows, onOpen }: { rows: TripRow[]; onOpen: (id: string) => void }) {
  const { t } = useTranslation();
  const byHour = useMemo(() => {
    const m = new Map<number, TripRow[]>();
    for (const r of rows) {
      const h = new Date(r.departureAt).getHours();
      const list = m.get(h) ?? [];
      list.push(r);
      m.set(h, list);
    }
    return m;
  }, [rows]);

  return (
    <ul className="max-h-[560px] divide-y divide-border overflow-y-auto">
      {HOURS.map((h) => {
        const trips = byHour.get(h) ?? [];
        return (
          <li key={h} className={cn('flex gap-4 px-5 py-2.5', trips.length === 0 && 'opacity-50')}>
            <span className="w-14 shrink-0 pt-1 text-xs font-semibold tabular-nums text-muted-foreground">{String(h).padStart(2, '0')}:00</span>
            <div className="min-w-0 flex-1 space-y-1.5">
              {trips.length === 0 ? (
                <p className="py-1 text-xs text-muted-foreground">{t('tripSchedule.noneThisHour')}</p>
              ) : (
                trips.map((r) => <TripChip key={r.id} row={r} onOpen={onOpen} />)
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function WeekView({ rows, anchor, onOpen }: { rows: TripRow[]; anchor: Date; onOpen: (id: string) => void }) {
  const { t } = useTranslation();
  const days = eachDayOfInterval({ start: startOfWeek(anchor, { weekStartsOn: 1 }), end: endOfWeek(anchor, { weekStartsOn: 1 }) });
  const byDay = useMemo(() => {
    const m = new Map<string, TripRow[]>();
    for (const r of rows) {
      const key = format(new Date(r.departureAt), 'yyyy-MM-dd');
      const list = m.get(key) ?? [];
      list.push(r);
      m.set(key, list);
    }
    return m;
  }, [rows]);

  return (
    <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-7 sm:divide-x sm:divide-y-0">
      {days.map((d) => {
        const key = format(d, 'yyyy-MM-dd');
        const trips = (byDay.get(key) ?? []).sort((a, b) => a.departs.localeCompare(b.departs));
        return (
          <div key={key} className="min-h-[180px] p-3">
            <p className={cn('mb-2 text-xs font-semibold', isToday(d) && 'text-primary')}>
              {format(d, 'EEE d')}
            </p>
            <div className="max-h-[420px] space-y-1.5 overflow-y-auto">
              {trips.length === 0 ? (
                <p className="text-xs text-muted-foreground">{t('tripSchedule.noneThisDay')}</p>
              ) : (
                trips.map((r) => <TripChip key={r.id} row={r} onOpen={onOpen} compact />)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MonthView({ rows, anchor, onPickDay }: { rows: TripRow[]; anchor: Date; onPickDay: (d: Date) => void }) {
  const { t } = useTranslation();
  const gridStart = startOfWeek(startOfMonth(anchor), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(anchor), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const byDay = useMemo(() => {
    const m = new Map<string, TripRow[]>();
    for (const r of rows) {
      const key = format(new Date(r.departureAt), 'yyyy-MM-dd');
      const list = m.get(key) ?? [];
      list.push(r);
      m.set(key, list);
    }
    return m;
  }, [rows]);

  return (
    <div>
      <div className="grid grid-cols-7 border-b border-border text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-[11px]">
        {[t('tripSchedule.mon'), t('tripSchedule.tue'), t('tripSchedule.wed'), t('tripSchedule.thu'), t('tripSchedule.fri'), t('tripSchedule.sat'), t('tripSchedule.sun')].map((d) => (
          <div key={d} className="py-1.5 sm:py-2">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((d) => {
          const key = format(d, 'yyyy-MM-dd');
          const trips = byDay.get(key) ?? [];
          const inMonth = isSameMonth(d, anchor);
          return (
            <button
              key={key}
              type="button"
              onClick={() => onPickDay(d)}
              className={cn(
                'flex min-h-[64px] flex-col items-start gap-1 border-b border-r border-border p-1 text-left transition-colors hover:bg-secondary/40 sm:min-h-[92px] sm:p-2',
                !inMonth && 'bg-secondary/20 text-muted-foreground',
              )}
            >
              <span className={cn('grid size-5 place-items-center rounded-full text-[11px] font-semibold tabular-nums sm:size-6 sm:text-xs', isSameDay(d, new Date()) && 'bg-primary text-primary-foreground')}>
                {format(d, 'd')}
              </span>
              {trips.length > 0 && (
                <span className="rounded-full bg-teal/15 px-1.5 py-0.5 text-[10px] font-semibold text-teal sm:px-2 sm:text-[11px]">
                  {t('tripSchedule.tripsCount', { count: trips.length })}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
