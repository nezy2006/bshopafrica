import crypto from "crypto";

export interface Session {
  clientId: number;
  email:    string;
  expires:  number;
}

// Process-level singleton (this app runs as a persistent Node server via server.js,
// so an in-memory map survives across requests — same pattern as otp-store.ts).
declare global {
  // eslint-disable-next-line no-var
  var __bshopSessionStore: Map<string, Session> | undefined;
}

const sessions: Map<string, Session> =
  globalThis.__bshopSessionStore ??
  (globalThis.__bshopSessionStore = new Map<string, Session>());

const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours, matches lib/auth.ts client-side expiry

export function createSession(clientId: number, email: string): string {
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, { clientId, email, expires: Date.now() + SESSION_TTL_MS });
  return token;
}

export function getSession(token: string | null | undefined): Session | null {
  if (!token) return null;
  const session = sessions.get(token);
  if (!session) return null;
  if (session.expires < Date.now()) {
    sessions.delete(token);
    return null;
  }
  return session;
}

export function deleteSession(token: string | null | undefined): void {
  if (token) sessions.delete(token);
}
