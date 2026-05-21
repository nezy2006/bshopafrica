"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { User } from "lucide-react";
import { getCartCount } from "@/lib/cart";
import { getUnreadCount, getNotifications, markAllRead, type AppNotification } from "@/lib/notifications";

const NAV_LINKS = [
  { label: "Home",             href: "/" },
  { label: "About Us",         href: "/about" },
  { label: "Digital Campfire", href: "/digital-campfire" },
  { label: "Contact Us",       href: "/contact" },
];

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/* ─── Icons ──────────────────────────────────────────────────────────────── */
function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}
function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
function ChevronDown() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
function DashIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
}
function GlobeSmIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
}
function ServerSmIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>;
}
function InvoiceSmIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
}
function SupportSmIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>;
}
function SettingsSmIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
}
function LogoutSmIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
}

/* ─── Notification dropdown ──────────────────────────────────────────────── */
function NotifIcon({ type }: { type: AppNotification["type"] }) {
  const cls = "w-2 h-2 rounded-full flex-shrink-0 mt-1.5";
  const colors: Record<AppNotification["type"], string> = {
    domain_expiring:    "bg-orange-400",
    invoice_due:        "bg-red-400",
    ticket_replied:     "bg-blue-400",
    order_completed:    "bg-green-400",
    service_suspended:  "bg-red-600",
    info:               "bg-gray-400",
  };
  return <span className={`${cls} ${colors[type]}`} />;
}

// Pages with dark/purple hero — white nav text is readable there
// /dashboard excluded: it has a white/gray bg; sidebar owns the logo there
const DARK_HERO_PATHS = ["/about", "/contact", "/domains", "/hosting", "/digital-campfire", "/login", "/signup", "/cart", "/checkout"];

