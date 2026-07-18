"use client";
import { MessageSquare } from "lucide-react";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { whmcsAdmin, PageHeader, SearchBar, TableCard, THead, SkeletonRows, Badge, Pagination, EmptyState } from "@/lib/admin-utils";
import type { AdminTicket } from "@/lib/whmcs";

interface EnrichedTicket extends AdminTicket { assignedAdminId: number | null; assignedAdminName: string | null; escalated: boolean }
interface Department { id: number; name: string }

const PER = 20;
const STATUSES = ["", "Open", "Answered", "Customer-Reply", "On Hold", "In Progress", "Closed"];
const PRIORITIES = ["", "Low", "Medium", "High", "Urgent"];
type SortKey = "date" | "priority" | "lastreply";

export default function TicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<EnrichedTicket[]>([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [search,  setSearch]  = useState("");
  const [status,  setStatus]  = useState("Open");
  const [deptId,  setDeptId]  = useState(0);
  const [priority, setPriority] = useState("");
  const [assignedOnly, setAssignedOnly] = useState<"" | "assigned" | "unassigned">("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const res = await whmcsAdmin<{ tickets: EnrichedTicket[]; total: number }>(
      "adminGetTickets", { status, limitstart: (page - 1) * PER, limitnum: PER, deptId: deptId || undefined }
    );
    if (res) { setTickets(res.tickets); setTotal(res.total); }
    setLoading(false);
  }, [page, status, deptId]);

  useEffect(() => { fetch_(); }, [fetch_]);
  useEffect(() => { whmcsAdmin<Department[]>("adminGetTicketDepartments").then(d => setDepartments(d ?? [])); }, []);

  const priorityWeight = (p: string) => ({ Urgent: 4, High: 3, Medium: 2, Low: 1 }[p] ?? 0);

  const filtered = useMemo(() => {
    let f = tickets;
    if (search) f = f.filter(t => `${t.title} ${t.firstname} ${t.lastname} ${t.tid}`.toLowerCase().includes(search.toLowerCase()));
    if (priority) f = f.filter(t => t.priority === priority);
    if (assignedOnly === "assigned") f = f.filter(t => t.assignedAdminId !== null);
    if (assignedOnly === "unassigned") f = f.filter(t => t.assignedAdminId === null);
    const sorted = [...f];
    if (sortKey === "priority") sorted.sort((a, b) => priorityWeight(b.priority) - priorityWeight(a.priority));
    else if (sortKey === "lastreply") sorted.sort((a, b) => new Date(b.lastreply || 0).getTime() - new Date(a.lastreply || 0).getTime());
    else sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return sorted;
  }, [tickets, search, priority, assignedOnly, sortKey]);

  const priorityBadge = (p: string) => {
    const cls = p === "Urgent" || p === "High" ? "bg-red-100 text-red-700" : p === "Medium" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-600";
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
        <select value={deptId} onChange={e => { setDeptId(Number(e.target.value)); setPage(1); }}
          className="px-3 py-2.5 text-sm border-2 border-gray-200 rounded-xl bg-white outline-none focus:border-[#6B21A8] cursor-pointer">
          <option value={0}>All departments</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select value={priority} onChange={e => setPriority(e.target.value)}
          className="px-3 py-2.5 text-sm border-2 border-gray-200 rounded-xl bg-white outline-none focus:border-[#6B21A8] cursor-pointer">
          {PRIORITIES.map(p => <option key={p} value={p}>{p || "All priorities"}</option>)}
        </select>
        <select value={assignedOnly} onChange={e => setAssignedOnly(e.target.value as typeof assignedOnly)}
          className="px-3 py-2.5 text-sm border-2 border-gray-200 rounded-xl bg-white outline-none focus:border-[#6B21A8] cursor-pointer">
          <option value="">Anyone</option>
          <option value="assigned">Assigned</option>
          <option value="unassigned">Unassigned</option>
        </select>
        <select value={sortKey} onChange={e => setSortKey(e.target.value as SortKey)}
          className="px-3 py-2.5 text-sm border-2 border-gray-200 rounded-xl bg-white outline-none focus:border-[#6B21A8] cursor-pointer">
          <option value="date">Sort: Newest</option>
          <option value="priority">Sort: Priority</option>
          <option value="lastreply">Sort: Last Reply</option>
        </select>
      </SearchBar>

      <TableCard>
        <THead cols={["Ticket #", "Subject", "Client", "Department", "Priority", "Assigned", "Date", "Status"]} />
        <tbody>
          {loading ? <SkeletonRows cols={8} /> : filtered.length === 0 ? <EmptyState icon={<MessageSquare className="w-5 h-5" />} message="No tickets found" /> : filtered.map(t => (
            <tr key={t.id} onClick={() => router.push(`/admin/tickets/${t.id}`)} className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer">
              <td className="px-5 py-3.5 font-bold text-[#6B21A8]">{t.tid}</td>
              <td className="px-5 py-3.5 font-medium text-black max-w-xs truncate">{t.title}{t.escalated && <span className="ml-2 text-[10px] font-bold text-red-600 uppercase">Escalated</span>}</td>
              <td className="px-5 py-3.5 text-gray-600">{t.firstname} {t.lastname}</td>
              <td className="px-5 py-3.5 text-gray-500">{t.department || "—"}</td>
              <td className="px-5 py-3.5">{priorityBadge(t.priority)}</td>
              <td className="px-5 py-3.5 text-gray-500 text-xs">{t.assignedAdminName || "Unassigned"}</td>
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
