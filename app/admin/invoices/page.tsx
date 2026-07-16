"use client";
import { Receipt, Download, CreditCard } from "lucide-react";

import { useState, useEffect, useCallback, useMemo } from "react";
import { whmcsAdmin, PageHeader, SearchBar, TableCard, THead, SkeletonRows, Badge, Pagination, EmptyState } from "@/lib/admin-utils";
import { adminHeaders } from "@/lib/admin-auth-client";
import type { AdminInvoice } from "@/lib/whmcs";
import type { UnifiedTransaction } from "@/app/api/admin/transactions/route";

const PER = 20;
const STATUSES = ["", "Paid", "Unpaid", "Overdue", "Draft", "Cancelled"];
const METHODS = ["", "PayPal", "MTN Mobile Money", "Airtel Money"];

function InvoicesTab() {
  const [invoices, setInvoices] = useState<AdminInvoice[]>([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [search,   setSearch]   = useState("");
  const [status,   setStatus]   = useState("");
  const [loading,  setLoading]  = useState(true);
  const [busyId,   setBusyId]   = useState<number | null>(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const res = await whmcsAdmin<{ invoices: AdminInvoice[]; total: number }>(
      "adminGetInvoices", { status, limitstart: (page - 1) * PER, limitnum: PER }
    );
    if (res) { setInvoices(res.invoices); setTotal(res.total); }
    setLoading(false);
  }, [page, status]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const markPaid = async (inv: AdminInvoice) => {
    if (!confirm(`Mark invoice #${inv.id} ($${inv.total}) as paid?`)) return;
    setBusyId(inv.id);
    await whmcsAdmin("addPayment", { invoiceId: inv.id, amount: Number(inv.total), transactionId: `manual-${Date.now()}` });
    setBusyId(null);
    fetch_();
  };

  const filtered = search
    ? invoices.filter(i => `${i.firstname} ${i.lastname} ${i.id}`.toLowerCase().includes(search.toLowerCase()))
    : invoices;

  return (
    <>
      <SearchBar value={search} onChange={setSearch} placeholder="Search by client name or invoice #…">
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="px-3 py-2.5 text-sm border-2 border-gray-200 rounded-xl bg-white outline-none focus:border-[#6B21A8] cursor-pointer">
          {STATUSES.map(s => <option key={s} value={s}>{s || "All statuses"}</option>)}
        </select>
      </SearchBar>

      <TableCard>
        <THead cols={["Invoice #", "Client", "Date", "Due Date", "Total", "Status", "Actions"]} />
        <tbody>
          {loading ? <SkeletonRows cols={7} /> : filtered.length === 0 ? <EmptyState icon={<Receipt className="w-5 h-5" />} message="No invoices found" /> : filtered.map(inv => (
            <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <td className="px-5 py-3.5 font-bold text-[#6B21A8]">#{inv.id}</td>
              <td className="px-5 py-3.5 font-medium text-black">{inv.firstname} {inv.lastname}</td>
              <td className="px-5 py-3.5 text-gray-500">{inv.date}</td>
              <td className="px-5 py-3.5 text-gray-500">{inv.duedate}</td>
              <td className="px-5 py-3.5 font-bold text-black">${inv.total}</td>
              <td className="px-5 py-3.5"><Badge status={inv.status} /></td>
              <td className="px-5 py-3.5">
                {inv.status !== "Paid" && inv.status !== "Cancelled" && (
                  <button onClick={() => markPaid(inv)} disabled={busyId === inv.id}
                    className="text-xs text-green-600 font-semibold hover:underline disabled:opacity-50">
                    {busyId === inv.id ? "Saving…" : "Mark Paid"}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </TableCard>
      <Pagination page={page} total={total} perPage={PER} onChange={setPage} />
    </>
  );
}

function TransactionsTab() {
  const [txns,    setTxns]    = useState<UnifiedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [method,  setMethod]  = useState("");

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
    return f;
  }, [txns, method, search]);

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

export default function InvoicesPage() {
  const [tab, setTab] = useState<"invoices" | "transactions">("invoices");

  return (
    <div>
      <PageHeader title="Billing & Payments" subtitle="Invoices and unified payment transactions" />
      <div className="flex gap-2 mb-5">
        {(["invoices", "transactions"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-bold rounded-xl transition-colors ${tab === t ? "bg-[#6B21A8] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
          >{t === "invoices" ? "Invoices" : "Transactions"}</button>
        ))}
      </div>
      {tab === "invoices" ? <InvoicesTab /> : <TransactionsTab />}
    </div>
  );
}
