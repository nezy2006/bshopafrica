// Server-only — never import this from client components.

type WhmcsRaw = Record<string, unknown>;

/* ─── Client-facing types ────────────────────────────────────────────────── */
export interface DomainCheckResult  { available: boolean; domain: string; price: number | null; }
export interface WhmcsProduct       { pid: number; name: string; description: string; pricing: Record<string, unknown>; features: string[]; }
export interface LoginResult        { clientId: number; passwordHash: string; }
export interface RegisterResult     { clientId: number; }
export interface OrderResult        { orderId: number; invoiceId: number; }
export interface ClientDetails      { id: number; firstname: string; lastname: string; email: string; phonenumber: string; status: string; datecreated: string; }
export interface ClientProduct      { id: number; name: string; status: string; nextduedate: string; billingcycle: string; amount: string; domain: string; }
export interface ClientDomain       { id: number; domainname: string; status: string; nextduedate: string; expirydate: string; }
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
  const url = process.env.WHMCS_URL; const identifier = process.env.WHMCS_IDENTIFIER; const secret = process.env.WHMCS_SECRET;
  if (!url || !identifier || !secret) throw new Error("WHMCS not configured — add WHMCS_URL, WHMCS_IDENTIFIER, WHMCS_SECRET to .env.local");
  return { url, identifier, secret };
}

async function callWhmcs(action: string, params: Record<string, string | number | boolean> = {}): Promise<WhmcsRaw> {
  const { url, identifier, secret } = getCredentials();
  const body = new URLSearchParams({ identifier, secret, action, responsetype: "json", ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])) });
  const res = await fetch(`${url}/includes/api.php`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: body.toString(), cache: "no-store" });
  if (!res.ok) throw new Error(`WHMCS HTTP error: ${res.status}`);
  const data = (await res.json()) as WhmcsRaw;
  if (data.result === "error") throw new Error(typeof data.message === "string" ? data.message : "WHMCS API error");
  return data;
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
  if (!clientId) throw new Error("Authentication failed");
  return { clientId, passwordHash: String(data.passwordhash ?? "") };
}

export async function registerClient(clientData: Record<string, string>): Promise<RegisterResult> {
  const data = await callWhmcs("AddClient", clientData);
  return { clientId: Number(data.clientid ?? 0) };
}

export async function addOrder(clientId: number, items: Record<string, string | number>): Promise<OrderResult> {
  const data = await callWhmcs("AddOrder", { clientid: clientId, paymentmethod: "paypal", ...items });
  return { orderId: Number(data.orderid ?? 0), invoiceId: Number(data.invoiceid ?? 0) };
}

export async function getClientDetails(clientId: number): Promise<ClientDetails> {
  const data = await callWhmcs("GetClientsDetails", { clientid: clientId });
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
    return raw.map(d => ({ id: Number(d.id ?? 0), domainname: String(d.domainname ?? ""), status: String(d.status ?? ""), nextduedate: String(d.nextduedate ?? ""), expirydate: String(d.expirydate ?? "") }));
  } catch { return []; }
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
