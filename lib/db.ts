// Direct mysql2 connection — used because Prisma 7 has no MySQL adapter yet.
import mysql from "mysql2/promise";

export function parseDbUrl(url: string) {
  // mysql://user:password@host:port/database
  // Use regex so special chars in password ({, %, etc.) are preserved verbatim.
  const m = url.match(/^mysql:\/\/([^:]+):(.+)@([^/:]+):?(\d*)\/(.+)$/);
  if (!m) throw new Error("Invalid DATABASE_URL — expected mysql://user:pass@host:port/db");
  return { user: m[1], password: m[2], host: m[3], port: m[4] ? parseInt(m[4]) : 3306, database: m[5] };
}

const globalDb = globalThis as unknown as { pool?: mysql.Pool };

function makePool() {
  const url = process.env.DATABASE_URL;
  if (!url) return mysql.createPool({ host: "localhost", port: 3306, user: "root", password: "", database: "bshop" });
  return mysql.createPool({ ...parseDbUrl(url), waitForConnections: true, connectionLimit: 5, queueLimit: 0 });
}

export const pool = globalDb.pool ?? makePool();

if (process.env.NODE_ENV !== "production") globalDb.pool = pool;

export async function query<T = Record<string, unknown>>(sql: string, values?: unknown[]): Promise<T[]> {
  const [rows] = await pool.query(sql, values);
  return rows as T[];
}

export async function queryOne<T = Record<string, unknown>>(sql: string, values?: unknown[]): Promise<T | null> {
  const rows = await query<T>(sql, values);
  return rows[0] ?? null;
}

export async function execute(
  sql: string,
  values?: (string | number | boolean | null)[]
): Promise<{ insertId: number; affectedRows: number }> {
  const [result] = await pool.execute(sql, values);
  return result as { insertId: number; affectedRows: number };
}