export default function Header() {
  const router   = useRouter();
  const pathname = usePathname();
  const [scrolled,  setScrolled]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [unread,    setUnread]    = useState(0);
  const [notifs,    setNotifs]    = useState<AppNotification[]>([]);
  const [loggedIn,     setLoggedIn]     = useState(false);
  const [clientName,   setClientName]   = useState("");
  const [clientFirst,  setClientFirst]  = useState("");
  const [clientEmail,  setClientEmail]  = useState("");
  const [userDropOpen,  setUserDropOpen]  = useState(false);
  const [notifDropOpen, setNotifDropOpen] = useState(false);
  const userRef  = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  /* Sync cart + notifications + auth on mount and storage events */
  useEffect(() => {
    function sync() {
      setCartCount(getCartCount());
      setUnread(getUnreadCount());
      setNotifs(getNotifications().slice(0, 5));
      const id    = localStorage.getItem("bshop_client_id");
      const name  = localStorage.getItem("bshop_client_name") ?? "";
      const first = localStorage.getItem("bshop_client_firstname")
                    || (name.trim() ? name.trim().split(/\s+/)[0] : null)
                    || null;
      const email = localStorage.getItem("bshop_client_email") ?? "";
      setLoggedIn(!!id && !!first);   // only "logged in" display when we have a real name
      setClientName(name);
      setClientFirst(first ?? "");
      setClientEmail(email);
    }
    sync();
    window.addEventListener("bshop_cart_update",          sync);
    window.addEventListener("bshop_notifications_update", sync);
    window.addEventListener("storage",                    sync);
    return () => {
      window.removeEventListener("bshop_cart_update",          sync);
      window.removeEventListener("bshop_notifications_update", sync);
      window.removeEventListener("storage",                    sync);
    };
  }, []);

  /* Close dropdowns on outside click */
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (userRef.current  && !userRef.current.contains(e.target as Node))  setUserDropOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifDropOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function handleLogout() {
    localStorage.removeItem("bshop_client_id");
    localStorage.removeItem("bshop_client_name");
    localStorage.removeItem("bshop_client_firstname");
    localStorage.removeItem("bshop_client_email");
    setLoggedIn(false);
    setUserDropOpen(false);
    router.push("/");
  }

  const isDashboard = pathname.startsWith("/dashboard");
  // White text only when: not scrolled AND on a dark-hero page AND not dashboard
  const onDarkHero  = !scrolled && !isDashboard && DARK_HERO_PATHS.some(p => pathname === p || pathname.startsWith(p + "/"));
  const navTextCls  = onDarkHero ? "text-white hover:text-white/80" : "text-gray-800 hover:text-[#6B21A8]";
  const underlineCls = onDarkHero ? "bg-white" : "bg-[#6B21A8]";
  const iconBtnCls   = `relative p-2 rounded-lg transition-colors ${onDarkHero ? "text-white hover:bg-white/20" : "text-gray-700 hover:bg-gray-100"}`;

  return (
    <motion.header
      className={`fixed top-8 left-0 right-0 z-40 transition-all duration-500 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.08)]"
          : "bg-white/10 backdrop-blur-sm"
      }`}
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0,   opacity: 1 }}
      transition={{ duration: 0.7, ease: EASE }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo — hidden on /dashboard (sidebar owns it there) */}
          {!isDashboard && (
            <Link href="/" className="flex-shrink-0">
              <Image
                src={onDarkHero ? "/The-Bshop-logo-REVAMPED-2025_white-logo-landscape-scaled.png" : "/logo.png"}
                alt="The B.Shop"
                width={160} height={50}
                className="h-10 w-auto object-contain transition-opacity duration-300"
                priority
              />
            </Link>
          )}

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link key={link.label} href={link.href}
                className={`relative group text-sm font-medium transition-colors duration-200 ${navTextCls}`}>
                {link.label}
                <span className={`absolute -bottom-0.5 left-0 h-[2px] w-0 rounded-full transition-all duration-300 ease-out group-hover:w-full ${underlineCls}`} />
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-1">

            {/* Cart */}
            <Link href="/cart" className={iconBtnCls}>
              <CartIcon />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-[#6B21A8] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Notifications */}
            <div ref={notifRef} className="relative">
              <button className={iconBtnCls} onClick={() => { setNotifDropOpen(o => !o); setUserDropOpen(false); }}>
                <BellIcon />
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {unread}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {notifDropOpen && (
                  <motion.div
                    key="notif-drop"
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.18, ease: EASE }}
                    className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50"
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                      <span className="font-semibold text-gray-900 text-sm">Notifications</span>
                      {unread > 0 && (
                        <button onClick={() => { markAllRead(); setUnread(0); setNotifs(notifs.map(n => ({...n, read: true}))); }}
                          className="text-xs text-[#6B21A8] hover:underline">Mark all read</button>
                      )}
                    </div>
                    {notifs.length === 0 ? (
                      <div className="py-8 text-center text-gray-400 text-sm">No notifications</div>
                    ) : (
                      <div>
                        {notifs.map(n => (
                          <div key={n.id} className={`flex gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${!n.read ? "bg-purple-50/50" : ""}`}>
                            <NotifIcon type={n.type} />
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm leading-snug ${!n.read ? "font-medium text-gray-900" : "text-gray-600"}`}>{n.message}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{new Date(n.date).toLocaleDateString()}</p>
                            </div>
                          </div>
                        ))}
                        <Link href="/dashboard" onClick={() => setNotifDropOpen(false)}
                          className="block text-center text-xs text-[#6B21A8] hover:underline py-2.5 border-t border-gray-100">
                          View all notifications →
                        </Link>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Auth: logged in → avatar + dropdown | logged out → Login/Signup */}
            {loggedIn ? (
              <div ref={userRef} className="relative ml-1">
                <button
                  onClick={() => { setUserDropOpen(o => !o); setNotifDropOpen(false); }}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-full transition-colors ${onDarkHero ? "hover:bg-white/20" : "hover:bg-gray-100"}`}
                >
                  <span className="w-7 h-7 rounded-full bg-[#6B21A8] flex items-center justify-center flex-shrink-0">
                    <User className="w-3.5 h-3.5 text-white" />
                  </span>
                  <span className={`text-sm font-semibold hidden lg:block ${onDarkHero ? "text-white" : "text-gray-800"}`}>
                    {clientFirst}
                  </span>
                  <ChevronDown />
                </button>

                <AnimatePresence>
                  {userDropOpen && (
                    <motion.div
                      key="user-drop"
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.18, ease: EASE }}
                      className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50"
                    >
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="font-bold text-gray-900 text-sm truncate">{clientName || clientFirst}</p>
                        {clientEmail && <p className="text-xs text-gray-400 truncate mt-0.5">{clientEmail}</p>}
                      </div>
                      {([
                        { href: "/dashboard",              label: "Dashboard",        Icon: DashIcon },
                        { href: "/dashboard?s=domains",    label: "My Domains",       Icon: GlobeSmIcon },
                        { href: "/dashboard?s=hosting",    label: "My Hosting",       Icon: ServerSmIcon },
                        { href: "/dashboard?s=invoices",   label: "Invoices",         Icon: InvoiceSmIcon },
                        { href: "/dashboard?s=support",    label: "Support",          Icon: SupportSmIcon },
                        { href: "/dashboard?s=settings",   label: "Account Settings", Icon: SettingsSmIcon },
                      ] as { href: string; label: string; Icon: () => React.ReactElement }[]).map(item => (
                        <Link key={item.label} href={item.href}
                          onClick={() => setUserDropOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#6B21A8] transition-colors">
                          <item.Icon />{item.label}
                        </Link>
                      ))}
                      <div className="border-t border-gray-100">
                        <button onClick={handleLogout}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                          <LogoutSmIcon />Logout
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Link href="/login"
                  className={`text-sm font-medium transition-colors px-4 py-2 rounded-lg ${onDarkHero ? "text-white hover:text-white/80" : "text-gray-700 hover:text-[#6B21A8]"}`}>
                  Login
                </Link>
                <Link href="/signup"
                  className={`text-sm font-medium transition-colors px-4 py-2 rounded-lg ${onDarkHero ? "text-white hover:text-white/80" : "text-gray-700 hover:text-[#6B21A8]"}`}>
                  Signup
                </Link>
              </>
            )}

            {/* Get Started — inverted when over dark hero, normal when scrolled */}
            <Link href="/get-started"
              className={`relative overflow-hidden ml-1 inline-flex items-center px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                onDarkHero
                  ? "bg-white text-[#6B21A8] hover:shadow-[0_0_25px_rgba(255,255,255,0.35)]"
                  : "bg-[#6B21A8] text-white hover:shadow-[0_0_25px_rgba(107,33,168,0.55)]"
              }`}>
              <span className="relative z-10">Get Started</span>
              <motion.span
                className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-black/10 to-transparent"
                initial={{ x: "-150%" }} whileHover={{ x: "250%" }}
                transition={{ duration: 0.55, ease: "easeInOut" }}
              />
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className={`md:hidden relative p-2 flex flex-col justify-center items-center w-10 h-10 rounded-lg transition-colors ${onDarkHero ? "hover:bg-white/20" : "hover:bg-gray-100"}`}
            onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu"
          >
            {(["top", "mid", "bot"] as const).map((pos, i) => (
              <motion.span key={pos}
                className={`block w-6 h-0.5 origin-center transition-colors duration-300 ${i > 0 ? "mt-1.5" : ""} ${onDarkHero ? "bg-white" : "bg-gray-800"}`}
                animate={
                  pos === "top" ? (menuOpen ? { rotate: 45,  y: 6 }  : { rotate: 0, y: 0 }) :
                  pos === "mid" ? (menuOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }) :
                                  (menuOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 })
                }
                transition={{ duration: pos === "mid" ? 0.2 : 0.25 }}
              />
            ))}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div key="mobile-menu"
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="md:hidden overflow-hidden bg-white border-t border-gray-100 shadow-lg">
            <div className="px-4 pt-3 pb-5 flex flex-col gap-1">
              {NAV_LINKS.map((link, i) => (
                <motion.div key={link.label} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.07 + 0.05, duration: 0.3 }}>
                  <Link href={link.href} onClick={() => setMenuOpen(false)}
                    className="block px-3 py-2.5 text-gray-800 font-medium rounded-lg hover:bg-purple-50 hover:text-[#6B21A8] transition-colors">
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                <Link href="/cart" className="relative flex-1 text-center py-2.5 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
                  Cart{cartCount > 0 && <span className="ml-1 bg-[#6B21A8] text-white text-xs rounded-full px-1.5">{cartCount}</span>}
                </Link>
                {loggedIn ? (
                  <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="flex-1 text-center py-2.5 text-[#6B21A8] font-semibold rounded-lg hover:bg-purple-50 transition-colors">Dashboard</Link>
                ) : (
                  <>
                    <Link href="/login"  className="flex-1 text-center py-2.5 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">Login</Link>
                    <Link href="/signup" className="flex-1 text-center py-2.5 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">Signup</Link>
                  </>
                )}
                <Link href="/get-started" className="flex-1 text-center py-2.5 bg-[#6B21A8] text-white font-semibold rounded-full hover:bg-[#581c87] transition-colors">Get Started</Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
