"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { getCart, clearCart, type CartItem, type CartDomain, type CartHosting } from "@/lib/cart";

// Legacy shape for checkout summary compat
interface Cart { domain?: CartDomain; hosting?: CartHosting; }
function itemsToCart(items: CartItem[]): Cart {
  return {
    domain:  items.find(i => i.type === "domain")  as CartDomain  | undefined,
    hosting: items.find(i => i.type === "hosting") as CartHosting | undefined,
  };
}

type Ease = [number, number, number, number];
const EASE: Ease = [0.22, 1, 0.36, 1];
type Step = 2 | 3 | 4;
type PayMethod = "paypal" | "pawapay";

const INPUT =
  "w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-base text-black placeholder-gray-400 outline-none transition-all duration-300 hover:border-gray-300 focus:border-[#6B21A8] focus:bg-white focus:shadow-[0_0_0_4px_rgba(107,33,168,0.1)]";

/* ─── Icons ──────────────────────────────────────────────────────────────── */
function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
function Spinner({ sm }: { sm?: boolean }) {
  return (
    <svg className={`animate-spin ${sm ? "w-4 h-4" : "w-5 h-5"}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

/* ─── Step indicator ─────────────────────────────────────────────────────── */
const STEPS = [
  { num: 1, label: "Cart"     },
  { num: 2, label: "Account"  },
  { num: 3, label: "Payment"  },
  { num: 4, label: "Complete" },
];

function StepIndicator({ current }: { current: Step }) {
  return (
    <div className="flex items-center justify-center mb-10">
      {STEPS.map((s, i) => (
        <div key={s.num} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
              s.num < current  ? "bg-green-500 text-white" :
              s.num === current ? "bg-[#6B21A8] text-white shadow-[0_0_0_4px_rgba(107,33,168,0.2)]" :
                                  "bg-gray-100 text-gray-400"
            }`}>
              {s.num < current ? "✓" : s.num}
            </div>
            <span className={`text-xs mt-1.5 font-semibold hidden sm:block ${
              s.num === current ? "text-[#6B21A8]" : s.num < current ? "text-green-500" : "text-gray-400"
            }`}>{s.label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`w-12 sm:w-20 h-0.5 mx-1 mb-3.5 transition-colors duration-300 ${
              s.num < current ? "bg-green-500" : "bg-gray-200"
            }`} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Cart summary (right sidebar in payment step) ──────────────────────── */
function CartSummary({ cart }: { cart: Cart }) {
  const hasBundle     = !!(cart.domain && cart.hosting);
  const domainPrice   = cart.domain?.price ?? 0;
  const hostingYearly = cart.hosting?.yearly ?? 0;
  const discount      = hasBundle ? domainPrice : 0;
  const total         = domainPrice + hostingYearly - discount;

  return (
    <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5">
      <h3 className="font-bold text-black text-sm mb-4 uppercase tracking-wide">Order Summary</h3>
      <div className="space-y-2.5 mb-4">
        {cart.domain && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{cart.domain.domain}</span>
            {discount > 0
              ? <span className="text-green-600 font-bold">FREE</span>
              : <span className="font-semibold">${cart.domain.price}/yr</span>}
          </div>
        )}
        {cart.hosting && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 truncate pr-2">{cart.hosting.name}</span>
            <span className="font-semibold flex-shrink-0">${cart.hosting.yearly}/yr</span>
          </div>
        )}
        {discount > 0 && (
          <div className="flex justify-between text-xs text-green-600 font-medium">
            <span>Free domain saving</span><span>−${discount}</span>
          </div>
        )}
      </div>
      <div className="border-t border-gray-200 pt-3 flex justify-between font-black text-black">
        <span>Total</span><span>${total}/yr</span>
      </div>
    </div>
  );
}

