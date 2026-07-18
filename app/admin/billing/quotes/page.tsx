"use client";
import { FileText, Plus, Send, Trash2, CheckCircle2 } from "lucide-react";

import { useState, useEffect, useCallback } from "react";
import { whmcsAdmin, SearchBar, TableCard, THead, SkeletonRows, Badge, EmptyState, Modal, ClientPicker, type PickableClient } from "@/lib/admin-utils";
import type { Quote } from "@/lib/whmcs";

const INPUT = "w-full px-3.5 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm text-black outline-none focus:border-[#6B21A8] focus:bg-white transition-all";
const STAGES = ["Draft", "Delivered", "On Hold", "Lost", "Dead"];

interface LineItemDraft { description: string; amount: string }

function CreateQuoteModal({ busy, onClose, onCreate }: { busy: boolean; onClose: () => void; onCreate: (clientId: number, subject: string, validUntil: string, items: { description: string; amount: number }[]) => void }) {
  const [client, setClient] = useState<PickableClient | null>(null);
  const [subject, setSubject] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [items, setItems] = useState<LineItemDraft[]>([{ description: "", amount: "" }]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || !subject.trim() || !validUntil) return;
    const parsed = items.filter(i => i.description.trim() && Number(i.amount) > 0).map(i => ({ description: i.description.trim(), amount: Number(i.amount) }));
    if (parsed.length === 0) return;
    onCreate(client.id, subject.trim(), validUntil, parsed);
  };

  return (
    <Modal title="Create Quote" onClose={onClose} maxWidth="max-w-lg">
      <form onSubmit={submit} className="space-y-4">
        <ClientPicker client={client} onSelect={setClient} />
        <input value={subject} onChange={e => setSubject(e.target.value)} required placeholder="Quote subject" className={INPUT} />
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Valid Until</label>
          <input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} required className={INPUT} />
        </div>
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex gap-2">
              <input value={item.description} onChange={e => setItems(arr => arr.map((x, j) => j === i ? { ...x, description: e.target.value } : x))} placeholder="Description" className={`${INPUT} flex-1`} />
              <input type="number" step="0.01" value={item.amount} onChange={e => setItems(arr => arr.map((x, j) => j === i ? { ...x, amount: e.target.value } : x))} placeholder="Amount" className="w-28 px-3 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm outline-none focus:border-[#6B21A8]" />
            </div>
          ))}
          <button type="button" onClick={() => setItems(arr => [...arr, { description: "", amount: "" }])} className="text-xs text-[#6B21A8] font-semibold hover:underline">+ Add line item</button>
        </div>
        <button type="submit" disabled={busy || !client} className="w-full py-3 bg-[#6B21A8] text-white font-semibold rounded-xl disabled:opacity-60 hover:bg-[#581c87] transition-colors">{busy ? "Creating…" : "Create Quote"}</button>
      </form>
    </Modal>
  );
}

export default function QuotesPage() {
  const [quotes,  setQuotes]  = useState<Quote[]>([]);
  const [total,   setTotal]   = useState(0);
  const [search,  setSearch]  = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId,  setBusyId]  = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createBusy, setCreateBusy] = useState(false);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const res = await whmcsAdmin<{ quotes: Quote[]; total: number }>("adminGetQuotes", { limitstart: 0, limitnum: 100 });
    if (res) { setQuotes(res.quotes); setTotal(res.total); }
    setLoading(false);
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  const filtered = search
    ? quotes.filter(q => `${q.subject} ${q.firstname} ${q.lastname} ${q.id}`.toLowerCase().includes(search.toLowerCase()))
    : quotes;

  const setStage = async (q: Quote, stage: string) => {
    setBusyId(q.id);
    await whmcsAdmin("adminUpdateQuoteStage", { quoteId: q.id, stage });
    setBusyId(null);
    fetch_();
  };

  const send = async (q: Quote) => {
    setBusyId(q.id);
    await whmcsAdmin("adminSendQuote", { quoteId: q.id });
    setBusyId(null);
    alert(`Quote #${q.id} emailed to the client.`);
    fetch_();
  };

  const accept = async (q: Quote) => {
    if (!confirm(`Mark quote #${q.id} as accepted? To bill it, create an invoice from Billing → Invoices with the same line items.`)) return;
    setBusyId(q.id);
    await whmcsAdmin("adminAcceptQuote", { quoteId: q.id });
    setBusyId(null);
    fetch_();
  };

  const remove = async (q: Quote) => {
    if (!confirm(`Delete quote #${q.id}? This cannot be undone.`)) return;
    setBusyId(q.id);
    await whmcsAdmin("adminDeleteQuote", { quoteId: q.id });
    setBusyId(null);
    fetch_();
  };

  const create = async (clientId: number, subject: string, validUntil: string, items: { description: string; amount: number }[]) => {
    setCreateBusy(true);
    const res = await whmcsAdmin<{ quoteId: number }>("adminCreateQuote", { clientId, subject, validUntil, lineitems: items });
    setCreateBusy(false);
    if (res) { setCreateOpen(false); fetch_(); }
  };

  return (
    <>
      <SearchBar value={search} onChange={setSearch} placeholder="Search by subject or client…">
        <button onClick={() => setCreateOpen(true)} className="flex items-center gap-1.5 px-4 py-2.5 bg-[#6B21A8] text-white text-sm font-bold rounded-xl hover:bg-[#581c87] transition-colors">
          <Plus className="w-4 h-4" /> Create Quote
        </button>
      </SearchBar>

      <TableCard>
        <THead cols={["Quote #", "Subject", "Client", "Total", "Valid Until", "Stage", "Actions"]} />
        <tbody>
          {loading ? <SkeletonRows cols={7} /> : filtered.length === 0 ? <EmptyState icon={<FileText className="w-5 h-5" />} message="No quotes yet" /> : filtered.map(q => (
            <tr key={q.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <td className="px-5 py-3.5 font-bold text-[#6B21A8]">#{q.id}</td>
              <td className="px-5 py-3.5 font-medium text-black max-w-xs truncate">{q.subject}</td>
              <td className="px-5 py-3.5 text-gray-600">{q.firstname} {q.lastname}</td>
              <td className="px-5 py-3.5 font-semibold">${q.total}</td>
              <td className="px-5 py-3.5 text-gray-500">{q.validuntil}</td>
              <td className="px-5 py-3.5">
                {q.stage === "Accepted" ? <Badge status="Accepted" /> : (
                  <select value={q.stage} onChange={e => setStage(q, e.target.value)} disabled={busyId === q.id}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white outline-none focus:border-[#6B21A8]">
                    {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                )}
              </td>
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <button onClick={() => send(q)} disabled={busyId === q.id} title="Send to client" className="text-gray-400 hover:text-[#6B21A8]"><Send className="w-3.5 h-3.5" /></button>
                  {q.stage !== "Accepted" && <button onClick={() => accept(q)} disabled={busyId === q.id} title="Mark accepted" className="text-gray-400 hover:text-green-600"><CheckCircle2 className="w-3.5 h-3.5" /></button>}
                  <button onClick={() => remove(q)} disabled={busyId === q.id} title="Delete" className="text-gray-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </TableCard>
      <p className="text-xs text-gray-400 mt-3">{total} total quotes</p>

      {createOpen && <CreateQuoteModal busy={createBusy} onClose={() => setCreateOpen(false)} onCreate={create} />}
    </>
  );
}
