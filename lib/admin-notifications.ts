import { query, queryOne, execute } from "@/lib/db";

let schemaReady: Promise<void> | null = null;

export function ensureAdminNotificationsSchema(): Promise<void> {
  if (!schemaReady) schemaReady = migrate();
  return schemaReady;
}

async function migrate() {
  await execute(`
    CREATE TABLE IF NOT EXISTS admin_notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      type VARCHAR(32) NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT,
      link VARCHAR(500),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

export type AdminNotificationType =
  | "new_order" | "new_ticket" | "ticket_reply" | "payment_received"
  | "service_expiring" | "payment_failed";

export interface AdminNotification {
  id: number; type: AdminNotificationType; title: string;
  message: string | null; link: string | null; created_at: string;
}

/** Best-effort — a notification failing to record should never break the
 *  action that triggered it (order acceptance, payment capture, etc). */
export async function pushAdminNotification(type: AdminNotificationType, title: string, message?: string, link?: string): Promise<void> {
  try {
    await ensureAdminNotificationsSchema();
    await execute(
      "INSERT INTO admin_notifications (type, title, message, link) VALUES (?, ?, ?, ?)",
      [type, title, message ?? null, link ?? null]
    );
  } catch (e) {
    console.error("[pushAdminNotification] failed:", e);
  }
}

export async function getRecentNotifications(limit = 30): Promise<AdminNotification[]> {
  await ensureAdminNotificationsSchema();
  return query<AdminNotification>("SELECT * FROM admin_notifications ORDER BY id DESC LIMIT ?", [limit]);
}

export async function getNotificationsLastSeenId(adminId: number): Promise<number> {
  const row = await queryOne<{ notifications_last_seen_id: number | null }>(
    "SELECT notifications_last_seen_id FROM admin_users WHERE id = ?",
    [adminId]
  );
  return row?.notifications_last_seen_id ?? 0;
}

export async function markNotificationsSeen(adminId: number, upToId: number): Promise<void> {
  await execute(
    "UPDATE admin_users SET notifications_last_seen_id = GREATEST(COALESCE(notifications_last_seen_id, 0), ?) WHERE id = ?",
    [upToId, adminId]
  );
}