/* ─── Step 2: Account ────────────────────────────────────────────────────── */
function StepAccount({ onDone }: { onDone: () => void }) {
  const [tab,        setTab]        = useState<"login" | "register">("login");
  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [showPw,     setShowPw]     = useState(false);
  const [firstName,  setFirstName]  = useState("");
  const [lastName,   setLastName]   = useState("");
  const [phone,      setPhone]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [loggedIn,   setLoggedIn]   = useState(false);
  const [clientName, setClientName] = useState("");

  useEffect(() => {
    const id = localStorage.getItem("bshop_client_id");
    if (id) { setLoggedIn(true); }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const res  = await fetch("/api/whmcs", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action: "loginClient", params: { email, password } }),
      });
      const json = (await res.json()) as { success: boolean; data?: { clientId: number }; error?: string };
      if (!json.success || !json.data?.clientId) { setError("Invalid email or password."); return; }
      localStorage.setItem("bshop_client_id", String(json.data.clientId));
      onDone();
    } catch { setError("Something went wrong. Please try again."); }
    finally { setLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !password || !phone) {
      setError("All fields are required."); return;
    }
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/whmcs", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          action: "registerClient",
          params: {
            firstname: firstName, lastname: lastName, email,
            phonenumber: phone,   password2: password,
            address1: "Not provided", city: "Not provided",
            state: "N/A", postcode: "00000", country: "RW",
          },
        }),
      });
      const json = (await res.json()) as { success: boolean; data?: { clientId: number }; error?: string };
      if (!json.success || !json.data?.clientId) { setError(json.error ?? "Registration failed."); return; }
      localStorage.setItem("bshop_client_id", String(json.data.clientId));
      onDone();
    } catch { setError("Something went wrong. Please try again."); }
    finally { setLoading(false); }
  };

  if (loggedIn) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0  }}
        className="text-center py-8"
      >
        <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center text-[#6B21A8] text-2xl mx-auto mb-4">👤</div>
        <h2 className="text-2xl font-black text-black mb-2">You&apos;re already logged in</h2>
        <p className="text-gray-500 mb-8">Continue with your existing account to complete your order.</p>
        <button
          onClick={onDone}
          className="px-8 py-3.5 bg-[#6B21A8] text-white font-bold rounded-full text-sm hover:bg-[#581c87] transition-colors"
        >
          Continue to Payment →
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }}>
      <h2 className="text-2xl font-black text-black mb-6">Your Account</h2>

      {/* Tab selector */}
      <div className="flex rounded-xl bg-gray-100 p-1 mb-7">
        {(["login", "register"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setError(null); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
              tab === t ? "bg-white text-[#6B21A8] shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "login" ? "I have an account" : "I'm new here"}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === "login" ? (
          <motion.form
            key="login"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0   }}
            exit={{    opacity: 0, x:  16  }}
            transition={{ duration: 0.25 }}
            onSubmit={handleLogin}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required className={INPUT} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required className={`${INPUT} pr-12`} />
                <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#6B21A8] transition-colors">
                  <EyeIcon open={showPw} />
                </button>
              </div>
            </div>
            {error && <p className="text-sm text-red-500 font-medium bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}
            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#6B21A8] text-white font-bold rounded-xl hover:bg-[#581c87] transition-colors disabled:opacity-70">
              {loading ? <><Spinner sm /><span>Logging in…</span></> : "Log In & Continue"}
            </button>
          </motion.form>
        ) : (
          <motion.form
            key="register"
            initial={{ opacity: 0, x: 16  }}
            animate={{ opacity: 1, x: 0   }}
            exit={{    opacity: 0, x: -16  }}
            transition={{ duration: 0.25 }}
            onSubmit={handleRegister}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">First Name</label>
                <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Jane" className={INPUT} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name</label>
                <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Doe" className={INPUT} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" className={INPUT} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+250 700 000 000" className={INPUT} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" className={`${INPUT} pr-12`} />
                <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#6B21A8] transition-colors">
                  <EyeIcon open={showPw} />
                </button>
              </div>
            </div>
            {error && <p className="text-sm text-red-500 font-medium bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}
            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#6B21A8] text-white font-bold rounded-xl hover:bg-[#581c87] transition-colors disabled:opacity-70">
              {loading ? <><Spinner sm /><span>Creating account…</span></> : "Create Account & Continue"}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Step 3: Payment ────────────────────────────────────────────────────── */
function StepPayment({ cart, onDone }: { cart: Cart; onDone: (orderNum: string) => void }) {
  const [method,  setMethod]  = useState<PayMethod>("paypal");
  const [phone,   setPhone]   = useState("");
  const [agreed,  setAgreed]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const handleComplete = async () => {
    if (!agreed) { setError("Please agree to the Terms of Service to continue."); return; }
    if (method === "pawapay" && !phone.trim()) { setError("Please enter your mobile money number."); return; }
    setLoading(true); setError(null);
    await new Promise(r => setTimeout(r, 2200)); // simulate API call
    const orderNum = `BSH-${Date.now().toString(36).toUpperCase().slice(-8)}`;
    clearCart();
    onDone(orderNum);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }}>
      <h2 className="text-2xl font-black text-black mb-6">Payment</h2>

      <div className="grid lg:grid-cols-[1fr_280px] gap-8">
        <div className="space-y-6">
          {/* Method tabs */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">Select payment method</p>
            <div className="grid grid-cols-2 gap-3">
              {(["paypal", "pawapay"] as PayMethod[]).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMethod(m); setError(null); }}
                  className={`flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 font-bold text-sm transition-all duration-200 ${
                    method === m
                      ? "border-[#6B21A8] bg-purple-50 text-[#6B21A8] shadow-[0_0_0_4px_rgba(107,33,168,0.1)]"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {m === "paypal" ? "🅿 PayPal" : "📱 PawaPay"}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {method === "paypal" ? (
              <motion.div key="paypal" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                className="bg-[#FFC439] rounded-2xl p-6 text-center"
              >
                <p className="font-black text-[#003087] text-base mb-1">Pay with PayPal</p>
                <p className="text-[#003087]/70 text-sm">
                  You&apos;ll be redirected to PayPal to complete your payment securely.
                </p>
              </motion.div>
            ) : (
              <motion.div key="pawapay" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                className="bg-green-50 border-2 border-green-200 rounded-2xl p-6"
              >
                <p className="font-bold text-green-800 text-sm mb-1">Mobile Money via PawaPay</p>
                <p className="text-green-600 text-xs mb-4">Enter your MTN Mobile Money or Airtel Money number.</p>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mobile Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+250 700 000 000"
                  className={INPUT}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Terms */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div
              onClick={() => setAgreed(v => !v)}
              className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all cursor-pointer ${
                agreed ? "bg-[#6B21A8] border-[#6B21A8]" : "border-gray-300 group-hover:border-[#6B21A8]"
              }`}
            >
              {agreed && (
                <svg viewBox="0 0 12 10" fill="none" className="w-3 h-3">
                  <path d="M1 5l3.5 3.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span className="text-sm text-gray-600 leading-snug">
              I agree to the{" "}
              <Link href="#" className="text-[#6B21A8] font-semibold hover:underline">Terms of Service</Link>
              {" "}and{" "}
              <Link href="#" className="text-[#6B21A8] font-semibold hover:underline">Privacy Policy</Link>
            </span>
          </label>

          {error && <p className="text-sm text-red-500 font-medium bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}

          <button
            onClick={handleComplete}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-4 bg-[#6B21A8] text-white font-black rounded-xl text-base transition-all hover:bg-[#581c87] hover:shadow-[0_0_28px_rgba(107,33,168,0.45)] disabled:opacity-70"
          >
            {loading ? <><Spinner /><span>Processing…</span></> : (
              <><LockIcon /><span>Complete Order</span></>
            )}
          </button>
        </div>

        <CartSummary cart={cart} />
      </div>
    </motion.div>
  );
}

/* ─── Step 4: Complete ───────────────────────────────────────────────────── */
function StepComplete({ orderNum }: { orderNum: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1    }}
      transition={{ duration: 0.5, ease: EASE }}
      className="text-center py-8"
    >
      {/* Animated checkmark */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 220, damping: 18 }}
        className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(34,197,94,0.4)]"
      >
        <motion.svg
          viewBox="0 0 52 52"
          fill="none"
          className="w-12 h-12"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.4, duration: 0.5, ease: "easeOut" }}
        >
          <motion.path
            d="M14 27l9 9 16-18"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.4, duration: 0.5, ease: "easeOut" }}
          />
        </motion.svg>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0  }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <h2 className="text-3xl font-black text-black mb-3">Your order is being processed!</h2>
        <p className="text-gray-500 mb-2">
          Order number: <span className="font-bold text-[#6B21A8]">{orderNum}</span>
        </p>
        <p className="text-gray-400 text-sm mb-10">
          Check your email for confirmation and next steps.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/dashboard"
            className="px-8 py-3.5 bg-[#6B21A8] text-white font-bold rounded-full text-sm hover:bg-[#581c87] transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="px-8 py-3.5 border-2 border-gray-200 text-gray-700 font-bold rounded-full text-sm hover:border-gray-300 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Checkout page ──────────────────────────────────────────────────────── */
