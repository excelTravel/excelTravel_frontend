import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useNotifications } from '@/lib/api/hooks';
import { cn } from '@/lib/utils';

function tone(trigger: string): 'info' | 'warning' | 'danger' {
  if (trigger === 'cancellation' || trigger === 'waitlist_deny') return 'danger';
  if (trigger === 'delay') return 'warning';
  return 'info';
}
function ago(iso: string): string {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 60) return `${m}m`;
  if (m < 1440) return `${Math.round(m / 60)}h`;
  return `${Math.round(m / 1440)}d`;
}

// Live feed from GET /api/v1/notifications (socket bus:alert will push into the same cache later).
export function NotificationBell() {
  const { t } = useTranslation();
  const { data, isLoading } = useNotifications();
  const items = data ?? [];
  const unread = items.length;

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
          <p className="text-sm font-semibold">{t('notifs.title', 'Notifications')}</p>
        </div>
        <ul className="max-h-80 divide-y divide-border overflow-y-auto">
          {isLoading && <li className="px-4 py-6"><div className="shimmer h-10 rounded-lg" /></li>}
          {!isLoading && items.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-muted-foreground">{t('common.empty', 'Nothing here yet.')}</li>
          )}
          {items.slice(0, 8).map((n) => {
            const tn = tone(n.triggerType);
            return (
              <li key={n.id} className="flex gap-3 px-4 py-3 transition-colors hover:bg-secondary/50">
                <span
                  className={cn('mt-1.5 size-2 shrink-0 rounded-full', tn === 'danger' ? 'bg-destructive' : tn === 'warning' ? 'bg-warning' : 'bg-primary')}
                  aria-hidden
                />
                <div className="min-w-0">
                  <p className="text-sm leading-snug">{n.message ?? n.triggerType}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{ago(n.createdAt)} ago</p>
                </div>
              </li>
            );
          })}
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
