"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { getCart, clearCart, type CartItem, type CartDomain, type CartHosting, type CartTransfer, type CartWebsiteBuilder } from "@/lib/cart";
import { AUTH_KEYS, authHeaders } from "@/lib/auth";
// CartTransfer and CartWebsiteBuilder used in type guards within StepPayment
import { PaymentOptionCard, PayPalWordmark, MtnLogo, AirtelLogo } from "@/components/PaymentOptions";
import { PayPalCheckoutButton } from "@/components/PayPalCheckoutButton";
import { getPawapayFailureMessage } from "@/lib/pawapay-errors";

// Legacy shape for checkout summary compat
interface Cart {
  domain?:         CartDomain;
  hosting?:        CartHosting;
  websiteBuilder?: CartWebsiteBuilder;
}
function itemsToCart(items: CartItem[]): Cart {
  return {
    domain:         items.find(i => i.type === "domain")          as CartDomain          | undefined,
    hosting:        items.find(i => i.type === "hosting")         as CartHosting         | undefined,
    websiteBuilder: items.find(i => i.type === "website_builder") as CartWebsiteBuilder  | undefined,
  };
}

type Ease = [number, number, number, number];
const EASE: Ease = [0.22, 1, 0.36, 1];
type Step = 2 | 3;
type PayMethod = "paypal" | "mtn" | "airtel";
interface CouponState {
  code:     string;
  applied:  boolean;
  loading:  boolean;
  type:     "percentage" | "fixed";
  value:    number;
  discount: number;
  message:  string;
  error:    string;
}


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
  { num: 1, label: "Cart"    },
  { num: 2, label: "Account" },
  { num: 3, label: "Payment" },
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
function CartSummary({ cart, couponDiscount = 0 }: { cart: Cart; couponDiscount?: number }) {
  const hasBundle     = !!(cart.domain && cart.hosting);
  const domainPrice   = cart.domain?.price ?? 0;
  const hostingYearly = cart.hosting?.yearly ?? 0;
  const wbPrice       = cart.websiteBuilder?.price ?? 0;
  const bundleDiscount = hasBundle ? domainPrice : 0;
  const subtotal      = domainPrice + hostingYearly + wbPrice - bundleDiscount;
  const total         = Math.max(0, subtotal - couponDiscount);

  return (
    <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5">
      <h3 className="font-bold text-black text-sm mb-4 uppercase tracking-wide">Order Summary</h3>
      <div className="space-y-2.5 mb-4">
        {cart.domain && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{cart.domain.domain}</span>
            {bundleDiscount > 0
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
        {cart.websiteBuilder && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">AI Website Builder</span>
            <span className="font-semibold">${cart.websiteBuilder.price}</span>
          </div>
        )}
        {bundleDiscount > 0 && (
          <div className="flex justify-between text-xs text-green-600 font-medium">
            <span>Free domain saving</span><span>−${bundleDiscount}</span>
          </div>
        )}
        {couponDiscount > 0 && (
          <div className="flex justify-between text-xs text-purple-600 font-semibold">
            <span>Coupon discount</span><span>−${couponDiscount.toFixed(2)}</span>
          </div>
        )}
      </div>
      <div className="border-t border-gray-200 pt-3 flex justify-between font-black text-black">
        <span>Total</span>
        <div className="text-right">
          <div>${total.toFixed(2)}{cart.hosting || cart.domain ? "/yr" : ""}</div>
          <div className="text-[11px] font-medium text-gray-400 mt-0.5">≈ RWF {Math.round(total * 1400).toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}

/* ─── Step 2: Account ────────────────────────────────────────────────────── */
function StepAccount({ onDone }: { onDone: () => void }) {
  const [tab,         setTab]         = useState<"login" | "register">("login");
  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [showPw,      setShowPw]      = useState(false);
  const [firstName,   setFirstName]   = useState("");
  const [lastName,    setLastName]    = useState("");
  const [phone,       setPhone]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [emailExists, setEmailExists] = useState(false);
  const [success,     setSuccess]     = useState(false);

  // If already logged in, skip this step immediately
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("bshop_client_id")) {
      onDone();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const json = (await res.json()) as { success: boolean; data?: { clientId: number; firstname: string; lastname: string; email: string; sessionToken: string }; error?: string };
      if (!json.success || !json.data?.clientId) {
        setError(json.error ?? "Invalid email or password.");
        return;
      }
      const { clientId, firstname, lastname, email: clientEmail, sessionToken } = json.data;
      localStorage.setItem("bshop_client_id",        String(clientId));
      localStorage.setItem("bshop_client_firstname", firstname ?? "");
      localStorage.setItem("bshop_client_name",      `${firstname ?? ""} ${lastname ?? ""}`.trim());
      localStorage.setItem("bshop_client_email",     clientEmail || email);
      if (sessionToken) localStorage.setItem(AUTH_KEYS.sessionToken, sessionToken);
      window.dispatchEvent(new Event("bshop_cart_update"));
      onDone();
    } catch { setError("Something went wrong. Please try again."); }
    finally { setLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !password || !phone) {
      setError("All fields are required."); return;
    }
    setLoading(true); setError(null); setEmailExists(false);
    try {
      // Check if email is already registered
      const checkRes  = await fetch("/api/whmcs", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "checkEmailExists", params: { email } }),
      });
      const checkJson = (await checkRes.json()) as { success: boolean; data?: { exists: boolean } };
      if (checkJson.data?.exists) {
        setEmailExists(true);
        setLoading(false);
        return;
      }

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
      const json = (await res.json()) as { success: boolean; data?: { clientId: number; sessionToken: string }; error?: string };
      if (!json.success || !json.data?.clientId) {
        setError(json.error ?? "Registration failed. Please try again.");
        return;
      }
      localStorage.setItem("bshop_client_id",        String(json.data.clientId));
      localStorage.setItem("bshop_client_firstname", firstName);
      localStorage.setItem("bshop_client_name",      `${firstName} ${lastName}`.trim());
      localStorage.setItem("bshop_client_email",     email);
      if (json.data.sessionToken) localStorage.setItem(AUTH_KEYS.sessionToken, json.data.sessionToken);
      window.dispatchEvent(new Event("bshop_cart_update"));
      setSuccess(true);
      setTimeout(() => onDone(), 1500);
    } catch { setError("Something went wrong. Please try again."); }
    finally { setLoading(false); }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-10"
      >
        <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(34,197,94,0.35)]">
          <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7">
            <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="font-bold text-lg text-green-600">Account created!</p>
        <p className="text-gray-400 text-sm mt-1">Proceeding to payment…</p>
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
            {emailExists && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 space-y-1">
                <p className="text-sm text-amber-800 font-semibold">This email is already registered.</p>
                <p className="text-xs text-amber-700">
                  <button type="button" onClick={() => setTab("login")} className="font-bold underline">
                    Log in instead
                  </button>
                  {" "}or use a different email.
                </p>
              </div>
            )}
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