export default function CheckoutPage() {
  const router   = useRouter();
  const [step,     setStep]     = useState<Step>(2);
  const [cart,     setCart]     = useState<Cart>({});
  const [ready,    setReady]    = useState(false);
  const [orderNum, setOrderNum] = useState("");

  useEffect(() => {
    const items = getCart();
    const c = itemsToCart(items);
    if (!c.domain && !c.hosting) { router.replace("/cart"); return; }
    setCart(c);
    setReady(true);
  }, [router]);

  const handleAccountDone = useCallback(() => setStep(3), []);
  const handleOrderDone   = useCallback((num: string) => { setOrderNum(num); setStep(4); }, []);

  if (!ready) return null;

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0  }}
          className="mb-8 text-center"
        >
          <h1 className="text-3xl font-black text-black">Checkout</h1>
        </motion.div>

        <StepIndicator current={step} />

        {/* Step content */}
        <motion.div
          className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0  }}
          transition={{ delay: 0.1, duration: 0.5, ease: EASE }}
        >
          <AnimatePresence mode="wait">
            {step === 2 && <div key="step2"><StepAccount onDone={handleAccountDone} /></div>}
            {step === 3 && <div key="step3"><StepPayment cart={cart} onDone={handleOrderDone} /></div>}
            {step === 4 && <div key="step4"><StepComplete orderNum={orderNum} /></div>}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
