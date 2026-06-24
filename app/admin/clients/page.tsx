"use client";
import { Users, LogIn, Copy, Check } from "lucide-react";

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
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const res = await whmcsAdmin<{ clients: AdminClient[]; total: number }>(
      "adminGetClients", { limitstart: (page - 1) * PER, limitnum: PER, search }
    );
    if (res) { setClients(res.clients); setTotal(res.total); }
    setLoading(false);
  }, [page, search]);

  useEffect(() => { const t = setTimeout(fetch_, 300); return () => clearTimeout(t); }, [fetch_]);

  const getImpersonateUrl = (clientId: number): string | null => {
    const adminKey = localStorage.getItem("bshop_admin_password");
    if (!adminKey) { alert("Your admin session has expired. Please log in again."); return null; }
    return `${window.location.origin}/impersonate?client_id=${clientId}&admin_key=${encodeURIComponent(adminKey)}`;
  };

  const handleLoginAsClient = (clientId: number) => {
    const url = getImpersonateUrl(clientId);
    if (url) window.open(url, "_blank");
  };

  const handleCopyLink = async (clientId: number) => {
    const url = getImpersonateUrl(clientId);
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(clientId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      alert("Could not copy link.");
    }
  };

  return (
    <div>
      <PageHeader title="Clients" subtitle={`${total} registered clients`} />
      <SearchBar value={search} onChange={setSearch} placeholder="Search by name or email…" />

      <TableCard>
        <THead cols={["Name", "Email", "Phone", "Country", "Joined", "Status", ""]} />
        <tbody>
          {loading ? <SkeletonRows cols={7} /> : clients.length === 0 ? <EmptyState icon={<Users className="w-5 h-5" />} message="No clients found" /> : clients.map(c => (
            <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <td className="px-5 py-3.5 font-semibold text-black">{c.firstname} {c.lastname}</td>
              <td className="px-5 py-3.5 text-gray-500 text-xs">{c.email}</td>
              <td className="px-5 py-3.5 text-gray-500">{c.phonenumber || "—"}</td>
              <td className="px-5 py-3.5 text-gray-500">{c.country || "—"}</td>
              <td className="px-5 py-3.5 text-gray-400 text-xs">{c.datecreated}</td>
              <td className="px-5 py-3.5"><Badge status={c.status} /></td>
              <td className="px-5 py-3.5 text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => handleLoginAsClient(c.id)}
                    title="Open impersonation link in a new tab"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#6B21A8] bg-purple-50 hover:bg-purple-100 transition-colors"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    Login as Client
                  </button>
                  <button
                    onClick={() => handleCopyLink(c.id)}
                    title="Copy impersonation link"
                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 bg-gray-50 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                  >
                    {copiedId === c.id ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </TableCard>
      <Pagination page={page} total={total} perPage={PER} onChange={setPage} />
    </div>
  );
}
