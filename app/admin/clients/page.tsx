"use client";
import { Users, Mail, Ban, CheckCircle2, Trash2 } from "lucide-react";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, SearchBar, TableCard, THead, SkeletonRows, Badge, Pagination, EmptyState, Modal } from "@/lib/admin-utils";
import { adminHeaders } from "@/lib/admin-auth-client";
import type { EnrichedClient } from "@/app/api/admin/clients/route";

const PER = 20;
const STATUSES = ["", "Active", "Inactive", "Closed"];

function BulkEmailModal({ count, busy, onClose, onSend }: { count: number; busy: boolean; onClose: () => void; onSend: (subject: string, message: string) => void }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  return (
    <Modal title={`Email ${count} client${count === 1 ? "" : "s"}`} onClose={onClose}>
      <form onSubmit={e => { e.preventDefault(); onSend(subject, message); }} className="space-y-3">
        <input value={subject} onChange={e => setSubject(e.target.value)} required placeholder="Subject"
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#6B21A8]" />
        <textarea value={message} onChange={e => setMessage(e.target.value)} required rows={5} placeholder="Message"
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#6B21A8] resize-none" />
        <button type="submit" disabled={busy} className="w-full py-3 bg-[#6B21A8] text-white font-semibold rounded-xl disabled:opacity-60 hover:bg-[#581c87] transition-colors">
          {busy ? "Sending…" : `Send to ${count}`}
        </button>
      </form>
    </Modal>
  );
}

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<EnrichedClient[]>([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [search,  setSearch]  = useState("");
  const [status,  setStatus]  = useState("");
  const [country, setCountry] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkEmailOpen, setBulkEmailOpen] = useState(false);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ limitstart: String((page - 1) * PER), limitnum: String(PER), search });
      const res  = await fetch(`/api/admin/clients?${qs}`, { headers: adminHeaders() });
      const json = await res.json() as { success: boolean; data?: { clients: EnrichedClient[]; total: number } };
      if (json.success && json.data) { setClients(json.data.clients); setTotal(json.data.total); }
    } catch { /* offline */ }
    setLoading(false);
    setSelected(new Set());
  }, [page, search]);

  useEffect(() => { const t = setTimeout(fetch_, 300); return () => clearTimeout(t); }, [fetch_]);

  const countries = useMemo(() => [...new Set(clients.map(c => c.country).filter(Boolean))].sort(), [clients]);
  const filtered = clients
    .filter(c => !status || c.status === status)
    .filter(c => !country || c.country === country);

  const toggle = (id: number) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected(s => s.size === filtered.length ? new Set() : new Set(filtered.map(c => c.id)));

  const runBulk = async (fn: (id: number) => Promise<void>) => {
    setBulkBusy(true);
    try { await Promise.all([...selected].map(id => fn(id).catch(e => console.error(e)))); await fetch_(); }
    finally { setBulkBusy(false); }
  };

  const bulkSetStatus = (status: "Active" | "Inactive") => runBulk(async id => {
    await fetch(`/api/admin/clients/${id}`, { method: "POST", headers: { "Content-Type": "application/json", ...adminHeaders() }, body: JSON.stringify({ action: "setStatus", status }) });
  });
  const bulkDelete = () => {
    if (!confirm(`Permanently delete ${selected.size} client(s)? This cannot be undone.`)) return;
    runBulk(async id => { await fetch(`/api/admin/clients/${id}`, { method: "POST", headers: { "Content-Type": "application/json", ...adminHeaders() }, body: JSON.stringify({ action: "delete" }) }); });
  };
  const bulkEmail = async (subject: string, message: string) => {
    await runBulk(async id => { await fetch(`/api/admin/clients/${id}`, { method: "POST", headers: { "Content-Type": "application/json", ...adminHeaders() }, body: JSON.stringify({ action: "sendEmail", subject, message }) }); });
    setBulkEmailOpen(false);
  };

  return (
    <div>
      <PageHeader title="Clients" subtitle={`${total} registered clients`} />
      <SearchBar value={search} onChange={setSearch} placeholder="Search by name or email…">
        <select value={status} onChange={e => setStatus(e.target.value)} className="px-3 py-2.5 text-sm border-2 border-gray-200 rounded-xl bg-white outline-none focus:border-[#6B21A8] cursor-pointer">
          {STATUSES.map(s => <option key={s} value={s}>{s || "All statuses"}</option>)}
        </select>
        <select value={country} onChange={e => setCountry(e.target.value)} className="px-3 py-2.5 text-sm border-2 border-gray-200 rounded-xl bg-white outline-none focus:border-[#6B21A8] cursor-pointer">
          <option value="">All countries</option>
          {countries.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </SearchBar>

      {selected.size > 0 && (
        <div className="flex items-center gap-2 mb-4 px-4 py-2.5 bg-purple-50 border border-purple-100 rounded-xl">
          <span className="text-xs font-bold text-[#6B21A8]">{selected.size} selected</span>
          <button onClick={() => setBulkEmailOpen(true)} disabled={bulkBusy} className="flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-black disabled:opacity-50"><Mail className="w-3.5 h-3.5" /> Email</button>
          <button onClick={() => bulkSetStatus("Inactive")} disabled={bulkBusy} className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"><Ban className="w-3.5 h-3.5" /> Suspend</button>
          <button onClick={() => bulkSetStatus("Active")} disabled={bulkBusy} className="flex items-center gap-1 text-xs font-semibold text-green-600 hover:text-green-700 disabled:opacity-50"><CheckCircle2 className="w-3.5 h-3.5" /> Unsuspend</button>
          <button onClick={bulkDelete} disabled={bulkBusy} className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
        </div>
      )}

      <TableCard>
        <thead><tr className="bg-gray-50 border-b border-gray-100">
          <th className="px-5 py-3 w-8"><input type="checkbox" checked={filtered.length > 0 && selected.size === filtered.length} onChange={toggleAll} className="accent-[#6B21A8]" /></th>
          {["Name", "Email", "Phone", "Status", "Balance", "Services", "Domains", "Last Login"].map(c => (
            <th key={c} className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">{c}</th>
          ))}
        </tr></thead>
        <tbody>
          {loading ? <SkeletonRows cols={9} /> : filtered.length === 0 ? <EmptyState icon={<Users className="w-5 h-5" />} message="No clients found" /> : filtered.map(c => (
            <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}><input type="checkbox" checked={selected.has(c.id)} onChange={() => toggle(c.id)} className="accent-[#6B21A8]" /></td>
              <td className="px-5 py-3.5 font-semibold text-black cursor-pointer" onClick={() => router.push(`/admin/clients/${c.id}`)}>
                <span className="hover:text-[#6B21A8] hover:underline">{c.firstname} {c.lastname}</span>
              </td>
              <td className="px-5 py-3.5 text-gray-500 text-xs">{c.email}</td>
              <td className="px-5 py-3.5 text-gray-500">{c.phonenumber || "—"}</td>
              <td className="px-5 py-3.5"><Badge status={c.status} /></td>
              <td className="px-5 py-3.5 font-semibold">${c.balance}</td>
              <td className="px-5 py-3.5 text-gray-600">{c.servicesCount}</td>
              <td className="px-5 py-3.5 text-gray-600">{c.domainsCount}</td>
              <td className="px-5 py-3.5 text-gray-400 text-xs">{c.lastlogin || "Never"}</td>
            </tr>
          ))}
        </tbody>
      </TableCard>
      <Pagination page={page} total={total} perPage={PER} onChange={setPage} />

      {bulkEmailOpen && <BulkEmailModal count={selected.size} busy={bulkBusy} onClose={() => setBulkEmailOpen(false)} onSend={bulkEmail} />}
    </div>
  );
}
