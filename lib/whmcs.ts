// Server-only — never import this from client components.
// IMPORTANT: Your server's public IP must be whitelisted in WHMCS:
//   Admin → Setup → General Settings → Security → API IP Access Restriction
// A missing whitelist entry causes all API calls to return HTTP 403.

import crypto from "crypto";
import { config } from "@/lib/config";
import { whmcsDbEnabled, updatePasswordDirect, validatePasswordDirect } from "@/lib/whmcs-db";

// WHMCS rejected AddOrder's "paypal" tag (confirmed via a live API error
// listing valid gateway module names); "paypal_ppcpv" is the active module.
// Override with WHMCS_PAYPAL_GATEWAY if that ever changes again.
export const WHMCS_PAYPAL_GATEWAY = process.env.WHMCS_PAYPAL_GATEWAY ?? "paypal_ppcpv";

// Gateway module name recorded against PawaPay-originated payments. Centralized
// here (was previously inlined separately in createPawapayOrder and the
// pawapay callback route, risking drift between the two).
export const WHMCS_PAWAPAY_GATEWAY = process.env.WHMCS_PAWAPAY_GATEWAY ?? "banktransfer";

export const BSHOP_NAMESERVERS = {
  ns1: "ns1.mysecurecloudhost.com",
  ns2: "ns2.mysecurecloudhost.com",
  ns3: "ns3.mysecurecloudhost.com",
  ns4: "ns4.mysecurecloudhost.com",
} as const;

type WhmcsRaw = Record<string, unknown>;

/* ─── Client-facing types ────────────────────────────────────────────────── */
export interface DomainCheckResult  { available: boolean; domain: string; price: number | null; }
export interface WhmcsProduct       { pid: number; name: string; description: string; pricing: Record<string, unknown>; features: string[]; }
export interface LoginResult        { clientId: number; passwordHash: string; firstname: string; lastname: string; email: string; }
export interface RegisterResult     { clientId: number; }
export interface OrderResult        { orderId: number; invoiceId: number; }
export interface ClientDetails      { id: number; firstname: string; lastname: string; email: string; phonenumber: string; status: string; datecreated: string; }
export interface ClientProduct      { id: number; name: string; status: string; nextduedate: string; billingcycle: string; amount: string; domain: string; }
export interface ClientDomain       { id: number; domainname: string; status: string; nextduedate: string; expirydate: string; autorenew: boolean; }
export interface ClientInvoice      { id: number; date: string; duedate: string; total: string; status: string; }

/* ─── Admin types ────────────────────────────────────────────────────────── */
export interface AdminStats {
  income_today:     string;
  income_thismonth: string;
  income_thisyear:  string;
  income_alltime:   string;
  signups_today:    number;
  signups_thismonth:number;
  orders_today:     number;
  orders_thismonth: number;
  orders_pending:   number;
  tickets_open:     number;
  tickets_answered: number;
  clients_total:    number;
  clients_active:   number;
}

export interface AdminClient {
  id: number; firstname: string; lastname: string; email: string;
  phonenumber: string; country: string; status: string; datecreated: string;
}
export interface AdminOrder {
  id: number; userid: number; firstname: string; lastname: string;
  amount: string; status: string; date: string; currencycode: string;
}
export interface AdminInvoice {
  id: number; userid: number; firstname: string; lastname: string;
  date: string; duedate: string; total: string; status: string;
}
export interface AdminDomain {
  id: number; userid: number; firstname: string; lastname: string;
  domainname: string; status: string; expirydate: string; registrar: string;
}
export interface AdminHostingAccount {
  id: number; userid: number; firstname: string; lastname: string;
  domain: string; name: string; status: string; nextduedate: string;
  billingcycle: string; amount: string;
}
export interface AdminTicket {
  tid: string; id: number; title: string; firstname: string; lastname: string;
  email: string; status: string; priority: string; date: string; department: string;
}

/* ─── Core ───────────────────────────────────────────────────────────────── */
function getCredentials() {
  return { url: config.whmcsUrl, identifier: config.whmcsIdentifier, secret: config.whmcsSecret };
}

async function callWhmcs(action: string, params: Record<string, string | number | boolean> = {}): Promise<WhmcsRaw> {
  const { url, identifier, secret } = getCredentials();
  console.log("[callWhmcs] action:", action);
  console.log("[callWhmcs] url:", `${url}/includes/api.php`);
  console.log("[callWhmcs] body params:", JSON.stringify(params));
  const body = new URLSearchParams({ identifier, secret, action, responsetype: "json", ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])) });
  const res = await fetch(`${url}/includes/api.php`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: body.toString(), cache: "no-store" });
  if (!res.ok) {
    const errBody = await res.text().catch(() => "(unreadable)");
    console.log("[callWhmcs] non-OK status:", res.status, "body:", errBody.substring(0, 500));
    throw new Error(`WHMCS HTTP error: ${res.status}`);
  }
  const data = (await res.json()) as WhmcsRaw;
  if (data.result === "error") throw new Error(typeof data.message === "string" ? data.message : "WHMCS API error");
  return data;
}

/* ─── Coupon validation ──────────────────────────────────────────────────── */
export interface CouponResult {
  valid:    boolean;
  code:     string;
  type:     "percentage" | "fixed";
  value:    number;
  message:  string;
}

export async function validateCoupon(code: string): Promise<CouponResult> {
  const invalid = (msg: string): CouponResult => ({ valid: false, code, type: "percentage", value: 0, message: msg });
  if (!code.trim()) return invalid("Enter a coupon code");
  try {
    const data = await callWhmcs("GetPromotions", { code: code.trim().toUpperCase() });
    const raw  = data.promotions as { promotion?: Record<string, string>[] } | undefined;
    const promo = raw?.promotion?.[0];
    if (!promo) return invalid("Coupon not found or invalid");
    if (promo.expirationdate && promo.expirationdate !== "0000-00-00" && new Date(promo.expirationdate) < new Date()) {
      return invalid("This coupon has expired");
    }
    if (promo.maxuses && promo.maxuses !== "0" && Number(promo.uses ?? 0) >= Number(promo.maxuses)) {
      return invalid("This coupon has reached its usage limit");
    }
    const type  = String(promo.type ?? "").toLowerCase().includes("percent") ? "percentage" : "fixed";
    const value = parseFloat(String(promo.value ?? "0"));
    return { valid: true, code: code.trim().toUpperCase(), type, value, message: `${value}${type === "percentage" ? "%" : "$"} discount applied` };
  } catch {
    return invalid("Could not validate coupon — please try again");
  }
}

