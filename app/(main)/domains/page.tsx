"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { DomainJourney, ExtensionShowcase } from "@/components/DomainJourney";

// Fallback prices shown while fetching / if API fails
const TLDS_DEFAULT = [
  { ext: ".com",    reg: null as number | null, renewal: null as number | null, transfer: null as number | null },
  { ext: ".net",    reg: null, renewal: null, transfer: null },
  { ext: ".org",    reg: null, renewal: null, transfer: null },
  { ext: ".biz",    reg: null, renewal: null, transfer: null },
  { ext: ".xyz",    reg: null, renewal: null, transfer: null },
  { ext: ".africa", reg: null, renewal: null, transfer: null },
  { ext: ".co.rw",  reg: null, renewal: null, transfer: null },
];

type TLDRow = { ext: string; reg: number | null; renewal: number | null; transfer: number | null };

function useTLDs(): TLDRow[] {
  const [tlds, setTlds] = useState<TLDRow[]>(TLDS_DEFAULT);
  useEffect(() => {
    fetch("/api/whmcs", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "getTLDPricing" }),
    })
      .then(r => r.json())
      .then((json: { success: boolean; data?: Record<string, { register: number | null; renewal: number | null; transfer: number | null }> }) => {
        if (!json.success || !json.data) return;
        setTlds(TLDS_DEFAULT.map(t => {
          const p = json.data![t.ext];
          return p ? { ext: t.ext, reg: p.register, renewal: p.renewal, transfer: p.transfer } : t;
        }));
      })
      .catch(() => {});
  }, []);
  return tlds;
}

const fmt = (v: number | null) => v != null ? `$${v}/yr` : "Check price";

const WHY_CARDS = [
  {
    icon: "🎯",
    title: "Your Brand Identity",
    desc: "Your domain is your digital address. Make it memorable and professional.",
  },
  {
    icon: "📧",
    title: "Professional Email",
    desc: "Get branded emails like you@yourbusiness.com that build trust.",
  },
  {
    icon: "🌐",
    title: "Own Your Space",
    desc: "Unlike social media, your domain is yours forever. No algorithm can take it away.",
  },
];

const TRANSFER_PERKS = [
  "Free transfer for most domains",
  "Keep your existing expiry date",
  "24/7 transfer support",
];

type Ease = [number, number, number, number];
const EASE: Ease = [0.22, 1, 0.36, 1];

