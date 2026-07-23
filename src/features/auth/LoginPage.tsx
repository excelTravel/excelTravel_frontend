import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Bus, Mail, Phone, ArrowRight, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Reveal } from '@/components/motion/Motion';
import { authApi } from '@/lib/api/auth';
import { useSession } from '@/lib/auth/session';
import { cn } from '@/lib/utils';

type Channel = 'phone' | 'email';
const RESEND_SECONDS = 60;

// Reusable 6-digit OTP Input component
function OTPInput({ length = 6, value, onChange, error, busy, onComplete }: { length?: number, value: string, onChange: (v: string) => void, error: boolean, busy: boolean, onComplete: () => void }) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    if (!val) return;
    const chars = value.split('');
    chars[i] = val[val.length - 1];
    const newVal = chars.join('').substring(0, length);
    onChange(newVal);
    if (i < length - 1) inputsRef.current[i + 1]?.focus();
    if (newVal.length === length) onComplete();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      const chars = value.split('');
      if (chars[i]) {
        chars[i] = '';
        onChange(chars.join(''));
      } else if (i > 0) {
        inputsRef.current[i - 1]?.focus();
        chars[i - 1] = '';
        onChange(chars.join(''));
      }
    } else if (e.key === 'ArrowLeft' && i > 0) {
      inputsRef.current[i - 1]?.focus();
    } else if (e.key === 'ArrowRight' && i < length - 1) {
      inputsRef.current[i + 1]?.focus();
    } else if (e.key === 'Enter' && value.length === length) {
      onComplete();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (pasted) {
      onChange(pasted);
      const nextIndex = Math.min(pasted.length, length - 1);
      inputsRef.current[nextIndex]?.focus();
      if (pasted.length === length) onComplete();
    }
  };

  const isComplete = value.length === length;
  const showSuccess = isComplete && !error && !busy;

  return (
    <div className="flex justify-between gap-2" onPaste={handlePaste}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (inputsRef.current[i] = el)}
          type="text"
          inputMode="numeric"
          pattern="\d*"
          maxLength={1}
          value={value[i] || ''}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          disabled={busy}
          className={cn(
            'w-12 h-14 text-center text-xl font-bold rounded-xl border-2 transition-all focus:outline-none focus:ring-4',
            error ? 'border-red-500 text-red-600 focus:ring-red-500/20 bg-red-50' :
            showSuccess ? 'border-green-500 text-green-700 bg-green-50' :
            value[i] ? 'border-[#0e76db] text-slate-900 bg-blue-50' :
            'border-slate-200 text-slate-900 bg-slate-50 focus:border-[#0e76db] focus:bg-white focus:ring-[#0e76db]/10'
          )}
        />
      ))}
    </div>
  );
}

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setSession = useSession((s) => s.setSession);

  const [channel, setChannel] = useState<Channel>('phone');
  const [signup, setSignup] = useState(false);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => () => clearInterval(timer.current), []);
  function startCooldown() {
    setCooldown(RESEND_SECONDS);
    clearInterval(timer.current);
    timer.current = setInterval(() => setCooldown((c) => (c <= 1 ? (clearInterval(timer.current), 0) : c - 1)), 1000);
  }

  function reset(next: Partial<{ channel: Channel; signup: boolean }>) {
    setCode(''); setDevCode(null); setErrors({});
    if (next.channel !== undefined) setChannel(next.channel);
    if (next.signup !== undefined) setSignup(next.signup);
  }

  async function requestCode() {
    setErrors({});
    let hasErr = false;
    const newErr: Record<string, string> = {};

    if (channel === 'phone' && !phone.trim()) { newErr.phone = t('auth.needPhone'); hasErr = true; }
    if (channel === 'email' && !email.trim()) { newErr.email = t('auth.needEmail'); hasErr = true; }
    if (channel === 'phone' && signup && !name.trim()) { newErr.name = t('auth.needName'); hasErr = true; }
    
    if (hasErr) { setErrors(newErr); return; }

    setBusy(true);
    try {
      const payloadId = channel === 'email' ? email.trim().toLowerCase() : (phone.startsWith('+') ? phone.trim() : `+250${phone.trim()}`);
      const res = channel === 'phone' && signup
        ? await authApi.register({ phone: payloadId, name: name.trim() })
        : await authApi.requestOtp({ identifier: payloadId });
      
      setDevCode(res.devCode ?? null);
      setCode('');
      startCooldown();
    } catch (e) {
      setErrors({ form: e instanceof Error ? e.message : t('auth.failed') });
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    setErrors({});
    if (code.length < 6) {
      setErrors({ code: t('auth.needCode') });
      return;
    }
    setBusy(true);
    try {
      const payloadId = channel === 'email' ? email.trim().toLowerCase() : (phone.startsWith('+') ? phone.trim() : `+250${phone.trim()}`);
      const tokens = channel === 'phone' && signup
        ? await authApi.verifyPhone({ phone: payloadId, code: code.trim() })
        : await authApi.verifyOtp({ identifier: payloadId, code: code.trim() });
      setSession(tokens);
      navigate('/', { replace: true });
    } catch (e) {
      setErrors({ code: e instanceof Error ? e.message : t('auth.badCode') });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-dvh relative flex items-center justify-center p-4 sm:p-8 bg-slate-900 overflow-hidden">
      {/* Full Page Background Image */}
      <img src="/story-real-bg.png" alt="Excel Tours Background" className="absolute inset-0 w-full h-full object-cover opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/40 to-slate-900/80 backdrop-blur-sm mix-blend-multiply" />
      
      <Reveal className="relative z-10 w-full max-w-[440px]">
        {/* Center Overlay Card */}
        <div className="bg-white/95 backdrop-blur-2xl rounded-[32px] p-8 sm:p-10 shadow-2xl border border-white/20">
          
          {/* Logo & Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0e76db] to-blue-600 text-white shadow-lg shadow-blue-500/30 mb-4">
              <Bus className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">
              excel<span className="text-[#0e76db]">Travel</span>
            </h1>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest">
              {channel === 'phone' ? (signup ? t('auth.createTitle') : t('auth.phoneTitle')) : t('auth.staffTitle')}
            </h2>
          </div>

          {errors.form && (
            <div className="mb-6 flex items-center gap-3 rounded-2xl bg-red-50 border border-red-100 p-4 text-sm font-medium text-red-600 shadow-sm animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="size-5 shrink-0" />
              <p>{errors.form}</p>
            </div>
          )}

          <div className="space-y-6">
            {channel === 'phone' ? (
              <>
                {signup && (
                  <div className="space-y-1">
                    <div className={cn("relative group rounded-2xl border-2 transition-all bg-slate-50 focus-within:bg-white", errors.name ? "border-red-300 focus-within:border-red-500" : "border-transparent focus-within:border-[#0e76db] focus-within:ring-4 focus-within:ring-[#0e76db]/10")}>
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#0e76db]" />
                      <input 
                        id="a-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" autoComplete="name"
                        className="w-full bg-transparent py-4 pl-12 pr-4 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                      />
                    </div>
                    {errors.name && <p className="text-xs font-bold text-red-500 pl-2">{errors.name}</p>}
                  </div>
                )}

                <div className="flex gap-2 items-start">
                  <div className={cn("relative flex flex-1 items-center rounded-2xl border-2 transition-all bg-slate-50 focus-within:bg-white", errors.phone ? "border-red-300 focus-within:border-red-500" : "border-transparent focus-within:border-[#0e76db] focus-within:ring-4 focus-within:ring-[#0e76db]/10")}>
                    {/* Rwanda Flag & Prefix */}
                    <div className="flex items-center gap-2 pl-4 pr-3 py-4 border-r border-slate-200">
                      <img src="https://flagcdn.com/w20/rw.png" srcSet="https://flagcdn.com/w40/rw.png 2x" alt="Rwanda" className="w-5 rounded-[2px]" />
                      <span className="text-sm font-bold text-slate-700">+250</span>
                    </div>
                    <input 
                      id="a-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="788 000 000" autoComplete="tel" autoFocus
                      className="w-full bg-transparent py-4 px-3 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none tracking-wide"
                    />
                  </div>
                  <button 
                    type="button" 
                    disabled={busy || cooldown > 0} 
                    onClick={() => void requestCode()}
                    className="shrink-0 h-[56px] px-4 rounded-2xl bg-blue-50 border-2 border-blue-100 text-sm font-bold text-[#0e76db] transition-all hover:bg-blue-100 hover:border-blue-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {cooldown > 0 ? t('auth.resendIn', { s: cooldown }) : t('auth.requestCode')}
                  </button>
                </div>
                {errors.phone && <p className="text-xs font-bold text-red-500 pl-2 -mt-4">{errors.phone}</p>}
              </>
            ) : (
              <div className="flex gap-2 items-start">
                <div className={cn("relative flex-1 group rounded-2xl border-2 transition-all bg-slate-50 focus-within:bg-white", errors.email ? "border-red-300 focus-within:border-red-500" : "border-transparent focus-within:border-[#0e76db] focus-within:ring-4 focus-within:ring-[#0e76db]/10")}>
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#0e76db]" />
                  <input 
                    id="a-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="staff@exceltravel.rw" autoComplete="email" autoFocus
                    className="w-full bg-transparent py-4 pl-12 pr-4 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
                <button 
                  type="button" 
                  disabled={busy || cooldown > 0} 
                  onClick={() => void requestCode()}
                  className="shrink-0 h-[56px] px-4 rounded-2xl bg-blue-50 border-2 border-blue-100 text-sm font-bold text-[#0e76db] transition-all hover:bg-blue-100 hover:border-blue-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {cooldown > 0 ? t('auth.resendIn', { s: cooldown }) : t('auth.requestCode')}
                </button>
                {errors.email && <p className="text-xs font-bold text-red-500 pl-2 -mt-4 absolute">{errors.email}</p>}
              </div>
            )}

            <div className="pt-2 animate-in fade-in">
              <div className="mb-3 flex items-center justify-between">
                <label className="text-sm font-bold text-slate-700">Enter OTP Code</label>
                {devCode && <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700"><CheckCircle2 className="w-3 h-3" /> {devCode}</span>}
              </div>
              <OTPInput length={6} value={code} onChange={setCode} error={!!errors.code} busy={busy} onComplete={verify} />
              {errors.code && <p className="text-xs font-bold text-red-500 text-center mt-3">{errors.code}</p>}
            </div>

            <div className="pt-2">
              <button 
                type="button" 
                onClick={verify} 
                disabled={busy || code.length < 6} 
                className="flex w-full items-center justify-center rounded-2xl bg-[#0e76db] px-8 py-4 text-lg font-bold text-white shadow-lg shadow-[#0e76db]/20 transition-all hover:bg-blue-700 hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none disabled:transform-none active:scale-[0.98]"
              >
                {busy ? t('auth.verifying') : (channel === 'phone' && signup ? t('auth.createTitle') : t('auth.login'))}
              </button>
            </div>

            {channel === 'phone' && (
              <div className="text-center pt-1">
                <button type="button" className="text-sm font-bold text-slate-500 hover:text-[#0e76db] transition-colors" onClick={() => reset({ signup: !signup })}>
                  {signup ? t('auth.haveAccount') : t('auth.newHere')}
                </button>
              </div>
            )}
          </div>

          <div className="mt-8">
            <div className="relative flex items-center py-5">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink-0 mx-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('auth.or')}</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>
            
            <button
              type="button"
              onClick={() => reset({ channel: channel === 'phone' ? 'email' : 'phone', signup: false })}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-slate-100 bg-white px-4 py-4 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98]"
            >
              {channel === 'phone' ? <><Mail className="w-5 h-5 text-slate-400" /> Continue with company email</> : <><Phone className="w-5 h-5 text-slate-400" /> Continue with phone number</>}
            </button>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
