"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import Link from "next/link";

type Ease = [number, number, number, number];
const EASE: Ease = [0.22, 1, 0.36, 1];

/* ─── TLD Showcase data ──────────────────────────────────────────────────── */

const TLDS_SHOWCASE = [
  { ext: ".com",    delay: 0,    x: 0,   y: 0   },
  { ext: ".net",    delay: 0.1,  x: -8,  y: 12  },
  { ext: ".org",    delay: 0.2,  x: 5,   y: -8  },
  { ext: ".biz",    delay: 0.3,  x: -4,  y: 6   },
  { ext: ".xyz",    delay: 0.4,  x: 8,   y: -4  },
  { ext: ".africa", delay: 0.5,  x: -6,  y: -10 },
  { ext: ".co.rw",  delay: 0.6,  x: 4,   y: 8   },
];

/* ─── Journey steps ──────────────────────────────────────────────────────── */

/* Step 1 – animated search */
function SearchStep() {
  const ref    = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [typedLen, setTypedLen] = useState(0);
  const [phase,    setPhase]    = useState<0|1|2>(0);
  const query = "mybusiness";

  useEffect(() => {
    if (!inView) return;
    let t: ReturnType<typeof setTimeout>;
    if (phase === 0) {
      if (typedLen < query.length) {
        t = setTimeout(() => setTypedLen(n => n + 1), 100);
      } else {
        t = setTimeout(() => setPhase(1), 400);
      }
    } else if (phase === 1) {
      t = setTimeout(() => setPhase(2), 600);
    }
    return () => clearTimeout(t);
  }, [inView, phase, typedLen]);

  return (
    <div ref={ref} className="bg-white rounded-2xl border-2 border-gray-100 shadow-lg p-5">
      {/* Search bar */}
      <div className="flex items-center gap-2 bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 mb-4">
        <span className="text-gray-700 font-medium text-sm flex-1 font-mono">
          {query.slice(0, typedLen)}
          {phase === 0 && inView && <span className="inline-block w-0.5 h-4 bg-[#6B21A8] animate-pulse align-text-bottom ml-px" />}
        </span>
        <span className="text-xs text-[#6B21A8] font-bold border border-[#6B21A8]/30 bg-purple-50 rounded px-2 py-0.5">.com</span>
      </div>

      {/* Result */}
      <AnimatePresence>
        {phase >= 2 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1,   y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            className="flex items-center gap-3"
          >
            <svg className="w-5 h-5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <div>
              <p className="font-bold text-gray-900 text-sm font-mono">mybusiness.com</p>
              <p className="text-xs text-gray-500">$12/yr</p>
            </div>
            <motion.span
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
              className="ml-auto px-3 py-1.5 bg-green-500 text-white text-xs font-bold rounded-full"
            >
              Available!
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* Step 2 – checkout animation */
function CheckoutStep() {
  const ref    = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const t1 = setTimeout(() => setPhase(1), 300);
    const t2 = setTimeout(() => setPhase(2), 900);
    const t3 = setTimeout(() => setPhase(3), 1500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [inView]);

  return (
    <div ref={ref} className="bg-white rounded-2xl border-2 border-gray-100 shadow-lg p-5">
      {/* Cart items */}
      <AnimatePresence>
        {phase >= 1 && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between bg-purple-50 border border-purple-200 rounded-xl px-3 py-2.5 mb-3"
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#6B21A8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              <span className="font-mono text-sm font-semibold text-gray-800">mybusiness.com</span>
            </div>
            <span className="text-[#6B21A8] font-bold text-sm">$12</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Price counter */}
      <AnimatePresence>
        {phase >= 2 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-between mb-4 px-1"
          >
            <span className="text-gray-500 text-sm">Total</span>
            <motion.span
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="text-2xl font-black text-[#6B21A8]"
            >
              $12/yr
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment icons */}
      <AnimatePresence>
        {phase >= 3 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-2 flex-wrap"
          >
            {["PayPal", "PawaPay", "Visa", "M-Pesa"].map((method, i) => (
              <motion.span
                key={method}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="px-3 py-1.5 bg-gray-100 rounded-lg text-xs font-semibold text-gray-700"
              >
                {method}
              </motion.span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* Step 3 – live domain card */
function LiveStep() {
  const ref    = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const items = [
    "Registered with Enom",
    "Nameservers: ns1.mysecurecloudhost.com",
    "SSL: Active",
    "Email: Ready",
  ];

  return (
    <div ref={ref} className="bg-white rounded-2xl border-2 border-gray-100 shadow-lg p-5">
      <AnimatePresence>
        {inView && (
          <>
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="flex items-center justify-between mb-4"
            >
              <span className="font-mono font-bold text-gray-900">mybusiness.com</span>
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 400 }}
                className="px-2.5 py-1 bg-green-500 text-white text-xs font-bold rounded-full"
              >
                Active
              </motion.span>
            </motion.div>
            {items.map((item, i) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.18, duration: 0.35, ease: EASE }}
                className="flex items-center gap-2 text-sm text-gray-700 mb-2"
              >
                <span className="w-4 h-4 bg-[#6B21A8] rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">✓</span>
                {item}
              </motion.div>
            ))}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Domain Journey section ─────────────────────────────────────────────── */

export function DomainJourney() {
  const steps = [
    { number: "01", title: "Search",   subtitle: "Find your perfect domain",    content: <SearchStep /> },
    { number: "02", title: "Checkout", subtitle: "Secure and instant payment",  content: <CheckoutStep /> },
    { number: "03", title: "Live",     subtitle: "Your domain is ready to use", content: <LiveStep /> },
  ];

  return (
    <section className="bg-white py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, ease: EASE }}
        >
          <span className="inline-block px-4 py-1.5 bg-purple-100 text-[#6B21A8] text-xs font-semibold tracking-widest rounded-full uppercase mb-5">
            Your Domain Journey
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-black">Register in 3 Steps</h2>
        </motion.div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connecting line — sits behind step numbers */}
          <div className="hidden md:block absolute top-5 left-[calc(16%+20px)] right-[calc(16%+20px)] h-0.5 bg-gradient-to-r from-[#6B21A8]/30 via-[#6B21A8]/60 to-[#6B21A8]/30 -z-10" />

          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.18, duration: 0.6, ease: EASE }}
              className="flex flex-col gap-4"
            >
              {/* Step number */}
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-[#6B21A8] text-white font-black text-sm flex items-center justify-center flex-shrink-0 z-10 relative">
                  {step.number}
                </span>
                <div>
                  <h3 className="font-black text-gray-900 text-lg">{step.title}</h3>
                  <p className="text-xs text-gray-400">{step.subtitle}</p>
                </div>
              </div>
              {step.content}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── TLD Extension Showcase ─────────────────────────────────────────────── */

export function ExtensionShowcase() {
  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#3b0764] via-[#6B21A8] to-[#4c1d95]" />
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] rounded-full opacity-20"
        style={{ background: "radial-gradient(ellipse, rgba(255,255,255,0.2) 0%, transparent 70%)", filter: "blur(60px)" }} />

      <div className="relative max-w-4xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, ease: EASE }}
        >
          <span className="inline-block px-4 py-1.5 bg-white/15 text-white text-xs font-semibold tracking-widest rounded-full uppercase mb-5">
            Domain Extensions
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-white">
            Pick Your Extension
          </h2>
          <p className="mt-4 text-purple-200 text-lg max-w-xl mx-auto">
            Click any extension to search for your domain instantly.
          </p>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-4">
          {TLDS_SHOWCASE.map((tld, i) => (
            <motion.div
              key={tld.ext}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: tld.delay, duration: 0.5, ease: EASE }}
            >
              <div
                className="animate-float"
                style={{ animationDelay: `${i * 0.25}s`, animationDuration: `${3 + i * 0.35}s` }}
              >
                <Link
                  href={`/domains?tld=${tld.ext}`}
                  className="group flex items-center justify-center px-6 py-3.5 bg-white/15 hover:bg-white/25 border border-white/25 hover:border-white/50 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] backdrop-blur-sm"
                >
                  <span className="text-white font-black text-xl">{tld.ext}</span>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="text-center mt-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <Link href="/domains"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-[#6B21A8] font-black rounded-full hover:shadow-[0_0_30px_rgba(255,255,255,0.25)] transition-all duration-300">
            Search All Extensions →
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
