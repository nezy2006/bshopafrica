"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

type Ease = [number, number, number, number];
const EASE: Ease = [0.22, 1, 0.36, 1];

const STEPS = [
  {
    number: "01",
    title:  "Sign Up",
    desc:   "Create your B.Shop Africa account and activate your affiliate profile from your dashboard — it takes under a minute.",
    icon: (
      <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M19 8v6M22 11h-6" />
      </svg>
    ),
  },
  {
    number: "02",
    title:  "Share Your Link",
    desc:   "Get a unique referral link from your affiliate dashboard and share it with your audience, clients, or network.",
    icon: (
      <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </svg>
    ),
  },
  {
    number: "03",
    title:  "Earn Commission",
    desc:   "Every time someone signs up through your link and purchases hosting or a domain, you earn commission — automatically tracked in your dashboard.",
    icon: (
      <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
      </svg>
    ),
  },
];

const PERKS = [
  {
    title: "Real-Time Tracking",
    desc:  "Watch clicks, signups, and conversions roll in on your affiliate dashboard as they happen.",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
  },
  {
    title: "No Cap on Earnings",
    desc:  "Refer as many people as you want — there's no limit on how much commission you can earn.",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    title: "Simple Withdrawals",
    desc:  "Request a withdrawal of your commission balance directly from your dashboard whenever you're ready.",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    ),
  },
];

/* ─── Join Now button — the only piece that needs client-side auth state ── */
function JoinButton({ className }: { className: string }) {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(!!localStorage.getItem("bshop_client_id"));
  }, []);

  const href = loggedIn ? "/dashboard?s=affiliate" : "/login?redirect=" + encodeURIComponent("/dashboard?s=affiliate");

  return (
    <Link href={href} className={className}>
      Join Now
    </Link>
  );
}

/* ─── Hero ───────────────────────────────────────────────────────────────── */
function HeroSection() {
  return (
    <section className="relative bg-white pt-36 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: "linear-gradient(#6B21A8 1px,transparent 1px),linear-gradient(90deg,#6B21A8 1px,transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full opacity-30"
        style={{
          background: "radial-gradient(ellipse at center, rgba(107,33,168,0.12) 0%, transparent 70%)",
          filter: "blur(70px)",
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <motion.span
          className="inline-block px-4 py-1.5 bg-purple-100 text-[#6B21A8] text-xs font-semibold tracking-widest rounded-full uppercase mb-6"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        >
          Affiliate Program
        </motion.span>

        <motion.h1
          className="text-4xl sm:text-5xl lg:text-6xl font-black text-black leading-[1.08] tracking-tight mb-5"
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.75, ease: EASE }}
        >
          Earn Money with <span className="text-[#6B21A8]">BShop Africa</span>
        </motion.h1>

        <motion.p
          className="text-lg sm:text-xl text-gray-500 mb-10 max-w-xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.65 }}
        >
          Refer businesses to B.Shop Africa and earn commission on every hosting plan or domain they purchase through your link.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.65 }}
        >
          <JoinButton className="inline-flex items-center gap-2 px-9 py-4 bg-[#6B21A8] text-white font-black rounded-full text-base transition-all duration-300 hover:bg-[#581c87] hover:shadow-[0_0_40px_rgba(107,33,168,0.35)]" />
        </motion.div>
      </div>
    </section>
  );
}

/* ─── How it works ───────────────────────────────────────────────────────── */
function HowItWorksSection() {
  return (
    <section className="bg-gray-50 py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease: EASE }}
        >
          <span className="inline-block px-4 py-1.5 bg-purple-100 text-[#6B21A8] text-xs font-semibold tracking-widest rounded-full uppercase mb-5">
            How It Works
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-black">Three Simple Steps</h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-8 left-[calc(16%+28px)] right-[calc(16%+28px)] h-0.5 bg-gradient-to-r from-[#6B21A8]/30 via-[#6B21A8]/60 to-[#6B21A8]/30 -z-10" />

          {STEPS.map((step, i) => (
            <motion.div
              key={step.number}
              className="flex flex-col items-center text-center gap-4"
              initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15, duration: 0.6, ease: EASE }}
            >
              <div className="w-16 h-16 rounded-2xl bg-[#6B21A8] text-white flex items-center justify-center relative z-10 shadow-lg">
                {step.icon}
              </div>
              <span className="text-xs font-black text-purple-300 tracking-widest">STEP {step.number}</span>
              <h3 className="font-black text-gray-900 text-xl">{step.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed max-w-xs">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Perks / commission ─────────────────────────────────────────────────── */
function PerksSection() {
  return (
    <section className="bg-white py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease: EASE }}
        >
          <span className="inline-block px-4 py-1.5 bg-purple-100 text-[#6B21A8] text-xs font-semibold tracking-widest rounded-full uppercase mb-5">
            Why Join
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-black leading-tight">Competitive Commission,<br className="hidden sm:block" /> Zero Complexity</h2>
          <p className="mt-4 text-gray-500 text-lg max-w-xl mx-auto">
            We pay competitive commission on every referral. Exact rates are shown in your affiliate dashboard once you join.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-6">
          {PERKS.map((perk, i) => (
            <motion.div
              key={perk.title}
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.55, ease: EASE }}
              className="bg-gray-50 rounded-2xl p-6 border border-gray-100 shadow-sm"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-[#6B21A8] flex items-center justify-center mb-4">{perk.icon}</div>
              <h3 className="font-bold text-gray-900 mb-2">{perk.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{perk.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── CTA ────────────────────────────────────────────────────────────────── */
function CTASection() {
  return (
    <section className="bg-[#3b0764] py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full opacity-20"
        style={{
          background: "radial-gradient(ellipse at center, rgba(216,180,254,0.5) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      <motion.div
        className="relative z-10 max-w-2xl mx-auto text-center"
        initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, ease: EASE }}
      >
        <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight mb-4">
          Ready to start earning?
        </h2>
        <p className="text-purple-200 text-lg mb-10">
          Join the B.Shop Africa affiliate program and turn your network into income.
        </p>
        <JoinButton className="inline-flex items-center gap-2 px-9 py-4 bg-white text-[#6B21A8] font-black rounded-full text-base transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,255,255,0.25)]" />
      </motion.div>
    </section>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function AffiliatePage() {
  return (
    <>
      <HeroSection />
      <HowItWorksSection />
      <PerksSection />
      <CTASection />
    </>
  );
}
