"use client";
import { Download, FileDown } from "lucide-react";

import { useState, useEffect, useMemo } from "react";
import { PageHeader, StatCard, BarChart, PieChart, TableCard, THead, EmptyState } from "@/lib/admin-utils";
import { adminHeaders } from "@/lib/admin-auth-client";
import { whmcsAdmin } from "@/lib/admin-utils";
import { downloadReportPdf } from "@/lib/report-pdf";
import type { AdminStats, AdminDomain, AdminTicket, ReportsOverview } from "@/lib/whmcs";
import type { UnifiedTransaction } from "@/app/api/admin/transactions/route";

function IconDollar() { return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round"/></svg>; }
function IconGlobe()  { return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/></svg>; }
function IconTicket() { return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/></svg>; }
function IconUsers()  { return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>; }
function IconPackage(){ return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>; }

function downloadCsv(filename: string, header: string, rows: string[][]) {
  const csv = [header, ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n");
  const a = document.createElement("a");
  a.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
  a.download = filename;
  a.click();
}

function ExportButtons({ onCsv, onPdf }: { onCsv: () => void; onPdf: () => void }) {
  return (
    <div className="flex justify-end gap-2">
      <button onClick={onCsv} className="flex items-center gap-1.5 px-4 py-2.5 border-2 border-[#6B21A8] text-[#6B21A8] text-sm font-bold rounded-xl hover:bg-purple-50 transition-colors"><Download className="w-4 h-4" /> CSV</button>
      <button onClick={onPdf} className="flex items-center gap-1.5 px-4 py-2.5 border-2 border-gray-300 text-gray-600 text-sm font-bold rounded-xl hover:bg-gray-50 transition-colors"><FileDown className="w-4 h-4" /> PDF</button>
    </div>
  );
}

function RevenueReport({ overview }: { overview: ReportsOverview | null }) {
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Today" value={`$${stats?.income_today ?? "0"}`} color="green" icon={<IconDollar />} />
        <StatCard label="This Month" value={`$${stats?.income_thismonth ?? "0"}`} color="purple" icon={<IconDollar />} />
        <StatCard label="This Year" value={`$${stats?.income_thisyear ?? "0"}`} color="blue" icon={<IconDollar />} />
        <StatCard label="All Time" value={`$${stats?.income_alltime ?? "0"}`} color="orange" icon={<IconDollar />} />
      </div>
      <BarChart data={overview?.revenueByMonth ?? []} label="Revenue — Last 12 Months (USD)" />
      <div className="grid lg:grid-cols-2 gap-6">
        <PieChart data={byMethod} label="Revenue by Payment Method (PayPal vs MTN vs Airtel)" />
        <BarChart data={overview?.productPopularity.slice(0, 6) ?? []} label="Top Products by Active Services" />
      </div>
      <ExportButtons
        onCsv={() => downloadCsv("revenue-transactions.csv", "Date,Client,Amount USD,Method,Status,Reference", txns.map(t => [t.date, t.clientName, String(t.amountUSD), t.method, t.status, t.reference]))}
        onPdf={() => downloadReportPdf("Revenue Report", ["Date", "Client", "Amount USD", "Method", "Status"], txns.map(t => [t.date, t.clientName, `$${t.amountUSD.toFixed(2)}`, t.method, t.status]))}
      />
      {loading && <p className="text-sm text-gray-400">Loading…</p>}
    </div>
  );
}

function ClientReport({ overview }: { overview: ReportsOverview | null }) {
  const totalNew = overview?.clientsByMonth.reduce((s, m) => s + m.value, 0) ?? 0;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <StatCard label="New Clients (12mo)" value={totalNew} color="purple" icon={<IconUsers />} />
        <StatCard label="Avg / Month" value={Math.round(totalNew / 12)} color="blue" icon={<IconUsers />} />
      </div>
      <BarChart data={overview?.clientsByMonth ?? []} label="New Client Signups — Last 12 Months" />
      <ExportButtons
        onCsv={() => downloadCsv("client-signups.csv", "Month,New Clients", (overview?.clientsByMonth ?? []).map(m => [m.key, String(m.value)]))}
        onPdf={() => downloadReportPdf("Client Report", ["Month", "New Clients"], (overview?.clientsByMonth ?? []).map(m => [m.key, String(m.value)]))}
      />
    </div>
  );
}

