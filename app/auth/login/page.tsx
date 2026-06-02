'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLang } from '@/components/providers/LangProvider';
import { useAuth } from '@/hooks/useAuth';
import { getGoogleOAuthUrl } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { LangSwitcher } from '@/components/layout/LangSwitcher';

export default function LoginPage() {
  const { tr } = useLang();
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getReadableError = (err: unknown): string => {
    if (typeof err === 'object' && err !== null && 'errors' in err) {
      const errors = (err as { errors?: Array<{ message?: string; extensions?: { code?: string } }> }).errors;
      if (Array.isArray(errors) && errors.length > 0) {
        const first = errors[0];
        const code = first?.extensions?.code;
        const msg = first?.message ?? 'Login failed';
        if (code === 'INVALID_CREDENTIALS') return 'Invalid email or password.';
        return msg;
      }
    }
    if (err instanceof Error) {
      const msg = err.message.toLowerCase();
      if (msg.includes('failed to fetch')) {
        return 'Network/CORS error while contacting Directus. Please check Directus URL and CORS allowlist for http://localhost:3000.';
      }
      if (msg.includes('502')) {
        return 'Directus server is currently unavailable (502). Please try again later.';
      }
      return err.message;
    }
    return 'Login failed.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      const redirectTo = new URLSearchParams(window.location.search).get('redirect');
      const token = localStorage.getItem('dt_access');
      if (token) {
        const { fetchCurrentUser, isAdmin, isStaff } = await import('@/lib/auth');
        const u = await fetchCurrentUser(token);
        if (redirectTo) router.push(redirectTo);
        else if (u && isAdmin(u)) router.push('/admin');
        else if (u && isStaff(u)) router.push('/staff');
        else router.push('/staff');
      } else {
        router.push('/staff');
      }
    } catch (err: unknown) {
      setError(getReadableError(err));
    } finally {
      setLoading(false);
    }
  };

  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/auth/callback`;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="absolute top-4 right-4">
        <LangSwitcher />
      </div>
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="font-headline text-3xl text-gold">{tr.appName}</h1>
          <p className="font-arabic text-gold-light mt-1">{tr.appNameAr}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-on-surface-variant mb-1 block">{tr.email}</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm text-on-surface-variant mb-1 block">{tr.password}</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p className="text-error text-sm">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {tr.login}
          </Button>
        </form>
        <div className="mt-4">
          <a href={getGoogleOAuthUrl(callbackUrl)}>
            <Button variant="secondary" className="w-full" type="button">
              Google
            </Button>
          </a>
        </div>
        <p className="text-center mt-6">
          <Link href="/" className="text-sm text-on-surface-variant hover:text-gold">
            ← Home
          </Link>
        </p>
      </Card>
    </div>
  );
}
