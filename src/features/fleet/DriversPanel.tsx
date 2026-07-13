import { useTranslation } from 'react-i18next';
import { Star, Bus, Phone, CalendarClock } from 'lucide-react';
import { GlassCard } from '@/components/ui/card';
import { StatusPill } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Stub drivers (Rwanda). Wired later to /drivers (+ assignment/shift endpoints).
interface Driver {
  id: string;
  name: string;
  license: string;
  rating: number;
  status: string;
  vehicle: string | null;
  shiftStart: number | null;
  shiftEnd: number | null;
  trip: string | null;
}

const DRIVERS: Driver[] = [
  { id: 'd1', name: 'Sarah Uwase', license: 'RW-DL-4471', rating: 4.92, status: 'on_shift', vehicle: 'RAB-402', shiftStart: 6, shiftEnd: 14, trip: 'TRP-8492' },
  { id: 'd2', name: 'Patrick Habimana', license: 'RW-DL-2210', rating: 4.71, status: 'on_shift', vehicle: 'RAC-112', shiftStart: 8, shiftEnd: 16, trip: 'TRP-8495' },
  { id: 'd3', name: 'Liliane Ingabire', license: 'RW-DL-8890', rating: 4.88, status: 'on_shift', vehicle: 'RAD-88', shiftStart: 7, shiftEnd: 15, trip: 'TRP-8502' },
  { id: 'd4', name: 'Jean Mugabo', license: 'RW-DL-1120', rating: 4.55, status: 'off_shift', vehicle: null, shiftStart: 14, shiftEnd: 22, trip: null },
  { id: 'd5', name: 'Claudine Umutoni', license: 'RW-DL-6634', rating: 4.79, status: 'off_shift', vehicle: null, shiftStart: null, shiftEnd: null, trip: null },
];

// Roster window (operating hours) for the shift track.
const DAY_START = 5;
const DAY_END = 23;
const SPAN = DAY_END - DAY_START;
const TICKS = [6, 9, 12, 15, 18, 21];

export function DriversPanel() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Shift roster — visual scheduling + vehicle assignment */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-base font-semibold">
            <CalendarClock className="size-4" /> {t('drivers.roster')}
          </h3>
          <p className="text-xs text-muted-foreground">{t('drivers.rosterHint')}</p>
        </div>

        {/* hour axis */}
        <div className="mt-5 flex pl-44">
          {TICKS.map((h) => (
            <div key={h} className="flex-1 text-[10px] tabular-nums text-muted-foreground" style={{ textAlign: 'left' }}>
              {h}:00
            </div>
          ))}
        </div>

        <div className="mt-1 space-y-2">
          {DRIVERS.map((d) => {
            const has = d.shiftStart != null && d.shiftEnd != null;
            const left = has ? ((d.shiftStart! - DAY_START) / SPAN) * 100 : 0;
            const width = has ? ((d.shiftEnd! - d.shiftStart!) / SPAN) * 100 : 0;
            return (
              <div key={d.id} className="flex items-center gap-3">
                <div className="flex w-44 shrink-0 items-center gap-2">
                  <span className="grid size-8 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {d.name.charAt(0)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium leading-tight">{d.name}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {d.vehicle ?? t('drivers.noVehicle')}
                    </p>
                  </div>
                </div>
                <div className="relative h-8 flex-1 rounded-lg bg-secondary/60">
                  {has ? (
                    <div
                      className="absolute inset-y-1 grid place-items-center rounded-md bg-[hsl(var(--teal))]/85 px-2 text-[11px] font-semibold text-white"
                      style={{ left: `${left}%`, width: `${width}%` }}
                    >
                      {d.shiftStart}:00–{d.shiftEnd}:00
                    </div>
                  ) : (
                    <span className="absolute inset-0 grid place-items-center text-[11px] text-muted-foreground">
                      {t('drivers.noShift')}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Driver management table */}
      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">{t('drivers.colDriver')}</th>
                <th className="px-5 py-3 font-medium">{t('drivers.colRating')}</th>
                <th className="px-5 py-3 font-medium">{t('drivers.colStatus')}</th>
                <th className="px-5 py-3 font-medium">{t('drivers.colVehicle')}</th>
                <th className="px-5 py-3 font-medium">{t('drivers.colShift')}</th>
                <th className="px-5 py-3 font-medium">{t('drivers.colTrip')}</th>
                <th className="px-5 py-3 text-right font-medium">{t('drivers.colAction')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {DRIVERS.map((d) => (
                <tr key={d.id} className="transition-colors hover:bg-secondary/40">
                  <td className="whitespace-nowrap px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {d.name.charAt(0)}
                      </span>
                      <div>
                        <p className="font-medium">{d.name}</p>
                        <p className="text-xs text-muted-foreground">{d.license}</p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3">
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <Star className="size-3.5 fill-warning text-warning" /> {d.rating.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <StatusPill status={d.status}>{t(`drivers.state.${d.status}`)}</StatusPill>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3">
                    {d.vehicle ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Bus className="size-3.5 text-muted-foreground" /> {d.vehicle}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">{t('drivers.noVehicle')}</span>
                    )}
                  </td>
                  <td className={cn('whitespace-nowrap px-5 py-3 tabular-nums', d.shiftStart == null && 'text-muted-foreground')}>
                    {d.shiftStart != null ? `${d.shiftStart}:00–${d.shiftEnd}:00` : '—'}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">{d.trip ?? '—'}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm">{t('drivers.assign')}</Button>
                      <button type="button" aria-label={t('drivers.call')} className="text-muted-foreground hover:text-foreground">
                        <Phone className="size-4" />
                      </button>
                    </div>
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
