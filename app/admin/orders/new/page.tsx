"use client";
import { ArrowLeft, Search, X } from "lucide-react";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { whmcsAdmin, PageHeader } from "@/lib/admin-utils";
import type { AdminClient, WhmcsProduct, PaymentMethod } from "@/lib/whmcs";

const INPUT = "w-full px-3.5 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm text-black outline-none focus:border-[#6B21A8] focus:bg-white transition-all";

type ItemType = "hosting" | "domain" | "addon";

export default function NewOrderPage() {
  const router = useRouter();
  const [clientQuery, setClientQuery] = useState("");
  const [clientResults, setClientResults] = useState<AdminClient[]>([]);
  const [client, setClient] = useState<AdminClient | null>(null);

  const [products, setProducts] = useState<WhmcsProduct[]>([]);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);

  const [includeHosting, setIncludeHosting] = useState(false);
  const [productId, setProductId] = useState<number | null>(null);
  const [cycle, setCycle] = useState<"monthly" | "annually">("annually");

  const [includeDomain, setIncludeDomain] = useState(false);
  const [domain, setDomain] = useState("");

  const [gateway, setGateway] = useState("paypal");
  const [promoCode, setPromoCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    whmcsAdmin<WhmcsProduct[]>("getProducts").then(p => setProducts(p ?? []));
    whmcsAdmin<PaymentMethod[]>("adminGetPaymentMethods").then(m => setMethods(m ?? []));
  }, []);

  const searchClients = useCallback(async (q: string) => {
    setClientQuery(q);
    if (q.trim().length < 2) { setClientResults([]); return; }
    const res = await whmcsAdmin<{ clients: AdminClient[]; total: number }>("adminGetClients", { search: q, limitnum: 8 });
    setClientResults(res?.clients ?? []);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!client) { setError("Select a client first."); return; }
    const items: Record<string, unknown>[] = [];
    if (includeHosting) {
      if (!productId) { setError("Choose a hosting product."); return; }
      items.push({ type: "hosting", planId: productId, cycle });
    }
    if (includeDomain) {
      if (!domain.trim()) { setError("Enter a domain name."); return; }
      items.push({ type: "domain", domain: domain.trim().toLowerCase() });
    }
    if (items.length === 0) { setError("Add at least one item to the order."); return; }

    setBusy(true);
    const res = await whmcsAdmin<{ orderId: number; invoiceId: number }>("adminCreateOrder", {
      clientId: client.id, items, gateway, promoCode: promoCode || undefined,
    });
    setBusy(false);
    if (!res) { setError("Order creation failed — check the server log for the WHMCS error."); return; }
    router.push("/admin/orders");
  };

  return (
    <div className="max-w-2xl">
      <button onClick={() => router.push("/admin/orders")} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to orders
      </button>
      <PageHeader title="New Order" subtitle="Create an order manually on behalf of a client" />

      <form onSubmit={submit} className="space-y-6">
        {/* Client picker */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-black text-sm mb-3">Client</h2>
          {client ? (
            <div className="flex items-center justify-between bg-purple-50 rounded-xl px-4 py-3">
              <div><p className="font-semibold text-black">{client.firstname} {client.lastname}</p><p className="text-xs text-gray-500">{client.email}</p></div>
              <button type="button" onClick={() => setClient(null)} className="text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
            </div>
          ) : (
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={clientQuery} onChange={e => searchClients(e.target.value)} placeholder="Search by name or email…" className={`${INPUT} pl-9`} />
              {clientResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden">
                  {clientResults.map(c => (
                    <button type="button" key={c.id} onClick={() => { setClient(c); setClientResults([]); }} className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm">
                      <span className="font-medium text-black">{c.firstname} {c.lastname}</span> <span className="text-gray-400 text-xs">{c.email}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Items */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-bold text-black text-sm">Items</h2>

          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <input type="checkbox" checked={includeHosting} onChange={e => setIncludeHosting(e.target.checked)} className="accent-[#6B21A8]" /> Hosting Package
          </label>
          {includeHosting && (
            <div className="grid grid-cols-2 gap-3 pl-6">
              <select value={productId ?? ""} onChange={e => setProductId(Number(e.target.value) || null)} className={INPUT}>
                <option value="">Select product…</option>
                {products.map(p => <option key={p.pid} value={p.pid}>{p.name}</option>)}
              </select>
              <select value={cycle} onChange={e => setCycle(e.target.value as "monthly" | "annually")} className={INPUT}>
                <option value="annually">Annually</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <input type="checkbox" checked={includeDomain} onChange={e => setIncludeDomain(e.target.checked)} className="accent-[#6B21A8]" /> Domain Registration
          </label>
          {includeDomain && (
            <div className="pl-6">
              <input value={domain} onChange={e => setDomain(e.target.value)} placeholder="example.com" className={INPUT} />
            </div>
          )}
        </div>

        {/* Payment + promo */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-bold text-black text-sm">Payment</h2>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Payment Method</label>
            <select value={gateway} onChange={e => setGateway(e.target.value)} className={INPUT}>
              <option value="paypal">PayPal</option>
              <option value="pawapay">Mobile Money (MTN/Airtel)</option>
              {methods.filter(m => m.module !== "paypal").map(m => <option key={m.module} value={m.module}>{m.displayname}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Promo Code (optional)</label>
            <input value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())} className={INPUT} />
          </div>
        </div>

        {error && <p className="text-sm text-red-600 font-semibold">{error}</p>}

        <button type="submit" disabled={busy} className="w-full py-3.5 bg-[#6B21A8] text-white font-bold rounded-xl hover:bg-[#581c87] transition-all disabled:opacity-60">
          {busy ? "Creating order…" : "Create Order"}
        </button>
      </form>
    </div>
  );
}
