"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Palette, Smartphone, Search, Globe, Headphones, ShoppingCart,
  MousePointer2, Check,
} from "lucide-react";

type Ease = [number, number, number, number];
const EASE: Ease = [0.22, 1, 0.36, 1];

// WHMCS cart base — update PIDs once Weebly products are created in WHMCS
const WHMCS = "https://bshopafrica.com/billing/cart.php?a=add&pid=";
const WEEBLY_PIDS = { free: "30", starter: "31", pro: "32", business: "33" };

/* ─── Features ───────────────────────────────────────────────────────────── */
const FEATURES = [
  { icon: MousePointer2, title: "Drag & Drop Editor",    desc: "Build pages visually — no coding needed. Move any element anywhere." },
  { icon: Palette,       title: "500+ Templates",        desc: "Professional templates for every industry, fully customisable." },
  { icon: Smartphone,    title: "Mobile Ready",          desc: "Every site automatically looks great on phones and tablets." },
  { icon: Search,        title: "SEO Built-in",          desc: "Built-in SEO tools to help your site rank on Google from day one." },
  { icon: ShoppingCart,  title: "eCommerce Ready",       desc: "Sell products, take payments, manage orders — all in one place." },
  { icon: Headphones,    title: "24/7 Support",          desc: "Our team is here around the clock to help you build and grow." },
];

/* ─── Templates ──────────────────────────────────────────────────────────── */
type Template = {
  name: string; category: string;
  navBg: string; heroBg: string; accentBg: string;
  cardBg: string; pageBg: string; textColor: string;
};
const TEMPLATES: Template[] = [
  { name: "Elegant",   category: "Salons & Boutiques",   navBg: "bg-gray-900",     heroBg: "bg-gray-800",       accentBg: "bg-yellow-400", cardBg: "bg-gray-800",              pageBg: "bg-gray-900",   textColor: "text-white"     },
  { name: "Bold",      category: "Restaurants & Food",   navBg: "bg-orange-900",   heroBg: "bg-orange-800",     accentBg: "bg-orange-400", cardBg: "bg-orange-800/60",         pageBg: "bg-orange-950", textColor: "text-orange-50"  },
  { name: "Corporate", category: "Businesses & Offices", navBg: "bg-[#1e3a5f]",   heroBg: "bg-[#1e3a5f]",     accentBg: "bg-[#1e3a5f]", cardBg: "bg-gray-50",               pageBg: "bg-white",      textColor: "text-gray-900"  },
  { name: "Creative",  category: "Portfolios & Agencies",navBg: "bg-[#0d0118]",   heroBg: "bg-[#0d0118]",     accentBg: "bg-[#6B21A8]", cardBg: "bg-[#1a0a2e]",            pageBg: "bg-[#0d0118]",  textColor: "text-white"     },
  { name: "Shop",      category: "E-Commerce",           navBg: "bg-white border-b border-gray-200", heroBg: "bg-green-50", accentBg: "bg-green-600", cardBg: "bg-white border border-gray-100 shadow-sm", pageBg: "bg-gray-50", textColor: "text-gray-900" },
  { name: "Impact",    category: "NGOs & Causes",        navBg: "bg-white border-b border-gray-200", heroBg: "bg-red-600",  accentBg: "bg-red-600",   cardBg: "bg-white border border-gray-100",            pageBg: "bg-white",   textColor: "text-gray-900" },
];