/* ─── TLD price cache ────────────────────────────────────────────────────── */
let tldPriceCache: Record<string, number> | null = null;
async function getTLDPrice(tld: string): Promise<number | null> {
  try {
    if (!tldPriceCache) {
      const data = await callWhmcs("GetTLDPricing", { currencyid: 1 });
      const pricing = data.pricing as Record<string, Record<string, Record<string, string>>>;
      tldPriceCache = {};
      for (const [ext, prices] of Object.entries(pricing ?? {})) { const raw = prices?.register?.["1"]; if (raw != null) tldPriceCache[`.${ext}`] = parseFloat(raw); }
    }
    return tldPriceCache[tld] ?? null;
  } catch { return null; }
}

export interface TLDPriceEntry { register: number | null; renewal: number | null; transfer: number | null; }

export async function getTLDPricing(): Promise<Record<string, TLDPriceEntry>> {
  try {
    const data = await callWhmcs("GetTLDPricing", { currencyid: 1 });
    const pricing = data.pricing as Record<string, Record<string, Record<string, string>>>;
    const result: Record<string, TLDPriceEntry> = {};
    for (const [ext, prices] of Object.entries(pricing ?? {})) {
      result[`.${ext}`] = {
        register: prices?.register?.["1"] != null ? parseFloat(prices.register["1"]) : null,
        renewal:  prices?.renew?.["1"]    != null ? parseFloat(prices.renew["1"])    : null,
        transfer: prices?.transfer?.["1"] != null ? parseFloat(prices.transfer["1"]) : null,
      };
    }
    return result;
  } catch { return {}; }
}

/* ─── Client API ─────────────────────────────────────────────────────────── */
export async function checkDomain(domain: string, tld: string): Promise<DomainCheckResult> {
  const full = `${domain.trim().toLowerCase()}${tld}`;
  const data = await callWhmcs("DomainWhois", { domain: full });
  const available = String(data.status ?? "").toLowerCase() === "available";
  return { available, domain: full, price: available ? await getTLDPrice(tld) : null };
}

export async function getProducts(): Promise<WhmcsProduct[]> {
  const data = await callWhmcs("GetProducts");
  const raw = (data.products as { product: WhmcsRaw[] } | undefined)?.product ?? [];
  return raw.map(p => ({ pid: Number(p.pid ?? 0), name: String(p.name ?? ""), description: String(p.description ?? ""), pricing: (p.pricing as Record<string, unknown>) ?? {}, features: Array.isArray(p.features) ? p.features as string[] : [] }));
}

export async function loginClient(email: string, password: string): Promise<LoginResult> {
  const data = await callWhmcs("ValidateLogin", { email, password2: password });
  const clientId = Number(data.userid ?? 0);
  if (!clientId) throw new Error("Invalid email or password.");
  return {
    clientId,
    passwordHash: String(data.passwordhash ?? ""),
    firstname:    String(data.firstname   ?? ""),
    lastname:     String(data.lastname    ?? ""),
    email:        String(data.email       ?? email),
  };
}

export async function checkEmailExists(email: string): Promise<boolean> {
  try {
    const data = await callWhmcs("GetClients", { search: email.trim().toLowerCase(), limitnum: 1 });
    return Number(data.totalresults ?? 0) > 0;
  } catch { return false; }
}

export async function registerClient(clientData: Record<string, string>): Promise<RegisterResult> {
  const data = await callWhmcs("AddClient", clientData);
  return { clientId: Number(data.clientid ?? 0) };
}

export async function addOrder(clientId: number, items: Record<string, string | number>): Promise<OrderResult> {
  const data = await callWhmcs("AddOrder", { clientid: clientId, paymentmethod: WHMCS_PAYPAL_GATEWAY, ...items });
  return { orderId: Number(data.orderid ?? 0), invoiceId: Number(data.invoiceid ?? 0) };
}

export async function getClientDetails(clientId: number, email?: string): Promise<ClientDetails> {
  const lookup: Record<string, string | number | boolean> = email && !clientId ? { email } : { clientid: clientId };
  const data = await callWhmcs("GetClientsDetails", lookup);
  const c = (data.client ?? data) as Record<string, unknown>;
  return { id: Number(c.id ?? clientId), firstname: String(c.firstname ?? ""), lastname: String(c.lastname ?? ""), email: String(c.email ?? ""), phonenumber: String(c.phonenumber ?? ""), status: String(c.status ?? ""), datecreated: String(c.datecreated ?? "") };
}

export async function getClientProducts(clientId: number): Promise<ClientProduct[]> {
  const data = await callWhmcs("GetClientsProducts", { clientid: clientId });
  const raw = (data.products as { product: WhmcsRaw[] } | undefined)?.product ?? [];
  return raw.map(p => ({ id: Number(p.id ?? 0), name: String(p.name ?? ""), status: String(p.status ?? ""), nextduedate: String(p.nextduedate ?? ""), billingcycle: String(p.billingcycle ?? ""), amount: String(p.recurringamount ?? p.firstpaymentamount ?? "0.00"), domain: String(p.domain ?? "") }));
}

export async function getClientDomains(clientId: number): Promise<ClientDomain[]> {
  try {
    const data = await callWhmcs("GetClientsDomains", { clientid: clientId });
    const raw = (data.domains as { domain: WhmcsRaw[] } | undefined)?.domain ?? [];
    return raw.map(d => ({ id: Number(d.id ?? 0), domainname: String(d.domainname ?? ""), status: String(d.status ?? ""), nextduedate: String(d.nextduedate ?? ""), expirydate: String(d.expirydate ?? ""), autorenew: String(d.donotrenew ?? "0") !== "1" }));
  } catch { return []; }
}

