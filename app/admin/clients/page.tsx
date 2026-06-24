"use client";
import { Users, LogIn } from "lucide-react";

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
  const [ssoLoadingId, setSsoLoadingId] = useState<number | null>(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const res = await whmcsAdmin<{ clients: AdminClient[]; total: number }>(
      "adminGetClients", { limitstart: (page - 1) * PER, limitnum: PER, search }
    );
    if (res) { setClients(res.clients); setTotal(res.total); }
    setLoading(false);
  }, [page, search]);

  useEffect(() => { const t = setTimeout(fetch_, 300); return () => clearTimeout(t); }, [fetch_]);

  const handleLoginAsClient = async (clientId: number) => {
    setSsoLoadingId(clientId);
    try {
      const adminPassword = localStorage.getItem("bshop_admin_password") ?? "";
      const res  = await fetch("/api/auth/sso", {
        method:  "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": adminPassword },
        body:    JSON.stringify({ clientId }),
      });
      const json = await res.json() as { success: boolean; redirectUrl?: string; error?: string };
      if (json.success && json.redirectUrl) {
        window.open(json.redirectUrl, "_blank");
      } else {
        alert(json.error ?? "Could not log in as this client.");
      }
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setSsoLoadingId(null);
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
                <button
                  onClick={() => handleLoginAsClient(c.id)}
                  disabled={ssoLoadingId === c.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#6B21A8] bg-purple-50 hover:bg-purple-100 transition-colors disabled:opacity-50"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  {ssoLoadingId === c.id ? "Logging in…" : "Login as Client"}
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
