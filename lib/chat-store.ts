import { randomUUID } from "crypto";
import { query, queryOne, execute, ensureColumn } from "@/lib/db";

let schemaReady: Promise<void> | null = null;

export function ensureChatSchema(): Promise<void> {
  if (!schemaReady) schemaReady = migrate();
  return schemaReady;
}

async function migrate() {
  await execute(`
    CREATE TABLE IF NOT EXISTS chat_sessions (
      id VARCHAR(36) PRIMARY KEY,
      client_id INT,
      client_email VARCHAR(255),
      client_name VARCHAR(255),
      ticket_id INT,
      status ENUM('active','escalated','closed') DEFAULT 'active',
      messages JSON,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  // Tracks how many staff replies from the WHMCS ticket have already been
  // synced into `messages`, so /api/support-chat/status only appends new ones.
  await ensureColumn("chat_sessions", "last_synced_reply_count", "INT NOT NULL DEFAULT 0");
}

export type ChatRole = "client" | "ai" | "agent";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  ts: string;
  agentName?: string;
}

export interface ChatSession {
  id: string;
  client_id: number | null;
  client_email: string | null;
  client_name: string | null;
  ticket_id: number | null;
  status: "active" | "escalated" | "closed";
  messages: ChatMessage[];
  last_synced_reply_count: number;
  created_at: string;
  updated_at: string;
}

interface ChatSessionRow {
  id: string;
  client_id: number | null;
  client_email: string | null;
  client_name: string | null;
  ticket_id: number | null;
  status: "active" | "escalated" | "closed";
  messages: string | ChatMessage[] | null;
  last_synced_reply_count: number;
  created_at: string;
  updated_at: string;
}

function parseRow(row: ChatSessionRow): ChatSession {
  const messages = typeof row.messages === "string" ? JSON.parse(row.messages || "[]") : row.messages ?? [];
  return { ...row, messages };
}

export function newMessage(role: ChatRole, content: string, agentName?: string): ChatMessage {
  return { id: randomUUID(), role, content, ts: new Date().toISOString(), ...(agentName ? { agentName } : {}) };
}

export async function getOrCreateChatSession(
  id: string,
  init: { clientId?: number | null; clientEmail?: string | null; clientName?: string | null } = {}
): Promise<ChatSession> {
  await ensureChatSchema();
  const existing = await queryOne<ChatSessionRow>("SELECT * FROM chat_sessions WHERE id = ?", [id]);
  if (existing) {
    // Backfill client info once known (e.g. anonymous visitor logs in, or supplies email mid-chat).
    if ((init.clientId && !existing.client_id) || (init.clientEmail && !existing.client_email)) {
      await execute(
        "UPDATE chat_sessions SET client_id = COALESCE(?, client_id), client_email = COALESCE(?, client_email), client_name = COALESCE(?, client_name) WHERE id = ?",
        [init.clientId ?? null, init.clientEmail ?? null, init.clientName ?? null, id]
      );
      return (await getChatSession(id))!;
    }
    return parseRow(existing);
  }
  await execute(
    "INSERT INTO chat_sessions (id, client_id, client_email, client_name, status, messages) VALUES (?, ?, ?, ?, 'active', ?)",
    [id, init.clientId ?? null, init.clientEmail ?? null, init.clientName ?? null, JSON.stringify([])]
  );
  return (await getChatSession(id))!;
}

export async function getChatSession(id: string): Promise<ChatSession | null> {
  await ensureChatSchema();
  const row = await queryOne<ChatSessionRow>("SELECT * FROM chat_sessions WHERE id = ?", [id]);
  return row ? parseRow(row) : null;
}

export async function getChatSessionByTicketId(ticketId: number): Promise<ChatSession | null> {
  await ensureChatSchema();
  const row = await queryOne<ChatSessionRow>("SELECT * FROM chat_sessions WHERE ticket_id = ? ORDER BY created_at DESC LIMIT 1", [ticketId]);
  return row ? parseRow(row) : null;
}

export async function appendChatMessages(id: string, newMessages: ChatMessage[]): Promise<void> {
  await ensureChatSchema();
  const session = await getChatSession(id);
  if (!session) return;
  const messages = [...session.messages, ...newMessages];
  await execute("UPDATE chat_sessions SET messages = ? WHERE id = ?", [JSON.stringify(messages), id]);
}

export async function escalateChatSession(id: string, ticketId: number): Promise<void> {
  await ensureChatSchema();
  await execute("UPDATE chat_sessions SET status = 'escalated', ticket_id = ? WHERE id = ?", [ticketId, id]);
}

export async function closeChatSession(id: string): Promise<void> {
  await ensureChatSchema();
  await execute("UPDATE chat_sessions SET status = 'closed' WHERE id = ?", [id]);
}

export async function syncAgentReplies(id: string, agentMessages: ChatMessage[], replyCount: number): Promise<void> {
  await ensureChatSchema();
  if (agentMessages.length > 0) await appendChatMessages(id, agentMessages);
  await execute("UPDATE chat_sessions SET last_synced_reply_count = ? WHERE id = ?", [replyCount, id]);
}

/** Best-effort recent transcript listing, newest-first — powers a future admin overview if needed. */
export async function getRecentChatSessions(limit = 30): Promise<ChatSession[]> {
  await ensureChatSchema();
  const rows = await query<ChatSessionRow>("SELECT * FROM chat_sessions ORDER BY updated_at DESC LIMIT ?", [limit]);
  return rows.map(parseRow);
}
