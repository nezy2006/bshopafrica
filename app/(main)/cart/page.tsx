"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  getCart, removeFromCart, updateCartItem, calculateTotal, addToCart,
  type CartItem, type CartDomain, type CartHosting, type CartSSL, type CartEmail, type CartTransfer,
  type CartWebsiteBuilder,
} from "@/lib/cart";
import { PaymentIconsRow } from "@/components/PaymentIcons";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/* ─── Icons ──────────────────────────────────────────────────────────────── */
function TrashIcon()   { return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>; }
function GlobeIcon()   { return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>; }
function ServerIcon()  { return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>; }
function ShieldIcon()  { return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>; }
function MailIcon()    { return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>; }
function LockIcon()    { return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>; }
function TagIcon()     { return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>; }
function CheckIcon()   { return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>; }
function PlusIcon()    { return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }

const SSL_UPSELL:   CartSSL   = { id: "ssl_basic",   type: "ssl",   name: "SSL Certificate (Basic)", price: 9.99 };
const EMAIL_UPSELL: CartEmail = { id: "email_pro",   type: "email", name: "Professional Email (5 accounts)", price: 4.99 };

/* ─── Cart item cards ────────────────────────────────────────────────────── */
function DomainCard({ item, onRemove }: { item: CartDomain; onRemove: () => void }) {
  return (
    <motion.div layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.3, ease: EASE }}
      className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4">
      <div className="w-11 h-11 bg-purple-100 rounded-xl flex items-center justify-center text-[#6B21A8] flex-shrink-0">
        <GlobeIcon />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900">{item.domain}</p>
        <p className="text-sm text-gray-500">Domain registration · 1 year</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="font-bold text-gray-900">${item.price.toFixed(2)}<span className="text-xs text-gray-400 font-normal">/yr</span></p>
      </div>
      <button onClick={onRemove} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0">
        <TrashIcon />
      </button>
    </motion.div>
  );
}

