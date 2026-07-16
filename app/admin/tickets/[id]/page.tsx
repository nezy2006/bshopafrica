"use client";
import { ArrowLeft, Send, StickyNote, UserPlus, ArrowUpCircle, XCircle, RotateCcw } from "lucide-react";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/lib/admin-utils";
import { adminHeaders } from "@/lib/admin-auth-client";
import type { SupportTicket, TicketReply } from "@/lib/whmcs";

interface TicketMeta { ticket_id: number; assigned_admin_id: number | null; assigned_admin_name: string | null; escalated: number }
interface Department { id: number; name: string }
interface AssignableAdmin { id: number; name: string }
interface DetailResponse {
  ticket: SupportTicket & { replies: TicketReply[]; userid: number };
  meta: TicketMeta | null;
  departments: Department[];
  assignableAdmins: AssignableAdmin[];
}

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const ticketId = Number(params.id);

  const [data, setData] = useState<DetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isNote, setIsNote] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/admin/tickets/${ticketId}`, { headers: adminHeaders() });
      const json = await res.json() as { success: boolean; data?: DetailResponse };
      if (json.success && json.data) setData(json.data);
    } catch { /* offline */ }
    setLoading(false);
  }, [ticketId]);

  useEffect(() => { load(); }, [load]);

  const runAction = async (body: Record<string, unknown>) => {
    setBusy(true);
    try {
      await fetch(`/api/admin/tickets/${ticketId}`, {
        method: "POST", headers: { "Content-Type": "application/json", ...adminHeaders() },
        body: JSON.stringify(body),
      });
      await load();
    } finally { setBusy(false); }
  };

  const submitMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    await runAction({ action: isNote ? "note" : "reply", message });
    setMessage("");
  };

  if (loading || !data) {
    return <div className="flex justify-center py-24"><div className="w-8 h-8 rounded-full border-4 border-[#6B21A8] border-t-transparent animate-spin" /></div>;
  }

  const { ticket, meta, departments, assignableAdmins } = data;

  return (
    <div className="max-w-4xl">
      <button onClick={() => router.push("/admin/tickets")} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to tickets
      </button>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-black text-black">{ticket.title}</h1>
          <p className="text-sm text-gray-400 mt-1">Ticket {ticket.tid} · {ticket.deptname} · opened {ticket.date}</p>
        </div>
        <div className="flex items-center gap-2">
          {meta?.escalated === 1 && <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">Escalated</span>}
          <Badge status={ticket.priority} />
          <Badge status={ticket.status} />
        </div>
      </div>

      {/* Actions toolbar */}
      <div className="flex flex-wrap gap-2 mb-6">
        <select
          value={meta?.assigned_admin_id ?? ""}
          onChange={e => runAction({ action: "assign", adminId: e.target.value ? Number(e.target.value) : null })}
          disabled={busy}
          className="px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white outline-none focus:border-[#6B21A8]"
        >
          <option value="">Unassigned</option>
          {assignableAdmins.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <select
          value=""
          onChange={e => e.target.value && runAction({ action: "department", deptId: Number(e.target.value) })}
          disabled={busy}
          className="px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white outline-none focus:border-[#6B21A8]"
        >
          <option value="">Transfer department…</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select
          value={ticket.priority}
          onChange={e => runAction({ action: "priority", priority: e.target.value })}
          disabled={busy}
          className="px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white outline-none focus:border-[#6B21A8]"
        >
          {["Low", "Medium", "High"].map(p => <option key={p} value={p}>{p} priority</option>)}
        </select>
        <button onClick={() => runAction({ action: "escalate" })} disabled={busy}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50">
          <ArrowUpCircle className="w-3.5 h-3.5" /> Escalate
        </button>
        {ticket.status === "Closed" ? (
          <button onClick={() => runAction({ action: "reopen" })} disabled={busy}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50">
            <RotateCcw className="w-3.5 h-3.5" /> Reopen
          </button>
        ) : (
          <button onClick={() => runAction({ action: "close" })} disabled={busy}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50">
            <XCircle className="w-3.5 h-3.5" /> Close
          </button>
        )}
      </div>

      {/* Thread */}
      <div className="space-y-4 mb-6">
        {ticket.replies.map(r => (
          <div key={r.id} className={`p-4 rounded-2xl border ${r.type === "staff" ? "bg-purple-50 border-purple-100 ml-8" : "bg-white border-gray-100 mr-8"}`}>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-bold text-gray-700">{r.name} {r.type === "staff" && <span className="text-[#6B21A8]">(Staff)</span>}</p>
              <p className="text-[11px] text-gray-400">{r.date}</p>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{r.message}</p>
          </div>
        ))}
      </div>

      {/* Reply / note composer */}
      <form onSubmit={submitMessage} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <div className="flex gap-2 mb-2">
          <button type="button" onClick={() => setIsNote(false)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg ${!isNote ? "bg-[#6B21A8] text-white" : "bg-gray-100 text-gray-500"}`}>
            Reply to client
          </button>
          <button type="button" onClick={() => setIsNote(true)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1 ${isNote ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-500"}`}>
            <StickyNote className="w-3 h-3" /> Internal note
          </button>
        </div>
        <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4}
          placeholder={isNote ? "Internal note — not visible to the client…" : "Write a reply…"}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#6B21A8] resize-none" />
        <div className="flex justify-end mt-2">
          <button type="submit" disabled={busy || !message.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#6B21A8] text-white text-sm font-bold rounded-xl hover:bg-[#581c87] disabled:opacity-50">
            <Send className="w-4 h-4" /> {isNote ? "Add Note" : "Send Reply"}
          </button>
        </div>
      </form>
    </div>
  );
}
