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
  validateLogin, updateClientPassword, createInvoice, getInvoice,
} from "@/lib/whmcs";
import { createSession, getSession } from "@/lib/session-store";

type Params = Record<string, unknown>;

/* ─── Session enforcement ────────────────────────────────────────────────
   clientId must NEVER be trusted from the request body — it's attacker-
   controlled (localStorage). Every action that reads or writes a specific
   client's data resolves the real clientId from the server-side session
   attached to the x-session-token header instead. ────────────────────── */
function requireSession(req: NextRequest): { clientId: number; email: string } | NextResponse {
  const session = getSession(req.headers.get("x-session-token"));
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  return { clientId: session.clientId, email: session.email };
}

function isUnauthorized(x: unknown): x is NextResponse {
  return x instanceof NextResponse;
}

async function ownsDomain(clientId: number, domainId: number): Promise<boolean> {
  const domains = await getClientDomains(clientId);
  return domains.some(d => d.id === domainId);
}

/** Looks for an existing unpaid invoice whose line items mention `matchText`
 *  (e.g. a domain or hosting service name) so renewal clicks don't spawn a
 *  fresh duplicate invoice every time. */
async function findUnpaidInvoiceForItem(clientId: number, matchText: string): Promise<{ invoiceId: number; amount: number } | null> {
  const invoices = await getInvoices(clientId);
  const unpaid = invoices.filter(i => i.status === "Unpaid");
  for (const inv of unpaid) {
    try {
      const details = await getInvoice(inv.id);
      if (details.userid === clientId && details.items.some(it => it.description.includes(matchText))) {
        return { invoiceId: inv.id, amount: parseFloat(details.total) || 0 };
      }
    } catch { /* skip unreadable invoice, keep searching */ }
  }
  return null;
}

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
          const login = await loginClient(s("email"), s("password"));
          const sessionToken = createSession(login.clientId, login.email);
          data = { ...login, sessionToken };
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
          const reg = await registerClient(params as Record<string, string>);
          const sessionToken = createSession(reg.clientId, s("email"));
          data = { ...reg, sessionToken };
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Registration failed.";
          console.error("[registerClient]", msg);
          return NextResponse.json({ success: false, error: msg }, { status: 500 });
        }
        break;
      }
      case "addOrder":       data = await addOrder(n("clientId"), (params.items as Record<string, string | number>) ?? {}); break;

      case "getClientDetails": {
        // No client-supplied clientId/email lookup here — that used to let anyone
        // fetch any client's name/phone/status by guessing an id or email.
        const session = requireSession(req);
        if (isUnauthorized(session)) return session;
        data = await getClientDetails(session.clientId);
        break;
      }
      case "getClientProducts": {
        const session = requireSession(req);
        if (isUnauthorized(session)) return session;
        data = await getClientProducts(session.clientId);
        break;
      }
      case "getClientDomains": {
        const session = requireSession(req);
        if (isUnauthorized(session)) return session;
        data = await getClientDomains(session.clientId);
        break;
      }
      case "getInvoices": {
        const session = requireSession(req);
        if (isUnauthorized(session)) return session;
        data = await getInvoices(session.clientId);
        break;
      }
      case "getClientOrders": {
        const session = requireSession(req);
        if (isUnauthorized(session)) return session;
        data = await getClientOrders(session.clientId);
        break;
      }

      case "getInvoicePDFUrl": data = getInvoicePDFUrl(n("invoiceId")); break;
      case "getPaymentUrl": {
        // clientId for the SSO auto-login link is resolved from the session,
        // never from params — trusting a client-supplied clientId here would
        // let anyone mint a WHMCS auto-login link for someone else's account.
        const session = requireSession(req);
        data = await getPaymentUrl(n("invoiceId"), isUnauthorized(session) ? undefined : session.clientId);
        break;
      }

      case "getTickets": {
        const session = requireSession(req);
        if (isUnauthorized(session)) return session;
        data = await getTickets(session.clientId);
        break;
      }
      case "getTicket": {
        const session = requireSession(req);
        if (isUnauthorized(session)) return session;
        const ticket = await getTicket(n("ticketId"));
        if (ticket.userid !== session.clientId) {
          return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
        }
        data = ticket;
        break;
      }
      case "openTicket": {
        const session = requireSession(req);
        if (isUnauthorized(session)) return session;
        data = await openTicket({ clientId: session.clientId, subject: s("subject"), message: s("message"), deptId: n("deptId", 1), priority: s("priority", "Medium"), name: params.name ? s("name") : undefined, email: params.email ? s("email") : undefined, attachmentUrls: params.attachmentUrls as string[] | undefined });
        break;
      }
      case "addTicketReply": {
        const session = requireSession(req);
        if (isUnauthorized(session)) return session;
        const ticket = await getTicket(n("ticketId"));
        if (ticket.userid !== session.clientId) {
          return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
        }
        await addTicketReply(n("ticketId"), session.clientId, s("message"), params.attachmentUrls as string[] | undefined);
        data = { ok: true };
        break;
      }
      case "closeTicket": {
        const session = requireSession(req);
        if (isUnauthorized(session)) return session;
        const ticket = await getTicket(n("ticketId"));
        if (ticket.userid !== session.clientId) {
          return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
        }
        await closeTicket(n("ticketId"));
        data = { ok: true };
        break;
      }
      case "updateClientDetails": {
        const session = requireSession(req);
        if (isUnauthorized(session)) return session;
        await updateClientDetails(session.clientId, params.updates as Record<string, string>);
        data = { ok: true };
        break;
      }

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
      case "getDomainNameservers": {
        const session = requireSession(req);
        if (isUnauthorized(session)) return session;
        if (!(await ownsDomain(session.clientId, n("domainId")))) {
          return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
        }
        data = await getDomainNameservers(n("domainId"));
        break;
      }
      case "updateDomainNameservers": {
        const session = requireSession(req);
        if (isUnauthorized(session)) return session;
        if (!(await ownsDomain(session.clientId, n("domainId")))) {
          return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
        }
        await updateDomainNameservers(n("domainId"), (params.ns as Record<string, string>) ?? {});
        data = { ok: true };
        break;
      }
      case "getDomainLockingStatus": {
        const session = requireSession(req);
        if (isUnauthorized(session)) return session;
        if (!(await ownsDomain(session.clientId, n("domainId")))) {
          return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
        }
        data = { locked: await getDomainLockingStatus(n("domainId")) };
        break;
      }
      case "updateDomainLockingStatus": {
        const session = requireSession(req);
        if (isUnauthorized(session)) return session;
        if (!(await ownsDomain(session.clientId, n("domainId")))) {
          return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
        }
        await updateDomainLockingStatus(n("domainId"), Boolean(params.locked));
        data = { ok: true };
        break;
      }
      case "initiateTransfer":      data = await initiateTransfer(n("clientId"), s("domain"), s("authCode")); break;
      case "getTLDPricing":         data = await getTLDPricing(); break;
      case "validateCoupon":        data = await validateCoupon(s("code")); break;
      case "addPayment":            await addPaymentToInvoice(n("invoiceId"), Number(params.amount ?? 0), s("transactionId")); data = { ok: true }; break;
      case "validateLogin":         data = { valid: await validateLogin(s("email"), s("password")) }; break;
      case "createInvoice": {
        const session = requireSession(req);
        if (isUnauthorized(session)) return session;
        data = { invoiceId: await createInvoice(session.clientId, s("description"), Number(params.amount ?? 0)) };
        break;
      }
      case "findOrCreateRenewalInvoice": {
        const session = requireSession(req);
        if (isUnauthorized(session)) return session;
        const matchText   = s("matchText");
        const description = s("description");
        const amount       = Number(params.amount ?? 0);
        if (!matchText || !description || !amount) {
          return NextResponse.json({ success: false, error: "matchText, description, and amount are required" }, { status: 400 });
        }
        const existing = await findUnpaidInvoiceForItem(session.clientId, matchText);
        if (existing) {
          data = existing;
        } else {
          const invoiceId = await createInvoice(session.clientId, description, amount);
          data = { invoiceId, amount };
        }
        break;
      }
      case "updateClientPassword": {
        const session = requireSession(req);
        if (isUnauthorized(session)) return session;
        const password = params.password ?? params.password2 ?? params.newPassword;
        if (!password) {
          return NextResponse.json({ success: false, error: "password is required" }, { status: 400 });
        }
        await updateClientPassword(session.clientId, String(password));
        data = { ok: true };
        break;
      }

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
