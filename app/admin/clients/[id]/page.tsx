"use client";
import {
  ArrowLeft, LogIn, Mail, Wallet, MinusCircle, Ban, CheckCircle2, KeyRound,
  Trash2, Server, Globe, Receipt, CreditCard, MessageSquare, StickyNote, History, User,
} from "lucide-react";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Tabs, Modal, Badge, EmptyState, TableCard, THead } from "@/lib/admin-utils";
import { adminHeaders, getCurrentAdmin } from "@/lib/admin-auth-client";
import type {
  ClientDetails, ClientProduct, ClientDomain, ClientInvoice, ClientOrder,
  SupportTicket, ClientEmailLogEntry, ActivityLogEntryWhmcs,
} from "@/lib/whmcs";

interface ClientNote { id: number; client_id: number; admin_id: number; admin_name: string; note: string; created_at: string }
interface OurLogEntry { id: number; admin_id: number; admin_name: string; action: string; details: string | null; created_at: string }
interface UnifiedTxn { id: string; date: string; amountUSD: number; amountLocal: number | null; currency: string; method: string; status: string; reference: string; invoiceId: number | null }

interface ProfileData {
  details: ClientDetails; products: ClientProduct[]; domains: ClientDomain[];
  invoices: ClientInvoice[]; orders: ClientOrder[]; tickets: SupportTicket[];
  emails: ClientEmailLogEntry[]; whmcsLog: ActivityLogEntryWhmcs[]; ourLog: OurLogEntry[];
  notes: ClientNote[]; transactions: UnifiedTxn[];
}

const INPUT = "w-full px-3.5 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm text-black outline-none focus:border-[#6B21A8] focus:bg-white transition-all";

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-xl font-black text-black mt-1">{value}</p>
    </div>
  );
}