export async function updateDomainAutoRenew(domainId: number, autoRenew: boolean): Promise<void> {
  await callWhmcs("UpdateClientDomain", { domainid: domainId, donotrenew: autoRenew ? 0 : 1 });
}

export async function getInvoices(clientId: number): Promise<ClientInvoice[]> {
  const data = await callWhmcs("GetInvoices", { userid: clientId, limitnum: 50 });
  const raw = (data.invoices as { invoice: WhmcsRaw[] } | undefined)?.invoice ?? [];
  return raw.map(inv => ({ id: Number(inv.id ?? 0), date: String(inv.date ?? ""), duedate: String(inv.duedate ?? ""), total: String(inv.total ?? "0.00"), status: String(inv.status ?? "") }));
}

/* ─── Admin API ──────────────────────────────────────────────────────────── */
export async function getAdminStats(): Promise<AdminStats> {
  const d = await callWhmcs("GetStats");
  return {
    income_today:      String(d.income_today      ?? "0.00"),
    income_thismonth:  String(d.income_thismonth   ?? "0.00"),
    income_thisyear:   String(d.income_thisyear    ?? "0.00"),
    income_alltime:    String(d.income_alltime     ?? "0.00"),
    signups_today:     Number(d.signups_today      ?? 0),
    signups_thismonth: Number(d.signups_thismonth  ?? 0),
    orders_today:      Number(d.orders_today       ?? 0),
    orders_thismonth:  Number(d.orders_thismonth   ?? 0),
    orders_pending:    Number(d.orders_pending     ?? 0),
    tickets_open:      Number(d.tickets_open       ?? 0),
    tickets_answered:  Number(d.tickets_answered   ?? 0),
    clients_total:     Number(d.clients_total      ?? 0),
    clients_active:    Number(d.clients_active     ?? 0),
  };
}

export async function getAdminClients(limitstart = 0, limitnum = 20, search = ""): Promise<{ clients: AdminClient[]; total: number }> {
  const params: Record<string, string | number> = { limitstart, limitnum };
  if (search) params.search = search;
  const data = await callWhmcs("GetClients", params);
  const raw = (data.clients as { client: WhmcsRaw[] } | undefined)?.client ?? [];
  return {
    total: Number(data.totalresults ?? 0),
    clients: raw.map(c => ({ id: Number(c.id ?? 0), firstname: String(c.firstname ?? ""), lastname: String(c.lastname ?? ""), email: String(c.email ?? ""), phonenumber: String(c.phonenumber ?? ""), country: String(c.country ?? ""), status: String(c.status ?? ""), datecreated: String(c.datecreated ?? "") })),
  };
}

export async function getAdminOrders(limitstart = 0, limitnum = 20): Promise<{ orders: AdminOrder[]; total: number }> {
  const data = await callWhmcs("GetOrders", { limitstart, limitnum });
  const raw = (data.orders as { order: WhmcsRaw[] } | undefined)?.order ?? [];
  return {
    total: Number(data.totalresults ?? 0),
    orders: raw.map(o => ({ id: Number(o.id ?? 0), userid: Number(o.userid ?? 0), firstname: String(o.firstname ?? ""), lastname: String(o.lastname ?? ""), amount: String(o.amount ?? "0.00"), status: String(o.status ?? ""), date: String(o.date ?? ""), currencycode: String(o.currencycode ?? "USD") })),
  };
}

export async function getAdminInvoices(status = "", limitstart = 0, limitnum = 20): Promise<{ invoices: AdminInvoice[]; total: number }> {
  const params: Record<string, string | number> = { limitstart, limitnum };
  if (status) params.status = status;
  const data = await callWhmcs("GetInvoices", params);
  const raw = (data.invoices as { invoice: WhmcsRaw[] } | undefined)?.invoice ?? [];
  return {
    total: Number(data.totalresults ?? 0),
    invoices: raw.map(inv => ({ id: Number(inv.id ?? 0), userid: Number(inv.userid ?? 0), firstname: String(inv.firstname ?? ""), lastname: String(inv.lastname ?? ""), date: String(inv.date ?? ""), duedate: String(inv.duedate ?? ""), total: String(inv.total ?? "0.00"), status: String(inv.status ?? "") })),
  };
}

export interface AdminTransaction {
  id: number; userid: number; firstname: string; lastname: string;
  date: string; description: string; amount: string; fees: string;
  gateway: string; transid: string; invoiceid: number;
}

export async function getAdminTransactions(limitstart = 0, limitnum = 50): Promise<{ transactions: AdminTransaction[]; total: number }> {
  const data = await callWhmcs("GetTransactions", { limitstart, limitnum });
  const raw = (data.transactions as { transaction: WhmcsRaw[] } | undefined)?.transaction ?? [];
  return {
    total: Number(data.numreturned ?? raw.length ?? 0),
    transactions: raw.map(t => ({
      id: Number(t.id ?? 0), userid: Number(t.userid ?? 0),
      firstname: String(t.firstname ?? ""), lastname: String(t.lastname ?? ""),
      date: String(t.date ?? ""), description: String(t.description ?? ""),
      amount: String(t.amountin ?? t.amount ?? "0.00"), fees: String(t.fees ?? "0.00"),
      gateway: String(t.gateway ?? ""), transid: String(t.transid ?? ""),
      invoiceid: Number(t.invoiceid ?? 0),
    })),
  };
}

export async function getAdminDomains(limitstart = 0, limitnum = 20): Promise<{ domains: AdminDomain[]; total: number }> {
  const data = await callWhmcs("GetDomains", { limitstart, limitnum });
  const raw = (data.domains as { domain: WhmcsRaw[] } | undefined)?.domain ?? [];
  return {
    total: Number(data.totalresults ?? 0),
    domains: raw.map(d => ({ id: Number(d.id ?? 0), userid: Number(d.userid ?? 0), firstname: String(d.firstname ?? ""), lastname: String(d.lastname ?? ""), domainname: String(d.domainname ?? ""), status: String(d.status ?? ""), expirydate: String(d.expirydate ?? ""), registrar: String(d.registrar ?? "") })),
  };
}

