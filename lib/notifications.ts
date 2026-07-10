export interface AppNotification {
  id:      string;
  type:    "domain_expiring" | "invoice_due" | "ticket_replied" | "order_completed" | "service_suspended" | "info";
  message: string;
  date:    string;
  read:    boolean;
  link?:   string;
}

const KEY      = "bshop_notifications";
const POLL_KEY = "bshop_last_poll";

export function getNotifications(): AppNotification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AppNotification[]) : [];
  } catch { return []; }
}

function save(notifs: AppNotification[]): void {
  localStorage.setItem(KEY, JSON.stringify(notifs));
  if (typeof window !== "undefined")
    window.dispatchEvent(new Event("bshop_notifications_update"));
}

export function getUnreadCount(): number {
  return getNotifications().filter(n => !n.read).length;
}

export function markAllRead(): void {
  save(getNotifications().map(n => ({ ...n, read: true })));
}

export function markRead(id: string): void {
  save(getNotifications().map(n => (n.id === id ? { ...n, read: true } : n)));
}

export function addNotification(notif: Omit<AppNotification, "id" | "read"> & { id?: string }): void {
  const notifs = getNotifications();
  if (notifs.some(n => n.message === notif.message)) return;
  notifs.unshift({
    ...notif,
    id:   notif.id ?? `${Date.now()}_${Math.random().toString(36).slice(2)}`,
    read: false,
  });
  save(notifs.slice(0, 50));
}

/** Wipes the cached notification feed. Must be called on logout/session-switch —
 *  otherwise a second client logging in on the same browser would briefly see
 *  the previous client's cached notifications until enough new ones supersede them. */
export function clearNotifications(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
  localStorage.removeItem(POLL_KEY);
}

// clientId is intentionally NOT passed here — the server resolves it from the
// x-session-token header via the server-side session, never from the client.
async function poll(sessionToken: string | null): Promise<void> {
  if (!sessionToken) return;
  try {
    const res  = await fetch("/api/notifications", { headers: { "x-session-token": sessionToken } });
    if (res.status === 401) return;
    const json = (await res.json()) as { success: boolean; data?: AppNotification[] };
    if (json.success && Array.isArray(json.data)) {
      for (const n of json.data) addNotification(n);
    }
    localStorage.setItem(POLL_KEY, Date.now().toString());
  } catch { /* silent */ }
}

let timer: ReturnType<typeof setInterval> | null = null;

export function startNotificationPolling(sessionToken: string | null): void {
  if (typeof window === "undefined" || !sessionToken) return;
  poll(sessionToken);
  if (timer) clearInterval(timer);
  timer = setInterval(() => poll(sessionToken), 60_000);
}

export function stopNotificationPolling(): void {
  if (timer) { clearInterval(timer); timer = null; }
}