export default function ClientProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const clientId = Number(params.id);
  const me = getCurrentAdmin();

  const [data, setData]       = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState("summary");
  const [busy, setBusy]       = useState(false);
  const [modal, setModal]     = useState<"email" | "credit" | "debit" | "password" | "delete" | null>(null);
  const [profileForm, setProfileForm] = useState<Record<string, string>>({});
  const [noteText, setNoteText] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/admin/clients/${clientId}`, { headers: adminHeaders() });
      const json = await res.json() as { success: boolean; data?: ProfileData };
      if (json.success && json.data) {
        setData(json.data);
        const d = json.data.details;
        setProfileForm({ firstname: d.firstname, lastname: d.lastname, email: d.email, phonenumber: d.phonenumber, companyname: d.companyname, address1: d.address1, city: d.city, state: d.state, postcode: d.postcode, country: d.country });
      }
    } catch { /* offline */ }
    setLoading(false);
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  const runAction = async (body: Record<string, unknown>): Promise<boolean> => {
    setBusy(true);
    try {
      const res  = await fetch(`/api/admin/clients/${clientId}`, { method: "POST", headers: { "Content-Type": "application/json", ...adminHeaders() }, body: JSON.stringify(body) });
      const json = await res.json() as { success: boolean; error?: string };
      if (!json.success) { alert(json.error ?? "Action failed"); return false; }
      await load();
      return true;
    } finally { setBusy(false); }
  };

  const handleLoginAsClient = async () => {
    setBusy(true);
    try {
      const res  = await fetch(`/api/auth/sso?clientId=${clientId}`, { headers: adminHeaders() });
      const json = await res.json() as { success: boolean; token?: string; error?: string };
      if (!json.success || !json.token) { alert(json.error ?? "Could not generate login link."); return; }
      window.open(`${window.location.origin}/impersonate?client_id=${clientId}&token=${encodeURIComponent(json.token)}`, "_blank");
    } catch { alert("Something went wrong."); }
    setBusy(false);
  };

  if (loading || !data) {
    return <div className="flex justify-center py-24"><div className="w-8 h-8 rounded-full border-4 border-[#6B21A8] border-t-transparent animate-spin" /></div>;
  }

  const { details, products, domains, invoices, tickets, emails, whmcsLog, ourLog, notes, transactions } = data;
  const openTickets = tickets.filter(t => t.status !== "Closed").length;

  const combinedLog = [
    ...whmcsLog.map(l => ({ date: l.date, who: l.username || "System", what: l.description })),
    ...ourLog.map(l => ({ date: l.created_at, who: l.admin_name, what: `${l.action.replace(/_/g, " ")}${l.details ? ` — ${l.details}` : ""}` })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const TABS = [
    { id: "summary",  label: "Summary" },
    { id: "profile",  label: "Profile" },
    { id: "services", label: `Services (${products.length})` },
    { id: "domains",  label: `Domains (${domains.length})` },
    { id: "invoices", label: `Invoices (${invoices.length})` },
    { id: "txns",     label: "Transactions" },
    { id: "tickets",  label: `Tickets (${tickets.length})` },
    { id: "emails",   label: "Emails" },
    { id: "notes",    label: `Notes (${notes.length})` },
    { id: "log",      label: "Log" },
  ];

  return (
    <div className="max-w-5xl">
      <button onClick={() => router.push("/admin/clients")} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to clients
      </button>

      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-xl font-black text-black">{details.firstname} {details.lastname}</h1>
          <p className="text-sm text-gray-400 mt-1">{details.email} · Client #{details.id} · Joined {details.datecreated}</p>
        </div>
        <Badge status={details.status} />
      </div>

      {/* Actions toolbar */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={handleLoginAsClient} disabled={busy} className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-[#6B21A8] bg-purple-50 rounded-lg hover:bg-purple-100 disabled:opacity-50"><LogIn className="w-3.5 h-3.5" /> Login as Client</button>
        <button onClick={() => setModal("email")} disabled={busy} className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"><Mail className="w-3.5 h-3.5" /> Send Email</button>
        <button onClick={() => setModal("credit")} disabled={busy} className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-green-700 bg-green-50 rounded-lg hover:bg-green-100 disabled:opacity-50"><Wallet className="w-3.5 h-3.5" /> Add Credit</button>
        <button onClick={() => setModal("debit")} disabled={busy} className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-orange-700 bg-orange-50 rounded-lg hover:bg-orange-100 disabled:opacity-50"><MinusCircle className="w-3.5 h-3.5" /> Add Debit</button>
        <button onClick={() => { if (confirm("Suspend all active services for this client?")) runAction({ action: "suspendAll" }); }} disabled={busy} className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50"><Ban className="w-3.5 h-3.5" /> Suspend All</button>
        <button onClick={() => runAction({ action: "unsuspendAll" })} disabled={busy} className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-green-700 bg-green-50 rounded-lg hover:bg-green-100 disabled:opacity-50"><CheckCircle2 className="w-3.5 h-3.5" /> Unsuspend All</button>
        <button onClick={() => setModal("password")} disabled={busy} className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"><KeyRound className="w-3.5 h-3.5" /> Change Password</button>
        {me?.role === "super_admin" && (
          <button onClick={() => setModal("delete")} disabled={busy} className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"><Trash2 className="w-3.5 h-3.5" /> Delete Client</button>
        )}
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === "summary" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatBox label="Account Balance" value={`$${details.credit}`} />
            <StatBox label="Active Services" value={products.filter(p => p.status === "Active").length} />
            <StatBox label="Domains" value={domains.length} />
            <StatBox label="Open Tickets" value={openTickets} />
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 grid sm:grid-cols-2 gap-4 text-sm">
            <div><p className="text-gray-400 text-xs font-semibold uppercase mb-1">Phone</p><p className="text-black font-medium">{details.phonenumber || "—"}</p></div>
            <div><p className="text-gray-400 text-xs font-semibold uppercase mb-1">Company</p><p className="text-black font-medium">{details.companyname || "—"}</p></div>
            <div><p className="text-gray-400 text-xs font-semibold uppercase mb-1">Last Login</p><p className="text-black font-medium">{details.lastlogin || "Never"}</p></div>
            <div><p className="text-gray-400 text-xs font-semibold uppercase mb-1">Address</p><p className="text-black font-medium">{[details.address1, details.city, details.state, details.postcode, details.country].filter(Boolean).join(", ") || "—"}</p></div>
          </div>
        </div>
      )}

      {tab === "profile" && (
        <form onSubmit={async e => { e.preventDefault(); await runAction({ action: "updateProfile", updates: profileForm }); }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            {[["firstname", "First Name"], ["lastname", "Last Name"], ["email", "Email"], ["phonenumber", "Phone"], ["companyname", "Company"], ["address1", "Address"], ["city", "City"], ["state", "State/Province"], ["postcode", "Postcode"], ["country", "Country"]].map(([k, label]) => (
              <div key={k}>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">{label}</label>
                <input value={profileForm[k] ?? ""} onChange={e => setProfileForm(f => ({ ...f, [k]: e.target.value }))} className={INPUT} />
              </div>
            ))}
          </div>
          <button type="submit" disabled={busy} className="px-6 py-2.5 bg-[#6B21A8] text-white text-sm font-bold rounded-xl hover:bg-[#581c87] disabled:opacity-50">Save Changes</button>
        </form>
      )}

      {tab === "services" && (
        <TableCard>
          <THead cols={["Product", "Domain", "Billing", "Amount", "Next Due", "Status"]} />
          <tbody>
            {products.length === 0 ? <EmptyState icon={<Server className="w-5 h-5" />} message="No services" /> : products.map(p => (
              <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-5 py-3.5 font-bold text-[#6B21A8]">{p.name}</td>
                <td className="px-5 py-3.5 text-gray-600">{p.domain || "—"}</td>
                <td className="px-5 py-3.5 text-gray-500 capitalize">{p.billingcycle}</td>
                <td className="px-5 py-3.5 font-semibold">${p.amount}</td>
                <td className="px-5 py-3.5 text-gray-500">{p.nextduedate}</td>
                <td className="px-5 py-3.5"><Badge status={p.status} /></td>
              </tr>
            ))}
          </tbody>
        </TableCard>
      )}

      {tab === "domains" && (
        <TableCard>
          <THead cols={["Domain", "Registered", "Expires", "Auto Renew", "Status"]} />
          <tbody>
            {domains.length === 0 ? <EmptyState icon={<Globe className="w-5 h-5" />} message="No domains" /> : domains.map(d => (
              <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-5 py-3.5 font-bold text-[#6B21A8]">{d.domainname}</td>
                <td className="px-5 py-3.5 text-gray-500">{d.nextduedate}</td>
                <td className="px-5 py-3.5 text-gray-500">{d.expirydate}</td>
                <td className="px-5 py-3.5 text-gray-500">{d.autorenew ? "On" : "Off"}</td>
                <td className="px-5 py-3.5"><Badge status={d.status} /></td>
              </tr>
            ))}
          </tbody>
        </TableCard>
      )}

      {tab === "invoices" && (
        <TableCard>
          <THead cols={["Invoice #", "Date", "Due Date", "Total", "Status", "Actions"]} />
          <tbody>
            {invoices.length === 0 ? <EmptyState icon={<Receipt className="w-5 h-5" />} message="No invoices" /> : invoices.map(inv => (
              <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-5 py-3.5 font-bold text-[#6B21A8]">#{inv.id}</td>
                <td className="px-5 py-3.5 text-gray-500">{inv.date}</td>
                <td className="px-5 py-3.5 text-gray-500">{inv.duedate}</td>
                <td className="px-5 py-3.5 font-semibold">${inv.total}</td>
                <td className="px-5 py-3.5"><Badge status={inv.status} /></td>
                <td className="px-5 py-3.5">
                  <a href={`/api/invoices/${inv.id}/pdf`} target="_blank" rel="noreferrer" className="text-xs text-[#6B21A8] font-semibold hover:underline">PDF</a>
                </td>
              </tr>
            ))}
          </tbody>
        </TableCard>
      )}

      {tab === "txns" && (
        <TableCard>
          <THead cols={["Date", "Amount", "Method", "Status", "Reference"]} />
          <tbody>
            {transactions.length === 0 ? <EmptyState icon={<CreditCard className="w-5 h-5" />} message="No transactions" /> : transactions.map(t => (
              <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-5 py-3.5 text-gray-400 text-xs whitespace-nowrap">{new Date(t.date).toLocaleString()}</td>
                <td className="px-5 py-3.5 font-bold">${t.amountUSD.toFixed(2)}{t.amountLocal ? <span className="text-gray-400 font-normal"> · {t.currency} {t.amountLocal.toLocaleString()}</span> : null}</td>
                <td className="px-5 py-3.5 text-gray-600">{t.method}</td>
                <td className="px-5 py-3.5"><Badge status={t.status} /></td>
                <td className="px-5 py-3.5 text-gray-400 text-xs font-mono">{t.reference}</td>
              </tr>
            ))}
          </tbody>
        </TableCard>
      )}

      {tab === "tickets" && (
        <TableCard>
          <THead cols={["Ticket #", "Subject", "Department", "Status", "Last Reply"]} />
          <tbody>
            {tickets.length === 0 ? <EmptyState icon={<MessageSquare className="w-5 h-5" />} message="No tickets" /> : tickets.map(t => (
              <tr key={t.id} onClick={() => router.push(`/admin/tickets/${t.id}`)} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer">
                <td className="px-5 py-3.5 font-bold text-[#6B21A8]">{t.tid}</td>
                <td className="px-5 py-3.5 font-medium text-black">{t.title}</td>
                <td className="px-5 py-3.5 text-gray-500">{t.deptname}</td>
                <td className="px-5 py-3.5"><Badge status={t.status} /></td>
                <td className="px-5 py-3.5 text-gray-400 text-xs">{t.lastreply}</td>
              </tr>
            ))}
          </tbody>
        </TableCard>
      )}

      {tab === "emails" && (
        <TableCard>
          <THead cols={["Subject", "To", "Date", "Status"]} />
          <tbody>
            {emails.length === 0 ? <EmptyState icon={<Mail className="w-5 h-5" />} message="No emails sent to this client" /> : emails.map(e => (
              <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-5 py-3.5 font-medium text-black">{e.subject}</td>
                <td className="px-5 py-3.5 text-gray-500 text-xs">{e.to}</td>
                <td className="px-5 py-3.5 text-gray-400 text-xs">{e.date}</td>
                <td className="px-5 py-3.5">{e.failed ? <Badge status="Failed" /> : <Badge status="Sent" />}</td>
              </tr>
            ))}
          </tbody>
        </TableCard>
      )}

      {tab === "notes" && (
        <div className="space-y-4">
          <form onSubmit={async e => { e.preventDefault(); if (!noteText.trim()) return; const ok = await runAction({ action: "addNote", note: noteText }); if (ok) setNoteText(""); }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={3} placeholder="Internal note about this client — not visible to them…" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#6B21A8] resize-none" />
            <div className="flex justify-end mt-2">
              <button type="submit" disabled={busy || !noteText.trim()} className="flex items-center gap-2 px-5 py-2 bg-[#6B21A8] text-white text-sm font-bold rounded-xl hover:bg-[#581c87] disabled:opacity-50"><StickyNote className="w-4 h-4" /> Add Note</button>
            </div>
          </form>
          <div className="space-y-2">
            {notes.length === 0 ? <p className="text-sm text-gray-400 text-center py-8">No notes yet</p> : notes.map(n => (
              <div key={n.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{n.note}</p>
                  <p className="text-xs text-gray-400 mt-1.5">{n.admin_name} · {new Date(n.created_at).toLocaleString()}</p>
                </div>
                <button onClick={() => runAction({ action: "deleteNote", noteId: n.id })} className="text-gray-300 hover:text-red-500 flex-shrink-0"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "log" && (
        <div className="space-y-2">
          {combinedLog.length === 0 ? <p className="text-sm text-gray-400 text-center py-8">No activity recorded</p> : combinedLog.map((l, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-xl p-3.5 flex items-start gap-3">
              <History className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-gray-700">{l.what}</p>
                <p className="text-xs text-gray-400 mt-0.5">{l.who} · {new Date(l.date).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {modal === "email" && (
        <EmailModal busy={busy} onClose={() => setModal(null)} onSend={async (subject, message) => { const ok = await runAction({ action: "sendEmail", subject, message }); if (ok) setModal(null); }} />
      )}
      {(modal === "credit" || modal === "debit") && (
        <AmountModal
          title={modal === "credit" ? "Add Credit" : "Add Debit"}
          busy={busy}
          onClose={() => setModal(null)}
          onSubmit={async (amount, description) => { const ok = await runAction({ action: modal === "credit" ? "addCredit" : "addDebit", amount, description }); if (ok) setModal(null); }}
        />
      )}
      {modal === "password" && (
        <PasswordModal busy={busy} onClose={() => setModal(null)} onSubmit={async password => { const ok = await runAction({ action: "changePassword", password }); if (ok) setModal(null); }} />
      )}
      {modal === "delete" && (
        <DeleteClientModal name={`${details.firstname} ${details.lastname}`} busy={busy} onClose={() => setModal(null)} onConfirm={async () => { const ok = await runAction({ action: "delete" }); if (ok) router.push("/admin/clients"); }} />
      )}
    </div>
  );
}

function EmailModal({ busy, onClose, onSend }: { busy: boolean; onClose: () => void; onSend: (subject: string, message: string) => void }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  return (
    <Modal title="Send Email" onClose={onClose}>
      <form onSubmit={e => { e.preventDefault(); onSend(subject, message); }} className="space-y-3">
        <input value={subject} onChange={e => setSubject(e.target.value)} required placeholder="Subject" className={INPUT} />
        <textarea value={message} onChange={e => setMessage(e.target.value)} required rows={5} placeholder="Message" className={`${INPUT} resize-none`} />
        <button type="submit" disabled={busy} className="w-full py-3 bg-[#6B21A8] text-white font-semibold rounded-xl disabled:opacity-60 hover:bg-[#581c87] transition-colors">{busy ? "Sending…" : "Send Email"}</button>
      </form>
    </Modal>
  );
}

function AmountModal({ title, busy, onClose, onSubmit }: { title: string; busy: boolean; onClose: () => void; onSubmit: (amount: number, description: string) => void }) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={e => { e.preventDefault(); onSubmit(Number(amount), description); }} className="space-y-3">
        <input type="number" step="0.01" min="0.01" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="Amount (USD)" className={INPUT} />
        <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)" className={INPUT} />
        <button type="submit" disabled={busy || !amount} className="w-full py-3 bg-[#6B21A8] text-white font-semibold rounded-xl disabled:opacity-60 hover:bg-[#581c87] transition-colors">{busy ? "Saving…" : title}</button>
      </form>
    </Modal>
  );
}

function PasswordModal({ busy, onClose, onSubmit }: { busy: boolean; onClose: () => void; onSubmit: (password: string) => void }) {
  const [password, setPassword] = useState("");
  return (
    <Modal title="Change Client Password" onClose={onClose}>
      <form onSubmit={e => { e.preventDefault(); onSubmit(password); }} className="space-y-3">
        <input type="text" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} placeholder="New password (min. 8 characters)" className={INPUT} />
        <button type="submit" disabled={busy || password.length < 8} className="w-full py-3 bg-[#6B21A8] text-white font-semibold rounded-xl disabled:opacity-60 hover:bg-[#581c87] transition-colors">{busy ? "Saving…" : "Change Password"}</button>
      </form>
    </Modal>
  );
}

function DeleteClientModal({ name, busy, onClose, onConfirm }: { name: string; busy: boolean; onClose: () => void; onConfirm: () => void }) {
  const [typed, setTyped] = useState("");
  return (
    <Modal title="Delete Client" onClose={onClose}>
      <div className="space-y-3">
        <p className="text-sm text-red-600 font-semibold flex items-center gap-2"><User className="w-4 h-4" /> This permanently deletes {name} and all associated WHMCS data. This cannot be undone.</p>
        <p className="text-sm text-gray-600">Type <span className="font-bold">{name}</span> to confirm.</p>
        <input value={typed} onChange={e => setTyped(e.target.value)} className={INPUT} />
        <button disabled={busy || typed !== name} onClick={onConfirm} className="w-full py-3 bg-red-600 text-white font-semibold rounded-xl disabled:opacity-40 hover:bg-red-700 transition-colors">{busy ? "Deleting…" : "Delete Client Permanently"}</button>
      </div>
    </Modal>
  );
}