export async function getAdminHosting(limitstart = 0, limitnum = 20): Promise<{ hosting: AdminHostingAccount[]; total: number }> {
  const data = await callWhmcs("GetClientsProducts", { limitstart, limitnum });
  const raw = (data.products as { product: WhmcsRaw[] } | undefined)?.product ?? [];
  return {
    total: Number(data.totalresults ?? 0),
    hosting: raw.map(p => ({ id: Number(p.id ?? 0), userid: Number(p.userid ?? 0), firstname: String(p.firstname ?? ""), lastname: String(p.lastname ?? ""), domain: String(p.domain ?? ""), name: String(p.name ?? ""), status: String(p.status ?? ""), nextduedate: String(p.nextduedate ?? ""), billingcycle: String(p.billingcycle ?? ""), amount: String(p.recurringamount ?? "0.00") })),
  };
}

export async function getAdminTickets(status = "", limitstart = 0, limitnum = 20): Promise<{ tickets: AdminTicket[]; total: number }> {
  const params: Record<string, string | number> = { limitstart, limitnum };
  if (status) params.status = status;
  const data = await callWhmcs("GetTickets", params);
  const raw = (data.tickets as { ticket: WhmcsRaw[] } | undefined)?.ticket ?? [];
  return {
    total: Number(data.totalresults ?? 0),
    tickets: raw.map(t => ({ tid: String(t.tid ?? ""), id: Number(t.id ?? 0), title: String(t.title ?? ""), firstname: String(t.firstname ?? ""), lastname: String(t.lastname ?? ""), email: String(t.email ?? ""), status: String(t.status ?? ""), priority: String(t.priority ?? ""), date: String(t.date ?? ""), department: String(t.deptname ?? "") })),
  };
}

export async function acceptOrder(orderId: number): Promise<void> {
  await callWhmcs("AcceptOrder", { orderid: orderId });
}

export async function cancelOrder(orderId: number): Promise<void> {
  await callWhmcs("CancelOrder", { orderid: orderId });
}

/* ─── Extended client types ──────────────────────────────────────────────── */
export interface ClientOrder {
  id: number; date: string; total: string; status: string; currencycode: string;
}

export interface TicketAttachment { filename: string; index: string; }

export interface TicketReply {
  id: number; userid: number; admin: string; name: string; email: string;
  date: string; message: string; type: "client" | "staff";
  attachments: TicketAttachment[];
}

export interface SupportTicket {
  id: number; tid: string; title: string; status: string;
  priority: string; deptname: string; date: string; lastreply: string;
  replies?: TicketReply[];
}

/* ─── Extended client API ────────────────────────────────────────────────── */
export async function getClientOrders(clientId: number): Promise<ClientOrder[]> {
  try {
    const data = await callWhmcs("GetOrders", { userid: clientId, limitnum: 50 });
    const raw = (data.orders as { order: WhmcsRaw[] } | undefined)?.order ?? [];
    return raw.map(o => ({ id: Number(o.id ?? 0), date: String(o.date ?? ""), total: String(o.amount ?? "0.00"), status: String(o.status ?? ""), currencycode: String(o.currencycode ?? "USD") }));
  } catch { return []; }
}

export async function getTickets(clientId: number): Promise<SupportTicket[]> {
  try {
    console.log("[whmcs.getTickets] calling WHMCS with clientid:", clientId);
    const data = await callWhmcs("GetTickets", { clientid: clientId, limitnum: 50 });
    console.log("[whmcs.getTickets] raw WHMCS response:", JSON.stringify(data).substring(0, 500));
    const ticketData = (data.tickets as { ticket: WhmcsRaw | WhmcsRaw[] } | undefined)?.ticket ?? [];
    const raw = Array.isArray(ticketData) ? ticketData : [ticketData];
    return raw.map(t => ({ id: Number(t.id ?? 0), tid: String(t.tid ?? ""), title: String(t.subject ?? t.title ?? "No Subject"), status: String(t.status ?? ""), priority: String(t.priority ?? ""), deptname: String(t.deptname ?? ""), date: String(t.date ?? ""), lastreply: String(t.lastreply ?? "") }));
  } catch (e) {
    console.log("[whmcs.getTickets] error:", e instanceof Error ? e.message : e);
    return [];
  }
}

export async function getTicket(ticketId: number): Promise<SupportTicket & { replies: TicketReply[]; userid: number }> {
  const data = await callWhmcs("GetTicket", { ticketid: ticketId });
  const replyData = (data.replies as { reply: WhmcsRaw | WhmcsRaw[] } | undefined)?.reply ?? [];
  const raw = Array.isArray(replyData) ? replyData : [replyData];
  const replies: TicketReply[] = raw.map(r => {
    const attData = (r.attachments as { attachment?: WhmcsRaw | WhmcsRaw[] } | undefined)?.attachment;
    const attArr  = attData ? (Array.isArray(attData) ? attData : [attData]) : [];
    const admin   = String(r.admin ?? "");
    // A reply is from staff when it has a non-empty `admin` field, or userid is "0".
    // `userid` alone isn't reliable — WHMCS may echo the ticket-owning client's id on every reply.
    const fromStaff = admin !== "" || String(r.userid ?? "0") === "0";
    return {
      id: Number(r.id ?? 0), userid: Number(r.userid ?? 0), admin,
      name: fromStaff ? (admin || "Support Team") : String(r.name ?? "You"),
      email: String(r.email ?? ""),
      date: String(r.date ?? ""), message: String(r.message ?? ""),
      type: (fromStaff ? "staff" : "client") as "client" | "staff",
      attachments: attArr.map(a => ({ filename: String(a.filename ?? ""), index: String(a.index ?? "0") })),
    };
  });
  // Prepend the original ticket body as the first client message if not already present
  const originalMsg = String(data.message ?? "").trim();
  if (originalMsg && !replies.some(r => r.type === "client" && r.message.trim() === originalMsg)) {
    replies.unshift({
      id: 0, userid: Number(data.userid ?? 0), admin: "",
      name: String(data.name ?? "You"), email: String(data.email ?? ""),
      date: String(data.date ?? ""), message: originalMsg,
      type: "client", attachments: [],
    });
  }
  return { id: Number(data.id ?? 0), tid: String(data.tid ?? ""), title: String(data.subject ?? ""), status: String(data.status ?? ""), priority: String(data.priority ?? ""), deptname: String(data.deptname ?? ""), date: String(data.date ?? ""), lastreply: String(data.lastreply ?? ""), replies, userid: Number(data.userid ?? 0) };
}

