import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, CheckCircle2, Clock, XCircle, Bell, CheckCheck, MessageSquare, Smartphone, Mail } from 'lucide-react';
import { GlassCard } from '@/components/ui/card';
import { StatusPill } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Async } from '@/components/ui/async';
import { Reveal, RevealItem } from '@/components/motion/Motion';
import { useNotifications, useMarkNotificationRead, type ApiNotification } from '@/lib/api/hooks';
import { cn } from '@/lib/utils';

// Aligned to GET /api/v1/notifications (triggerType, type, message, status, readAt, createdAt).
type Channel = 'sms' | 'push' | 'email';
interface Notif {
  id: string;
  trigger: string;
  channel: Channel;
  message: string;
  status: 'pending' | 'sent' | 'failed';
  read: boolean;
  time: string;
}

const TRIGGER_ICON: Record<string, typeof MapPin> = { '5km': MapPin, '2km': MapPin, arrived: CheckCircle2, delay: Clock, cancellation: XCircle };
const CHANNEL_ICON: Record<Channel, typeof MessageSquare> = { sms: MessageSquare, push: Smartphone, email: Mail };

// Relative "2m" / "1h" / "3d" from an ISO timestamp.
function ago(iso: string): string {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h` : `${Math.floor(h / 24)}d`;
}

function toNotif(n: ApiNotification): Notif {
  const status = n.status === 'sent' || n.status === 'delivered' ? 'sent' : n.status === 'failed' ? 'failed' : 'pending';
  const channel = (['sms', 'push', 'email'].includes(n.type) ? n.type : 'push') as Channel;
  return { id: n.id, trigger: n.triggerType, channel, message: n.message ?? '', status, read: n.readAt !== null, time: ago(n.createdAt) };
}

export function NotificationsPage() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const notifsQ = useNotifications();
  const markRead = useMarkNotificationRead();

  const all = (notifsQ.data ?? []).map(toNotif);
  const rows = filter === 'unread' ? all.filter((n) => !n.read) : all;
  const unread = all.filter((n) => !n.read).length;

  return (
    <Reveal className="mx-auto max-w-3xl space-y-6">
      <RevealItem>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div role="tablist" aria-label={t('notifs.title')} className="inline-flex gap-1 rounded-xl bg-secondary/60 p-1">
            {(['all', 'unread'] as const).map((f) => (
              <button
                key={f}
                role="tab"
                aria-selected={filter === f}
                onClick={() => setFilter(f)}
                className={cn('inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors', filter === f ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
              >
                {t(`notifs.${f}`)}
                {f === 'unread' && unread > 0 && <span className="rounded-full bg-destructive px-1.5 text-xs font-bold text-destructive-foreground">{unread}</span>}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => all.filter((n) => !n.read).forEach((n) => markRead.mutate({ id: n.id, read: true }))}
            disabled={unread === 0 || markRead.isPending}
          >
            <CheckCheck className="size-4" /> {t('notifs.markAll')}
          </Button>
        </div>
      </RevealItem>

      <RevealItem>
        <Async query={notifsQ} skeleton={<GlassCard className="p-6"><div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="shimmer h-12 rounded-lg" />)}</div></GlassCard>}>
        {() => (
        <GlassCard className="divide-y divide-border overflow-hidden">
          {rows.map((n) => {
            const TIcon = TRIGGER_ICON[n.trigger] ?? Bell;
            const CIcon = CHANNEL_ICON[n.channel] ?? Smartphone;
            const isRead = n.read;
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => !isRead && markRead.mutate({ id: n.id, read: true })}
                className={cn('flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-secondary/40', !isRead && 'bg-primary/[0.03]')}
              >
                <span className={cn('mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg', n.trigger === 'cancellation' ? 'bg-destructive/10 text-destructive' : n.trigger === 'delay' ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary')}>
                  <TIcon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn('text-sm leading-snug', !isRead && 'font-semibold')}>{n.message}</p>
                    {!isRead && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-hidden />}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><CIcon className="size-3" /> {t(`notifs.channel.${n.channel}`)}</span>
                    <StatusPill status={n.status === 'sent' ? 'completed' : n.status === 'failed' ? 'cancelled' : 'pending'}>{t(`notifs.status.${n.status}`)}</StatusPill>
                    <span>· {n.time} {t('notifs.ago')}</span>
                  </div>
                </div>
              </button>
            );
          })}
          {rows.length === 0 && (
            <div className="grid place-items-center gap-2 px-6 py-16 text-center">
              <Bell className="size-8 text-muted-foreground" />
              <p className="text-sm font-medium">{t('notifs.empty')}</p>
              <p className="text-sm text-muted-foreground">{t('notifs.emptySub')}</p>
            </div>
          )}
        </GlassCard>
        )}
        </Async>
      </RevealItem>
    </Reveal>
  );
}
