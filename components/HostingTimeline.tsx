"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";

type Ease = [number, number, number, number];
const EASE: Ease = [0.22, 1, 0.36, 1];

/* ─── Timeline data ──────────────────────────────────────────────────────── */

const TIMELINE_STEPS = [
  {
    time:  "0:00",
    label: "Order placed",
    icon:  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>,
    desc:  "Order confirmation card appears",
    color: "bg-blue-500",
  },
  {
    time:  "0:15",
    label: "Server provisioned",
    icon:  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>,
    desc:  "Server rack allocated in Africa datacenter",
    color: "bg-purple-500",
  },
  {
    time:  "0:30",
    label: "cPanel created",
    icon:  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
    desc:  "Control panel account ready",
    color: "bg-indigo-500",
  },
  {
    time:  "0:45",
    label: "SSL installed",
    icon:  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    desc:  "Certificate active — your site is secure",
    color: "bg-green-500",
  },
  {
    time:  "1:00",
    label: "Nameservers configured",
    icon:  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
    desc:  "DNS records propagating",
    color: "bg-teal-500",
  },
  {
    time:  "1:30",
    label: "Email accounts ready",
    icon:  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>,
    desc:  "Professional email on your domain",
    color: "bg-orange-500",
  },
  {
    time:  "2:00",
    label: "YOUR SITE IS LIVE!",
    icon:  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>,
    desc:  "Your website is now online",
    color: "bg-green-400",
    final: true,
  },
];

/* ─── Flip Card data ─────────────────────────────────────────────────────── */

const FLIP_CARDS = [
  {
    icon:  <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
    title: "cPanel",
    front: "Full control panel access",
    back: [
      "File Manager",
      "Email Manager",
      "Database Tools",
      "One-click Installs",
      "FTP Accounts",
      "Subdomains",
    ],
    color: "from-purple-600 to-indigo-700",
  },
  {
    icon:  <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>,
    title: "Email",
    front: "Professional email hosting",
    back: [
      "Unlimited mailboxes",
      "Spam protection",
      "Webmail access",
      "IMAP / POP3 / SMTP",
      "Auto-responders",
      "Email forwarders",
    ],
    color: "from-blue-600 to-cyan-700",
  },
  {
    icon:  <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    title: "SSL",
    front: "Free SSL certificate included",
    back: [
      "256-bit encryption",
      "Auto-renews yearly",
      "Green padlock in browser",
      "Boosts Google ranking",
      "Protects customer data",
      "Covers all subdomains",
    ],
    color: "from-green-600 to-teal-700",
  },
];

/* ─── Confetti burst ─────────────────────────────────────────────────────── */

const CONFETTI_COLORS = ["#6B21A8", "#a855f7", "#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#ec4899"];