function appendAttachmentUrls(message: string, attachmentUrls?: string[]): string {
  if (!attachmentUrls?.length) return message;
  const lines = attachmentUrls.map(url => `\n\n📎 Attachment: ${config.appUrl}${url}`).join("");
  return message + lines;
}

export async function openTicket(params: { clientId: number; subject: string; message: string; deptId: number; priority: string; name?: string; email?: string; attachmentUrls?: string[] }): Promise<{ ticketId: number; tid: string }> {
  const data = await callWhmcs("OpenTicket", {
    clientid: String(params.clientId),
    deptid:   String(params.deptId || 1),
    subject:  params.subject,
    message:  appendAttachmentUrls(params.message, params.attachmentUrls),
    priority: params.priority || "Medium",
    ...(params.name  ? { name:  params.name  } : {}),
    ...(params.email ? { email: params.email } : {}),
  });
  return { ticketId: Number(data.id ?? 0), tid: String(data.tid ?? "") };
}

export async function validateLogin(email: string, password: string): Promise<boolean> {
  try {
    const data = await callWhmcs("ValidateLogin", { email, password2: password });
    console.log("[whmcs.validateLogin] API result for", email, ":", JSON.stringify(data).substring(0, 200));
    if (Number(data.userid ?? 0) > 0) return true;
  } catch (e) {
    console.log("[whmcs.validateLogin] API error for", email, ":", e instanceof Error ? e.message : e);
  }

  // Fallback: the API's view of tblusers isn't reliable on this install — check the
  // bcrypt hash directly. No-op (returns false) unless WHMCS_DB_URL is configured.
  if (!whmcsDbEnabled()) return false;
  try {
    const ok = await validatePasswordDirect(email, password);
    console.log("[whmcs.validateLogin] DB fallback for", email, ":", ok);
    return ok;
  } catch (e) {
    console.log("[whmcs.validateLogin] DB fallback error for", email, ":", e instanceof Error ? e.message : e);
    return false;
  }
}

export async function updateClientPassword(clientId: number, newPassword: string): Promise<void> {
  console.log("[whmcs.updateClientPassword] clientId:", clientId);
  let apiOk = false;
  try {
    const data = await callWhmcs("UpdateClient", { clientid: clientId, password2: newPassword });
    console.log("[whmcs.updateClientPassword] API result:", JSON.stringify(data).substring(0, 200));
    apiOk = true;
  } catch (e) {
    console.log("[whmcs.updateClientPassword] API error:", e instanceof Error ? e.message : e);
  }

  // Fallback: guarantee tblusers actually reflects the new password. Best-effort when
  // the API already succeeded (extra safety net); required when it didn't.
  if (!whmcsDbEnabled()) {
    if (!apiOk) throw new Error("Failed to update password");
    return;
  }
  try {
    const details = await getClientDetails(clientId);
    if (!details.email) throw new Error("Client email not found for DB fallback");
    await updatePasswordDirect(details.email, newPassword);
    console.log("[whmcs.updateClientPassword] DB fallback applied for", details.email);
  } catch (e) {
    console.error("[whmcs.updateClientPassword] DB fallback failed:", e instanceof Error ? e.message : e);
    if (!apiOk) throw new Error("Failed to update password");
  }
}

export async function addTicketReply(ticketId: number, clientId: number, message: string, attachmentUrls?: string[]): Promise<void> {
  await callWhmcs("AddTicketReply", { ticketid: ticketId, clientid: clientId, message: appendAttachmentUrls(message, attachmentUrls) });
}

export async function closeTicket(ticketId: number): Promise<void> {
  await callWhmcs("UpdateTicket", { ticketid: ticketId, status: "Closed" });
}

/* ─── Admin ticket workflow ──────────────────────────────────────────────── */
export async function addAdminTicketReply(ticketId: number, adminName: string, message: string): Promise<void> {
  await callWhmcs("AddTicketReply", { ticketid: ticketId, adminusername: adminName, message });
}

export async function addTicketNote(ticketId: number, adminName: string, message: string): Promise<void> {
  await callWhmcs("AddTicketNote", { ticketid: ticketId, adminusername: adminName, message });
}

export async function updateTicketPriority(ticketId: number, priority: string): Promise<void> {
  await callWhmcs("UpdateTicket", { ticketid: ticketId, priority });
}

export async function updateTicketDepartment(ticketId: number, deptId: number): Promise<void> {
  await callWhmcs("UpdateTicket", { ticketid: ticketId, deptid: deptId });
}

export async function reopenTicket(ticketId: number): Promise<void> {
  await callWhmcs("UpdateTicket", { ticketid: ticketId, status: "Customer-Reply" });
}

export interface TicketDepartment { id: number; name: string }
export async function getTicketDepartments(): Promise<TicketDepartment[]> {
  const data = await callWhmcs("GetSupportDepartments", {});
  const raw = (data.departments as { department: WhmcsRaw[] } | undefined)?.department ?? [];
  return raw.map(d => ({ id: Number(d.id ?? 0), name: String(d.name ?? "") }));
}

export async function updateClientDetails(clientId: number, updates: Record<string, string>): Promise<void> {
  await callWhmcs("UpdateClientDetails", { clientid: clientId, ...updates });
}

/* ─── Admin client management ────────────────────────────────────────────── */
export async function updateClientStatus(clientId: number, status: "Active" | "Inactive"): Promise<void> {
  await callWhmcs("UpdateClient", { clientid: clientId, status });
}

