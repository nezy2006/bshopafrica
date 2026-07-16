"use client";
import { Users, LogIn, Copy, Check, X, Mail, Wallet, Ban, CheckCircle2 } from "lucide-react";

import { useState, useEffect, useCallback } from "react";
import { whmcsAdmin, PageHeader, SearchBar, TableCard, THead, SkeletonRows, Badge, Pagination, EmptyState } from "@/lib/admin-utils";
import { adminHeaders } from "@/lib/admin-auth-client";
import type { AdminClient, ClientDetails, ClientProduct, ClientDomain, ClientOrder, ClientInvoice } from "@/lib/whmcs";

const PER = 20;

interface ProfileData {
  details: ClientDetails; products: ClientProduct[]; domains: ClientDomain[];
  orders: ClientOrder[]; invoices: ClientInvoice[];
}

function EmailModal({ client, onClose }: { client: AdminClient; onClose: () => void }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const res = await whmcsAdmin("adminSendClientEmail", { clientId: client.id, subject, message });
    setBusy(false);
    if (res !== null) setSent(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Email {client.firstname} {client.lastname}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        {sent ? (
          <p className="text-sm text-green-600 font-semibold py-6 text-center">Email sent.</p>
        ) : (
          <form onSubmit={send} className="space-y-3">
            <input value={subject} onChange={e => setSubject(e.target.value)} required placeholder="Subject"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#6B21A8]" />
            <textarea value={message} onChange={e => setMessage(e.target.value)} required rows={5} placeholder="Message"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#6B21A8] resize-none" />
            <button type="submit" disabled={busy} className="w-full py-3 bg-[#6B21A8] text-white font-semibold rounded-xl disabled:opacity-60 hover:bg-[#581c87] transition-colors">
              {busy ? "Sending…" : "Send Email"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function CreditModal({ client, onClose, onDone }: { client: AdminClient; onClose: () => void; onDone: () => void }) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const res = await whmcsAdmin("adminAddCredit", { clientId: client.id, amount: Number(amount), description });
    setBusy(false);
    if (res !== null) onDone();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Add Credit</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="Amount (USD)"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#6B21A8]" />
          <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#6B21A8]" />
          <button type="submit" disabled={busy || !amount} className="w-full py-3 bg-[#6B21A8] text-white font-semibold rounded-xl disabled:opacity-60 hover:bg-[#581c87] transition-colors">
            {busy ? "Applying…" : "Add Credit"}
          </button>
        </form>
      </div>
    </div>
  );
}

function ProfileModal({ client, onClose }: { client: AdminClient; onClose: () => void }) {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await whmcsAdmin<ProfileData>("adminGetClientDetails", { clientId: client.id });
      setData(res);
      setLoading(false);
    })();
  }, [client.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{client.firstname} {client.lastname}</h3>
            <p className="text-sm text-gray-400">{client.email}</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        {loading || !data ? (
          <div className="py-16 flex justify-center"><div className="w-8 h-8 rounded-full border-4 border-[#6B21A8] border-t-transparent animate-spin" /></div>
        ) : (
          <div className="space-y-6">
            <section>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Hosting ({data.products.length})</h4>
              {data.products.length === 0 ? <p className="text-sm text-gray-400">None</p> : (
                <div className="space-y-1.5">
                  {data.products.map(p => (
                    <div key={p.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                      <span className="font-medium text-gray-800">{p.name} — {p.domain}</span>
                      <Badge status={p.status} />
                    </div>
                  ))}
                </div>
              )}
            </section>
            <section>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Domains ({data.domains.length})</h4>
              {data.domains.length === 0 ? <p className="text-sm text-gray-400">None</p> : (
                <div className="space-y-1.5">
                  {data.domains.map(d => (
                    <div key={d.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                      <span className="font-medium text-gray-800">{d.domainname}</span>
                      <span className="text-gray-400 text-xs">Expires {d.expirydate}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
            <section>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Orders ({data.orders.length})</h4>
              {data.orders.length === 0 ? <p className="text-sm text-gray-400">None</p> : (
                <div className="space-y-1.5">
                  {data.orders.map(o => (
                    <div key={o.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                      <span className="font-medium text-gray-800">#{o.id} — ${o.total}</span>
                      <Badge status={o.status} />
                    </div>
                  ))}
                </div>
              )}
            </section>
            <section>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Invoices ({data.invoices.length})</h4>
              {data.invoices.length === 0 ? <p className="text-sm text-gray-400">None</p> : (
                <div className="space-y-1.5">
                  {data.invoices.map(i => (
                    <div key={i.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                      <span className="font-medium text-gray-800">#{i.id} — ${i.total}</span>
                      <Badge status={i.status} />
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ClientsPage() {
  const [clients, setClients] = useState<AdminClient[]>([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [search,  setSearch]  = useState("");
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [busyId,   setBusyId]   = useState<number | null>(null);
  const [profileTarget, setProfileTarget] = useState<AdminClient | null>(null);
  const [emailTarget,   setEmailTarget]   = useState<AdminClient | null>(null);
  const [creditTarget,  setCreditTarget]  = useState<AdminClient | null>(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const res = await whmcsAdmin<{ clients: AdminClient[]; total: number }>(
      "adminGetClients", { limitstart: (page - 1) * PER, limitnum: PER, search }
    );
    if (res) { setClients(res.clients); setTotal(res.total); }
    setLoading(false);
  }, [page, search]);

  useEffect(() => { const t = setTimeout(fetch_, 300); return () => clearTimeout(t); }, [fetch_]);

  const getImpersonateUrl = async (clientId: number): Promise<string | null> => {
    try {
      const res  = await fetch(`/api/auth/sso?clientId=${clientId}`, { headers: adminHeaders() });
      const json = await res.json() as { success: boolean; token?: string; error?: string };
      if (!json.success || !json.token) { alert(json.error ?? "Could not generate login link."); return null; }
      return `${window.location.origin}/impersonate?client_id=${clientId}&token=${encodeURIComponent(json.token)}`;
    } catch {
      alert("Something went wrong. Please try again.");
      return null;
    }
  };

  const handleLoginAsClient = async (clientId: number) => {
    setBusyId(clientId);
    const url = await getImpersonateUrl(clientId);
    setBusyId(null);
    if (url) window.open(url, "_blank");
  };

  const handleCopyLink = async (clientId: number) => {
    setBusyId(clientId);
    const url = await getImpersonateUrl(clientId);
    setBusyId(null);
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(clientId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      alert("Could not copy link.");
    }
  };

  const toggleSuspend = async (c: AdminClient) => {
    const newStatus = c.status === "Active" ? "Inactive" : "Active";
    if (!confirm(`${newStatus === "Inactive" ? "Suspend" : "Activate"} ${c.firstname} ${c.lastname}?`)) return;
    setBusyId(c.id);
    await whmcsAdmin("adminUpdateClientStatus", { clientId: c.id, status: newStatus });
    setBusyId(null);
    fetch_();
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
              <td className="px-5 py-3.5 font-semibold text-black">
                <button onClick={() => setProfileTarget(c)} className="hover:text-[#6B21A8] hover:underline">{c.firstname} {c.lastname}</button>
              </td>
              <td className="px-5 py-3.5 text-gray-500 text-xs">{c.email}</td>
              <td className="px-5 py-3.5 text-gray-500">{c.phonenumber || "—"}</td>
              <td className="px-5 py-3.5 text-gray-500">{c.country || "—"}</td>
              <td className="px-5 py-3.5 text-gray-400 text-xs">{c.datecreated}</td>
              <td className="px-5 py-3.5"><Badge status={c.status} /></td>
              <td className="px-5 py-3.5 text-right">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => handleLoginAsClient(c.id)}
                    disabled={busyId === c.id}
                    title="Open impersonation link in a new tab"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-[#6B21A8] bg-purple-50 hover:bg-purple-100 transition-colors disabled:opacity-50"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleCopyLink(c.id)}
                    disabled={busyId === c.id}
                    title="Copy impersonation link"
                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 bg-gray-50 hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-50"
                  >
                    {copiedId === c.id ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => setEmailTarget(c)} title="Send email" className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 bg-gray-50 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                    <Mail className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setCreditTarget(c)} title="Add credit" className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 bg-gray-50 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                    <Wallet className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => toggleSuspend(c)} disabled={busyId === c.id} title={c.status === "Active" ? "Suspend" : "Activate"}
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors disabled:opacity-50 ${c.status === "Active" ? "text-red-500 bg-red-50 hover:bg-red-100" : "text-green-600 bg-green-50 hover:bg-green-100"}`}>
                    {c.status === "Active" ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </TableCard>
      <Pagination page={page} total={total} perPage={PER} onChange={setPage} />

      {profileTarget && <ProfileModal client={profileTarget} onClose={() => setProfileTarget(null)} />}
      {emailTarget && <EmailModal client={emailTarget} onClose={() => setEmailTarget(null)} />}
      {creditTarget && <CreditModal client={creditTarget} onClose={() => setCreditTarget(null)} onDone={() => setCreditTarget(null)} />}
    </div>
  );
}
