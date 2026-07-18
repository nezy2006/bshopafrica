"use client";
import { Globe, Settings } from "lucide-react";

import { useState, useEffect, useCallback } from "react";
import { whmcsAdmin, PageHeader, SearchBar, TableCard, THead, SkeletonRows, Badge, Pagination, EmptyState, Modal } from "@/lib/admin-utils";
import type { AdminDomain, DomainNameservers, WhoisContact } from "@/lib/whmcs";

const PER = 20;
const INPUT = "w-full px-3.5 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm text-black outline-none focus:border-[#6B21A8] focus:bg-white transition-all";

function WhoisBlock({ label, contact }: { label: string; contact: WhoisContact }) {
  const entries = Object.entries(contact).filter(([, v]) => v);
  if (entries.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-bold text-gray-500 uppercase mb-1">{label}</p>
      <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-700 space-y-0.5">
        {entries.map(([k, v]) => <div key={k}>{k}: {v}</div>)}
      </div>
    </div>
  );
}

function ManageDomainModal({ domain, onClose, onDone }: { domain: AdminDomain; onClose: () => void; onDone: () => void }) {
  const [ns, setNs] = useState<DomainNameservers | null>(null);
  const [locked, setLocked] = useState<boolean | null>(null);
  const [whois, setWhois] = useState<{ registrant: WhoisContact; admin: WhoisContact; tech: WhoisContact } | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadingWhois, setLoadingWhois] = useState(false);

  useEffect(() => {
    whmcsAdmin<DomainNameservers>("adminGetDomainNameservers", { domainId: domain.id }).then(setNs);
    whmcsAdmin<{ locked: boolean }>("adminGetDomainLockingStatus", { domainId: domain.id }).then(r => setLocked(r?.locked ?? null));
  }, [domain.id]);

  const saveNs = async () => {
    if (!ns) return;
    setBusy(true);
    await whmcsAdmin("adminUpdateDomainNameservers", { domainId: domain.id, ns });
    setBusy(false);
    alert("Nameservers updated.");
  };

  const toggleLock = async () => {
    if (locked === null) return;
    setBusy(true);
    await whmcsAdmin("adminUpdateDomainLockingStatus", { domainId: domain.id, locked: !locked });
    setLocked(!locked);
    setBusy(false);
  };

  const loadWhois = async () => {
    setLoadingWhois(true);
    const res = await whmcsAdmin<{ registrant: WhoisContact; admin: WhoisContact; tech: WhoisContact }>("adminGetDomainWhois", { domainId: domain.id });
    setWhois(res);
    setLoadingWhois(false);
  };

  const runLifecycle = async (action: string, label: string) => {
    if (!confirm(`${label} for ${domain.domainname}?`)) return;
    setBusy(true);
    await whmcsAdmin(action, { domainId: domain.id });
    setBusy(false);
    onDone();
  };

  return (
    <Modal title={`Manage — ${domain.domainname}`} onClose={onClose} maxWidth="max-w-xl">
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase mb-2">Registrar Actions</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => runLifecycle("adminRegisterDomain", "Complete registration")} disabled={busy} className="text-xs px-3 py-1.5 bg-purple-50 text-[#6B21A8] font-semibold rounded-lg hover:bg-purple-100 disabled:opacity-50">Register</button>
            <button onClick={() => runLifecycle("adminRenewDomain", "Renew")} disabled={busy} className="text-xs px-3 py-1.5 bg-green-50 text-green-700 font-semibold rounded-lg hover:bg-green-100 disabled:opacity-50">Renew</button>
            <button onClick={() => runLifecycle("adminTransferDomain", "Start/retry transfer")} disabled={busy} className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 font-semibold rounded-lg hover:bg-blue-100 disabled:opacity-50">Transfer</button>
          </div>
        </div>

        <div>
          <p className="text-xs font-bold text-gray-500 uppercase mb-2">Domain Lock</p>
          {locked === null ? <p className="text-xs text-gray-400">Loading…</p> : (
            <button onClick={toggleLock} disabled={busy} className={`text-xs px-3 py-1.5 font-semibold rounded-lg disabled:opacity-50 ${locked ? "bg-green-50 text-green-700 hover:bg-green-100" : "bg-red-50 text-red-700 hover:bg-red-100"}`}>
              {locked ? "Locked — Click to Unlock" : "Unlocked — Click to Lock"}
            </button>
          )}
        </div>

        <div>
          <p className="text-xs font-bold text-gray-500 uppercase mb-2">Nameservers</p>
          {!ns ? <p className="text-xs text-gray-400">Loading…</p> : (
            <div className="space-y-2">
              {(["ns1", "ns2", "ns3", "ns4", "ns5"] as const).map(key => (
                <input key={key} value={ns[key]} onChange={e => setNs({ ...ns, [key]: e.target.value })} placeholder={key.toUpperCase()} className={INPUT} />
              ))}
              <button onClick={saveNs} disabled={busy} className="text-xs px-3 py-1.5 bg-[#6B21A8] text-white font-semibold rounded-lg hover:bg-[#581c87] disabled:opacity-50">Save Nameservers</button>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-gray-500 uppercase">WHOIS Info</p>
            <button onClick={loadWhois} disabled={loadingWhois} className="text-xs text-[#6B21A8] font-semibold hover:underline disabled:opacity-50">{loadingWhois ? "Loading…" : "Fetch WHOIS"}</button>
          </div>
          {whois && (
            <div className="space-y-2">
              <WhoisBlock label="Registrant" contact={whois.registrant} />
              <WhoisBlock label="Admin" contact={whois.admin} />
              <WhoisBlock label="Tech" contact={whois.tech} />
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default function DomainsPage() {
  const [domains,  setDomains]  = useState<AdminDomain[]>([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [search,   setSearch]   = useState("");
  const [loading,  setLoading]  = useState(true);
  const [expiring, setExpiring] = useState(false);
  const [busyId,   setBusyId]   = useState<number | null>(null);
  const [manageDomain, setManageDomain] = useState<AdminDomain | null>(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const res = await whmcsAdmin<{ domains: AdminDomain[]; total: number }>(
      "adminGetDomains", { limitstart: (page - 1) * PER, limitnum: PER }
    );
    if (res) { setDomains(res.domains); setTotal(res.total); }
    setLoading(false);
  }, [page]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const toggleAutoRenew = async (d: AdminDomain) => {
    setBusyId(d.id);
    await whmcsAdmin("adminUpdateDomainAutoRenew", { domainId: d.id, autoRenew: !d.autorenew });
    setBusyId(null);
    fetch_();
  };

  const soon = new Date(); soon.setDate(soon.getDate() + 30);
  const filtered = domains
    .filter(d => !search || d.domainname.toLowerCase().includes(search.toLowerCase()) || `${d.firstname} ${d.lastname}`.toLowerCase().includes(search.toLowerCase()))
    .filter(d => !expiring || (d.expirydate && new Date(d.expirydate) <= soon));

  return (
    <div>
      <PageHeader title="Domains" subtitle={`${total} registered domains`} />
      <SearchBar value={search} onChange={setSearch} placeholder="Search by domain name or client…">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-600 px-3 py-2.5 border-2 border-gray-200 rounded-xl bg-white cursor-pointer hover:border-[#6B21A8] transition-all">
          <input type="checkbox" checked={expiring} onChange={e => setExpiring(e.target.checked)} className="accent-[#6B21A8]" />
          Expiring soon
        </label>
      </SearchBar>

      <TableCard>
        <THead cols={["Domain", "Client", "Status", "Registration Date", "Next Due Date", "Auto Renew", "Actions"]} />
        <tbody>
          {loading ? <SkeletonRows cols={7} /> : filtered.length === 0 ? <EmptyState icon={<Globe className="w-5 h-5" />} message="No domains found" /> : filtered.map(d => (
            <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <td className="px-5 py-3.5 font-bold text-[#6B21A8]">{d.domainname}</td>
              <td className="px-5 py-3.5 text-gray-700">{d.firstname} {d.lastname}</td>
              <td className="px-5 py-3.5"><Badge status={d.status} /></td>
              <td className="px-5 py-3.5 text-gray-500">{d.registrationdate || "—"}</td>
              <td className="px-5 py-3.5 text-gray-500">{d.nextduedate || "—"}</td>
              <td className="px-5 py-3.5">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${d.autorenew ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />{d.autorenew ? "On" : "Off"}
                </span>
              </td>
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleAutoRenew(d)} disabled={busyId === d.id}
                    className="text-xs text-[#6B21A8] font-semibold hover:underline disabled:opacity-50">
                    {busyId === d.id ? "Saving…" : d.autorenew ? "Turn off" : "Turn on"}
                  </button>
                  <button onClick={() => setManageDomain(d)} title="Manage domain" className="text-gray-400 hover:text-[#6B21A8]"><Settings className="w-3.5 h-3.5" /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </TableCard>
      <Pagination page={page} total={total} perPage={PER} onChange={setPage} />

      {manageDomain && <ManageDomainModal domain={manageDomain} onClose={() => setManageDomain(null)} onDone={() => { setManageDomain(null); fetch_(); }} />}
    </div>
  );
}
