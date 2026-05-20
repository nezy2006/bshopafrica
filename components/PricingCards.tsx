"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getCart, saveCart } from "@/lib/cart";

interface Plan {
  name: string;
  badge?: string;
  monthly: number;
  yearly: number;
  features: { label: string; value: string }[];
  best?: boolean;
}

const PLANS: Plan[] = [
  {
    name: "Business Starter Kit",
    monthly: 8,
    yearly: 96,
    features: [
      { label: "Disk",           value: "10 GB" },
      { label: "Bandwidth",      value: "1 TB" },
      { label: "FTP Accounts",   value: "1" },
      { label: "Email Accounts", value: "10" },
      { label: "Quota / Email",  value: "5 GB" },
      { label: "Email Lists",    value: "1" },
      { label: "Databases",      value: "10" },
      { label: "Subdomains",     value: "5" },
      { label: "Free SSL",       value: "✓" },
      { label: "Parked Domains", value: "5" },
      { label: "Addon Domains",  value: "5" },
      { label: "Free Domain",    value: "1st year" },
    ],
  },
  {
    name: "Business Grower Kit",
    badge: "BEST VALUE",
    monthly: 12,
    yearly: 144,
    best: true,
    features: [
      { label: "Disk",           value: "25 GB" },
      { label: "Bandwidth",      value: "1 TB" },
      { label: "FTP Accounts",   value: "1" },
      { label: "Email Accounts", value: "15" },
      { label: "Quota / Email",  value: "12 GB" },
      { label: "Email Lists",    value: "1" },
      { label: "Databases",      value: "15" },
      { label: "Subdomains",     value: "10" },
      { label: "Free SSL",       value: "✓" },
      { label: "Parked Domains", value: "10" },
      { label: "Addon Domains",  value: "10" },
      { label: "Free Domain",    value: "1st year" },
    ],
  },
  {
    name: "Business Plus Kit",
    monthly: 16,
    yearly: 192,
    features: [
      { label: "Disk",           value: "40 GB" },
      { label: "Bandwidth",      value: "1 TB" },
      { label: "FTP Accounts",   value: "10" },
      { label: "Email Accounts", value: "30" },
      { label: "Quota / Email",  value: "25 GB" },
      { label: "Email Lists",    value: "10" },
      { label: "Databases",      value: "30" },
      { label: "Subdomains",     value: "20" },
      { label: "Free SSL",       value: "✓" },
      { label: "Parked Domains", value: "20" },
      { label: "Addon Domains",  value: "20" },
      { label: "Free Domain",    value: "1st year" },
    ],
  },
];

/* ─── 3-D tilt card ─────────────────────────────────────────────────────── */
function PlanCard({ plan, index }: { plan: Plan; index: number }) {
  const router  = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const [mob, setMob] = useState(false);

  const handleGetStarted = () => {
    saveCart({ ...getCart(), hosting: { type: "hosting", name: plan.name, monthly: plan.monthly, yearly: plan.yearly } });
    router.push("/cart");
  };

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
    cardRef.current.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(8px)`;
  };
  const onLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0px)";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 70 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{
        delay: index * 0.13,
        duration: 0.65,
        ease: [0.22, 1, 0.36, 1],
      }}
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
        {/* best-value badge */}
        {plan.badge && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white text-[#6B21A8] text-xs font-black tracking-widest px-5 py-1.5 rounded-full shadow-lg border-2 border-[#6B21A8] uppercase whitespace-nowrap">
            ⭐ {plan.badge}
          </div>
        )}

        {/* name */}
        <h3 className={`text-xl font-bold mt-2 ${plan.best ? "text-white" : "text-black"}`}>
          {plan.name}
        </h3>

        {/* price */}
        <div className="mt-4 mb-6">
          <div className="flex items-end gap-1">
            <span className={`text-5xl font-black leading-none ${plan.best ? "text-white" : "text-[#6B21A8]"}`}>
              ${plan.monthly}
            </span>
            <span className={`mb-1 text-sm font-medium ${plan.best ? "text-purple-300" : "text-gray-400"}`}>
              /month
            </span>
          </div>
          <p className={`text-sm mt-1 ${plan.best ? "text-purple-200" : "text-gray-400"}`}>
            ${plan.yearly}/year billed annually
          </p>
        </div>

        {/* divider */}
        <div className={`h-px mb-6 ${plan.best ? "bg-purple-500" : "bg-gray-100"}`} />

        {/* features list */}
        <ul className="space-y-2.5 flex-1">
          {plan.features.map((f) => (
            <li
              key={f.label}
              className="flex items-center justify-between text-sm"
            >
              <span className={plan.best ? "text-purple-200" : "text-gray-500"}>
                {f.label}
              </span>
              <span className={`font-semibold ${plan.best ? "text-white" : "text-black"}`}>
                {f.value}
              </span>
            </li>
          ))}
        </ul>

        {/* CTA button with fill-sweep */}
        <div className="mt-8">
          <button
            onClick={handleGetStarted}
            className={`relative overflow-hidden group flex items-center justify-center w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-300 cursor-pointer ${
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

/* ─── Section ────────────────────────────────────────────────────────────── */
export default function PricingCards() {
  return (
    <section className="bg-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* heading */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65 }}
        >
          <span className="inline-block px-4 py-1.5 bg-purple-100 text-[#6B21A8] text-xs font-semibold tracking-widest rounded-full uppercase mb-4">
            Hosting Plans
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-black">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-4 text-gray-500 text-lg max-w-xl mx-auto">
            No hidden fees. No surprises. Pick the plan that fits your ambition.
          </p>
        </motion.div>

        {/* cards grid */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {PLANS.map((plan, i) => (
            <PlanCard key={plan.name} plan={plan} index={i} />
          ))}
        </div>

        {/* note */}
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
