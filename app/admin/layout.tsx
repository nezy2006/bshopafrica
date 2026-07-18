"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Bell } from "lucide-react";
import { getAdminToken, getCurrentAdmin, adminHeaders, clearAdminAuth, type CurrentAdmin } from "@/lib/admin-auth-client";

/* ─── Nav items ──────────────────────────────────────────────────────────── */
type NavItem = { id: string; label: string; href: string; icon: React.FC<{ cls?: string }>; roles?: CurrentAdmin["role"][] };

const NAV: NavItem[] = [
  { id: "dashboard",  label: "Overview",       href: "/admin/dashboard",  icon: DashIcon    },
  { id: "clients",    label: "Clients",        href: "/admin/clients",    icon: UsersIcon   },
  { id: "orders",     label: "Orders & Sales",  href: "/admin/orders",     icon: CartIcon    },
  { id: "invoices",   label: "Billing & Payments", href: "/admin/invoices", icon: FileIcon  },
  { id: "tickets",    label: "Support Tickets", href: "/admin/tickets",    icon: TicketIcon  },
  { id: "domains",    label: "Domains",        href: "/admin/domains",    icon: GlobeIcon   },
  { id: "hosting",    label: "Hosting",        href: "/admin/hosting",    icon: ServerIcon  },
  { id: "reports",    label: "Reports & Analytics", href: "/admin/reports", icon: ChartIcon },
  { id: "blog",       label: "Blog",           href: "/admin/blog",       icon: EditIcon    },
  { id: "newsletter", label: "Newsletter",     href: "/admin/newsletter", icon: MailIcon    },
  { id: "team",       label: "Team Management", href: "/admin/team",      icon: TeamIcon,    roles: ["super_admin"] },
  { id: "activity",   label: "Activity Log",   href: "/admin/activity",   icon: ActivityIcon, roles: ["super_admin", "admin"] },
  { id: "settings",   label: "Settings",       href: "/admin/settings",   icon: GearIcon    },
];

/* ─── SVG icons ──────────────────────────────────────────────────────────── */
function DashIcon({ cls = "w-4 h-4" }: { cls?: string }) {
  return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
}
function CartIcon({ cls = "w-4 h-4" }: { cls?: string }) {
  return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>;
}
function UsersIcon({ cls = "w-4 h-4" }: { cls?: string }) {
  return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
}
function FileIcon({ cls = "w-4 h-4" }: { cls?: string }) {
  return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
}
function GlobeIcon({ cls = "w-4 h-4" }: { cls?: string }) {
  return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
}
function ServerIcon({ cls = "w-4 h-4" }: { cls?: string }) {
  return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>;
}
function TicketIcon({ cls = "w-4 h-4" }: { cls?: string }) {
  return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/><line x1="9" y1="12" x2="15" y2="12"/></svg>;
}
function EditIcon({ cls = "w-4 h-4" }: { cls?: string }) {
  return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
}
function MailIcon({ cls = "w-4 h-4" }: { cls?: string }) {
  return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
}
function GearIcon({ cls = "w-4 h-4" }: { cls?: string }) {
  return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
}
function LogoutIcon({ cls = "w-4 h-4" }: { cls?: string }) {
  return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
}
function ChartIcon({ cls = "w-4 h-4" }: { cls?: string }) {
  return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
}
function TeamIcon({ cls = "w-4 h-4" }: { cls?: string }) {
  return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
}
function ActivityIcon({ cls = "w-4 h-4" }: { cls?: string }) {
  return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
}
function MenuIcon() {
  return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>;
}

