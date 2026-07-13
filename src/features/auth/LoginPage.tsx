import { SignIn } from '@clerk/clerk-react';
import { useTranslation } from 'react-i18next';
import { Bus } from 'lucide-react';

// Branded sign-in: navy brand panel + Clerk's <SignIn> (which shows "Continue with Google" when Google
// OAuth is enabled in the Clerk dashboard). Staff sign in with their invited email.
export function LoginPage() {
  const { t } = useTranslation();
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[hsl(var(--navy))] p-12 text-white lg:flex">
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
      </div>

      <div className="app-gradient flex items-center justify-center p-6">
        <SignIn
          appearance={{ variables: { colorPrimary: '#0F766E', borderRadius: '0.75rem' } }}
          fallbackRedirectUrl="/"
          signUpUrl="/login"
        />
      </div>
    </div>
  );
}
