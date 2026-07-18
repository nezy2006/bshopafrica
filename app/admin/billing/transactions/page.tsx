"use client";
import { Download, CreditCard } from "lucide-react";

import { useState, useEffect, useMemo } from "react";
import { SearchBar, TableCard, THead, SkeletonRows, Badge, EmptyState } from "@/lib/admin-utils";
import { adminHeaders } from "@/lib/admin-auth-client";
import type { UnifiedTransaction } from "@/app/api/admin/transactions/route";

const METHODS = ["", "PayPal", "MTN Mobile Money", "Airtel Money"];

export default function TransactionsPage() {
  const [txns,    setTxns]    = useState<UnifiedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [method,  setMethod]  = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo,   setDateTo]   = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res  = await fetch("/api/admin/transactions", { headers: adminHeaders() });
        const json = await res.json() as { success: boolean; data?: UnifiedTransaction[] };
        if (json.success && json.data) setTxns(json.data);
      } catch { /* offline */ }
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    let f = txns;
    if (method) f = f.filter(t => t.method === method);
    if (search) { const q = search.toLowerCase(); f = f.filter(t => t.clientName.toLowerCase().includes(q) || t.reference.toLowerCase().includes(q)); }
    if (dateFrom) f = f.filter(t => new Date(t.date) >= new Date(dateFrom));
    if (dateTo) f = f.filter(t => new Date(t.date) <= new Date(`${dateTo}T23:59:59`));
    return f;
  }, [txns, method, search, dateFrom, dateTo]);

  const exportCsv = () => {
    const header = "Date,Client,Email,Amount USD,Amount Local,Currency,Method,Status,Reference,Invoice ID";
    const rows = filtered.map(t => [t.date, t.clientName, t.clientEmail, t.amountUSD, t.amountLocal ?? "", t.currency, t.method, t.status, t.reference, t.invoiceId ?? ""].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));
    const csv = [header, ...rows].join("\n");
    const a = document.createElement("a");
    a.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
    a.download = "transactions.csv";
    a.click();
  };

  return (
    <>
      <SearchBar value={search} onChange={setSearch} placeholder="Search by client or reference…">
        <select value={method} onChange={e => setMethod(e.target.value)}
          className="px-3 py-2.5 text-sm border-2 border-gray-200 rounded-xl bg-white outline-none focus:border-[#6B21A8] cursor-pointer">
          {METHODS.map(m => <option key={m} value={m}>{m || "All methods"}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} title="From date" className="px-3 py-2.5 text-sm border-2 border-gray-200 rounded-xl bg-white outline-none focus:border-[#6B21A8]" />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} title="To date" className="px-3 py-2.5 text-sm border-2 border-gray-200 rounded-xl bg-white outline-none focus:border-[#6B21A8]" />
        <button onClick={exportCsv} className="flex items-center gap-1.5 px-4 py-2.5 border-2 border-[#6B21A8] text-[#6B21A8] text-sm font-bold rounded-xl hover:bg-purple-50 transition-colors">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </SearchBar>

      <TableCard>
        <THead cols={["Date", "Client", "Amount", "Method", "Status", "Reference"]} />
        <tbody>
          {loading ? <SkeletonRows cols={6} /> : filtered.length === 0 ? <EmptyState icon={<CreditCard className="w-5 h-5" />} message="No transactions found" /> : filtered.map(t => (
            <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <td className="px-5 py-3.5 text-gray-400 text-xs whitespace-nowrap">{new Date(t.date).toLocaleString()}</td>
              <td className="px-5 py-3.5 font-medium text-black">{t.clientName}</td>
              <td className="px-5 py-3.5 font-bold text-black whitespace-nowrap">
                ${t.amountUSD.toFixed(2)}{t.amountLocal ? <span className="text-gray-400 font-normal"> · {t.currency} {t.amountLocal.toLocaleString()}</span> : null}
              </td>
              <td className="px-5 py-3.5 text-gray-600">{t.method}</td>
              <td className="px-5 py-3.5"><Badge status={t.status} /></td>
              <td className="px-5 py-3.5 text-gray-400 text-xs font-mono">{t.reference}</td>
            </tr>
          ))}
        </tbody>
      </TableCard>
    </>
  );
}
