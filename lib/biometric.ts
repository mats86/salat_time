import {
  getRefreshToken,
  refreshAccessToken,
  setBiometricRefreshToken,
  clearBiometricRefreshToken,
} from '@/lib/auth';
import type { DirectusUser } from '@/types';

const BIO_ENABLED_KEY = 'bio_enabled';
const BIO_CREDENTIAL_KEY = 'bio_credential_id';

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export function isPwaInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function isBiometricSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return isPwaInstalled() && typeof window.PublicKeyCredential !== 'undefined';
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
  clearBiometricRefreshToken();
}

export async function registerBiometric(userId: string, email: string): Promise<void> {
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const credential = await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: 'Salat Zeit', id: window.location.hostname },
      user: {
        id: new TextEncoder().encode(userId),
        name: email,
        displayName: email,
      },
      pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
      },
      timeout: 60000,
    },
  });

  if (!credential) throw new Error('Biometric registration cancelled');

  const publicKeyCredential = credential as PublicKeyCredential;
  const credId = bufferToBase64(publicKeyCredential.rawId);
  localStorage.setItem(BIO_CREDENTIAL_KEY, credId);
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

export async function authenticateWithBiometric(): Promise<string | null> {
  const credId = localStorage.getItem(BIO_CREDENTIAL_KEY);
  if (!credId || !isBiometricEnabled()) return null;

  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge,
      allowCredentials: [
        {
          id: base64ToBuffer(credId),
          type: 'public-key',
        },
      ],
      userVerification: 'required',
      timeout: 60000,
    },
  });

  if (!assertion) return null;

  const access = await refreshAccessToken('biometric');
  if (!access) {
    clearBiometricData();
    return null;
  }
  return access;
}

export function syncBiometricRefreshToken(refreshToken: string): void {
  if (isBiometricEnabled()) {
    setBiometricRefreshToken(refreshToken);
  }
}
