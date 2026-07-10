"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { User, ChevronDown, Bell, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  getNotifications, markAllRead, markRead, startNotificationPolling, stopNotificationPolling,
  getUnreadCount, type AppNotification,
} from "@/lib/notifications";
import { clearAuth, authHeaders } from "@/lib/auth";

type Section = "overview" | "domains" | "hosting" | "orders" | "invoices" | "support" | "notifications" | "settings";
type Ease = [number, number, number, number];
const EASE: Ease = [0.22, 1, 0.36, 1];

/* ─── API helper ─────────────────────────────────────────────────────────── */
async function whmcs<T>(action: string, params: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch("/api/whmcs", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ action, params }),
  });
  // Sessions are server-side and short-lived (2h) — a 401 here means the
  // stored session token is missing/expired (including accounts that logged
  // in before this session system existed), so force a clean re-login.
  if (res.status === 401) {
    clearAuth();
    window.location.href = "/login";
    throw new Error("Session expired");
  }
  const json = (await res.json()) as { success: boolean; data?: T; error?: string };
  if (!json.success) throw new Error(json.error ?? "API error");
  return json.data as T;
}

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface ClientDetails { id: number; firstname: string; lastname: string; email: string; phonenumber: string; status: string; datecreated: string; }
interface ClientProduct { id: number; name: string; status: string; nextduedate: string; billingcycle: string; amount: string; domain: string; }
interface ClientDomain  { id: number; domainname: string; status: string; nextduedate: string; expirydate: string; }
interface DomainNameservers { ns1: string; ns2: string; ns3: string; ns4: string; ns5: string; }
interface ClientInvoice { id: number; date: string; duedate: string; total: string; status: string; }
interface TLDPriceEntry { register: number | null; renewal: number | null; transfer: number | null; }
interface ClientOrder   { id: number; date: string; total: string; status: string; currencycode: string; }
interface SupportTicket { id: number; tid: string; title: string; status: string; priority: string; deptname: string; date: string; lastreply: string; replies?: TicketReply[]; }
interface TicketAttachment { filename: string; index: string; }
interface TicketReply   { id: number; userid: number; admin: string; name: string; email: string; date: string; message: string; type: "client" | "staff"; attachments: TicketAttachment[]; }

/* ─── Icons ──────────────────────────────────────────────────────────────── */
const I = {
  Home:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Globe:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  Server:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>,
  Mail:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  ShoppingBag:() => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  FileText:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  Headset:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>,
  Bell:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  Settings:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06-.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  LogOut:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Alert:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Plus:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  X:         () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Check:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><polyline points="20 6 9 17 4 12"/></svg>,
  ChevronR:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="9 18 15 12 9 6"/></svg>,
  Menu:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  ExternalLink: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
  Download:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Send:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  Refresh:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
  Paperclip: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>,
};

