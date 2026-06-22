export const AUTH_KEYS = {
  clientId:    "bshop_client_id",
  clientName:  "bshop_client_name",
  clientEmail: "bshop_client_email",
  clientFirst: "bshop_client_firstname",
  loginTime:   "bshop_login_time",
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

export function setAuth(clientId: number | string, firstname: string, lastname: string, email: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_KEYS.clientId,    String(clientId));
  localStorage.setItem(AUTH_KEYS.clientFirst,  firstname);
  localStorage.setItem(AUTH_KEYS.clientName,   `${firstname} ${lastname}`.trim());
  localStorage.setItem(AUTH_KEYS.clientEmail,  email);
  localStorage.setItem(AUTH_KEYS.loginTime,    Date.now().toString());
}

export function clearAuth(): void {
  if (typeof window === "undefined") return;
  Object.values(AUTH_KEYS).forEach(k => localStorage.removeItem(k));
}

export function isLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem(AUTH_KEYS.clientId);
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