export async function addClientCredit(clientId: number, amount: number, description: string): Promise<void> {
  await callWhmcs("AddCredit", { clientid: clientId, amount, description, notes: description });
}

export async function sendClientEmail(clientId: number, subject: string, message: string): Promise<void> {
  const customvars = Buffer.from(`subject=${subject}&message=${message}`).toString("base64");
  await callWhmcs("SendEmail", { messagename: "General Message", type: "client", id: clientId, customvars });
}

export function getInvoicePDFUrl(invoiceId: number): string {
  return `${config.whmcsUrl}/viewinvoice.php?id=${invoiceId}&download=1`;
}

/** viewinvoice.php requires an active WHMCS clientarea login — a session
 *  separate from this app's own session system, so a client authenticated
 *  here has never actually logged into WHMCS itself and hits its login wall.
 *  Mint a one-time SSO auto-login link (via the same CreateSsoToken flow
 *  createSsoToken() already uses) that logs them in and lands on the
 *  invoice's payment page. Falls back to the bare URL if SSO minting fails
 *  or no clientId is available, so this never regresses below today's link. */
export async function getPaymentUrl(invoiceId: number, clientId?: number): Promise<string> {
  const directUrl = `${config.whmcsUrl}/viewinvoice.php?id=${invoiceId}&paynow=1`;
  if (!clientId) return directUrl;
  try {
    const { redirectUrl } = await createSsoToken(clientId, "clientarea");
    const goto = encodeURIComponent(`/billing/viewinvoice.php?id=${invoiceId}&paynow=1`);
    return `${redirectUrl}${redirectUrl.includes("?") ? "&" : "?"}goto=${goto}`;
  } catch (e) {
    console.error("[getPaymentUrl] SSO token minting failed, falling back to direct invoice URL:", e);
    return directUrl;
  }
}

export async function initiateTransfer(clientId: number, domain: string, authCode: string): Promise<OrderResult> {
  const data = await callWhmcs("AddOrder", {
    clientid:     clientId,
    paymentmethod: WHMCS_PAYPAL_GATEWAY,
    type:          "transfer",
    domain,
    eppcode:       authCode,
    nameserver1:   BSHOP_NAMESERVERS.ns1,
    nameserver2:   BSHOP_NAMESERVERS.ns2,
    nameserver3:   BSHOP_NAMESERVERS.ns3,
    nameserver4:   BSHOP_NAMESERVERS.ns4,
  });
  return { orderId: Number(data.orderid ?? 0), invoiceId: Number(data.invoiceid ?? 0) };
}

export async function addPaymentToInvoice(
  invoiceId:     number,
  amount:        number,
  transactionId: string,
  gateway?:      string,
): Promise<void> {
  await callWhmcs("AddInvoicePayment", {
    invoiceid: invoiceId,
    transid:   transactionId,
    gateway:   gateway ?? "banktransfer",
    amount:    amount.toFixed(2),
    date:      new Date().toISOString().split("T")[0],
  });
}

/** Ad-hoc invoice for a manual renewal request. Not linked to a service (no relid),
 *  so paying it does not itself extend a domain/hosting due date — that still relies
 *  on WHMCS's own auto-generated renewal invoice / registrar automation. */
export async function createInvoice(
  clientId:    number,
  description: string,
  amount:      number,
): Promise<number> {
  const today = new Date().toISOString().split("T")[0];
  const data = await callWhmcs("CreateInvoice", {
    userid:           clientId,
    date:             today,
    duedate:          today,
    itemdescription1: description,
    itemamount1:      amount.toFixed(2),
  });
  return Number(data.invoiceid ?? 0);
}

/* ─── PawaPay automated order creation ───────────────────────────────────── */
// PawaPay gateway setup in WHMCS:
//   Admin → Setup → Payment Gateways → Manage Existing Gateways
//   Add "Bank Transfer" or a custom "pawapay" module.
//   Set WHMCS_PAWAPAY_GATEWAY env var to match the gateway module name (default: "banktransfer").

interface CartItemLike { type: string; [key: string]: unknown; }

export interface PawapayOrderResult {
  orderId:     number;
  invoiceId:   number;
  allOrderIds: number[]; // includes secondary orders (WB, transfer)
}

