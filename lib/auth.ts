import type { DirectusUser } from '@/types';

const ACCESS_KEY = 'dt_access';
const REFRESH_KEY = 'dt_refresh';
const BIO_REFRESH_KEY = 'bio_refresh';

function getDirectusProxyBase(): string {
  return '/api/directus';
}

function getDirectusPublicBase(): string {
  return process.env.NEXT_PUBLIC_DIRECTUS_URL ?? 'https://directus.alattas.de';
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function getBiometricRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(BIO_REFRESH_KEY);
}

export function setBiometricRefreshToken(refresh: string) {
  localStorage.setItem(BIO_REFRESH_KEY, refresh);
}

export function clearBiometricRefreshToken() {
  localStorage.removeItem(BIO_REFRESH_KEY);
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function setTokensFromCallback(params: URLSearchParams) {
  const access = params.get('access_token');
  const refresh = params.get('refresh_token');
  if (!access) return false;
  setTokens(access, refresh ?? '');
  return true;
}

function parseTokenParams(params: URLSearchParams): boolean {
  return setTokensFromCallback(params);
}

/** Exchange Directus session cookie (OAuth default) for JSON access/refresh tokens. */
export async function exchangeOAuthSessionForTokens(): Promise<{
  access_token: string;
  refresh_token?: string;
} | null> {
  const res = await fetch('/api/auth/oauth-session', {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) return null;
  const json = await res.json().catch(() => null);
  const access = json?.access_token as string | undefined;
  if (!access) return null;
  return {
    access_token: access,
    refresh_token: json?.refresh_token as string | undefined,
  };
}

/** Resolve tokens from OAuth redirect: query params, hash fragment, or session cookie. */
export async function completeOAuthCallback(
  searchParams: URLSearchParams
): Promise<boolean> {
  if (parseTokenParams(searchParams)) return true;

  if (typeof window !== 'undefined' && window.location.hash.length > 1) {
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    if (parseTokenParams(hashParams)) return true;
  }

  const sessionTokens = await exchangeOAuthSessionForTokens();
  if (sessionTokens) {
    setTokens(sessionTokens.access_token, sessionTokens.refresh_token ?? '');
    return true;
  }

  return false;
}

export async function getPostLoginPath(
  accessToken: string,
  redirectParam?: string | null
): Promise<string> {
  if (redirectParam) return redirectParam;
  const u = await fetchCurrentUser(accessToken);
  if (u && isAdmin(u)) return '/admin';
  if (u && isStaff(u)) return '/staff';
  return '/staff';
}

export function isStaff(user: DirectusUser | null): boolean {
  if (!user?.role) return false;
  const name = user.role.name?.toLowerCase() ?? '';
  return (
    name.includes('staff') ||
    name.includes('moschee') ||
    name.includes('imam') ||
    name.includes('manager')
  );
}

export function isAdmin(user: DirectusUser | null): boolean {
  const name = user?.role?.name?.toLowerCase() ?? '';
  return Boolean(
    user?.role?.admin_access ||
      name.includes('admin') ||
      name.includes('administrator')
  );
}

export async function fetchCurrentUser(accessToken: string): Promise<DirectusUser | null> {
  const res = await fetch(`${getDirectusProxyBase()}/users/me?fields=*,role.*`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data ?? null;
}

export async function refreshAccessToken(
  source: 'session' | 'biometric' = 'session'
): Promise<string | null> {
  const refresh =
    source === 'biometric' ? getBiometricRefreshToken() : getRefreshToken();
  if (!refresh) return null;
  const res = await fetch(`${getDirectusProxyBase()}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refresh }),
  });
  if (!res.ok) {
    if (source === 'biometric') {
      clearBiometricRefreshToken();
    } else {
      clearTokens();
    }
    return null;
  }
  const json = await res.json();
  const access = json.data?.access_token;
  const newRefresh = json.data?.refresh_token;
  if (access) {
    setTokens(access, newRefresh ?? refresh);
    if (source === 'biometric' || getBiometricRefreshToken()) {
      setBiometricRefreshToken(newRefresh ?? refresh);
    }
    return access;
  }
  return null;
}

export function getOAuthCallbackUrl(): string {
  const base =
    (typeof window !== 'undefined'
      ? process.env.NEXT_PUBLIC_APP_URL || window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL) ?? 'http://localhost:3000';
  return `${base.replace(/\/$/, '')}/auth/callback`;
}

export function getGoogleOAuthUrl(redirectUrl?: string): string {
  const base = getDirectusPublicBase();
  const redirect = redirectUrl ?? getOAuthCallbackUrl();
  return `${base}/auth/login/google?redirect=${encodeURIComponent(redirect)}`;
}

export async function loginWithEmailPassword(email: string, password: string): Promise<{
  access_token: string;
  refresh_token?: string;
}> {
  const res = await fetch(`${getDirectusProxyBase()}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      json?.errors?.[0]?.message ??
      `Login failed (${res.status})`;
    throw new Error(message);
  }

  const access_token = json?.data?.access_token as string | undefined;
  if (!access_token) throw new Error('No access token received');
  return {
    access_token,
    refresh_token: json?.data?.refresh_token as string | undefined,
  };
}
