"use client";
import { Receipt } from "lucide-react";

import { useState, useEffect, useCallback } from "react";
import { whmcsAdmin, PageHeader, SearchBar, TableCard, THead, SkeletonRows, Badge, Pagination, EmptyState } from "@/lib/admin-utils";
import type { AdminInvoice } from "@/lib/whmcs";

const PER = 20;
const STATUSES = ["", "Paid", "Unpaid", "Overdue", "Draft", "Cancelled"];

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<AdminInvoice[]>([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [search,   setSearch]   = useState("");
  const [status,   setStatus]   = useState("");
  const [loading,  setLoading]  = useState(true);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const res = await whmcsAdmin<{ invoices: AdminInvoice[]; total: number }>(
      "adminGetInvoices", { status, limitstart: (page - 1) * PER, limitnum: PER }
    );
    if (res) { setInvoices(res.invoices); setTotal(res.total); }
    setLoading(false);
  }, [page, status]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const filtered = search
    ? invoices.filter(i => `${i.firstname} ${i.lastname} ${i.id}`.toLowerCase().includes(search.toLowerCase()))
    : invoices;

  return (
    <div>
      <PageHeader title="Invoices" subtitle={`${total} total invoices`} />
      <SearchBar value={search} onChange={setSearch} placeholder="Search by client name or invoice #…">
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="px-3 py-2.5 text-sm border-2 border-gray-200 rounded-xl bg-white outline-none focus:border-[#6B21A8] cursor-pointer">
          {STATUSES.map(s => <option key={s} value={s}>{s || "All statuses"}</option>)}
        </select>
      </SearchBar>

      <TableCard>
        <THead cols={["Invoice #", "Client", "Date", "Due Date", "Total", "Status"]} />
        <tbody>
          {loading ? <SkeletonRows cols={6} /> : filtered.length === 0 ? <EmptyState icon={<Receipt className="w-5 h-5" />} message="No invoices found" /> : filtered.map(inv => (
            <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <td className="px-5 py-3.5 font-bold text-[#6B21A8]">#{inv.id}</td>
              <td className="px-5 py-3.5 font-medium text-black">{inv.firstname} {inv.lastname}</td>
              <td className="px-5 py-3.5 text-gray-500">{inv.date}</td>
              <td className="px-5 py-3.5 text-gray-500">{inv.duedate}</td>
              <td className="px-5 py-3.5 font-bold text-black">${inv.total}</td>
              <td className="px-5 py-3.5"><Badge status={inv.status} /></td>
            </tr>
          ))}
        </tbody>
      </TableCard>
      <Pagination page={page} total={total} perPage={PER} onChange={setPage} />
    </div>
  );
}
