import { useTranslation } from 'react-i18next';
import { CalendarRange } from 'lucide-react';
import { DateRangePicker } from './date-range-picker';
import { useDateRange } from '@/store/dateRange';

// The centralized data-range control every screen shows at the top. It sets the global range, so all
// KPIs, charts, deltas, and lists on the page re-scope to it. Default: all time.
export function PageControls() {
  const { t } = useTranslation();
  const label = useDateRange((s) => s.label);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card/60 px-4 py-3 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CalendarRange className="size-4" aria-hidden />
        {t('common.showingData')} <span className="font-medium text-foreground">{label}</span>
      </div>
      <DateRangePicker />
    </div>
  );
}
