"use client";

import React from "react";
import { motion } from "framer-motion";
import { adminHeaders } from "@/lib/admin-auth-client";

/* ─── Shared whmcs fetch helper ──────────────────────────────────────────── */
export async function whmcsAdmin<T>(action: string, params: Record<string, unknown> = {}): Promise<T | null> {
  try {
    const res  = await fetch("/api/whmcs", { method: "POST", headers: { "Content-Type": "application/json", ...adminHeaders() }, body: JSON.stringify({ action, params }) });
    const json = await res.json() as { success: boolean; data?: T; error?: string };
    if (!json.success && json.error === "Unauthorized" && typeof window !== "undefined") {
      window.location.href = "/admin/login";
      return null;
    }
    return json.success ? json.data ?? null : null;
  } catch { return null; }
}

/* ─── Page header ────────────────────────────────────────────────────────── */
export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-8 gap-4">
      <div>
        <h1 className="text-2xl font-black text-black">{title}</h1>
        {subtitle && <p className="text-gray-400 text-sm mt-1">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

/* ─── Stat card ──────────────────────────────────────────────────────────── */
export function StatCard({ label, value, icon, color, sub }: { label: string; value: string | number; icon: React.ReactNode; color: "purple" | "blue" | "green" | "orange" | "red"; sub?: string }) {
  const c = { purple: "bg-purple-100 text-[#6B21A8]", blue: "bg-blue-100 text-blue-600", green: "bg-green-100 text-green-600", orange: "bg-orange-100 text-orange-600", red: "bg-red-100 text-red-600" }[color];
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className={`w-11 h-11 rounded-xl ${c} flex items-center justify-center mb-3`}>{icon}</div>
      <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-1">{label}</p>
      <p className="text-3xl font-black text-black">{value}</p>
      {sub && <p className="text-gray-400 text-xs mt-1">{sub}</p>}
    </div>
  );
}

/* ─── Status badge ───────────────────────────────────────────────────────── */
export function Badge({ status }: { status: string }) {
  const s = status.toLowerCase();
  const cls =
    s === "active" || s === "paid" || s === "completed" ? "bg-green-100 text-green-700" :
    s === "pending" || s === "unpaid" || s === "open"    ? "bg-orange-100 text-orange-700" :
    s === "overdue" || s === "failed" || s === "cancelled"? "bg-red-100 text-red-700" :
    s === "high"    ? "bg-red-100 text-red-700" :
    s === "medium"  ? "bg-orange-100 text-orange-700" :
    s === "low"     ? "bg-blue-100 text-blue-600" :
    "bg-gray-100 text-gray-600";
  return <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${cls}`}><span className="w-1.5 h-1.5 rounded-full bg-current"/>{status}</span>;
}

/* ─── Search + filter bar ────────────────────────────────────────────────── */
export function SearchBar({ value, onChange, placeholder = "Search…", children }: { value: string; onChange: (v: string) => void; placeholder?: string; children?: React.ReactNode }) {
  return (
    <div className="flex gap-3 mb-5 flex-wrap">
      <div className="flex-1 relative min-w-[200px]">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3" strokeLinecap="round"/></svg>
        <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className="w-full pl-9 pr-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl bg-gray-50 outline-none focus:border-[#6B21A8] focus:bg-white transition-all" />
      </div>
      {children}
    </div>
  );
}

/* ─── Loading skeleton ───────────────────────────────────────────────────── */
export function SkeletonRows({ cols, rows = 8 }: { cols: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b border-gray-50">
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-5 py-3.5"><div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: `${60 + (j * 17 + i * 11) % 40}%` }} /></td>
          ))}
        </tr>
      ))}
    </>
  );
}

/* ─── Table wrapper ──────────────────────────────────────────────────────── */
export function TableCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto"><table className="w-full text-sm">{children}</table></div>
    </div>
  );
}

export function THead({ cols }: { cols: string[] }) {
  return (
    <thead><tr className="bg-gray-50 border-b border-gray-100">
      {cols.map(c => <th key={c} className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">{c}</th>)}
    </tr></thead>
  );
}

/* ─── Pagination ─────────────────────────────────────────────────────────── */
export function Pagination({ page, total, perPage, onChange }: { page: number; total: number; perPage: number; onChange: (p: number) => void }) {
  const pages = Math.ceil(total / perPage);
  if (pages <= 1) return null;
  const nums = Array.from({ length: Math.min(pages, 7) }, (_, i) => {
    if (pages <= 7) return i + 1;
    if (i === 0) return 1;
    if (i === 6) return pages;
    if (page <= 4) return i + 1;
    if (page >= pages - 3) return pages - 6 + i;
    return page - 3 + i;
  });
  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-white text-sm">
      <span className="text-gray-400">Showing {Math.min((page - 1) * perPage + 1, total)}–{Math.min(page * perPage, total)} of {total}</span>
      <div className="flex gap-1">
        {nums.map(n => (
          <button key={n} onClick={() => onChange(n)}
            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${n === page ? "bg-[#6B21A8] text-white" : "text-gray-500 hover:bg-gray-100"}`}
          >{n}</button>
        ))}
      </div>
    </div>
  );
}

