import { useState } from 'react';
import { DayPicker, type DateRange as RdpRange } from 'react-day-picker';
import 'react-day-picker/style.css';
import { Calendar, ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useDateRange, PRESETS } from '@/store/dateRange';
import { cn } from '@/lib/utils';

// Themes react-day-picker to the teal accent.
const calendarTheme = {
  '--rdp-accent-color': 'hsl(var(--primary))',
  '--rdp-accent-background-color': 'hsl(var(--accent))',
  '--rdp-day-width': '2.25rem',
  '--rdp-day-height': '2.25rem',
} as React.CSSProperties;

// Global date-range control shown in the header: quick presets + a custom calendar range.
export function DateRangePicker() {
  const { preset, range, label, setPreset, setCustom } = useDateRange();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<RdpRange | undefined>(range.from ? { from: range.from, to: range.to } : undefined);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-transform active:scale-[0.98]"
        >
          <Calendar className="size-4" aria-hidden />
          {label}
          <ChevronDown className="size-3.5" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-0">
        <div className="flex">
          <div className="flex w-40 flex-col gap-0.5 border-r border-border p-2">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setPreset(p.id);
                  setDraft(undefined);
                  setOpen(false);
                }}
                className={cn(
                  'rounded-md px-3 py-2 text-left text-sm transition-colors',
                  preset === p.id ? 'bg-primary/10 font-medium text-primary' : 'hover:bg-secondary',
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="p-3" style={calendarTheme}>
            <DayPicker
              mode="range"
              numberOfMonths={1}
              selected={draft}
              onSelect={(r) => {
                setDraft(r);
                if (r?.from && r?.to) {
                  setCustom(r.from, r.to);
                  setOpen(false);
                }
              }}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