function ProductReport({ overview }: { overview: ReportsOverview | null }) {
  return (
    <div className="space-y-6">
      <BarChart data={overview?.productPopularity ?? []} label="Most Popular Packages (Active Services)" />
      <TableCard>
        <THead cols={["Product", "Active Services"]} />
        <tbody>
          {(overview?.productPopularity.length ?? 0) === 0 ? <EmptyState icon={<IconPackage />} message="No data yet" /> : overview?.productPopularity.map(p => (
            <tr key={p.key} className="border-b border-gray-50">
              <td className="px-5 py-3 font-medium text-black">{p.key}</td>
              <td className="px-5 py-3 text-gray-600">{p.value}</td>
            </tr>
          ))}
        </tbody>
      </TableCard>
      <ExportButtons
        onCsv={() => downloadCsv("product-popularity.csv", "Product,Active Services", (overview?.productPopularity ?? []).map(p => [p.key, String(p.value)]))}
        onPdf={() => downloadReportPdf("Product Report", ["Product", "Active Services"], (overview?.productPopularity ?? []).map(p => [p.key, String(p.value)]))}
      />
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
        <div className="mt-3">
          <ExportButtons
            onCsv={() => downloadCsv("expiring-domains.csv", "Domain,Client,Expiry", expiringSoon.map(d => [d.domainname, `${d.firstname} ${d.lastname}`, d.expirydate]))}
            onPdf={() => downloadReportPdf("Domain Report — Expiring Soon", ["Domain", "Client", "Expiry"], expiringSoon.map(d => [d.domainname, `${d.firstname} ${d.lastname}`, d.expirydate]))}
          />
        </div>
      </div>
    </div>
  );
}

function TicketReport({ overview }: { overview: ReportsOverview | null }) {
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
      <BarChart data={overview?.ticketsByMonth ?? []} label="Ticket Volume — Last 12 Months" />
      <div className="grid lg:grid-cols-2 gap-6">
        <BarChart data={byStatus} label="Tickets by Status" />
        <BarChart data={byDept} label="Tickets by Department" />
      </div>
      <ExportButtons
        onCsv={() => downloadCsv("tickets-by-department.csv", "Department,Count", byDept.map(d => [d.key, String(d.value)]))}
        onPdf={() => downloadReportPdf("Ticket Report", ["Department", "Count"], byDept.map(d => [d.key, String(d.value)]))}
      />
      {loading && <p className="text-sm text-gray-400">Loading…</p>}
    </div>
  );
}

export default function ReportsPage() {
  const [tab, setTab] = useState<"revenue" | "clients" | "products" | "domains" | "tickets">("revenue");
  const [overview, setOverview] = useState<ReportsOverview | null>(null);

  useEffect(() => { whmcsAdmin<ReportsOverview>("adminGetReportsOverview").then(setOverview); }, []);

  const tabs = [
    { id: "revenue" as const,  label: "Revenue" },
    { id: "clients" as const,  label: "Clients" },
    { id: "products" as const, label: "Products" },
    { id: "domains" as const,  label: "Domains" },
    { id: "tickets" as const,  label: "Tickets" },
  ];

  return (
    <div>
      <PageHeader title="Reports & Analytics" subtitle="Revenue, clients, products, domains, and support metrics" />
      <div className="flex gap-2 mb-6">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-bold rounded-xl transition-colors ${tab === t.id ? "bg-[#6B21A8] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
          >{t.label}</button>
        ))}
      </div>
      {tab === "revenue"  && <RevenueReport overview={overview} />}
      {tab === "clients"  && <ClientReport overview={overview} />}
      {tab === "products" && <ProductReport overview={overview} />}
      {tab === "domains"  && <DomainReport />}
      {tab === "tickets"  && <TicketReport overview={overview} />}
    </div>
  );
}
