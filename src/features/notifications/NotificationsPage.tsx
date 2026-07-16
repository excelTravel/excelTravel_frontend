import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, CheckCircle2, Clock, XCircle, Bell, CheckCheck, MessageSquare, Smartphone, Mail } from 'lucide-react';
import { GlassCard } from '@/components/ui/card';
import { StatusPill } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Reveal, RevealItem } from '@/components/motion/Motion';
import { cn } from '@/lib/utils';

// Aligned to GET /api/v1/notifications (NotificationResponse: type, triggerType, message, status, createdAt).
type Trigger = '5km' | '2km' | 'arrived' | 'delay' | 'cancellation';
type Channel = 'sms' | 'push' | 'email';
type NStatus = 'pending' | 'sent' | 'failed';
interface Notif {
  id: string;
  trigger: Trigger;
  channel: Channel;
  message: string;
  status: NStatus;
  time: string;
}

const NOTIFS: Notif[] = [
  { id: 'n1', trigger: '5km', channel: 'push', message: 'Bus RAB-402-C is 5 km from Nyabugogo', status: 'sent', time: '2m' },
  { id: 'n2', trigger: 'delay', channel: 'sms', message: 'Trip Kigali → Musanze delayed 15 min', status: 'sent', time: '18m' },
  { id: 'n3', trigger: 'cancellation', channel: 'sms', message: 'Booking #TK-8915 cancelled — payment timeout', status: 'failed', time: '42m' },
  { id: 'n4', trigger: 'arrived', channel: 'push', message: 'Bus RAD-088-A has arrived at Huye', status: 'sent', time: '1h' },
  { id: 'n5', trigger: '2km', channel: 'push', message: 'Bus RAC-112-D is 2 km from Rubavu', status: 'pending', time: '1h' },
  { id: 'n6', trigger: 'arrived', channel: 'email', message: 'Trip TRP-8471 completed — manifest emailed', status: 'sent', time: '3h' },
];

const TRIGGER_ICON: Record<Trigger, typeof MapPin> = { '5km': MapPin, '2km': MapPin, arrived: CheckCircle2, delay: Clock, cancellation: XCircle };
const CHANNEL_ICON: Record<Channel, typeof MessageSquare> = { sms: MessageSquare, push: Smartphone, email: Mail };

export function NotificationsPage() {
  const { t } = useTranslation();
  const [read, setRead] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const rows = filter === 'unread' ? NOTIFS.filter((n) => !read.has(n.id)) : NOTIFS;
  const unread = NOTIFS.filter((n) => !read.has(n.id)).length;

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
          <Button variant="outline" size="sm" onClick={() => setRead(new Set(NOTIFS.map((n) => n.id)))} disabled={unread === 0}>
            <CheckCheck className="size-4" /> {t('notifs.markAll')}
          </Button>
        </div>
      </RevealItem>

      <RevealItem>
        <GlassCard className="divide-y divide-border overflow-hidden">
          {rows.map((n) => {
            const TIcon = TRIGGER_ICON[n.trigger];
            const CIcon = CHANNEL_ICON[n.channel];
            const isRead = read.has(n.id);
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => setRead((prev) => new Set(prev).add(n.id))}
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
      </RevealItem>
    </Reveal>
  );
}
