"use client";

import React from "react";
import { motion } from "framer-motion";

/* ─── Shared whmcs fetch helper ──────────────────────────────────────────── */
export async function whmcsAdmin<T>(action: string, params: Record<string, unknown> = {}): Promise<T | null> {
  try {
    const res  = await fetch("/api/whmcs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, params }) });
    const json = await res.json() as { success: boolean; data?: T };
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

/* ─── Empty state ────────────────────────────────────────────────────────── */
export function EmptyState({ icon, message }: { icon: string; message: string }) {
  return <tr><td colSpan={99}><div className="text-center py-16 text-gray-400"><div className="text-4xl mb-3">{icon}</div><p className="text-sm font-medium">{message}</p></div></td></tr>;
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
