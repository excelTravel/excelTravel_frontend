import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, UserRound } from 'lucide-react';
import { GlassCard } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/form';
import { ImageUpload } from '@/components/ui/image-upload';
import { Reveal, RevealItem } from '@/components/motion/Motion';
import { useCurrentUser } from '@/lib/currentUser';

// Profile (PATCH /me) + company branding (PATCH /companies/{id}). Logo/avatar upload via Cloudinary later;
// here they preview client-side so the manager can see how the logo looks before saving.
export function SettingsPage() {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const [avatar, setAvatar] = useState<string | null>(null);
  const [logo, setLogo] = useState<string | null>(null);
  const [name, setName] = useState(user.firstName);
  const [company, setCompany] = useState('ExcelTravel');
  const [saving, setSaving] = useState(false);

  function save() {
    setSaving(true);
    // PATCH /me { displayName, avatarUrl } + PATCH /companies/{id} { name, logoUrl } — stubbed until wired.
    setTimeout(() => setSaving(false), 600);
  }

  return (
    <Reveal className="mx-auto max-w-3xl space-y-6">
      <RevealItem>
        <PageIntro icon={<UserRound className="size-5" />} title={t('settings.profile')} desc={t('settings.profileSub')} />
        <GlassCard className="mt-3 space-y-5 p-6">
          <ImageUpload value={avatar} onChange={setAvatar} shape="circle" hint={t('settings.avatarHint')} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('settings.displayName')} htmlFor="s-name">
              <Input id="s-name" value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label={t('settings.role')} htmlFor="s-role">
              <Input id="s-role" value={user.role} disabled />
            </Field>
          </div>
        </GlassCard>
      </RevealItem>

      <RevealItem>
        <PageIntro icon={<Building2 className="size-5" />} title={t('settings.branding')} desc={t('settings.brandingSub')} />
        <GlassCard className="mt-3 space-y-5 p-6">
          <ImageUpload value={logo} onChange={setLogo} shape="square" hint={t('settings.logoHint')} />
          <Field label={t('settings.companyName')} htmlFor="s-company">
            <Input id="s-company" value={company} onChange={(e) => setCompany(e.target.value)} />
          </Field>
        </GlassCard>
      </RevealItem>

      <RevealItem className="flex justify-end gap-2">
        <Button variant="outline">{t('forms.cancel')}</Button>
        <Button onClick={save} disabled={saving}>{saving ? t('forms.saving') : t('forms.save')}</Button>
      </RevealItem>
    </Reveal>
  );
}

function PageIntro({ icon, title, desc }: { icon: ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">{icon}</span>
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}