/* ─── Tabs ────────────────────────────────────────────────────────────────── */
export function Tabs({ tabs, active, onChange }: { tabs: { id: string; label: string }[]; active: string; onChange: (id: string) => void }) {
  return (
    <div className="flex gap-1 mb-6 overflow-x-auto border-b border-gray-100">
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)}
          className={`px-4 py-2.5 text-sm font-bold whitespace-nowrap border-b-2 -mb-px transition-colors ${active === t.id ? "border-[#6B21A8] text-[#6B21A8]" : "border-transparent text-gray-500 hover:text-gray-700"}`}
        >{t.label}</button>
      ))}
    </div>
  );
}

/* ─── Modal ───────────────────────────────────────────────────────────────── */
export function Modal({ title, onClose, children, maxWidth = "max-w-md" }: { title: string; onClose: () => void; children: React.ReactNode; maxWidth?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${maxWidth} p-6 max-h-[90vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ─── Pie chart (hand-rolled, no charting lib installed) ────────────────────── */
const PIE_COLORS = ["#6B21A8", "#2563EB", "#16A34A", "#EA580C", "#DC2626", "#0891B2", "#CA8A04", "#9333EA"];

export function PieChart({ data, label }: { data: { key: string; value: number }[]; label: string }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let cumulative = 0;
  const stops = data.map((d, i) => {
    const start = (cumulative / total) * 360;
    cumulative += d.value;
    const end = (cumulative / total) * 360;
    return `${PIE_COLORS[i % PIE_COLORS.length]} ${start}deg ${end}deg`;
  }).join(", ");

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <p className="text-sm font-bold text-gray-700 mb-4">{label}</p>
      <div className="flex items-center gap-6 flex-wrap">
        <div className="w-32 h-32 rounded-full flex-shrink-0" style={{ background: data.length ? `conic-gradient(${stops})` : "#f3f4f6" }} />
        <div className="space-y-1.5 flex-1 min-w-[140px]">
          {data.length === 0 && <p className="text-gray-400 text-xs">No data</p>}
          {data.map((d, i) => (
            <div key={d.key} className="flex items-center justify-between text-xs gap-3">
              <span className="flex items-center gap-2 text-gray-600">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                {d.key}
              </span>
              <span className="font-bold text-gray-800">{d.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Client picker (search-select, used by New Order / Create Invoice / Quotes) ── */
export interface PickableClient { id: number; firstname: string; lastname: string; email: string }

export function ClientPicker({ client, onSelect }: { client: PickableClient | null; onSelect: (c: PickableClient | null) => void }) {
  const [query, setQuery]     = React.useState("");
  const [results, setResults] = React.useState<PickableClient[]>([]);

  const search = async (q: string) => {
    setQuery(q);
    if (q.trim().length < 2) { setResults([]); return; }
    const res = await whmcsAdmin<{ clients: PickableClient[]; total: number }>("adminGetClients", { search: q, limitnum: 8 });
    setResults(res?.clients ?? []);
  };

  if (client) {
    return (
      <div className="flex items-center justify-between bg-purple-50 rounded-xl px-4 py-3">
        <div><p className="font-semibold text-black">{client.firstname} {client.lastname}</p><p className="text-xs text-gray-500">{client.email}</p></div>
        <button type="button" onClick={() => onSelect(null)} className="text-gray-400 hover:text-red-500">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3" strokeLinecap="round"/></svg>
      <input value={query} onChange={e => search(e.target.value)} placeholder="Search by name or email…"
        className="w-full pl-9 pr-4 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm text-black outline-none focus:border-[#6B21A8] focus:bg-white transition-all" />
      {results.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden">
          {results.map(c => (
            <button type="button" key={c.id} onClick={() => { onSelect(c); setResults([]); }} className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm">
              <span className="font-medium text-black">{c.firstname} {c.lastname}</span> <span className="text-gray-400 text-xs">{c.email}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Empty state ────────────────────────────────────────────────────────── */
export function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return <tr><td colSpan={99}><div className="text-center py-16 text-gray-400"><div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center bg-gray-100 rounded-full text-gray-400">{icon}</div><p className="text-sm font-medium">{message}</p></div></td></tr>;
}

/* ─── Simple bar chart ───────────────────────────────────────────────────── */
export function BarChart({ data, label }: { data: { key: string; value: number }[]; label: string }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <p className="text-sm font-bold text-gray-700 mb-4">{label}</p>
      <div className="flex items-end gap-1.5 h-28">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <motion.div
              initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
              transition={{ delay: i * 0.05, duration: 0.4, ease: "easeOut" }}
              style={{ height: `${(d.value / max) * 100}%`, transformOrigin: "bottom" }}
              className="w-full bg-[#6B21A8] rounded-t-md min-h-[4px]"
            />
            <span className="text-[9px] text-gray-400 font-medium">{d.key}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