/* ─── Sidebar ────────────────────────────────────────────────────────────── */
function Sidebar({ open, onClose, admin }: { open: boolean; onClose: () => void; admin: CurrentAdmin | null }) {
  const pathname = usePathname();
  const router   = useRouter();

  const handleLogout = async () => {
    try { await fetch("/api/admin/auth", { method: "DELETE", headers: adminHeaders() }); } catch { /* best-effort */ }
    clearAdminAuth();
    router.replace("/admin/login");
  };

  const visibleNav = NAV.filter(item => !item.roles || (admin && item.roles.includes(admin.role)));

  const content = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <Image src="/The-Bshop-logo-REVAMPED-2025_white-logo-landscape-scaled.png" alt="B.Shop Admin" width={160} height={48} className="h-9 w-auto object-contain" />
        <p className="text-purple-300 text-[10px] font-semibold tracking-widest uppercase mt-1">Admin Panel</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visibleNav.map(({ id, label, href, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link key={id} href={href} onClick={onClose}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                active ? "bg-white text-[#6B21A8] font-bold shadow-sm" : "text-white/75 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon cls="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Admin identity + logout */}
      <div className="px-3 py-4 border-t border-white/10 space-y-2">
        {admin && (
          <div className="px-4 py-2">
            <p className="text-sm font-semibold text-white truncate">{admin.name}</p>
            <p className="text-[11px] text-purple-300 uppercase tracking-wide">{admin.role.replace(/_/g, " ")}</p>
          </div>
        )}
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:bg-red-500/20 hover:text-white transition-all"
        >
          <LogoutIcon cls="w-4 h-4 flex-shrink-0" />
          Log Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 bg-[#6B21A8] flex-col z-40 shadow-2xl">
        {content}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div className="lg:hidden fixed inset-0 bg-black/40 z-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
            <motion.aside
              className="lg:hidden fixed inset-y-0 left-0 w-64 bg-[#6B21A8] flex flex-col z-50 shadow-2xl"
              initial={{ x: -264 }} animate={{ x: 0 }} exit={{ x: -264 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {content}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

/* ─── Notification bell ──────────────────────────────────────────────────── */
interface AdminNotificationItem { id: number; type: string; title: string; message: string | null; link: string | null; created_at: string }
interface NotificationsResponse { notifications: AdminNotificationItem[]; unreadCount: number; expiringSoon: { label: string; link: string }[]; lastSeenId: number }

function NotificationBell() {
  const router = useRouter();
  const [data, setData] = useState<NotificationsResponse | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res  = await fetch("/api/admin/notifications", { headers: adminHeaders() });
      const json = await res.json() as { success: boolean; data?: NotificationsResponse };
      if (json.success && json.data) setData(json.data);
    } catch { /* offline */ }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const toggleOpen = async () => {
    const next = !open;
    setOpen(next);
    if (next && data && data.unreadCount > 0) {
      await fetch("/api/admin/notifications", { method: "POST", headers: adminHeaders() });
      setData(d => d ? { ...d, unreadCount: 0 } : d);
    }
  };

  const goTo = (link: string | null) => { setOpen(false); if (link) router.push(link); };

  return (
    <div className="relative" ref={ref}>
      <button onClick={toggleOpen} className="relative p-2 rounded-lg hover:bg-black/5 text-current">
        <Bell className="w-5 h-5" />
        {(data?.unreadCount ?? 0) > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold">
            {Math.min(data!.unreadCount, 9)}{data!.unreadCount > 9 ? "+" : ""}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 max-h-96 overflow-y-auto text-black">
          {data && data.expiringSoon.length > 0 && (
            <div className="px-4 py-2 border-b border-gray-50">
              <p className="text-[10px] font-bold text-orange-500 uppercase tracking-wide mb-1">Expiring in 3 Days</p>
              {data.expiringSoon.slice(0, 5).map((e, i) => (
                <button key={i} onClick={() => goTo(e.link)} className="w-full text-left text-xs text-gray-700 py-1 hover:text-[#6B21A8]">{e.label}</button>
              ))}
            </div>
          )}
          {!data || data.notifications.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No notifications yet</p>
          ) : data.notifications.map(n => (
            <button key={n.id} onClick={() => goTo(n.link)} className="w-full text-left px-4 py-2.5 hover:bg-gray-50 border-b border-gray-50 last:border-0">
              <p className="text-sm font-semibold text-black">{n.title}</p>
              {n.message && <p className="text-xs text-gray-500">{n.message}</p>}
              <p className="text-[10px] text-gray-400 mt-0.5">{new Date(n.created_at).toLocaleString()}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Admin layout ───────────────────────────────────────────────────────── */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [checked, setChecked] = useState(false);
  const [admin, setAdmin] = useState<CurrentAdmin | null>(null);

  const isLogin = pathname === "/admin/login";

  const checkAuth = useCallback(async () => {
    if (isLogin) { setChecked(true); return; }
    const token = getAdminToken();
    if (!token) { router.replace("/admin/login"); return; }
    try {
      const res  = await fetch("/api/admin/auth", { headers: adminHeaders() });
      const json = await res.json() as { success: boolean; admin?: CurrentAdmin };
      if (!json.success || !json.admin) { clearAdminAuth(); router.replace("/admin/login"); return; }
      setAdmin(json.admin);
    } catch {
      setAdmin(getCurrentAdmin());
    }
    setChecked(true);
  }, [isLogin, router]);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  if (isLogin) return <>{children}</>;
  if (!checked) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-4 border-[#6B21A8] border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} admin={admin} />

      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-[#6B21A8] sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="text-white p-1">
            <MenuIcon />
          </button>
          <Image src="/The-Bshop-logo-REVAMPED-2025_white-logo-landscape-scaled.png" alt="B.Shop Admin" width={120} height={36} className="h-7 w-auto object-contain" />
          <div className="ml-auto text-white"><NotificationBell /></div>
        </div>

        {/* Desktop topbar */}
        <div className="hidden lg:flex items-center justify-end px-8 py-3 border-b border-gray-100 bg-white sticky top-0 z-30">
          <div className="text-gray-600"><NotificationBell /></div>
        </div>

        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex-1 p-6 lg:p-8"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
