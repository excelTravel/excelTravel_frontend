import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Bus, Mail, Phone, ArrowRight, Lock, User, ArrowRightCircle } from 'lucide-react';
import { Reveal, RevealItem } from '@/components/motion/Motion';
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
  const [signup, setSignup] = useState(false);
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
    <Reveal className="flex min-h-dvh flex-col lg:flex-row bg-white text-slate-900">
      {/* Graphic Panel */}
      <RevealItem className="relative flex flex-col items-center justify-center lg:w-[45%] bg-[#0e76db] overflow-hidden rounded-b-[40px] lg:rounded-b-none lg:rounded-r-[60px] p-10 min-h-[40vh] lg:min-h-full">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <svg className="absolute -left-10 -top-10 text-white/10 w-96 h-96" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path fill="currentColor" d="M42.7,-73.4C55.9,-65.8,67.7,-54.6,76.5,-41.5C85.3,-28.4,91.1,-14.2,90.4,-0.4C89.7,13.4,82.5,26.8,73.5,38.6C64.5,50.4,53.8,60.5,41.4,68.4C29,76.3,14.5,82,-0.5,82.8C-15.5,83.7,-31.1,79.8,-43.8,72C-56.5,64.2,-66.3,52.5,-73.3,39.6C-80.3,26.7,-84.6,13.3,-84.3,0.2C-84,-12.9,-79.1,-25.8,-71.4,-36.8C-63.7,-47.8,-53.2,-56.9,-41.2,-65.1C-29.2,-73.3,-14.6,-80.6,0.5,-81.4C15.6,-82.3,31.2,-76.8,42.7,-73.4Z" transform="translate(100 100)" />
          </svg>
          <svg className="absolute -right-20 -bottom-20 text-blue-800/20 w-[500px] h-[500px]" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path fill="currentColor" d="M37.5,-59.6C49.9,-48.9,62,-39.8,69.5,-27.6C77,-15.4,79.9,-0.1,77.7,14.6C75.5,29.3,68.2,43.3,56.6,52.2C45,61.1,29.1,64.9,13.8,66.7C-1.5,68.5,-16.2,68.3,-29.4,62.6C-42.6,56.9,-54.3,45.8,-63.3,32.4C-72.3,19,-78.6,3.3,-76.9,-11.5C-75.2,-26.3,-65.5,-40.2,-53.1,-50.7C-40.7,-61.2,-25.6,-68.3,-11.7,-67.2C2.2,-66.1,16.2,-56.8,25.1,-70.3C29.6,-77.2,33.5,-66.7,37.5,-59.6Z" transform="translate(100 100)" />
          </svg>
        </div>

        <div className="relative z-10 w-full max-w-[320px] lg:max-w-[450px]">
          <img src="/illustration.png" alt="Rwandan Culture Illustration" className="w-full h-auto drop-shadow-2xl hover:scale-105 transition-transform duration-700 ease-out" />
        </div>
      </RevealItem>

      {/* Form Panel */}
      <RevealItem className="flex flex-1 flex-col justify-center items-center p-8 lg:p-16">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#0e76db] text-white shadow-lg shadow-blue-500/30">
              <Bus className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight leading-none">excel<span className="text-[#0e76db]">Travel</span></h1>
              <p className="text-xs text-slate-500 font-medium tracking-wide">Acesse sua conta / Sign in</p>
            </div>
          </div>

          <h2 className="text-xl font-semibold text-slate-800 mb-2">
            {channel === 'phone' ? (signup ? t('auth.createTitle') : t('auth.phoneTitle')) : t('auth.staffTitle')}
          </h2>
          <p className="text-sm text-slate-500 mb-8">{step === 'identify' ? t('auth.sub') : t('auth.codeSub')}</p>

          {err && <p className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 shadow-sm" role="alert">{err}</p>}

          {step === 'identify' ? (
            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); void requestCode(); }}>
              {channel === 'phone' ? (
                <>
                  {signup && (
                    <div className="relative group">
                      <User className="absolute left-0 top-3 h-5 w-5 text-slate-400 group-focus-within:text-[#0e76db] transition-colors" />
                      <input 
                        id="a-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Uwase" autoComplete="name" required
                        className="w-full border-0 border-b-2 border-slate-200 bg-transparent py-3 pl-8 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0e76db] focus:outline-none focus:ring-0 transition-colors"
                      />
                    </div>
                  )}
                  <div className="relative group">
                    <Phone className="absolute left-0 top-3 h-5 w-5 text-slate-400 group-focus-within:text-[#0e76db] transition-colors" />
                    <input 
                      id="a-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0788 000 000" autoComplete="tel" autoFocus required
                      className="w-full border-0 border-b-2 border-slate-200 bg-transparent py-3 pl-8 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0e76db] focus:outline-none focus:ring-0 transition-colors"
                    />
                  </div>
                </>
              ) : (
                <div className="relative group">
                  <Mail className="absolute left-0 top-3 h-5 w-5 text-slate-400 group-focus-within:text-[#0e76db] transition-colors" />
                  <input 
                    id="a-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@exceltravel.rw" autoComplete="email" autoFocus required
                    className="w-full border-0 border-b-2 border-slate-200 bg-transparent py-3 pl-8 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0e76db] focus:outline-none focus:ring-0 transition-colors"
                  />
                </div>
              )}

              <div className="pt-2">
                <button type="submit" disabled={busy} className="group flex w-full items-center justify-center gap-2 rounded-full bg-[#0e76db] px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:bg-blue-700 hover:shadow-xl disabled:opacity-70 disabled:pointer-events-none active:scale-[0.98]">
                  {busy ? t('auth.sending') : 'ENTRAR'} 
                  {!busy && <ArrowRightCircle className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                </button>
              </div>

              {channel === 'phone' && (
                <div className="text-center mt-4">
                  <button type="button" className="text-xs font-semibold text-[#0e76db] hover:underline" onClick={() => reset({ signup: !signup })}>
                    {signup ? t('auth.haveAccount') : 'Esqueceu a senha? / New here?'}
                  </button>
                </div>
              )}
            </form>
          ) : (
            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); void verify(); }}>
              <p className="text-sm text-slate-500">{t('auth.sentTo', { target: channel === 'email' ? email : phone })}</p>
              {devCode && <p className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm font-medium text-blue-700">{t('auth.devCode', { code: devCode })}</p>}
              
              <div className="relative group">
                <Lock className="absolute left-0 top-3 h-5 w-5 text-slate-400 group-focus-within:text-[#0e76db] transition-colors" />
                <input 
                  id="a-code" inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" maxLength={8} autoFocus required
                  className="w-full border-0 border-b-2 border-slate-200 bg-transparent py-3 pl-8 pr-3 text-sm font-mono text-slate-900 tracking-widest placeholder:text-slate-400 placeholder:tracking-normal focus:border-[#0e76db] focus:outline-none focus:ring-0 transition-colors"
                />
              </div>

              <div className="pt-2">
                <button type="submit" disabled={busy} className="group flex w-full items-center justify-center gap-2 rounded-full bg-[#0e76db] px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:bg-blue-700 hover:shadow-xl disabled:opacity-70 disabled:pointer-events-none active:scale-[0.98]">
                  {busy ? t('auth.verifying') : 'CONFIRMAR'} 
                  {!busy && <ArrowRightCircle className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                </button>
              </div>

              <div className="flex items-center justify-between text-xs font-medium pt-4">
                <button type="button" className="text-slate-500 hover:text-slate-800 transition-colors" onClick={() => setStep('identify')}>{t('auth.back')}</button>
                <button type="button" disabled={cooldown > 0 || busy} className="text-[#0e76db] disabled:text-slate-400 transition-colors" onClick={() => void requestCode()}>
                  {cooldown > 0 ? t('auth.resendIn', { s: cooldown }) : t('auth.resend')}
                </button>
              </div>
            </form>
          )}

          {step === 'identify' && (
            <div className="mt-10 pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={() => reset({ channel: channel === 'phone' ? 'email' : 'phone', signup: false })}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 active:scale-[0.98]"
              >
                {channel === 'phone' ? <><Mail className="size-4" /> {t('auth.staffEmail')}</> : <><Phone className="size-4" /> {t('auth.usePhone')}</>}
              </button>
            </div>
          )}
        </div>
      </RevealItem>
    </Reveal>
  );
}
