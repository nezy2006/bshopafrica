import { query, queryOne, execute, ensureColumn } from "@/lib/db";

let schemaReady: Promise<void> | null = null;

export function ensureTicketMetaSchema(): Promise<void> {
  if (!schemaReady) schemaReady = migrate();
  return schemaReady;
}

async function migrate() {
  await execute(`
    CREATE TABLE IF NOT EXISTS ticket_meta (
      ticket_id INT PRIMARY KEY,
      assigned_admin_id INT NULL,
      escalated BOOLEAN DEFAULT false,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await ensureColumn("ticket_meta", "linked_order_id", "INT NULL");
  await ensureColumn("ticket_meta", "linked_invoice_id", "INT NULL");
}

export interface TicketMeta {
  ticket_id: number;
  assigned_admin_id: number | null;
  assigned_admin_name: string | null;
  escalated: number;
  linked_order_id: number | null;
  linked_invoice_id: number | null;
}

export async function getTicketMeta(ticketId: number): Promise<TicketMeta | null> {
  await ensureTicketMetaSchema();
  return queryOne<TicketMeta>(
    `SELECT m.ticket_id, m.assigned_admin_id, u.name as assigned_admin_name, m.escalated, m.linked_order_id, m.linked_invoice_id
     FROM ticket_meta m LEFT JOIN admin_users u ON u.id = m.assigned_admin_id
     WHERE m.ticket_id = ?`,
    [ticketId]
  );
}

export async function getTicketMetaBulk(ticketIds: number[]): Promise<Map<number, TicketMeta>> {
  await ensureTicketMetaSchema();
  const map = new Map<number, TicketMeta>();
  if (ticketIds.length === 0) return map;
  const placeholders = ticketIds.map(() => "?").join(",");
  const rows = await query<TicketMeta>(
    `SELECT m.ticket_id, m.assigned_admin_id, u.name as assigned_admin_name, m.escalated, m.linked_order_id, m.linked_invoice_id
     FROM ticket_meta m LEFT JOIN admin_users u ON u.id = m.assigned_admin_id
     WHERE m.ticket_id IN (${placeholders})`,
    ticketIds
  );
  for (const r of rows) map.set(r.ticket_id, r);
  return map;
}

export async function linkTicketToOrderInvoice(ticketId: number, orderId: number | null, invoiceId: number | null): Promise<void> {
  await ensureTicketMetaSchema();
  await execute(
    `INSERT INTO ticket_meta (ticket_id, linked_order_id, linked_invoice_id) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE linked_order_id = VALUES(linked_order_id), linked_invoice_id = VALUES(linked_invoice_id)`,
    [ticketId, orderId, invoiceId]
  );
}

export async function assignTicket(ticketId: number, adminId: number | null): Promise<void> {
  await ensureTicketMetaSchema();
  await execute(
    `INSERT INTO ticket_meta (ticket_id, assigned_admin_id) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE assigned_admin_id = VALUES(assigned_admin_id)`,
    [ticketId, adminId]
  );
}

export async function setTicketEscalated(ticketId: number, escalated: boolean): Promise<void> {
  await ensureTicketMetaSchema();
  await execute(
    `INSERT INTO ticket_meta (ticket_id, escalated) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE escalated = VALUES(escalated)`,
    [ticketId, escalated ? 1 : 0]
  );
}
