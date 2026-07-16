import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, CalendarHeart, ScrollText, Plus, ArrowRight, Check } from 'lucide-react';
import { GlassCard } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge, StatusPill } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Field, Input } from '@/components/ui/form';
import { Reveal, RevealItem } from '@/components/motion/Motion';
import { formatRWF, cn } from '@/lib/utils';
import { COMPANIES, PRIVATE_BOOKINGS, AUDIT, type AuditAction, type PrivateBooking } from './admin';

const TABS = [
  { key: 'companies', icon: Building2 },
  { key: 'private', icon: CalendarHeart },
  { key: 'audit', icon: ScrollText },
] as const;
type AdminTab = (typeof TABS)[number]['key'];

export function AdminPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<AdminTab>('companies');
  return (
    <Reveal className="space-y-6">
      <RevealItem>
        <div role="tablist" aria-label={t('nav.admin')} className="inline-flex flex-wrap gap-1 rounded-xl bg-secondary/60 p-1">
          {TABS.map((tb) => (
            <button
              key={tb.key}
              role="tab"
              aria-selected={tab === tb.key}
              onClick={() => setTab(tb.key)}
              className={cn('inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors', tab === tb.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
            >
              <tb.icon className="size-4" /> {t(`admin.tabs.${tb.key}`)}
            </button>
          ))}
        </div>
      </RevealItem>
      <RevealItem>
        {tab === 'companies' && <CompaniesPanel />}
        {tab === 'private' && <PrivatePanel />}
        {tab === 'audit' && <AuditPanel />}
      </RevealItem>
    </Reveal>
  );
}

function CompaniesPanel() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <GlassCard className="overflow-hidden">
      <AddCompanyModal open={open} onClose={() => setOpen(false)} />
      <div className="flex items-center justify-between p-5">
        <h3 className="text-base font-semibold">{t('admin.tabs.companies')}</h3>
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="size-4" /> {t('admin.addCompany')}</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-y border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-5 py-3 font-medium">{t('admin.colCompany')}</th>
              <th className="px-5 py-3 font-medium">{t('admin.colContact')}</th>
              <th className="px-5 py-3 font-medium">{t('admin.colCommission')}</th>
              <th className="px-5 py-3 font-medium">{t('admin.colStatus')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {COMPANIES.map((c) => (
              <tr key={c.id} className="transition-colors hover:bg-secondary/40">
                <td className="whitespace-nowrap px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-xs font-bold text-primary">{c.name.charAt(0)}</span>
                    <div>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{t('admin.since', { year: c.since })}</p>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">
                  <p>{c.email}</p>
                  <p className="text-xs tabular-nums">{c.phone}</p>
                </td>
                <td className="whitespace-nowrap px-5 py-3 tabular-nums">{c.commission}%</td>
                <td className="px-5 py-3"><StatusPill status={c.status}>{t(`admin.companyStatus.${c.status}`)}</StatusPill></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}

const PB_FILTERS = ['all', 'pending', 'approved', 'completed', 'rejected'] as const;

function PrivatePanel() {
  const { t } = useTranslation();
  const [bookings, setBookings] = useState(PRIVATE_BOOKINGS);
  const [filter, setFilter] = useState<(typeof PB_FILTERS)[number]>('all');
  const rows = filter === 'all' ? bookings : bookings.filter((b) => b.status === filter);

  function approve(id: string) {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: 'approved' as PrivateBooking['status'] } : b)));
  }

  return (
    <GlassCard className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 p-5">
        <h3 className="text-base font-semibold">{t('admin.tabs.private')}</h3>
        <div role="tablist" className="inline-flex flex-wrap gap-1 rounded-xl bg-secondary/60 p-1">
          {PB_FILTERS.map((f) => (
            <button key={f} role="tab" aria-selected={filter === f} onClick={() => setFilter(f)}
              className={cn('rounded-lg px-3 py-1.5 text-xs font-medium transition-colors', filter === f ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
              {t(`admin.pbFilter.${f}`)}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-y border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-5 py-3 font-medium">{t('admin.colRequester')}</th>
              <th className="px-5 py-3 font-medium">{t('admin.colRoute')}</th>
              <th className="px-5 py-3 font-medium">{t('admin.colDate')}</th>
              <th className="px-5 py-3 font-medium">{t('admin.colPax')}</th>
              <th className="px-5 py-3 font-medium">{t('admin.colPurpose')}</th>
              <th className="px-5 py-3 font-medium">{t('admin.colStatus')}</th>
              <th className="px-5 py-3 text-right font-medium">{t('admin.colInvoice')}</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((b) => (
              <tr key={b.id} className="transition-colors hover:bg-secondary/40">
                <td className="whitespace-nowrap px-5 py-3">
                  <p className="font-medium">{b.requester}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">{b.phone}</p>
                </td>
                <td className="whitespace-nowrap px-5 py-3">
                  <span className="flex items-center gap-1.5 text-muted-foreground">{b.pickup} <ArrowRight className="size-3" /> {b.destination}</span>
                </td>
                <td className="whitespace-nowrap px-5 py-3 tabular-nums">{b.date}</td>
                <td className="whitespace-nowrap px-5 py-3 tabular-nums">{b.pax}</td>
                <td className="px-5 py-3"><Badge tone="neutral">{t(`admin.purposes.${b.purpose}`)}</Badge></td>
                <td className="px-5 py-3"><StatusPill status={b.status}>{t(`admin.pbStatus.${b.status}`)}</StatusPill></td>
                <td className="whitespace-nowrap px-5 py-3 text-right font-semibold tabular-nums">{b.invoice ? formatRWF(b.invoice) : '—'}</td>
                <td className="px-5 py-3 text-right">
                  {b.status === 'pending' && (
                    <Button size="sm" onClick={() => approve(b.id)}><Check className="size-4" /> {t('admin.approve')}</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}

const ACTION_TONE: Record<AuditAction, 'success' | 'info' | 'danger' | 'teal' | 'warning'> = {
  create: 'success', update: 'info', delete: 'danger', approve: 'teal', reject: 'warning',
};

function AuditPanel() {
  const { t } = useTranslation();
  return (
    <GlassCard className="overflow-hidden">
      <div className="p-5">
        <h3 className="text-base font-semibold">{t('admin.tabs.audit')}</h3>
        <p className="text-sm text-muted-foreground">{t('admin.auditSub')}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-y border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-5 py-3 font-medium">{t('admin.colActor')}</th>
              <th className="px-5 py-3 font-medium">{t('admin.colAction')}</th>
              <th className="px-5 py-3 font-medium">{t('admin.colEntity')}</th>
              <th className="px-5 py-3 font-medium">{t('admin.colChange')}</th>
              <th className="px-5 py-3 font-medium">{t('admin.colIp')}</th>
              <th className="px-5 py-3 text-right font-medium">{t('admin.colTime')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {AUDIT.map((a) => (
              <tr key={a.id} className="transition-colors hover:bg-secondary/40">
                <td className="whitespace-nowrap px-5 py-3 font-medium">{a.actor}</td>
                <td className="px-5 py-3"><Badge tone={ACTION_TONE[a.action]}>{t(`admin.actions.${a.action}`)}</Badge></td>
                <td className="whitespace-nowrap px-5 py-3">
                  <span className="font-medium">{a.entity}</span> <span className="text-xs text-muted-foreground">{a.entityId}</span>
                </td>
                <td className="px-5 py-3 text-muted-foreground">{a.change}</td>
                <td className="whitespace-nowrap px-5 py-3 tabular-nums text-muted-foreground">{a.ip}</td>
                <td className="whitespace-nowrap px-5 py-3 text-right text-muted-foreground">{a.time} {t('notifs.ago')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}

function AddCompanyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  function go() { setSaving(true); setTimeout(() => { setSaving(false); onClose(); }, 500); }
  return (
    <Modal open={open} onClose={onClose} title={t('admin.addCompany')} description={t('admin.addCompanySub')}
      footer={<><Button variant="outline" onClick={onClose} disabled={saving}>{t('forms.cancel')}</Button><Button onClick={go} disabled={saving}>{saving ? t('forms.saving') : t('admin.createCompany')}</Button></>}>
      <div className="space-y-4">
        <Field label={t('admin.companyName')} htmlFor="ac-name" required><Input id="ac-name" placeholder="Volcano Express" /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('admin.email')} htmlFor="ac-email"><Input id="ac-email" type="email" /></Field>
          <Field label={t('admin.phone')} htmlFor="ac-phone"><Input id="ac-phone" type="tel" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('admin.address')} htmlFor="ac-addr"><Input id="ac-addr" placeholder="Kigali" /></Field>
          <Field label={t('admin.commission')} htmlFor="ac-comm" hint="%"><Input id="ac-comm" type="number" min={0} max={100} placeholder="8" /></Field>
        </div>
      </div>
    </Modal>
  );
}
