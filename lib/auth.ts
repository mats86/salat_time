import type { DirectusUser } from '@/types';
import { isAdmin, isStaff } from '@/lib/user-roles';

export { isStaff, isAdmin } from '@/lib/user-roles';

const ACCESS_KEY = 'dt_access';
const REFRESH_KEY = 'dt_refresh';
const BIO_REFRESH_KEY = 'bio_refresh';
const SESSION_AUTH_KEY = 'dt_session_auth';

function getDirectusProxyBase(): string {
  return '/api/directus';
}

function getDirectusPublicBase(): string {
  return process.env.NEXT_PUBLIC_DIRECTUS_URL ?? 'https://directus.alattas.de';
}

function readStoredToken(key: string): string | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem(key);
  return token && token.length > 0 ? token : null;
}

export function getAccessToken(): string | null {
  return readStoredToken(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  return readStoredToken(REFRESH_KEY);
}

export function getBiometricRefreshToken(): string | null {
  return readStoredToken(BIO_REFRESH_KEY);
}

export function setBiometricRefreshToken(refresh: string) {
  if (!refresh) return;
  localStorage.setItem(BIO_REFRESH_KEY, refresh);
}

export function clearBiometricRefreshToken() {
  localStorage.removeItem(BIO_REFRESH_KEY);
}

export function setTokens(access: string, refresh?: string | null) {
  localStorage.setItem(ACCESS_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  else localStorage.removeItem(REFRESH_KEY);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function setSessionAuth(enabled: boolean) {
  if (typeof window === 'undefined') return;
  if (enabled) {
    localStorage.setItem(SESSION_AUTH_KEY, '1');
    document.cookie = 'salat_session_auth=1; Path=/; Max-Age=2592000; SameSite=Lax';
  } else {
    localStorage.removeItem(SESSION_AUTH_KEY);
    document.cookie = 'salat_session_auth=; Path=/; Max-Age=0; SameSite=Lax';
  }
}

export function usesSessionAuth(): boolean {
  if (typeof window === 'undefined') return false;
  if (localStorage.getItem(SESSION_AUTH_KEY) === '1') return true;
  return document.cookie.includes('salat_session_auth=1');
}

export function clearSessionAuth() {
  setSessionAuth(false);
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

/** Validate Directus session cookie (OAuth default) and return the authenticated user. */
export async function establishOAuthSession(): Promise<{ user: DirectusUser } | null> {
  const directusUrl = getDirectusPublicBase();

  try {
    await fetch(`${directusUrl}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mode: 'session' }),
    });
  } catch {
    /* CORS/network - continue with server-side verification */
  }

  for (const url of ['/auth/oauth-session', '/api/auth/oauth-session']) {
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) continue;

    const json = await res.json().catch(() => null);
    const user = json?.user as DirectusUser | undefined;
    if (user) {
      setSessionAuth(true);
      return { user };
    }
  }

  const user = await fetchCurrentUserWithSession();
  if (user) {
    setSessionAuth(true);
    return { user };
  }

  return null;
}

/** Resolve auth from OAuth redirect: query params, hash fragment, or session cookie. */
export async function completeOAuthCallback(
  searchParams: URLSearchParams
): Promise<{ ok: boolean; user?: DirectusUser }> {
  if (parseTokenParams(searchParams)) return { ok: true };

  if (typeof window !== 'undefined' && window.location.hash.length > 1) {
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    if (parseTokenParams(hashParams)) return { ok: true };
  }

  const session = await establishOAuthSession();
  if (session) return { ok: true, user: session.user };

  return { ok: false };
}

export async function getPostLoginPath(
  accessTokenOrUser: string | DirectusUser | null,
  redirectParam?: string | null
): Promise<string> {
  if (redirectParam) return redirectParam;
  const u =
    typeof accessTokenOrUser === 'string'
      ? await fetchCurrentUser(accessTokenOrUser)
      : accessTokenOrUser;
  if (u && isAdmin(u)) return '/admin';
  if (u && isStaff(u)) return '/staff';
  return '/staff';
}

export async function fetchCurrentUser(accessToken: string): Promise<DirectusUser | null> {
  const res = await fetch(`${getDirectusProxyBase()}/users/me?fields=*,role.*`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data ?? null;
}

export async function fetchCurrentUserWithSession(): Promise<DirectusUser | null> {
  const res = await fetch(`${getDirectusProxyBase()}/users/me?fields=*,role.*`, {
    credentials: 'include',
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data ?? null;
}

export async function logoutSession(): Promise<void> {
  await fetch(`${getDirectusProxyBase()}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  }).catch(() => undefined);
  clearSessionAuth();
}

/** Exchange an OAuth session cookie for JWT tokens (needed for biometric setup). */
export async function exchangeSessionForTokens(): Promise<{
  access_token: string;
  refresh_token: string;
} | null> {
  const res = await fetch('/api/auth/exchange-tokens', {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) return null;

  const json = await res.json().catch(() => null);
  const access = json?.access_token as string | undefined;
  const refresh = json?.refresh_token as string | undefined;
  if (!access || !refresh) return null;

  setTokens(access, refresh);
  clearSessionAuth();
  return { access_token: access, refresh_token: refresh };
}

export async function refreshAccessToken(
  source: 'session' | 'biometric' = 'session'
): Promise<string | null> {
  const refresh =
    source === 'biometric' ? getBiometricRefreshToken() : getRefreshToken();
  if (!refresh) return null;
  const res = await fetch(`${getDirectusProxyBase()}/auth/refresh`, {
    method: 'POST',
    credentials: 'omit',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ mode: 'json', refresh_token: refresh }),
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
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL) ?? 'https://salat-time.alattas.de';
  return `${base.replace(/\/$/, '')}/auth/callback/exchange`;
}

export function getGoogleOAuthUrl(redirectUrl?: string): string {
  const base = getDirectusPublicBase();
  const redirect = redirectUrl ?? getOAuthCallbackUrl();
  return `${base}/auth/login/google?redirect=${encodeURIComponent(redirect)}&mode=json`;
}

export async function loginWithEmailPassword(email: string, password: string): Promise<{
  access_token: string;
  refresh_token?: string;
}> {
  await logoutSession().catch(() => undefined);
  clearSessionAuth();

  const res = await fetch(`${getDirectusProxyBase()}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'omit',
    body: JSON.stringify({ email, password, mode: 'json' }),
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
