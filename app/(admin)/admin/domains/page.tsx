"use client";

import { useState, useEffect, useCallback } from "react";
import { whmcsAdmin, PageHeader, SearchBar, TableCard, THead, SkeletonRows, Badge, Pagination, EmptyState } from "@/lib/admin-utils";
import type { AdminDomain } from "@/lib/whmcs";

const PER = 20;

export default function DomainsPage() {
  const [domains,  setDomains]  = useState<AdminDomain[]>([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [search,   setSearch]   = useState("");
  const [loading,  setLoading]  = useState(true);
  const [expiring, setExpiring] = useState(false);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const res = await whmcsAdmin<{ domains: AdminDomain[]; total: number }>(
      "adminGetDomains", { limitstart: (page - 1) * PER, limitnum: PER }
    );
    if (res) { setDomains(res.domains); setTotal(res.total); }
    setLoading(false);
  }, [page]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const soon = new Date(); soon.setDate(soon.getDate() + 30);
  const filtered = domains
    .filter(d => !search || d.domainname.toLowerCase().includes(search.toLowerCase()) || `${d.firstname} ${d.lastname}`.toLowerCase().includes(search.toLowerCase()))
    .filter(d => !expiring || (d.expirydate && new Date(d.expirydate) <= soon));

  return (
    <div>
      <PageHeader title="Domains" subtitle={`${total} registered domains`} />
      <SearchBar value={search} onChange={setSearch} placeholder="Search by domain name or client…">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-600 px-3 py-2.5 border-2 border-gray-200 rounded-xl bg-white cursor-pointer hover:border-[#6B21A8] transition-all">
          <input type="checkbox" checked={expiring} onChange={e => setExpiring(e.target.checked)} className="accent-[#6B21A8]" />
          Expiring soon
        </label>
      </SearchBar>

      <TableCard>
        <THead cols={["Domain", "Client", "Expiry Date", "Registrar", "Status"]} />
        <tbody>
          {loading ? <SkeletonRows cols={5} /> : filtered.length === 0 ? <EmptyState icon="🌐" message="No domains found" /> : filtered.map(d => (
            <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <td className="px-5 py-3.5 font-bold text-[#6B21A8]">{d.domainname}</td>
              <td className="px-5 py-3.5 text-gray-700">{d.firstname} {d.lastname}</td>
              <td className="px-5 py-3.5 text-gray-500">{d.expirydate}</td>
              <td className="px-5 py-3.5 text-gray-500">{d.registrar || "—"}</td>
              <td className="px-5 py-3.5"><Badge status={d.status} /></td>
            </tr>
          ))}
        </tbody>
      </TableCard>
      <Pagination page={page} total={total} perPage={PER} onChange={setPage} />
    </div>
  );
}