/* ─── PawaPay country / currency / provider maps ─────────────────────────── */
const currencyByCountry: Record<string, string> = {
  RWA: "RWF", ZMB: "ZMW", UGA: "UGX", KEN: "KES", BEN: "XOF",
  CMR: "XAF", CIV: "XOF", SEN: "XOF", GAB: "XAF", COD: "CDF",
  COG: "XAF", SLE: "SLE", TGO: "XOF", BFA: "XOF", GIN: "GNF",
  MDG: "MGA", MOZ: "MZN", TZA: "TZS", GHA: "GHS", ETH: "ETB",
};

const countryNames: Record<string, string> = {
  RWA: "Rwanda",  ZMB: "Zambia",       UGA: "Uganda",     KEN: "Kenya",
  BEN: "Benin",   CMR: "Cameroon",     CIV: "Côte d'Ivoire", SEN: "Senegal",
  GAB: "Gabon",   COD: "DR Congo",     COG: "Republic of Congo", SLE: "Sierra Leone",
  TGO: "Togo",    BFA: "Burkina Faso", GIN: "Guinea",     MDG: "Madagascar",
  MOZ: "Mozambique", TZA: "Tanzania",  GHA: "Ghana",      ETH: "Ethiopia",
};

const MTN_PROVIDERS = new Set([
  "MTN_MOMO_RWA", "MTN_MOMO_ZMB", "MTN_MOMO_UGA", "MTN_MOMO_BEN",
  "MTN_MOMO_CMR", "MTN_MOMO_CIV", "MTN_MOMO_COG", "MTN_MOMO_GHA",
]);

