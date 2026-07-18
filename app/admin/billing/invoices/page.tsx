"use client";
import { Receipt, Plus } from "lucide-react";

import { useState, useEffect, useCallback } from "react";
import { whmcsAdmin, SearchBar, TableCard, THead, SkeletonRows, Badge, Pagination, EmptyState, Modal, ClientPicker, type PickableClient } from "@/lib/admin-utils";
import type { AdminInvoice } from "@/lib/whmcs";

const PER = 20;
const STATUSES = ["", "Paid", "Unpaid", "Overdue", "Draft", "Cancelled"];
const INPUT = "w-full px-3.5 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm text-black outline-none focus:border-[#6B21A8] focus:bg-white transition-all";

interface LineItemDraft { description: string; amount: string }

function CreateInvoiceModal({ busy, onClose, onCreate }: { busy: boolean; onClose: () => void; onCreate: (clientId: number, items: { description: string; amount: number }[], dueDate: string) => void }) {
  const [client, setClient] = useState<PickableClient | null>(null);
  const [items, setItems] = useState<LineItemDraft[]>([{ description: "", amount: "" }]);
  const [dueDate, setDueDate] = useState(new Date().toISOString().split("T")[0]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;
    const parsed = items.filter(i => i.description.trim() && Number(i.amount) > 0).map(i => ({ description: i.description.trim(), amount: Number(i.amount) }));
    if (parsed.length === 0) return;
    onCreate(client.id, parsed, dueDate);
  };

  return (
    <Modal title="Create Invoice" onClose={onClose} maxWidth="max-w-lg">
      <form onSubmit={submit} className="space-y-4">
        <ClientPicker client={client} onSelect={setClient} />
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex gap-2">
              <input value={item.description} onChange={e => setItems(arr => arr.map((x, j) => j === i ? { ...x, description: e.target.value } : x))} placeholder="Description" className={`${INPUT} flex-1`} />
              <input type="number" step="0.01" value={item.amount} onChange={e => setItems(arr => arr.map((x, j) => j === i ? { ...x, amount: e.target.value } : x))} placeholder="Amount" className="w-28 px-3 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm outline-none focus:border-[#6B21A8]" />
            </div>
          ))}
          <button type="button" onClick={() => setItems(arr => [...arr, { description: "", amount: "" }])} className="text-xs text-[#6B21A8] font-semibold hover:underline">+ Add line item</button>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Due Date</label>
          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={INPUT} />
        </div>
        <button type="submit" disabled={busy || !client} className="w-full py-3 bg-[#6B21A8] text-white font-semibold rounded-xl disabled:opacity-60 hover:bg-[#581c87] transition-colors">{busy ? "Creating…" : "Create Invoice"}</button>
      </form>
    </Modal>
  );
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<AdminInvoice[]>([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [search,   setSearch]   = useState("");
  const [status,   setStatus]   = useState("");
  const [loading,  setLoading]  = useState(true);
  const [busyId,   setBusyId]   = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createBusy, setCreateBusy] = useState(false);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const res = await whmcsAdmin<{ invoices: AdminInvoice[]; total: number }>(
      "adminGetInvoices", { status, limitstart: (page - 1) * PER, limitnum: PER }
    );
    if (res) { setInvoices(res.invoices); setTotal(res.total); }
    setLoading(false);
  }, [page, status]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const markPaid = async (inv: AdminInvoice) => {
    if (!confirm(`Mark invoice #${inv.id} ($${inv.total}) as paid?`)) return;
    setBusyId(inv.id);
    await whmcsAdmin("addPayment", { invoiceId: inv.id, amount: Number(inv.total), transactionId: `manual-${Date.now()}` });
    setBusyId(null);
    fetch_();
  };

  const voidInv = async (inv: AdminInvoice) => {
    if (!confirm(`Void/cancel invoice #${inv.id}?`)) return;
    setBusyId(inv.id);
    await whmcsAdmin("adminVoidInvoice", { invoiceId: inv.id });
    setBusyId(null);
    fetch_();
  };

  const applyCredit = async (inv: AdminInvoice) => {
    const amount = prompt(`Apply how much account credit to invoice #${inv.id} (max $${inv.total})?`);
    if (!amount || Number(amount) <= 0) return;
    setBusyId(inv.id);
    await whmcsAdmin("adminApplyCredit", { invoiceId: inv.id, amount: Number(amount) });
    setBusyId(null);
    fetch_();
  };

  const sendReminder = async (inv: AdminInvoice) => {
    setBusyId(inv.id);
    await whmcsAdmin("adminSendInvoiceReminder", { clientId: inv.userid, invoiceId: inv.id, total: inv.total, dueDate: inv.duedate });
    setBusyId(null);
    alert("Reminder email sent.");
  };

  const createInvoice = async (clientId: number, items: { description: string; amount: number }[], dueDate: string) => {
    setCreateBusy(true);
    const res = await whmcsAdmin<{ invoiceId: number }>("adminCreateInvoice", { clientId, items, dueDate });
    setCreateBusy(false);
    if (res) { setCreateOpen(false); fetch_(); }
  };

  const filtered = search
    ? invoices.filter(i => `${i.firstname} ${i.lastname} ${i.id}`.toLowerCase().includes(search.toLowerCase()))
    : invoices;

  return (
    <>
      <SearchBar value={search} onChange={setSearch} placeholder="Search by client name or invoice #…">
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="px-3 py-2.5 text-sm border-2 border-gray-200 rounded-xl bg-white outline-none focus:border-[#6B21A8] cursor-pointer">
          {STATUSES.map(s => <option key={s} value={s}>{s || "All statuses"}</option>)}
        </select>
        <button onClick={() => setCreateOpen(true)} className="flex items-center gap-1.5 px-4 py-2.5 bg-[#6B21A8] text-white text-sm font-bold rounded-xl hover:bg-[#581c87] transition-colors">
          <Plus className="w-4 h-4" /> Create Invoice
        </button>
      </SearchBar>

      <TableCard>
        <THead cols={["Invoice #", "Client", "Date", "Due Date", "Total", "Status", "Actions"]} />
        <tbody>
          {loading ? <SkeletonRows cols={7} /> : filtered.length === 0 ? <EmptyState icon={<Receipt className="w-5 h-5" />} message="No invoices found" /> : filtered.map(inv => (
            <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <td className="px-5 py-3.5 font-bold text-[#6B21A8]">#{inv.id}</td>
              <td className="px-5 py-3.5 font-medium text-black">{inv.firstname} {inv.lastname}</td>
              <td className="px-5 py-3.5 text-gray-500">{inv.date}</td>
              <td className="px-5 py-3.5 text-gray-500">{inv.duedate}</td>
              <td className="px-5 py-3.5 font-bold text-black">${inv.total}</td>
              <td className="px-5 py-3.5"><Badge status={inv.status} /></td>
              <td className="px-5 py-3.5">
                <div className="flex flex-wrap gap-2">
                  <a href={`/api/invoices/${inv.id}/pdf`} target="_blank" rel="noreferrer" className="text-xs text-gray-500 font-semibold hover:underline">PDF</a>
                  {inv.status !== "Paid" && inv.status !== "Cancelled" && (
                    <>
                      <button onClick={() => markPaid(inv)} disabled={busyId === inv.id} className="text-xs text-green-600 font-semibold hover:underline disabled:opacity-50">Mark Paid</button>
                      <button onClick={() => applyCredit(inv)} disabled={busyId === inv.id} className="text-xs text-blue-600 font-semibold hover:underline disabled:opacity-50">Apply Credit</button>
                      <button onClick={() => sendReminder(inv)} disabled={busyId === inv.id} className="text-xs text-orange-600 font-semibold hover:underline disabled:opacity-50">Remind</button>
                      <button onClick={() => voidInv(inv)} disabled={busyId === inv.id} className="text-xs text-red-600 font-semibold hover:underline disabled:opacity-50">Void</button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </TableCard>
      <Pagination page={page} total={total} perPage={PER} onChange={setPage} />

      {createOpen && <CreateInvoiceModal busy={createBusy} onClose={() => setCreateOpen(false)} onCreate={createInvoice} />}
    </>
  );
}