export async function createPawapayOrder(
  clientId:  number,
  cartItems: CartItemLike[],
): Promise<PawapayOrderResult> {
  const baseParams = { clientid: clientId, paymentmethod: WHMCS_PAWAPAY_GATEWAY };

  const domain   = cartItems.find(i => i.type === "domain");
  const hosting  = cartItems.find(i => i.type === "hosting");
  const transfer = cartItems.find(i => i.type === "transfer");
  const wb       = cartItems.find(i => i.type === "website_builder");

  // ── Build main order params ──────────────────────────────────────────────
  const mainParams: Record<string, string | number | boolean> = { ...baseParams };

  if (hosting) {
    // Hosting product (+ optional domain registration bundled)
    mainParams.pid          = (hosting.planId as number | undefined) ?? 1;
    mainParams.billingcycle = (hosting.cycle as string) === "monthly" ? "monthly" : "annually";
    if (domain) {
      mainParams.domain      = domain.domain as string;
      mainParams.domaintype  = "register";
      mainParams.regperiod   = 1;
      mainParams.nameserver1 = BSHOP_NAMESERVERS.ns1;
      mainParams.nameserver2 = BSHOP_NAMESERVERS.ns2;
      mainParams.nameserver3 = BSHOP_NAMESERVERS.ns3;
      mainParams.nameserver4 = BSHOP_NAMESERVERS.ns4;
    }
  } else if (domain) {
    // Domain-only registration
    mainParams.domain      = domain.domain as string;
    mainParams.domaintype  = "register";
    mainParams.regperiod   = 1;
    mainParams.nameserver1 = BSHOP_NAMESERVERS.ns1;
    mainParams.nameserver2 = BSHOP_NAMESERVERS.ns2;
    mainParams.nameserver3 = BSHOP_NAMESERVERS.ns3;
    mainParams.nameserver4 = BSHOP_NAMESERVERS.ns4;
  } else if (wb) {
    // Website builder product only
    mainParams.pid          = wb.productId as number;
    mainParams.billingcycle = "monthly";
  } else if (transfer) {
    // Transfer only (no other items)
    mainParams.domain      = transfer.domain as string;
    mainParams.domaintype  = "transfer";
    mainParams.eppcode     = transfer.authCode as string;
    mainParams.nameserver1 = BSHOP_NAMESERVERS.ns1;
    mainParams.nameserver2 = BSHOP_NAMESERVERS.ns2;
    mainParams.nameserver3 = BSHOP_NAMESERVERS.ns3;
    mainParams.nameserver4 = BSHOP_NAMESERVERS.ns4;
  }

  const mainData  = await callWhmcs("AddOrder", mainParams);
  const orderId   = Number(mainData.orderid   ?? 0);
  const invoiceId = Number(mainData.invoiceid ?? 0);
  const allOrderIds: number[] = [orderId];

  // ── Secondary: website builder (if main order was hosting/domain) ────────
  if (wb && (hosting || domain)) {
    try {
      const d = await callWhmcs("AddOrder", {
        ...baseParams,
        pid:          wb.productId as number,
        billingcycle: "monthly",
      });
      allOrderIds.push(Number(d.orderid ?? 0));
    } catch (e) { console.error("[createPawapayOrder] WB order failed:", e); }
  }

  // ── Secondary: transfer (if main order was something else) ───────────────
  if (transfer && (hosting || domain || wb)) {
    try {
      const d = await callWhmcs("AddOrder", {
        ...baseParams,
        domain:      transfer.domain as string,
        domaintype:  "transfer",
        eppcode:     transfer.authCode as string,
        nameserver1: BSHOP_NAMESERVERS.ns1,
        nameserver2: BSHOP_NAMESERVERS.ns2,
        nameserver3: BSHOP_NAMESERVERS.ns3,
        nameserver4: BSHOP_NAMESERVERS.ns4,
      });
      allOrderIds.push(Number(d.orderid ?? 0));
    } catch (e) { console.error("[createPawapayOrder] transfer order failed:", e); }
  }

  return { orderId, invoiceId, allOrderIds };
}

/* ─── PayPal order creation ──────────────────────────────────────────────── */
export async function createPaypalOrder(
  clientId:  number,
  cartItems: CartItemLike[],
): Promise<PawapayOrderResult> {
  const baseParams = { clientid: clientId, paymentmethod: WHMCS_PAYPAL_GATEWAY };

  const domain   = cartItems.find(i => i.type === "domain");
  const hosting  = cartItems.find(i => i.type === "hosting");
  const transfer = cartItems.find(i => i.type === "transfer");
  const wb       = cartItems.find(i => i.type === "website_builder");

  const mainParams: Record<string, string | number | boolean> = { ...baseParams };

  if (hosting) {
    mainParams.pid          = (hosting.planId as number | undefined) ?? 1;
    mainParams.billingcycle = (hosting.cycle as string) === "monthly" ? "monthly" : "annually";
    if (domain) {
      mainParams.domain      = domain.domain as string;
      mainParams.domaintype  = "register";
      mainParams.regperiod   = 1;
      mainParams.nameserver1 = BSHOP_NAMESERVERS.ns1;
      mainParams.nameserver2 = BSHOP_NAMESERVERS.ns2;
      mainParams.nameserver3 = BSHOP_NAMESERVERS.ns3;
      mainParams.nameserver4 = BSHOP_NAMESERVERS.ns4;
    }
  } else if (domain) {
    mainParams.domain      = domain.domain as string;
    mainParams.domaintype  = "register";
    mainParams.regperiod   = 1;
    mainParams.nameserver1 = BSHOP_NAMESERVERS.ns1;
    mainParams.nameserver2 = BSHOP_NAMESERVERS.ns2;
    mainParams.nameserver3 = BSHOP_NAMESERVERS.ns3;
    mainParams.nameserver4 = BSHOP_NAMESERVERS.ns4;
  } else if (wb) {
    mainParams.pid          = wb.productId as number;
    mainParams.billingcycle = "monthly";
  } else if (transfer) {
    mainParams.domain      = transfer.domain as string;
    mainParams.domaintype  = "transfer";
    mainParams.eppcode     = transfer.authCode as string;
    mainParams.nameserver1 = BSHOP_NAMESERVERS.ns1;
    mainParams.nameserver2 = BSHOP_NAMESERVERS.ns2;
    mainParams.nameserver3 = BSHOP_NAMESERVERS.ns3;
    mainParams.nameserver4 = BSHOP_NAMESERVERS.ns4;
  }

  const mainData  = await callWhmcs("AddOrder", mainParams);
  const orderId   = Number(mainData.orderid   ?? 0);
  const invoiceId = Number(mainData.invoiceid ?? 0);
  const allOrderIds: number[] = [orderId];

  if (wb && (hosting || domain)) {
    try {
      const d = await callWhmcs("AddOrder", { ...baseParams, pid: wb.productId as number, billingcycle: "monthly" });
      allOrderIds.push(Number(d.orderid ?? 0));
    } catch (e) { console.error("[createPaypalOrder] WB order failed:", e); }
  }
  if (transfer && (hosting || domain || wb)) {
    try {
      const d = await callWhmcs("AddOrder", {
        ...baseParams,
        domain: transfer.domain as string, domaintype: "transfer",
        eppcode: transfer.authCode as string,
        nameserver1: BSHOP_NAMESERVERS.ns1, nameserver2: BSHOP_NAMESERVERS.ns2,
        nameserver3: BSHOP_NAMESERVERS.ns3, nameserver4: BSHOP_NAMESERVERS.ns4,
      });
      allOrderIds.push(Number(d.orderid ?? 0));
    } catch (e) { console.error("[createPaypalOrder] transfer order failed:", e); }
  }

  return { orderId, invoiceId, allOrderIds };
}

/* ─── Invoice lookup ─────────────────────────────────────────────────────── */
export interface InvoiceItem    { description: string; amount: string; }
export interface InvoiceDetails {
  id: number; userid: number; status: string; date: string; duedate: string;
  total: string; subtotal: string; items: InvoiceItem[];
}