/* ─── Icons ──────────────────────────────────────────────────────────────── */
function SearchIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" strokeLinecap="round" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Hero ───────────────────────────────────────────────────────────────── */
function HeroSection() {
  const [query,       setQuery]       = useState("");
  const [selectedTld, setSelectedTld] = useState(".com");
  const [loading,     setLoading]     = useState(false);
  const tlds = useTLDs();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1800));
    setLoading(false);
  };

  return (
    <section className="relative bg-gradient-to-br from-[#3b0764] via-[#6B21A8] to-[#4c1d95] pt-24 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* glow orb */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full opacity-30"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(216,180,254,0.35) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <motion.span
          className="inline-block px-4 py-1.5 bg-white/15 text-white text-xs font-semibold tracking-widest rounded-full uppercase mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Domain Registration
        </motion.span>

        <motion.h1
          className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.08] tracking-tight mb-5"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.75, ease: EASE }}
        >
          Find Your Perfect<br />
          <span className="text-purple-200">Domain Name</span>
        </motion.h1>

        <motion.p
          className="text-lg sm:text-xl text-purple-200 mb-10 max-w-xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.65 }}
        >
          Search for your domain and start building your brand today
        </motion.p>

        {/* search bar */}
        <motion.form
          onSubmit={handleSearch}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.65, ease: EASE }}
          className="flex flex-col sm:flex-row gap-2 bg-white rounded-2xl p-2 shadow-[0_20px_80px_rgba(0,0,0,0.25)]"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for your domain name"
            className="flex-1 px-5 py-3.5 text-base font-medium text-black bg-transparent rounded-xl outline-none placeholder-gray-400 min-w-0"
          />
          <select
            value={selectedTld}
            onChange={(e) => setSelectedTld(e.target.value)}
            className="px-4 py-3.5 text-sm font-bold text-[#6B21A8] bg-purple-50 border-0 rounded-xl outline-none cursor-pointer"
          >
            {tlds.map((t) => (
              <option key={t.ext} value={t.ext}>{t.ext}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 px-7 py-3.5 bg-[#6B21A8] text-white font-bold rounded-xl transition-all duration-200 hover:bg-[#581c87] hover:shadow-[0_0_24px_rgba(107,33,168,0.6)] min-w-[148px] disabled:opacity-75"
          >
            {loading ? <Spinner /> : <SearchIcon />}
            <span>{loading ? "Searching…" : "Search"}</span>
          </button>
        </motion.form>

        {/* TLD pills */}
        <motion.div
          className="mt-6 flex flex-wrap gap-2 justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65, duration: 0.6 }}
        >
          {tlds.map((t, i) => (
            <motion.button
              key={t.ext}
              type="button"
              onClick={() => setSelectedTld(t.ext)}
              whileHover={{ scale: 1.08, y: -2 }}
              whileTap={{ scale: 0.96 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + i * 0.05, duration: 0.4 }}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold border-2 transition-all duration-200 cursor-pointer ${
                selectedTld === t.ext
                  ? "bg-white text-[#6B21A8] border-white shadow-lg"
                  : "bg-transparent text-white border-white/30 hover:border-white/70"
              }`}
            >
              {t.ext}{t.reg != null && <span className="opacity-70">&nbsp;${t.reg}/yr</span>}
            </motion.button>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Why Domain Matters ─────────────────────────────────────────────────── */
function WhySection() {
  return (
    <section className="bg-white py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65 }}
        >
          <span className="inline-block px-4 py-1.5 bg-purple-100 text-[#6B21A8] text-xs font-semibold tracking-widest rounded-full uppercase mb-4">
            Why It Matters
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-black">
            Why Your Domain Name Matters
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {WHY_CARDS.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.13, duration: 0.65, ease: EASE }}
              whileHover={{ y: -6, boxShadow: "0 20px 50px rgba(107,33,168,0.14)" }}
              className="bg-white rounded-2xl p-7 border border-gray-100 shadow-md hover:border-purple-200 cursor-default transition-colors duration-300"
            >
              <div className="text-4xl mb-4">{card.icon}</div>
              <h3 className="text-lg font-bold text-black mb-2">{card.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{card.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Transfer ───────────────────────────────────────────────────────────── */
function TransferSection() {
  return (
    <section className="bg-gray-50 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* Left */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <span className="inline-block px-4 py-1.5 bg-purple-100 text-[#6B21A8] text-xs font-semibold tracking-widest rounded-full uppercase mb-5">
              Domain Transfer
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-black mb-4 leading-tight">
              Already have a domain?<br />
              <span className="text-[#6B21A8]">Transfer it to us.</span>
            </h2>
            <p className="text-gray-500 text-lg leading-relaxed mb-8 max-w-md">
              Transfer your existing domain to The B.Shop and manage everything in one
              place. We&apos;ll handle the entire process.
            </p>
            <a
              href="/contact"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#6B21A8] text-white font-bold rounded-full transition-all duration-300 hover:bg-[#581c87] hover:shadow-[0_0_28px_rgba(107,33,168,0.5)]"
            >
              Transfer My Domain
              <ArrowRight />
            </a>
          </motion.div>

          {/* Right */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15, ease: EASE }}
            className="bg-white rounded-3xl p-9 shadow-lg border border-gray-100"
          >
            <ul className="space-y-6">
              {TRANSFER_PERKS.map((perk, i) => (
                <motion.li
                  key={perk}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.25 + i * 0.1, duration: 0.5 }}
                  className="flex items-center gap-4"
                >
                  <span className="flex-shrink-0 w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-[#6B21A8] font-black text-sm">
                    ✓
                  </span>
                  <span className="text-gray-700 font-medium text-base">{perk}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── Pricing Table ──────────────────────────────────────────────────────── */
function PricingTable() {
  const tlds = useTLDs();
  return (
    <section className="bg-white py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65 }}
        >
          <span className="inline-block px-4 py-1.5 bg-purple-100 text-[#6B21A8] text-xs font-semibold tracking-widest rounded-full uppercase mb-4">
            Pricing
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-black">Domain Pricing</h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: EASE }}
          className="rounded-2xl overflow-hidden shadow-xl border border-gray-100"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#6B21A8] text-white">
                  {["Extension", "Registration", "Renewal", "Transfer"].map((h) => (
                    <th key={h} className="px-6 py-4 text-left font-bold tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tlds.map((t, i) => (
                  <motion.tr
                    key={t.ext}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.07, duration: 0.45 }}
                    className={`border-b border-gray-100 transition-colors duration-150 hover:bg-purple-50 ${
                      i % 2 === 0 ? "bg-white" : "bg-gray-50/70"
                    }`}
                  >
                    <td className="px-6 py-4 font-bold text-[#6B21A8]">{t.ext}</td>
                    <td className="px-6 py-4 text-gray-700 font-medium">{fmt(t.reg)}</td>
                    <td className="px-6 py-4 text-gray-700 font-medium">{fmt(t.renewal)}</td>
                    <td className="px-6 py-4 text-gray-700 font-medium">{fmt(t.transfer)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.p
          className="mt-6 text-center text-sm text-gray-400"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          All prices in USD · Free domain included with any hosting plan for the first year
        </motion.p>
      </div>
    </section>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
function TransferBanner() {
  return (
    <div className="bg-gradient-to-r from-[#6B21A8] to-[#4c1d95] py-4 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
        <p className="text-white font-medium text-sm">
          Already have a domain? Transfer it to The B.Shop and we&apos;ll handle everything automatically.
        </p>
        <Link href="/transfer"
          className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-white text-[#6B21A8] font-bold text-sm rounded-lg hover:shadow-lg transition-shadow whitespace-nowrap">
          Transfer a Domain →
        </Link>
      </div>
    </div>
  );
}

export default function DomainsPage() {
  return (
    <>
      <TransferBanner />
      <HeroSection />
      <WhySection />
      <TransferSection />
      <PricingTable />
      <DomainJourney />
      <ExtensionShowcase />
    </>
  );
}
