'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useLang } from '@/components/providers/LangProvider';
import { useAuth } from '@/hooks/useAuth';
import { useBiometric } from '@/hooks/useBiometric';
import { GoogleIcon } from '@/components/auth/GoogleIcon';
import { getGoogleOAuthUrl } from '@/lib/auth';
import { isBiometricEnabled, isPwaInstalled } from '@/lib/biometric';
import type { Lang } from '@/types';
import { cn } from '@/lib/utils';

const LOGIN_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCmzllw090TnxarIlW1Itlh6BLpUEBBGPXB5JkMHEa5-gC7W7kD7sx_RllRY9lj8nJzZu3qRmHzRisTLuNDyLrogSOka2IBVIDkQ_rtuFI-QvhlnZRGj43qHtA-QFdtHECL3KNtaTaORllDpjb9-2DKhgg-chHNP7nfsAzZKlppt1tkZ3RQoCh3iYUs6Z4xeRQepErb5moNkXouNgkp3ns6oIRT5UQIBLN5vnRvbp7PRaQPLRcKeQQ6bw3kgd77ZesGVZrxFw_rolHV';

const LANGS: { code: Lang; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'de', label: 'DE' },
  { code: 'ar', label: 'AR' },
];

export default function LoginPage() {
  const { lang, setLang, tr } = useLang();
  const { login } = useAuth();
  const { loginWithBiometric, loading: bioLoading } = useBiometric();
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const orbRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showBiometric, setShowBiometric] = useState(false);

  const brandName = lang === 'ar' ? tr.appNameAr : tr.appName;

  useEffect(() => {
    const oauthError = new URLSearchParams(window.location.search).get('error');
    if (oauthError === 'oauth') {
      setError(tr.loginFailed);
    }
  }, [tr.loginFailed]);

  useEffect(() => {
    setShowBiometric(isPwaInstalled() && isBiometricEnabled());
  }, []);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      const isDesktop = window.matchMedia('(min-width: 768px)').matches;

      if (isDesktop) {
        const card = cardRef.current;
        if (!card) return;
        const moveX = (e.clientX - window.innerWidth / 2) * 0.01;
        const moveY = (e.clientY - window.innerHeight / 2) * 0.01;
        card.style.transform = `translate(${moveX}px, ${moveY}px)`;
        return;
      }

      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      orbRefs.current.forEach((orb, index) => {
        if (!orb) return;
        const speed = (index + 1) * 20;
        orb.style.transform = `translate(${x * speed}px, ${y * speed}px)`;
      });
    };

    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  const handleGoogleLogin = () => {
    window.location.href = getGoogleOAuthUrl();
  };

  const redirectAfterLogin = async (token: string) => {
    const redirectTo = new URLSearchParams(window.location.search).get('redirect');
    const { fetchCurrentUser, isAdmin, isStaff } = await import('@/lib/auth');
    const u = await fetchCurrentUser(token);
    if (redirectTo) router.push(redirectTo);
    else if (u && isAdmin(u)) router.push('/admin');
    else if (u && isStaff(u)) router.push('/staff');
    else router.push('/staff');
  };

  const handleBiometricLogin = async () => {
    setError(null);
    const { user: u, error: bioErr } = await loginWithBiometric();
    if (!u) {
      setError(bioErr === 'expired' ? tr.biometricExpired : tr.biometricFailed);
      return;
    }
    const token = localStorage.getItem('dt_access');
    if (token) await redirectAfterLogin(token);
    else router.push('/staff');
  };

  const cycleLanguage = () => {
    const idx = LANGS.findIndex((l) => l.code === lang);
    setLang(LANGS[(idx + 1) % LANGS.length].code);
  };

  const getReadableError = (err: unknown): string => {
    if (typeof err === 'object' && err !== null && 'errors' in err) {
      const errors = (err as { errors?: Array<{ message?: string; extensions?: { code?: string } }> }).errors;
      if (Array.isArray(errors) && errors.length > 0) {
        const first = errors[0];
        const code = first?.extensions?.code;
        if (code === 'INVALID_CREDENTIALS') return tr.loginInvalidCredentials;
        return first?.message ?? tr.loginFailed;
      }
    }
    if (err instanceof Error) {
      const msg = err.message.toLowerCase();
      if (msg.includes('failed to fetch')) return tr.loginNetworkError;
      if (msg.includes('502')) return tr.loginServerUnavailable;
      return err.message;
    }
    return tr.loginFailed;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      const token = localStorage.getItem('dt_access');
      if (token) await redirectAfterLogin(token);
      else router.push('/staff');
    } catch (err: unknown) {
      setError(getReadableError(err));
    } finally {
      setLoading(false);
    }
  };

  const errorBlock = error ? (
    <p className="font-body-sm text-body-sm text-error bg-error/10 border border-error/20 rounded-lg px-4 py-3">
      {error}
    </p>
  ) : null;

  return (
    <>
      {/* Mobile layout */}
      <div className="md:hidden login-mobile-shell min-h-screen flex flex-col items-center justify-between py-12 px-margin-mobile relative font-body-lg text-on-surface">
        <div
          ref={(el) => {
            orbRefs.current[0] = el;
          }}
          className="floating-orb top-[-10%] left-[-20%] animate-pulse"
        />
        <div
          ref={(el) => {
            orbRefs.current[1] = el;
          }}
          className="floating-orb bottom-[-5%] right-[-10%] animate-pulse"
          style={{ animationDelay: '2s' }}
        />

        <header className="w-full flex justify-between items-center px-margin-mobile pt-stack-md z-10">
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-secondary tracking-tight font-arabic">
            {brandName}
          </h1>
          <button
            type="button"
            onClick={cycleLanguage}
            className="text-on-surface-variant hover:text-secondary transition-colors scale-95 active:scale-90 transition-transform"
            aria-label={tr.settings}
          >
            <span className="material-symbols-outlined login-mobile-icon">language</span>
          </button>
        </header>

        <main className="w-full max-w-md px-margin-mobile flex flex-col items-center flex-grow justify-center z-10">
          <div className="text-center mb-stack-lg">
            <div className="mb-stack-md inline-block p-4 rounded-full bg-secondary/10 border border-secondary/20">
              <span className="material-symbols-outlined text-secondary text-4xl login-mobile-icon-filled">
                lock_open
              </span>
            </div>
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-background mb-2">
              {tr.loginWelcomeBack}
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant/80">{tr.loginMobileSubtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="w-full space-y-stack-md">
            <div className="relative group">
              <div className="absolute inset-y-0 start-0 ps-4 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-on-surface-variant group-focus-within:text-secondary transition-colors login-mobile-icon">
                  mail
                </span>
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={tr.loginEmailLabel}
                required
                dir={lang === 'ar' ? 'rtl' : 'ltr'}
                className="w-full h-14 bg-surface/40 border-b-2 border-outline-variant/30 focus:border-secondary focus:ring-0 login-glass-mobile rounded-t-xl ps-12 pe-4 font-body-lg text-body-lg text-on-surface transition-all placeholder:text-on-surface-variant/40 outline-none"
              />
            </div>

            <div className="relative group">
              <div className="absolute inset-y-0 start-0 ps-4 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-on-surface-variant group-focus-within:text-secondary transition-colors login-mobile-icon">
                  key
                </span>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={tr.loginPasswordLabel}
                required
                dir={lang === 'ar' ? 'rtl' : 'ltr'}
                className="w-full h-14 bg-surface/40 border-b-2 border-outline-variant/30 focus:border-secondary focus:ring-0 login-glass-mobile rounded-t-xl ps-12 pe-12 font-body-lg text-body-lg text-on-surface transition-all placeholder:text-on-surface-variant/40 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 end-0 pe-4 flex items-center text-on-surface-variant"
                aria-label={showPassword ? tr.password : tr.password}
              >
                <span className="material-symbols-outlined login-mobile-icon">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                className="font-label-caps text-label-caps text-secondary/80 hover:text-secondary transition-colors tracking-widest"
              >
                {tr.loginForgotPasswordCaps}
              </button>
            </div>

            {errorBlock}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-secondary text-on-secondary font-label-caps text-label-caps py-4 rounded-xl shadow-lg shadow-secondary/10 transition-all active:scale-[0.98] btn-hover-glow mt-stack-lg disabled:opacity-80 disabled:cursor-not-allowed"
            >
              {loading ? tr.loginAuthenticating : tr.loginAuthorize}
            </button>
          </form>

          <div className="mt-stack-lg flex items-center gap-4 w-full">
            <div className="h-px bg-outline-variant/30 flex-grow" />
            <span className="font-label-caps text-[10px] text-on-surface-variant/50">{tr.loginOrSecure}</span>
            <div className="h-px bg-outline-variant/30 flex-grow" />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="mt-stack-md w-full h-14 login-glass-mobile rounded-xl flex items-center justify-center gap-3 text-on-surface hover:text-on-surface transition-all border border-outline-variant/20 hover:border-secondary/40 active:scale-[0.98]"
          >
            <GoogleIcon className="w-5 h-5 shrink-0" />
            <span className="font-title-md text-title-md">{tr.loginWithGoogle}</span>
          </button>

          {showBiometric && (
            <button
              type="button"
              onClick={handleBiometricLogin}
              disabled={bioLoading}
              className="mt-stack-md w-full h-14 login-glass-mobile rounded-xl flex items-center justify-center gap-3 text-on-surface hover:text-on-surface transition-all border border-outline-variant/20 hover:border-secondary/40 active:scale-[0.98] disabled:opacity-60"
              aria-label={tr.biometricLogin}
            >
              <span className="material-symbols-outlined login-mobile-icon">fingerprint</span>
              <span className="font-title-md text-title-md">
                {bioLoading ? tr.loginAuthenticating : tr.biometricLogin}
              </span>
            </button>
          )}
        </main>

        <footer className="w-full z-10 flex flex-col items-center gap-6">
          <p className="font-body-sm text-body-sm text-on-surface-variant/60">
            {tr.loginNoAccount}{' '}
            <button type="button" className="text-secondary font-bold hover:underline">
              {tr.loginJoinUmmah}
            </button>
          </p>
          <div className="flex gap-8 items-center">
            {LANGS.map((l, i) => (
              <span key={l.code} className="flex items-center gap-8">
                {i > 0 && <span className="w-px h-3 bg-outline-variant/50" />}
                <button
                  type="button"
                  onClick={() => setLang(l.code)}
                  className={cn(
                    'font-label-caps text-label-caps transition-colors',
                    lang === l.code ? 'text-secondary' : 'text-on-surface-variant/40 hover:text-on-surface-variant'
                  )}
                >
                  {l.label}
                </button>
              </span>
            ))}
          </div>
        </footer>
      </div>

      {/* Desktop layout */}
      <div className="hidden md:flex login-shell min-h-screen flex-col font-body-lg text-on-surface">
        <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-margin-desktop pt-stack-md">
          <div className="flex items-center gap-2">
            <span className="font-headline-lg text-headline-lg text-primary tracking-tight font-arabic">
              {brandName}
            </span>
            <span className="text-label-caps font-label-caps text-secondary px-2 py-0.5 border border-secondary/30 rounded-full bg-secondary/5 uppercase">
              {tr.loginPortal}
            </span>
          </div>
          <div className="flex items-center gap-4 bg-surface-container-low/50 backdrop-blur-md rounded-full px-4 py-2 border border-outline-variant/10">
            {LANGS.map((l, i) => (
              <span key={l.code} className="flex items-center gap-4">
                {i > 0 && <div className="w-px h-3 bg-outline-variant/30" />}
                <button
                  type="button"
                  onClick={() => setLang(l.code)}
                  className={cn(
                    'font-label-caps text-label-caps transition-colors px-2',
                    lang === l.code ? 'text-secondary' : 'text-on-surface-variant hover:text-secondary'
                  )}
                >
                  {l.label}
                </button>
              </span>
            ))}
            <span className="material-symbols-outlined text-primary text-sm ms-2">language</span>
          </div>
        </header>

        <main className="flex-grow flex items-center justify-center p-gutter relative overflow-hidden">
          <div className="absolute inset-0 z-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-secondary/5 rounded-full blur-[120px] subtle-pulse" />
          </div>

          <div
            ref={cardRef}
            className="relative z-10 w-full max-w-[1000px] min-h-[600px] glass-card rounded-xl overflow-hidden flex shadow-2xl flex-row transition-transform duration-100 ease-out"
          >
            <div className="w-1/2 relative bg-primary-container overflow-hidden">
              <Image
                src={LOGIN_IMAGE}
                alt={tr.loginHeroTitle}
                fill
                className="object-cover"
                priority
                sizes="500px"
              />
              <div className="absolute inset-0 mosque-overlay flex flex-col justify-end p-stack-lg">
                <div className="space-y-4">
                  <h2 className="font-display-lg text-display-lg text-primary max-w-sm">{tr.loginHeroTitle}</h2>
                  <p className="font-body-lg text-body-lg text-on-surface-variant/80 max-w-xs">
                    {tr.loginHeroSubtitle}
                  </p>
                  <div className="pt-4 flex gap-4">
                    <div className="flex flex-col">
                      <span className="font-label-caps text-label-caps text-secondary uppercase">
                        {tr.loginPrecision}
                      </span>
                      <span className="text-on-surface/60 text-xs">{tr.loginPrayerTimings}</span>
                    </div>
                    <div className="w-px h-8 bg-outline-variant/30" />
                    <div className="flex flex-col">
                      <span className="font-label-caps text-label-caps text-secondary uppercase">{tr.loginUnity}</span>
                      <span className="text-on-surface/60 text-xs">{tr.loginMosqueNetwork}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-1/2 p-16 flex flex-col justify-center bg-surface/30">
              <div className="mb-stack-lg">
                <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">{tr.loginWelcomeBack}</h1>
                <p className="font-body-sm text-body-sm text-on-surface-variant">{tr.loginDesktopSubtitle}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="font-label-caps text-label-caps text-primary uppercase" htmlFor="email">
                    {tr.loginEmailLabel}
                  </label>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute start-0 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-secondary transition-colors">
                      alternate_email
                    </span>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={tr.loginEmailPlaceholder}
                      required
                      dir={lang === 'ar' ? 'rtl' : 'ltr'}
                      className="w-full bg-transparent border-0 border-b border-outline-variant py-3 ps-8 text-on-surface placeholder:text-outline-variant focus:ring-0 focus:border-secondary transition-all font-body-lg"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center gap-4">
                    <label className="font-label-caps text-label-caps text-primary uppercase" htmlFor="password">
                      {tr.loginPasswordLabel}
                    </label>
                    <button
                      type="button"
                      className="font-label-caps text-label-caps text-secondary/70 hover:text-secondary transition-colors shrink-0"
                    >
                      {tr.loginForgotPassword}
                    </button>
                  </div>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute start-0 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-secondary transition-colors">
                      lock
                    </span>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={tr.loginPasswordPlaceholder}
                      required
                      dir={lang === 'ar' ? 'rtl' : 'ltr'}
                      className="w-full bg-transparent border-0 border-b border-outline-variant py-3 ps-8 pe-8 text-on-surface placeholder:text-outline-variant focus:ring-0 focus:border-secondary transition-all font-body-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute end-0 top-1/2 -translate-y-1/2 text-outline-variant hover:text-on-surface"
                      aria-label={tr.password}
                    >
                      <span className="material-symbols-outlined text-sm">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-3 pt-2">
                  <input
                    id="remember"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-outline-variant bg-transparent text-secondary focus:ring-secondary/30 accent-secondary"
                  />
                  <label
                    htmlFor="remember"
                    className="font-body-sm text-body-sm text-on-surface-variant select-none cursor-pointer"
                  >
                    {tr.loginRememberMe}
                  </label>
                </div>

                {errorBlock}

                <div className="pt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-secondary-container hover:bg-secondary text-on-secondary font-label-caps text-label-caps py-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 transform active:scale-[0.98] shadow-lg shadow-secondary/10 group disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <span>{loading ? tr.loginAuthorizing : tr.loginAuthorizeDesktop}</span>
                    <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform rtl:group-hover:-translate-x-1">
                      login
                    </span>
                  </button>
                </div>

                <div className="flex items-center gap-4 pt-4">
                  <div className="h-px bg-outline-variant/30 flex-grow" />
                  <span className="font-label-caps text-[10px] text-on-surface-variant/50">
                    {tr.loginOrSecure}
                  </span>
                  <div className="h-px bg-outline-variant/30 flex-grow" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full py-4 rounded-lg flex items-center justify-center gap-3 border border-outline-variant/30 bg-surface/20 hover:border-secondary/40 hover:bg-surface/40 transition-all active:scale-[0.98]"
                >
                  <GoogleIcon className="w-5 h-5 shrink-0" />
                  <span className="font-title-md text-title-md text-on-surface">{tr.loginWithGoogle}</span>
                </button>

                {showBiometric && (
                  <button
                    type="button"
                    onClick={handleBiometricLogin}
                    disabled={bioLoading}
                    className="w-full py-4 rounded-lg flex items-center justify-center gap-3 border border-outline-variant/30 bg-surface/20 hover:border-secondary/40 hover:bg-surface/40 transition-all active:scale-[0.98] disabled:opacity-60"
                    aria-label={tr.biometricLogin}
                  >
                    <span className="material-symbols-outlined">fingerprint</span>
                    <span className="font-title-md text-title-md text-on-surface">
                      {bioLoading ? tr.loginAuthenticating : tr.biometricLogin}
                    </span>
                  </button>
                )}
              </form>

              <div className="mt-stack-lg pt-8 border-t border-outline-variant/10 flex flex-col items-center gap-4 text-center">
                <p className="font-body-sm text-body-sm text-on-surface-variant/40">
                  {tr.loginSecurityLine1} <br />
                  {tr.loginSecurityLine2}
                </p>
                <div className="flex gap-4">
                  <span className="material-symbols-outlined text-primary/20">shield</span>
                  <span className="material-symbols-outlined text-primary/20">verified_user</span>
                  <span className="material-symbols-outlined text-primary/20">vpn_key</span>
                </div>
              </div>
            </div>
          </div>
        </main>

        <footer className="p-6 flex flex-col items-center gap-2">
          <p className="font-label-caps text-[10px] text-on-surface-variant/30 tracking-widest uppercase">
            {tr.loginCopyright}
          </p>
        </footer>
      </div>
    </>
  );
}
