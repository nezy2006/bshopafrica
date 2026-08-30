// Local overlay for affiliate features WHMCS's stock API can't do remotely:
// there is no documented action to set a vanity referral code, deactivate an
// affiliate, or override their commission rate. Real commission math (balance,
// withdrawn, visitors, signups) still comes straight from WHMCS — this only
// stores the extra bits our dashboard needs on top of that.
import { query, queryOne, execute } from "@/lib/db";

let schemaReady: Promise<void> | null = null;

export function ensureAffiliateSchema(): Promise<void> {
  if (!schemaReady) schemaReady = migrate();
  return schemaReady;
}

async function migrate() {
  await execute(`
    CREATE TABLE IF NOT EXISTS affiliate_codes (
      client_id INT PRIMARY KEY,
      affiliate_id INT NOT NULL,
      code VARCHAR(20) UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await execute(`
    CREATE TABLE IF NOT EXISTS affiliate_overrides (
      client_id INT PRIMARY KEY,
      affiliate_id INT NOT NULL,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      commission_rate_override DECIMAL(6,2) NULL,
      tier VARCHAR(50) NULL,
      updated_by INT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

/** Base for a shareable code, e.g. "Jean-Paul" -> "JEANPA". Falls back to
 *  "PARTNER" so a blank/symbols-only name still produces a usable code. */
function codeBase(firstname: string): string {
  const clean = firstname.toUpperCase().replace(/[^A-Z]/g, "");
  return (clean.slice(0, 6) || "PARTNER");
}

function randomTwoDigits(): string {
  return String(Math.floor(Math.random() * 100)).padStart(2, "0");
}

/** Returns the client's existing referral code, or mints and persists a new
 *  one (FIRSTNAME + 2 random digits, retried on the rare collision). */
export async function getOrCreateReferralCode(clientId: number, affiliateId: number, firstname: string): Promise<string> {
  await ensureAffiliateSchema();
  const existing = await queryOne<{ code: string }>("SELECT code FROM affiliate_codes WHERE client_id = ?", [clientId]);
  if (existing) return existing.code;

  const base = codeBase(firstname);
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = `${base}${randomTwoDigits()}`;
    try {
      await execute("INSERT INTO affiliate_codes (client_id, affiliate_id, code) VALUES (?, ?, ?)", [clientId, affiliateId, code]);
      return code;
    } catch (e) {
      // Unique constraint collision (duplicate code, or a concurrent request
      // already inserted this client_id) — re-check before retrying.
      const retry = await queryOne<{ code: string }>("SELECT code FROM affiliate_codes WHERE client_id = ?", [clientId]);
      if (retry) return retry.code;
      if (attempt === 9) throw e;
    }
  }
  throw new Error("Could not generate a unique referral code");
}

/** Bulk lookup for the admin Affiliates table — clientId -> their code, for
 *  every client that has generated one (visited their dashboard affiliate tab). */
export async function getReferralCodesMap(): Promise<Map<number, string>> {
  await ensureAffiliateSchema();
  const rows = await query<{ client_id: number; code: string }>("SELECT client_id, code FROM affiliate_codes");
  return new Map(rows.map(r => [r.client_id, r.code]));
}

/** Resolves a shared code (or a raw numeric WHMCS affiliate id, for old links)
 *  back to the affiliate id AddClient's `affid` expects. */
export async function resolveReferralCode(raw: string): Promise<number | null> {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^\d+$/.test(trimmed)) return Number(trimmed);
  await ensureAffiliateSchema();
  const row = await queryOne<{ affiliate_id: number }>("SELECT affiliate_id FROM affiliate_codes WHERE code = ?", [trimmed.toUpperCase()]);
  return row ? row.affiliate_id : null;
}

export interface AffiliateOverride {
  status: "active" | "inactive";
  commissionRateOverride: number | null;
  tier: string | null;
}

export async function getAffiliateOverridesMap(): Promise<Map<number, AffiliateOverride>> {
  await ensureAffiliateSchema();
  const rows = await query<{ client_id: number; status: "active" | "inactive"; commission_rate_override: string | null; tier: string | null }>(
    "SELECT client_id, status, commission_rate_override, tier FROM affiliate_overrides"
  );
  return new Map(rows.map(r => [r.client_id, {
    status: r.status,
    commissionRateOverride: r.commission_rate_override !== null ? Number(r.commission_rate_override) : null,
    tier: r.tier,
  }]));
}

async function upsertOverride(clientId: number, affiliateId: number, column: string, value: string | number | null, adminId: number): Promise<void> {
  await ensureAffiliateSchema();
  await execute(
    `INSERT INTO affiliate_overrides (client_id, affiliate_id, updated_by, ${column})
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE updated_by = VALUES(updated_by), ${column} = VALUES(${column})`,
    [clientId, affiliateId, adminId, value]
  );
}

export async function setAffiliateStatus(clientId: number, affiliateId: number, status: "active" | "inactive", adminId: number): Promise<void> {
  await upsertOverride(clientId, affiliateId, "status", status, adminId);
}

export async function setAffiliateCommissionOverride(clientId: number, affiliateId: number, rate: number | null, adminId: number): Promise<void> {
  await upsertOverride(clientId, affiliateId, "commission_rate_override", rate, adminId);
}

export async function setAffiliateTier(clientId: number, affiliateId: number, tier: string | null, adminId: number): Promise<void> {
  await upsertOverride(clientId, affiliateId, "tier", tier, adminId);
}
