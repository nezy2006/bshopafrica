"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { DomainCheckResult } from "@/lib/whmcs";
import { addToCart } from "@/lib/cart";

const TLDS = [".com", ".net", ".org", ".co", ".io", ".africa"];

type Ease = [number, number, number, number];
const EASE: Ease = [0.22, 1, 0.36, 1];

const CONFETTI_COLORS = ["#6B21A8", "#a855f7", "#22c55e", "#3b82f6", "#f59e0b", "#ec4899", "#06b6d4"];

const fadeUp = {
  hidden:  { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.55, ease: EASE },
  }),
};

/* ─── Icons ──────────────────────────────────────────────────────────────── */
function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
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
function CartIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Confetti burst ─────────────────────────────────────────────────────── */
function ConfettiBurst() {
  const pieces = Array.from({ length: 18 }, (_, i) => i);
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
      {pieces.map(i => (
        <motion.div key={i}
          initial={{ opacity: 1, x: "20%", y: "50%", scale: 1 }}
          animate={{
            opacity: 0,
            x: `${20 + (Math.sin(i / 18 * Math.PI * 2) * 120 + (Math.random() - 0.5) * 80)}%`,
            y: `${50 + (Math.cos(i / 18 * Math.PI * 2) * 80  + (Math.random() - 0.5) * 60)}%`,
            scale: 0, rotate: Math.random() * 720 - 360,
          }}
          transition={{ duration: 0.9 + Math.random() * 0.4, ease: "easeOut", delay: i * 0.02 }}
          style={{ backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length], position: "absolute" }}
          className="w-2.5 h-2.5 rounded-sm"
        />
      ))}
    </div>
  );
}

/* ─── Result cards ───────────────────────────────────────────────────────── */
function AvailableCard({ result, tld, onReset }: { result: DomainCheckResult; tld: string; onReset: () => void }) {
  const router = useRouter();
  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
    const name = result.domain.slice(0, result.domain.length - tld.length);
    addToCart({ id: result.domain, type: "domain", name, tld, domain: result.domain, price: result.price ?? 12 });
    setAdded(true);
    setTimeout(() => router.push("/cart"), 600);
  };

  return (
    <motion.div key="available"
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0,  scale: 1    }}
      exit={{    opacity: 0, y: -10, scale: 0.97 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="mt-6 rounded-2xl border-2 border-green-200 bg-green-50 overflow-hidden relative"
    >
      <ConfettiBurst />
      <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <motion.span
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 22, delay: 0.15 }}
            className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-black"
          >
            ✓
          </motion.span>
          <div>
            <span className="text-xs font-black tracking-widest uppercase text-green-600">Available!</span>
            <p className="font-bold text-black text-base">{result.domain}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
            <motion.button
            onClick={handleAddToCart}
            disabled={added}
            animate={!added ? { boxShadow: ["0 0 0 0 rgba(22,163,74,0)", "0 0 0 8px rgba(22,163,74,0.2)", "0 0 0 0 rgba(22,163,74,0)"] } : {}}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-sm transition-all duration-200 whitespace-nowrap cursor-pointer disabled:opacity-70 active:scale-95"
          >
            <CartIcon />{added ? "Added! →" : "Add to Cart"}
          </motion.button>
        </div>
      </div>
      <div className="px-5 pb-3">
        <button onClick={onReset} className="text-xs text-green-600 hover:text-green-800 font-medium transition-colors">
          ← Search again
        </button>
      </div>
    </motion.div>
  );
}

