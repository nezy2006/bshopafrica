export type AdminRole = "super_admin" | "admin" | "support" | "billing" | "sales";

export interface CurrentAdmin {
  id:         number;
  name:       string;
  email:      string;
  role:       AdminRole;
  department: string | null;
  avatar:     string | null;
}

const TOKEN_KEY = "bshop_admin_token";
const ADMIN_KEY = "bshop_admin_user";

export function setAdminAuth(token: string, admin: CurrentAdmin): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
  localStorage.removeItem("bshop_admin_password");
}

export function clearAdminAuth(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ADMIN_KEY);
  localStorage.removeItem("bshop_admin_password");
}

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getCurrentAdmin(): CurrentAdmin | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(ADMIN_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as CurrentAdmin; } catch { return null; }
}

/** Spread into a fetch() headers object for any call to an admin-gated API route. */
export function adminHeaders(): Record<string, string> {
  const token = getAdminToken();
  return token ? { "x-admin-token": token } : {};
}

export function hasRole(role: AdminRole | undefined, allowed: AdminRole[]): boolean {
  return !!role && allowed.includes(role);
}
