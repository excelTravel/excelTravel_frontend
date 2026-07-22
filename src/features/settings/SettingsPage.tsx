import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, UserRound, SlidersHorizontal, Bus, Moon, Sun } from 'lucide-react';
import { GlassCard } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/form';
import { ImageUpload } from '@/components/ui/image-upload';
import { Reveal, RevealItem } from '@/components/motion/Motion';
import { useCurrentUser } from '@/lib/currentUser';
import { useUpdateMe } from '@/lib/api/hooks';
import { useTheme } from '@/store/theme';
import { cn } from '@/lib/utils';

type Section = 'profile' | 'company' | 'preferences';
const SECTIONS: { key: Section; icon: typeof UserRound }[] = [
  { key: 'profile', icon: UserRound },
  { key: 'company', icon: Building2 },
  { key: 'preferences', icon: SlidersHorizontal },
];

export function SettingsPage() {
  const { t, i18n } = useTranslation();
  const user = useCurrentUser();
  const { theme, toggle } = useTheme();
  const lang = i18n.language === 'kin' ? 'kin' : 'en';
  const [section, setSection] = useState<Section>('profile');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [logo, setLogo] = useState<string | null>(null);
  const [name, setName] = useState(user.fullName);
  const [company, setCompany] = useState('ExcelTravel');
  const updateMe = useUpdateMe();

  function save() {
    if (!name.trim() || name.trim() === user.fullName) return;
    updateMe.mutate({ name: name.trim() });
  }

  return (
    <Reveal className="grid gap-6 lg:grid-cols-[220px_1fr]">
      {/* Section nav */}
      <RevealItem>
        <GlassCard className="p-2 lg:sticky lg:top-24">
          <nav className="flex gap-1 lg:flex-col">
            {SECTIONS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setSection(s.key)}
                aria-current={section === s.key}
                className={cn(
                  'flex flex-1 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors lg:flex-none',
                  section === s.key ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                )}
              >
                <s.icon className="size-4" /> {t(`settings.nav.${s.key}`)}
              </button>
            ))}
          </nav>
        </GlassCard>
      </RevealItem>

      {/* Content */}
      <RevealItem className="space-y-6">
        {section === 'profile' && (
          <GlassCard className="p-6">
            <SectionHead title={t('settings.profile')} desc={t('settings.profileSub')} />
            <div className="mt-5 space-y-5">
              <ImageUpload value={avatar} onChange={setAvatar} shape="circle" hint={t('settings.avatarHint')} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t('settings.displayName')} htmlFor="s-name">
                  <Input id="s-name" value={name} onChange={(e) => setName(e.target.value)} />
                </Field>
                <Field label={t('settings.role')} htmlFor="s-role">
                  <Input id="s-role" value={user.role} disabled />
                </Field>
                <Field label={t('settings.email')} htmlFor="s-email">
                  <Input id="s-email" type="email" value={user.email} disabled />
                </Field>
                <Field label={t('settings.station')} htmlFor="s-station">
                  <Input id="s-station" value={user.location} disabled />
                </Field>
              </div>
            </div>
          </GlassCard>
        )}

        {section === 'company' && (
          <GlassCard className="p-6">
            <SectionHead title={t('settings.branding')} desc={t('settings.brandingSub')} />
            <div className="mt-5 grid gap-6 lg:grid-cols-2">
              <div className="space-y-5">
                <ImageUpload value={logo} onChange={setLogo} shape="square" hint={t('settings.logoHint')} />
                <Field label={t('settings.companyName')} htmlFor="s-company">
                  <Input id="s-company" value={company} onChange={(e) => setCompany(e.target.value)} />
                </Field>
              </div>
              {/* Live ticket preview — how the logo looks on a boarding pass */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t('settings.ticketPreview')}</p>
                <div className="mt-2 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-[hsl(var(--navy))] to-[hsl(223_55%_26%)] p-5 text-white">
                  <div className="flex items-center gap-2">
                    <span className="grid size-8 place-items-center overflow-hidden rounded-lg bg-white/15">
                      {logo ? <img src={logo} alt="" className="size-full object-cover" /> : <Bus className="size-4" />}
                    </span>
                    <span className="text-sm font-bold">{company || 'ExcelTravel'}</span>
                  </div>
                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <p className="text-[10px] uppercase text-white/60">Kigali → Musanze</p>
                      <p className="text-lg font-bold">08:30 · Seat-free</p>
                    </div>
                    <div className="grid size-12 place-items-center rounded-md bg-white/90 text-[8px] font-bold text-[hsl(var(--navy))]">QR</div>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{t('settings.ticketPreviewSub')}</p>
              </div>
            </div>
          </GlassCard>
        )}

        {section === 'preferences' && (
          <GlassCard className="p-6">
            <SectionHead title={t('settings.preferences')} desc={t('settings.preferencesSub')} />
            <div className="mt-5 divide-y divide-border">
              <Row label={t('settings.language')}>
                <div className="inline-flex gap-1 rounded-lg bg-secondary/60 p-1">
                  {(['en', 'kin'] as const).map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => void i18n.changeLanguage(l)}
                      aria-pressed={lang === l}
                      className={cn('rounded-md px-3 py-1 text-sm font-semibold transition-colors', lang === l ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground')}
                    >
                      {l.toUpperCase()}
                    </button>
                  ))}
                </div>
              </Row>
              <Row label={t('settings.appearance')}>
                <Button variant="outline" size="sm" onClick={toggle}>
                  {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
                  {t(theme === 'dark' ? 'settings.light' : 'settings.dark')}
                </Button>
              </Row>
              <Row label={t('settings.timezone')}><span className="text-sm text-muted-foreground">Africa/Kigali (CAT)</span></Row>
              <Row label={t('settings.currency')}><span className="text-sm text-muted-foreground">RWF · Rwandan Franc</span></Row>
            </div>
          </GlassCard>
        )}

        {/* Sticky save bar */}
        <div className="sticky bottom-4 z-10 flex items-center justify-end gap-3 rounded-xl border border-border bg-card/85 p-3 shadow-lg backdrop-blur">
          <span className="mr-auto text-xs" aria-live="polite">
            {updateMe.isSuccess && <span className="text-success">{t('settings.saved')}</span>}
            {updateMe.isError && <span className="text-destructive">{t('forms.checkFields')}</span>}
          </span>
          <Button variant="outline" onClick={() => setName(user.fullName)} disabled={updateMe.isPending}>{t('forms.cancel')}</Button>
          <Button onClick={save} disabled={updateMe.isPending || !name.trim() || name.trim() === user.fullName}>{updateMe.isPending ? t('forms.saving') : t('forms.save')}</Button>
        </div>
      </RevealItem>
    </Reveal>
  );
}

function SectionHead({ title, desc }: { title: string; desc: string }) {
  return (
    <div>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </div>
  );
}