function TakenCard({ result, query, onSearchTld, onReset }: {
  result: DomainCheckResult; query: string; onSearchTld: (tld: string) => void; onReset: () => void;
}) {
  const [shakeKey, setShakeKey] = useState(0);
  const suggestions = TLDS.filter(t => !result.domain.endsWith(t));

  useEffect(() => { setShakeKey(k => k + 1); }, []);

  return (
    <motion.div key="taken"
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0,  scale: 1    }}
      exit={{    opacity: 0, y: -10, scale: 0.97 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="mt-6 rounded-2xl border-2 border-red-200 bg-red-50 px-5 py-4"
    >
      <motion.div
        key={shakeKey}
        animate={{ x: [0, -6, 6, -5, 5, -3, 3, 0] }}
        transition={{ duration: 0.45, ease: "easeInOut" }}
        className="flex items-start gap-3 mb-4"
      >
        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white text-sm font-black mt-0.5">✕</span>
        <div>
          <span className="text-xs font-black tracking-widest uppercase text-red-600">Taken</span>
          <p className="font-bold text-black text-base">{result.domain} is already registered.</p>
          <p className="text-sm text-gray-500 mt-0.5">Try one of these alternatives:</p>
        </div>
      </motion.div>
      <div className="flex flex-wrap gap-2 mb-3 pl-11">
        {suggestions.map((tld, i) => (
          <motion.button key={tld} type="button" onClick={() => onSearchTld(tld)}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08, duration: 0.3, ease: EASE }}
            whileHover={{ scale: 1.06, y: -2 }} whileTap={{ scale: 0.96 }}
            className="px-4 py-1.5 rounded-full border-2 border-red-200 bg-white text-sm font-semibold text-gray-700 hover:border-[#6B21A8] hover:text-[#6B21A8] transition-all duration-200 cursor-pointer"
          >
            {query}{tld}
          </motion.button>
        ))}
      </div>
      <button onClick={onReset} className="pl-11 text-xs text-red-500 hover:text-red-700 font-medium transition-colors">
        ← Search again
      </button>
    </motion.div>
  );
}

