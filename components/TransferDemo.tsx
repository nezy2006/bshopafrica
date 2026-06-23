"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Ease = [number, number, number, number];
const EASE: Ease = [0.22, 1, 0.36, 1];

const NS = [
  "ns1.mysecurecloudhost.com",
  "ns2.mysecurecloudhost.com",
  "ns3.mysecurecloudhost.com",
  "ns4.mysecurecloudhost.com",
];

const CONFETTI_COLORS = ["#6B21A8", "#a855f7", "#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#ec4899", "#06b6d4"];

function ConfettiBurst() {
  const pieces = Array.from({ length: 24 }, (_, i) => i);
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {pieces.map(i => (
        <motion.div
          key={i}
          initial={{ opacity: 1, x: "50%", y: "50%", scale: 1, rotate: 0 }}
          animate={{
            opacity:  0,
            x:  `${50 + (Math.sin(i / 24 * Math.PI * 2) * 100 + (Math.random() - 0.5) * 60)}%`,
            y:  `${50 + (Math.cos(i / 24 * Math.PI * 2) * 80  + (Math.random() - 0.5) * 60)}%`,
            scale:    0,
            rotate:   Math.random() * 720 - 360,
          }}
          transition={{ duration: 1.1 + Math.random() * 0.5, ease: "easeOut", delay: i * 0.025 }}
          style={{ backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length] }}
          className="absolute w-3 h-3 rounded-sm"
        />
      ))}
    </div>
  );
}

