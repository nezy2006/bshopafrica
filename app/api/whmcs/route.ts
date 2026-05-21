import { NextRequest, NextResponse } from "next/server";
import {
  checkDomain, getProducts, loginClient, registerClient, addOrder,
  getClientDetails, getClientProducts, getClientDomains, getInvoices,
  getClientOrders, getTickets, getTicket, openTicket, addTicketReply,
  closeTicket, updateClientDetails, getInvoicePDFUrl, getPaymentUrl,
  getAdminStats, getAdminClients, getAdminOrders, getAdminInvoices,
  getAdminDomains, getAdminHosting, getAdminTickets, acceptOrder,
  cancelOrder, addAnnouncement, generateAutoAuthUrl, initiateTransfer,
} from "@/lib/whmcs";

type Params = Record<string, unknown>;

export async function POST(req: NextRequest) {
  let action: string | undefined, params: Params = {};
  try {
    const body = (await req.json()) as { action?: string; params?: Params };
    action = body.action; params = body.params ?? {};
  } catch {
    return NextResponse.json({ success: false, error: "Request body must be valid JSON" }, { status: 400 });
  }
  if (!action) return NextResponse.json({ success: false, error: "Missing action" }, { status: 400 });

  try {
    let data: unknown;
    const n = (k: string, fb = 0) => Number(params[k] ?? fb);
    const s = (k: string, fb = "") => String(params[k] ?? fb);

    switch (action) {
      case "checkDomain":    data = await checkDomain(s("domain"), s("tld", ".com")); break;
      case "getProducts":    data = await getProducts(); break;

      case "loginClient": {
        try { data = await loginClient(s("email"), s("password")); }
        catch { return NextResponse.json({ success: false, error: "Invalid email or password." }); }
        break;
      }
      case "registerClient": data = await registerClient(params as Record<string, string>); break;
      case "addOrder":       data = await addOrder(n("clientId"), (params.items as Record<string, string | number>) ?? {}); break;

      case "getClientDetails":  data = await getClientDetails(n("clientId")); break;
      case "getClientProducts": data = await getClientProducts(n("clientId")); break;
      case "getClientDomains":  data = await getClientDomains(n("clientId")); break;
      case "getInvoices":       data = await getInvoices(n("clientId")); break;
      case "getClientOrders":   data = await getClientOrders(n("clientId")); break;

      case "getInvoicePDFUrl": data = getInvoicePDFUrl(n("invoiceId")); break;
      case "getPaymentUrl":    data = getPaymentUrl(n("invoiceId")); break;

      case "getTickets":     data = await getTickets(n("clientId")); break;
      case "getTicket":      data = await getTicket(n("ticketId")); break;
      case "openTicket":     data = await openTicket({ clientId: n("clientId"), subject: s("subject"), message: s("message"), deptId: n("deptId", 1), priority: s("priority", "Medium") }); break;
      case "addTicketReply": await addTicketReply(n("ticketId"), n("clientId"), s("message")); data = { ok: true }; break;
      case "closeTicket":    await closeTicket(n("ticketId")); data = { ok: true }; break;
      case "updateClientDetails": await updateClientDetails(n("clientId"), params.updates as Record<string, string>); data = { ok: true }; break;

      case "adminGetStats":         data = await getAdminStats(); break;
      case "adminGetClients":       data = await getAdminClients(n("limitstart"), n("limitnum", 20), s("search")); break;
      case "adminGetOrders":        data = await getAdminOrders(n("limitstart"), n("limitnum", 20)); break;
      case "adminGetInvoices":      data = await getAdminInvoices(s("status"), n("limitstart"), n("limitnum", 20)); break;
      case "adminGetDomains":       data = await getAdminDomains(n("limitstart"), n("limitnum", 20)); break;
      case "adminGetHosting":       data = await getAdminHosting(n("limitstart"), n("limitnum", 20)); break;
      case "adminGetTickets":       data = await getAdminTickets(s("status"), n("limitstart"), n("limitnum", 20)); break;
      case "adminAcceptOrder":      await acceptOrder(n("orderId")); data = { ok: true }; break;
      case "adminCancelOrder":      await cancelOrder(n("orderId")); data = { ok: true }; break;
      case "adminAddAnnouncement":  await addAnnouncement(s("subject"), s("message")); data = { ok: true }; break;
      case "getAutoAuthUrl":        data = generateAutoAuthUrl(s("email"), s("destination", "clientarea.php")); break;
      case "initiateTransfer":      data = await initiateTransfer(n("clientId"), s("domain"), s("authCode")); break;

      default:
        return NextResponse.json({ success: false, error: `Unknown action: "${action}"` }, { status: 400 });
    }
    return NextResponse.json({ success: true, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error(`[/api/whmcs] action=${action}`, message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