function ErrorCard({ message, onReset }: { message: string; onReset: () => void }) {
  return (
    <motion.div key="error"
      initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="mt-6 rounded-2xl border-2 border-orange-200 bg-orange-50 px-5 py-4 flex items-start gap-3"
    >
      <svg className="w-5 h-5 flex-shrink-0 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      <div>
        <p className="font-semibold text-orange-800 text-sm">{message}</p>
        <button onClick={onReset} className="text-xs text-orange-600 hover:text-orange-800 font-medium mt-1 transition-colors">← Try again</button>
      </div>
    </motion.div>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────── */
export default function DomainSearch() {
  const router = useRouter();
  const [mode,       setMode]       = useState<"register" | "transfer">("register");
  const [query,      setQuery]      = useState("");
  const [selected,   setSelected]   = useState(".com");
  const [focused,    setFocused]    = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [result,     setResult]     = useState<DomainCheckResult | null>(null);
  const [error,      setError]      = useState<string | null>(null);

  const reset = useCallback(() => { setResult(null); setError(null); }, []);

  const runSearch = useCallback(async (domain: string, tld: string) => {
    if (!domain.trim()) return;
    setLoading(true); setResult(null); setError(null);
    try {
      const res  = await fetch("/api/whmcs", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "checkDomain", params: { domain: domain.trim(), tld } }),
      });
      const json = (await res.json()) as { success: boolean; data?: DomainCheckResult; error?: string };
      if (!json.success || !json.data) throw new Error(json.error ?? "Domain check failed. Please try again.");
      setResult(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally { setLoading(false); }
  }, []);

  const handleSearch   = (e: React.FormEvent) => { e.preventDefault(); runSearch(query, selected); };
  const handleTldSearch = (tld: string)       => { setSelected(tld); runSearch(query, tld); };
  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/transfer?domain=${encodeURIComponent(query.trim())}`);
  };
  const switchMode = (m: "register" | "transfer") => { setMode(m); reset(); };

  return (
    <section id="domain-search" className="bg-gray-50 py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div className="bg-white rounded-3xl p-10 sm:p-14"
          style={{ boxShadow: "0 20px 80px rgba(0,0,0,0.08)" }}
          initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.7, ease: EASE }}>

          {/* heading */}
          <motion.div className="text-center mb-10"
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ delay: 0.15, duration: 0.6 }}>
            <span className="inline-block px-4 py-1.5 bg-purple-100 text-[#6B21A8] text-xs font-semibold tracking-widest rounded-full uppercase mb-4">
              Domain Search
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-black">Find Your Perfect Domain</h2>
            <p className="mt-3 text-gray-500 text-base">Your online identity starts with the right domain. Search now.</p>
          </motion.div>

          {/* Register / Transfer tabs */}
          <motion.div className="flex justify-center mb-7"
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.4 }}>
            <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
              {(["register", "transfer"] as const).map(m => (
                <button key={m} type="button" onClick={() => switchMode(m)}
                  className={`relative px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${mode === m ? "bg-white text-[#6B21A8] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                  {m === "register" ? "Register" : "Transfer"}
                  {mode === m && (
                    <motion.span layoutId="tab-indicator"
                      className="absolute inset-x-0 -bottom-[5px] h-0.5 bg-[#6B21A8] rounded-full"
                      transition={{ duration: 0.2, ease: EASE }} />
                  )}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Search form */}
          <AnimatePresence mode="wait">
            <motion.form key={mode} onSubmit={mode === "register" ? handleSearch : handleTransfer}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: EASE }}>
              <motion.div className="flex flex-col sm:flex-row gap-3"
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: 0.25, duration: 0.5 }}>
                <div className="flex-1 relative rounded-xl border-2 transition-all duration-300"
                  style={focused ? { borderColor: "#6B21A8", boxShadow: "0 0 0 4px rgba(107,33,168,0.12)" } : { borderColor: "#e5e7eb" }}>
                  <input type="text" value={query}
                    onChange={e => { setQuery(e.target.value); reset(); }}
                    onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                    placeholder={mode === "register" ? "yourname" : "yourdomain.com"}
                    className="w-full px-5 py-4 text-base font-medium text-black bg-transparent rounded-xl outline-none"
                  />
                  {mode === "register" && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm pointer-events-none">
                      {selected}
                    </span>
                  )}
                </div>
                <button type="submit" disabled={loading || !query.trim()}
                  className="flex items-center justify-center gap-2 px-8 py-4 bg-[#6B21A8] text-white font-semibold rounded-xl transition-all duration-200 min-w-[160px] hover:bg-[#581c87] hover:shadow-[0_0_20px_rgba(107,33,168,0.4)] disabled:opacity-60 disabled:cursor-not-allowed active:scale-95">
                  {loading ? <><Spinner /><span>Searching…</span></> :
                   mode === "register" ? <><SearchIcon /><span>Search</span></> :
                   <><SearchIcon /><span>Transfer Domain</span></>}
                </button>
              </motion.div>
            </motion.form>
          </AnimatePresence>

          {/* TLD pills */}
          <AnimatePresence>
            {mode === "transfer" && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                className="mt-5 text-center text-sm text-gray-400">
                Enter a full domain (e.g. <span className="font-mono text-gray-500">yourbrand.com</span>) and we&apos;ll check eligibility and price instantly.
              </motion.p>
            )}
          </AnimatePresence>

          <div className={`mt-8 flex flex-wrap gap-2 justify-center transition-all duration-300 ${mode === "transfer" ? "opacity-0 pointer-events-none h-0 mt-0 overflow-hidden" : ""}`}>
            {TLDS.map((tld, i) => (
              <motion.button key={tld} type="button"
                onClick={() => { setSelected(tld); reset(); }}
                custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                whileHover={{ scale: 1.1, y: -3 }} whileTap={{ scale: 0.96 }}
                className="px-4 py-1.5 rounded-full text-sm font-semibold border-2 transition-all duration-200 cursor-pointer"
                style={selected === tld
                  ? { backgroundColor: "#6B21A8", borderColor: "#6B21A8", color: "#fff" }
                  : { backgroundColor: "#fff", borderColor: "#e5e7eb", color: "#4b5563" }
                }>
                {tld}
              </motion.button>
            ))}
          </div>

          {/* Results */}
          <AnimatePresence mode="wait">
            {result?.available && (
              <AvailableCard key="available" result={result} tld={selected} onReset={reset} />
            )}
            {result && !result.available && (
              <TakenCard key="taken" result={result} query={query} onSearchTld={handleTldSearch} onReset={reset} />
            )}
            {error && <ErrorCard key="error" message={error} onReset={reset} />}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
