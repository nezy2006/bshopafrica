import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isAdminUnauthorized, logAdminActivity, getRequestIp, getActivityLogForClient } from "@/lib/admin-auth";
import { getClientNotes, addClientNote, deleteClientNote } from "@/lib/client-notes";
import { getPawapayTransactions } from "@/lib/pawapay-transactions";
import {
  getClientDetails, getClientProducts, getClientDomains, getInvoices, getClientOrders,
  getTickets, getClientActivityLog, getClientEmails, getAdminTransactions,
  updateClientDetails, updateClientStatus, addClientCredit, addClientDebit, sendClientEmail,
  suspendAllClientServices, unsuspendAllClientServices, updateClientPassword, deleteClient,
} from "@/lib/whmcs";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req, "clients");
  if (isAdminUnauthorized(admin)) return admin;

  const clientId = Number((await params).id);
  const [details, products, domains, invoices, orders, tickets, emails, whmcsLog, ourLog, notes, whmcsTxns, pawapayTxns] = await Promise.all([
    getClientDetails(clientId),
    getClientProducts(clientId),
    getClientDomains(clientId),
    getInvoices(clientId),
    getClientOrders(clientId),
    getTickets(clientId),
    getClientEmails(clientId),
    getClientActivityLog(clientId),
    getActivityLogForClient(clientId).catch(() => []),
    getClientNotes(clientId).catch(() => []),
    getAdminTransactions(0, 100, clientId).then(r => r.transactions).catch(() => []),
    getPawapayTransactions(500).catch(() => []),
  ]);

  const clientEmail = details.email.toLowerCase();
  const transactions = [
    ...whmcsTxns.filter(t => /paypal/i.test(t.gateway)).map(t => ({
      id: `whmcs-${t.id}`, date: t.date, amountUSD: Number(t.amount) || 0, amountLocal: null as number | null,
      currency: "USD", method: "PayPal", status: "Completed", reference: t.transid, invoiceId: t.invoiceid || null,
    })),
    ...pawapayTxns.filter(t => (t.client_email ?? "").toLowerCase() === clientEmail).map(t => ({
      id: `pawapay-${t.deposit_id}`, date: t.created_at, amountUSD: Number(t.amount_usd) || 0,
      amountLocal: Number(t.amount_local) || 0, currency: t.currency,
      method: (t.provider ?? "").startsWith("MTN") ? "MTN Mobile Money" : (t.provider ?? "").startsWith("AIRTEL") ? "Airtel Money" : "Mobile Money",
      status: t.status, reference: t.deposit_id, invoiceId: t.invoice_id,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return NextResponse.json({
    success: true,
    data: { details, products, domains, invoices, orders, tickets, emails, whmcsLog, ourLog, notes, transactions },
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req, "clients");
  if (isAdminUnauthorized(admin)) return admin;

  const clientId = Number((await params).id);
  const ip = getRequestIp(req);
  const body = (await req.json()) as Record<string, unknown>;
  const action = String(body.action ?? "");

  switch (action) {
    case "updateProfile": {
      await updateClientDetails(clientId, (body.updates as Record<string, string>) ?? {});
      await logAdminActivity(admin.id, "update_client_profile", `clientId=${clientId}`, ip);
      break;
    }
    case "setStatus": {
      const status = body.status === "Inactive" ? "Inactive" : "Active";
      await updateClientStatus(clientId, status);
      await logAdminActivity(admin.id, "update_client_status", `clientId=${clientId} status=${status}`, ip);
      break;
    }
    case "sendEmail": {
      const subject = String(body.subject ?? "").trim();
      const message = String(body.message ?? "").trim();
      if (!subject || !message) return NextResponse.json({ success: false, error: "Subject and message are required" }, { status: 400 });
      await sendClientEmail(clientId, subject, message);
      await logAdminActivity(admin.id, "send_client_email", `clientId=${clientId} subject=${subject}`, ip);
      break;
    }
    case "addCredit": {
      const amount = Number(body.amount ?? 0);
      if (!amount || amount <= 0) return NextResponse.json({ success: false, error: "Amount must be positive" }, { status: 400 });
      const description = String(body.description ?? "Admin credit adjustment");
      await addClientCredit(clientId, amount, description);
      await logAdminActivity(admin.id, "add_client_credit", `clientId=${clientId} amount=${amount}`, ip);
      break;
    }
    case "addDebit": {
      const amount = Number(body.amount ?? 0);
      if (!amount || amount <= 0) return NextResponse.json({ success: false, error: "Amount must be positive" }, { status: 400 });
      const description = String(body.description ?? "Admin debit adjustment");
      await addClientDebit(clientId, amount, description);
      await logAdminActivity(admin.id, "add_client_debit", `clientId=${clientId} amount=${amount}`, ip);
      break;
    }
    case "suspendAll": {
      await suspendAllClientServices(clientId, body.reason ? String(body.reason) : undefined);
      await logAdminActivity(admin.id, "suspend_all_services", `clientId=${clientId}`, ip);
      break;
    }
    case "unsuspendAll": {
      await unsuspendAllClientServices(clientId);
      await logAdminActivity(admin.id, "unsuspend_all_services", `clientId=${clientId}`, ip);
      break;
    }
    case "changePassword": {
      const password = String(body.password ?? "");
      if (password.length < 8) return NextResponse.json({ success: false, error: "Password must be at least 8 characters" }, { status: 400 });
      await updateClientPassword(clientId, password);
      await logAdminActivity(admin.id, "change_client_password", `clientId=${clientId}`, ip);
      break;
    }
    case "delete": {
      // Only super_admin/admin reach here in practice (Delete Client isn't shown to
      // other roles client-side), but the destructive WHMCS call itself has no
      // additional role check beyond the "clients" category requireAdmin already enforced.
      await deleteClient(clientId);
      await logAdminActivity(admin.id, "delete_client", `clientId=${clientId}`, ip);
      break;
    }
    case "addNote": {
      const note = String(body.note ?? "").trim();
      if (!note) return NextResponse.json({ success: false, error: "Note text is required" }, { status: 400 });
      await addClientNote(clientId, admin.id, note);
      await logAdminActivity(admin.id, "add_client_note", `clientId=${clientId}`, ip);
      break;
    }
    case "deleteNote": {
      await deleteClientNote(Number(body.noteId ?? 0));
      break;
    }
    default:
      return NextResponse.json({ success: false, error: `Unknown action: "${action}"` }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
