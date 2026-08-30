import { NextRequest, NextResponse } from "next/server";
import { getAdminClients, getAdminOrders, getAdminDomains, getAdminTickets, getAdminTransactions } from "@/lib/whmcs";
import { getPawapayTransactions } from "@/lib/pawapay-transactions";
import { sendSmtpMail } from "@/lib/mailer";

// The key is passed as a plaintext URL query param on every cron run either
// way (cron logs, shell history), so it's not treated as a high-sensitivity
// secret the way the admin login password is — but it can still be
// overridden via WEEKLY_REPORT_KEY without touching this file.
const REPORT_KEY = process.env.WEEKLY_REPORT_KEY || "BShop@Admin2026!";
const DAYS = 7;

function withinRange(dateStr: string): boolean {
  const t = new Date(dateStr).getTime();
  if (!Number.isFinite(t)) return false;
  return t >= Date.now() - DAYS * 24 * 60 * 60 * 1000;
}

const FAILED_STATUSES = new Set(["FAILED", "REJECTED", "TIMED_OUT", "DUPLICATE_IGNORED"]);

/** Compiles the last 7 days of activity across WHMCS + our own PawaPay ledger
 *  and emails a summary to admin@bshopafrica.com. Meant to be hit by a cron
 *  job (see comment at the bottom of this file), not called from the UI. */
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (key !== REPORT_KEY) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const since = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000);
  const rangeLabel = `${since.toLocaleDateString()} – ${new Date().toLocaleDateString()}`;

  try {
    const [clients, orders, domains, tickets, whmcsTxns, pawapayTxns] = await Promise.all([
      getAdminClients(0, 200),
      getAdminOrders(0, 200),
      getAdminDomains(0, 200),
      getAdminTickets("", 0, 200),
      getAdminTransactions(0, 200),
      getPawapayTransactions(200),
    ]);

    const newClients    = clients.clients.filter(c => withinRange(c.datecreated)).length;
    const newOrders     = orders.orders.filter(o => withinRange(o.date)).length;
    const newDomains    = domains.domains.filter(d => withinRange(d.registrationdate)).length;
    const ticketsOpened = tickets.tickets.filter(t => withinRange(t.date)).length;
    const ticketsClosed = tickets.tickets.filter(t => t.status === "Closed" && withinRange(t.lastreply)).length;

    const paypalRevenue = whmcsTxns.transactions
      .filter(t => /paypal/i.test(t.gateway) && withinRange(t.date))
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    const mobileMoneyRevenue = pawapayTxns
      .filter(t => t.status === "COMPLETED" && withinRange(t.created_at))
      .reduce((sum, t) => sum + (Number(t.amount_usd) || 0), 0);
    const revenue = paypalRevenue + mobileMoneyRevenue;

    const failedPayments = pawapayTxns.filter(t => FAILED_STATUSES.has(t.status) && withinRange(t.created_at)).length;

    const stats: [string, string][] = [
      ["New Clients",         String(newClients)],
      ["Revenue",             `$${revenue.toFixed(2)}`],
      ["New Orders",          String(newOrders)],
      ["Domains Registered",  String(newDomains)],
      ["Tickets Opened",      String(ticketsOpened)],
      ["Tickets Closed",      String(ticketsClosed)],
      ["Failed Payments",     String(failedPayments)],
    ];

    const text = `B.Shop Africa Weekly Summary\n${rangeLabel}\n\n${stats.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\nView full dashboard: https://bshopafrica.com/admin/dashboard`;
    const html = `
      <h2>B.Shop Africa Weekly Summary</h2>
      <p style="color:#666">${rangeLabel}</p>
      <table cellpadding="8" style="border-collapse:collapse;width:100%;max-width:420px">
        ${stats.map(([k, v]) => `<tr style="border-bottom:1px solid #eee"><td style="color:#666">${k}</td><td style="font-weight:bold;text-align:right">${v}</td></tr>`).join("")}
      </table>
      <p style="margin-top:20px"><a href="https://bshopafrica.com/admin/dashboard">View full dashboard →</a></p>
    `;

    const sent = await sendSmtpMail("admin@bshopafrica.com", `B.Shop Africa Weekly Summary - ${rangeLabel}`, text, html);

    return NextResponse.json({ success: true, emailSent: sent, stats: Object.fromEntries(stats) });
  } catch (e) {
    console.error("[api/admin/weekly-report]", e);
    return NextResponse.json({ success: false, error: "Failed to compile weekly report" }, { status: 500 });
  }
}

/*
 * cPanel cron job (runs every Monday at 9am):
 *   0 9 * * 1 curl -s "https://bshopafrica.com/api/admin/weekly-report?key=BShop@Admin2026!" > /dev/null 2>&1
 *
 * Prefer setting WEEKLY_REPORT_KEY in the environment and using that value in
 * the cron command instead of the literal default above.
 */
