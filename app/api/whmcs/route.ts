import { NextRequest, NextResponse } from "next/server";
import {
  checkDomain, getProducts, loginClient, registerClient, addOrder,
  getClientDetails, getClientProducts, getClientDomains, getInvoices,
  getClientOrders, getTickets, getTicket, openTicket, addTicketReply,
  closeTicket, updateClientDetails, getInvoicePDFUrl, getPaymentUrl,
  getAdminStats, getAdminOverview, getAdminClients, getAdminOrders, getAdminInvoices,
  getAdminDomains, getAdminHosting, getAdminTickets, acceptOrder,
  cancelOrder, addAnnouncement, generateAutoAuthUrl, initiateTransfer,
  getTLDPricing, validateCoupon, addPaymentToInvoice, checkEmailExists,
  createSsoToken, getDomainNameservers, updateDomainNameservers,
  getDomainLockingStatus, updateDomainLockingStatus,
  validateLogin, updateClientPassword, createInvoice, getInvoice,
  updateClientStatus, addClientCredit, sendClientEmail, updateDomainAutoRenew,
  getOrderDetail, markOrderFraud, getPaymentMethods, createOrderWithGateway,
  WHMCS_PAYPAL_GATEWAY, WHMCS_PAWAPAY_GATEWAY,
  createInvoiceItemized, voidInvoice, applyCreditToInvoice, sendInvoiceReminder,
  getQuotes, createQuote, updateQuoteStage, deleteQuote, sendQuote, acceptQuote,
  suspendService, unsuspendService, terminateService, upgradeService,
  updateServiceDetails, sendServiceWelcomeEmail,
  registerDomain, transferDomainRecord, renewDomain, getDomainWhoisInfo,
} from "@/lib/whmcs";
import { createSession, getSession } from "@/lib/session-store";
import { requireAdmin, isAdminUnauthorized, logAdminActivity, getRequestIp as getAdminRequestIp } from "@/lib/admin-auth";

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

      case "adminGetStats": {
        const admin = await requireAdmin(req, "stats");
        if (isAdminUnauthorized(admin)) return admin;
        data = await getAdminStats();
        break;
      }
      case "adminGetOverview": {
        const admin = await requireAdmin(req, "stats");
        if (isAdminUnauthorized(admin)) return admin;
        data = await getAdminOverview();
        break;
      }
      case "adminGetClients": {
        const admin = await requireAdmin(req, "clients");
        if (isAdminUnauthorized(admin)) return admin;
        data = await getAdminClients(n("limitstart"), n("limitnum", 20), s("search"));
        break;
      }
      case "adminGetOrders": {
        const admin = await requireAdmin(req, "orders");
        if (isAdminUnauthorized(admin)) return admin;
        data = await getAdminOrders(n("limitstart"), n("limitnum", 20), s("status"));
        break;
      }
      case "adminGetOrderDetail": {
        const admin = await requireAdmin(req, "orders");
        if (isAdminUnauthorized(admin)) return admin;
        data = await getOrderDetail(n("orderId"));
        break;
      }
      case "adminMarkOrderFraud": {
        const admin = await requireAdmin(req, "orders");
        if (isAdminUnauthorized(admin)) return admin;
        await markOrderFraud(n("orderId"), Boolean(params.cancelSubscription));
        await logAdminActivity(admin.id, "mark_order_fraud", `orderId=${n("orderId")}`, getAdminRequestIp(req));
        data = { ok: true };
        break;
      }
      case "adminGetPaymentMethods": {
        const admin = await requireAdmin(req, "orders");
        if (isAdminUnauthorized(admin)) return admin;
        data = await getPaymentMethods();
        break;
      }
      case "adminCreateOrder": {
        const admin = await requireAdmin(req, "orders");
        if (isAdminUnauthorized(admin)) return admin;
        const clientId = n("clientId");
        if (!clientId) return NextResponse.json({ success: false, error: "clientId is required" }, { status: 400 });
        const gatewayChoice = s("gateway", "paypal");
        const gateway = gatewayChoice === "pawapay" ? WHMCS_PAWAPAY_GATEWAY : gatewayChoice === "paypal" ? WHMCS_PAYPAL_GATEWAY : gatewayChoice;
        const items = Array.isArray(params.items) ? params.items as { type: string; [k: string]: unknown }[] : [];
        if (items.length === 0) return NextResponse.json({ success: false, error: "At least one item is required" }, { status: 400 });
        const promoCode = params.promoCode ? s("promoCode") : undefined;
        const result = await createOrderWithGateway(clientId, items, gateway, promoCode);
        await logAdminActivity(admin.id, "create_order", `clientId=${clientId} orderId=${result.orderId}`, getAdminRequestIp(req));
        data = result;
        break;
      }
      case "adminGetInvoices": {
        const admin = await requireAdmin(req, "invoices");
        if (isAdminUnauthorized(admin)) return admin;
        data = await getAdminInvoices(s("status"), n("limitstart"), n("limitnum", 20));
        break;
      }
      case "adminGetDomains": {
        const admin = await requireAdmin(req, "domains");
        if (isAdminUnauthorized(admin)) return admin;
        data = await getAdminDomains(n("limitstart"), n("limitnum", 20));
        break;
      }
      case "adminUpdateDomainAutoRenew": {
        const admin = await requireAdmin(req, "domains");
        if (isAdminUnauthorized(admin)) return admin;
        const domainId = n("domainId");
        const autoRenew = Boolean(params.autoRenew);
        await updateDomainAutoRenew(domainId, autoRenew);
        await logAdminActivity(admin.id, "update_domain_autorenew", `domainId=${domainId} autoRenew=${autoRenew}`, getAdminRequestIp(req));
        data = { ok: true };
        break;
      }
      case "adminRegisterDomain": {
        const admin = await requireAdmin(req, "domains");
        if (isAdminUnauthorized(admin)) return admin;
        await registerDomain(n("domainId"));
        await logAdminActivity(admin.id, "register_domain", `domainId=${n("domainId")}`, getAdminRequestIp(req));
        data = { ok: true };
        break;
      }
      case "adminTransferDomain": {
        const admin = await requireAdmin(req, "domains");
        if (isAdminUnauthorized(admin)) return admin;
        await transferDomainRecord(n("domainId"), params.eppCode ? s("eppCode") : undefined);
        await logAdminActivity(admin.id, "transfer_domain", `domainId=${n("domainId")}`, getAdminRequestIp(req));
        data = { ok: true };
        break;
      }
      case "adminRenewDomain": {
        const admin = await requireAdmin(req, "domains");
        if (isAdminUnauthorized(admin)) return admin;
        await renewDomain(n("domainId"), params.regPeriod ? n("regPeriod") : undefined);
        await logAdminActivity(admin.id, "renew_domain", `domainId=${n("domainId")}`, getAdminRequestIp(req));
        data = { ok: true };
        break;
      }
      case "adminGetDomainNameservers": {
        const admin = await requireAdmin(req, "domains");
        if (isAdminUnauthorized(admin)) return admin;
        data = await getDomainNameservers(n("domainId"));
        break;
      }
      case "adminUpdateDomainNameservers": {
        const admin = await requireAdmin(req, "domains");
        if (isAdminUnauthorized(admin)) return admin;
        await updateDomainNameservers(n("domainId"), (params.ns as Record<string, string>) ?? {});
        await logAdminActivity(admin.id, "update_domain_nameservers", `domainId=${n("domainId")}`, getAdminRequestIp(req));
        data = { ok: true };
        break;
      }
      case "adminGetDomainLockingStatus": {
        const admin = await requireAdmin(req, "domains");
        if (isAdminUnauthorized(admin)) return admin;
        data = { locked: await getDomainLockingStatus(n("domainId")) };
        break;
      }
      case "adminUpdateDomainLockingStatus": {
        const admin = await requireAdmin(req, "domains");
        if (isAdminUnauthorized(admin)) return admin;
        await updateDomainLockingStatus(n("domainId"), Boolean(params.locked));
        await logAdminActivity(admin.id, "update_domain_lock", `domainId=${n("domainId")} locked=${Boolean(params.locked)}`, getAdminRequestIp(req));
        data = { ok: true };
        break;
      }
      case "adminGetDomainWhois": {
        const admin = await requireAdmin(req, "domains");
        if (isAdminUnauthorized(admin)) return admin;
        data = await getDomainWhoisInfo(n("domainId"));
        break;
      }
      case "adminGetHosting": {
        const admin = await requireAdmin(req, "hosting");
        if (isAdminUnauthorized(admin)) return admin;
        data = await getAdminHosting(n("limitstart"), n("limitnum", 20), s("status"));
        break;
      }
      case "adminSuspendService": {
        const admin = await requireAdmin(req, "services");
        if (isAdminUnauthorized(admin)) return admin;
        await suspendService(n("serviceId"), params.reason ? s("reason") : undefined);
        await logAdminActivity(admin.id, "suspend_service", `serviceId=${n("serviceId")}`, getAdminRequestIp(req));
        data = { ok: true };
        break;
      }
      case "adminUnsuspendService": {
        const admin = await requireAdmin(req, "services");
        if (isAdminUnauthorized(admin)) return admin;
        await unsuspendService(n("serviceId"));
        await logAdminActivity(admin.id, "unsuspend_service", `serviceId=${n("serviceId")}`, getAdminRequestIp(req));
        data = { ok: true };
        break;
      }
      case "adminTerminateService": {
        const admin = await requireAdmin(req, "services");
        if (isAdminUnauthorized(admin)) return admin;
        await terminateService(n("serviceId"));
        await logAdminActivity(admin.id, "terminate_service", `serviceId=${n("serviceId")}`, getAdminRequestIp(req));
        data = { ok: true };
        break;
      }
      case "adminUpgradeService": {
        const admin = await requireAdmin(req, "services");
        if (isAdminUnauthorized(admin)) return admin;
        await upgradeService(n("serviceId"), n("newProductId"), s("newBillingCycle", "monthly"), s("paymentMethod", WHMCS_PAYPAL_GATEWAY));
        await logAdminActivity(admin.id, "upgrade_service", `serviceId=${n("serviceId")} newProductId=${n("newProductId")}`, getAdminRequestIp(req));
        data = { ok: true };
        break;
      }
      case "adminUpdateService": {
        const admin = await requireAdmin(req, "services");
        if (isAdminUnauthorized(admin)) return admin;
        await updateServiceDetails(n("serviceId"), {
          nextDueDate: params.nextDueDate ? s("nextDueDate") : undefined,
          recurringAmount: params.recurringAmount !== undefined ? Number(params.recurringAmount) : undefined,
          status: params.status ? s("status") : undefined,
        });
        await logAdminActivity(admin.id, "update_service", `serviceId=${n("serviceId")}`, getAdminRequestIp(req));
        data = { ok: true };
        break;
      }
      case "adminSendServiceWelcomeEmail": {
        const admin = await requireAdmin(req, "services");
        if (isAdminUnauthorized(admin)) return admin;
        await sendServiceWelcomeEmail(n("serviceId"));
        await logAdminActivity(admin.id, "send_welcome_email", `serviceId=${n("serviceId")}`, getAdminRequestIp(req));
        data = { ok: true };
        break;
      }
      case "adminGetTickets": {
        const admin = await requireAdmin(req, "tickets");
        if (isAdminUnauthorized(admin)) return admin;
        data = await getAdminTickets(s("status"), n("limitstart"), n("limitnum", 20));
        break;
      }
      case "adminAcceptOrder": {
        const admin = await requireAdmin(req, "orders");
        if (isAdminUnauthorized(admin)) return admin;
        await acceptOrder(n("orderId"));
        await logAdminActivity(admin.id, "accept_order", `orderId=${n("orderId")}`, getAdminRequestIp(req));
        data = { ok: true };
        break;
      }
      case "adminCancelOrder": {
        const admin = await requireAdmin(req, "orders");
        if (isAdminUnauthorized(admin)) return admin;
        await cancelOrder(n("orderId"));
        await logAdminActivity(admin.id, "cancel_order", `orderId=${n("orderId")}`, getAdminRequestIp(req));
        data = { ok: true };
        break;
      }
      case "adminAddAnnouncement": {
        const admin = await requireAdmin(req, "settings");
        if (isAdminUnauthorized(admin)) return admin;
        await addAnnouncement(s("subject"), s("message"));
        await logAdminActivity(admin.id, "add_announcement", s("subject"), getAdminRequestIp(req));
        data = { ok: true };
        break;
      }
      case "adminGetClientDetails": {
        const admin = await requireAdmin(req, "clients");
        if (isAdminUnauthorized(admin)) return admin;
        const clientId = n("clientId");
        const [details, products, domains, orders, invoices] = await Promise.all([
          getClientDetails(clientId), getClientProducts(clientId), getClientDomains(clientId),
          getClientOrders(clientId), getInvoices(clientId),
        ]);
        data = { details, products, domains, orders, invoices };
        break;
      }
      case "adminUpdateClientStatus": {
        const admin = await requireAdmin(req, "clients");
        if (isAdminUnauthorized(admin)) return admin;
        const clientId = n("clientId");
        const newStatus = s("status") === "Inactive" ? "Inactive" : "Active";
        await updateClientStatus(clientId, newStatus);
        await logAdminActivity(admin.id, "update_client_status", `clientId=${clientId} status=${newStatus}`, getAdminRequestIp(req));
        data = { ok: true };
        break;
      }
      case "adminAddCredit": {
        const admin = await requireAdmin(req, "clients");
        if (isAdminUnauthorized(admin)) return admin;
        const clientId = n("clientId");
        const amount = Number(params.amount ?? 0);
        const description = s("description", "Admin credit adjustment");
        await addClientCredit(clientId, amount, description);
        await logAdminActivity(admin.id, "add_client_credit", `clientId=${clientId} amount=${amount}`, getAdminRequestIp(req));
        data = { ok: true };
        break;
      }
      case "adminSendClientEmail": {
        const admin = await requireAdmin(req, "clients");
        if (isAdminUnauthorized(admin)) return admin;
        const clientId = n("clientId");
        await sendClientEmail(clientId, s("subject"), s("message"));
        await logAdminActivity(admin.id, "send_client_email", `clientId=${clientId} subject=${s("subject")}`, getAdminRequestIp(req));
        data = { ok: true };
        break;
      }
      case "getAutoAuthUrl": {
        const admin = await requireAdmin(req, "settings");
        if (isAdminUnauthorized(admin)) return admin;
        data = generateAutoAuthUrl(s("email"), s("destination", "clientarea.php"));
        break;
      }
      case "createSsoToken": {
        const admin = await requireAdmin(req, "settings");
        if (isAdminUnauthorized(admin)) return admin;
        data = await createSsoToken(n("clientId"), s("destination", "clientarea"), params.serviceId ? n("serviceId") : undefined);
        break;
      }
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
      case "updateDomainAutoRenew": {
        const session = requireSession(req);
        if (isUnauthorized(session)) return session;
        if (!(await ownsDomain(session.clientId, n("domainId")))) {
          return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
        }
        await updateDomainAutoRenew(n("domainId"), Boolean(params.autoRenew));
        data = { ok: true };
        break;
      }
      case "initiateTransfer": {
        const session = requireSession(req);
        if (isUnauthorized(session)) return session;
        data = await initiateTransfer(session.clientId, s("domain"), s("authCode"));
        break;
      }
      case "getTLDPricing":         data = await getTLDPricing(); break;
      case "validateCoupon":        data = await validateCoupon(s("code")); break;
      case "addPayment": {
        const admin = await requireAdmin(req, "invoices");
        if (isAdminUnauthorized(admin)) return admin;
        await addPaymentToInvoice(n("invoiceId"), Number(params.amount ?? 0), s("transactionId"));
        await logAdminActivity(admin.id, "mark_invoice_paid", `invoiceId=${n("invoiceId")} amount=${Number(params.amount ?? 0)}`, getAdminRequestIp(req));
        data = { ok: true };
        break;
      }
      case "adminCreateInvoice": {
        const admin = await requireAdmin(req, "invoices");
        if (isAdminUnauthorized(admin)) return admin;
        const clientId = n("clientId");
        const items = Array.isArray(params.items) ? (params.items as { description: string; amount: number }[]) : [];
        if (!clientId || items.length === 0) return NextResponse.json({ success: false, error: "clientId and at least one item are required" }, { status: 400 });
        const invoiceId = await createInvoiceItemized(clientId, items, params.dueDate ? s("dueDate") : undefined);
        await logAdminActivity(admin.id, "create_invoice", `clientId=${clientId} invoiceId=${invoiceId}`, getAdminRequestIp(req));
        data = { invoiceId };
        break;
      }
      case "adminVoidInvoice": {
        const admin = await requireAdmin(req, "invoices");
        if (isAdminUnauthorized(admin)) return admin;
        await voidInvoice(n("invoiceId"));
        await logAdminActivity(admin.id, "void_invoice", `invoiceId=${n("invoiceId")}`, getAdminRequestIp(req));
        data = { ok: true };
        break;
      }
      case "adminApplyCredit": {
        const admin = await requireAdmin(req, "invoices");
        if (isAdminUnauthorized(admin)) return admin;
        await applyCreditToInvoice(n("invoiceId"), Number(params.amount ?? 0));
        await logAdminActivity(admin.id, "apply_credit", `invoiceId=${n("invoiceId")} amount=${Number(params.amount ?? 0)}`, getAdminRequestIp(req));
        data = { ok: true };
        break;
      }
      case "adminSendInvoiceReminder": {
        const admin = await requireAdmin(req, "invoices");
        if (isAdminUnauthorized(admin)) return admin;
        await sendInvoiceReminder(n("clientId"), n("invoiceId"), s("total"), s("dueDate"));
        await logAdminActivity(admin.id, "send_invoice_reminder", `invoiceId=${n("invoiceId")}`, getAdminRequestIp(req));
        data = { ok: true };
        break;
      }

      case "adminGetQuotes": {
        const admin = await requireAdmin(req, "quotes");
        if (isAdminUnauthorized(admin)) return admin;
        data = await getQuotes(n("limitstart"), n("limitnum", 20));
        break;
      }
      case "adminCreateQuote": {
        const admin = await requireAdmin(req, "quotes");
        if (isAdminUnauthorized(admin)) return admin;
        const clientId = n("clientId");
        const lineitems = Array.isArray(params.lineitems) ? (params.lineitems as { description: string; amount: number }[]) : [];
        if (!clientId || !s("subject") || lineitems.length === 0) return NextResponse.json({ success: false, error: "clientId, subject, and at least one line item are required" }, { status: 400 });
        const quoteId = await createQuote({ clientId, subject: s("subject"), validUntil: s("validUntil"), lineitems, proposal: params.proposal ? s("proposal") : undefined, adminNotes: params.adminNotes ? s("adminNotes") : undefined });
        await logAdminActivity(admin.id, "create_quote", `clientId=${clientId} quoteId=${quoteId}`, getAdminRequestIp(req));
        data = { quoteId };
        break;
      }
      case "adminUpdateQuoteStage": {
        const admin = await requireAdmin(req, "quotes");
        if (isAdminUnauthorized(admin)) return admin;
        await updateQuoteStage(n("quoteId"), s("stage"));
        await logAdminActivity(admin.id, "update_quote_stage", `quoteId=${n("quoteId")} stage=${s("stage")}`, getAdminRequestIp(req));
        data = { ok: true };
        break;
      }
      case "adminDeleteQuote": {
        const admin = await requireAdmin(req, "quotes");
        if (isAdminUnauthorized(admin)) return admin;
        await deleteQuote(n("quoteId"));
        await logAdminActivity(admin.id, "delete_quote", `quoteId=${n("quoteId")}`, getAdminRequestIp(req));
        data = { ok: true };
        break;
      }
      case "adminSendQuote": {
        const admin = await requireAdmin(req, "quotes");
        if (isAdminUnauthorized(admin)) return admin;
        await sendQuote(n("quoteId"));
        await logAdminActivity(admin.id, "send_quote", `quoteId=${n("quoteId")}`, getAdminRequestIp(req));
        data = { ok: true };
        break;
      }
      case "adminAcceptQuote": {
        const admin = await requireAdmin(req, "quotes");
        if (isAdminUnauthorized(admin)) return admin;
        await acceptQuote(n("quoteId"));
        await logAdminActivity(admin.id, "accept_quote", `quoteId=${n("quoteId")}`, getAdminRequestIp(req));
        data = { ok: true };
        break;
      }

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