function TemplateMockup({ t }: { t: Template }) {
  const isLight = t.textColor === "text-gray-900";
  const barColor = isLight ? "bg-gray-700/50" : "bg-white/60";
  const subColor = isLight ? "bg-gray-500/40" : "bg-white/40";
  const cardBar  = isLight ? "bg-gray-400/40" : "bg-white/30";
  return (
    <div className={`${t.pageBg} rounded-b-xl overflow-hidden h-36`}>
      <div className={`${t.navBg} px-3 py-2 flex items-center justify-between`}>
        <div className="w-10 h-2 bg-white/40 rounded-full" />
        <div className="flex gap-1.5">{[1,2,3].map(i=><div key={i} className="w-5 h-1 bg-white/30 rounded-full"/>)}</div>
      </div>
      <div className={`${t.heroBg} px-3 py-3`}>
        <div className={`h-2.5 ${barColor} rounded-full w-3/4 mb-1.5`}/>
        <div className={`h-1.5 ${subColor} rounded-full w-1/2 mb-2.5`}/>
        <div className={`w-14 h-5 ${t.accentBg} rounded-full`}/>
      </div>
      <div className="px-3 py-2 grid grid-cols-3 gap-1.5">
        {[1,2,3].map(i=>(
          <div key={i} className={`${t.cardBg} rounded-lg p-1.5`}>
            <div className={`h-1.5 ${cardBar} rounded-full mb-1`}/>
            <div className={`h-1 ${isLight?"bg-gray-300/40":"bg-white/20"} rounded-full w-3/4`}/>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Pricing ─────────────────────────────────────────────────────────────── */
type Cycle = "monthly" | "annually";

interface Plan {
  name:       string;
  badge?:     string;
  best?:      boolean;
  monthly:    number;
  yearly:     number;
  note:       string;
  features:   string[];
  btnLabel:   string;
  btnHref:    string;
  outlined?:  boolean;
}

const PLANS: Plan[] = [
  {
    name:     "Free",
    monthly:  0,
    yearly:   0,
    note:     "Included with every hosting plan",
    features: [
      "Drag & drop editor",
      "500MB storage",
      "Basic templates",
      "Weebly subdomain",
      "SSL certificate",
    ],
    btnLabel:  "Get Hosting",
    btnHref:   "/hosting",
    outlined:  true,
  },
  {
    name:     "Starter",
    badge:    "POPULAR",
    best:     true,
    monthly:  8.99,
    yearly:   89.99,
    note:     "Billed annually",
    features: [
      "Everything in Free",
      "Connect custom domain",
      "Remove Weebly ads",
      "$100 Google Ads credit",
      "Chat & email support",
    ],
    btnLabel: "Get Starter",
    btnHref:  `${WHMCS}${WEEBLY_PIDS.starter}`,
  },
  {
    name:     "Pro",
    monthly:  13.99,
    yearly:   138.99,
    note:     "Billed annually",
    features: [
      "Everything in Starter",
      "HD video & audio",
      "Password protected pages",
      "Site search",
      "Notification bar",
    ],
    btnLabel: "Get Pro",
    btnHref:  `${WHMCS}${WEEBLY_PIDS.pro}`,
  },
  {
    name:     "Business",
    monthly:  29.99,
    yearly:   299.99,
    note:     "Billed annually",
    features: [
      "Everything in Pro",
      "Online store",
      "No transaction fees",
      "Unlimited products",
      "Real-time shipping",
      "Abandoned cart emails",
    ],
    btnLabel: "Get Business",
    btnHref:  `${WHMCS}${WEEBLY_PIDS.business}`,
  },
];

function PricingCard({ plan, cycle, index }: { plan: Plan; cycle: Cycle; index: number }) {
  const price  = cycle === "monthly" ? plan.monthly : (plan.yearly / 12);
  const isHref = plan.btnHref.startsWith("http");

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.55, ease: EASE }}
      className="relative h-full"
    >
      {plan.badge && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
          <span className="bg-white text-[#6B21A8] text-xs font-black tracking-widest px-5 py-1.5 rounded-full shadow-lg border-2 border-[#6B21A8] uppercase whitespace-nowrap">
            ⭐ {plan.badge}
          </span>
        </div>
      )}
      <div className={`h-full rounded-2xl p-6 flex flex-col transition-shadow duration-300 hover:shadow-2xl ${
        plan.best
          ? "bg-[#6B21A8] text-white animate-border-pulse"
          : "bg-white border border-gray-100 shadow-lg"
      }`}>
        <h3 className={`text-xl font-black mb-4 ${plan.best ? "text-white" : "text-gray-900"}`}>
          {plan.name}
        </h3>

        <div className="mb-1">
          <div className="flex items-end gap-1">
            <span className={`text-4xl font-black leading-none ${plan.best ? "text-white" : "text-[#6B21A8]"}`}>
              ${price === 0 ? "0" : price.toFixed(2)}
            </span>
            <span className={`mb-1 text-sm font-medium ${plan.best ? "text-purple-300" : "text-gray-400"}`}>
              /mo
            </span>
          </div>
          <p className={`text-xs mt-1 ${plan.best ? "text-purple-300" : "text-gray-400"}`}>
            {plan.note}
          </p>
        </div>

        <div className={`h-px my-5 ${plan.best ? "bg-purple-500" : "bg-gray-100"}`} />

        <ul className="space-y-2.5 flex-1">
          {plan.features.map(f => (
            <li key={f} className={`flex items-start gap-2.5 text-sm ${plan.best ? "text-purple-100" : "text-gray-600"}`}>
              <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${plan.best ? "text-purple-300" : "text-green-500"}`} />
              {f}
            </li>
          ))}
        </ul>

        <div className="mt-6">
          {isHref ? (
            <a href={plan.btnHref} target="_blank" rel="noopener noreferrer"
              className={`relative overflow-hidden group flex items-center justify-center w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                plan.outlined
                  ? plan.best
                    ? "bg-white/20 text-white border-2 border-white/40 hover:bg-white/30"
                    : "border-2 border-[#6B21A8] text-[#6B21A8] hover:bg-purple-50"
                  : plan.best
                    ? "bg-white text-[#6B21A8] hover:shadow-[0_0_20px_rgba(255,255,255,0.4)]"
                    : "bg-[#6B21A8] text-white hover:shadow-[0_0_20px_rgba(107,33,168,0.5)]"
              }`}>
              {plan.btnLabel}
            </a>
          ) : (
            <Link href={plan.btnHref}
              className={`flex items-center justify-center w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                plan.outlined
                  ? "border-2 border-[#6B21A8] text-[#6B21A8] hover:bg-purple-50"
                  : plan.best
                    ? "bg-white text-[#6B21A8] hover:shadow-[0_0_20px_rgba(255,255,255,0.4)]"
                    : "bg-[#6B21A8] text-white hover:shadow-[0_0_20px_rgba(107,33,168,0.5)]"
              }`}>
              {plan.btnLabel}
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function PricingSection() {
  const [cycle, setCycle] = useState<Cycle>("annually");
  const saving = cycle === "annually" ? "Save up to 25%" : null;

  return (
    <section id="pricing" className="bg-gray-50 py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div className="text-center mb-14"
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.65, ease: EASE }}>
          <span className="inline-block px-4 py-1.5 bg-purple-100 text-[#6B21A8] text-xs font-semibold tracking-widest rounded-full uppercase mb-5">
            Pricing
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-black leading-tight">
            Choose Your Website Builder Plan
          </h2>
          <p className="mt-4 text-gray-500 text-lg">Free with hosting. Upgrade for more power.</p>

          {/* Cycle toggle */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <div className="flex rounded-xl bg-white border border-gray-200 shadow-sm p-1">
              {(["monthly", "annually"] as Cycle[]).map(c => (
                <button key={c} onClick={() => setCycle(c)}
                  className={`px-5 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                    cycle === c ? "bg-[#6B21A8] text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}>
                  {c === "monthly" ? "Monthly" : "Annually"}
                </button>
              ))}
            </div>
            {saving && (
              <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                {saving}
              </motion.span>
            )}
          </div>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {PLANS.map((plan, i) => (
            <PricingCard key={plan.name} plan={plan} cycle={cycle} index={i} />
          ))}
        </div>

        <motion.p className="text-center text-sm text-gray-400 mt-8"
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          transition={{ delay: 0.5 }}>
          All plans include free SSL and mobile responsive design ·{" "}
          <Link href="/hosting" className="text-[#6B21A8] hover:underline">Free with any hosting plan</Link>
        </motion.p>
      </div>
    </section>
  );
}

