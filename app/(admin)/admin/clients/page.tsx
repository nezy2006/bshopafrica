"use client";

import { useState, useEffect, useCallback } from "react";
import { whmcsAdmin, PageHeader, SearchBar, TableCard, THead, SkeletonRows, Badge, Pagination, EmptyState } from "@/lib/admin-utils";
import type { AdminClient } from "@/lib/whmcs";

const PER = 20;

export default function ClientsPage() {
  const [clients, setClients] = useState<AdminClient[]>([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [search,  setSearch]  = useState("");
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const res = await whmcsAdmin<{ clients: AdminClient[]; total: number }>(
      "adminGetClients", { limitstart: (page - 1) * PER, limitnum: PER, search }
    );
    if (res) { setClients(res.clients); setTotal(res.total); }
    setLoading(false);
  }, [page, search]);

  useEffect(() => { const t = setTimeout(fetch_, 300); return () => clearTimeout(t); }, [fetch_]);

  return (
    <div>
      <PageHeader title="Clients" subtitle={`${total} registered clients`} />
      <SearchBar value={search} onChange={setSearch} placeholder="Search by name or email…" />

      <TableCard>
        <THead cols={["Name", "Email", "Phone", "Country", "Joined", "Status"]} />
        <tbody>
          {loading ? <SkeletonRows cols={6} /> : clients.length === 0 ? <EmptyState icon="👥" message="No clients found" /> : clients.map(c => (
            <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <td className="px-5 py-3.5 font-semibold text-black">{c.firstname} {c.lastname}</td>
              <td className="px-5 py-3.5 text-gray-500 text-xs">{c.email}</td>
              <td className="px-5 py-3.5 text-gray-500">{c.phonenumber || "—"}</td>
              <td className="px-5 py-3.5 text-gray-500">{c.country || "—"}</td>
              <td className="px-5 py-3.5 text-gray-400 text-xs">{c.datecreated}</td>
              <td className="px-5 py-3.5"><Badge status={c.status} /></td>
            </tr>
          ))}
        </tbody>
      </TableCard>
      <Pagination page={page} total={total} perPage={PER} onChange={setPage} />
    </div>
  );
}
