"use client";
import { Download } from "lucide-react";

import { useState, useEffect, useMemo } from "react";
import { PageHeader, StatCard, BarChart, TableCard, THead, EmptyState } from "@/lib/admin-utils";
import { adminHeaders } from "@/lib/admin-auth-client";
import { whmcsAdmin } from "@/lib/admin-utils";
import type { AdminStats, AdminDomain, AdminTicket } from "@/lib/whmcs";
import type { UnifiedTransaction } from "@/app/api/admin/transactions/route";

function IconDollar() { return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round"/></svg>; }
function IconGlobe()  { return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/></svg>; }
function IconTicket() { return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/></svg>; }

function downloadCsv(filename: string, header: string, rows: string[][]) {
  const csv = [header, ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n");
  const a = document.createElement("a");
  a.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
  a.download = filename;
  a.click();
}

function RevenueReport() {
  const [txns, setTxns] = useState<UnifiedTransaction[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/transactions", { headers: adminHeaders() }).then(r => r.json()).catch(() => null),
      whmcsAdmin<AdminStats>("adminGetStats"),
    ]).then(([t, s]) => {
      if (t?.success && t.data) setTxns(t.data);
      if (s) setStats(s);
      setLoading(false);
    });
  }, []);

  const byMethod = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of txns) map.set(t.method, (map.get(t.method) ?? 0) + t.amountUSD);
    return Array.from(map.entries()).map(([key, value]) => ({ key, value: Math.round(value * 100) / 100 }));
  }, [txns]);

  const byProduct = useMemo(() => {
    // Best-effort split — WHMCS transactions don't carry product type, so this
    // approximates using invoice presence as a proxy for a completed sale.
    const paid = txns.filter(t => t.status === "Completed" || t.status === "COMPLETED");
    return [{ key: "Paid txns", value: paid.length }, { key: "Total txns", value: txns.length }];
  }, [txns]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Today" value={`$${stats?.income_today ?? "0"}`} color="green" icon={<IconDollar />} />
        <StatCard label="This Month" value={`$${stats?.income_thismonth ?? "0"}`} color="purple" icon={<IconDollar />} />
        <StatCard label="This Year" value={`$${stats?.income_thisyear ?? "0"}`} color="blue" icon={<IconDollar />} />
        <StatCard label="All Time" value={`$${stats?.income_alltime ?? "0"}`} color="orange" icon={<IconDollar />} />
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <BarChart data={byMethod} label="Revenue by Payment Method (USD)" />
        <BarChart data={byProduct} label="Transaction Volume" />
      </div>
      <div className="flex justify-end">
        <button
          onClick={() => downloadCsv("revenue-transactions.csv", "Date,Client,Amount USD,Method,Status,Reference",
            txns.map(t => [t.date, t.clientName, String(t.amountUSD), t.method, t.status, t.reference]))}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2.5 border-2 border-[#6B21A8] text-[#6B21A8] text-sm font-bold rounded-xl hover:bg-purple-50 transition-colors disabled:opacity-50"
        ><Download className="w-4 h-4" /> Export CSV</button>
      </div>
    </div>
  );
}

function DomainReport() {
  const [domains, setDomains] = useState<AdminDomain[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    whmcsAdmin<{ domains: AdminDomain[]; total: number }>("adminGetDomains", { limitstart: 0, limitnum: 200 })
      .then(res => { if (res) setDomains(res.domains); setLoading(false); });
  }, []);

  const expiringSoon = useMemo(() => {
    const cutoff = Date.now() + 30 * 24 * 60 * 60 * 1000;
    return domains.filter(d => { const t = new Date(d.expirydate).getTime(); return !isNaN(t) && t < cutoff; });
  }, [domains]);

  const byTld = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of domains) {
      const tld = "." + (d.domainname.split(".").slice(1).join(".") || "com");
      map.set(tld, (map.get(tld) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([key, value]) => ({ key, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [domains]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Total Domains" value={domains.length} color="purple" icon={<IconGlobe />} />
        <StatCard label="Expiring in 30 Days" value={expiringSoon.length} color="red" icon={<IconGlobe />} />
      </div>
      <BarChart data={byTld} label="Domains by TLD" />
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-black text-sm">Expiring Soon</h3>
          <button
            onClick={() => downloadCsv("expiring-domains.csv", "Domain,Client,Expiry",
              expiringSoon.map(d => [d.domainname, `${d.firstname} ${d.lastname}`, d.expirydate]))}
            className="text-xs text-[#6B21A8] font-semibold hover:underline"
          >Export CSV</button>
        </div>
        <TableCard>
          <THead cols={["Domain", "Client", "Expiry"]} />
          <tbody>
            {loading ? null : expiringSoon.length === 0 ? <EmptyState icon={<IconGlobe />} message="Nothing expiring soon" /> : expiringSoon.map(d => (
              <tr key={d.id} className="border-b border-gray-50">
                <td className="px-5 py-3 font-medium text-black">{d.domainname}</td>
                <td className="px-5 py-3 text-gray-600">{d.firstname} {d.lastname}</td>
                <td className="px-5 py-3 text-red-500 font-semibold">{d.expirydate}</td>
              </tr>
            ))}
          </tbody>
        </TableCard>
      </div>
    </div>
  );
}

function TicketReport() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      whmcsAdmin<AdminStats>("adminGetStats"),
      whmcsAdmin<{ tickets: AdminTicket[]; total: number }>("adminGetTickets", { limitstart: 0, limitnum: 200 }),
    ]).then(([s, t]) => { if (s) setStats(s); if (t) setTickets(t.tickets); setLoading(false); });
  }, []);

  const byDept = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of tickets) map.set(t.department || "General", (map.get(t.department || "General") ?? 0) + 1);
    return Array.from(map.entries()).map(([key, value]) => ({ key, value }));
  }, [tickets]);

  const byStatus = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of tickets) map.set(t.status, (map.get(t.status) ?? 0) + 1);
    return Array.from(map.entries()).map(([key, value]) => ({ key, value }));
  }, [tickets]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Open" value={stats?.tickets_open ?? 0} color="red" icon={<IconTicket />} />
        <StatCard label="Answered" value={stats?.tickets_answered ?? 0} color="green" icon={<IconTicket />} />
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <BarChart data={byStatus} label="Tickets by Status" />
        <BarChart data={byDept} label="Tickets by Department" />
      </div>
      {loading && <p className="text-sm text-gray-400">Loading…</p>}
    </div>
  );
}

export default function ReportsPage() {
  const [tab, setTab] = useState<"revenue" | "domains" | "tickets">("revenue");
  const tabs = [
    { id: "revenue" as const, label: "Revenue" },
    { id: "domains" as const, label: "Domains" },
    { id: "tickets" as const, label: "Tickets" },
  ];

  return (
    <div>
      <PageHeader title="Reports & Analytics" subtitle="Revenue, domains, and support metrics" />
      <div className="flex gap-2 mb-6">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-bold rounded-xl transition-colors ${tab === t.id ? "bg-[#6B21A8] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
          >{t.label}</button>
        ))}
      </div>
      {tab === "revenue" && <RevenueReport />}
      {tab === "domains" && <DomainReport />}
      {tab === "tickets" && <TicketReport />}
    </div>
  );
}
