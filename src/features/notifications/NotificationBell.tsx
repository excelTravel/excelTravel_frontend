import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, CheckCheck } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface Notice {
  id: string;
  title: string;
  time: string;
  tone: 'info' | 'warning' | 'danger';
}

// Stub feed until wired to GET /api/v1/notifications (+ socket bus:alert). Shape matches the endpoint.
const stub: Notice[] = [
  { id: '1', title: 'Bus RAB123A is 5 km from Nyabugogo', time: '2m', tone: 'info' },
  { id: '2', title: 'Trip Kigali → Musanze delayed 15 min', time: '18m', tone: 'warning' },
  { id: '3', title: 'Incident on Trip #4821 — bus transfer requested', time: '1h', tone: 'danger' },
];

export function NotificationBell() {
  const { t } = useTranslation();
  const unread = stub.length;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Notifications, ${unread} unread`}
          className="relative text-muted-foreground transition-colors hover:text-foreground"
        >
          <Bell className="size-5" />
          {unread > 0 && (
            <span className="absolute -right-1.5 -top-1.5 grid min-w-[16px] place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-4 text-destructive-foreground">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          <button type="button" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
            <CheckCheck className="size-3.5" /> Mark all read
          </button>
        </div>
        <ul className="max-h-80 divide-y divide-border overflow-y-auto">
          {stub.map((n) => (
            <li key={n.id} className="flex gap-3 px-4 py-3 transition-colors hover:bg-secondary/50">
              <span
                className={cn(
                  'mt-1.5 size-2 shrink-0 rounded-full',
                  n.tone === 'danger' ? 'bg-destructive' : n.tone === 'warning' ? 'bg-warning' : 'bg-primary',
                )}
                aria-hidden
              />
              <div className="min-w-0">
                <p className="text-sm leading-snug">{n.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{n.time} ago</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="border-t border-border px-4 py-2 text-center">
          <Link to="/notifications" className="text-xs font-medium text-primary hover:underline">
            {t('notifs.viewAll')}
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
