import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Bus, Mail, Phone, ArrowRight } from 'lucide-react';
import { Reveal, RevealItem } from '@/components/motion/Motion';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/form';
import { authApi } from '@/lib/api/auth';
import { useSession } from '@/lib/auth/session';
import { cn } from '@/lib/utils';

type Channel = 'phone' | 'email';
type Step = 'identify' | 'code';
const RESEND_SECONDS = 60;

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setSession = useSession((s) => s.setSession);

  const [channel, setChannel] = useState<Channel>('phone');
  const [signup, setSignup] = useState(false); // phone channel only: new passenger
  const [step, setStep] = useState<Step>('identify');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval>>();

  const identifier = channel === 'email' ? email.trim().toLowerCase() : phone.trim();

  useEffect(() => () => clearInterval(timer.current), []);
  function startCooldown() {
    setCooldown(RESEND_SECONDS);
    clearInterval(timer.current);
    timer.current = setInterval(() => setCooldown((c) => (c <= 1 ? (clearInterval(timer.current), 0) : c - 1)), 1000);
  }

  function reset(next: Partial<{ channel: Channel; signup: boolean }>) {
    setStep('identify'); setCode(''); setDevCode(null); setErr(null);
    if (next.channel !== undefined) setChannel(next.channel);
    if (next.signup !== undefined) setSignup(next.signup);
  }

  async function requestCode() {
    setErr(null);
    if (channel === 'phone' && !phone.trim()) return setErr(t('auth.needPhone'));
    if (channel === 'email' && !email.trim()) return setErr(t('auth.needEmail'));
    if (channel === 'phone' && signup && !name.trim()) return setErr(t('auth.needName'));
    setBusy(true);
    try {
      const res = channel === 'phone' && signup
        ? await authApi.register({ phone: phone.trim(), name: name.trim() })
        : await authApi.requestOtp({ identifier });
      setDevCode(res.devCode ?? null);
      setStep('code');
      startCooldown();
    } catch (e) {
      setErr(e instanceof Error ? e.message : t('auth.failed'));
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    setErr(null);
    if (!code.trim()) return setErr(t('auth.needCode'));
    setBusy(true);
    try {
      const tokens = channel === 'phone' && signup
        ? await authApi.verifyPhone({ phone: phone.trim(), code: code.trim() })
        : await authApi.verifyOtp({ identifier, code: code.trim() });
      setSession(tokens);
      navigate('/', { replace: true });
    } catch (e) {
      setErr(e instanceof Error ? e.message : t('auth.badCode'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Reveal className="grid min-h-dvh lg:grid-cols-2">
      <RevealItem className="relative hidden flex-col justify-between overflow-hidden bg-[hsl(var(--navy))] p-12 text-white lg:flex">
        <div className="flex items-center gap-2 font-semibold">
          <span className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-teal"><Bus className="size-5" /></span>
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
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card/80 p-8 shadow-xl backdrop-blur">
          <h2 className="text-xl font-bold tracking-tight">
            {channel === 'phone' ? (signup ? t('auth.createTitle') : t('auth.phoneTitle')) : t('auth.staffTitle')}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{step === 'identify' ? t('auth.sub') : t('auth.codeSub')}</p>

          {err && <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{err}</p>}

          {step === 'identify' ? (
            <form className="mt-5 space-y-4" onSubmit={(e) => { e.preventDefault(); void requestCode(); }}>
              {channel === 'phone' ? (
                <>
                  {signup && (
                    <Field label={t('auth.name')} htmlFor="a-name" required>
                      <Input id="a-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jean Uwase" autoComplete="name" />
                    </Field>
                  )}
                  <Field label={t('auth.phone')} htmlFor="a-phone" required>
                    <Input id="a-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0788 000 000" autoComplete="tel" autoFocus />
                  </Field>
                </>
              ) : (
                <Field label={t('auth.email')} htmlFor="a-email" required>
                  <Input id="a-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@exceltravel.rw" autoComplete="email" autoFocus />
                </Field>
              )}
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? t('auth.sending') : t('auth.requestCode')} <ArrowRight className="size-4" />
              </Button>
              {channel === 'phone' && (
                <button type="button" className="w-full text-center text-xs text-muted-foreground hover:text-foreground" onClick={() => reset({ signup: !signup })}>
                  {signup ? t('auth.haveAccount') : t('auth.newHere')}
                </button>
              )}
            </form>
          ) : (
            <form className="mt-5 space-y-4" onSubmit={(e) => { e.preventDefault(); void verify(); }}>
              <p className="text-sm text-muted-foreground">{t('auth.sentTo', { target: channel === 'email' ? email : phone })}</p>
              {devCode && <p className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">{t('auth.devCode', { code: devCode })}</p>}
              <Field label={t('auth.code')} htmlFor="a-code" required>
                <Input id="a-code" inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" maxLength={8} autoFocus />
              </Field>
              <Button type="submit" className="w-full" disabled={busy}>{busy ? t('auth.verifying') : t('auth.login')}</Button>
              <div className="flex items-center justify-between text-xs">
                <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => setStep('identify')}>{t('auth.back')}</button>
                <button type="button" disabled={cooldown > 0 || busy} className="text-primary disabled:text-muted-foreground" onClick={() => void requestCode()}>
                  {cooldown > 0 ? t('auth.resendIn', { s: cooldown }) : t('auth.resend')}
                </button>
              </div>
            </form>
          )}

          {step === 'identify' && (
            <>
              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> {t('auth.or')} <span className="h-px flex-1 bg-border" />
              </div>
              <button
                type="button"
                onClick={() => reset({ channel: channel === 'phone' ? 'email' : 'phone', signup: false })}
                className={cn('flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-secondary')}
              >
                {channel === 'phone' ? <><Mail className="size-4" /> {t('auth.staffEmail')}</> : <><Phone className="size-4" /> {t('auth.usePhone')}</>}
              </button>
            </>
          )}
        </div>
      </RevealItem>
    </Reveal>
  );
}
