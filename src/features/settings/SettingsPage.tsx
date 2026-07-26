import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Bus, Moon, Sun } from 'lucide-react';
import { GlassCard } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/form';
import { ImageUpload } from '@/components/ui/image-upload';
import { Reveal, RevealItem } from '@/components/motion/Motion';
import { useCurrentUser } from '@/lib/currentUser';
import { useCompanies, useMe, useUpdateCompany, useUpdateMe } from '@/lib/api/hooks';
import { useSession } from '@/lib/auth/session';
import { useTheme } from '@/store/theme';
import { cn } from '@/lib/utils';
import { CLOUDINARY_FOLDERS } from '@/lib/config';

const COMPANY_EDIT_ROLES = new Set(['super_admin', 'company_admin', 'manager']);

export function SettingsPage() {
  const { t, i18n } = useTranslation();
  const user = useCurrentUser();
  const sessionUser = useSession((s) => s.user);
  const { theme, toggle } = useTheme();
  const lang = i18n.language === 'kin' ? 'kin' : 'en';

  const me = useMe();
  const companies = useCompanies();
  const myCompany = companies.data?.find((c) => c.id === sessionUser?.companyId);
  const canEditCompany = COMPANY_EDIT_ROLES.has(sessionUser?.role ?? '');

  const [avatar, setAvatar] = useState<string | null>(null);
  const [name, setName] = useState(user.fullName);
  const [logo, setLogo] = useState<string | null>(null);
  const [company, setCompany] = useState('');

  // Sync local editable state from the server once it's loaded (and again after a save resolves).
  useEffect(() => {
    if (me.data) {
      setAvatar(me.data.avatarUrl);
      setName(me.data.name);
    }
  }, [me.data]);
  useEffect(() => {
    if (myCompany) {
      setLogo(myCompany.logoUrl);
      setCompany(myCompany.name);
    }
  }, [myCompany]);

  const updateMe = useUpdateMe();
  const updateCompany = useUpdateCompany();
  const [saveState, setSaveState] = useState<'idle' | 'success' | 'error'>('idle');

  const nameDirty = me.data ? name.trim() !== me.data.name && name.trim().length > 0 : false;
  const avatarDirty = me.data ? avatar !== me.data.avatarUrl : false;
  const companyNameDirty = canEditCompany && myCompany ? company.trim() !== myCompany.name && company.trim().length > 0 : false;
  const logoDirty = canEditCompany && myCompany ? logo !== myCompany.logoUrl : false;
  const dirty = nameDirty || avatarDirty || companyNameDirty || logoDirty;
  const saving = updateMe.isPending || updateCompany.isPending;

  async function save() {
    setSaveState('idle');
    try {
      const tasks: Promise<unknown>[] = [];
      if (nameDirty || avatarDirty) {
        tasks.push(
          updateMe.mutateAsync({
            ...(nameDirty ? { name: name.trim() } : {}),
            ...(avatarDirty ? { avatarUrl: avatar } : {}),
          }),
        );
      }
      if (myCompany && (companyNameDirty || logoDirty)) {
        tasks.push(
          updateCompany.mutateAsync({
            id: myCompany.id,
            ...(companyNameDirty ? { name: company.trim() } : {}),
            ...(logoDirty ? { logoUrl: logo } : {}),
          }),
        );
      }
      if (tasks.length === 0) return;
      await Promise.all(tasks);
      setSaveState('success');
    } catch {
      setSaveState('error');
    }
  }

  function cancel() {
    if (me.data) {
      setName(me.data.name);
      setAvatar(me.data.avatarUrl);
    }
    if (myCompany) {
      setCompany(myCompany.name);
      setLogo(myCompany.logoUrl);
    }
    setSaveState('idle');
  }

  return (
    <Reveal className="w-full pb-10">
      <RevealItem className="grid gap-6 xl:grid-cols-2 items-start">
        
        {/* Left Column */}
        <div className="space-y-6">
          {/* Profile Section */}
          <GlassCard className="p-6">
            <SectionHead title={t('settings.profile')} desc={t('settings.profileSub')} />
            <div className="mt-5 space-y-5">
              <ImageUpload value={avatar} onChange={setAvatar} shape="circle" hint={t('settings.avatarHint')} folder={CLOUDINARY_FOLDERS.profilePictures} />
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

          {/* Preferences Section */}
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
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Company Section */}
          <GlassCard className="p-6">
            <SectionHead title={t('settings.branding')} desc={t('settings.brandingSub')} />
            <div className="mt-5 grid gap-6 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <div className="space-y-5">
                {canEditCompany && myCompany ? (
                  <ImageUpload value={logo} onChange={setLogo} shape="square" hint={t('settings.logoHint')} folder={CLOUDINARY_FOLDERS.branding} />
                ) : (
                  <div className="flex items-center gap-5">
                    <div className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-2xl border border-border bg-secondary/60">
                      {logo ? <img src={logo} alt="" className="size-full object-cover" /> : <Bus className="size-7 text-muted-foreground" />}
                    </div>
                    <p className="text-xs text-muted-foreground">{t('settings.noCompanyEditAccess')}</p>
                  </div>
                )}
                <Field label={t('settings.companyName')} htmlFor="s-company">
                  <Input id="s-company" value={company} onChange={(e) => setCompany(e.target.value)} disabled={!canEditCompany || !myCompany} />
                </Field>
              </div>
              {/* Live ticket preview — how the logo looks on a boarding pass */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t('settings.ticketPreview')}</p>
                <div className="mt-2 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-[hsl(var(--navy))] to-[hsl(223_55%_26%)] p-5 text-white shadow-xl shadow-black/10">
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
        </div>
      </RevealItem>

      {/* Sticky save bar */}
      <div className="fixed bottom-6 right-6 z-10 flex items-center justify-end gap-3 rounded-xl border border-border bg-card/85 p-3 shadow-2xl backdrop-blur">
        <span className="mr-auto px-2 text-xs font-medium" aria-live="polite">
          {saveState === 'success' && <span className="text-success">{t('settings.saved')}</span>}
          {saveState === 'error' && <span className="text-destructive">{t('forms.checkFields')}</span>}
        </span>
        <Button variant="outline" onClick={cancel} disabled={saving || !dirty}>{t('forms.cancel')}</Button>
        <Button onClick={() => void save()} disabled={saving || !dirty}>{saving ? t('forms.saving') : t('forms.save')}</Button>
      </div>
    </Reveal>
  );
}

function SectionHead({ title, desc }: { title: string; desc: string }) {
  return (
    <div>
      <h2 className="text-lg font-bold tracking-tight text-foreground">{title}</h2>
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
