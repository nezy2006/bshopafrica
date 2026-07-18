import { query, execute } from "@/lib/db";

let schemaReady: Promise<void> | null = null;

export function ensureClientNotesSchema(): Promise<void> {
  if (!schemaReady) schemaReady = migrate();
  return schemaReady;
}

async function migrate() {
  await execute(`
    CREATE TABLE IF NOT EXISTS client_notes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      client_id INT NOT NULL,
      admin_id INT NOT NULL,
      note TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX (client_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

export interface ClientNote {
  id: number; client_id: number; admin_id: number; admin_name: string;
  note: string; created_at: string;
}

export async function getClientNotes(clientId: number): Promise<ClientNote[]> {
  await ensureClientNotesSchema();
  return query<ClientNote>(
    `SELECT n.id, n.client_id, n.admin_id, u.name as admin_name, n.note, n.created_at
     FROM client_notes n JOIN admin_users u ON u.id = n.admin_id
     WHERE n.client_id = ? ORDER BY n.created_at DESC`,
    [clientId]
  );
}

export async function addClientNote(clientId: number, adminId: number, note: string): Promise<number> {
  await ensureClientNotesSchema();
  const { insertId } = await execute(
    "INSERT INTO client_notes (client_id, admin_id, note) VALUES (?, ?, ?)",
    [clientId, adminId, note]
  );
  return insertId;
}

export async function deleteClientNote(id: number): Promise<void> {
  await ensureClientNotesSchema();
  await execute("DELETE FROM client_notes WHERE id = ?", [id]);
}
