import {
  getRefreshToken,
  getBiometricRefreshToken,
  refreshAccessToken,
  setBiometricRefreshToken,
  clearBiometricRefreshToken,
} from '@/lib/auth';
import type { DirectusUser } from '@/types';

const BIO_ENABLED_KEY = 'bio_enabled';
const BIO_CREDENTIAL_KEY = 'bio_credential_id';
const BIO_RP_ID_KEY = 'bio_rp_id';

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const normalized = base64.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export function isPwaInstalled(): boolean {
  if (typeof window === 'undefined') return false;

  const displayModes = ['standalone', 'fullscreen', 'minimal-ui'];
  if (displayModes.some((mode) => window.matchMedia(`(display-mode: ${mode})`).matches)) {
    return true;
  }

  if ((navigator as Navigator & { standalone?: boolean }).standalone === true) {
    return true;
  }

  if (document.referrer.startsWith('android-app://')) {
    return true;
  }

  return false;
}

function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function getWebAuthnRpId(): string {
  return window.location.hostname;
}

function getStoredRpId(): string | null {
  return localStorage.getItem(BIO_RP_ID_KEY);
}

function getRpIdCandidates(): string[] {
  const hostname = window.location.hostname;
  const stored = getStoredRpId();
  const candidates: string[] = [];
  if (stored) candidates.push(stored);

  const parts = hostname.split('.');
  if (parts.length >= 3) {
    candidates.push(parts.slice(-2).join('.'));
  }
  candidates.push(hostname);

  return Array.from(new Set(candidates));
}

export function isBiometricSupported(): boolean {
  if (typeof window === 'undefined') return false;
  if (typeof window.PublicKeyCredential === 'undefined') return false;
  if (!window.isSecureContext) return false;
  return isPwaInstalled() || isMobileDevice();
}

export type BiometricSupportReason = 'pwa' | 'webauthn' | 'platform' | 'secure' | null;

export async function checkBiometricSupport(): Promise<{
  supported: boolean;
  reason: BiometricSupportReason;
}> {
  if (typeof window === 'undefined') {
    return { supported: false, reason: 'webauthn' };
  }
  if (!window.isSecureContext) {
    return { supported: false, reason: 'secure' };
  }
  if (typeof window.PublicKeyCredential === 'undefined') {
    return { supported: false, reason: 'webauthn' };
  }
  if (!isPwaInstalled() && !isMobileDevice()) {
    return { supported: false, reason: 'pwa' };
  }

  return { supported: true, reason: null };
}

export function isBiometricEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    localStorage.getItem(BIO_ENABLED_KEY) === 'true' &&
    !!localStorage.getItem(BIO_CREDENTIAL_KEY)
  );
}

export function clearBiometricData(): void {
  localStorage.removeItem(BIO_ENABLED_KEY);
  localStorage.removeItem(BIO_CREDENTIAL_KEY);
  localStorage.removeItem(BIO_RP_ID_KEY);
  clearBiometricRefreshToken();
}

export async function registerBiometric(userId: string, email: string): Promise<void> {
  const rpId = getWebAuthnRpId();
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const credential = await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: 'Salat Zeit', id: rpId },
      user: {
        id: new TextEncoder().encode(userId),
        name: email,
        displayName: email,
      },
      pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'discouraged',
      },
      timeout: 60000,
    },
  });

  if (!credential) throw new Error('Biometric registration cancelled');

  const publicKeyCredential = credential as PublicKeyCredential;
  const credId = bufferToBase64(publicKeyCredential.rawId);
  localStorage.setItem(BIO_CREDENTIAL_KEY, credId);
  localStorage.setItem(BIO_RP_ID_KEY, rpId);
  localStorage.setItem(BIO_ENABLED_KEY, 'true');
}

export async function enableBiometric(user: DirectusUser, refreshToken?: string): Promise<void> {
  const token = refreshToken ?? getRefreshToken();
  if (!token) throw new Error('No refresh token available');

  await registerBiometric(user.id, user.email ?? user.id);
  setBiometricRefreshToken(token);
}

export function disableBiometric(): void {
  clearBiometricData();
}

async function requestBiometricAssertion(credId: string, rpId: string): Promise<Credential | null> {
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  return navigator.credentials.get({
    publicKey: {
      challenge,
      rpId,
      allowCredentials: [
        {
          id: base64ToBuffer(credId),
          type: 'public-key',
          transports: ['internal'],
        },
      ],
      userVerification: 'required',
      timeout: 60000,
    },
  });
}

export type BiometricAuthError = 'no_credential' | 'webauthn_failed' | 'no_bio_refresh' | 'token_expired';

export type BiometricAuthResult =
  | { ok: true; access: string }
  | { ok: false; error: BiometricAuthError };

export async function authenticateWithBiometric(): Promise<BiometricAuthResult> {
  const credId = localStorage.getItem(BIO_CREDENTIAL_KEY);
  if (!credId || !isBiometricEnabled()) {
    return { ok: false, error: 'no_credential' };
  }

  if (!getBiometricRefreshToken()) {
    return { ok: false, error: 'no_bio_refresh' };
  }

  let assertion: Credential | null = null;
  const rpIds = getRpIdCandidates();

  for (const rpId of rpIds) {
    try {
      assertion = await requestBiometricAssertion(credId, rpId);
      if (assertion) break;
    } catch {
      /* try next rpId */
    }
  }

  if (!assertion) {
    return { ok: false, error: 'webauthn_failed' };
  }

  const access = await refreshAccessToken('biometric');
  if (!access) {
    return { ok: false, error: 'token_expired' };
  }
  return { ok: true, access };
}

export function syncBiometricRefreshToken(refreshToken: string): void {
  if (isBiometricEnabled()) {
    setBiometricRefreshToken(refreshToken);
  }
}
