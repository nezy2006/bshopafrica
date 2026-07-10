import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session-store";
import { getClientDomains, getClientProducts, getInvoices, getTickets } from "@/lib/whmcs";

export interface AppNotification {
  id:      string;
  type:    "domain_expiring" | "invoice_due" | "ticket_replied" | "order_completed" | "service_suspended" | "info";
  message: string;
  date:    string;
  read:    boolean;
  link?:   string;
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
}

/* clientId is resolved solely from the server-side session — never from the
   client — so one client can never see another's tickets/invoices/domains. */
export async function GET(req: NextRequest) {
  const session = getSession(req.headers.get("x-session-token"));
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const clientId = session.clientId;

  const [domains, products, invoices, tickets] = await Promise.all([
    getClientDomains(clientId).catch(() => []),
    getClientProducts(clientId).catch(() => []),
    getInvoices(clientId).catch(() => []),
    getTickets(clientId).catch(() => []),
  ]);

  const notifications: AppNotification[] = [];

  for (const d of domains) {
    const days = daysUntil(d.expirydate || d.nextduedate);
    if (days > 0 && days <= 30) {
      notifications.push({
        id:      `domain-${d.id}`,
        type:    "domain_expiring",
        message: `${d.domainname} expires in ${days} day${days === 1 ? "" : "s"}`,
        date:    new Date().toISOString(),
        read:    false,
        link:    "/dashboard",
      });
    }
  }

  for (const p of products) {
    if (p.status !== "Active") continue;
    const days = daysUntil(p.nextduedate);
    if (days > 0 && days <= 30) {
      notifications.push({
        id:      `hosting-${p.id}`,
        type:    "domain_expiring",
        message: `Hosting for ${p.domain || p.name} renews in ${days} day${days === 1 ? "" : "s"}`,
        date:    new Date().toISOString(),
        read:    false,
        link:    "/dashboard",
      });
    }
  }

  for (const inv of invoices) {
    if (inv.status !== "Unpaid") continue;
    const days = daysUntil(inv.duedate);
    if (days <= 7) {
      notifications.push({
        id:      `invoice-${inv.id}`,
        type:    "invoice_due",
        message: `Invoice #${inv.id} ($${inv.total}) due in ${Math.max(0, days)} day${days === 1 ? "" : "s"}`,
        date:    new Date().toISOString(),
        read:    false,
        link:    "/dashboard",
      });
    }
  }

  for (const t of tickets) {
    if (t.status === "Answered") {
      notifications.push({
        id:      `ticket-${t.id}`,
        type:    "ticket_replied",
        message: `Support ticket #${t.tid} has a new reply: ${t.title}`,
        date:    new Date().toISOString(),
        read:    false,
        link:    "/dashboard",
      });
    }
  }

  return NextResponse.json({ success: true, data: notifications });
}