const AIRTEL_PROVIDERS = new Set([
  "AIRTEL_RWA", "AIRTEL_ZMB", "AIRTEL_UGA", "AIRTEL_GAB", "AIRTEL_COD",
  "AIRTEL_KEN", "AIRTEL_MOZ", "AIRTEL_TZA", "AIRTEL_MDG", "AIRTEL_NGA",
]);

/* ─── Step 3: Payment ────────────────────────────────────────────────────── */
type MmStep = "input" | "sending" | "waiting" | "success" | "failed";

function StepPayment({ cart }: { cart: Cart }) {
  const router = useRouter();
  const [method,         setMethod]         = useState<PayMethod>("paypal");
  const [agreed,         setAgreed]         = useState(false);
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState<string | null>(null);
  const [paypalOrder,    setPaypalOrder]    = useState<{ invoiceId: number; orderIds: number[] } | null>(null);
  const [paypalPaid,     setPaypalPaid]     = useState(false);

  // Mobile money
  const [mmPhone,           setMmPhone]           = useState("");
  const [mmStep,            setMmStep]            = useState<MmStep>("input");
  const [mmDepositId,       setMmDepositId]       = useState("");
  const [mmCountdown,       setMmCountdown]       = useState(120);
  const [mmError,           setMmError]           = useState("");
  const [predictedProvider, setPredictedProvider] = useState<{ provider: string; country: string; phoneNumber: string } | null>(null);
  const [predictLoading,    setPredictLoading]    = useState(false);
  const [predictError,      setPredictError]      = useState("");

  // Coupon
  const [coupon, setCoupon] = useState<CouponState>({
    code: "", applied: false, loading: false,
    type: "percentage", value: 0, discount: 0, message: "", error: "",
  });

  // Totals
  const hasBundle  = !!(cart.domain && cart.hosting);
  const bundleDisc = hasBundle ? (cart.domain?.price ?? 0) : 0;
  const subtotal   = (cart.domain?.price ?? 0) + (cart.hosting?.yearly ?? 0) + (cart.websiteBuilder?.price ?? 0);
  const usdTotal   = Math.max(0, subtotal - bundleDisc - (coupon.applied ? coupon.discount : 0));
  const rwfTotal   = Math.round(usdTotal * 1400);

  // A coupon validated on the cart page is handed off via localStorage —
  // pick it up once and auto-apply so the discount is already reflected here.
  useEffect(() => {
    const pending = localStorage.getItem("bshop_coupon_code");
    if (!pending || subtotal <= 0) return;
    localStorage.removeItem("bshop_coupon_code");
    setCoupon(c => ({ ...c, code: pending, loading: true }));
    (async () => {
      try {
        const res  = await fetch("/api/whmcs", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "validateCoupon", params: { code: pending } }),
        });
        const json = (await res.json()) as { success: boolean; data?: { valid: boolean; type: "percentage" | "fixed"; value: number; message: string } };
        const d = json.data;
        if (!json.success || !d?.valid) {
          setCoupon(c => ({ ...c, loading: false, applied: false, error: d?.message ?? "Invalid coupon" }));
          return;
        }
        const discount = d.type === "percentage" ? Math.min(subtotal, subtotal * (d.value / 100)) : Math.min(subtotal, d.value);
        setCoupon(c => ({ ...c, loading: false, applied: true, type: d.type, value: d.value, discount, message: d.message, error: "" }));
      } catch {
        setCoupon(c => ({ ...c, loading: false, error: "Could not validate coupon" }));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal]);

  const cleanPhone  = mmPhone.replace(/\D/g, "");

  // Provider classification using known provider sets
  const providerMatchesMtn    = predictedProvider ? MTN_PROVIDERS.has(predictedProvider.provider)    : false;
  const providerMatchesAirtel = predictedProvider ? AIRTEL_PROVIDERS.has(predictedProvider.provider) : false;
  const isUnsupportedProvider = predictedProvider !== null && !providerMatchesMtn && !providerMatchesAirtel;
  const providerMatches       = method === "mtn" ? providerMatchesMtn : providerMatchesAirtel;
  const mmMismatch            = predictedProvider !== null && !isUnsupportedProvider && !providerMatches;
  const isMmValid             = predictedProvider !== null && providerMatches;
  const isMobileMethod        = method === "mtn" || method === "airtel";
  const inMmFlow              = isMobileMethod && mmStep !== "input";

  // Local currency from detected country (falls back to RWF for Rwanda)
  const detectedCountry  = predictedProvider?.country ?? "RWA";
  const localCurrency    = currencyByCountry[detectedCountry] ?? "RWF";
  const detectedCountryName = countryNames[detectedCountry] ?? detectedCountry;

  // Pay button label — only show RWF amount for Rwanda, others show operator name
  function payButtonLabel(): string {
    if (!predictedProvider) return `Pay RWF ${rwfTotal.toLocaleString()}`;
    if (localCurrency === "RWF") return `Pay RWF ${rwfTotal.toLocaleString()}`;
    const net = method === "mtn" ? "MTN" : "Airtel";
    return `Pay with ${net} ${detectedCountryName}`;
  }

  // Polling
  useEffect(() => {
    if (mmStep !== "waiting" || !mmDepositId) return;
    let active = true;
    const poll = async () => {
      try {
        const res  = await fetch(`/api/pawapay/status?depositId=${mmDepositId}`);
        const json = (await res.json()) as { success: boolean; status: string; failureReason?: string | null };
        if (!active) return;
        if (json.status === "COMPLETED") {
          setMmStep("success");
          setTimeout(() => {
            clearCart();
            router.push("/checkout/complete?method=pawapay");
          }, 1500);
        } else if (["FAILED", "REJECTED", "TIMED_OUT", "DUPLICATE_IGNORED"].includes(json.status)) {
          setMmStep("failed");
          setMmError(getPawapayFailureMessage(json.failureReason));
        }
      } catch { /* retry on next tick */ }
    };
    const interval = setInterval(poll, 5000);
    poll();
    return () => { active = false; clearInterval(interval); };
  }, [mmStep, mmDepositId, router]);

  // Countdown
  useEffect(() => {
    if (mmStep !== "waiting") return;
    if (mmCountdown <= 0) { setMmStep("failed"); setMmError("Payment timed out. Please try again."); return; }
    const t = setTimeout(() => setMmCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [mmStep, mmCountdown]);

  // Predict provider as user types their phone number (debounced 600 ms)
  useEffect(() => {
    if (!isMobileMethod || cleanPhone.length < 9) {
      setPredictedProvider(null); setPredictError(""); setPredictLoading(false);
      return;
    }
    const intl = cleanPhone.startsWith("250") ? cleanPhone :
                 cleanPhone.startsWith("0")   ? "250" + cleanPhone.slice(1) :
                                                "250" + cleanPhone;
    setPredictLoading(true); setPredictError("");
    const timer = setTimeout(async () => {
      try {
        const res  = await fetch("/api/pawapay/predict-provider", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phoneNumber: intl }),
        });
        const json = (await res.json()) as { success: boolean; provider?: string; country?: string; phoneNumber?: string };
        if (json.success && json.provider) {
          setPredictedProvider({ provider: json.provider, country: json.country ?? "", phoneNumber: json.phoneNumber ?? intl });
          setPredictError("");
        } else {
          setPredictedProvider(null);
          setPredictError("Operator not supported for this number.");
        }
      } catch { setPredictedProvider(null); }
      setPredictLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [isMobileMethod, cleanPhone]);

  function resetMm() {
    setMmStep("input"); setMmDepositId(""); setMmCountdown(120); setMmError("");
  }

  function useDifferentMethod() {
    resetMm();
    setMethod("paypal");
    setMmPhone(""); setPredictedProvider(null); setPredictError("");
  }

  async function applyCoupon() {
    if (!coupon.code.trim()) return;
    setCoupon(c => ({ ...c, loading: true, error: "", message: "" }));
    try {
      const res  = await fetch("/api/whmcs", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "validateCoupon", params: { code: coupon.code } }),
      });
      const json = (await res.json()) as { success: boolean; data?: { valid: boolean; type: "percentage" | "fixed"; value: number; message: string } };
      const d = json.data;
      if (!json.success || !d?.valid) {
        setCoupon(c => ({ ...c, loading: false, applied: false, error: d?.message ?? "Invalid coupon" }));
        return;
      }
      const discount = d.type === "percentage"
        ? Math.min(subtotal, subtotal * (d.value / 100))
        : Math.min(subtotal, d.value);
      setCoupon(c => ({ ...c, loading: false, applied: true, type: d.type, value: d.value, discount, message: d.message, error: "" }));
    } catch {
      setCoupon(c => ({ ...c, loading: false, error: "Could not validate coupon" }));
    }
  }

  async function handleMobileMoneyPay() {
    if (!predictedProvider) return;
    setMmStep("sending"); setMmError("");
    try {
      const cartItems   = getCart();
      const clientId    = typeof window !== "undefined" ? localStorage.getItem("bshop_client_id")    : null;
      const clientEmail = typeof window !== "undefined" ? localStorage.getItem("bshop_client_email") : null;

      console.log("[Checkout][PawaPay] initiating payment, phone:", predictedProvider.phoneNumber, "provider:", predictedProvider.provider, "cartItems:", cartItems.length);
      const res = await fetch("/api/pawapay/initiate", {
        method:  "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body:    JSON.stringify({
          amount:      rwfTotal,
          currency:    localCurrency,
          phone:       predictedProvider.phoneNumber,
          operator:    predictedProvider.provider,
          clientId,
          clientEmail,
          cartItems,
          totalUSD:    usdTotal,
          totalRWF:    rwfTotal,
        }),
      });
      const json = (await res.json()) as { success: boolean; depositId?: string; error?: string };
      console.log("[Checkout][PawaPay] initiate response:", json);
      if (!json.success || !json.depositId) throw new Error(json.error ?? "Failed to initiate payment");
      setMmDepositId(json.depositId);
      setMmStep("waiting");
      setMmCountdown(120);
    } catch (e) {
      setMmStep("failed");
      setMmError(e instanceof Error ? e.message : "Payment initiation failed");
    }
  }

  const handlePaypalCardPay = async () => {
    if (!agreed) { setError("Please agree to the Terms of Service to continue."); return; }
    setLoading(true); setError(null);
    try {
      const cartItems = getCart();
      const clientId  = localStorage.getItem("bshop_client_id");
      if (!clientId) { setError("Please log in to continue."); setLoading(false); return; }

      console.log("[Checkout][PayPal/Card] creating order, clientId:", clientId, "cartItems:", cartItems.length);
      const res  = await fetch("/api/checkout/create-order", {
        method:  "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body:    JSON.stringify({ clientId: Number(clientId), cartItems }),
      });
      const json = await res.json() as { success: boolean; invoiceId?: number; orderId?: number; allOrderIds?: number[]; error?: string };
      console.log("[Checkout][PayPal/Card] create-order response:", json);

      if (!json.success || !json.invoiceId) {
        setError(json.error ?? "Failed to create order. Please try again.");
        setLoading(false);
        return;
      }

      // Store invoiceId so /checkout/complete can read it
      localStorage.setItem("bshop_pending_invoice", String(json.invoiceId));
      setPaypalOrder({ invoiceId: json.invoiceId, orderIds: json.allOrderIds ?? (json.orderId ? [json.orderId] : []) });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const clientName  = typeof window !== "undefined" ? (localStorage.getItem("bshop_client_name") || localStorage.getItem("bshop_client_firstname")) : null;
  const clientEmail = typeof window !== "undefined" ? localStorage.getItem("bshop_client_email") : null;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }}>
      <h2 className="text-2xl font-black text-black mb-6">Payment</h2>

      {clientName && (
        <div className="flex items-center gap-2.5 mb-5 px-4 py-2.5 bg-green-50 border border-green-200 rounded-xl text-sm">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-green-600 flex-shrink-0">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-green-800 font-medium">
            Signed in as <span className="font-bold">{clientName}</span>
            {clientEmail && <span className="text-green-600 font-normal"> ({clientEmail})</span>}
          </span>
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_280px] gap-8">
        <div className="space-y-6">

          {/* ── Method cards ── */}
          {!inMmFlow && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">Select payment method</p>
              <div className="grid grid-cols-3 gap-3">
                <PaymentOptionCard
                  id="paypal" selected={method === "paypal"}
                  onSelect={() => { setMethod("paypal"); setError(null); resetMm(); }}
                  logo={<PayPalWordmark />}
                  title="PayPal"
                  subtitle="Pay securely with your PayPal account or card"
                />
                <PaymentOptionCard
                  id="mtn" selected={method === "mtn"}
                  onSelect={() => { setMethod("mtn"); setError(null); resetMm(); setMmPhone(""); setPredictedProvider(null); setPredictError(""); }}
                  logo={<MtnLogo />}
                  title="MTN Mobile Money"
                  subtitle="Pay with MTN MoMo Rwanda"
                />
                <PaymentOptionCard
                  id="airtel" selected={method === "airtel"}
                  onSelect={() => { setMethod("airtel"); setError(null); resetMm(); setMmPhone(""); setPredictedProvider(null); setPredictError(""); }}
                  logo={<AirtelLogo />}
                  title="Airtel Money"
                  subtitle="Pay with Airtel Money Rwanda"
                />
              </div>
            </div>
          )}

          {/* ── Payment panel ── */}
          <AnimatePresence mode="wait">

            {method === "paypal" && (
              <motion.div key="paypal" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
                className="bg-[#FFC439] rounded-2xl p-6 text-center">
                <p className="font-black text-[#003087] text-2xl mb-1">
                  <span className="text-[#003087]">Pay</span><span className="text-[#009CDE]">Pal</span>
                </p>
              </motion.div>
            )}

            {(method === "mtn" || method === "airtel") && (
              <motion.div key={method} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>

                {mmStep === "input" && (
                  <div className={`rounded-2xl p-5 space-y-4 border-2 ${
                    method === "mtn" ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-100"
                  }`}>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Enter {method === "mtn" ? "MTN" : "Airtel"} number
                      </label>
                      <input
                        type="tel" value={mmPhone}
                        onChange={e => { setMmPhone(e.target.value.replace(/[^\d\s+]/g, "")); setPredictedProvider(null); }}
                        placeholder="07*********"
                        className={INPUT}
                      />
                      {/* Operator detection status */}
                      <div className="mt-2 min-h-[20px]">
                        {predictLoading && (
                          <p className="text-xs text-gray-400 flex items-center gap-1.5">
                            <span className="animate-spin inline-block w-3 h-3 border border-gray-300 border-t-gray-500 rounded-full" />
                            Detecting operator…
                          </p>
                        )}
                        {!predictLoading && isMmValid && (
                          <p className="text-xs text-green-700 font-semibold flex items-center gap-1.5">
                            <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 flex-shrink-0">
                              <path fillRule="evenodd" d="M8 15A7 7 0 108 1a7 7 0 000 14zm3.35-8.65a.75.75 0 00-1.06-1.06L7 8.585 5.71 7.295a.75.75 0 10-1.06 1.06l1.75 1.75a.75.75 0 001.06 0l3.89-3.89z" clipRule="evenodd" />
                            </svg>
                            {predictedProvider!.provider.replace(/_/g, " ")} · {detectedCountryName}
                          </p>
                        )}
                        {!predictLoading && isUnsupportedProvider && (
                          <p className="text-xs text-red-600 font-medium">
                            {predictedProvider!.provider.replace(/_/g, " ")} is not currently supported. Please use MTN or Airtel Mobile Money.
                          </p>
                        )}
                        {!predictLoading && mmMismatch && (
                          <p className="text-xs text-amber-700 font-medium">
                            This looks like {providerMatchesMtn ? "an MTN" : "an Airtel"} number — please select {providerMatchesMtn ? "MTN Mobile Money" : "Airtel Money"} above.
                          </p>
                        )}
                        {!predictLoading && !predictedProvider && predictError && (
                          <p className="text-xs text-red-500">{predictError}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm bg-white/70 rounded-xl px-4 py-2.5">
                      <span className="text-gray-500">Amount</span>
                      <span className="font-bold text-gray-800">
                        ${usdTotal.toFixed(2)} <span className="text-gray-400 font-normal">≈</span> RWF {rwfTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                {mmStep === "sending" && (
                  <div className="flex flex-col items-center py-12 gap-4">
                    <Spinner />
                    <p className="font-semibold text-gray-700">Sending payment request to your phone…</p>
                  </div>
                )}

                {mmStep === "waiting" && (
                  <div className="text-center py-8 space-y-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto text-3xl ${
                      method === "mtn" ? "bg-amber-100" : "bg-red-100"
                    }`}><svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="2.5"/></svg></div>
                    <div>
                      <p className="font-bold text-lg text-gray-800">Check your phone and approve the payment</p>
                      <p className="text-gray-500 text-sm mt-1">
                        RWF {rwfTotal.toLocaleString()} request sent to {mmPhone}
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
                      <Spinner sm />
                      <span>Waiting for approval…</span>
                      <span className="font-mono font-bold text-[#6B21A8]">
                        {Math.floor(mmCountdown / 60)}:{String(mmCountdown % 60).padStart(2, "0")}
                      </span>
                    </div>
                    {mmCountdown <= 90 && (
                      <p className="text-xs text-amber-600 font-medium">
                        No prompt yet? Check your phone for a USSD popup, or try again.
                      </p>
                    )}
                    <button onClick={resetMm}
                      className="text-sm text-gray-400 hover:text-gray-600 underline transition-colors">
                      Cancel
                    </button>
                  </div>
                )}

                {mmStep === "success" && (
                  <div className="text-center py-8 space-y-3">
                    <motion.div
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 220, damping: 18 }}
                      className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_24px_rgba(34,197,94,0.4)]"
                    >
                      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
                        <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </motion.div>
                    <p className="font-bold text-lg text-green-600">Payment confirmed!</p>
                    <p className="text-gray-400 text-sm">Processing your order…</p>
                  </div>
                )}

                {mmStep === "failed" && (
                  <div className="py-4 space-y-4">
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 text-left">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                          <path d="M6 18L18 6M6 6l12 12" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-bold text-red-700 text-sm">Payment failed</p>
                        <p className="text-red-600 text-sm mt-1">
                          {mmError || "Payment failed. Please try again or use a different payment method."}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={resetMm}
                        className="flex-1 px-5 py-2.5 bg-[#6B21A8] text-white font-semibold rounded-xl hover:bg-[#581c87] transition-colors text-sm">
                        Try Again
                      </button>
                      <button onClick={useDifferentMethod}
                        className="flex-1 px-5 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors text-sm">
                        Use Different Payment Method
                      </button>
                    </div>
                  </div>
                )}

              </motion.div>
            )}

          </AnimatePresence>

          {/* ── Coupon ── */}
          {!inMmFlow && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Coupon Code</p>
              <div className="flex gap-2">
                <input
                  type="text" value={coupon.code}
                  onChange={e => setCoupon(c => ({ ...c, code: e.target.value.toUpperCase(), applied: false, error: "", message: "" }))}
                  placeholder="Enter coupon code" disabled={coupon.applied}
                  className={`${INPUT} flex-1 text-sm uppercase tracking-widest`}
                  onKeyDown={e => e.key === "Enter" && applyCoupon()}
                />
                <button
                  onClick={coupon.applied ? () => setCoupon(c => ({ ...c, applied: false, code: "", discount: 0, message: "", error: "" })) : applyCoupon}
                  disabled={coupon.loading || (!coupon.applied && !coupon.code.trim())}
                  className={`px-4 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 whitespace-nowrap ${
                    coupon.applied ? "bg-red-100 text-red-600 hover:bg-red-200" : "bg-[#6B21A8] text-white hover:bg-[#581c87]"
                  }`}
                >
                  {coupon.loading ? <Spinner sm /> : coupon.applied ? "Remove" : "Apply"}
                </button>
              </div>
              {coupon.message && <p className="mt-1.5 text-xs text-green-600 font-semibold flex items-center gap-1">✓ {coupon.message}</p>}
              {coupon.error   && <p className="mt-1.5 text-xs text-red-500 font-medium">{coupon.error}</p>}
            </div>
          )}

          {/* ── Terms ── */}
          {!inMmFlow && (
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                className="sr-only"
                checked={agreed}
                onChange={() => setAgreed(v => !v)}
              />
              <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all cursor-pointer ${
                agreed ? "bg-[#6B21A8] border-[#6B21A8]" : "border-gray-300 group-hover:border-[#6B21A8]"
              }`}>
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
          )}

          {error && !inMmFlow && (
            <p className="text-sm text-red-500 font-medium bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
          )}

          {/* ── CTA buttons ── */}
          {!inMmFlow && method === "paypal" && (
            paypalOrder ? (
              paypalPaid ? (
                <div className="text-center py-6 space-y-2">
                  <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(34,197,94,0.35)]">
                    <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7">
                      <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p className="font-bold text-lg text-green-600">Payment received!</p>
                  <p className="text-gray-400 text-sm">Finishing up…</p>
                </div>
              ) : (
                <PayPalCheckoutButton
                  invoiceId={paypalOrder.invoiceId}
                  amountUSD={usdTotal}
                  orderIds={paypalOrder.orderIds}
                  onSuccess={() => {
                    setPaypalPaid(true);
                    clearCart();
                    setTimeout(() => router.push(`/checkout/complete?method=paypal&invoiceId=${paypalOrder.invoiceId}`), 1200);
                  }}
                  onError={(msg) => setError(msg)}
                />
              )
            ) : (
              <button onClick={handlePaypalCardPay} disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-4 bg-[#6B21A8] text-white font-black rounded-xl text-base transition-all hover:bg-[#581c87] hover:shadow-[0_0_28px_rgba(107,33,168,0.45)] disabled:opacity-70">
                {loading
                  ? <><Spinner /><span>Creating order…</span></>
                  : <><LockIcon /><span>Proceed to Payment →</span></>}
              </button>
            )
          )}

          {!inMmFlow && isMobileMethod && mmStep === "input" && (
            <button
              onClick={handleMobileMoneyPay}
              disabled={!isMmValid || !agreed}
              className={`w-full flex items-center justify-center gap-2 py-4 font-black rounded-xl text-base transition-all disabled:opacity-40 ${
                method === "mtn"
                  ? "bg-[#FFC107] text-black hover:bg-[#f0b400]"
                  : "bg-red-600 text-white hover:bg-red-700"
              }`}
            >
              {predictLoading ? <><Spinner sm /><span>Detecting operator…</span></> : payButtonLabel()}
            </button>
          )}

        </div>

        <CartSummary cart={cart} couponDiscount={coupon.applied ? coupon.discount : 0} />
      </div>
    </motion.div>
  );
}


/* ─── Checkout page ──────────────────────────────────────────────────────── */
export default function CheckoutPage() {
  const router  = useRouter();
  const [step,  setStep]  = useState<Step>(2);
  const [cart,  setCart]  = useState<Cart>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const items = getCart();
    if (items.length === 0) { router.replace("/cart"); return; }
    setCart(itemsToCart(items));
    if (localStorage.getItem("bshop_client_id")) setStep(3);
    setReady(true);
  }, [router]);

  const handleAccountDone = useCallback(() => setStep(3), []);

  if (!ready) return null;

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0  }}
          className="mb-8 text-center"
        >
          <h1 className="text-3xl font-black text-black">Checkout</h1>
        </motion.div>

        <StepIndicator current={step} />

        <motion.div
          className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0  }}
          transition={{ delay: 0.1, duration: 0.5, ease: EASE }}
        >
          <AnimatePresence mode="wait">
            {step === 2 && <div key="step2"><StepAccount onDone={handleAccountDone} /></div>}
            {step === 3 && <div key="step3"><StepPayment cart={cart} /></div>}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
