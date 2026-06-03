"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

/* ─── Nav items ──────────────────────────────────────────────────────────── */
type NavItem = { id: string; label: string; href: string; icon: React.FC<{ cls?: string }> };

const NAV: NavItem[] = [
  { id: "dashboard",  label: "Dashboard",   href: "/admin/dashboard",  icon: DashIcon    },
  { id: "orders",     label: "Orders",      href: "/admin/orders",     icon: CartIcon    },
  { id: "clients",    label: "Clients",     href: "/admin/clients",    icon: UsersIcon   },
  { id: "invoices",   label: "Invoices",    href: "/admin/invoices",   icon: FileIcon    },
  { id: "domains",    label: "Domains",     href: "/admin/domains",    icon: GlobeIcon   },
  { id: "hosting",    label: "Hosting",     href: "/admin/hosting",    icon: ServerIcon  },
  { id: "tickets",    label: "Tickets",     href: "/admin/tickets",    icon: TicketIcon  },
  { id: "blog",       label: "Blog",        href: "/admin/blog",       icon: EditIcon    },
  { id: "newsletter", label: "Newsletter",  href: "/admin/newsletter", icon: MailIcon    },
  { id: "settings",   label: "Settings",    href: "/admin/settings",   icon: GearIcon    },
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
function MenuIcon() {
  return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>;
}

/* ─── Sidebar ────────────────────────────────────────────────────────────── */
function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const router   = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("bshop_admin_token");
    router.replace("/admin/login");
  };

  const content = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <Image src="/The-Bshop-logo-REVAMPED-2025_white-logo-landscape-scaled.png" alt="B.Shop Admin" width={160} height={48} className="h-9 w-auto object-contain" />
        <p className="text-purple-300 text-[10px] font-semibold tracking-widest uppercase mt-1">Admin Panel</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ id, label, href, icon: Icon }) => {
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

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/10">
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

/* ─── Admin layout ───────────────────────────────────────────────────────── */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [checked, setChecked] = useState(false);

  const isLogin = pathname === "/admin/login";

  const checkAuth = useCallback(() => {
    if (!isLogin) {
      const token = localStorage.getItem("bshop_admin_token");
      if (!token) { router.replace("/admin/login"); return; }
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
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-[#6B21A8] sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="text-white p-1">
            <MenuIcon />
          </button>
          <Image src="/The-Bshop-logo-REVAMPED-2025_white-logo-landscape-scaled.png" alt="B.Shop Admin" width={120} height={36} className="h-7 w-auto object-contain" />
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