function HostingCard({ item, onRemove, onCycleChange }: { item: CartHosting; onRemove: () => void; onCycleChange: (c: "monthly" | "yearly") => void }) {
  return (
    <motion.div layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.3, ease: EASE }}
      className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 bg-purple-100 rounded-xl flex items-center justify-center text-[#6B21A8] flex-shrink-0">
          <ServerIcon />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900">{item.name}</p>
          <p className="text-sm text-gray-500">Web hosting plan</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-bold text-gray-900">
            ${item.cycle === "monthly" ? (item.monthly * 12).toFixed(2) : item.yearly.toFixed(2)}
            <span className="text-xs text-gray-400 font-normal">/yr</span>
          </p>
          {item.cycle === "yearly" && (
            <p className="text-xs text-green-600 font-medium">Save ${((item.monthly * 12) - item.yearly).toFixed(2)}</p>
          )}
        </div>
        <button onClick={onRemove} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0">
          <TrashIcon />
        </button>
      </div>
      {/* Cycle toggle */}
      <div className="mt-4 flex items-center gap-2 bg-gray-50 rounded-xl p-1 w-fit">
        {(["monthly", "yearly"] as const).map(c => (
          <button key={c} onClick={() => onCycleChange(c)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${item.cycle === c ? "bg-white shadow text-[#6B21A8]" : "text-gray-500 hover:text-gray-700"}`}>
            {c === "monthly" ? "Monthly" : "Yearly"}{c === "yearly" && <span className="ml-1.5 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Best Value</span>}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

function AddonCard({ item, onRemove }: { item: CartSSL | CartEmail; onRemove: () => void }) {
  return (
    <motion.div layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.3, ease: EASE }}
      className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4">
      <div className="w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center text-green-600 flex-shrink-0">
        {item.type === "ssl" ? <ShieldIcon /> : <MailIcon />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900">{item.name}</p>
        <p className="text-sm text-gray-500">{item.type === "ssl" ? "SSL/TLS Certificate" : "Professional Email"}</p>
      </div>
      <p className="font-bold text-gray-900 flex-shrink-0">${item.price.toFixed(2)}<span className="text-xs text-gray-400 font-normal">/yr</span></p>
      <button onClick={onRemove} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0">
        <TrashIcon />
      </button>
    </motion.div>
  );
}

/* ─── Website Builder card ───────────────────────────────────────────────── */
function WebsiteBuilderCard({ item, onRemove }: { item: CartWebsiteBuilder; onRemove: () => void }) {
  // Parse colors from siteData for a mini color preview
  let primaryColor = "#6B21A8";
  let secondaryColor = "#4c1d95";
  try {
    const d = JSON.parse(item.siteData) as { colorPrimary?: string; colorSecondary?: string };
    if (d.colorPrimary)   primaryColor   = d.colorPrimary;
    if (d.colorSecondary) secondaryColor = d.colorSecondary;
  } catch { /* ignore */ }

  return (
    <motion.div layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.3, ease: EASE }}
      className="bg-white rounded-2xl border border-purple-200 p-5 space-y-3">
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl flex-shrink-0 overflow-hidden shadow-sm"
          style={{ background: `linear-gradient(135deg, ${secondaryColor}, ${primaryColor})` }}>
          <div className="w-full h-full flex items-center justify-center text-white text-lg">✨</div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900">AI Website Builder</p>
          <p className="text-sm text-gray-500">{item.businessName} · One-time setup</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-bold text-gray-900">${item.price.toFixed(2)}</p>
          <p className="text-xs text-gray-400">one-time</p>
        </div>
        <button onClick={onRemove} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0">
          <TrashIcon />
        </button>
      </div>
      <div className="bg-purple-50 rounded-xl px-4 py-2.5 text-xs text-purple-700 space-y-1">
        <div className="font-semibold mb-1">Includes:</div>
        {["Complete website (all selected pages)", "Hosting integration & domain connection", "SSL certificate · Mobile responsive"].map(f => (
          <div key={f} className="flex items-center gap-1.5"><span className="text-purple-500">✓</span>{f}</div>
        ))}
      </div>
    </motion.div>
  );
}

/* ─── Transfer card ─────────────────────────────────────────────────────── */
function TransferCard({ item, onRemove }: { item: CartTransfer; onRemove: () => void }) {
  return (
    <motion.div layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.3, ease: EASE }}
      className="bg-white rounded-2xl border border-purple-200 p-5 space-y-3">
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 bg-purple-100 rounded-xl flex items-center justify-center text-[#6B21A8] flex-shrink-0">
          <GlobeIcon />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900">Transfer: {item.domain}</p>
          <p className="text-sm text-gray-500">Domain transfer + 1 year renewal</p>
        </div>
        <p className="font-bold text-gray-900 flex-shrink-0">${item.transferPrice.toFixed(2)}<span className="text-xs text-gray-400 font-normal">/yr</span></p>
        <button onClick={onRemove} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0">
          <TrashIcon />
        </button>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <LockIcon />
        <span className="text-gray-500">Auth Code:</span>
        <span className="font-mono text-gray-400">{"•".repeat(Math.min(item.authCode.length, 10))}</span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
          <CheckIcon />Provided
        </span>
      </div>
      <div className="bg-purple-50 rounded-xl px-4 py-2.5 text-xs text-purple-700">
        Nameservers will be automatically set to <span className="font-semibold">ns1–ns4.mysecurecloudhost.com</span> after transfer.
      </div>
    </motion.div>
  );
}

/* ─── Upsell card ────────────────────────────────────────────────────────── */
function UpsellCard({ item, onAdd }: { item: CartSSL | CartEmail; onAdd: () => void }) {
  return (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl p-4 flex items-center gap-4">
      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#6B21A8] flex-shrink-0 shadow-sm">
        {item.type === "ssl" ? <ShieldIcon /> : <MailIcon />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm">{item.name}</p>
        <p className="text-xs text-gray-500">Add for just <span className="text-[#6B21A8] font-semibold">${item.price}/yr</span></p>
      </div>
      <button onClick={onAdd}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#6B21A8] text-white text-sm font-semibold rounded-lg hover:bg-[#581c87] transition-colors flex-shrink-0">
        <PlusIcon />Add
      </button>
    </div>
  );
}

/* ─── Empty state ────────────────────────────────────────────────────────── */
function EmptyCart() {
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}
      className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <svg className="w-12 h-12 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
      <p className="text-gray-500 mb-8 max-w-sm">Start by finding a domain or selecting a hosting plan to build your online presence.</p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link href="/domains"
          className="px-6 py-3 bg-[#6B21A8] text-white font-semibold rounded-full hover:shadow-[0_0_25px_rgba(107,33,168,0.4)] transition-shadow">
          Find a Domain
        </Link>
        <Link href="/hosting"
          className="px-6 py-3 border-2 border-[#6B21A8] text-[#6B21A8] font-semibold rounded-full hover:bg-purple-50 transition-colors">
          View Hosting Plans
        </Link>
      </div>
    </motion.div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────── */
export default function CartPage() {
  const router = useRouter();
  const [items,  setItems]  = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setItems(getCart());
    const sync = () => setItems(getCart());
    window.addEventListener("bshop_cart_update", sync);
    return () => window.removeEventListener("bshop_cart_update", sync);
  }, []);

  const domain          = items.find(i => i.type === "domain")          as CartDomain          | undefined;
  const hosting         = items.find(i => i.type === "hosting")         as CartHosting         | undefined;
  const ssl             = items.find(i => i.type === "ssl")             as CartSSL             | undefined;
  const email           = items.find(i => i.type === "email")           as CartEmail           | undefined;
  const transfer        = items.find(i => i.type === "transfer")        as CartTransfer        | undefined;
  const websiteBuilder  = items.find(i => i.type === "website_builder") as CartWebsiteBuilder  | undefined;
  const totals          = calculateTotal(items);

  function handleRemove(id: string) {
    removeFromCart(id);
  }

  function handleCycleChange(id: string, cycle: "monthly" | "yearly") {
    updateCartItem(id, { cycle });
  }

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gray-50 pt-28 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Cart</h1>
          {items.length > 0 && <p className="text-gray-500 mt-1">{items.length} item{items.length !== 1 ? "s" : ""}</p>}
        </div>

        {items.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Items column */}
            <div className="lg:col-span-2 space-y-4">
              <AnimatePresence mode="popLayout">
                {domain          && <DomainCard          key={domain.id}         item={domain}         onRemove={() => handleRemove(domain.id)} />}
                {hosting         && <HostingCard          key={hosting.id}        item={hosting}        onRemove={() => handleRemove(hosting.id)} onCycleChange={c => handleCycleChange(hosting.id, c)} />}
                {ssl             && <AddonCard            key={ssl.id}            item={ssl}            onRemove={() => handleRemove(ssl.id)} />}
                {email           && <AddonCard            key={email.id}          item={email}          onRemove={() => handleRemove(email.id)} />}
                {transfer        && <TransferCard         key={transfer.id}       item={transfer}       onRemove={() => handleRemove(transfer.id)} />}
                {websiteBuilder  && <WebsiteBuilderCard   key={websiteBuilder.id} item={websiteBuilder} onRemove={() => handleRemove(websiteBuilder.id)} />}
              </AnimatePresence>

              {/* Upsells */}
              {(items.length > 0) && (
                <div className="space-y-3 mt-2">
                  {!ssl   && <UpsellCard item={SSL_UPSELL}   onAdd={() => { addToCart(SSL_UPSELL);   setItems(getCart()); }} />}
                  {!email && <UpsellCard item={EMAIL_UPSELL} onAdd={() => { addToCart(EMAIL_UPSELL); setItems(getCart()); }} />}
                </div>
              )}
            </div>

            {/* Order summary */}
            <div className="lg:col-span-1">
              <motion.div layout
                className="bg-white rounded-2xl border border-gray-200 p-6 sticky top-28 shadow-sm">
                <h2 className="font-bold text-gray-900 text-lg mb-5">Order Summary</h2>

                {/* Line items */}
                <div className="space-y-3 text-sm">
                  {domain && (
                    <div className="flex justify-between text-gray-600">
                      <span>{domain.domain}</span>
                      <span>${domain.price.toFixed(2)}</span>
                    </div>
                  )}
                  {hosting && (
                    <div className="flex justify-between text-gray-600">
                      <span>{hosting.name}</span>
                      <span>${(hosting.cycle === "monthly" ? hosting.monthly * 12 : hosting.yearly).toFixed(2)}</span>
                    </div>
                  )}
                  {ssl && (
                    <div className="flex justify-between text-gray-600">
                      <span>SSL Certificate</span>
                      <span>${ssl.price.toFixed(2)}</span>
                    </div>
                  )}
                  {email && (
                    <div className="flex justify-between text-gray-600">
                      <span>Professional Email</span>
                      <span>${email.price.toFixed(2)}</span>
                    </div>
                  )}
                  {transfer && (
                    <div className="flex justify-between text-gray-600">
                      <span>Transfer: {transfer.domain}</span>
                      <span>${transfer.transferPrice.toFixed(2)}</span>
                    </div>
                  )}
                  {websiteBuilder && (
                    <div className="flex justify-between text-gray-600">
                      <span>AI Website Builder</span>
                      <span>${websiteBuilder.price.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Subtotal */}
                <div className="border-t border-gray-100 mt-4 pt-4 flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>${totals.subtotal.toFixed(2)}</span>
                </div>

                {/* Bundle discount */}
                {totals.hasBundleDiscount && (
                  <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="mt-3 bg-green-50 border border-green-200 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-green-700 text-sm font-semibold">
                      <TagIcon /><span>Bundle Discount</span>
                    </div>
                    <div className="flex justify-between text-green-700 text-sm mt-1">
                      <span>{totals.discountLabel}</span>
                      <span>-${totals.discount.toFixed(2)}</span>
                    </div>
                  </motion.div>
                )}

                {/* Total */}
                <div className="border-t border-gray-100 mt-4 pt-4 flex justify-between font-bold text-gray-900 text-lg">
                  <span>Total</span>
                  <span>${totals.total.toFixed(2)}/yr</span>
                </div>

                {/* Proceed */}
                <button
                  onClick={() => router.push("/checkout")}
                  className="w-full mt-6 py-3.5 bg-[#6B21A8] text-white font-bold rounded-2xl hover:shadow-[0_0_30px_rgba(107,33,168,0.45)] transition-shadow text-base">
                  Proceed to Checkout →
                </button>

                {/* Trust badges */}
                <div className="mt-5 flex items-center justify-center gap-1.5 text-xs text-gray-400">
                  <LockIcon /><span>Secure checkout</span>
                  <span className="mx-1">·</span>
                  <CheckIcon /><span>30-day money back</span>
                </div>

                <p className="text-center text-xs text-gray-400 mt-3">All prices in USD. Billed annually.</p>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-400 text-center mb-2">We Accept</p>
                  <PaymentIconsRow className="justify-center" />
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
