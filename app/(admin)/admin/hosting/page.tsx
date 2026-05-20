"use client";

import { useState, useEffect, useCallback } from "react";
import { whmcsAdmin, PageHeader, SearchBar, TableCard, THead, SkeletonRows, Badge, Pagination, EmptyState } from "@/lib/admin-utils";
import type { AdminHostingAccount } from "@/lib/whmcs";

const PER = 20;

export default function HostingPage() {
  const [accounts, setAccounts] = useState<AdminHostingAccount[]>([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [search,   setSearch]   = useState("");
  const [plan,     setPlan]     = useState("");
  const [loading,  setLoading]  = useState(true);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const res = await whmcsAdmin<{ hosting: AdminHostingAccount[]; total: number }>(
      "adminGetHosting", { limitstart: (page - 1) * PER, limitnum: PER }
    );
    if (res) { setAccounts(res.hosting); setTotal(res.total); }
    setLoading(false);
  }, [page]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const plans = [...new Set(accounts.map(a => a.name))];
  const filtered = accounts
    .filter(a => !search || a.domain.toLowerCase().includes(search.toLowerCase()) || `${a.firstname} ${a.lastname}`.toLowerCase().includes(search.toLowerCase()))
    .filter(a => !plan || a.name === plan);

  return (
    <div>
      <PageHeader title="Hosting Accounts" subtitle={`${total} total accounts`} />
      <SearchBar value={search} onChange={setSearch} placeholder="Search by domain or client name…">
        <select value={plan} onChange={e => setPlan(e.target.value)}
          className="px-3 py-2.5 text-sm border-2 border-gray-200 rounded-xl bg-white outline-none focus:border-[#6B21A8] cursor-pointer">
          <option value="">All plans</option>
          {plans.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </SearchBar>

      <TableCard>
        <THead cols={["Domain", "Client", "Plan", "Billing", "Amount", "Next Due", "Status"]} />
        <tbody>
          {loading ? <SkeletonRows cols={7} /> : filtered.length === 0 ? <EmptyState icon="🖥" message="No hosting accounts found" /> : filtered.map(a => (
            <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <td className="px-5 py-3.5 font-bold text-[#6B21A8]">{a.domain || "—"}</td>
              <td className="px-5 py-3.5 text-gray-700">{a.firstname} {a.lastname}</td>
              <td className="px-5 py-3.5 text-gray-600">{a.name}</td>
              <td className="px-5 py-3.5 text-gray-500 capitalize">{a.billingcycle}</td>
              <td className="px-5 py-3.5 font-semibold">${a.amount}</td>
              <td className="px-5 py-3.5 text-gray-500">{a.nextduedate}</td>
              <td className="px-5 py-3.5"><Badge status={a.status} /></td>
            </tr>
          ))}
        </tbody>
      </TableCard>
      <Pagination page={page} total={total} perPage={PER} onChange={setPage} />
    </div>
  );
}
