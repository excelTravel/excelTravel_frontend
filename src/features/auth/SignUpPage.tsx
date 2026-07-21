import { SignUp } from '@clerk/clerk-react';
import { useTranslation } from 'react-i18next';
import { Bus } from 'lucide-react';
import { Reveal, RevealItem } from '@/components/motion/Motion';

// Branded sign-up: same navy brand panel as login. Used to create the first ops account (its role + company
// come from the pre-created users row matched by email). Staff added later arrive via an invitation link.
export function SignUpPage() {
  const { t } = useTranslation();
  return (
    <Reveal className="grid min-h-dvh lg:grid-cols-2">
      <RevealItem className="relative hidden flex-col justify-between overflow-hidden bg-[hsl(var(--navy))] p-12 text-white lg:flex">
        <div className="flex items-center gap-2 font-semibold">
          <span className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-teal">
            <Bus className="size-5" />
          </span>
          {t('app.name')}
        </div>
        <div className="relative z-10">
          <h1 className="max-w-md text-3xl font-bold leading-tight">{t('login.headline')}</h1>
          <p className="mt-3 max-w-sm text-white/60">{t('login.sub')}</p>
        </div>
        <p className="relative z-10 text-xs text-white/40">© {new Date().getFullYear()} excelTravel · Rwanda</p>
        <div className="pointer-events-none absolute -right-24 top-1/4 size-96 rounded-full bg-teal/10 blur-3xl" aria-hidden />
      </RevealItem>

      <RevealItem className="app-gradient flex items-center justify-center p-6">
        <SignUp
          appearance={{ variables: { colorPrimary: '#0F766E', borderRadius: '0.75rem' } }}
          fallbackRedirectUrl="/"
          signInUrl="/login"
        />
      </RevealItem>
    </Reveal>
  );
}
