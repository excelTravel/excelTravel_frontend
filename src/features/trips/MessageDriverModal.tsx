import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare, Smartphone, Send } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Field, Textarea } from '@/components/ui/form';
import { cn } from '@/lib/utils';

// Backend: POST /notifications { userId: <driver user>, type: 'sms'|'push', message }.
// NOTE: notifications.triggerType is passenger-oriented (5km/2km/arrived/delay/cancellation) — a generic
// ops→driver trigger should be added backend-side (see docs/integration-map.md). Stubbed until wired.
type Channel = 'sms' | 'push';

export function MessageDriverModal({ open, onClose, driverName }: { open: boolean; onClose: () => void; driverName: string }) {
  const { t } = useTranslation();
  const [channel, setChannel] = useState<Channel>('sms');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  function send() {
    if (!message.trim()) return;
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setMessage('');
      onClose();
    }, 500);
  }

  const channels: { key: Channel; label: string; icon: typeof Smartphone }[] = [
    { key: 'sms', label: t('forms.sms'), icon: MessageSquare },
    { key: 'push', label: t('forms.push'), icon: Smartphone },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('trip.messageDriver')}
      description={t('forms.messageSub', { name: driverName })}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>{t('forms.cancel')}</Button>
          <Button onClick={send} disabled={saving || !message.trim()}>
            <Send className="size-4" /> {saving ? t('forms.saving') : t('forms.send')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label={t('forms.channel')}>
          <div className="grid grid-cols-2 gap-2">
            {channels.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setChannel(c.key)}
                aria-pressed={channel === c.key}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                  channel === c.key ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:bg-secondary',
                )}
              >
                <c.icon className="size-4" /> {c.label}
              </button>
            ))}
          </div>
        </Field>
        <Field label={t('forms.message')} htmlFor="m-body" required>
          <Textarea id="m-body" value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t('forms.messagePlaceholder')} maxLength={320} />
        </Field>
        <p className="text-right text-xs text-muted-foreground tabular-nums">{message.length}/320</p>
      </div>
    </Modal>
  );
}