function ConfettiBurst({ active }: { active: boolean }) {
  const pieces = Array.from({ length: 18 }, (_, i) => i);
  return (
    <AnimatePresence>
      {active && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
          {pieces.map(i => (
            <motion.div
              key={i}
              initial={{ opacity: 1, x: "50%", y: "50%", scale: 1 }}
              animate={{
                opacity: 0,
                x: `${50 + (Math.random() - 0.5) * 160}%`,
                y: `${50 + (Math.random() - 0.5) * 160}%`,
                scale: 0,
                rotate: Math.random() * 720,
              }}
              transition={{ duration: 0.9 + Math.random() * 0.4, ease: "easeOut", delay: i * 0.03 }}
              style={{ backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length] }}
              className="absolute w-2.5 h-2.5 rounded-sm"
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}

/* ─── Flip Card ──────────────────────────────────────────────────────────── */

function FlipCard({ card, index }: { card: typeof FLIP_CARDS[number]; index: number }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.15, duration: 0.6, ease: EASE }}
      className="h-52"
      style={{ perspective: 1000 }}
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
    >
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.55, ease: EASE }}
        style={{ transformStyle: "preserve-3d" }}
        className="relative w-full h-full"
      >
        {/* Front */}
        <div
          style={{ backfaceVisibility: "hidden" }}
          className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${card.color} p-6 flex flex-col items-center justify-center text-white shadow-xl`}
        >
          <div className="mb-3 opacity-90">{card.icon}</div>
          <h3 className="text-xl font-black mb-1">{card.title}</h3>
          <p className="text-sm text-white/70">{card.front}</p>
          <p className="text-xs text-white/50 mt-3">Hover to see details →</p>
        </div>
        {/* Back */}
        <div
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${card.color} pt-5 px-6 pb-8 text-white shadow-xl overflow-hidden`}
        >
          <h3 className="text-base font-bold mb-3">{card.title} Features</h3>
          <ul className="space-y-1.5">
            {card.back.map(item => (
              <li key={item} className="flex items-center gap-2 text-sm text-white/90">
                <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Main Timeline ──────────────────────────────────────────────────────── */

function Timeline() {
  const ref       = useRef<HTMLDivElement>(null);
  const inView    = useInView(ref, { once: true, margin: "-100px" });
  const [visible, setVisible] = useState(-1);
  const lastFinal = visible === TIMELINE_STEPS.length - 1;

  useEffect(() => {
    if (!inView) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    TIMELINE_STEPS.forEach((_, i) => {
      timers.push(setTimeout(() => setVisible(i), i * 620 + 200));
    });
    return () => timers.forEach(clearTimeout);
  }, [inView]);

  return (
    <div ref={ref} className="relative max-w-2xl mx-auto">
      {/* Purple line */}
      <div className="absolute left-[28px] top-6 bottom-6 w-0.5 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="w-full bg-gradient-to-b from-[#6B21A8] to-purple-400 rounded-full origin-top"
          animate={{ scaleY: inView ? 1 : 0 }}
          transition={{ duration: TIMELINE_STEPS.length * 0.62 + 0.3, ease: "easeOut", delay: 0.2 }}
        />
      </div>

      <div className="space-y-6">
        {TIMELINE_STEPS.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={visible >= i ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
            transition={{ duration: 0.45, ease: EASE }}
            className="flex items-start gap-5 relative"
          >
            {/* Dot */}
            <motion.div
              animate={visible >= i ? { scale: 1 } : { scale: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.1 }}
              className={`w-14 h-14 rounded-2xl flex-shrink-0 flex flex-col items-center justify-center text-white shadow-lg z-10 ${step.color}`}
            >
              <div className="flex items-center justify-center">{step.icon}</div>
              <span className="text-[9px] font-bold mt-0.5 opacity-80">{step.time}</span>
            </motion.div>

            {/* Card */}
            <div className={`flex-1 rounded-xl p-4 border transition-all duration-300 ${
              step.final && lastFinal
                ? "bg-green-500/20 border-green-500/40"
                : "bg-white/5 border-white/10"
            } relative overflow-hidden`}>
              {step.final && <ConfettiBurst active={lastFinal} />}
              <p className={`font-bold text-sm ${step.final && lastFinal ? "text-green-400 text-base" : "text-white"}`}>
                {step.label}
              </p>
              <p className="text-gray-400 text-xs mt-0.5">{step.desc}</p>
              {step.final && lastFinal && (
                <motion.a
                  href="/hosting"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="inline-block mt-2 px-4 py-1.5 bg-green-500 text-white text-xs font-bold rounded-full hover:bg-green-400 transition-colors"
                >
                  Get Started →
                </motion.a>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ─── Exports ────────────────────────────────────────────────────────────── */

export function HostingTimeline() {
  return (
    <section className="bg-[#0a0a0a] py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, ease: EASE }}
        >
          <span className="inline-block px-4 py-1.5 bg-[#6B21A8]/30 border border-[#6B21A8]/50 text-purple-300 text-xs font-semibold tracking-widest rounded-full uppercase mb-5">
            Instant Provisioning
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight">
            From Purchase to Live<br />
            <span className="text-purple-400">in Under 2 Minutes</span>
          </h2>
          <p className="mt-4 text-gray-400 text-lg max-w-xl mx-auto">
            Our servers spin up automatically the moment your order is confirmed.
          </p>
        </motion.div>

        <Timeline />
      </div>
    </section>
  );
}

export function IncludedCards() {
  return (
    <section className="bg-white py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, ease: EASE }}
        >
          <span className="inline-block px-4 py-1.5 bg-purple-100 text-[#6B21A8] text-xs font-semibold tracking-widest rounded-full uppercase mb-4">
            What&apos;s Included
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-black">
            Hover to See What&apos;s Inside
          </h2>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-6">
          {FLIP_CARDS.map((card, i) => (
            <FlipCard key={card.title} card={card} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
