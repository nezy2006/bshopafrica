import crypto from "crypto";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { query, queryOne, execute, ensureColumn } from "@/lib/db";
import { config } from "@/lib/config";

export type AdminRole = "super_admin" | "admin" | "support" | "billing" | "sales";

export interface AdminUser {
  id:         number;
  name:       string;
  email:      string;
  role:       AdminRole;
  department: string | null;
  avatar:     string | null;
  is_active:  number;
}

interface AdminUserRow extends AdminUser { password: string }

let schemaReady: Promise<void> | null = null;

export function ensureAdminSchema(): Promise<void> {
  if (!schemaReady) schemaReady = migrate();
  return schemaReady;
}

async function migrate() {
  await execute(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('super_admin','admin','support','billing','sales') DEFAULT 'support',
      department VARCHAR(100),
      avatar VARCHAR(500),
      is_active BOOLEAN DEFAULT true,
      last_login DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await execute(`
    CREATE TABLE IF NOT EXISTS admin_sessions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      admin_id INT NOT NULL,
      token VARCHAR(255) UNIQUE NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (admin_id) REFERENCES admin_users(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await execute(`
    CREATE TABLE IF NOT EXISTS admin_activity_log (
      id INT AUTO_INCREMENT PRIMARY KEY,
      admin_id INT NOT NULL,
      action VARCHAR(255) NOT NULL,
      details TEXT,
      ip_address VARCHAR(45),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await ensureColumn("admin_users", "notifications_last_seen_id", "INT DEFAULT 0");

  const existing = await queryOne<{ cnt: number }>("SELECT COUNT(*) as cnt FROM admin_users");
  if (!existing || Number(existing.cnt) === 0) {
    const hash = await bcrypt.hash(config.adminPassword, 12);
    await execute(
      "INSERT INTO admin_users (name, email, password, role, department, is_active) VALUES (?, ?, ?, 'super_admin', 'Management', 1)",
      ["Super Admin", "admin@bshopafrica.com", hash]
    );
  }
}

/* ─── Login / sessions ───────────────────────────────────────────────────── */
export async function verifyAdminLogin(email: string, password: string): Promise<AdminUser | null> {
  const row = await queryOne<AdminUserRow>(
    "SELECT id, name, email, password, role, department, avatar, is_active FROM admin_users WHERE email = ?",
    [email]
  );
  if (!row || !row.is_active) return null;
  const ok = await bcrypt.compare(password, row.password);
  if (!ok) return null;
  await execute("UPDATE admin_users SET last_login = NOW() WHERE id = ?", [row.id]);
  const { password: _pw, ...admin } = row;
  return admin;
}

export async function createAdminSession(adminId: number): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  await execute(
    "INSERT INTO admin_sessions (admin_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 8 HOUR))",
    [adminId, token]
  );
  return token;
}

export async function getAdminBySession(token: string | null): Promise<AdminUser | null> {
  if (!token) return null;
  const row = await queryOne<AdminUserRow & { expires_at: string }>(
    `SELECT u.id, u.name, u.email, u.role, u.department, u.avatar, u.is_active, s.expires_at
     FROM admin_sessions s JOIN admin_users u ON u.id = s.admin_id
     WHERE s.token = ?`,
    [token]
  );
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await execute("DELETE FROM admin_sessions WHERE token = ?", [token]);
    return null;
  }
  if (!row.is_active) return null;
  const { expires_at: _e, ...admin } = row;
  return admin;
}

export async function deleteAdminSession(token: string | null): Promise<void> {
  if (token) await execute("DELETE FROM admin_sessions WHERE token = ?", [token]);
}

export async function listAdminUsers(): Promise<AdminUser[]> {
  return query<AdminUser>(
    "SELECT id, name, email, role, department, avatar, is_active, last_login, created_at FROM admin_users ORDER BY created_at DESC"
  );
}

export async function createAdminUser(name: string, email: string, password: string, role: AdminRole, department?: string): Promise<number> {
  const hash = await bcrypt.hash(password, 12);
  const { insertId } = await execute(
    "INSERT INTO admin_users (name, email, password, role, department, is_active) VALUES (?, ?, ?, ?, ?, 1)",
    [name, email, hash, role, department ?? null]
  );
  return insertId;
}

export async function updateAdminUser(id: number, fields: { name?: string; role?: AdminRole; department?: string; is_active?: boolean }): Promise<void> {
  const sets: string[] = [];
  const values: (string | number)[] = [];
  if (fields.name !== undefined)       { sets.push("name = ?");       values.push(fields.name); }
  if (fields.role !== undefined)       { sets.push("role = ?");       values.push(fields.role); }
  if (fields.department !== undefined) { sets.push("department = ?"); values.push(fields.department); }
  if (fields.is_active !== undefined)  { sets.push("is_active = ?");  values.push(fields.is_active ? 1 : 0); }
  if (sets.length === 0) return;
  values.push(id);
  await execute(`UPDATE admin_users SET ${sets.join(", ")} WHERE id = ?`, values);
}

export async function resetAdminPassword(id: number, newPassword: string): Promise<void> {
  const hash = await bcrypt.hash(newPassword, 12);
  await execute("UPDATE admin_users SET password = ? WHERE id = ?", [hash, id]);
}

/* ─── Activity log ───────────────────────────────────────────────────────── */
export async function logAdminActivity(adminId: number, action: string, details?: string, ip?: string): Promise<void> {
  await execute(
    "INSERT INTO admin_activity_log (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)",
    [adminId, action, details ?? null, ip ?? null]
  );
}

export interface ActivityLogEntry {
  id: number; admin_id: number; admin_name: string; action: string; details: string | null; ip_address: string | null; created_at: string;
}

export async function getActivityLog(limit = 100, adminId?: number): Promise<ActivityLogEntry[]> {
  if (adminId) {
    return query<ActivityLogEntry>(
      `SELECT l.id, l.admin_id, u.name as admin_name, l.action, l.details, l.ip_address, l.created_at
       FROM admin_activity_log l JOIN admin_users u ON u.id = l.admin_id
       WHERE l.admin_id = ? ORDER BY l.created_at DESC LIMIT ?`,
      [adminId, limit]
    );
  }
  return query<ActivityLogEntry>(
    `SELECT l.id, l.admin_id, u.name as admin_name, l.action, l.details, l.ip_address, l.created_at
     FROM admin_activity_log l JOIN admin_users u ON u.id = l.admin_id
     ORDER BY l.created_at DESC LIMIT ?`,
    [limit]
  );
}

/* ─── Role-based access ──────────────────────────────────────────────────── */
const ROLE_CATEGORY_ACCESS: Record<AdminRole, "*" | string[]> = {
  super_admin: "*",
  admin:       "*",
  support:     ["tickets", "clients"],
  billing:     ["invoices", "reports", "stats", "quotes", "emails"],
  sales:       ["orders", "clients", "domains", "products", "services"],
};

export function canAccessCategory(role: AdminRole, category: string): boolean {
  const allowed = ROLE_CATEGORY_ACCESS[role];
  return allowed === "*" || allowed.includes(category);
}

/* ─── Login rate limiting (in-memory, per-IP, mirrors client login limiter) ─ */
interface RateEntry { failures: number; blockedUntil: number }
declare global { var __adminLoginRateLimit: Map<string, RateEntry> | undefined }
const adminLoginRateLimit: Map<string, RateEntry> =
  globalThis.__adminLoginRateLimit ?? (globalThis.__adminLoginRateLimit = new Map());

export function checkAdminLoginRateLimit(ip: string): string | null {
  const now = Date.now();
  const entry = adminLoginRateLimit.get(ip);
  if (!entry) return null;
  if (entry.blockedUntil > now) {
    const mins = Math.ceil((entry.blockedUntil - now) / 60000);
    return `Too many failed attempts. Try again in ${mins} minute${mins !== 1 ? "s" : ""}.`;
  }
  return null;
}

export function recordAdminLoginFailure(ip: string): void {
  const now = Date.now();
  const entry = adminLoginRateLimit.get(ip) ?? { failures: 0, blockedUntil: 0 };
  entry.failures++;
  if (entry.failures >= 5) { entry.blockedUntil = now + 15 * 60 * 1000; entry.failures = 0; }
  adminLoginRateLimit.set(ip, entry);
}

export function clearAdminLoginFailures(ip: string): void {
  adminLoginRateLimit.delete(ip);
}

/* ─── Request helpers for route handlers ─────────────────────────────────── */
export function getRequestIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

/** Resolves the calling admin from the x-admin-token header, or returns a 401/403
 *  NextResponse. Pass `category` to also enforce the role/permission matrix. */
export async function requireAdmin(req: NextRequest, category?: string): Promise<AdminUser | NextResponse> {
  await ensureAdminSchema();
  const admin = await getAdminBySession(req.headers.get("x-admin-token"));
  if (!admin) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (category && !canAccessCategory(admin.role, category)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  return admin;
}

export function isAdminUnauthorized(x: AdminUser | NextResponse): x is NextResponse {
  return x instanceof NextResponse;
}
