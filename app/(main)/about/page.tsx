"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Lightbulb, Search, Handshake, Globe } from "lucide-react";

type Ease = [number, number, number, number];
const EASE: Ease = [0.22, 1, 0.36, 1];

const VALUES = [
  {
    Icon: Lightbulb, color: "bg-yellow-50 text-yellow-600",
    title: "Innovation",
    desc: "We constantly push the boundaries of what African web infrastructure can be, embracing new technologies to serve our clients better.",
  },
  {
    Icon: Search, color: "bg-blue-50 text-blue-600",
    title: "Transparency",
    desc: "No hidden fees. No surprises. What you see is exactly what you pay — forever. Honest pricing is the foundation of trust.",
  },
  {
    Icon: Handshake, color: "bg-green-50 text-green-600",
    title: "Partnership",
    desc: "We don't just sell hosting — we invest in your success. Our team grows when our clients grow. Your win is our win.",
  },
  {
    Icon: Globe, color: "bg-purple-50 text-purple-600",
    title: "African Pride",
    desc: "Built in Africa, for Africa. We understand local markets, local challenges, and the immense potential of the African digital economy.",
  },
];

/* ─── Hero ───────────────────────────────────────────────────────────────── */
function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-[#3b0764] via-[#6B21A8] to-[#4c1d95] pt-24 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full opacity-25"
        style={{
          background: "radial-gradient(ellipse at center, rgba(216,180,254,0.5) 0%, transparent 70%)",
          filter: "blur(70px)",
        }}
      />
      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <motion.span
          className="inline-block px-4 py-1.5 bg-white/15 text-white text-xs font-semibold tracking-widest rounded-full uppercase mb-6"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        >
          About Us
        </motion.span>
        <motion.h1
          className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.08] tracking-tight mb-5"
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.75, ease: EASE }}
        >
          About The B.Shop
        </motion.h1>
        <motion.p
          className="text-lg sm:text-xl text-purple-200"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.65 }}
        >
          Building Africa&apos;s Digital Future
        </motion.p>
      </div>
    </section>
  );
}

/* ─── Our Story ──────────────────────────────────────────────────────────── */
function StorySection() {
  return (
    <section className="bg-white py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.7, ease: EASE }}
          >
            <span className="inline-block px-4 py-1.5 bg-purple-100 text-[#6B21A8] text-xs font-semibold tracking-widest rounded-full uppercase mb-5">
              Our Story
            </span>
            <h2 className="text-4xl font-black text-black mb-5 leading-tight">
              Why We Built<br /><span className="text-[#6B21A8]">The B.Shop</span>
            </h2>
            <div className="space-y-4 text-gray-500 text-base leading-relaxed">
              <p>
                The B.Shop was born out of a simple observation: African businesses were being
                underserved by web hosting providers that didn&apos;t understand local needs,
                charged in foreign currencies, and offered little to no local support.
              </p>
              <p>
                We set out to change that. Since 2020, we&apos;ve been building the web infrastructure
                that African businesses deserve — fast, reliable, transparently priced, and backed by
                a team that genuinely cares about your success.
              </p>
              <p>
                Today, hundreds of businesses across the continent trust The B.Shop to power
                their digital presence. From small startups in Kigali to growing enterprises across
                East Africa, we&apos;re proud to be the foundation for Africa&apos;s digital future.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.15, ease: EASE }}
            className="space-y-5"
          >
            {/* Company details card */}
            <div className="bg-gray-50 rounded-2xl p-7 border border-gray-100">
              <h3 className="font-bold text-black text-base mb-5">Company Details</h3>
              <dl className="space-y-4">
                {[
                  { label: "Founded",    value: "2020" },
                  { label: "Based in",   value: "Kigali, Rwanda" },
                  { label: "Mission",    value: "Building Africa's digital economy" },
                  { label: "Email",      value: <a href="mailto:hello@bshopafrica.com" className="text-[#6B21A8] hover:underline">hello@bshopafrica.com</a> },
                  { label: "Website",    value: "bshopafrica.com" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-start gap-4">
                    <dt className="text-sm font-semibold text-gray-500 w-24 flex-shrink-0">{label}</dt>
                    <dd className="text-sm text-black font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { num: "2020",  label: "Founded"    },
                { num: "500+",  label: "Clients"    },
                { num: "99.9%", label: "Uptime SLA" },
              ].map(s => (
                <div key={s.label} className="bg-[#6B21A8] rounded-2xl p-4 text-center">
                  <p className="text-2xl font-black text-white">{s.num}</p>
                  <p className="text-purple-300 text-xs font-medium mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── Values ─────────────────────────────────────────────────────────────── */
function ValuesSection() {
  return (
    <section className="bg-gray-50 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.65 }}
        >
          <span className="inline-block px-4 py-1.5 bg-purple-100 text-[#6B21A8] text-xs font-semibold tracking-widest rounded-full uppercase mb-4">
            What We Stand For
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-black">Our Values</h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {VALUES.map((v, i) => (
            <motion.div
              key={v.title}
              initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.55, ease: EASE }}
              whileHover={{ y: -6, boxShadow: "0 20px 50px rgba(107,33,168,0.14)" }}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:border-purple-200 transition-colors duration-300 cursor-default"
            >
              <div className={`w-12 h-12 rounded-xl ${v.color} flex items-center justify-center mb-4`}>
                <v.Icon className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-black mb-2">{v.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{v.desc}</p>
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
        initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.7, ease: EASE }}
      >
        <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
          Start Your Digital Journey
        </h2>
        <p className="text-purple-200 text-lg mb-10">
          Join hundreds of African businesses already growing with The B.Shop
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 px-9 py-4 bg-white text-[#6B21A8] font-black rounded-full text-base hover:shadow-[0_0_40px_rgba(255,255,255,0.25)] transition-all duration-300"
        >
          Get Started Today
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </motion.div>
    </section>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function AboutPage() {
  return (
    <>
      <HeroSection />
      <StorySection />
      <ValuesSection />
      <CTASection />
    </>
  );
}
