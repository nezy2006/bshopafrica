// Server-only — never import this from client components.
// Direct PayPal Orders v2 integration: the app never redirects to WHMCS for
// PayPal payments. WHMCS still owns the invoice; we capture the payment via
// PayPal's API on our own site, then call AddInvoicePayment to mark it paid.

import { config } from "@/lib/config";

const PAYPAL_API_BASE =
  config.paypalEnvironment === "sandbox"
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";

interface CachedToken { token: string; expiresAt: number; }
let cachedToken: CachedToken | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.token;

  const auth = Buffer.from(`${config.paypalClientId}:${config.paypalClientSecret}`).toString("base64");
  const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method:  "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body:    "grant_type=client_credentials",
    cache:   "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "(unreadable)");
    throw new Error(`PayPal auth failed: ${res.status} ${text.substring(0, 300)}`);
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { token: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 };
  return data.access_token;
}

/** Creates a PayPal order for the given invoice's amount. Does not set PayPal's
 *  own `invoice_id` field — that field enforces uniqueness on PayPal's side and
 *  would reject a retry after a cancelled/failed attempt on the same invoice. */
export async function createPaypalOrderForInvoice(invoiceId: number, amountUSD: number): Promise<string> {
  const token = await getAccessToken();
  const res = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
    method:  "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [{
        reference_id: String(invoiceId),
        amount: { currency_code: "USD", value: amountUSD.toFixed(2) },
      }],
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "(unreadable)");
    throw new Error(`PayPal order creation failed: ${res.status} ${text.substring(0, 300)}`);
  }
  const data = (await res.json()) as { id: string };
  return data.id;
}

export interface PaypalCaptureResult { captureId: string; amount: string; status: string; referenceId: string; }

export async function capturePaypalOrder(orderId: string): Promise<PaypalCaptureResult> {
  const token = await getAccessToken();
  const res = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method:  "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    cache:   "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as {
    status?: string;
    purchase_units?: { reference_id?: string; payments?: { captures?: { id: string; amount?: { value: string } }[] } }[];
  };
  if (!res.ok) throw new Error(`PayPal capture failed: ${res.status} ${JSON.stringify(data).substring(0, 300)}`);

  const unit    = data.purchase_units?.[0];
  const capture = unit?.payments?.captures?.[0];
  if (data.status !== "COMPLETED" || !capture) {
    throw new Error(`PayPal capture did not complete (status: ${data.status ?? "unknown"})`);
  }
  return { captureId: capture.id, amount: capture.amount?.value ?? "0.00", status: data.status, referenceId: unit?.reference_id ?? "" };
}
