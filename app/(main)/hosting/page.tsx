"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useInView } from "framer-motion";
import Link from "next/link";
import { HostingTimeline, IncludedCards } from "@/components/HostingTimeline";
import { addToCart } from "@/lib/cart";

type Ease = [number, number, number, number];
const EASE: Ease = [0.22, 1, 0.36, 1];

/* ─── Data ───────────────────────────────────────────────────────────────── */

interface Plan {
  id: string;
  name: string;
  badge?: string;
  monthly: number;
  yearly: number;
  best?: boolean;
  features: { label: string; value: string }[];
}

const PLANS: Plan[] = [
  {
    id: "hosting_starter",
    name: "Business Starter Kit",
    monthly: 8,
    yearly: 96,
    features: [
      { label: "Disk",           value: "10 GB"    },
      { label: "Bandwidth",      value: "1 TB"     },
      { label: "FTP Accounts",   value: "1"        },
      { label: "Email Accounts", value: "10"       },
      { label: "Quota / Email",  value: "5 GB"     },
      { label: "Email Lists",    value: "1"        },
      { label: "Databases",      value: "10"       },
      { label: "Subdomains",     value: "5"        },
      { label: "Free SSL",       value: "✓"        },
      { label: "Parked Domains", value: "5"        },
      { label: "Addon Domains",  value: "5"        },
      { label: "Free Domain",    value: "1st year" },
    ],
  },
  {
    id: "hosting_grower",
    name: "Business Grower Kit",
    badge: "BEST VALUE",
    monthly: 12,
    yearly: 144,
    best: true,
    features: [
      { label: "Disk",           value: "25 GB"    },
      { label: "Bandwidth",      value: "1 TB"     },
      { label: "FTP Accounts",   value: "1"        },
      { label: "Email Accounts", value: "15"       },
      { label: "Quota / Email",  value: "12 GB"    },
      { label: "Email Lists",    value: "1"        },
      { label: "Databases",      value: "15"       },
      { label: "Subdomains",     value: "10"       },
      { label: "Free SSL",       value: "✓"        },
      { label: "Parked Domains", value: "10"       },
      { label: "Addon Domains",  value: "10"       },
      { label: "Free Domain",    value: "1st year" },
    ],
  },
  {
    id: "hosting_plus",
    name: "Business Plus Kit",
    monthly: 16,
    yearly: 192,
    features: [
      { label: "Disk",           value: "40 GB"    },
      { label: "Bandwidth",      value: "1 TB"     },
      { label: "FTP Accounts",   value: "10"       },
      { label: "Email Accounts", value: "30"       },
      { label: "Quota / Email",  value: "25 GB"    },
      { label: "Email Lists",    value: "10"       },
      { label: "Databases",      value: "30"       },
      { label: "Subdomains",     value: "20"       },
      { label: "Free SSL",       value: "✓"        },
      { label: "Parked Domains", value: "20"       },
      { label: "Addon Domains",  value: "20"       },
      { label: "Free Domain",    value: "1st year" },
    ],
  },
];

const TABLE_ROWS = [
  { feature: "Disk Space",           starter: "10 GB", grower: "25 GB", plus: "40 GB" },
  { feature: "Bandwidth",            starter: "1 TB",  grower: "1 TB",  plus: "1 TB"  },
  { feature: "FTP Accounts",         starter: "1",     grower: "1",     plus: "10"    },
  { feature: "Email Accounts",       starter: "10",    grower: "15",    plus: "30"    },
  { feature: "Quota / Email",        starter: "5 GB",  grower: "12 GB", plus: "25 GB" },
  { feature: "Email Lists",          starter: "1",     grower: "1",     plus: "10"    },
  { feature: "Databases",            starter: "10",    grower: "15",    plus: "30"    },
  { feature: "Subdomains",           starter: "5",     grower: "10",    plus: "20"    },
  { feature: "Free SSL",             starter: "✓",     grower: "✓",     plus: "✓"     },
  { feature: "Parked Domains",       starter: "5",     grower: "10",    plus: "20"    },
  { feature: "Addon Domains",        starter: "5",     grower: "10",    plus: "20"    },
  { feature: "Free Domain 1st year", starter: "✓",     grower: "✓",     plus: "✓"     },
  { feature: "cPanel Access",        starter: "✓",     grower: "✓",     plus: "✓"     },
  { feature: "24/7 Support",         starter: "✓",     grower: "✓",     plus: "✓"     },
];