/* ─── Hero ───────────────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="relative bg-[#0a0a0a] pt-36 pb-24 px-4 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#6B21A8]/20 rounded-full blur-[120px]" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px]" />
      </div>
      <div className="relative max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-500/20 border border-green-500/40 rounded-full text-green-400 text-sm font-semibold mb-8"
        >
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          Free Builder Included with Every Hosting Plan
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.75, ease: EASE }}
          className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight mb-6"
        >
          Build Your Website<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            with Drag &amp; Drop
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.65 }}
          className="text-lg sm:text-xl text-white/60 mb-10 max-w-2xl mx-auto"
        >
          Powered by Weebly. Start free with any hosting plan, upgrade anytime for more features.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link href="/hosting">
            <motion.span
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              className="inline-block px-10 py-4 bg-[#6B21A8] text-white font-black text-lg rounded-full hover:shadow-[0_0_40px_rgba(107,33,168,0.6)] transition-shadow cursor-pointer"
            >
              Start Free with Hosting
            </motion.span>
          </Link>
          <a href="#pricing">
            <motion.span
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              className="inline-block px-10 py-4 border-2 border-white/25 text-white font-bold text-lg rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            >
              See All Plans
            </motion.span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Features ───────────────────────────────────────────────────────────── */
function FeaturesSection() {
  return (
    <section className="bg-white py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <motion.div className="text-center mb-14"
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.65, ease: EASE }}>
          <span className="inline-block px-4 py-1.5 bg-purple-100 text-[#6B21A8] text-xs font-semibold tracking-widest rounded-full uppercase mb-5">
            Features
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-black">Everything Built In</h2>
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title}
              initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.55, ease: EASE }}
              whileHover={{ y: -6, boxShadow: "0 20px 50px rgba(107,33,168,0.12)" }}
              className="bg-white rounded-2xl p-7 border border-gray-100 shadow-md hover:border-purple-200 transition-all duration-300 group cursor-default"
            >
              <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center mb-4 group-hover:bg-[#6B21A8] transition-colors duration-300">
                <f.icon className="w-6 h-6 text-[#6B21A8] group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="font-bold text-gray-900 text-base mb-1.5">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── How It Works ───────────────────────────────────────────────────────── */
function HowItWorksSection() {
  const steps = [
    { num: "01", icon: "🎨", title: "Pick a Template",  desc: "Choose from 500+ professional designs built for your industry." },
    { num: "02", icon: "🖱️",  title: "Drag & Drop",     desc: "Customise every element — text, images, colors — visually with no code." },
    { num: "03", icon: "🚀", title: "Publish & Go Live", desc: "One click to publish. Your site is live instantly with a free SSL." },
  ];
  return (
    <section className="bg-[#0d0118] py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div className="text-center mb-14"
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.65, ease: EASE }}>
          <span className="inline-block px-4 py-1.5 bg-[#6B21A8]/30 border border-[#6B21A8]/50 text-purple-300 text-xs font-semibold tracking-widest rounded-full uppercase mb-5">
            How It Works
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-white">3 Steps to Online</h2>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((s, i) => (
            <motion.div key={s.num}
              initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.6, ease: EASE }}
              className="text-center">
              <motion.div whileHover={{ scale: 1.1, rotate: [0,-5,5,0] }} transition={{ duration: 0.4 }}
                className="w-20 h-20 rounded-3xl bg-[#6B21A8]/20 border border-[#6B21A8]/40 flex items-center justify-center text-4xl mx-auto mb-5">
                {s.icon}
              </motion.div>
              <div className="text-xs text-purple-400 font-bold tracking-widest mb-2">{s.num}</div>
              <h3 className="text-xl font-black text-white mb-2">{s.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Templates Section ──────────────────────────────────────────────────── */
function TemplatesSection() {
  return (
    <section className="bg-white py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div className="text-center mb-14"
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.65, ease: EASE }}>
          <span className="inline-block px-4 py-1.5 bg-purple-100 text-[#6B21A8] text-xs font-semibold tracking-widest rounded-full uppercase mb-5">
            Templates
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-black leading-tight">
            500+ Templates for<br />
            <span className="text-[#6B21A8]">Every Business</span>
          </h2>
          <p className="mt-4 text-gray-500 text-lg">All mobile-ready. All fully customisable.</p>
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {TEMPLATES.map((t, i) => (
            <motion.div key={t.name}
              initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.55, ease: EASE }}
              whileHover={{ y: -6, boxShadow: "0 20px 50px rgba(107,33,168,0.15)" }}
              className="rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-md hover:border-purple-300 transition-all duration-300 group cursor-pointer"
            >
              <TemplateMockup t={t} />
              <div className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="font-black text-gray-900 text-sm">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.category}</p>
                </div>
                <span className="text-xs px-3 py-1.5 bg-[#6B21A8] text-white font-semibold rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  Use Template
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function WebsiteBuilderPage() {
  return (
    <>
      <Hero />
      <FeaturesSection />
      <HowItWorksSection />
      <TemplatesSection />
      <PricingSection />
    </>
  );
}
