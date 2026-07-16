import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isAdminUnauthorized } from "@/lib/admin-auth";
import { getAdminTransactions } from "@/lib/whmcs";
import { getPawapayTransactions } from "@/lib/pawapay-transactions";

export interface UnifiedTransaction {
  id:          string;
  date:        string;
  clientName:  string;
  clientEmail: string;
  amountUSD:   number;
  amountLocal: number | null;
  currency:    string;
  method:      "PayPal" | "MTN Mobile Money" | "Airtel Money" | "Mobile Money" | "Other";
  status:      string;
  reference:   string;
  invoiceId:   number | null;
}

function providerToMethod(provider: string | null): UnifiedTransaction["method"] {
  if (!provider) return "Mobile Money";
  if (provider.startsWith("MTN")) return "MTN Mobile Money";
  if (provider.startsWith("AIRTEL")) return "Airtel Money";
  return "Mobile Money";
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req, "invoices");
  if (isAdminUnauthorized(admin)) return admin;

  const [whmcs, pawapay] = await Promise.all([
    getAdminTransactions(0, 200).catch(() => ({ transactions: [], total: 0 })),
    getPawapayTransactions(200).catch(() => []),
  ]);

  const paypalTxns: UnifiedTransaction[] = whmcs.transactions
    .filter(t => /paypal/i.test(t.gateway))
    .map(t => ({
      id: `whmcs-${t.id}`, date: t.date, clientName: `${t.firstname} ${t.lastname}`.trim(),
      clientEmail: "", amountUSD: Number(t.amount) || 0, amountLocal: null, currency: "USD",
      method: "PayPal", status: "Completed", reference: t.transid, invoiceId: t.invoiceid || null,
    }));

  const pawapayTxns: UnifiedTransaction[] = pawapay.map(t => ({
    id: `pawapay-${t.deposit_id}`, date: t.created_at, clientName: t.client_email ?? "—",
    clientEmail: t.client_email ?? "", amountUSD: Number(t.amount_usd) || 0,
    amountLocal: Number(t.amount_local) || 0, currency: t.currency,
    method: providerToMethod(t.provider), status: t.status, reference: t.deposit_id,
    invoiceId: t.invoice_id,
  }));

  const merged = [...paypalTxns, ...pawapayTxns].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return NextResponse.json({ success: true, data: merged });
}