const WHY_CARDS = [
  {
    icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
    title: "LiteSpeed Servers",
    desc: "Blazing fast servers optimised for African internet conditions.",
  },
  {
    icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    title: "Free SSL Certificate",
    desc: "Every plan includes a free SSL to keep your site secure.",
  },
  {
    icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
    title: "99.9% Uptime SLA",
    desc: "We guarantee your site stays online, always.",
  },
  {
    icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    title: "24/7 Expert Support",
    desc: "Our team is available around the clock to help you.",
  },
];

const FAQ_ITEMS = [
  {
    q: "What is cPanel and how do I use it?",
    a: "cPanel is a web-based control panel that lets you manage your hosting account — install apps, create email accounts, manage files, and more. Every B.Shop plan includes full cPanel access, and our support team is happy to walk you through it.",
  },
  {
    q: "Can I upgrade my plan later?",
    a: "Absolutely. You can upgrade from Starter to Grower or Plus at any time from your account dashboard. The upgrade is prorated, so you only pay the difference for the remaining billing period.",
  },
  {
    q: "Do you offer email hosting with my plan?",
    a: "Yes. Every plan includes professional email accounts on your domain (e.g. you@yourbusiness.com). Starter includes 10 accounts, Grower 15, and Plus 30 — each with generous per-mailbox quotas.",
  },
  {
    q: "What happens if I exceed my disk quota?",
    a: "We'll notify you well before you hit the limit so you can upgrade. Your site won't go offline immediately, but upgrading promptly avoids any disruption.",
  },
  {
    q: "Is there a money-back guarantee?",
    a: "Yes — all hosting plans come with a 30-day money-back guarantee. Contact our support team within 30 days of signing up and we'll refund you in full, no questions asked.",
  },
];

/* ─── Hero ───────────────────────────────────────────────────────────────── */
function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-[#3b0764] via-[#6B21A8] to-[#4c1d95] pt-36 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[460px] rounded-full opacity-25"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(216,180,254,0.4) 0%, transparent 70%)",
          filter: "blur(70px)",
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <motion.span
          className="inline-block px-4 py-1.5 bg-white/15 text-white text-xs font-semibold tracking-widest rounded-full uppercase mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Web Hosting
        </motion.span>

        <motion.h1
          className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.08] tracking-tight mb-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.75, ease: EASE }}
        >
          Web Hosting Built for<br />
          <span className="text-purple-200">African Businesses</span>
        </motion.h1>

        <motion.p
          className="text-lg sm:text-xl text-purple-200 mb-10 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.65 }}
        >
          Fast, reliable, and transparently priced hosting plans. No hidden fees, no surprises.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <a
            href="#plans"
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-full font-bold text-sm text-white border-2 border-white hover:bg-white hover:text-[#6B21A8] transition-all duration-300"
          >
            See Plans
          </a>
          <a
            href="#compare"
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-full font-bold text-sm text-white border-2 border-white/40 hover:border-white hover:bg-white/10 transition-all duration-300"
          >
            Compare Plans
          </a>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Count-up hook ──────────────────────────────────────────────────────── */
function useCountUp(target: number, duration = 1200) {
  const ref    = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const start = Date.now();
    const tick = () => {
      const progress = Math.min((Date.now() - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, target, duration]);
  return { ref, count };
}

/* ─── 3-D Tilt Plan Card ─────────────────────────────────────────────────── */
function PlanCard({ plan, index }: { plan: Plan; index: number }) {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const [mob, setMob] = useState(false);
  const { ref: priceRef, count: priceCount } = useCountUp(plan.monthly);

  useEffect(() => {
    const chk = () => setMob(window.innerWidth < 768);
    chk();
    window.addEventListener("resize", chk, { passive: true });
    return () => window.removeEventListener("resize", chk);
  }, []);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mob || !cardRef.current) return;
    const r = cardRef.current.getBoundingClientRect();
    const rx = ((e.clientY - r.top)  / r.height - 0.5) * 14;
    const ry = ((e.clientX - r.left) / r.width  - 0.5) * -14;
    cardRef.current.style.transform =
      `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(8px)`;
  };
  const onLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transform =
      "perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0px)";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 70 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.13, duration: 0.65, ease: EASE }}
      className="h-full"
    >
      <div
        ref={cardRef}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        style={{ transition: "transform 0.12s ease-out" }}
        className={`relative h-full rounded-2xl p-5 flex flex-col transition-shadow duration-300 hover:shadow-2xl ${
          plan.best
            ? "bg-[#6B21A8] text-white animate-border-pulse"
            : "bg-white text-black border border-gray-100 shadow-lg"
        }`}
      >
        {plan.badge && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white text-[#6B21A8] text-xs font-black tracking-widest px-5 py-1.5 rounded-full shadow-lg border-2 border-[#6B21A8] uppercase whitespace-nowrap">
            <svg className="w-3.5 h-3.5 inline mr-1" viewBox="0 0 24 24" fill="currentColor"><path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg>{plan.badge}
          </div>
        )}

        <h3 className={`text-xl font-bold mt-2 ${plan.best ? "text-white" : "text-black"}`}>
          {plan.name}
        </h3>

        <div className="mt-4 mb-6">
          <div className="flex items-end gap-1">
            <span ref={priceRef} className={`text-5xl font-black leading-none ${plan.best ? "text-white" : "text-[#6B21A8]"}`}>
              ${priceCount}
            </span>
            <span className={`mb-1 text-sm font-medium ${plan.best ? "text-purple-300" : "text-gray-400"}`}>
              /month
            </span>
          </div>
          <p className={`text-sm mt-1 ${plan.best ? "text-purple-200" : "text-gray-400"}`}>
            ${plan.yearly}/year billed annually
          </p>
        </div>

        <div className={`h-px mb-6 ${plan.best ? "bg-purple-500" : "bg-gray-100"}`} />

        <ul className="space-y-2.5 flex-1">
          {plan.features.map((f) => (
            <li key={f.label} className="flex items-center justify-between text-sm">
              <span className={plan.best ? "text-purple-200" : "text-gray-500"}>{f.label}</span>
              <span className={`font-semibold ${plan.best ? "text-white" : "text-black"}`}>{f.value}</span>
            </li>
          ))}
        </ul>

        <div className="mt-8">
          <button
            onClick={() => {
              addToCart({ id: plan.id, type: "hosting", name: plan.name, monthly: plan.monthly, yearly: plan.yearly, cycle: "yearly" });
              router.push("/cart");
            }}
            className={`relative overflow-hidden group flex items-center justify-center w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-300 ${
              plan.best
                ? "bg-white text-[#6B21A8] hover:shadow-[0_0_20px_rgba(255,255,255,0.4)]"
                : "bg-[#6B21A8] text-white hover:shadow-[0_0_20px_rgba(107,33,168,0.5)]"
            }`}
          >
            <span className="relative z-10">Get Started</span>
            <span
              className={`absolute inset-0 transition-transform duration-[400ms] ease-out translate-x-[-101%] group-hover:translate-x-0 ${
                plan.best ? "bg-purple-100" : "bg-[#581c87]"
              }`}
            />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Plans Section ──────────────────────────────────────────────────────── */
