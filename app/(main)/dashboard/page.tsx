"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import type {
  ClientDetails,
  ClientProduct,
  ClientDomain,
  ClientInvoice,
} from "@/lib/whmcs";

type Ease = [number, number, number, number];
const EASE: Ease = [0.22, 1, 0.36, 1];

/* ─── Nav config ─────────────────────────────────────────────────────────── */
type Section = "dashboard" | "domains" | "hosting" | "invoices" | "support" | "settings";

const NAV: { id: Section; label: string; Icon: React.FC<{ cls?: string }> }[] = [
  { id: "dashboard", label: "Dashboard",        Icon: HomeIcon      },
  { id: "domains",   label: "My Domains",        Icon: GlobeIcon     },
  { id: "hosting",   label: "My Hosting",        Icon: ServerIcon    },
  { id: "invoices",  label: "Invoices",          Icon: FileIcon      },
  { id: "support",   label: "Support",           Icon: HeadsetIcon   },
  { id: "settings",  label: "Account Settings",  Icon: SettingsIcon  },
];

/* ─── SVG Icons ──────────────────────────────────────────────────────────── */
function HomeIcon({ cls = "w-5 h-5" }: { cls?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={cls}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}
function GlobeIcon({ cls = "w-5 h-5" }: { cls?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={cls}>
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}
function ServerIcon({ cls = "w-5 h-5" }: { cls?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={cls}>
      <rect x="2" y="2"  width="20" height="8" rx="2" ry="2" />
      <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
      <line x1="6" y1="6"  x2="6.01" y2="6"  />
      <line x1="6" y1="18" x2="6.01" y2="18" />
    </svg>
  );
}
function FileIcon({ cls = "w-5 h-5" }: { cls?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={cls}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}
function HeadsetIcon({ cls = "w-5 h-5" }: { cls?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={cls}>
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </svg>
  );
}
function SettingsIcon({ cls = "w-5 h-5" }: { cls?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={cls}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
function LogoutIcon({ cls = "w-5 h-5" }: { cls?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={cls}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

/* ─── API helper ─────────────────────────────────────────────────────────── */
async function whmcs<T>(action: string, params: Record<string, unknown> = {}): Promise<T | null> {
  try {
    const res  = await fetch("/api/whmcs", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ action, params }),
    });
    const json = (await res.json()) as { success: boolean; data?: T };
    return json.success ? (json.data ?? null) : null;
  } catch { return null; }
}

/* ─── Sidebar ────────────────────────────────────────────────────────────── */
function Sidebar({
  active, setActive, client, onLogout,
}: {
  active:    Section;
  setActive: (s: Section) => void;
  client:    ClientDetails | null;
  onLogout:  () => void;
}) {
  return (
    <motion.aside
      className="hidden lg:flex fixed top-24 left-0 bottom-0 w-64 bg-[#6B21A8] flex-col z-30 shadow-2xl"
      initial={{ x: -40, opacity: 0 }}
      animate={{ x: 0,   opacity: 1 }}
      transition={{ duration: 0.6, ease: EASE }}
    >
      {/* logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <Image
          src="/The-Bshop-logo-REVAMPED-2025_white-logo-landscape-scaled.png"
          alt="The B.Shop"
          width={160} height={48}
          className="h-9 w-auto object-contain"
        />
      </div>

      {/* client info */}
      {client && (
        <div className="px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
              {client.firstname[0]}{client.lastname[0]}
            </div>
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm truncate">
                {client.firstname} {client.lastname}
              </p>
              <p className="text-purple-300 text-xs truncate">{client.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-left ${
              active === id
                ? "bg-white text-[#6B21A8] shadow-md font-bold"
                : "text-white/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icon cls="w-4 h-4 flex-shrink-0" />
            {label}
          </button>
        ))}
      </nav>

      {/* logout */}
      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:bg-red-500/20 hover:text-white transition-all duration-200"
        >
          <LogoutIcon cls="w-4 h-4 flex-shrink-0" />
          Log Out
        </button>
      </div>
    </motion.aside>
  );
}

/* ─── Mobile bottom nav ──────────────────────────────────────────────────── */
function MobileNav({
  active, setActive, onLogout,
}: {
  active:    Section;
  setActive: (s: Section) => void;
  onLogout:  () => void;
}) {
  const MOBILE = NAV.slice(0, 4);
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#6B21A8] border-t border-white/10 z-40">
      <div className="flex items-center justify-around">
        {MOBILE.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={`flex flex-col items-center gap-1 py-3 px-4 transition-colors duration-200 ${
              active === id ? "text-white" : "text-white/50"
            }`}
          >
            <Icon cls="w-5 h-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
        <button
          onClick={onLogout}
          className="flex flex-col items-center gap-1 py-3 px-4 text-white/50 hover:text-white transition-colors"
        >
          <LogoutIcon cls="w-5 h-5" />
          <span className="text-[10px] font-medium">Logout</span>
        </button>
      </div>
    </nav>
  );
}

/* ─── Stat card ──────────────────────────────────────────────────────────── */
function StatCard({
  label, value, icon, color, index,
}: {
  label:  string;
  value:  number | string;
  icon:   React.ReactNode;
  color:  "purple" | "blue" | "orange" | "green";
  index:  number;
}) {
  const colors = {
    purple: { bg: "bg-purple-100", text: "text-[#6B21A8]",   num: "text-[#6B21A8]"   },
    blue:   { bg: "bg-blue-100",   text: "text-blue-600",     num: "text-blue-700"     },
    orange: { bg: "bg-orange-100", text: "text-orange-600",   num: "text-orange-700"   },
    green:  { bg: "bg-green-100",  text: "text-green-600",    num: "text-green-700"    },
  };
  const c = colors[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0  }}
      transition={{ delay: 0.1 + index * 0.08, duration: 0.5, ease: EASE }}
      className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
    >
      <div className={`w-11 h-11 rounded-xl ${c.bg} ${c.text} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-3xl font-black ${c.num}`}>{value}</p>
    </motion.div>
  );
}

/* ─── Invoice status badge ───────────────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  const styles =
    s === "paid"    ? "bg-green-100 text-green-700" :
    s === "unpaid"  ? "bg-orange-100 text-orange-700" :
    s === "overdue" ? "bg-red-100 text-red-700" :
                      "bg-gray-100 text-gray-600";
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${styles}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

/* ─── Dashboard main view ────────────────────────────────────────────────── */
function DashboardView({
  client, products, domains, invoices,
}: {
  client:   ClientDetails | null;
  products: ClientProduct[];
  domains:  ClientDomain[];
  invoices: ClientInvoice[];
}) {
  const activeDomains  = domains.filter(d => d.status.toLowerCase()  === "active").length;
  const activeHosting  = products.filter(p => p.status.toLowerCase() === "active").length;
  const unpaidInvoices = invoices.filter(i => i.status.toLowerCase() === "unpaid").length;
  const recentInvoices = invoices.slice(0, 5);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0  }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <h1 className="text-2xl sm:text-3xl font-black text-black">
          Welcome back{client ? `, ${client.firstname}` : ""}! 👋
        </h1>
        <p className="text-gray-400 text-sm mt-1">{today}</p>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard index={0} label="Active Domains"  value={activeDomains}  color="purple" icon={<GlobeIcon  cls="w-5 h-5" />} />
        <StatCard index={1} label="Active Hosting"  value={activeHosting}  color="blue"   icon={<ServerIcon cls="w-5 h-5" />} />
        <StatCard index={2} label="Unpaid Invoices" value={unpaidInvoices} color="orange" icon={<FileIcon   cls="w-5 h-5" />} />
        <StatCard index={3} label="Open Tickets"    value={0}              color="green"  icon={<HeadsetIcon cls="w-5 h-5" />} />
      </div>

      {/* Recent invoices */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0  }}
        transition={{ delay: 0.4, duration: 0.55, ease: EASE }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-black text-base">Recent Invoices</h2>
          <button
            onClick={() => {}}
            className="text-xs text-[#6B21A8] font-semibold hover:underline"
          >
            View all →
          </button>
        </div>

        {recentInvoices.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-10">No invoices yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Invoice</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Due Date</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Amount</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentInvoices.map((inv, i) => (
                  <motion.tr
                    key={inv.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0   }}
                    transition={{ delay: 0.45 + i * 0.06, duration: 0.4 }}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-3.5 font-bold text-[#6B21A8]">#{inv.id}</td>
                    <td className="px-6 py-3.5 text-gray-600">{inv.date}</td>
                    <td className="px-6 py-3.5 text-gray-600">{inv.duedate}</td>
                    <td className="px-6 py-3.5 font-semibold text-black">${inv.total}</td>
                    <td className="px-6 py-3.5"><StatusBadge status={inv.status} /></td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0  }}
        transition={{ delay: 0.55, duration: 0.55, ease: EASE }}
      >
        <h2 className="font-bold text-black text-base mb-4">Quick Actions</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { label: "Register Domain",  icon: "🌍", href: "/domains",  desc: "Find and register a new domain"    },
            { label: "Upgrade Hosting",  icon: "🚀", href: "/hosting",  desc: "Scale up your hosting plan"        },
            { label: "Open Ticket",      icon: "🎧", href: "/contact",  desc: "Get help from our support team"    },
          ].map((action, i) => (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0  }}
              transition={{ delay: 0.6 + i * 0.08, duration: 0.45, ease: EASE }}
              whileHover={{ y: -4, boxShadow: "0 12px 32px rgba(107,33,168,0.12)" }}
            >
              <Link
                href={action.href}
                className="flex items-start gap-4 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:border-purple-200 transition-colors duration-200 block"
              >
                <span className="text-3xl">{action.icon}</span>
                <div>
                  <p className="font-bold text-black text-sm">{action.label}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{action.desc}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Placeholder for other sections ────────────────────────────────────── */
function PlaceholderView({ section }: { section: Section }) {
  const labels: Record<Section, string> = {
    dashboard: "Dashboard",
    domains:   "My Domains",
    hosting:   "My Hosting",
    invoices:  "Invoices",
    support:   "Support",
    settings:  "Account Settings",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0  }}
      className="flex flex-col items-center justify-center min-h-[40vh] text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center text-[#6B21A8] mb-4">
        <ServerIcon cls="w-8 h-8" />
      </div>
      <h2 className="text-xl font-black text-black mb-2">{labels[section]}</h2>
      <p className="text-gray-400 text-sm">This section is coming soon.</p>
    </motion.div>
  );
}

