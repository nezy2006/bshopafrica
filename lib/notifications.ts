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

export function addNotification(notif: Omit<AppNotification, "id" | "read">): void {
  const notifs = getNotifications();
  if (notifs.some(n => n.message === notif.message)) return;
  notifs.unshift({
    ...notif,
    id:   `${Date.now()}_${Math.random().toString(36).slice(2)}`,
    read: false,
  });
  save(notifs.slice(0, 50));
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
}

async function poll(clientId: number): Promise<void> {
  try {
    const post = (action: string, params: Record<string, unknown>) =>
      fetch("/api/whmcs", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action, params }),
      }).then(r => r.json());

    const [domRes, invRes] = await Promise.all([
      post("getClientDomains", { clientId }),
      post("getInvoices",      { clientId }),
    ]);

    if (domRes.success && Array.isArray(domRes.data)) {
      for (const d of domRes.data as { domainname: string; expirydate: string; nextduedate: string }[]) {
        const days = daysUntil(d.expirydate || d.nextduedate);
        if (days > 0 && days <= 30) {
          addNotification({
            type:    "domain_expiring",
            message: `${d.domainname} expires in ${days} day${days === 1 ? "" : "s"}`,
            date:    new Date().toISOString(),
            link:    "/dashboard",
          });
        }
      }
    }

    if (invRes.success && Array.isArray(invRes.data)) {
      for (const inv of invRes.data as { id: number; total: string; duedate: string; status: string }[]) {
        if (inv.status === "Unpaid") {
          const days = daysUntil(inv.duedate);
          if (days <= 7) {
            addNotification({
              type:    "invoice_due",
              message: `Invoice #${inv.id} ($${inv.total}) due in ${Math.max(0, days)} day${days === 1 ? "" : "s"}`,
              date:    new Date().toISOString(),
              link:    "/dashboard",
            });
          }
        }
      }
    }

    localStorage.setItem(POLL_KEY, Date.now().toString());
  } catch { /* silent */ }
}

let timer: ReturnType<typeof setInterval> | null = null;

export function startNotificationPolling(clientId: number): void {
  if (typeof window === "undefined") return;
  poll(clientId);
  if (timer) clearInterval(timer);
  timer = setInterval(() => poll(clientId), 60_000);
}

export function stopNotificationPolling(): void {
  if (timer) { clearInterval(timer); timer = null; }
}
