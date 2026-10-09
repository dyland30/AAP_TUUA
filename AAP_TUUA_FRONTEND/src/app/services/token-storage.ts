import { AuthenticationResult } from '../models';

const AUTH_STORAGE_KEY = 'tuua.auth';

export function getStoredAuth(): AuthenticationResult | null {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as AuthenticationResult;
  } catch {
    return null;
  }
}

export function setStoredAuth(auth: AuthenticationResult | null): void {
  if (auth) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

export function getToken(): string | null {
  return getStoredAuth()?.token ?? null;
}

export function clearStoredAuth(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}