/* ─── Shared UI ──────────────────────────────────────────────────────────── */
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-gray-200 animate-pulse rounded-lg ${className}`} />;
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  const cls =
    s === "active"     ? "bg-green-100 text-green-700" :
    s.includes("expir") ? "bg-orange-100 text-orange-700" :
    s === "expired"    ? "bg-red-100 text-red-700" :
    s === "pending"    ? "bg-yellow-100 text-yellow-700" :
    s === "cancelled"  ? "bg-gray-100 text-gray-600" :
    s === "paid"       ? "bg-green-100 text-green-700" :
    s === "unpaid"     ? "bg-red-100 text-red-700" :
    s === "overdue"    ? "bg-red-200 text-red-800" :
    s === "open"       ? "bg-blue-100 text-blue-700" :
    s === "answered"   ? "bg-purple-100 text-purple-700" :
    s === "closed"     ? "bg-gray-100 text-gray-600" :
                         "bg-gray-100 text-gray-600";
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{status}</span>;
}

function PriorityBadge({ priority }: { priority: string }) {
  const p = priority.toLowerCase();
  const cls =
    p === "urgent" ? "bg-red-100 text-red-700" :
    p === "high"   ? "bg-orange-100 text-orange-700" :
    p === "medium" ? "bg-blue-100 text-blue-700" :
                     "bg-gray-100 text-gray-600";
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{priority}</span>;
}

function EmptyState({ icon, title, desc, action }: { icon: React.ReactNode; title: string; desc: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-300">{icon}</div>
      <h3 className="font-semibold text-gray-900 text-lg mb-1">{title}</h3>
      <p className="text-gray-500 text-sm mb-6 max-w-xs">{desc}</p>
      {action}
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4 text-red-400"><I.Alert /></div>
      <h3 className="font-semibold text-gray-900 mb-2">Failed to load data</h3>
      <p className="text-gray-500 text-sm mb-4">Could not connect to the API. Check your WHMCS configuration.</p>
      <button onClick={onRetry} className="flex items-center gap-2 px-4 py-2 bg-[#6B21A8] text-white text-sm font-semibold rounded-lg hover:bg-[#581c87] transition-colors">
        <I.Refresh />Try again
      </button>
    </div>
  );
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
}

/* ─── OVERVIEW ───────────────────────────────────────────────────────────── */
function OverviewSection({ client, onNavigate }: { client: ClientDetails; onNavigate: (section: Section) => void }) {
  const [domains,  setDomains]  = useState<ClientDomain[]>([]);
  const [hosting,  setHosting]  = useState<ClientProduct[]>([]);
  const [invoices, setInvoices] = useState<ClientInvoice[]>([]);
  const [tickets,  setTickets]  = useState<SupportTicket[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      const [d, h, inv, t] = await Promise.all([
        whmcs<ClientDomain[]>("getClientDomains", { clientId: client.id }),
        whmcs<ClientProduct[]>("getClientProducts", { clientId: client.id }),
        whmcs<ClientInvoice[]>("getInvoices", { clientId: client.id }),
        whmcs<SupportTicket[]>("getTickets", { clientId: client.id }),
      ]);
      setDomains(d); setHosting(h); setInvoices(inv); setTickets(t);
    } catch { setError(true); }
    finally { setLoading(false); }
  }, [client.id]);

  useEffect(() => { load(); }, [load]);

  const unpaidInvoices = invoices.filter(i => i.status === "Unpaid" || i.status === "Overdue");
  const unpaidTotal = unpaidInvoices.reduce((s, i) => s + parseFloat(i.total), 0);
  const openTickets = tickets.filter(t => t.status === "Open" || t.status === "Customer-Reply");
  const expiringSoon = [
    ...domains.map(d => ({ name: d.domainname, type: "Domain", date: d.expirydate || d.nextduedate, days: daysUntil(d.expirydate || d.nextduedate) })),
    ...hosting.map(h => ({ name: h.domain || h.name, type: "Hosting", date: h.nextduedate, days: daysUntil(h.nextduedate) })),
  ].filter(x => x.days > 0 && x.days <= 30).sort((a, b) => a.days - b.days);

  if (error) return <ErrorState onRetry={load} />;

  return (
    <div className="p-6 space-y-6">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Welcome back, {client.firstname}!</h2>
        <p className="text-gray-500 mt-1">Here&apos;s what&apos;s happening with your account.</p>
      </div>

      {/* Renewal alerts */}
      {!loading && expiringSoon.length > 0 && (
        <div className="space-y-2">
          {expiringSoon.map(item => (
            <motion.div key={item.name} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
              className={`flex items-center gap-3 p-4 rounded-xl border ${item.days <= 7 ? "bg-red-50 border-red-200 text-red-800" : "bg-orange-50 border-orange-200 text-orange-800"}`}>
              <I.Alert />
              <div className="flex-1">
                <span className="font-semibold">{item.name}</span>
                <span className="text-sm ml-2">({item.type}) expires in {item.days} day{item.days !== 1 ? "s" : ""}</span>
              </div>
              <Link href="/hosting" className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/60 hover:bg-white transition-colors">Renew Now →</Link>
            </motion.div>
          ))}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />) : (
          <>
            {[
              { label: "Active Domains",    value: domains.filter(d => d.status === "Active").length, color: "text-purple-600", bg: "bg-purple-50", icon: <I.Globe /> },
              { label: "Active Hosting",    value: hosting.filter(h => h.status === "Active").length, color: "text-blue-600",   bg: "bg-blue-50",   icon: <I.Server /> },
              { label: "Unpaid Invoices",   value: `${unpaidInvoices.length} ($${unpaidTotal.toFixed(0)})`, color: "text-red-600", bg: "bg-red-50", icon: <I.Alert /> },
              { label: "Open Tickets",      value: openTickets.length, color: "text-orange-600", bg: "bg-orange-50", icon: <I.Headset /> },
            ].map(stat => (
              <div key={stat.label} className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-3`}>{stat.icon}</div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Onboarding checklist — shown only for new clients with no services */}
      {!loading && domains.length === 0 && hosting.length === 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900">Let&apos;s Get You Started</h3>
              <p className="text-sm text-gray-500 mt-0.5">Complete these steps to launch your online presence</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-[#6B21A8]">1<span className="text-gray-300">/5</span></span>
              <p className="text-xs text-gray-400">steps done</p>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mb-5">
            <div className="bg-[#6B21A8] h-1.5 rounded-full" style={{ width: "20%" }} />
          </div>
          <div className="space-y-3">
            {[
              { done: true,  label: "Account created",          href: null },
              { done: false, label: "Register your first domain", href: "/domains" },
              { done: false, label: "Choose a hosting plan",     href: "/hosting" },
              { done: false, label: "Set up professional email", href: "/hosting" },
              { done: false, label: "Launch your website",       href: "/hosting" },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${step.done ? "border-[#6B21A8] bg-[#6B21A8]" : "border-gray-300"}`}>
                  {step.done && <I.Check />}
                </div>
                <span className={`text-sm flex-1 ${step.done ? "text-gray-400 line-through" : "text-gray-700 font-medium"}`}>{step.label}</span>
                {!step.done && step.href && (
                  <Link href={step.href} className="text-xs font-semibold text-[#6B21A8] hover:underline flex items-center gap-1">
                    Start <I.ChevronR />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {([
            { label: "Register Domain",  href: "/domains" as const, section: null },
            { label: "Add Hosting",      href: "/hosting" as const, section: null },
            { label: "Open Ticket",      href: null, section: "support" as const },
            { label: "Pay Invoices",     href: null, section: "invoices" as const },
          ] satisfies { label: string; href: string | null; section: Section | null }[]).map(a => {
            const icon = a.label === "Register Domain" ? <I.Globe /> : a.label === "Add Hosting" ? <I.Server /> : a.label === "Open Ticket" ? <I.Headset /> : <I.FileText />;
            const cardClass = "flex flex-col items-center gap-2 p-4 bg-gray-50 hover:bg-purple-50 hover:border-purple-200 border border-transparent rounded-xl text-center transition-all group";
            const content = (
              <>
                <span className="text-gray-400 group-hover:text-[#6B21A8] transition-colors">{icon}</span>
                <span className="text-xs font-medium text-gray-600 group-hover:text-[#6B21A8]">{a.label}</span>
              </>
            );
            return a.section ? (
              <button key={a.label} onClick={() => onNavigate(a.section as Section)} className={cardClass}>{content}</button>
            ) : (
              <Link key={a.label} href={a.href!} className={cardClass}>{content}</Link>
            );
          })}
        </div>
      </div>

      {/* Recent invoices */}
      {!loading && invoices.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Recent Invoices</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {invoices.slice(0, 3).map(inv => (
              <div key={inv.id} className="flex items-center gap-4 px-5 py-3">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">Invoice #{inv.id}</p>
                  <p className="text-xs text-gray-400">Due: {inv.duedate}</p>
                </div>
                <span className="font-semibold text-gray-900">${inv.total}</span>
                <StatusBadge status={inv.status} />
                {(inv.status === "Unpaid" || inv.status === "Overdue") && (
                  <a href={`https://bshopafrica.com/billing/viewinvoice.php?id=${inv.id}`} target="_blank" rel="noopener noreferrer"
                    className="text-xs font-semibold px-3 py-1.5 bg-[#6B21A8] text-white rounded-lg hover:bg-[#581c87] transition-colors">
                    Pay Now
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── DOMAINS ────────────────────────────────────────────────────────────── */
function DomainsSection({ clientId }: { clientId: number }) {
  const [domains, setDomains] = useState<ClientDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);
  const [search,  setSearch]  = useState("");
  const [dnsDomain, setDnsDomain] = useState<ClientDomain | null>(null);
  const [tldPricing, setTldPricing] = useState<Record<string, TLDPriceEntry>>({});
  const [renewingId, setRenewingId] = useState<number | null>(null);
  const [payTarget,  setPayTarget]  = useState<{ invoiceId: number; amountUSD: number } | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(false);
    try { setDomains(await whmcs<ClientDomain[]>("getClientDomains", { clientId })); }
    catch { setError(true); }
    finally { setLoading(false); }
  }, [clientId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { whmcs<Record<string, TLDPriceEntry>>("getTLDPricing").then(setTldPricing).catch(() => {}); }, []);

  async function handleRenew(d: ClientDomain) {
    setRenewingId(d.id);
    try {
      const tld = "." + d.domainname.split(".").slice(1).join(".");
      const amount = tldPricing[tld]?.renewal ?? 0;
      const { invoiceId } = await whmcs<{ invoiceId: number }>("createInvoice", {
        clientId, description: `Domain Renewal - ${d.domainname} (1 year)`, amount,
      });
      if (!invoiceId) throw new Error("No invoice returned");
      setPayTarget({ invoiceId, amountUSD: amount });
    } catch {
      alert("Could not start renewal right now. Please try again or contact support.");
    } finally {
      setRenewingId(null);
    }
  }

  const filtered = domains.filter(d => d.domainname.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <h2 className="text-2xl font-bold text-gray-900">My Domains</h2>
        <Link href="/domains" className="inline-flex items-center gap-2 px-4 py-2 bg-[#6B21A8] text-white text-sm font-semibold rounded-xl hover:bg-[#581c87] transition-colors">
          <I.Plus />Register New Domain
        </Link>
      </div>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search domains…"
        className="w-full sm:w-72 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:border-[#6B21A8] transition-colors" />

      {error ? <ErrorState onRetry={load} /> :
       loading ? <Skeleton className="h-48" /> :
       filtered.length === 0 ? (
        search ? <p className="text-gray-400 text-sm">No results for "{search}"</p> :
        <EmptyState icon={<I.Globe />} title="No domains yet" desc="Register your first domain and start building your online presence."
          action={<Link href="/domains" className="px-5 py-2.5 bg-[#6B21A8] text-white font-semibold rounded-xl text-sm">Register Domain</Link>} />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>{["Domain","Expires","Status","Auto-Renew","Actions"].map(h => <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(d => {
                  const days = daysUntil(d.expirydate || d.nextduedate);
                  const effectiveStatus = days <= 0 ? "Expired" : days <= 30 ? "Expiring Soon" : d.status;
                  return (
                    <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 font-medium text-gray-900">{d.domainname}</td>
                      <td className="px-5 py-4 text-gray-500">{d.expirydate || d.nextduedate}</td>
                      <td className="px-5 py-4"><StatusBadge status={effectiveStatus} /></td>
                      <td className="px-5 py-4"><span className="text-green-600 text-xs font-semibold">Enabled</span></td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {days <= 30 && (
                            <button onClick={() => handleRenew(d)} disabled={renewingId === d.id}
                              className="text-xs px-2.5 py-1 border border-orange-300 text-orange-600 rounded-lg hover:bg-orange-50 disabled:opacity-60 transition-colors">
                              {renewingId === d.id ? "Preparing…" : "Renew"}
                            </button>
                          )}
                          <button onClick={() => setDnsDomain(d)}
                            className="text-xs px-2.5 py-1 border border-gray-200 rounded-lg hover:border-purple-300 hover:text-[#6B21A8] transition-colors">DNS</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AnimatePresence>
        {dnsDomain && <DnsModal domain={dnsDomain} clientId={clientId} onClose={() => setDnsDomain(null)} />}
        {payTarget && (
          <PaymentModal invoiceId={payTarget.invoiceId} amountUSD={payTarget.amountUSD}
            clientEmail={typeof window !== "undefined" ? (localStorage.getItem("bshop_client_email") ?? "") : ""}
            onClose={() => setPayTarget(null)}
            onPaid={() => { setPayTarget(null); load(); }} />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── DNS MODAL ──────────────────────────────────────────────────────────── */
function DnsModal({ domain, clientId, onClose }: { domain: ClientDomain; clientId: number; onClose: () => void }) {
  const [ns,       setNs]       = useState<DomainNameservers>({ ns1: "", ns2: "", ns3: "", ns4: "", ns5: "" });
  const [locked,   setLocked]   = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [cpanelUser,         setCpanelUser]         = useState<string | null>(null);
  const [cpanelLoginLoading, setCpanelLoginLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true); setError(false);
      try {
        const [nsRes, lockRes, accounts] = await Promise.all([
          whmcs<DomainNameservers>("getDomainNameservers", { domainId: domain.id }),
          whmcs<{ locked: boolean }>("getDomainLockingStatus", { domainId: domain.id }),
          fetchWhmAccounts().catch(() => [] as WhmAccount[]),
        ]);
        setNs(nsRes); setLocked(lockRes.locked);

        const normalized = domain.domainname.replace(/^www\./, "");
        const acct = accounts.find(a => a.domain === normalized || a.domain === domain.domainname);
        if (acct) setCpanelUser(acct.user);
      } catch { setError(true); }
      finally { setLoading(false); }
    })();
  }, [domain.id, domain.domainname]);

  async function saveNameservers() {
    setSaving(true);
    try {
      await whmcs("updateDomainNameservers", { domainId: domain.id, ns });
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch { /* ignore */ }
    finally { setSaving(false); }
  }

  async function toggleLock() {
    const next = !locked;
    setLocked(next);
    try { await whmcs("updateDomainLockingStatus", { domainId: domain.id, locked: next }); }
    catch { setLocked(!next); }
  }

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto"
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2, ease: EASE }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-gray-900">DNS Settings</h3>
            <p className="text-sm text-gray-500">{domain.domainname}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors"><I.X /></button>
        </div>

        {loading ? <Skeleton className="h-64" /> :
         error ? <p className="text-red-500 text-sm">Could not load DNS settings for this domain.</p> : (
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-gray-900 text-sm mb-3">Nameservers</h4>
              <div className="space-y-2">
                {(["ns1", "ns2", "ns3", "ns4", "ns5"] as const).map((key, i) => (
                  <input key={key} value={ns[key]} onChange={e => setNs(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder={`Nameserver ${i + 1}${i >= 2 ? " (optional)" : ""}`}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#6B21A8] transition-colors" />
                ))}
              </div>
              <div className="flex items-center gap-3 mt-3">
                <button onClick={saveNameservers} disabled={saving}
                  className="px-4 py-2 bg-[#6B21A8] text-white text-sm font-semibold rounded-xl disabled:opacity-50 hover:bg-[#581c87] transition-colors">
                  {saving ? "Saving…" : "Save Nameservers"}
                </button>
                {saved && <span className="text-sm text-green-600 flex items-center gap-1"><I.Check />Saved!</span>}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
              <div>
                <p className="font-medium text-gray-900 text-sm">Domain Lock</p>
                <p className="text-xs text-gray-500 mt-0.5">Prevents unauthorized transfers away from us.</p>
              </div>
              <button onClick={toggleLock}
                className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${locked ? "bg-[#6B21A8]" : "bg-gray-300"}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${locked ? "translate-x-5" : ""}`} />
              </button>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <p className="text-sm text-gray-500 mb-3">
                To manage DNS records (A, CNAME, MX, TXT), login to cPanel → Zone Editor.
              </p>
              {cpanelUser ? (
                <button onClick={async () => {
                    setCpanelLoginLoading(true);
                    try {
                      const url = await cpanelLogin(cpanelUser);
                      window.open(url, "_blank", "noopener");
                    } catch {
                      alert("Could not open cPanel right now. Please try again.");
                    } finally {
                      setCpanelLoginLoading(false);
                    }
                  }} disabled={cpanelLoginLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-purple-300 text-[#6B21A8] text-sm font-semibold rounded-xl hover:bg-purple-50 disabled:opacity-60 transition-colors">
                  <I.ExternalLink />{cpanelLoginLoading ? "Opening…" : "Login to cPanel"}
                </button>
              ) : (
                <p className="text-xs text-gray-400">No hosting account found for this domain — DNS zone editing requires a hosting account with us.</p>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ─── PAYMENT MODAL (mobile money + PayPal) ─────────────────────────────── */
const USD_TO_RWF = 1400; // fixed rate, matches checkout flow

type MmStep = "input" | "sending" | "waiting" | "success" | "failed";

function PaymentModal({ invoiceId, amountUSD, clientEmail, onClose, onPaid }: {
  invoiceId: number; amountUSD: number; clientEmail: string;
  onClose: () => void; onPaid: () => void;
}) {
  const [method, setMethod]   = useState<"choose" | "mtn">("choose");
  const [phone,  setPhone]    = useState("");
  const [predicted, setPredicted] = useState<{ provider: string; phoneNumber: string } | null>(null);
  const [predictLoading, setPredictLoading] = useState(false);
  const [mmStep,  setMmStep]  = useState<MmStep>("input");
  const [mmError, setMmError] = useState("");
  const [depositId, setDepositId] = useState("");
  const [countdown, setCountdown] = useState(120);
  const [paypalLoading, setPaypalLoading] = useState(false);

  const rwfTotal   = Math.round(amountUSD * USD_TO_RWF);
  const cleanPhone = phone.replace(/\D/g, "");

  // Predict operator as the user types (debounced)
  useEffect(() => {
    if (cleanPhone.length < 9) { setPredicted(null); setPredictLoading(false); return; }
    const intl = cleanPhone.startsWith("250") ? cleanPhone : cleanPhone.startsWith("0") ? "250" + cleanPhone.slice(1) : "250" + cleanPhone;
    setPredictLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res  = await fetch("/api/pawapay/predict-provider", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phoneNumber: intl }),
        });
        const json = (await res.json()) as { success: boolean; provider?: string; phoneNumber?: string };
        setPredicted(json.success && json.provider ? { provider: json.provider, phoneNumber: json.phoneNumber ?? intl } : null);
      } catch { setPredicted(null); }
      setPredictLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [cleanPhone]);

  // Poll deposit status
  useEffect(() => {
    if (mmStep !== "waiting" || !depositId) return;
    let active = true;
    const poll = async () => {
      try {
        const res  = await fetch(`/api/pawapay/status?depositId=${depositId}`);
        const json = (await res.json()) as { success: boolean; status: string };
        if (!active) return;
        if (json.status === "COMPLETED") {
          setMmStep("success");
          setTimeout(onPaid, 1500);
        } else if (["FAILED", "REJECTED", "TIMED_OUT", "DUPLICATE_IGNORED"].includes(json.status)) {
          setMmStep("failed");
          setMmError("Payment was declined. Please try again.");
        }
      } catch { /* retry on next tick */ }
    };
    const interval = setInterval(poll, 5000);
    poll();
    return () => { active = false; clearInterval(interval); };
  }, [mmStep, depositId, onPaid]);

  // Countdown while waiting for USSD approval
  useEffect(() => {
    if (mmStep !== "waiting") return;
    if (countdown <= 0) { setMmStep("failed"); setMmError("Payment timed out. Please try again."); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [mmStep, countdown]);

  async function payMobileMoney() {
    if (!predicted) return;
    setMmStep("sending"); setMmError("");
    try {
      const clientId = typeof window !== "undefined" ? localStorage.getItem("bshop_client_id") : null;
      const res = await fetch("/api/pawapay/initiate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: rwfTotal, currency: "RWF", phone: predicted.phoneNumber, operator: predicted.provider,
          clientId, clientEmail, invoiceId, totalUSD: amountUSD, totalRWF: rwfTotal,
        }),
      });
      const json = (await res.json()) as { success: boolean; depositId?: string; error?: string };
      if (!json.success || !json.depositId) throw new Error(json.error ?? "Failed to initiate payment");
      setDepositId(json.depositId);
      setMmStep("waiting"); setCountdown(120);
    } catch (e) {
      setMmStep("failed");
      setMmError(e instanceof Error ? e.message : "Payment initiation failed");
    }
  }

  async function payWithPaypal() {
    setPaypalLoading(true);
    try {
      const url = await whmcs<string>("getPaymentUrl", { invoiceId });
      window.location.href = url;
    } catch {
      alert("Could not open PayPal right now. Please try again.");
      setPaypalLoading(false);
    }
  }

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2, ease: EASE }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Pay Invoice #{invoiceId}</h3>
            <p className="text-sm text-gray-500">${amountUSD.toFixed(2)} <span className="text-gray-400">≈</span> RWF {rwfTotal.toLocaleString()}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors"><I.X /></button>
        </div>

        {method === "choose" && (
          <div className="space-y-3">
            <button onClick={() => setMethod("mtn")}
              className="w-full flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:border-purple-300 transition-colors text-left">
              <span className="w-10 h-10 bg-yellow-50 text-yellow-600 rounded-xl flex items-center justify-center text-lg">📱</span>
              <div><p className="font-semibold text-gray-900 text-sm">MTN / Airtel Mobile Money</p><p className="text-xs text-gray-500">Pay via PawaPay</p></div>
            </button>
            <button onClick={payWithPaypal} disabled={paypalLoading}
              className="w-full flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:border-purple-300 transition-colors text-left disabled:opacity-60">
              <span className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-lg">💳</span>
              <div><p className="font-semibold text-gray-900 text-sm">PayPal</p><p className="text-xs text-gray-500">{paypalLoading ? "Redirecting…" : "Pay securely with PayPal or card"}</p></div>
            </button>
          </div>
        )}

        {method === "mtn" && mmStep === "input" && (
          <div className="space-y-4">
            <button onClick={() => setMethod("choose")} className="text-xs text-gray-500 hover:text-gray-700">← Back</button>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Phone Number</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="07XXXXXXXX"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#6B21A8] transition-colors" />
              {predictLoading && <p className="text-xs text-gray-400 mt-1.5">Detecting operator…</p>}
              {predicted && <p className="text-xs text-green-600 mt-1.5">Detected: {predicted.provider.split("_")[0]}</p>}
              {!predictLoading && cleanPhone.length >= 9 && !predicted && <p className="text-xs text-red-500 mt-1.5">Operator not supported for this number.</p>}
            </div>
            {mmError && <p className="text-sm text-red-600">{mmError}</p>}
            <button onClick={payMobileMoney} disabled={!predicted}
              className="w-full py-3 bg-[#6B21A8] text-white font-semibold rounded-xl disabled:opacity-40 hover:bg-[#581c87] transition-colors">
              Pay RWF {rwfTotal.toLocaleString()}
            </button>
          </div>
        )}

        {method === "mtn" && mmStep === "sending" && (
          <p className="text-center text-sm text-gray-500 py-8">Sending payment request…</p>
        )}

        {method === "mtn" && mmStep === "waiting" && (
          <div className="text-center py-6 space-y-3">
            <div className="w-12 h-12 border-4 border-purple-200 border-t-[#6B21A8] rounded-full animate-spin mx-auto" />
            <p className="text-sm font-medium text-gray-900">Check your phone</p>
            <p className="text-xs text-gray-500">Approve the USSD prompt to complete payment. Expires in {countdown}s.</p>
          </div>
        )}

        {method === "mtn" && mmStep === "success" && (
          <div className="text-center py-6 space-y-2">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600"><I.Check /></div>
            <p className="text-sm font-semibold text-gray-900">Payment received!</p>
          </div>
        )}

        {method === "mtn" && mmStep === "failed" && (
          <div className="text-center py-6 space-y-3">
            <p className="text-sm text-red-600">{mmError}</p>
            <button onClick={() => { setMmStep("input"); setMmError(""); }} className="text-sm text-[#6B21A8] font-semibold hover:underline">Try again</button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ─── WHM helpers ────────────────────────────────────────────────────────── */
interface WhmAccount { user: string; domain: string; diskused: string; disklimit: string; suspended: boolean; }

async function fetchWhmAccounts(): Promise<WhmAccount[]> {
  const res = await fetch("/api/whm/accounts");
  const json = await res.json() as { success: boolean; accounts?: WhmAccount[] };
  if (!json.success) throw new Error("WHM accounts fetch failed");
  return json.accounts ?? [];
}

async function cpanelLogin(username: string): Promise<string> {
  const res = await fetch(`/api/cpanel/login?username=${encodeURIComponent(username)}`);
  const json = await res.json() as { success: boolean; url?: string; error?: string };
  if (!json.success || !json.url) throw new Error(json.error ?? "No URL returned");
  return json.url;
}

function parseMb(val: string): number {
  if (!val) return 0;
  const m = val.match(/^(\d+(?:\.\d+)?)\s*([KMGT]?)/i);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  switch ((m[2] ?? "").toUpperCase()) {
    case "G": return n * 1024;
    case "T": return n * 1024 * 1024;
    case "K": return n / 1024;
    default:  return n;
  }
}

function DiskBar({ diskused, disklimit }: { diskused: string; disklimit: string }) {
  const usedMb  = parseMb(diskused);
  const limitMb = parseMb(disklimit);
  const pct = limitMb > 0 ? Math.min(100, (usedMb / limitMb) * 100) : 0;
  const fmt = (mb: number) => mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${Math.round(mb)} MB`;
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>Disk Usage</span>
        <span>{fmt(usedMb)} / {fmt(limitMb)}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full">
        <div className="h-1.5 bg-[#6B21A8] rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ─── HOSTING ────────────────────────────────────────────────────────────── */
function HostingSection({ clientId }: { clientId: number }) {
  const [products,    setProducts]    = useState<ClientProduct[]>([]);
  const [whmAccounts, setWhmAccounts] = useState<WhmAccount[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(false);
  const [cpanelLoading, setCpanelLoading] = useState<Record<number, boolean>>({});
  const [renewingId, setRenewingId] = useState<number | null>(null);
  const [payTarget,  setPayTarget]  = useState<{ invoiceId: number; amountUSD: number } | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      const [prods, accts] = await Promise.all([
        whmcs<ClientProduct[]>("getClientProducts", { clientId }),
        fetchWhmAccounts().catch(() => [] as WhmAccount[]),
      ]);
      setProducts(prods); setWhmAccounts(accts);
    } catch { setError(true); }
    finally { setLoading(false); }
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  async function handleRenew(p: ClientProduct) {
    setRenewingId(p.id);
    try {
      const amount = parseFloat(p.amount) || 0;
      const { invoiceId } = await whmcs<{ invoiceId: number }>("createInvoice", {
        clientId, description: `Hosting Renewal - ${p.domain || p.name} (${p.billingcycle})`, amount,
      });
      if (!invoiceId) throw new Error("No invoice returned");
      setPayTarget({ invoiceId, amountUSD: amount });
    } catch {
      alert("Could not start renewal right now. Please try again or contact support.");
    } finally {
      setRenewingId(null);
    }
  }

  async function handleCpanelLogin(p: ClientProduct) {
    setCpanelLoading(prev => ({ ...prev, [p.id]: true }));
    try {
      const domain = p.domain?.replace(/^www\./, "");
      const acct = whmAccounts.find(a => a.domain === domain || a.domain === p.domain);
      if (!acct) {
        alert("Could not find a cPanel account for this domain. Please contact support.");
        return;
      }
      const url = await cpanelLogin(acct.user);
      window.open(url, "_blank", "noopener");
    } catch {
      alert("Could not open cPanel right now. Please try again.");
    } finally {
      setCpanelLoading(prev => ({ ...prev, [p.id]: false }));
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">My Hosting</h2>
        <Link href="/hosting" className="inline-flex items-center gap-2 px-4 py-2 bg-[#6B21A8] text-white text-sm font-semibold rounded-xl hover:bg-[#581c87] transition-colors">
          <I.Plus />Add Hosting
        </Link>
      </div>
      {error ? <ErrorState onRetry={load} /> :
       loading ? <div className="grid sm:grid-cols-2 gap-4">{[0,1].map(i => <Skeleton key={i} className="h-48" />)}</div> :
       products.length === 0 ? (
        <EmptyState icon={<I.Server />} title="No hosting accounts" desc="Get started with our affordable hosting plans."
          action={<Link href="/hosting" className="px-5 py-2.5 bg-[#6B21A8] text-white font-semibold rounded-xl text-sm">View Plans</Link>} />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {products.map(p => {
            const domain = p.domain?.replace(/^www\./, "");
            const acct = whmAccounts.find(a => a.domain === domain || a.domain === p.domain);
            return (
              <div key={p.id} className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{p.domain || p.name}</p>
                    <p className="text-sm text-gray-500">{p.name}</p>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
                {acct ? (
                  <DiskBar diskused={acct.diskused} disklimit={acct.disklimit} />
                ) : (
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1"><span>Disk Usage</span><span>— / —</span></div>
                    <div className="h-1.5 bg-gray-100 rounded-full" />
                  </div>
                )}
                <div className="text-xs text-gray-400">Renews: {p.nextduedate} · {p.billingcycle}</div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => handleCpanelLogin(p)} disabled={cpanelLoading[p.id]}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-[#6B21A8] text-white rounded-lg hover:bg-[#581c87] disabled:opacity-60 transition-colors">
                    <I.ExternalLink />{cpanelLoading[p.id] ? "Opening…" : "cPanel Login"}
                  </button>
                  <button className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:border-purple-300 hover:text-[#6B21A8] transition-colors">Upgrade</button>
                  {daysUntil(p.nextduedate) <= 30 && (
                    <button onClick={() => handleRenew(p)} disabled={renewingId === p.id}
                      className="text-xs px-3 py-1.5 border border-orange-300 text-orange-600 rounded-lg hover:bg-orange-50 disabled:opacity-60 transition-colors">
                      {renewingId === p.id ? "Preparing…" : "Renew"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {payTarget && (
          <PaymentModal invoiceId={payTarget.invoiceId} amountUSD={payTarget.amountUSD}
            clientEmail={typeof window !== "undefined" ? (localStorage.getItem("bshop_client_email") ?? "") : ""}
            onClose={() => setPayTarget(null)}
            onPaid={() => { setPayTarget(null); load(); }} />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── EMAILS ─────────────────────────────────────────────────────────────── */
function EmailsSection({ clientId }: { clientId: number }) {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">My Emails</h2>
        <a href="https://bshopafrica.com/webmail" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#6B21A8] text-white text-sm font-semibold rounded-xl hover:bg-[#581c87] transition-colors">
          <I.ExternalLink />Open Webmail
        </a>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        <EmptyState icon={<I.Mail />} title="Manage email accounts via cPanel"
          desc="Create and manage email accounts, set up forwarders, and access webmail through your hosting cPanel."
          action={
            <div className="flex gap-3 flex-wrap justify-center">
              <a href="https://bshopafrica.com/webmail" target="_blank" rel="noopener noreferrer"
                className="px-5 py-2.5 bg-[#6B21A8] text-white font-semibold rounded-xl text-sm">Open Webmail</a>
              <a href="https://bshopafrica.com/billing/clientarea.php" target="_blank" rel="noopener noreferrer"
                className="px-5 py-2.5 border border-gray-200 text-gray-700 font-semibold rounded-xl text-sm hover:border-purple-300 transition-colors">Go to cPanel</a>
            </div>
          } />
      </div>
    </div>
  );
}

/* ─── ORDERS ─────────────────────────────────────────────────────────────── */
function OrdersSection({ clientId }: { clientId: number }) {
  const [orders,  setOrders]  = useState<ClientOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(false);
    try { setOrders(await whmcs<ClientOrder[]>("getClientOrders", { clientId })); }
    catch { setError(true); }
    finally { setLoading(false); }
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">My Orders</h2>
      {error ? <ErrorState onRetry={load} /> :
       loading ? <Skeleton className="h-48" /> :
       orders.length === 0 ? <EmptyState icon={<I.ShoppingBag />} title="No orders yet" desc="Your orders will appear here after checkout." /> : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>{["Order #","Date","Total","Currency","Status"].map(h => <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map(o => (
                  <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 font-medium text-gray-900">#{o.id}</td>
                    <td className="px-5 py-4 text-gray-500">{o.date}</td>
                    <td className="px-5 py-4 font-semibold">${o.total}</td>
                    <td className="px-5 py-4 text-gray-500">{o.currencycode}</td>
                    <td className="px-5 py-4"><StatusBadge status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── INVOICES ───────────────────────────────────────────────────────────── */
function InvoicesSection({ clientId }: { clientId: number }) {
  const [invoices, setInvoices] = useState<ClientInvoice[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(false);
  const [filter,   setFilter]   = useState("All");
  const [payInvoice, setPayInvoice] = useState<ClientInvoice | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(false);
    try { setInvoices(await whmcs<ClientInvoice[]>("getInvoices", { clientId })); }
    catch { setError(true); }
    finally { setLoading(false); }
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  const tabs = ["All", "Unpaid", "Paid", "Overdue", "Cancelled"];
  const filtered = filter === "All" ? invoices : invoices.filter(i => i.status === filter);

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Invoices</h2>
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit flex-wrap">
        {tabs.map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${filter === t ? "bg-white shadow text-[#6B21A8]" : "text-gray-500 hover:text-gray-700"}`}>
            {t}
          </button>
        ))}
      </div>
      {error ? <ErrorState onRetry={load} /> :
       loading ? <Skeleton className="h-48" /> :
       filtered.length === 0 ? <EmptyState icon={<I.FileText />} title="No invoices" desc="Your invoices will appear here." /> : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>{["Invoice #","Date","Due Date","Total","Status","Actions"].map(h => <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(inv => (
                  <tr key={inv.id} className={`hover:bg-gray-50 transition-colors ${inv.status === "Overdue" ? "bg-red-50/30" : ""}`}>
                    <td className="px-5 py-4 font-medium text-gray-900">#{inv.id}</td>
                    <td className="px-5 py-4 text-gray-500">{inv.date}</td>
                    <td className="px-5 py-4 text-gray-500">{inv.duedate}</td>
                    <td className="px-5 py-4 font-semibold">${inv.total}</td>
                    <td className="px-5 py-4"><StatusBadge status={inv.status} /></td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        {(inv.status === "Unpaid" || inv.status === "Overdue") && (
                          <button onClick={() => setPayInvoice(inv)}
                            className="text-xs font-semibold px-3 py-1.5 bg-[#6B21A8] text-white rounded-lg hover:bg-[#581c87] transition-colors flex items-center gap-1">
                            Pay Now
                          </button>
                        )}
                        {inv.status === "Paid" && (
                          <a href={`/api/invoices/${inv.id}/pdf`} download={`invoice-${inv.id}.pdf`}
                            className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:border-purple-300 hover:text-[#6B21A8] transition-colors flex items-center gap-1">
                            <I.Download />PDF
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AnimatePresence>
        {payInvoice && (
          <PaymentModal invoiceId={payInvoice.id} amountUSD={parseFloat(payInvoice.total) || 0}
            clientEmail={typeof window !== "undefined" ? (localStorage.getItem("bshop_client_email") ?? "") : ""}
            onClose={() => setPayInvoice(null)}
            onPaid={() => { setPayInvoice(null); load(); }} />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── SUPPORT ────────────────────────────────────────────────────────────── */
function TicketStatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  const cls =
    s === "open"           ? "bg-yellow-100 text-yellow-700" :
    s === "answered"       ? "bg-green-100 text-green-700"  :
    s === "closed"         ? "bg-gray-100 text-gray-500"    :
    s === "customer-reply" ? "bg-blue-100 text-blue-700"    :
    s === "in progress"    ? "bg-orange-100 text-orange-700":
                             "bg-gray-100 text-gray-500";
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{status}</span>;
}

const ATTACHMENT_LINE = /\n*(?:📎\s*)?\[?Attachment\]?:\s*(\S+)/gi;
const AUTOCLOSE_NOTE  = /\n*---\nNote: This ticket auto-closes[\s\S]*$/;
const IMAGE_EXT        = /\.(jpe?g|png|gif|webp|svg)$/i;

function parseMessage(message: string): { text: string; attachments: string[] } {
  const attachments: string[] = [];
  const text = message
    .replace(ATTACHMENT_LINE, (_match, url: string) => { attachments.push(url); return ""; })
    .replace(AUTOCLOSE_NOTE, "")
    .trim();
  return { text, attachments };
}

// WHMCS's `userid` is unreliable for distinguishing author (it can echo the
// ticket-owning client's id on every reply) — the `admin` field is the source of truth.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isClient(reply: TicketReply, clientId: string): boolean {
  if (reply.admin && reply.admin !== "") return false; // admin reply
  if (String(reply.userid) === "0" || reply.userid === 0) return false; // admin
  return true; // client reply
}

function SupportSection({ client }: { client: ClientDetails }) {
  const [tickets,        setTickets]        = useState<SupportTicket[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(false);
  const [filter,         setFilter]         = useState("All");
  const [selected,       setSelected]       = useState<SupportTicket | null>(null);
  const [ticketData,     setTicketData]     = useState<(SupportTicket & { replies: TicketReply[] }) | null>(null);
  const [ticketLoading,  setTicketLoading]  = useState(false);
  const [replyText,      setReplyText]      = useState("");
  const [replying,       setReplying]       = useState(false);
  const [newTicket,      setNewTicket]      = useState(false);
  const [form,           setForm]           = useState({ subject: "", message: "", dept: "1", priority: "Medium" });
  const [submitting,     setSubmitting]     = useState(false);
  const [successId,      setSuccessId]      = useState("");
  const [newReplyBanner, setNewReplyBanner] = useState(false);
  const pollRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevStatus = useRef("");
  const bottomRef  = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(false);
    try { setTickets(await whmcs<SupportTicket[]>("getTickets", { clientId: client.id })); }
    catch { setError(true); }
    finally { setLoading(false); }
  }, [client.id]);

  useEffect(() => { load(); }, [load]);

  async function viewTicket(t: SupportTicket, silent = false) {
    if (!silent) { setSelected(t); setTicketLoading(true); }
    try {
      const data = await whmcs<SupportTicket & { replies: TicketReply[] }>("getTicket", { ticketId: t.id });
      if (silent && prevStatus.current && prevStatus.current !== data.status && data.status === "Answered") {
        setNewReplyBanner(true);
        setTimeout(() => setNewReplyBanner(false), 8000);
      }
      if (silent) prevStatus.current = data.status;
      setTicketData(data);
      if (silent) setSelected(prev => prev?.id === t.id ? { ...prev, status: data.status } : prev);
    } catch { if (!silent) setTicketData(null); }
    finally { if (!silent) setTicketLoading(false); }
  }

  // Poll every 30 s while viewing a ticket
  useEffect(() => {
    if (!selected) {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      setNewReplyBanner(false);
      return;
    }
    prevStatus.current = selected.status;
    const snap = { ...selected };
    pollRef.current = setInterval(() => viewTicket(snap, true), 5_000);
    return () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  // Auto-scroll to bottom when new replies arrive
  useEffect(() => {
    if (ticketData && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketData?.replies?.length]);

  async function submitReply() {
    if (!selected || !replyText.trim()) return;
    setReplying(true);
    try {
      await whmcs("addTicketReply", {
        ticketId: selected.id, clientId: client.id, message: replyText,
      });
      setReplyText("");
      viewTicket(selected);
    } catch { /* ignore */ }
    finally { setReplying(false); }
  }

  async function closeSelected() {
    if (!selected) return;
    try {
      await whmcs("closeTicket", { ticketId: selected.id });
      setSelected(null); setTicketData(null);
      load();
    } catch { /* ignore */ }
  }

  async function submitNewTicket() {
    if (!form.subject.trim() || !form.message.trim()) return;
    setSubmitting(true);
    try {
      const name  = localStorage.getItem("bshop_client_name")  ?? `${client.firstname} ${client.lastname}`.trim();
      const email = localStorage.getItem("bshop_client_email") ?? client.email;
      const { tid } = await whmcs<{ ticketId: number; tid: string }>("openTicket", {
        clientId: client.id, subject: form.subject, message: form.message,
        deptId: Number(form.dept), priority: form.priority, name, email,
      });
      setForm({ subject: "", message: "", dept: "1", priority: "Medium" });
      setNewTicket(false);
      setSuccessId(tid);
      setTimeout(() => setSuccessId(""), 6000);
      load();
    } catch { /* ignore */ }
    finally { setSubmitting(false); }
  }

  const tabs     = ["All", "Open", "Answered", "Closed"];
  const filtered = filter === "All" ? tickets : tickets.filter(t =>
    t.status === filter || (filter === "Open" && t.status === "Customer-Reply")
  );

  /* ── Single ticket conversation view ── */
  if (selected) {
    return (
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <button onClick={() => { setSelected(null); setTicketData(null); }}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#6B21A8] transition-colors">
            ← Back to tickets
          </button>
          {selected.status !== "Closed" && (
            <button onClick={closeSelected}
              className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg hover:border-red-300 hover:text-red-500 transition-colors">
              Close Ticket
            </button>
          )}
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900">{selected.title}</h2>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <TicketStatusBadge status={selected.status} />
            <PriorityBadge priority={selected.priority} />
            <span className="text-xs text-gray-400">#{selected.tid} · {selected.deptname}</span>
          </div>
        </div>

        {newReplyBanner && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-sm font-medium">
            <I.Bell />New reply from support! Scroll down to read it.
          </motion.div>
        )}

        {/* Conversation thread */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 min-h-[120px]">
          {ticketLoading ? <Skeleton className="h-32" /> :
           !ticketData  ? <p className="text-sm text-gray-400">Could not load conversation.</p> :
           ticketData.replies.length === 0 ? <p className="text-sm text-gray-400">No messages yet.</p> :
           <>
           {ticketData.replies.map((r, i) => {
             const fromClient = isClient(r, String(client.id));
             const { text, attachments } = parseMessage(r.message);
             return (
               <div key={r.id || i} className={`flex ${fromClient ? "justify-end" : "justify-start"}`}>
                 <div className={`max-w-[70%] rounded-2xl px-4 py-3 min-w-0 ${
                   fromClient
                     ? "bg-[#6B21A8] text-white rounded-tr-none"
                     : "bg-gray-100 text-gray-800 rounded-tl-none"
                 }`}>
                   <p className={`text-xs font-semibold mb-1 opacity-70 ${fromClient ? "text-white" : "text-gray-500"}`}>
                     {fromClient ? "You" : "Support Team"}
                   </p>
                   {text && <p className="text-sm whitespace-pre-wrap">{text}</p>}
                   {attachments.length > 0 && (
                     <div className="mt-2 flex flex-col gap-2">
                       {attachments.map((url, ai) =>
                         IMAGE_EXT.test(url) ? (
                           <a key={ai} href={url} target="_blank" rel="noopener noreferrer">
                             {/* eslint-disable-next-line @next/next/no-img-element */}
                             <img src={url} alt="Attachment" className="max-w-full max-h-64 rounded-lg border border-black/10 object-contain" />
                           </a>
                         ) : (
                           <a key={ai} href={url} target="_blank" rel="noopener noreferrer"
                             className={`inline-flex items-center gap-1 text-xs underline ${fromClient ? "text-purple-100" : "text-gray-600"}`}>
                             <I.Paperclip />Download attachment
                           </a>
                         )
                       )}
                     </div>
                   )}
                   {r.attachments?.length > 0 && (
                     <div className="mt-2 flex flex-wrap gap-1.5">
                       {r.attachments.map((a, ai) => (
                         <span key={ai} className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg ${fromClient ? "bg-purple-700 text-purple-100" : "bg-gray-200 text-gray-600"}`}>
                           📎 {a.filename}
                         </span>
                       ))}
                     </div>
                   )}
                   <p className={`text-xs opacity-50 mt-1 ${fromClient ? "text-white text-right" : "text-gray-500 text-left"}`}>{r.date}</p>
                 </div>
               </div>
             );
           })}
           <div ref={bottomRef} />
           </>}
        </div>

        {/* Reply box */}
        {selected.status !== "Closed" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">Add Reply</h3>
            <textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows={4}
              placeholder="Type your reply…"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#6B21A8] resize-none transition-colors" />
            <button onClick={submitReply} disabled={replying || !replyText.trim()}
              className="mt-3 flex items-center gap-2 px-5 py-2.5 bg-[#6B21A8] text-white text-sm font-semibold rounded-xl disabled:opacity-50 hover:bg-[#581c87] transition-colors">
              <I.Send />{replying ? "Sending…" : "Send Reply"}
            </button>
          </div>
        )}
      </div>
    );
  }

  /* ── Ticket list ── */
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Support Tickets</h2>
        <button onClick={() => setNewTicket(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#6B21A8] text-white text-sm font-semibold rounded-xl hover:bg-[#581c87] transition-colors">
          <I.Plus />Open New Ticket
        </button>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {tabs.map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${filter === t ? "bg-white shadow text-[#6B21A8]" : "text-gray-500 hover:text-gray-700"}`}>
            {t}
          </button>
        ))}
      </div>

      {successId && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-5 py-3 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm">
          <I.Check />Ticket <span className="font-semibold">#{successId}</span> submitted. We&apos;ll get back to you shortly.
        </motion.div>
      )}

      {error ? <ErrorState onRetry={load} /> :
       loading ? <Skeleton className="h-48" /> :
       filtered.length === 0 ? (
        <EmptyState icon={<I.Headset />} title="No tickets" desc="Open a support ticket and we'll get back to you quickly." />
       ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-50">
            {filtered.map(t => (
              <button key={t.id} onClick={() => viewTicket(t)}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{t.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">#{t.tid} · {t.deptname} · {t.date}</p>
                </div>
                <PriorityBadge priority={t.priority} />
                <TicketStatusBadge status={t.status} />
                <I.ChevronR />
              </button>
            ))}
          </div>
        </div>
       )}

      {/* New ticket modal */}
      <AnimatePresence>
        {newTicket && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6"
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2, ease: EASE }}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-gray-900">Open Support Ticket</h3>
                <button onClick={() => setNewTicket(false)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors"><I.X /></button>
              </div>
              <div className="space-y-4">
                <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="Subject"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#6B21A8] transition-colors" />
                <div className="grid grid-cols-2 gap-3">
                  <select value={form.dept} onChange={e => setForm(f => ({ ...f, dept: e.target.value }))}
                    className="px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#6B21A8] transition-colors bg-white">
                    <option value="1">Technical Support</option>
                    <option value="2">Billing</option>
                    <option value="3">General</option>
                  </select>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                    className="px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#6B21A8] transition-colors bg-white">
                    {["Low", "Medium", "High", "Urgent"].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={5} placeholder="Describe your issue…"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#6B21A8] resize-none transition-colors" />
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setNewTicket(false)} className="flex-1 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-sm">Cancel</button>
                <button onClick={submitNewTicket} disabled={submitting || !form.subject.trim() || !form.message.trim()}
                  className="flex-1 py-3 bg-[#6B21A8] text-white font-semibold rounded-xl disabled:opacity-50 hover:bg-[#581c87] transition-colors text-sm">
                  {submitting ? "Submitting…" : "Submit Ticket"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── NOTIFICATIONS ──────────────────────────────────────────────────────── */
function NotificationsSection() {
  const [notifs, setNotifs] = useState<AppNotification[]>([]);

  useEffect(() => {
    setNotifs(getNotifications());
    const sync = () => setNotifs(getNotifications());
    window.addEventListener("bshop_notifications_update", sync);
    return () => window.removeEventListener("bshop_notifications_update", sync);
  }, []);

  const typeColors: Record<AppNotification["type"], string> = {
    domain_expiring: "bg-orange-100 text-orange-600", invoice_due: "bg-red-100 text-red-600",
    ticket_replied:  "bg-blue-100 text-blue-600",     order_completed: "bg-green-100 text-green-600",
    service_suspended: "bg-red-200 text-red-700",     info: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
        {notifs.some(n => !n.read) && (
          <button onClick={() => { markAllRead(); setNotifs(getNotifications()); }}
            className="text-sm text-[#6B21A8] hover:underline">Mark all as read</button>
        )}
      </div>
      {notifs.length === 0 ? (
        <EmptyState icon={<I.Bell />} title="All caught up!" desc="No notifications at the moment." />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-50 overflow-hidden">
          {notifs.map(n => (
            <div key={n.id} onClick={() => { markRead(n.id); setNotifs(getNotifications()); }}
              className={`flex items-start gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors ${!n.read ? "bg-purple-50/30" : ""}`}>
              <span className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${typeColors[n.type]}`}>
                {n.type === "domain_expiring" ? <I.Globe /> : n.type === "invoice_due" ? <I.FileText /> : n.type === "ticket_replied" ? <I.Headset /> : <I.Bell />}
              </span>
              <div className="flex-1">
                <p className={`text-sm ${!n.read ? "font-semibold text-gray-900" : "text-gray-700"}`}>{n.message}</p>
                <p className="text-xs text-gray-400 mt-0.5">{new Date(n.date).toLocaleString()}</p>
              </div>
              {!n.read && <span className="w-2 h-2 bg-[#6B21A8] rounded-full mt-1.5 flex-shrink-0" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── PASSWORD STRENGTH ──────────────────────────────────────────────────── */
interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  checks: { label: string; met: boolean }[];
}

function getPasswordStrength(pw: string): PasswordStrength {
  const checks = [
    { label: "At least 8 characters", met: pw.length >= 8 },
    { label: "Uppercase letter",      met: /[A-Z]/.test(pw) },
    { label: "Lowercase letter",      met: /[a-z]/.test(pw) },
    { label: "Number",                met: /[0-9]/.test(pw) },
    { label: "Special character",     met: /[!@#$%^&*]/.test(pw) },
  ];
  const score = checks.filter(c => c.met).length;
  const meta = [
    { label: "Weak",   color: "bg-red-500"    },
    { label: "Weak",   color: "bg-red-500"    },
    { label: "Fair",   color: "bg-orange-500" },
    { label: "Good",   color: "bg-blue-500"   },
    { label: "Strong", color: "bg-green-500"  },
  ][Math.max(score - 1, 0)];
  return { score, label: score === 0 ? "" : meta.label, color: meta.color, checks };
}

/* ─── ACCOUNT SETTINGS ───────────────────────────────────────────────────── */
function AccountSettingsSection({ client }: { client: ClientDetails }) {
  const router = useRouter();
  const [tab,       setTab]       = useState<"security" | "billing">("security");
  const [pwForm,    setPwForm]    = useState({ current: "", newPw: "", confirm: "" });
  const [pwSaving,  setPwSaving]  = useState(false);
  const [pwError,   setPwError]   = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  const strength = getPasswordStrength(pwForm.newPw);
  const strengthOk = pwForm.newPw.length === 0 || strength.score >= 3;

  async function handlePasswordChange() {
    setPwError(""); setPwSuccess(false);
    if (!pwForm.current || !pwForm.newPw || !pwForm.confirm) { setPwError("All fields are required."); return; }
    if (pwForm.newPw !== pwForm.confirm) { setPwError("New passwords do not match."); return; }
    if (strength.score < 3) { setPwError("Please choose a stronger password (at least Fair)."); return; }
    setPwSaving(true);
    try {
      const { valid } = await whmcs<{ valid: boolean }>("validateLogin", { email: client.email, password: pwForm.current });
      if (!valid) { setPwError("Current password is incorrect."); return; }
      await whmcs("updateClientPassword", { clientId: client.id, newPassword: pwForm.newPw });
      setPwSuccess(true);
      setPwForm({ current: "", newPw: "", confirm: "" });
      setTimeout(() => {
        clearAuth();
        router.push("/login");
      }, 2000);
    } catch (err) {
      setPwError(err instanceof Error && err.message ? err.message : "Failed to update password. Please try again.");
    }
    finally { setPwSaving(false); }
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Account Settings</h2>
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {(["security", "billing"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all duration-200 ${tab === t ? "bg-white shadow text-[#6B21A8]" : "text-gray-500 hover:text-gray-700"}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === "security" && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5 max-w-lg">
          <h3 className="font-semibold text-gray-900">Change Password</h3>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Current Password</label>
            <input type="password" value={pwForm.current} onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#6B21A8] transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">New Password</label>
            <input type="password" value={pwForm.newPw} onChange={e => setPwForm(f => ({ ...f, newPw: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#6B21A8] transition-colors" />
            {pwForm.newPw && (
              <div className="mt-2.5 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden flex gap-0.5">
                    {[0, 1, 2, 3, 4].map(i => (
                      <div key={i} className={`flex-1 h-full rounded-full transition-colors ${i < strength.score ? strength.color : "bg-gray-100"}`} />
                    ))}
                  </div>
                  <span className={`text-xs font-medium w-12 text-right ${
                    strength.score <= 2 ? "text-red-600" : strength.score === 3 ? "text-orange-600" : strength.score === 4 ? "text-blue-600" : "text-green-600"
                  }`}>{strength.label}</span>
                </div>
                <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
                  {strength.checks.map(c => (
                    <li key={c.label} className={`text-xs flex items-center gap-1.5 ${c.met ? "text-green-600" : "text-gray-400"}`}>
                      <span>{c.met ? "✓" : "✗"}</span>{c.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Confirm New Password</label>
            <input type="password" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#6B21A8] transition-colors" />
          </div>
          {pwError   && <p className="text-sm text-red-600 flex items-center gap-1.5"><I.Alert />{pwError}</p>}
          {pwSuccess && <p className="text-sm text-green-600 flex items-center gap-1.5"><I.Check />Password updated! Logging you out…</p>}
          <button onClick={handlePasswordChange} disabled={pwSaving || !strengthOk}
            className="px-5 py-2.5 bg-[#6B21A8] text-white text-sm font-semibold rounded-xl disabled:opacity-50 hover:bg-[#581c87] transition-colors">
            {pwSaving ? "Updating…" : "Update Password"}
          </button>
        </div>
      )}

      {tab === "billing" && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 max-w-lg space-y-4">
          <h3 className="font-semibold text-gray-900">Payment Methods</h3>
          <p className="text-sm text-gray-500">We accept the following payment methods for all orders and renewals.</p>
          <div className="space-y-3">
            <div className="flex items-start gap-4 p-4 border border-gray-200 rounded-xl">
              <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M7.076 21.337H2.47a.641.641 0 01-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 00-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 00-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 00.554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 01.923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z"/></svg>
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">PayPal</p>
                <p className="text-xs text-gray-500 mt-0.5">Secure online payment. Available for all orders and renewals.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 border border-gray-200 rounded-xl">
              <div className="w-9 h-9 bg-yellow-50 text-yellow-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">MTN / Airtel Mobile Money</p>
                <p className="text-xs text-gray-500 mt-0.5">Pay with mobile money via PawaPay — Uganda, Rwanda, Tanzania and more.</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-400 pt-1">To pay an outstanding invoice, go to the <span className="font-medium text-gray-600">Invoices</span> section in the sidebar.</p>
        </div>
      )}
    </div>
  );
}

/* ─── DASHBOARD TOP BAR ──────────────────────────────────────────────────── */
const TOP_NAV = [
  { label: "Home",             href: "/"                 },
  { label: "Hosting",          href: "/hosting"          },
  { label: "Domains",          href: "/domains"          },
  { label: "Transfer",         href: "/transfer"         },
  { label: "About Us",         href: "/about"            },
  { label: "Contact",          href: "/contact"          },
  { label: "Digital Campfire", href: "/digital-campfire" },
];

function DashboardTopBar({ onLogout, onSection }: { onLogout: () => void; onSection: (s: Section) => void }) {
  const [firstName, setFirstName]  = useState("");
  const [fullName,  setFullName]   = useState("");
  const [email,     setEmail]      = useState("");
  const [unread,    setUnread]     = useState(0);
  const [notifs,    setNotifs]     = useState<AppNotification[]>([]);
  const [dropOpen,  setDropOpen]   = useState(false);
  const [notifOpen, setNotifOpen]  = useState(false);
  const dropRef  = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function sync() {
      const raw  = localStorage.getItem("bshop_client_firstname") ?? "";
      const name = localStorage.getItem("bshop_client_name") ?? "";
      const first = (raw && !raw.includes("@") && !raw.includes(".")) ? raw : name.trim().split(/\s+/)[0] ?? "";
      setFirstName(first);
      setFullName(name);
      setEmail(localStorage.getItem("bshop_client_email") ?? "");
      setUnread(getUnreadCount());
      setNotifs(getNotifications().slice(0, 5));
    }
    sync();
    window.addEventListener("bshop_notifications_update", sync);
    return () => window.removeEventListener("bshop_notifications_update", sync);
  }, []);

  useEffect(() => {
    function outside(e: MouseEvent) {
      if (dropRef.current  && !dropRef.current.contains(e.target as Node))  setDropOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    }
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);

  const USER_MENU = [
    { id: "overview"  as Section, label: "Overview"         },
    { id: "domains"   as Section, label: "My Domains"       },
    { id: "hosting"   as Section, label: "My Hosting"       },
    { id: "invoices"  as Section, label: "Invoices"         },
    { id: "support"   as Section, label: "Support"          },
    { id: "settings"  as Section, label: "Account Settings" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-40 shadow-sm">
      <div className="relative flex items-center h-full px-5">

      {/* Logo — left */}
      <Link href="/" className="flex-shrink-0 z-10">
        <Image src="/logo.png" alt="The B.Shop" width={160} height={50} className="h-12 w-auto object-contain" priority />
      </Link>

      {/* Nav — absolutely centered */}
      <nav className="hidden lg:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
        {TOP_NAV.map(({ label, href }) => (
          <Link key={label} href={href}
            className="text-sm font-medium text-gray-600 hover:text-[#6B21A8] transition-colors whitespace-nowrap">
            {label}
          </Link>
        ))}
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-1 ml-auto z-10">
        {/* Bell */}
        <div ref={notifRef} className="relative">
          <button onClick={() => { setNotifOpen(o => !o); setDropOpen(false); }}
            className="relative p-2 text-gray-500 hover:text-[#6B21A8] hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                {unread}
              </span>
            )}
          </button>
          <AnimatePresence>
            {notifOpen && (
              <motion.div key="notif" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.15, ease: EASE }}
                className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <span className="font-semibold text-gray-900 text-sm">Notifications</span>
                  {unread > 0 && (
                    <button onClick={() => { markAllRead(); setUnread(0); setNotifs(notifs.map(n => ({ ...n, read: true }))); }}
                      className="text-xs text-[#6B21A8] hover:underline">Mark all read</button>
                  )}
                </div>
                {notifs.length === 0
                  ? <div className="py-8 text-center text-gray-400 text-sm">No notifications</div>
                  : notifs.map(n => (
                    <div key={n.id} onClick={() => { markRead(n.id); setNotifs(getNotifications().slice(0, 5)); }}
                      className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 ${!n.read ? "bg-purple-50/50" : ""}`}>
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${!n.read ? "bg-purple-500" : "bg-gray-300"}`} />
                      <div>
                        <p className={`text-sm ${!n.read ? "font-semibold text-gray-900" : "text-gray-600"}`}>{n.message}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{new Date(n.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))
                }
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User dropdown */}
        <div ref={dropRef} className="relative">
          <button onClick={() => { setDropOpen(o => !o); setNotifOpen(false); }}
            className="flex items-center gap-2 px-2 py-1.5 rounded-full hover:bg-gray-100 transition-colors">
            <span className="w-7 h-7 rounded-full bg-[#6B21A8] flex items-center justify-center flex-shrink-0">
              <User className="w-3.5 h-3.5 text-white" />
            </span>
            <span className="text-sm font-semibold text-gray-800 hidden md:block">{firstName}</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>
          <AnimatePresence>
            {dropOpen && (
              <motion.div key="drop" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.15, ease: EASE }}
                className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="font-bold text-gray-900 text-sm truncate">{fullName || firstName}</p>
                  {email && <p className="text-xs text-gray-400 truncate mt-0.5">{email}</p>}
                </div>
                {USER_MENU.map(item => (
                  <button key={item.id} onClick={() => { onSection(item.id); setDropOpen(false); }}
                    className="flex w-full items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#6B21A8] transition-colors">
                    {item.label}
                  </button>
                ))}
                <div className="border-t border-gray-100">
                  <button onClick={() => { setDropOpen(false); onLogout(); }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                    <ArrowLeft className="w-4 h-4" />Logout
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Back to site */}
        <Link href="/"
          className="hidden md:flex items-center gap-1.5 ml-1 px-3 py-2 border border-[#6B21A8] text-[#6B21A8] text-sm font-semibold rounded-lg hover:bg-purple-50 transition-colors whitespace-nowrap">
          <ArrowLeft className="w-3.5 h-3.5" />Back to Site
        </Link>
      </div>

      </div>
    </header>
  );
}

/* ─── SIDEBAR ────────────────────────────────────────────────────────────── */
const NAV: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: "overview",       label: "Overview",          icon: <I.Home /> },
  { id: "domains",        label: "My Domains",        icon: <I.Globe /> },
  { id: "hosting",        label: "My Hosting",        icon: <I.Server /> },
  { id: "orders",         label: "My Orders",         icon: <I.ShoppingBag /> },
  { id: "invoices",       label: "Invoices",          icon: <I.FileText /> },
  { id: "support",        label: "Support Tickets",   icon: <I.Headset /> },
  { id: "notifications",  label: "Notifications",     icon: <I.Bell /> },
  { id: "settings",       label: "Account Settings",  icon: <I.Settings /> },
];

function Sidebar({ client, active, onSelect, onLogout, collapsed, onToggle }: {
  client: ClientDetails; active: Section; onSelect: (s: Section) => void;
  onLogout: () => void; collapsed: boolean; onToggle: () => void;
}) {
  return (
    <aside className="flex flex-col bg-[#1e0a2e] w-full h-full overflow-hidden">

      {/* User info — first thing in sidebar */}
      {!collapsed ? (
        <div className="px-4 py-4 border-b border-white/10">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-[#6B21A8] flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-white font-bold text-sm leading-tight truncate">
                  {[client.firstname, client.lastname].filter(Boolean).join(" ")}
                </p>
                <p className="text-purple-300 text-xs leading-tight truncate mt-0.5">{client.email}</p>
              </div>
            </div>
            <button onClick={onToggle} className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex-shrink-0">
              <I.Menu />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-3 border-b border-white/10">
          <div className="w-8 h-8 rounded-full bg-[#6B21A8] flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <button onClick={onToggle} className="p-1 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <I.Menu />
          </button>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {NAV.map(item => (
          <button key={item.id} onClick={() => onSelect(item.id)}
            title={collapsed ? item.label : undefined}
            className={`w-full flex items-center gap-3 px-4 py-2.5 transition-all duration-150 text-sm font-medium ${
              active === item.id
                ? "bg-[#6B21A8] text-white"
                : "text-white/80 hover:text-white hover:bg-white/10"
            } ${collapsed ? "justify-center" : ""}`}>
            <span className="flex-shrink-0">{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div className="border-t border-white/10 p-2">
        <button onClick={onLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 text-white/70 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors text-sm ${collapsed ? "justify-center" : ""}`}>
          <I.LogOut />{!collapsed && "Logout"}
        </button>
      </div>
    </aside>
  );
}

/* ─── MAIN PAGE ──────────────────────────────────────────────────────────── */
function DashboardInner() {
  const router  = useRouter();
  const params  = useSearchParams();
  const [client,    setClient]    = useState<ClientDetails | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [section, setSection]    = useState<Section>("overview");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const id        = localStorage.getItem("bshop_client_id");
    const firstname = localStorage.getItem("bshop_client_firstname")
                      || localStorage.getItem("bshop_client_name")?.split(" ")[0]
                      || "Client";
    const fullName  = localStorage.getItem("bshop_client_name") ?? "";
    const email     = localStorage.getItem("bshop_client_email") ?? "";
    if (!id) { router.replace("/login"); return; }

    const clientId = Number(id);
    setAuthLoading(false);

    // Start notification polling
    startNotificationPolling(clientId);

    // Load client details
    whmcs<ClientDetails>("getClientDetails", { clientId })
      .then(c => setClient(c))
      .catch(() => {
        // Fallback to localStorage data
        setClient({
          id:          clientId,
          firstname,
          lastname:    fullName.split(" ").slice(1).join(" "),
          email,
          phonenumber: "",
          status:      "Active",
          datecreated: "",
        });
      });

    // Handle ?s= query param for section navigation from header dropdown
    const s = params.get("s") as Section | null;
    if (s && NAV.some(n => n.id === s)) setSection(s);

    return () => stopNotificationPolling();
  }, [router, params]);

  function handleLogout() {
    localStorage.removeItem("bshop_client_id");
    localStorage.removeItem("bshop_client_name");
    localStorage.removeItem("bshop_client_firstname");
    localStorage.removeItem("bshop_client_email");
    stopNotificationPolling();
    router.push("/");
  }

  if (authLoading || !client) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#6B21A8] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Dashboard-specific top bar (replaces main site header) */}
      <DashboardTopBar onLogout={handleLogout} onSection={setSection} />

      {/* Sidebar — starts below top bar (top-16 = 64px) */}
      <div className={`fixed left-0 z-30 transition-transform duration-300 md:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ top: "64px", height: "calc(100vh - 64px)", width: collapsed ? "64px" : "256px" }}>
        <Sidebar client={client} active={section} onSelect={s => { setSection(s); setMobileOpen(false); }}
          onLogout={handleLogout} collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      </div>

      {/* Main content */}
      <main className={`bg-gray-50 min-h-screen pt-16 transition-all duration-300 ${collapsed ? "md:ml-16" : "md:ml-64"}`}>
        {/* Mobile hamburger */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 sticky top-16 z-20">
          <button onClick={() => setMobileOpen(true)} className="p-2 text-gray-500 hover:text-[#6B21A8]"><I.Menu /></button>
          <span className="font-semibold text-gray-900">{NAV.find(n => n.id === section)?.label}</span>
        </div>

          <AnimatePresence mode="wait">
            <motion.div key={section}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: EASE }}>
              {section === "overview"      && <OverviewSection client={client} onNavigate={setSection} />}
              {section === "domains"       && <DomainsSection clientId={client.id} />}
              {section === "hosting"       && <HostingSection clientId={client.id} />}
              {section === "orders"        && <OrdersSection clientId={client.id} />}
              {section === "invoices"      && <InvoicesSection clientId={client.id} />}
              {section === "support"       && <SupportSection client={client} />}
              {section === "notifications" && <NotificationsSection />}
              {section === "settings"      && <AccountSettingsSection client={client} />}
            </motion.div>
          </AnimatePresence>
        </main>
    </>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#6B21A8] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <DashboardInner />
    </Suspense>
  );
}
