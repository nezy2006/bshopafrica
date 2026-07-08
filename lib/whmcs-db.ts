// Direct WHMCS database access — narrow fallback for password read/write.
//
// WHMCS 8+ unified client accounts onto tblusers (bcrypt password column),
// separate from tblclients. On this install, UpdateClient's password2 param
// doesn't reliably sync tblusers, so the API can report success while the
// stored hash is unchanged.
//
// This module is a FALLBACK next to the WHMCS API calls in lib/whmcs.ts, not
// a replacement — the API call is still attempted first (so any WHMCS-side
// hooks/notifications/rate-limiting still run), and this only engages when
// WHMCS_DB_URL is configured. Never hardcode credentials here; they must come
// from the WHMCS_DB_URL env var (see lib/config.ts).
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import { parseDbUrl } from "@/lib/db";
import { config } from "@/lib/config";

interface UserRow extends mysql.RowDataPacket { password: string; }

const globalWhmcsDb = globalThis as unknown as { whmcsDbPool?: mysql.Pool };

function getPool(): mysql.Pool {
  if (!config.whmcsDbUrl) throw new Error("WHMCS_DB_URL is not configured");
  if (!globalWhmcsDb.whmcsDbPool) {
    globalWhmcsDb.whmcsDbPool = mysql.createPool({
      ...parseDbUrl(config.whmcsDbUrl),
      waitForConnections: true,
      connectionLimit: 3,
      queueLimit: 0,
    });
  }
  return globalWhmcsDb.whmcsDbPool;
}

export function whmcsDbEnabled(): boolean {
  return Boolean(config.whmcsDbUrl);
}

export async function updatePasswordDirect(email: string, newPassword: string): Promise<void> {
  const hash = await bcrypt.hash(newPassword, 10);
  const [result] = await getPool().execute<mysql.ResultSetHeader>(
    "UPDATE tblusers SET password = ? WHERE email = ?",
    [hash, email],
  );
  if (result.affectedRows === 0) {
    throw new Error(`No tblusers row found for email ${email}`);
  }
}

export async function validatePasswordDirect(email: string, password: string): Promise<boolean> {
  const [rows] = await getPool().query<UserRow[]>(
    "SELECT password FROM tblusers WHERE email = ? LIMIT 1",
    [email],
  );
  const hash = rows[0]?.password;
  if (!hash) return false;
  return bcrypt.compare(password, hash);
}
