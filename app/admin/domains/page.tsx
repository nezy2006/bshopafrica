"use client";
import { Globe } from "lucide-react";

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
  const [busyId,   setBusyId]   = useState<number | null>(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const res = await whmcsAdmin<{ domains: AdminDomain[]; total: number }>(
      "adminGetDomains", { limitstart: (page - 1) * PER, limitnum: PER }
    );
    if (res) { setDomains(res.domains); setTotal(res.total); }
    setLoading(false);
  }, [page]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const toggleAutoRenew = async (d: AdminDomain) => {
    setBusyId(d.id);
    await whmcsAdmin("adminUpdateDomainAutoRenew", { domainId: d.id, autoRenew: !d.autorenew });
    setBusyId(null);
    fetch_();
  };

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
        <THead cols={["Domain", "Client", "Status", "Registration Date", "Next Due Date", "Auto Renew", "Actions"]} />
        <tbody>
          {loading ? <SkeletonRows cols={7} /> : filtered.length === 0 ? <EmptyState icon={<Globe className="w-5 h-5" />} message="No domains found" /> : filtered.map(d => (
            <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <td className="px-5 py-3.5 font-bold text-[#6B21A8]">{d.domainname}</td>
              <td className="px-5 py-3.5 text-gray-700">{d.firstname} {d.lastname}</td>
              <td className="px-5 py-3.5"><Badge status={d.status} /></td>
              <td className="px-5 py-3.5 text-gray-500">{d.registrationdate || "—"}</td>
              <td className="px-5 py-3.5 text-gray-500">{d.nextduedate || "—"}</td>
              <td className="px-5 py-3.5">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${d.autorenew ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />{d.autorenew ? "On" : "Off"}
                </span>
              </td>
              <td className="px-5 py-3.5">
                <button onClick={() => toggleAutoRenew(d)} disabled={busyId === d.id}
                  className="text-xs text-[#6B21A8] font-semibold hover:underline disabled:opacity-50">
                  {busyId === d.id ? "Saving…" : d.autorenew ? "Turn off" : "Turn on"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </TableCard>
      <Pagination page={page} total={total} perPage={PER} onChange={setPage} />
    </div>
  );
}
