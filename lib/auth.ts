import { clearNotifications } from "./notifications";

export const AUTH_KEYS = {
  clientId:     "bshop_client_id",
  clientName:   "bshop_client_name",
  clientEmail:  "bshop_client_email",
  clientFirst:  "bshop_client_firstname",
  loginTime:    "bshop_login_time",
  sessionToken: "bshop_session_token",
} as const;

const TWO_HOURS = 2 * 60 * 60 * 1000;

export function isSessionExpired(): boolean {
  if (typeof window === "undefined") return false;
  const id = localStorage.getItem(AUTH_KEYS.clientId);
  if (!id) return false;
  const loginTime = localStorage.getItem(AUTH_KEYS.loginTime);
  if (!loginTime) return false;
  return Date.now() - parseInt(loginTime) > TWO_HOURS;
}

export function refreshSession(): void {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(AUTH_KEYS.clientId)) {
    localStorage.setItem(AUTH_KEYS.loginTime, Date.now().toString());
  }
}

export function setAuth(clientId: number | string, firstname: string, lastname: string, email: string, sessionToken?: string): void {
  if (typeof window === "undefined") return;
  // A different client may be logging in on the same browser without ever
  // hitting "logout" (shared/public machine, previous session still valid) —
  // wipe any cached notification feed from the prior client before this one
  // starts polling, otherwise their tickets/invoices briefly show mixed in.
  if (localStorage.getItem(AUTH_KEYS.clientId) !== String(clientId)) {
    clearNotifications();
  }
  localStorage.setItem(AUTH_KEYS.clientId,    String(clientId));
  localStorage.setItem(AUTH_KEYS.clientFirst,  firstname);
  localStorage.setItem(AUTH_KEYS.clientName,   `${firstname} ${lastname}`.trim());
  localStorage.setItem(AUTH_KEYS.clientEmail,  email);
  localStorage.setItem(AUTH_KEYS.loginTime,    Date.now().toString());
  if (sessionToken) localStorage.setItem(AUTH_KEYS.sessionToken, sessionToken);
}

export function clearAuth(): void {
  if (typeof window === "undefined") return;
  Object.values(AUTH_KEYS).forEach(k => localStorage.removeItem(k));
}

export function isLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem(AUTH_KEYS.clientId);
}

export function getSessionToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_KEYS.sessionToken);
}

/** Spread into a fetch() headers object for any call to /api/whmcs that touches client data. */
export function authHeaders(): Record<string, string> {
  const token = getSessionToken();
  return token ? { "x-session-token": token } : {};
}

export function sanitizeInput(input: string): string {
  return input.replace(/<[^>]*>/g, "").trim();
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, "");
  return cleaned.length >= 7 && cleaned.length <= 15;
}