/* ─── Step 1 — Form fills ────────────────────────────────────────────────── */
function StepSubmit({ active }: { active: boolean }) {
  const [domainLen, setDomainLen] = useState(0);
  const [codeLen,   setCodeLen]   = useState(0);
  const [clicked,   setClicked]   = useState(false);
  const domain = "yourdomain.com";
  const code   = "EPP-AUTH-K3x9";

  useEffect(() => {
    if (!active) { setDomainLen(0); setCodeLen(0); setClicked(false); return; }
    const timers: ReturnType<typeof setTimeout>[] = [];
    let d = 0, c = 0;
    const typeDomain = () => {
      if (d < domain.length) {
        timers.push(setTimeout(() => { d++; setDomainLen(d); typeDomain(); }, 60));
      } else {
        timers.push(setTimeout(typeCode, 300));
      }
    };
    const typeCode = () => {
      if (c < code.length) {
        timers.push(setTimeout(() => { c++; setCodeLen(c); typeCode(); }, 80));
      } else {
        timers.push(setTimeout(() => setClicked(true), 400));
      }
    };
    timers.push(setTimeout(typeDomain, 200));
    return () => timers.forEach(clearTimeout);
  }, [active]);

  return (
    <div className="space-y-3">
      <div className="bg-[#1a1a1a] border border-white/20 rounded-xl p-3">
        <div className="text-xs text-gray-500 mb-1">Domain</div>
        <div className="font-mono text-white text-sm">
          {domain.slice(0, domainLen)}
          {active && domainLen < domain.length && (
            <span className="inline-block w-0.5 h-4 bg-purple-400 animate-pulse align-text-bottom ml-px" />
          )}
        </div>
      </div>
      <div className="bg-[#1a1a1a] border border-white/20 rounded-xl p-3">
        <div className="text-xs text-gray-500 mb-1">Auth Code</div>
        <div className="font-mono text-white text-sm">
          {code.slice(0, codeLen).replace(/./g, "•")}
          {active && codeLen > 0 && codeLen < code.length && (
            <span className="inline-block w-0.5 h-4 bg-purple-400 animate-pulse align-text-bottom ml-px" />
          )}
        </div>
      </div>
      <motion.button
        animate={clicked ? { scale: [1, 0.95, 1.05, 1], backgroundColor: ["#6B21A8", "#22c55e"] } : {}}
        transition={{ duration: 0.5, ease: EASE }}
        className="w-full py-3 bg-[#6B21A8] text-white font-bold rounded-xl text-sm relative overflow-hidden"
      >
        Submit Transfer Request
        {clicked && (
          <motion.span
            initial={{ scale: 0, opacity: 0.6 }}
            animate={{ scale: 4, opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 bg-white/30 rounded-xl"
          />
        )}
      </motion.button>
    </div>
  );
}

/* ─── Step 2 — Contact registrar ─────────────────────────────────────────── */
function StepContact({ active }: { active: boolean }) {
  const [arrowIdx, setArrowIdx] = useState(0);
  useEffect(() => {
    if (!active) { setArrowIdx(0); return; }
    const t = setInterval(() => setArrowIdx(i => (i + 1) % 4), 300);
    return () => clearInterval(t);
  }, [active]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 bg-[#6B21A8] rounded-xl px-3 py-3 text-center">
          <span className="text-white font-bold text-xs">The B.Shop</span>
        </div>
        <div className="flex gap-0.5">
          {[0, 1, 2, 3].map(i => (
            <motion.span
              key={i}
              animate={active ? { opacity: [0, 1, 0], x: [0, 4, 8] } : { opacity: 0.3 }}
              transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
              className="text-purple-400 font-bold text-lg leading-none"
            >→</motion.span>
          ))}
        </div>
        <div className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-3 text-center">
          <span className="text-gray-300 font-bold text-xs">Old Registrar</span>
        </div>
      </div>
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="bg-blue-500/20 border border-blue-500/40 rounded-xl px-4 py-3 text-center"
          >
            <p className="text-blue-300 text-sm font-semibold">✓ Transfer request sent</p>
            <p className="text-blue-400/70 text-xs mt-0.5">Awaiting registrar confirmation</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Step 3 — Lock unlocking ────────────────────────────────────────────── */
function StepUnlock({ active }: { active: boolean }) {
  const [state, setState] = useState<"locked" | "unlocking" | "unlocked">("locked");
  useEffect(() => {
    if (!active) { setState("locked"); return; }
    const t1 = setTimeout(() => setState("unlocking"), 500);
    const t2 = setTimeout(() => setState("unlocked"), 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [active]);

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <motion.div
        animate={
          state === "locked"    ? { rotate: 0,  scale: 1,    color: "#ef4444" } :
          state === "unlocking" ? { rotate: [0, -15, -15, 0], scale: 1.1  } :
                                  { rotate: 0,  scale: 1.15, color: "#22c55e" }
        }
        transition={{ duration: 0.6, ease: EASE }}
        className="text-red-400"
      >
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor" className="w-20 h-20">
          {state !== "unlocked" ? (
            <>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </>
          ) : (
            <>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 9.9-1" />
            </>
          )}
        </svg>
      </motion.div>
      <motion.p
        animate={{ color: state === "unlocked" ? "#22c55e" : "#9ca3af" }}
        className="font-bold text-sm"
      >
        {state === "locked" ? "Domain locked" : state === "unlocking" ? "Unlocking..." : "Domain unlocked!"}
      </motion.p>
    </div>
  );
}

/* ─── Step 4 — DNS update ────────────────────────────────────────────────── */
function StepDNS({ active }: { active: boolean }) {
  const [visible, setVisible] = useState(0);
  useEffect(() => {
    if (!active) { setVisible(0); return; }
    const timers = NS.map((_, i) =>
      setTimeout(() => setVisible(v => Math.max(v, i + 1)), 300 + i * 400)
    );
    return () => timers.forEach(clearTimeout);
  }, [active]);

  return (
    <div className="space-y-2">
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 line-through text-red-400 text-xs font-mono">
        ns1.godaddy.com
      </div>
      <div className="text-center text-purple-400 text-sm">↓ Updating to</div>
      {NS.slice(0, visible).map((ns, i) => (
        <motion.div
          key={ns}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, ease: EASE }}
          className="bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2 text-green-400 text-xs font-mono flex items-center justify-between"
        >
          {ns}
          <span className="text-green-500 font-bold ml-2">✓</span>
        </motion.div>
      ))}
    </div>
  );
}

/* ─── Step 5 — Complete ──────────────────────────────────────────────────── */
function StepComplete({ active }: { active: boolean }) {
  return (
    <div className="relative flex flex-col items-center gap-4 py-4">
      {active && <ConfettiBurst />}
      <motion.div
        animate={active ? { scale: [0, 1.3, 1], opacity: 1 } : { scale: 0, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(34,197,94,0.6)]"
      >
        <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      </motion.div>
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center"
          >
            <p className="text-green-400 font-black text-lg">Transfer Complete!</p>
            <p className="text-gray-400 text-sm mt-1 font-mono">yourdomain.com is now with The B.Shop</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────── */

const STEPS = [
  { id: 0, label: "You Submit",         time: "0–2s",  icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
  { id: 1, label: "Contact Registrar",  time: "2–4s",  icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1" fill="currentColor"/></svg> },
  { id: 2, label: "Domain Unlocks",     time: "4–6s",  icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg> },
  { id: 3, label: "Nameservers Update", time: "6–8s",  icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> },
  { id: 4, label: "Transfer Complete!", time: "8–10s", icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
];

export default function TransferDemo() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setStep(s => (s + 1) % STEPS.length);
    }, 2200);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="bg-[#0a0a0a] py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, ease: EASE }}
        >
          <span className="inline-block px-4 py-1.5 bg-[#6B21A8]/30 border border-[#6B21A8]/50 text-purple-300 text-xs font-semibold tracking-widest rounded-full uppercase mb-5">
            How It Works
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight">
            Fully Automated —<br />
            <span className="text-purple-400">Here&apos;s What Happens</span>
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-10 items-start">
          {/* Step list */}
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            {STEPS.map((s, i) => (
              <motion.div
                key={s.id}
                animate={step === i
                  ? { backgroundColor: "rgba(107,33,168,0.25)", borderColor: "rgba(107,33,168,0.6)", scale: 1.02 }
                  : step > i
                  ? { backgroundColor: "rgba(34,197,94,0.1)", borderColor: "rgba(34,197,94,0.3)", scale: 1 }
                  : { backgroundColor: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.1)", scale: 1 }
                }
                transition={{ duration: 0.3 }}
                className="flex items-center gap-4 px-4 py-3.5 rounded-xl border"
              >
                <motion.span
                  animate={step === i ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                  className="text-2xl flex-shrink-0"
                >
                  {step > i
                    ? <svg className="w-6 h-6 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    : s.icon
                  }
                </motion.span>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm ${step === i ? "text-purple-300" : step > i ? "text-green-400" : "text-gray-500"}`}>
                    {s.label}
                  </p>
                  <p className="text-xs text-gray-600">{s.time}</p>
                </div>
                {step === i && (
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-4 h-4 border-2 border-purple-400/50 border-t-purple-400 rounded-full flex-shrink-0"
                  />
                )}
              </motion.div>
            ))}
          </motion.div>

          {/* Animated preview */}
          <motion.div
            className="rounded-2xl bg-[#111] border border-white/10 overflow-hidden shadow-2xl"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
          >
            {/* Terminal bar */}
            <div className="flex items-center gap-1.5 px-4 py-3 bg-[#1a1a1a] border-b border-white/10">
              <span className="w-3 h-3 rounded-full bg-red-500/80" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <span className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="ml-3 text-xs text-gray-500 font-mono">transfer-automation.log</span>
            </div>

            <div className="p-5 min-h-[260px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35, ease: EASE }}
                >
                  <p className="text-purple-400 text-xs font-mono mb-3">
                    [{STEPS[step].time}] {STEPS[step].label}
                  </p>
                  {step === 0 && <StepSubmit  active={true} />}
                  {step === 1 && <StepContact active={true} />}
                  {step === 2 && <StepUnlock  active={true} />}
                  {step === 3 && <StepDNS     active={true} />}
                  {step === 4 && <StepComplete active={true} />}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
