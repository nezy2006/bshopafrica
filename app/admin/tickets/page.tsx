"use client";
import { MessageSquare } from "lucide-react";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { whmcsAdmin, PageHeader, SearchBar, TableCard, THead, SkeletonRows, Badge, Pagination, EmptyState } from "@/lib/admin-utils";
import type { AdminTicket } from "@/lib/whmcs";

const PER = 20;
const STATUSES = ["", "Open", "Answered", "Customer-Reply", "On Hold", "In Progress", "Closed"];

export default function TicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [search,  setSearch]  = useState("");
  const [status,  setStatus]  = useState("Open");
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const res = await whmcsAdmin<{ tickets: AdminTicket[]; total: number }>(
      "adminGetTickets", { status, limitstart: (page - 1) * PER, limitnum: PER }
    );
    if (res) { setTickets(res.tickets); setTotal(res.total); }
    setLoading(false);
  }, [page, status]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const filtered = search
    ? tickets.filter(t => `${t.title} ${t.firstname} ${t.lastname} ${t.tid}`.toLowerCase().includes(search.toLowerCase()))
    : tickets;

  const priority = (p: string) => {
    const cls = p === "High" ? "bg-red-100 text-red-700" : p === "Medium" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-600";
    return <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${cls}`}>{p}</span>;
  };

  return (
    <div>
      <PageHeader title="Support Tickets" subtitle={`${total} tickets`} />
      <SearchBar value={search} onChange={setSearch} placeholder="Search by subject, client, or ticket #…">
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="px-3 py-2.5 text-sm border-2 border-gray-200 rounded-xl bg-white outline-none focus:border-[#6B21A8] cursor-pointer">
          {STATUSES.map(s => <option key={s} value={s}>{s || "All statuses"}</option>)}
        </select>
      </SearchBar>

      <TableCard>
        <THead cols={["Ticket #", "Subject", "Client", "Department", "Priority", "Date", "Status"]} />
        <tbody>
          {loading ? <SkeletonRows cols={7} /> : filtered.length === 0 ? <EmptyState icon={<MessageSquare className="w-5 h-5" />} message="No tickets found" /> : filtered.map(t => (
            <tr key={t.id} onClick={() => router.push(`/admin/tickets/${t.id}`)} className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer">
              <td className="px-5 py-3.5 font-bold text-[#6B21A8]">{t.tid}</td>
              <td className="px-5 py-3.5 font-medium text-black max-w-xs truncate">{t.title}</td>
              <td className="px-5 py-3.5 text-gray-600">{t.firstname} {t.lastname}</td>
              <td className="px-5 py-3.5 text-gray-500">{t.department || "—"}</td>
              <td className="px-5 py-3.5">{priority(t.priority)}</td>
              <td className="px-5 py-3.5 text-gray-400 text-xs">{t.date}</td>
              <td className="px-5 py-3.5"><Badge status={t.status} /></td>
            </tr>
          ))}
        </tbody>
      </TableCard>
      <Pagination page={page} total={total} perPage={PER} onChange={setPage} />
    </div>
  );
}
