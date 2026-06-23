"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Ease = [number, number, number, number];
const EASE: Ease = [0.22, 1, 0.36, 1];

/* ─── Data ───────────────────────────────────────────────────────────────── */

const DOMAIN_SEQS = [
  {
    name: "mybusiness",
    results: [
      { ext: ".com",    price: "$12/yr", ok: true  },
      { ext: ".africa", price: "$20/yr", ok: true  },
      { ext: ".net",    price: null,     ok: false },
    ],
  },
  {
    name: "bellasalon",
    results: [
      { ext: ".com",    price: "$12/yr", ok: true  },
      { ext: ".africa", price: "$20/yr", ok: true  },
      { ext: ".org",    price: "$12/yr", ok: true  },
    ],
  },
  {
    name: "techkigali",
    results: [
      { ext: ".com",    price: null,     ok: false },
      { ext: ".africa", price: "$20/yr", ok: true  },
      { ext: ".xyz",    price: "$9/yr",  ok: true  },
    ],
  },
];

const HOSTING_STEPS = [
  "Server allocated in Africa datacenter",
  "cPanel account created",
  "SSL certificate installed",
  "Nameservers configured",
  "Email accounts ready",
  "Your hosting is live!",
];

/* ─── Register Domain Demo ───────────────────────────────────────────────── */

