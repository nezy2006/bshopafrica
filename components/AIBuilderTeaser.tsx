"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Check } from "lucide-react";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const PLANS = [
  { name: "Free",     price: "$0",     note: "with hosting",  best: false },
  { name: "Starter",  price: "$8.99",  note: "/mo",           best: true  },
  { name: "Pro",      price: "$13.99", note: "/mo",           best: false },
  { name: "Business", price: "$29.99", note: "/mo",           best: false },
];

const HIGHLIGHTS = [
  "Drag & drop editor",
  "500+ templates",
  "Mobile responsive",
  "Free SSL included",
];

export default function AIBuilderTeaser() {
  return (
    <section className="relative py-24 overflow-hidden bg-[#0d0118]">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#6B21A8]/20 rounded-full blur-[120px]" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px]" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE }}
          className="flex justify-center mb-6">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-500/20 border border-green-500/40 rounded-full text-green-400 text-sm font-semibold">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Free Website Builder Included
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
          className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight text-center">
          Build Your Website for Free
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15, ease: EASE }}
          className="text-lg text-white/60 mb-10 max-w-xl mx-auto leading-relaxed text-center">
          Every hosting plan includes a free drag-and-drop website builder powered by Weebly.
          Upgrade anytime for more features.
        </motion.p>

        {/* Feature chips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
          className="flex flex-wrap justify-center gap-3 mb-12">
          {HIGHLIGHTS.map(h => (
            <span key={h} className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-full text-white/80 text-sm">
              <Check className="w-3.5 h-3.5 text-green-400" />{h}
            </span>
          ))}
        </motion.div>

        {/* Plan pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.25, ease: EASE }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10 max-w-3xl mx-auto">
          {PLANS.map((plan) => (
            <div key={plan.name}
              className={`rounded-2xl p-4 text-center border transition-all ${
                plan.best
                  ? "bg-[#6B21A8] border-[#6B21A8] shadow-[0_0_20px_rgba(107,33,168,0.4)]"
                  : "bg-white/5 border-white/15 hover:border-white/30"
              }`}>
              {plan.best && (
                <div className="text-[10px] font-bold text-purple-200 uppercase tracking-widest mb-1">Popular</div>
              )}
              <div className={`text-sm font-bold mb-1 ${plan.best ? "text-white" : "text-gray-300"}`}>{plan.name}</div>
              <div className={`text-xl font-black ${plan.best ? "text-white" : "text-white/90"}`}>{plan.price}</div>
              <div className={`text-xs ${plan.best ? "text-purple-300" : "text-gray-500"}`}>{plan.note}</div>
            </div>
          ))}
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3, ease: EASE }}
          className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/hosting"
            className="inline-flex items-center justify-center px-8 py-4 bg-[#6B21A8] text-white font-black text-base rounded-full hover:shadow-[0_0_30px_rgba(107,33,168,0.6)] transition-shadow">
            Start Building Free
          </Link>
          <Link href="/website-builder#pricing"
            className="inline-flex items-center justify-center px-8 py-4 border-2 border-white/25 text-white font-bold text-base rounded-full hover:bg-white/10 transition-colors">
            See All Plans
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