export async function getInvoice(invoiceId: number): Promise<InvoiceDetails> {
  const data  = await callWhmcs("GetInvoice", { invoiceid: invoiceId });
  const raw   = (data.items as { item: Record<string, unknown>[] } | undefined)?.item ?? [];
  const items = raw.map(i => ({ description: String(i.description ?? ""), amount: String(i.amount ?? "0.00") }));
  return {
    id:       Number(data.invoiceid ?? 0),
    userid:   Number(data.userid ?? 0),
    status:   String(data.status   ?? ""),
    date:     String(data.date     ?? ""),
    duedate:  String(data.duedate  ?? ""),
    total:    String(data.total    ?? "0.00"),
    subtotal: String(data.subtotal ?? "0.00"),
    items,
  };
}

/* ─── Domain nameservers & lock status ──────────────────────────────────── */
export interface DomainNameservers { ns1: string; ns2: string; ns3: string; ns4: string; ns5: string; }

export async function getDomainNameservers(domainId: number): Promise<DomainNameservers> {
  const data = await callWhmcs("DomainGetNameservers", { domainid: domainId });
  return {
    ns1: String(data.ns1 ?? ""), ns2: String(data.ns2 ?? ""), ns3: String(data.ns3 ?? ""),
    ns4: String(data.ns4 ?? ""), ns5: String(data.ns5 ?? ""),
  };
}

export async function updateDomainNameservers(domainId: number, ns: Partial<DomainNameservers>): Promise<void> {
  await callWhmcs("DomainUpdateNameservers", { domainid: domainId, ...ns });
}

export async function getDomainLockingStatus(domainId: number): Promise<boolean> {
  const data = await callWhmcs("DomainGetLockingStatus", { domainid: domainId });
  return Boolean(data.locked);
}

export async function updateDomainLockingStatus(domainId: number, locked: boolean): Promise<void> {
  await callWhmcs("DomainUpdateLockingStatus", { domainid: domainId, lockenabled: locked });
}

export async function resetClientPassword(email: string): Promise<void> {
  await callWhmcs("ResetPassword", { email });
}

export async function addAnnouncement(subject: string, message: string): Promise<void> {
  await callWhmcs("AddAnnouncement", { subject, message, published: 1 });
}

export interface SsoTokenResult { redirectUrl: string; }

export async function createSsoToken(clientId: number, destination = "clientarea", serviceId?: number): Promise<SsoTokenResult> {
  // WHMCS's destination keywords are fixed strings (e.g. "clientarea:product_details") — it does NOT
  // accept an embedded id like "clientarea:product_details:id=5". To deep-link into a specific
  // service/domain, pass the id via the separate service_id param. Verified against the live API:
  // "clientarea:product_details:id=5" -> {"result":"error","message":"Invalid destination"}
  // "clientarea:product_details" + service_id=5 -> redirects to clientarea.php?action=productdetails&id=5
  const params: Record<string, string | number> = { client_id: clientId, destination };
  if (serviceId) params.service_id = serviceId;
  const data = await callWhmcs("CreateSsoToken", params);
  const redirectUrl = String(data.redirect_url ?? data.token_url ?? "");
  if (!redirectUrl) throw new Error("WHMCS did not return a redirect URL");
  return { redirectUrl };
}

/* ─── Impersonation tokens (short-lived, single-use, HMAC-signed) ───────── */
const IMPERSONATE_TTL_MS = 5 * 60 * 1000;

// Process-level singleton so issued tokens can't be redeemed twice.
declare global {
  // eslint-disable-next-line no-var
  var __bshopUsedImpersonateTokens: Set<string> | undefined;
}
const usedImpersonateTokens: Set<string> =
  globalThis.__bshopUsedImpersonateTokens ?? (globalThis.__bshopUsedImpersonateTokens = new Set<string>());

function pruneExpiredImpersonateTokens(): void {
  const cutoff = Date.now() - IMPERSONATE_TTL_MS;
  for (const t of usedImpersonateTokens) {
    const ts = Number(t.split(".")[0]);
    if (!Number.isFinite(ts) || ts < cutoff) usedImpersonateTokens.delete(t);
  }
}

export interface ImpersonateToken { token: string; expires: number; }

export function generateImpersonateToken(clientId: number): ImpersonateToken {
  const timestamp = Date.now();
  const signature = crypto
    .createHmac("sha256", config.adminPassword)
    .update(`${clientId}:${timestamp}`)
    .digest("hex");
  return { token: `${timestamp}.${signature}`, expires: timestamp + IMPERSONATE_TTL_MS };
}

export function verifyImpersonateToken(clientId: number, token: string): boolean {
  pruneExpiredImpersonateTokens();

  const [timestampStr, signature] = token.split(".");
  if (!timestampStr || !signature) return false;

  const timestamp = Number(timestampStr);
  if (!Number.isFinite(timestamp) || timestamp > Date.now() || Date.now() - timestamp > IMPERSONATE_TTL_MS) return false;

  const expected = crypto
    .createHmac("sha256", config.adminPassword)
    .update(`${clientId}:${timestamp}`)
    .digest("hex");

  const sigBuf = Buffer.from(signature, "hex");
  const expBuf = Buffer.from(expected, "hex");
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return false;

  if (usedImpersonateTokens.has(token)) return false; // single-use
  usedImpersonateTokens.add(token);
  return true;
}

export function generateAutoAuthUrl(email: string, destination = "clientarea.php"): string {
  const whmcsUrl     = config.whmcsUrl;
  const autoAuthKey  = process.env.WHMCS_AUTOAUTH_KEY ?? "";
  const timestamp    = Math.floor(Date.now() / 1000);
  const hash         = crypto.createHash("sha1").update(email + timestamp + autoAuthKey).digest("hex");
  return `${whmcsUrl}/dologin.php?email=${encodeURIComponent(email)}&timestamp=${timestamp}&hash=${hash}&goto=${encodeURIComponent(destination)}`;
}
