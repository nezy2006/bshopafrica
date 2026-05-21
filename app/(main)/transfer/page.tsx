"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { addToCart, type CartTransfer } from "@/lib/cart";
import { ArrowRight, Check, Shield, Zap, Mail, Globe, Info, Lock } from "lucide-react";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const NS = ["ns1.mysecurecloudhost.com", "ns2.mysecurecloudhost.com", "ns3.mysecurecloudhost.com", "ns4.mysecurecloudhost.com"] as [string, string, string, string];

interface CheckResult {
  eligible: boolean;
  domain: string;
  tld: string;
  transferPrice: number;
  currency: string;
  message: string;
}

const CHECKS = [
  "I have unlocked my domain at my current registrar",
  "I have disabled domain privacy / WHOIS protection temporarily",
  "I have the EPP / Auth code ready",
  "I understand nameservers will be updated to The B.Shop's servers",
];

const BENEFITS = [
  { icon: Zap,    label: "Automatic Setup" },
  { icon: Globe,  label: "Our Nameservers Applied" },
  { icon: Shield, label: "No Manual Steps" },
  { icon: Mail,   label: "Email Confirmation" },
];

export default function TransferPage() {
  const [domain,    setDomain]    = useState("");
  const [checking,  setChecking]  = useState(false);
  const [result,    setResult]    = useState<CheckResult | null>(null);
  const [checkErr,  setCheckErr]  = useState("");
  const [authCode,  setAuthCode]  = useState("");
  const [showAuth,  setShowAuth]  = useState(false);
  const [confirmed, setConfirmed] = useState<boolean[]>(CHECKS.map(() => false));
  const [adding,    setAdding]    = useState(false);

  const allConfirmed = confirmed.every(Boolean) && authCode.trim().length > 0;

  async function handleCheck() {
    const d = domain.trim();
    if (!d) return;
    setChecking(true); setCheckErr(""); setResult(null);
    try {
      const res  = await fetch("/api/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "checkTransfer", domain: d }),
      });
      const json = (await res.json()) as { success: boolean; eligible?: boolean; domain?: string; tld?: string; transferPrice?: number; currency?: string; message?: string; error?: string };
      if (!json.success) { setCheckErr(json.error ?? "Check failed"); return; }
      setResult({
        eligible:      json.eligible ?? false,
        domain:        json.domain   ?? d,
        tld:           json.tld      ?? "",
        transferPrice: json.transferPrice ?? 14.99,
        currency:      json.currency ?? "USD",
        message:       json.message  ?? "",
      });
    } catch { setCheckErr("Network error. Please try again."); }
    finally { setChecking(false); }
  }

  async function handleAddToCart() {
    if (!result?.eligible || !authCode.trim()) return;
    setAdding(true);
    const item: CartTransfer = {
      id:            `transfer_${result.domain}`,
      type:          "transfer",
      domain:        result.domain,
      tld:           result.tld,
      authCode:      authCode.trim(),
      transferPrice: result.transferPrice,
      nameservers:   NS,
    };
    addToCart(item);
    window.location.href = "/cart";
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#3b0764] via-[#6B21A8] to-[#4c1d95] pt-36 pb-20 px-4 overflow-hidden">
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full opacity-20"
          style={{ background: "radial-gradient(ellipse, rgba(216,180,254,0.5) 0%, transparent 70%)", filter: "blur(80px)" }} />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <motion.span initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}
            className="inline-block px-4 py-1.5 bg-white/15 text-white text-xs font-semibold tracking-widest rounded-full uppercase mb-5">
            Domain Transfer
          </motion.span>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6, ease: EASE }}
            className="text-4xl sm:text-5xl font-black text-white leading-tight mb-5">
            Transfer Your Domain<br />to The B.Shop
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6, ease: EASE }}
            className="text-white/70 text-lg mb-10 max-w-xl mx-auto">
            Transfer in 3 simple steps. Pay the renewal fee, provide your auth code, and we handle everything automatically.
          </motion.p>
          {/* Benefit pills */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5, ease: EASE }}
            className="flex flex-wrap justify-center gap-3">
            {BENEFITS.map(({ icon: Icon, label }) => (
              <span key={label} className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 border border-white/25 rounded-full text-white text-sm font-medium">
                <Icon className="w-4 h-4" />{label}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">

        {/* Step 1 — Domain Check */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}
          className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-8 h-8 rounded-full bg-[#6B21A8] text-white text-sm font-bold flex items-center justify-center flex-shrink-0">1</span>
            <h2 className="text-lg font-bold text-gray-900">Check Your Domain</h2>
          </div>
          <div className="flex gap-3">
            <input value={domain} onChange={e => { setDomain(e.target.value); setResult(null); setCheckErr(""); }}
              onKeyDown={e => e.key === "Enter" && handleCheck()}
              placeholder="yourdomain.com"
              className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 text-sm outline-none focus:border-[#6B21A8] transition-colors" />
            <button onClick={handleCheck} disabled={checking || !domain.trim()}
              className="px-6 py-3 bg-[#6B21A8] text-white font-semibold rounded-xl disabled:opacity-50 hover:bg-[#581c87] transition-colors text-sm whitespace-nowrap flex items-center gap-2">
              {checking ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Checking…</> : <>Check Transfer <ArrowRight className="w-4 h-4" /></>}
            </button>
          </div>
          {checkErr && <p className="mt-3 text-sm text-red-600">{checkErr}</p>}

          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: EASE }}
                className={`mt-4 rounded-xl p-4 border ${result.eligible ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${result.eligible ? "bg-green-500" : "bg-red-500"}`}>
                    {result.eligible ? <Check className="w-3.5 h-3.5 text-white" /> : <span className="text-white text-xs font-bold">×</span>}
                  </div>
                  <div>
                    <p className={`font-semibold text-sm ${result.eligible ? "text-green-800" : "text-red-800"}`}>
                      {result.eligible ? `${result.domain} is eligible for transfer` : "Transfer not available"}
                    </p>
                    <p className={`text-xs mt-0.5 ${result.eligible ? "text-green-700" : "text-red-700"}`}>{result.message}</p>
                    {result.eligible && (
                      <p className="text-green-900 font-bold text-base mt-2">
                        Transfer + 1 Year Renewal: <span className="text-[#6B21A8]">${result.transferPrice.toFixed(2)} USD</span>
                      </p>
                    )}
                  </div>
                </div>
                {result.eligible && !showAuth && (
                  <button onClick={() => setShowAuth(true)}
                    className="mt-4 w-full py-3 bg-[#6B21A8] text-white font-semibold rounded-xl hover:bg-[#581c87] transition-colors text-sm">
                    Continue with Transfer →
                  </button>
                )}
                {!result.eligible && (
                  <div className="mt-3 flex gap-3">
                    <Link href="/domains" className="flex-1 text-center py-2.5 bg-[#6B21A8] text-white text-sm font-semibold rounded-lg hover:bg-[#581c87] transition-colors">
                      Register Instead
                    </Link>
                    <Link href="/contact" className="flex-1 text-center py-2.5 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors">
                      Contact Support
                    </Link>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Step 2 — Auth Code */}
        <AnimatePresence>
          {showAuth && result?.eligible && (
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <span className="w-8 h-8 rounded-full bg-[#6B21A8] text-white text-sm font-bold flex items-center justify-center flex-shrink-0">2</span>
                <h2 className="text-lg font-bold text-gray-900">Provide Your Auth Code</h2>
              </div>

              {/* Domain + price summary */}
              <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 mb-5 border border-gray-200">
                <div>
                  <p className="font-bold text-gray-900">{result.domain}</p>
                  <p className="text-xs text-gray-500">Transfer + 1 year renewal</p>
                </div>
                <p className="font-black text-[#6B21A8] text-lg">${result.transferPrice.toFixed(2)}</p>
              </div>

              {/* Info box */}
              <div className="flex gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5">
                <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800 leading-relaxed">
                  Your <strong>EPP / Auth code</strong> (also called Authorization Code or Transfer Key) can be found in
                  your current registrar&apos;s control panel. You must also <strong>unlock your domain</strong> before transferring.
                </p>
              </div>

              {/* Auth code input */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">EPP / Auth Code</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" value={authCode} onChange={e => setAuthCode(e.target.value)}
                    placeholder="Enter your EPP / Auth code"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 text-sm font-mono outline-none focus:border-[#6B21A8] transition-colors" />
                </div>
              </div>

              {/* Checklist */}
              <div className="space-y-3 mb-6">
                <p className="text-sm font-semibold text-gray-700">Before proceeding, confirm:</p>
                {CHECKS.map((text, i) => (
                  <label key={i} className="flex items-start gap-3 cursor-pointer group">
                    <div onClick={() => setConfirmed(prev => prev.map((v, j) => j === i ? !v : v))}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors cursor-pointer ${confirmed[i] ? "bg-[#6B21A8] border-[#6B21A8]" : "border-gray-300 group-hover:border-[#6B21A8]"}`}>
                      {confirmed[i] && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-sm text-gray-700 leading-snug">{text}</span>
                  </label>
                ))}
              </div>

              {/* After-transfer info */}
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6">
                <p className="text-sm font-semibold text-purple-900 mb-2">After payment is confirmed:</p>
                <ul className="space-y-1.5">
                  {[
                    "Transfer request sent to Enom automatically",
                    `Nameservers updated to ${NS[0]} and ${NS[1]}`,
                    "Transfer takes 5–7 days to complete",
                    "Email updates sent at every step",
                    "Domain appears in your dashboard once complete",
                  ].map(item => (
                    <li key={item} className="flex items-start gap-2 text-sm text-purple-800">
                      <Check className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <button onClick={handleAddToCart} disabled={!allConfirmed || adding}
                className="w-full py-4 bg-[#6B21A8] text-white font-bold rounded-2xl disabled:opacity-40 hover:bg-[#581c87] hover:shadow-[0_0_30px_rgba(107,33,168,0.4)] transition-all text-base">
                {adding ? "Adding to Cart…" : "Add Transfer to Cart →"}
              </button>
              {!authCode.trim() && <p className="text-xs text-gray-400 text-center mt-2">Enter your EPP code to continue</p>}
              {authCode.trim() && !allConfirmed && <p className="text-xs text-gray-400 text-center mt-2">Please check all boxes above to continue</p>}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Need Help */}
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.5, ease: EASE }}
          className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-2">Need help with your transfer?</h3>
          <p className="text-gray-500 text-sm mb-5">
            If you need assistance unlocking your domain or finding your EPP code, our team can guide you through the process.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="https://wa.me/250724684369" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#25D366] text-white font-semibold rounded-xl text-sm hover:bg-[#20c05c] transition-colors">
              <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.558 4.12 1.532 5.847L.057 23.882a.5.5 0 0 0 .606.64l6.284-1.65A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.064-1.41l-.362-.217-3.736.981.998-3.648-.237-.376A9.818 9.818 0 1 1 12 21.818z"/>
              </svg>
              Chat on WhatsApp
            </a>
            <Link href="/contact"
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-[#6B21A8] text-[#6B21A8] font-semibold rounded-xl text-sm hover:bg-purple-50 transition-colors">
              Open Support Ticket
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
