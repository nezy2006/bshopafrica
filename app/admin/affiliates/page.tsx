"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Info, Eye, Ban, CheckCircle2, Settings2 } from "lucide-react";
import { PageHeader, Tabs, TableCard, THead, EmptyState, Modal, Badge, StatCard, SearchBar, whmcsAdmin } from "@/lib/admin-utils";
import { adminHeaders } from "@/lib/admin-auth-client";
import type { AdminAffiliate, AffiliateCommissionRow, AffiliateWithdrawalRequest } from "@/lib/whmcs";

interface AdminAffiliateRow extends AdminAffiliate {
  status: "active" | "inactive";
  commissionRateOverride: number | null;
  tier: string | null;
  referralCode: string | null;
}

const INPUT = "w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm text-black outline-none focus:border-[#6B21A8] focus:bg-white focus:shadow-[0_0_0_4px_rgba(107,33,168,0.1)] transition-all";

function IconDollar() { return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round"/></svg>; }
function IconUsers()  { return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>; }
function IconWallet() { return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></svg>; }

/* ─── Adjust Commission modal ────────────────────────────────────────────── */
function AdjustCommissionModal({ affiliate, onClose, onSaved }: { affiliate: AdminAffiliateRow; onClose: () => void; onSaved: () => void }) {
  const [rate,        setRate]        = useState(affiliate.commissionRateOverride !== null ? String(affiliate.commissionRateOverride) : "");
  const [savingRate,  setSavingRate]  = useState(false);

  const [manualAmount, setManualAmount] = useState("");
  const [manualDesc,    setManualDesc]  = useState("Manual affiliate commission (offline referral)");
  const [savingManual,  setSavingManual] = useState(false);

  const [creditAmount, setCreditAmount] = useState("");
  const [savingCredit,  setSavingCredit] = useState(false);

  const [msg, setMsg] = useState("");

  async function saveRate() {
    setSavingRate(true); setMsg("");
    const value = rate.trim() === "" ? null : Number(rate);
    const ok = await whmcsAdmin("adminSetAffiliateCommissionOverride", { clientId: affiliate.clientId, affiliateId: affiliate.affiliateId, rate: value });
    setSavingRate(false);
    if (ok !== null) { setMsg("Commission rate override saved."); onSaved(); } else setMsg("Failed to save rate.");
  }

  async function addManual() {
    const amount = Number(manualAmount);
    if (!(amount > 0)) return;
    setSavingManual(true); setMsg("");
    const ok = await whmcsAdmin("adminAddAffiliateCommission", { clientId: affiliate.clientId, amount, description: manualDesc });
    setSavingManual(false);
    if (ok !== null) { setMsg(`Added $${amount.toFixed(2)} commission credit.`); setManualAmount(""); onSaved(); } else setMsg("Failed to add commission.");
  }

  async function addCredit() {
    const amount = Number(creditAmount);
    if (!(amount > 0)) return;
    setSavingCredit(true); setMsg("");
    const ok = await whmcsAdmin("adminAddAffiliateCommission", { clientId: affiliate.clientId, amount, description: "Admin credit adjustment to affiliate balance" });
    setSavingCredit(false);
    if (ok !== null) { setMsg(`Added $${amount.toFixed(2)} credit.`); setCreditAmount(""); onSaved(); } else setMsg("Failed to add credit.");
  }

  return (
    <Modal title={`Adjust Commission — ${affiliate.firstname} ${affiliate.lastname}`} onClose={onClose}>
      <div className="space-y-6">
        <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-800">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
          WHMCS has no remote API to change an affiliate&apos;s live commission rate, so the override below is tracked in our own records for reference. Manual commission and credit entries below use WHMCS&apos;s real credit API and post directly to the client&apos;s account.
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Commission Rate Override (%)</label>
          <div className="flex gap-2">
            <input type="number" step="0.01" value={rate} onChange={e => setRate(e.target.value)} placeholder={affiliate.payAmount ? `Default: ${affiliate.payAmount}` : "No override"} className={INPUT} />
            <button onClick={saveRate} disabled={savingRate} className="px-5 py-2.5 bg-[#6B21A8] text-white text-sm font-bold rounded-xl disabled:opacity-50 hover:bg-[#581c87] whitespace-nowrap">{savingRate ? "Saving…" : "Save"}</button>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Add Manual Commission (offline referral)</label>
          <div className="space-y-2">
            <input type="number" step="0.01" min={0} value={manualAmount} onChange={e => setManualAmount(e.target.value)} placeholder="Amount (USD)" className={INPUT} />
            <input value={manualDesc} onChange={e => setManualDesc(e.target.value)} placeholder="Description" className={INPUT} />
            <button onClick={addManual} disabled={savingManual || !(Number(manualAmount) > 0)} className="w-full py-2.5 bg-[#6B21A8] text-white text-sm font-bold rounded-xl disabled:opacity-50 hover:bg-[#581c87]">{savingManual ? "Adding…" : "Add Commission"}</button>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Add Credit to Balance</label>
          <div className="flex gap-2">
            <input type="number" step="0.01" min={0} value={creditAmount} onChange={e => setCreditAmount(e.target.value)} placeholder="Amount (USD)" className={INPUT} />
            <button onClick={addCredit} disabled={savingCredit || !(Number(creditAmount) > 0)} className="px-5 py-2.5 bg-gray-800 text-white text-sm font-bold rounded-xl disabled:opacity-50 hover:bg-black whitespace-nowrap">{savingCredit ? "Adding…" : "Add"}</button>
          </div>
        </div>

        {msg && <p className="text-sm text-green-600 font-medium">{msg}</p>}
      </div>
    </Modal>
  );
}

/* ─── Tab 1: All Affiliates ──────────────────────────────────────────────── */
function AllAffiliatesTab() {
  const [affiliates, setAffiliates] = useState<AdminAffiliateRow[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [adjustTarget, setAdjustTarget] = useState<AdminAffiliateRow | null>(null);
  const [viewTarget,   setViewTarget]   = useState<AdminAffiliateRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await whmcsAdmin<{ affiliates: AdminAffiliateRow[]; total: number }>("adminGetAffiliates", { limitnum: 100 });
    setAffiliates(res?.affiliates ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return affiliates;
    return affiliates.filter(a => `${a.firstname} ${a.lastname} ${a.email} ${a.referralCode ?? ""}`.toLowerCase().includes(q));
  }, [affiliates, search]);

  async function toggleStatus(a: AdminAffiliateRow) {
    const next = a.status === "active" ? "inactive" : "active";
    if (next === "inactive" && !confirm(`Deactivate ${a.firstname} ${a.lastname}'s affiliate account?`)) return;
    const ok = await whmcsAdmin("adminSetAffiliateStatus", { clientId: a.clientId, affiliateId: a.affiliateId, status: next });
    if (ok !== null) load();
  }

  const totals = useMemo(() => ({
    active:  affiliates.filter(a => a.status === "active").length,
    balance: affiliates.reduce((s, a) => s + a.balance, 0),
    paid:    affiliates.reduce((s, a) => s + a.withdrawn, 0),
  }), [affiliates]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Active Affiliates" value={totals.active} icon={<IconUsers />} color="purple" />
        <StatCard label="Total Unpaid Balance" value={`$${totals.balance.toFixed(2)}`} icon={<IconWallet />} color="orange" />
        <StatCard label="Total Commission Paid" value={`$${totals.paid.toFixed(2)}`} icon={<IconDollar />} color="green" />
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Search by name, email, or referral code…" />

      <TableCard>
        <THead cols={["Affiliate ID", "Client", "Email", "Referral Code", "Joined", "Referrals", "Earned", "Paid", "Balance", "Status", "Actions"]} />
        <tbody>
          {loading ? null : filtered.length === 0 ? <EmptyState icon={<IconUsers />} message="No affiliates found" /> : filtered.map(a => (
            <tr key={a.affiliateId} className="border-b border-gray-50">
              <td className="px-5 py-3 text-gray-400">#{a.affiliateId}</td>
              <td className="px-5 py-3 font-medium text-black whitespace-nowrap">{a.firstname} {a.lastname}</td>
              <td className="px-5 py-3 text-gray-500">{a.email}</td>
              <td className="px-5 py-3 font-mono text-xs text-[#6B21A8] font-bold">{a.referralCode ?? "—"}</td>
              <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{a.datejoined || "—"}</td>
              <td className="px-5 py-3 text-gray-600">{a.signups}</td>
              <td className="px-5 py-3 text-gray-600">${a.totalEarned.toFixed(2)}</td>
              <td className="px-5 py-3 text-gray-600">${a.withdrawn.toFixed(2)}</td>
              <td className="px-5 py-3 font-semibold text-black">${a.balance.toFixed(2)}</td>
              <td className="px-5 py-3"><Badge status={a.status === "active" ? "Active" : "Inactive"} /></td>
              <td className="px-5 py-3">
                <div className="flex gap-2.5">
                  <button onClick={() => setViewTarget(a)} title="View" className="text-gray-400 hover:text-[#6B21A8]"><Eye className="w-4 h-4" /></button>
                  <button onClick={() => setAdjustTarget(a)} title="Adjust Commission" className="text-gray-400 hover:text-[#6B21A8]"><Settings2 className="w-4 h-4" /></button>
                  <button onClick={() => toggleStatus(a)} title={a.status === "active" ? "Deactivate" : "Activate"} className={a.status === "active" ? "text-gray-400 hover:text-red-600" : "text-gray-400 hover:text-green-600"}>
                    {a.status === "active" ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </TableCard>

      {adjustTarget && <AdjustCommissionModal affiliate={adjustTarget} onClose={() => setAdjustTarget(null)} onSaved={load} />}

      {viewTarget && (
        <Modal title={`${viewTarget.firstname} ${viewTarget.lastname}`} onClose={() => setViewTarget(null)}>
          <div className="space-y-3 text-sm">
            {[
              ["Affiliate ID", `#${viewTarget.affiliateId}`],
              ["Client ID", `#${viewTarget.clientId}`],
              ["Email", viewTarget.email],
              ["Referral Code", viewTarget.referralCode ?? "Not generated yet"],
              ["Date Joined", viewTarget.datejoined || "—"],
              ["Visitors", String(viewTarget.visitors)],
              ["Referrals (Signups)", String(viewTarget.signups)],
              ["Commission Type", viewTarget.payType || "Account default"],
              ["Commission Rate", viewTarget.commissionRateOverride !== null ? `${viewTarget.commissionRateOverride}% (override)` : (viewTarget.payAmount ? String(viewTarget.payAmount) : "Account default")],
              ["Total Earned", `$${viewTarget.totalEarned.toFixed(2)}`],
              ["Commission Paid", `$${viewTarget.withdrawn.toFixed(2)}`],
              ["Balance", `$${viewTarget.balance.toFixed(2)}`],
              ["Status", viewTarget.status === "active" ? "Active" : "Inactive"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between border-b border-gray-50 pb-2">
                <span className="text-gray-500">{label}</span>
                <span className="font-semibold text-black">{value}</span>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ─── Tab 2: Commissions ─────────────────────────────────────────────────── */
function CommissionsTab() {
  const [rows,       setRows]       = useState<AffiliateCommissionRow[]>([]);
  const [affiliates, setAffiliates] = useState<AdminAffiliateRow[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [from,       setFrom]       = useState("");
  const [to,         setTo]         = useState("");
  const [affFilter,  setAffFilter]  = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      whmcsAdmin<AffiliateCommissionRow[]>("adminGetAffiliateCommissions", { limitnum: 500 }),
      whmcsAdmin<{ affiliates: AdminAffiliateRow[] }>("adminGetAffiliates", { limitnum: 100 }),
    ]).then(([c, a]) => { setRows(c ?? []); setAffiliates(a?.affiliates ?? []); setLoading(false); });
  }, []);

  const nameFor = useCallback((affiliateId: number) => {
    const a = affiliates.find(x => x.affiliateId === affiliateId);
    return a ? `${a.firstname} ${a.lastname}` : affiliateId ? `Affiliate #${affiliateId}` : "Unattributed";
  }, [affiliates]);

  const filtered = useMemo(() => rows.filter(r => {
    if (from && r.date < from) return false;
    if (to && r.date > to) return false;
    if (affFilter && r.affiliateId !== Number(affFilter)) return false;
    return true;
  }), [rows, from, to, affFilter]);

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-800">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        Rows below come from WHMCS&apos;s settled transactions ledger — commissions still in flight (not yet credited) won&apos;t appear here until WHMCS posts them.
      </div>

      <div className="flex flex-wrap gap-3">
        <input type="date" value={from} onChange={e => setFrom(e.target.value)} className={`${INPUT} w-auto`} />
        <input type="date" value={to} onChange={e => setTo(e.target.value)} className={`${INPUT} w-auto`} />
        <select value={affFilter} onChange={e => setAffFilter(e.target.value)} className={`${INPUT} w-auto`}>
          <option value="">All Affiliates</option>
          {affiliates.map(a => <option key={a.affiliateId} value={a.affiliateId}>{a.firstname} {a.lastname}</option>)}
        </select>
      </div>

      <TableCard>
        <THead cols={["Date", "Affiliate", "Description", "Commission Amount", "Status"]} />
        <tbody>
          {loading ? null : filtered.length === 0 ? <EmptyState icon={<IconDollar />} message="No commission transactions found" /> : filtered.map(r => (
            <tr key={r.id} className="border-b border-gray-50">
              <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{r.date}</td>
              <td className="px-5 py-3 font-medium text-black whitespace-nowrap">{nameFor(r.affiliateId)}</td>
              <td className="px-5 py-3 text-gray-500">{r.description}</td>
              <td className={`px-5 py-3 font-semibold ${r.amount >= 0 ? "text-green-600" : "text-red-600"}`}>{r.amount >= 0 ? "+" : ""}${r.amount.toFixed(2)}</td>
              <td className="px-5 py-3"><Badge status="Paid" /></td>
            </tr>
          ))}
        </tbody>
      </TableCard>
    </div>
  );
}

/* ─── Tab 3: Withdrawal Requests ─────────────────────────────────────────── */
function WithdrawalsTab() {
  const [requests, setRequests] = useState<AffiliateWithdrawalRequest[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [showAll,  setShowAll]  = useState(false);
  const [busyId,   setBusyId]   = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await whmcsAdmin<AffiliateWithdrawalRequest[]>("adminGetAffiliateWithdrawals");
    setRequests(res ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = useMemo(() => showAll ? requests : requests.filter(r => r.status !== "Closed"), [requests, showAll]);

  async function approve(r: AffiliateWithdrawalRequest) {
    if (!confirm(`Mark ${r.firstname} ${r.lastname}'s $${r.amount.toFixed(2)} withdrawal as approved and paid?`)) return;
    setBusyId(r.ticketId);
    await whmcsAdmin("adminApproveAffiliateWithdrawal", { ticketId: r.ticketId });
    setBusyId(null);
    load();
  }

  async function reject(r: AffiliateWithdrawalRequest) {
    const reason = prompt(`Reason for rejecting ${r.firstname} ${r.lastname}'s withdrawal request:`) ?? "";
    setBusyId(r.ticketId);
    await whmcsAdmin("adminRejectAffiliateWithdrawal", { ticketId: r.ticketId, reason });
    setBusyId(null);
    load();
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" checked={showAll} onChange={e => setShowAll(e.target.checked)} />
          Show processed requests
        </label>
      </div>
      <TableCard>
        <THead cols={["Affiliate", "Amount", "Date Requested", "Payment Method", "Payment Details", "Status", "Actions"]} />
        <tbody>
          {loading ? null : visible.length === 0 ? <EmptyState icon={<IconWallet />} message="No withdrawal requests" /> : visible.map(r => (
            <tr key={r.ticketId} className="border-b border-gray-50">
              <td className="px-5 py-3 font-medium text-black whitespace-nowrap">{r.firstname} {r.lastname}</td>
              <td className="px-5 py-3 font-semibold text-black">${r.amount.toFixed(2)}</td>
              <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{r.date}</td>
              <td className="px-5 py-3 text-gray-600">{r.paymentMethod}</td>
              <td className="px-5 py-3 text-gray-500 max-w-[220px] truncate" title={r.paymentDetails}>{r.paymentDetails || "—"}</td>
              <td className="px-5 py-3"><Badge status={r.status === "Closed" ? "Paid" : "Pending"} /></td>
              <td className="px-5 py-3">
                {r.status === "Closed" ? (
                  <span className="text-xs text-gray-400">Processed</span>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => approve(r)} disabled={busyId === r.ticketId} className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 disabled:opacity-50">Approve &amp; Pay</button>
                    <button onClick={() => reject(r)} disabled={busyId === r.ticketId} className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 disabled:opacity-50">Reject</button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </TableCard>
    </div>
  );
}

/* ─── Tab 4: Settings ────────────────────────────────────────────────────── */
const SETTINGS_DEFAULTS: Record<string, string> = {
  "affiliate.default_commission_rate": "10",
  "affiliate.min_payout_amount": "20",
  "affiliate.commission_delay_days": "30",
  "affiliate.tier_referral_partner": "10",
  "affiliate.tier_digital_partner": "15",
  "affiliate.tier_certified_partner": "20",
};

function SettingsTab() {
  const [settings, setSettings] = useState(SETTINGS_DEFAULTS);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then((json: { success: boolean; data?: Record<string, string> }) => {
      if (json.success && json.data) setSettings(s => ({ ...s, ...json.data }));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const set = (key: string, value: string) => setSettings(s => ({ ...s, [key]: value }));

  const save = async () => {
    setSaving(true); setSaved(false);
    try {
      await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json", ...adminHeaders() }, body: JSON.stringify(settings) });
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch { /* error */ }
    setSaving(false);
  };

  if (loading) return <div className="py-16 flex justify-center"><div className="w-8 h-8 rounded-full border-4 border-[#6B21A8] border-t-transparent animate-spin" /></div>;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-800">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        These values drive our own dashboard and admin workflows. WHMCS&apos;s own affiliate module rate/settings must still be kept in sync manually in WHMCS Admin → Affiliates → Settings.
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <h2 className="font-bold text-black text-base border-b border-gray-100 pb-3">General</h2>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Default Commission Rate (%)</label>
          <input type="number" step="0.01" value={settings["affiliate.default_commission_rate"]} onChange={e => set("affiliate.default_commission_rate", e.target.value)} className={INPUT} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Minimum Payout Amount (USD)</label>
          <input type="number" step="0.01" value={settings["affiliate.min_payout_amount"]} onChange={e => set("affiliate.min_payout_amount", e.target.value)} className={INPUT} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Commission Delay (days)</label>
          <input type="number" value={settings["affiliate.commission_delay_days"]} onChange={e => set("affiliate.commission_delay_days", e.target.value)} className={INPUT} />
          <p className="text-xs text-gray-400 mt-1">Days a commission holds before it&apos;s eligible for withdrawal (e.g. to cover refund windows).</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <h2 className="font-bold text-black text-base border-b border-gray-100 pb-3">Partner Tiers</h2>
        {[
          ["Referral Partner", "affiliate.tier_referral_partner"],
          ["Digital Partner", "affiliate.tier_digital_partner"],
          ["Certified Partner", "affiliate.tier_certified_partner"],
        ].map(([label, key]) => (
          <div key={key} className="flex items-center justify-between gap-4">
            <label className="text-sm font-semibold text-gray-700">{label}</label>
            <div className="flex items-center gap-2 w-32">
              <input type="number" step="0.01" value={settings[key]} onChange={e => set(key, e.target.value)} className={INPUT} />
              <span className="text-sm text-gray-400">%</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <button onClick={save} disabled={saving} className="px-8 py-3.5 bg-[#6B21A8] text-white font-bold rounded-xl hover:bg-[#581c87] transition-all disabled:opacity-60 text-sm">{saving ? "Saving…" : "Save Settings"}</button>
        {saved && <span className="text-green-600 text-sm font-semibold animate-pulse">✓ Saved successfully</span>}
      </div>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function AffiliatesPage() {
  const [tab, setTab] = useState("all");

  const TABS = [
    { id: "all", label: "All Affiliates" },
    { id: "commissions", label: "Commissions" },
    { id: "withdrawals", label: "Withdrawal Requests" },
    { id: "settings", label: "Settings" },
  ];

  return (
    <div>
      <PageHeader title="Affiliate Management" subtitle="Affiliates, commissions, payouts, and program settings" />
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      {tab === "all" && <AllAffiliatesTab />}
      {tab === "commissions" && <CommissionsTab />}
      {tab === "withdrawals" && <WithdrawalsTab />}
      {tab === "settings" && <SettingsTab />}
    </div>
  );
}
