import { query, queryOne, execute } from "@/lib/db";

let schemaReady: Promise<void> | null = null;

export function ensureCannedResponsesSchema(): Promise<void> {
  if (!schemaReady) schemaReady = migrate();
  return schemaReady;
}

async function migrate() {
  await execute(`
    CREATE TABLE IF NOT EXISTS canned_responses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      category ENUM('Technical','Billing','General','Domain') DEFAULT 'General',
      title VARCHAR(255) NOT NULL,
      body TEXT NOT NULL,
      created_by INT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

export type CannedResponseCategory = "Technical" | "Billing" | "General" | "Domain";

export interface CannedResponse {
  id: number; category: CannedResponseCategory; title: string; body: string;
  created_by: number | null; created_at: string; updated_at: string;
}

export async function getCannedResponses(category?: CannedResponseCategory): Promise<CannedResponse[]> {
  await ensureCannedResponsesSchema();
  if (category) {
    return query<CannedResponse>("SELECT * FROM canned_responses WHERE category = ? ORDER BY title", [category]);
  }
  return query<CannedResponse>("SELECT * FROM canned_responses ORDER BY category, title");
}

export async function createCannedResponse(category: CannedResponseCategory, title: string, body: string, createdBy: number): Promise<number> {
  await ensureCannedResponsesSchema();
  const { insertId } = await execute(
    "INSERT INTO canned_responses (category, title, body, created_by) VALUES (?, ?, ?, ?)",
    [category, title, body, createdBy]
  );
  return insertId;
}

export async function updateCannedResponse(id: number, fields: { category?: CannedResponseCategory; title?: string; body?: string }): Promise<void> {
  await ensureCannedResponsesSchema();
  const sets: string[] = [];
  const values: (string | number)[] = [];
  if (fields.category !== undefined) { sets.push("category = ?"); values.push(fields.category); }
  if (fields.title !== undefined)    { sets.push("title = ?");    values.push(fields.title); }
  if (fields.body !== undefined)     { sets.push("body = ?");     values.push(fields.body); }
  if (sets.length === 0) return;
  values.push(id);
  await execute(`UPDATE canned_responses SET ${sets.join(", ")} WHERE id = ?`, values);
}

export async function deleteCannedResponse(id: number): Promise<void> {
  await ensureCannedResponsesSchema();
  await execute("DELETE FROM canned_responses WHERE id = ?", [id]);
}

export async function getCannedResponse(id: number): Promise<CannedResponse | null> {
  await ensureCannedResponsesSchema();
  return queryOne<CannedResponse>("SELECT * FROM canned_responses WHERE id = ?", [id]);
}