function RegisterTab() {
  const [seqIdx,   setSeqIdx]   = useState(0);
  const [typedLen, setTypedLen] = useState(0);
  const [phase,    setPhase]    = useState<0 | 1 | 2 | 3 | 4>(0);
  const [cart,     setCart]     = useState(0);

  const seq   = DOMAIN_SEQS[seqIdx];
  const typed = seq.name.slice(0, typedLen);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    if (phase === 0) {
      if (typedLen < seq.name.length) {
        t = setTimeout(() => setTypedLen(n => n + 1), 90);
      } else {
        t = setTimeout(() => setPhase(1), 300);
      }
    } else if (phase === 1) {
      t = setTimeout(() => setPhase(2), 700);
    } else if (phase === 2) {
      t = setTimeout(() => setPhase(3), 2500);
    } else if (phase === 3) {
      setCart(c => c + 1);
      t = setTimeout(() => setPhase(4), 600);
    } else {
      t = setTimeout(() => {
        setSeqIdx(i => (i + 1) % DOMAIN_SEQS.length);
        setTypedLen(0);
        setCart(0);
        setPhase(0);
      }, 1400);
    }
    return () => clearTimeout(t);
  }, [phase, typedLen, seq.name]);

  return (
    <div className="rounded-2xl bg-[#111] border border-white/10 overflow-hidden shadow-2xl">
      {/* Browser chrome */}
      <div className="flex items-center gap-1.5 px-4 py-3 bg-[#1a1a1a] border-b border-white/10">
        <span className="w-3 h-3 rounded-full bg-red-500/80" />
        <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
        <span className="w-3 h-3 rounded-full bg-green-500/80" />
        <div className="flex-1 mx-3 px-3 py-1 bg-[#0d0d0d] rounded text-xs text-gray-500 font-mono">
          thebshop.com/domains
        </div>
        <div className="relative">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-gray-400">
            <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          <AnimatePresence>
            {cart > 0 && (
              <motion.span key={cart}
                initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 20 }}
                className="absolute -top-1 -right-1 w-4 h-4 bg-[#6B21A8] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {cart}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Search bar */}
        <div className="flex items-center gap-2 bg-[#1a1a1a] border border-white/20 rounded-xl px-4 py-3 mb-5 min-h-[52px]">
          <span className="text-white font-mono text-sm flex-1 min-w-0 truncate">
            {typed}
            {phase === 0 && <span className="inline-block w-0.5 h-4 bg-purple-400 align-text-bottom animate-pulse ml-px" />}
          </span>
          <span className="text-xs text-gray-500 border border-white/20 rounded px-2 py-0.5 flex-shrink-0">
            .com
          </span>
          <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 transition-colors ${
            phase === 1 ? "bg-gray-700 text-gray-300" : "bg-[#6B21A8] text-white"
          }`}>
            {phase === 1 ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Searching
              </span>
            ) : "Search"}
          </div>
        </div>

        {/* Results */}
        <div className="space-y-2.5 min-h-[120px]">
          <AnimatePresence mode="wait">
            {phase >= 2 && (
              <motion.div key={seqIdx} className="space-y-2.5">
                {seq.results.map((r, i) => (
                  <motion.div key={r.ext}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.45, duration: 0.35, ease: EASE }}
                    className={`flex items-center justify-between rounded-xl px-4 py-3 border ${
                      r.ok
                        ? "bg-green-500/10 border-green-500/30"
                        : "bg-red-500/10  border-red-500/20"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {r.ok
                        ? <svg className="w-4 h-4 text-green-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        : <svg className="w-4 h-4 text-red-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                      }
                      <span className="text-white font-semibold text-sm font-mono truncate">
                        {seq.name}{r.ext}
                      </span>
                      <span className={`text-xs font-medium flex-shrink-0 ${r.ok ? "text-green-400" : "text-red-400"}`}>
                        {r.ok ? "Available!" : "Taken"}
                      </span>
                    </div>
                    {r.ok && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-purple-400 text-xs font-bold">{r.price}</span>
                        <button className="text-xs px-3 py-1.5 bg-[#6B21A8] hover:bg-[#7c3aed] text-white font-semibold rounded-lg transition-colors">
                          Add
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ─── Hosting Demo ───────────────────────────────────────────────────────── */

function HostingTab() {
  const [visible, setVisible] = useState(0);
  const [looping, setLooping] = useState(false);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    if (visible < HOSTING_STEPS.length) {
      t = setTimeout(() => setVisible(v => v + 1), 650);
    } else if (!looping) {
      t = setTimeout(() => setLooping(true), 1000);
    } else {
      t = setTimeout(() => { setVisible(0); setLooping(false); }, 500);
    }
    return () => clearTimeout(t);
  }, [visible, looping]);

  const pct = Math.round((visible / HOSTING_STEPS.length) * 100);

  return (
    <div className="rounded-2xl bg-[#111] border border-white/10 overflow-hidden shadow-2xl">
      {/* Terminal header */}
      <div className="flex items-center gap-1.5 px-4 py-3 bg-[#1a1a1a] border-b border-white/10">
        <span className="w-3 h-3 rounded-full bg-red-500/80" />
        <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
        <span className="w-3 h-3 rounded-full bg-green-500/80" />
        <span className="ml-3 text-xs text-gray-500 font-mono">server-provisioning</span>
        <span className="ml-auto text-xs text-gray-600">{pct}%</span>
      </div>

      <div className="p-5 font-mono text-sm space-y-3 min-h-[240px]">
        {HOSTING_STEPS.slice(0, visible).map((step, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className={`flex items-center gap-3 ${
              i === HOSTING_STEPS.length - 1 && visible === HOSTING_STEPS.length
                ? "text-green-400 font-semibold"
                : "text-gray-300"
            }`}
          >
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 400, damping: 20 }}
              className={`w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                i === HOSTING_STEPS.length - 1
                  ? "bg-green-500 text-white"
                  : "bg-[#6B21A8] text-white"
              }`}
            >
              ✓
            </motion.span>
            {step}
          </motion.div>
        ))}

        {/* Progress bar */}
        <div className="mt-4 bg-white/10 rounded-full h-1.5 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[#6B21A8] to-purple-400 rounded-full"
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Launch Site Demo ───────────────────────────────────────────────────── */

function LaunchTab() {
  const [phase, setPhase] = useState(0);
  // 0=blank, 1=header, 2=hero text, 3=image, 4=footer, 5=live

  useEffect(() => {
    if (phase < 5) {
      const delay = phase === 0 ? 400 : 700;
      const t = setTimeout(() => setPhase(p => p + 1), delay);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => setPhase(0), 2200);
      return () => clearTimeout(t);
    }
  }, [phase]);

  return (
    <div className="rounded-2xl bg-[#111] border border-white/10 overflow-hidden shadow-2xl">
      {/* Browser chrome */}
      <div className="flex items-center gap-1.5 px-4 py-3 bg-[#1a1a1a] border-b border-white/10">
        <span className="w-3 h-3 rounded-full bg-red-500/80" />
        <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
        <span className="w-3 h-3 rounded-full bg-green-500/80" />
        <div className="flex-1 mx-3 px-3 py-1 bg-[#0d0d0d] rounded text-xs font-mono">
          {phase >= 5 ? (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-green-400">
              yourdomain.com — LIVE ✓
            </motion.span>
          ) : (
            <span className="text-gray-500">yourdomain.com</span>
          )}
        </div>
      </div>

      {/* Website preview */}
      <div className="bg-white p-4 relative overflow-hidden" style={{ minHeight: 240 }}>
        {/* Header */}
        <AnimatePresence>
          {phase >= 1 && (
            <motion.div key="hdr"
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="flex items-center justify-between bg-[#6B21A8] rounded-lg px-4 py-2 mb-3"
            >
              <div className="w-14 h-2.5 bg-white/60 rounded-full" />
              <div className="flex gap-1.5">
                {[1, 2, 3].map(i => <div key={i} className="w-6 h-1.5 bg-white/40 rounded-full" />)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hero text */}
        <AnimatePresence>
          {phase >= 2 && (
            <motion.div key="hero"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-3"
            >
              <div className="h-3 bg-gray-800 rounded-full w-3/4 mb-2" />
              <div className="h-2 bg-gray-400 rounded-full w-1/2 mb-1.5" />
              <div className="h-2 bg-gray-400 rounded-full w-2/5 mb-3" />
              <div className="w-20 h-7 bg-[#6B21A8] rounded-full" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Image block */}
        <AnimatePresence>
          {phase >= 3 && (
            <motion.div key="img"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="absolute top-16 right-4 w-28 h-20 bg-gradient-to-br from-purple-200 to-purple-400 rounded-xl shadow-md"
            />
          )}
        </AnimatePresence>

        {/* Footer */}
        <AnimatePresence>
          {phase >= 4 && (
            <motion.div key="ftr"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="absolute bottom-4 left-4 right-4 bg-gray-900 rounded-lg px-4 py-2.5 flex items-center justify-between"
            >
              <div className="w-12 h-2 bg-white/30 rounded-full" />
              <div className="flex gap-1.5">
                {[1, 2, 3].map(i => <div key={i} className="w-4 h-4 bg-white/20 rounded-full" />)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live banner */}
        <AnimatePresence>
          {phase >= 5 && (
            <motion.div key="live"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            >
              <div className="bg-green-500 text-white font-bold text-sm px-8 py-4 rounded-2xl shadow-2xl text-center">
                <svg className="w-7 h-7 mx-auto mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>
                Your site is live!
                <div className="text-xs font-normal opacity-80 mt-1">yourdomain.com</div>
                <div className="mt-2 flex items-center justify-center gap-1.5">
                  <span className="w-2 h-2 bg-white rounded-full animate-ping" />
                  <span className="text-xs font-medium">Active</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ─── Demo Section ───────────────────────────────────────────────────────── */

const TABS = [
  { id: "register", label: "Register Domain" },
  { id: "hosting",  label: "Set Up Hosting"  },
  { id: "launch",   label: "Launch Site"     },
] as const;

type TabId = typeof TABS[number]["id"];

export default function DemoSection() {
  const [active, setActive] = useState<TabId>("register");

  return (
    <section className="bg-[#0a0a0a] py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, ease: EASE }}
        >
          <span className="inline-block px-4 py-1.5 bg-[#6B21A8]/30 border border-[#6B21A8]/50 text-purple-300 text-xs font-semibold tracking-widest rounded-full uppercase mb-5">
            See It in Action
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight">
            Everything You Need to Go Online
          </h2>
          <p className="mt-4 text-gray-400 text-lg max-w-xl mx-auto">
            Watch how easy it is to get your business online with The B.Shop.
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          className="flex flex-wrap justify-center gap-2 mb-10"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15, ease: EASE }}
        >
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`relative px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                active === tab.id
                  ? "bg-[#6B21A8] text-white shadow-[0_0_20px_rgba(107,33,168,0.5)]"
                  : "bg-white/10 text-gray-400 hover:bg-white/15 hover:text-white"
              }`}
            >
              {tab.label}
              {active === tab.id && (
                <motion.span
                  layoutId="tab-pill"
                  className="absolute inset-0 rounded-full bg-[#6B21A8] -z-10"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          ))}
        </motion.div>

        {/* Tab content */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.25, ease: EASE }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="max-w-2xl mx-auto"
            >
              {active === "register" && <RegisterTab />}
              {active === "hosting"  && <HostingTab  />}
              {active === "launch"   && <LaunchTab   />}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
