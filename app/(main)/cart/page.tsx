"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { getCart, saveCart, type Cart, type CartDomain, type CartHosting } from "@/lib/cart";
import type { DomainCheckResult } from "@/lib/whmcs";

type Ease = [number, number, number, number];
const EASE: Ease = [0.22, 1, 0.36, 1];

const MINI_PLANS: { name: string; monthly: number; yearly: number; best?: boolean }[] = [
  { name: "Business Starter Kit", monthly: 8,  yearly: 96  },
  { name: "Business Grower Kit",  monthly: 12, yearly: 144, best: true },
  { name: "Business Plus Kit",    monthly: 16, yearly: 192 },
];

const TLDS = [".com", ".net", ".org", ".biz", ".xyz"];

/* ─── Icons ──────────────────────────────────────────────────────────────── */
function TrashIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" strokeLinecap="round" />
    </svg>
  );
}
function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

/* ─── Domain item card ───────────────────────────────────────────────────── */
function DomainItem({ domain, onRemove }: { domain: CartDomain; onRemove: () => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0  }}
      exit={{    opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.35, ease: EASE }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-purple-100 flex items-center justify-center text-[#6B21A8] text-xl flex-shrink-0">
            🌍
          </div>
          <div>
            <p className="font-black text-black text-base">{domain.domain}</p>
            <p className="text-gray-400 text-xs mt-0.5">Domain Registration · 1 year</p>
          </div>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          <span className="font-bold text-black text-base">${domain.price}<span className="text-gray-400 text-xs font-normal">/yr</span></span>
          <button
            onClick={onRemove}
            className="w-8 h-8 rounded-lg hover:bg-red-50 hover:text-red-500 text-gray-400 flex items-center justify-center transition-colors"
            aria-label="Remove domain"
          >
            <TrashIcon />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Hosting item card ──────────────────────────────────────────────────── */
function HostingItem({ hosting, onRemove }: { hosting: CartHosting; onRemove: () => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0  }}
      exit={{    opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.35, ease: EASE }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 text-xl flex-shrink-0">
            🖥
          </div>
          <div>
            <p className="font-black text-black text-base">{hosting.name}</p>
            <p className="text-gray-400 text-xs mt-0.5">
              Billed annually · ${hosting.yearly}/year
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="text-right">
            <span className="font-bold text-black text-base">${hosting.monthly}<span className="text-gray-400 text-xs font-normal">/mo</span></span>
          </div>
          <button
            onClick={onRemove}
            className="w-8 h-8 rounded-lg hover:bg-red-50 hover:text-red-500 text-gray-400 flex items-center justify-center transition-colors"
            aria-label="Remove hosting"
          >
            <TrashIcon />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Hosting upsell ─────────────────────────────────────────────────────── */
function HostingUpsell({ onAdd }: { onAdd: (h: CartHosting) => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0  }}
      transition={{ duration: 0.4, ease: EASE }}
      className="rounded-2xl bg-gradient-to-br from-[#4c1d95] to-[#6B21A8] p-6"
    >
      <div className="mb-5">
        <p className="text-white font-bold text-lg">Complete your website with hosting</p>
        <p className="text-purple-200 text-sm mt-1">
          Add a hosting plan and your domain is <span className="font-bold text-yellow-300">FREE for the first year.</span>
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        {MINI_PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`bg-white/10 rounded-xl p-4 border transition-all hover:bg-white/20 ${
              plan.best ? "border-white/50 ring-1 ring-white/30" : "border-white/20"
            }`}
          >
            {plan.best && <p className="text-xs font-black text-yellow-300 mb-1.5">⭐ BEST VALUE</p>}
            <p className="text-white font-bold text-sm leading-tight">
              {plan.name.replace("Business ", "").replace(" Kit", "")}
            </p>
            <p className="text-white text-2xl font-black mt-1">
              ${plan.monthly}
              <span className="text-sm font-normal text-purple-200">/mo</span>
            </p>
            <button
              onClick={() => onAdd({ type: "hosting", name: plan.name, monthly: plan.monthly, yearly: plan.yearly })}
              className="mt-3 w-full py-2 bg-white text-[#6B21A8] text-xs font-bold rounded-lg hover:bg-purple-50 transition-colors"
            >
              Add to Cart
            </button>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ─── Domain upsell with mini search ────────────────────────────────────── */
function DomainUpsell({ onAdd }: { onAdd: (d: CartDomain) => void }) {
  const [query,    setQuery]    = useState("");
  const [tld,      setTld]      = useState(".com");
  const [focused,  setFocused]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState<DomainCheckResult | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res  = await fetch("/api/whmcs", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action: "checkDomain", params: { domain: query.trim(), tld } }),
      });
      const json = (await res.json()) as { success: boolean; data?: DomainCheckResult };
      if (json.success && json.data) setResult(json.data);
    } finally { setLoading(false); }
  };

  const handleAdd = () => {
    if (!result?.available) return;
    onAdd({ type: "domain", name: query.trim(), tld, domain: result.domain, price: result.price ?? 12 });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0  }}
      transition={{ duration: 0.4, ease: EASE }}
      className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-6"
    >
      <p className="font-bold text-black text-base mb-1">Add a domain to your hosting</p>
      <p className="text-gray-500 text-sm mb-4">
        Every plan includes a free domain for the first year — claim yours now.
      </p>

      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
        <div
          className="flex-1 relative rounded-xl border-2 transition-all duration-300"
          style={focused
            ? { borderColor: "#6B21A8", boxShadow: "0 0 0 3px rgba(107,33,168,0.1)" }
            : { borderColor: "#e5e7eb" }}
        >
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setResult(null); }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="yourdomain"
            className="w-full px-4 py-3 text-sm font-medium text-black bg-transparent rounded-xl outline-none"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
            {tld}
          </span>
        </div>
        <select
          value={tld}
          onChange={(e) => { setTld(e.target.value); setResult(null); }}
          className="px-3 py-3 text-sm font-semibold text-[#6B21A8] bg-purple-50 border-0 rounded-xl outline-none cursor-pointer"
        >
          {TLDS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="flex items-center gap-2 px-5 py-3 bg-[#6B21A8] text-white font-semibold rounded-xl text-sm transition-all hover:bg-[#581c87] disabled:opacity-50"
        >
          {loading ? <Spinner /> : <SearchIcon />}
          Search
        </button>
      </form>

      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            key={result.domain}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0  }}
            exit={{    opacity: 0, y: -6  }}
            transition={{ duration: 0.3 }}
            className={`mt-3 flex items-center justify-between px-4 py-3 rounded-xl border-2 ${
              result.available
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`font-black text-sm ${result.available ? "text-green-600" : "text-red-500"}`}>
                {result.available ? "✓ Available" : "✕ Taken"}
              </span>
              <span className="text-gray-700 font-medium text-sm">{result.domain}</span>
              {result.available && result.price != null && (
                <span className="text-green-600 font-bold text-sm">${result.price}/yr</span>
              )}
            </div>
            {result.available && (
              <button
                onClick={handleAdd}
                className="text-xs font-bold text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg transition-colors"
              >
                Add to Cart
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Bundle badge ───────────────────────────────────────────────────────── */
function BundleBadge({ discount }: { discount: number }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1    }}
      transition={{ duration: 0.35, ease: EASE }}
      className="flex items-center gap-3 bg-green-50 border-2 border-green-200 rounded-2xl px-5 py-4"
    >
      <span className="text-2xl">🎉</span>
      <div>
        <p className="font-bold text-green-800 text-sm">
          You qualify for a FREE domain for the first year!
        </p>
        <p className="text-green-600 text-xs mt-0.5">
          You save <strong>${discount}</strong> — domain registration included at no extra cost.
        </p>
      </div>
    </motion.div>
  );
}

/* ─── Order summary ──────────────────────────────────────────────────────── */
function OrderSummary({
  cart, subtotal, discount, total,
}: {
  cart: Cart; subtotal: number; discount: number; total: number;
}) {
  const router = useRouter();
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0  }}
      transition={{ delay: 0.1, duration: 0.5, ease: EASE }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-28"
    >
      <h2 className="font-black text-black text-lg mb-5">Order Summary</h2>

      <div className="space-y-3 mb-5">
        {cart.domain && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 font-medium">{cart.domain.domain}</span>
            {discount > 0 ? (
              <span className="flex items-center gap-1.5">
                <span className="line-through text-gray-400 text-xs">${cart.domain.price}</span>
                <span className="font-bold text-green-600">FREE</span>
              </span>
            ) : (
              <span className="font-semibold text-black">${cart.domain.price}/yr</span>
            )}
          </div>
        )}
        {cart.hosting && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 font-medium">{cart.hosting.name}</span>
            <span className="font-semibold text-black">${cart.hosting.yearly}/yr</span>
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 pt-4 space-y-2 mb-5">
        <div className="flex justify-between text-sm text-gray-500">
          <span>Subtotal</span>
          <span>${subtotal}/yr</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-sm text-green-600 font-medium">
            <span>Free domain discount</span>
            <span>−${discount}</span>
          </div>
        )}
        <div className="flex justify-between font-black text-black text-lg pt-1 border-t border-gray-100">
          <span>Total</span>
          <span>${total}/yr</span>
        </div>
      </div>

      <button
        onClick={() => router.push("/checkout")}
        className="w-full py-3.5 bg-[#6B21A8] hover:bg-[#581c87] text-white font-bold rounded-xl transition-all duration-200 hover:shadow-[0_0_28px_rgba(107,33,168,0.4)] text-sm"
      >
        Proceed to Checkout
      </button>

      <div className="mt-4 flex items-center justify-center gap-1.5 text-gray-400 text-xs">
        <LockIcon />
        <span>Secure checkout</span>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
        {["Visa", "Mastercard", "PayPal", "PawaPay"].map((p) => (
          <span key={p} className="px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-md text-xs text-gray-500 font-medium">
            {p}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

/* ─── Empty cart ─────────────────────────────────────────────────────────── */
function EmptyCart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0  }}
      className="text-center py-20"
    >
      <div className="text-6xl mb-4">🛒</div>
      <h2 className="text-2xl font-black text-black mb-2">Your cart is empty</h2>
      <p className="text-gray-400 mb-8">Find a domain or choose a hosting plan to get started.</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/domains" className="px-6 py-3 bg-[#6B21A8] text-white font-bold rounded-full text-sm hover:bg-[#581c87] transition-colors">
          Find a Domain
        </Link>
        <Link href="/hosting" className="px-6 py-3 border-2 border-[#6B21A8] text-[#6B21A8] font-bold rounded-full text-sm hover:bg-purple-50 transition-colors">
          View Hosting Plans
        </Link>
      </div>
    </motion.div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function CartPage() {
  const [cart,  setCart]  = useState<Cart>({});
  const [ready, setReady] = useState(false);

  useEffect(() => { setCart(getCart()); setReady(true); }, []);

  const update = useCallback((next: Cart) => { saveCart(next); setCart(next); }, []);

  const removeDomain  = () => update({ ...cart, domain:  undefined });
  const removeHosting = () => update({ ...cart, hosting: undefined });
  const addHosting = (h: CartHosting) => update({ ...cart, hosting: h });
  const addDomain  = (d: CartDomain)  => update({ ...cart, domain:  d });

  const hasBundle     = !!(cart.domain && cart.hosting);
  const domainPrice   = cart.domain?.price ?? 0;
  const hostingYearly = cart.hosting?.yearly ?? 0;
  const subtotal      = domainPrice + hostingYearly;
  const discount      = hasBundle ? domainPrice : 0;
  const total         = subtotal - discount;

  if (!ready) return null;

  const isEmpty = !cart.domain && !cart.hosting;

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0  }}
          transition={{ duration: 0.5, ease: EASE }}
          className="mb-8"
        >
          <h1 className="text-3xl font-black text-black">Your Cart</h1>
          {!isEmpty && (
            <p className="text-gray-400 text-sm mt-1">
              {[cart.domain && "1 domain", cart.hosting && "1 hosting plan"].filter(Boolean).join(" + ")}
            </p>
          )}
        </motion.div>

        {isEmpty ? (
          <EmptyCart />
        ) : (
          <div className="grid lg:grid-cols-3 gap-8 items-start">
            {/* Left — cart items */}
            <div className="lg:col-span-2">
              <AnimatePresence mode="popLayout">
                {/* Domain */}
                {cart.domain && (
                  <div key="domain" className="mb-4">
                    <DomainItem domain={cart.domain} onRemove={removeDomain} />
                  </div>
                )}

                {/* Hosting upsell */}
                {cart.domain && !cart.hosting && (
                  <div key="hosting-upsell" className="mb-4">
                    <HostingUpsell onAdd={addHosting} />
                  </div>
                )}

                {/* Hosting */}
                {cart.hosting && (
                  <div key="hosting" className="mb-4">
                    <HostingItem hosting={cart.hosting} onRemove={removeHosting} />
                  </div>
                )}

                {/* Domain upsell */}
                {cart.hosting && !cart.domain && (
                  <div key="domain-upsell" className="mb-4">
                    <DomainUpsell onAdd={addDomain} />
                  </div>
                )}

                {/* Bundle badge */}
                {hasBundle && (
                  <div key="bundle">
                    <BundleBadge discount={discount} />
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* Right — order summary */}
            <div>
              <OrderSummary cart={cart} subtotal={subtotal} discount={discount} total={total} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