/* ─── Loading skeleton ───────────────────────────────────────────────────── */
function LoadingSkeleton() {
  return (
    <div className="min-h-screen pt-24 flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-[#6B21A8] border-t-transparent animate-spin" />
        <p className="text-gray-500 font-medium text-sm">Loading your dashboard…</p>
      </div>
    </div>
  );
}

/* ─── Dashboard page ─────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const router = useRouter();

  const [activeSection, setActiveSection] = useState<Section>("dashboard");
  const [loading,  setLoading]  = useState(true);
  const [client,   setClient]   = useState<ClientDetails   | null>(null);
  const [products, setProducts] = useState<ClientProduct[]>([]);
  const [domains,  setDomains]  = useState<ClientDomain[]>([]);
  const [invoices, setInvoices] = useState<ClientInvoice[]>([]);

  const fetchAll = useCallback(async (id: number) => {
    const [c, p, d, inv] = await Promise.all([
      whmcs<ClientDetails  >("getClientDetails",  { clientId: id }),
      whmcs<ClientProduct[]>("getClientProducts", { clientId: id }),
      whmcs<ClientDomain[]  >("getClientDomains",  { clientId: id }),
      whmcs<ClientInvoice[] >("getInvoices",       { clientId: id }),
    ]);
    if (c)   setClient(c);
    if (p)   setProducts(p);
    if (d)   setDomains(d);
    if (inv) setInvoices(inv);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("bshop_client_id");
    if (!stored) { router.replace("/login"); return; }
    const id = parseInt(stored, 10);
    fetchAll(id).finally(() => setLoading(false));
  }, [router, fetchAll]);

  const handleLogout = () => {
    localStorage.removeItem("bshop_client_id");
    router.replace("/login");
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="pt-24 min-h-screen bg-gray-50">
      <Sidebar
        active={activeSection}
        setActive={setActiveSection}
        client={client}
        onLogout={handleLogout}
      />

      {/* Page content — offset for sidebar on desktop */}
      <div className="lg:pl-64">
        <main className="p-6 lg:p-8 max-w-5xl pb-24 lg:pb-10">
          <AnimatePresence mode="wait">
            {activeSection === "dashboard" ? (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{    opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <DashboardView
                  client={client}
                  products={products}
                  domains={domains}
                  invoices={invoices}
                />
              </motion.div>
            ) : (
              <motion.div
                key={activeSection}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{    opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <PlaceholderView section={activeSection} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <MobileNav
        active={activeSection}
        setActive={setActiveSection}
        onLogout={handleLogout}
      />
    </div>
  );
}
