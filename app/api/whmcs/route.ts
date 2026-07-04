import { NextRequest, NextResponse } from "next/server";
import {
  checkDomain, getProducts, loginClient, registerClient, addOrder,
  getClientDetails, getClientProducts, getClientDomains, getInvoices,
  getClientOrders, getTickets, getTicket, openTicket, addTicketReply,
  closeTicket, updateClientDetails, getInvoicePDFUrl, getPaymentUrl,
  getAdminStats, getAdminClients, getAdminOrders, getAdminInvoices,
  getAdminDomains, getAdminHosting, getAdminTickets, acceptOrder,
  cancelOrder, addAnnouncement, generateAutoAuthUrl, initiateTransfer,
  getTLDPricing, validateCoupon, addPaymentToInvoice, checkEmailExists,
  createSsoToken, getDomainNameservers, updateDomainNameservers,
  getDomainLockingStatus, updateDomainLockingStatus,
  validateLogin, updateClientPassword,
} from "@/lib/whmcs";

type Params = Record<string, unknown>;

/* ─── Brute-force rate limiter (in-memory, per-IP) ──────────────────────── */
interface RateEntry { failures: number; blockedUntil: number; }
declare global { var __loginRateLimit: Map<string, RateEntry> | undefined; }
const loginRateLimit: Map<string, RateEntry> =
  globalThis.__loginRateLimit ?? (globalThis.__loginRateLimit = new Map());

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function checkLoginRateLimit(ip: string): string | null {
  const now   = Date.now();
  const entry = loginRateLimit.get(ip);
  if (!entry) return null;
  if (entry.blockedUntil > now) {
    const mins = Math.ceil((entry.blockedUntil - now) / 60000);
    return `Too many failed attempts. Try again in ${mins} minute${mins !== 1 ? "s" : ""}.`;
  }
  return null;
}

function recordLoginFailure(ip: string): void {
  const now   = Date.now();
  const entry = loginRateLimit.get(ip) ?? { failures: 0, blockedUntil: 0 };
  entry.failures++;
  if (entry.failures >= 5) {
    entry.blockedUntil = now + 15 * 60 * 1000;
    entry.failures     = 0;
  }
  loginRateLimit.set(ip, entry);
}

function clearLoginFailures(ip: string): void {
  loginRateLimit.delete(ip);
}

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
    // Accept camelCase / lowercase / snake_case for every param key so callers
    // can't accidentally send the wrong casing (clientId / clientid / client_id).
    const n = (k: string, fb = 0) => {
      const lo = k.toLowerCase();
      const sn = k.replace(/[A-Z]/g, m => `_${m.toLowerCase()}`);
      return Number(params[k] ?? params[lo] ?? params[sn] ?? fb);
    };
    const s = (k: string, fb = "") => {
      const lo = k.toLowerCase();
      const sn = k.replace(/[A-Z]/g, m => `_${m.toLowerCase()}`);
      return String(params[k] ?? params[lo] ?? params[sn] ?? fb);
    };

    switch (action) {
      case "checkDomain":    data = await checkDomain(s("domain"), s("tld", ".com")); break;
      case "getProducts":    data = await getProducts(); break;

      case "loginClient": {
        const ip      = getClientIp(req);
        const blocked = checkLoginRateLimit(ip);
        if (blocked) return NextResponse.json({ success: false, error: blocked });
        try {
          data = await loginClient(s("email"), s("password"));
          clearLoginFailures(ip);
        } catch (e) {
          recordLoginFailure(ip);
          console.error("[loginClient]", e instanceof Error ? e.message : e);
          // Distinguish "no account" from "wrong password" so the UI can offer signup
          const exists = await checkEmailExists(s("email")).catch(() => true);
          if (!exists) {
            return NextResponse.json({
              success:   false,
              errorType: "not_found",
              error:     "No account found with that email address.",
            });
          }
          return NextResponse.json({
            success:   false,
            errorType: "wrong_password",
            error:     "Incorrect password. Please try again.",
          });
        }
        break;
      }
      case "checkEmailExists": data = { exists: await checkEmailExists(s("email")) }; break;
      case "registerClient": {
        try {
          data = await registerClient(params as Record<string, string>);
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Registration failed.";
          console.error("[registerClient]", msg);
          return NextResponse.json({ success: false, error: msg }, { status: 500 });
        }
        break;
      }
      case "addOrder":       data = await addOrder(n("clientId"), (params.items as Record<string, string | number>) ?? {}); break;

      case "getClientDetails": {
        console.log("getClientDetails params:", JSON.stringify(params));
        const clientId = Number(params.clientId ?? params.clientid ?? params.client_id ?? 0);
        const email    = params.email ? String(params.email) : undefined;
        if (!clientId && !email) return NextResponse.json({ success: false, error: "clientId or email required" });
        data = await getClientDetails(clientId, email);
        break;
      }
      case "getClientProducts": data = await getClientProducts(n("clientId")); break;
      case "getClientDomains":  data = await getClientDomains(n("clientId")); break;
      case "getInvoices":       data = await getInvoices(n("clientId")); break;
      case "getClientOrders":   data = await getClientOrders(n("clientId")); break;

      case "getInvoicePDFUrl": data = getInvoicePDFUrl(n("invoiceId")); break;
      case "getPaymentUrl":    data = getPaymentUrl(n("invoiceId")); break;

      case "getTickets": {
        const clientId = Number(params.clientId ?? params.clientid ?? params.client_id ?? 0);
        if (!clientId) return NextResponse.json({ success: false, error: "clientId required" });
        data = await getTickets(clientId);
        break;
      }
      case "getTicket":      data = await getTicket(n("ticketId")); break;
      case "openTicket":     data = await openTicket({ clientId: n("clientId"), subject: s("subject"), message: s("message"), deptId: n("deptId", 1), priority: s("priority", "Medium"), name: params.name ? s("name") : undefined, email: params.email ? s("email") : undefined }); break;
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
      case "createSsoToken":        data = await createSsoToken(n("clientId"), s("destination", "clientarea"), params.serviceId ? n("serviceId") : undefined); break;
      case "getDomainNameservers":     data = await getDomainNameservers(n("domainId")); break;
      case "updateDomainNameservers":  await updateDomainNameservers(n("domainId"), (params.ns as Record<string, string>) ?? {}); data = { ok: true }; break;
      case "getDomainLockingStatus":   data = { locked: await getDomainLockingStatus(n("domainId")) }; break;
      case "updateDomainLockingStatus": await updateDomainLockingStatus(n("domainId"), Boolean(params.locked)); data = { ok: true }; break;
      case "initiateTransfer":      data = await initiateTransfer(n("clientId"), s("domain"), s("authCode")); break;
      case "getTLDPricing":         data = await getTLDPricing(); break;
      case "validateCoupon":        data = await validateCoupon(s("code")); break;
      case "addPayment":            await addPaymentToInvoice(n("invoiceId"), Number(params.amount ?? 0), s("transactionId")); data = { ok: true }; break;
      case "validateLogin":         data = { valid: await validateLogin(s("email"), s("password")) }; break;
      case "updateClientPassword":  await updateClientPassword(n("clientId"), s("password")); data = { ok: true }; break;

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