function PlansSection() {
  return (
    <section id="plans" className="bg-white py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65 }}
        >
          <span className="inline-block px-4 py-1.5 bg-purple-100 text-[#6B21A8] text-xs font-semibold tracking-widest rounded-full uppercase mb-4">
            Hosting Plans
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-black">
            Choose Your Hosting Plan
          </h2>
          <p className="mt-4 text-gray-500 text-lg">
            Free Domain for the First Year
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {PLANS.map((plan, i) => (
            <PlanCard key={plan.name} plan={plan} index={i} />
          ))}
        </div>

        <motion.p
          className="mt-10 text-center text-sm text-gray-400"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          All plans include a free domain for the first year · Free SSL · 24/7 support
        </motion.p>
      </div>
    </section>
  );
}

/* ─── Comparison Table ───────────────────────────────────────────────────── */
function ComparisonTable() {
  return (
    <section id="compare" className="bg-gray-50 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65 }}
        >
          <span className="inline-block px-4 py-1.5 bg-purple-100 text-[#6B21A8] text-xs font-semibold tracking-widest rounded-full uppercase mb-4">
            Feature Comparison
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-black">Compare All Features</h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: EASE }}
          className="rounded-2xl overflow-hidden shadow-xl border border-gray-200"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[540px]">
              <thead>
                <tr>
                  <th className="bg-gray-900 text-white px-6 py-4 text-left font-bold tracking-wide">
                    Feature
                  </th>
                  <th className="bg-[#6B21A8] text-white/80 px-6 py-4 text-center font-bold tracking-wide">
                    Starter
                  </th>
                  <th className="bg-[#4c1d95] text-white px-6 py-4 text-center font-bold tracking-wide whitespace-nowrap">
                    <svg className="w-3.5 h-3.5 inline mr-1" viewBox="0 0 24 24" fill="currentColor"><path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg>Grower
                  </th>
                  <th className="bg-[#6B21A8] text-white/80 px-6 py-4 text-center font-bold tracking-wide">
                    Plus
                  </th>
                </tr>
              </thead>
              <tbody>
                {TABLE_ROWS.map((row, i) => (
                  <motion.tr
                    key={row.feature}
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.04, duration: 0.4 }}
                    className={`border-b border-gray-100 hover:bg-purple-50/40 transition-colors duration-150 ${
                      i % 2 === 0 ? "bg-white" : "bg-gray-50/60"
                    }`}
                  >
                    <td className="px-6 py-3.5 font-medium text-gray-700 whitespace-nowrap">
                      {row.feature}
                    </td>
                    <td className="px-6 py-3.5 text-center text-gray-600 font-medium">
                      {row.starter}
                    </td>
                    <td className="px-6 py-3.5 text-center font-bold text-[#6B21A8] bg-purple-50 border-x border-purple-100">
                      {row.grower}
                    </td>
                    <td className="px-6 py-3.5 text-center text-gray-600 font-medium">
                      {row.plus}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Why Choose Us ──────────────────────────────────────────────────────── */
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
            Why Us
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-black">
            Why Host With The B.Shop?
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {WHY_CARDS.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.65, ease: EASE }}
              whileHover={{ y: -6, boxShadow: "0 20px 50px rgba(107,33,168,0.14)" }}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-md hover:border-purple-200 cursor-default transition-colors duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-[#6B21A8] flex items-center justify-center mb-4">{card.icon}</div>
              <h3 className="text-base font-bold text-black mb-2">{card.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{card.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── FAQ Accordion Item ─────────────────────────────────────────────────── */
function AccordionItem({
  item,
  index,
}: {
  item: { q: string; a: string };
  index: number;
}) {
  const [open, setOpen] = useState(index === 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.07, duration: 0.5, ease: "easeOut" }}
      className={`rounded-xl overflow-hidden border transition-all duration-300 ${
        open ? "border-white/30 bg-white" : "border-white/10 bg-white/5"
      }`}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
      >
        <span
          className={`font-semibold text-sm sm:text-base leading-snug transition-colors duration-200 ${
            open ? "text-[#6B21A8]" : "text-white"
          }`}
        >
          {item.q}
        </span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.25 }}
          className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xl font-light leading-none transition-colors duration-200 ${
            open ? "bg-[#6B21A8] text-white" : "bg-white/10 text-white"
          }`}
        >
          +
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-5 text-sm sm:text-base text-gray-600 leading-relaxed">
              {item.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── FAQ Section ────────────────────────────────────────────────────────── */
function FAQSection() {
  return (
    <section className="bg-[#6B21A8] py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block px-4 py-1.5 bg-white/15 text-white text-xs font-semibold tracking-widest rounded-full uppercase mb-4">
            FAQ
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight">
            Hosting Questions Answered
          </h2>
          <p className="mt-4 text-purple-200 text-base">
            Can&apos;t find what you&apos;re looking for? Our support team is available 24/7.
          </p>
        </motion.div>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <AccordionItem key={item.q} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── CTA Section ────────────────────────────────────────────────────────── */
function CTASection() {
  return (
    <section className="bg-[#3b0764] py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full opacity-20"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(216,180,254,0.5) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      <motion.div
        className="relative z-10 max-w-3xl mx-auto text-center"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: EASE }}
      >
        <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight mb-5">
          Ready to Launch Your Website?
        </h2>
        <p className="text-purple-200 text-lg mb-10 max-w-xl mx-auto">
          Join hundreds of African businesses already hosted with The B.Shop
        </p>
        <motion.a
          href="/signup"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          className="inline-flex items-center gap-2 px-9 py-4 bg-white text-[#6B21A8] font-black rounded-full text-base transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,255,255,0.25)]"
        >
          Get Started Today
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.a>
      </motion.div>
    </section>
  );
}

/* ─── Website Builder Teaser ─────────────────────────────────────────────── */
function BuilderTeaser() {
  return (
    <section className="bg-[#0d0118] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
          className="flex flex-col sm:flex-row items-center gap-6 bg-[#6B21A8]/20 border border-[#6B21A8]/40 rounded-3xl p-8"
        >
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-purple-300"><svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275z"/></svg></div>
          <div className="flex-1 text-center sm:text-left">
            <p className="text-purple-300 text-sm font-semibold mb-1">Coming Soon</p>
            <h3 className="text-xl font-black text-white mb-2">
              Want us to build your site too?
            </h3>
            <p className="text-gray-400 text-sm">
              Our AI Website Builder is launching soon. Describe your business and we&apos;ll create your entire website automatically.
            </p>
          </div>
          <Link href="/website-builder"
            className="flex-shrink-0 px-6 py-3 bg-[#6B21A8] hover:bg-[#7c3aed] text-white font-bold rounded-2xl transition-colors text-sm whitespace-nowrap">
            Learn More →
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function HostingPage() {
  return (
    <>
      <HeroSection />
      <PlansSection />
      <ComparisonTable />
      <HostingTimeline />
      <IncludedCards />
      <WhySection />
      <BuilderTeaser />
      <FAQSection />
      <CTASection />
    </>
  );
}
