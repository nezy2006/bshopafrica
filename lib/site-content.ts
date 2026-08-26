import { query, execute } from "@/lib/db";

let schemaReady: Promise<void> | null = null;

export function ensureSiteContentSchema(): Promise<void> {
  if (!schemaReady) schemaReady = migrate();
  return schemaReady;
}

async function migrate() {
  await execute(`
    CREATE TABLE IF NOT EXISTS site_content (
      id INT AUTO_INCREMENT PRIMARY KEY,
      key_name VARCHAR(100) UNIQUE NOT NULL,
      value TEXT,
      updated_by INT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

interface ContentRow { key_name: string; value: string | null }

/** All site_content rows as a flat key → value map. Used both by the admin
 *  Content Management page and by the public banner fetch in SiteShell. */
export async function getAllSiteContent(): Promise<Record<string, string>> {
  await ensureSiteContentSchema();
  const rows = await query<ContentRow>("SELECT key_name, value FROM site_content");
  return Object.fromEntries(rows.map(r => [r.key_name, r.value ?? ""]));
}

export async function setSiteContent(entries: Record<string, string>, updatedBy: number): Promise<void> {
  await ensureSiteContentSchema();
  await Promise.all(
    Object.entries(entries).map(([key, value]) =>
      execute(
        "INSERT INTO site_content (key_name, value, updated_by) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value), updated_by = VALUES(updated_by)",
        [key, value, updatedBy]
      )
    )
  );
}

export async function deleteSiteContent(key: string): Promise<void> {
  await ensureSiteContentSchema();
  await execute("DELETE FROM site_content WHERE key_name = ?", [key]);
}
