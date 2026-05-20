"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function AIBuilderTeaser() {
  const [email,     setEmail]     = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading,   setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await fetch("/api/newsletter", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, source: "ai_builder_waitlist" }),
      });
      setSubmitted(true);
    } catch { setSubmitted(true); }
    finally { setLoading(false); }
  }

  return (
    <section className="relative py-24 overflow-hidden bg-[#0d0118]">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#6B21A8]/20 rounded-full blur-[120px]" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px]" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE }}
          className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#6B21A8]/30 border border-[#6B21A8]/50 rounded-full text-purple-300 text-sm font-medium mb-6">
          <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
          Coming Soon
        </motion.div>

        {/* Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
          className="text-4xl sm:text-5xl font-bold text-white mb-6 leading-tight">
          🚀 AI Website Builder
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
          className="text-lg text-white/60 mb-10 max-w-2xl mx-auto leading-relaxed">
          Build your website in minutes with AI. Just describe your business and we&apos;ll create a
          complete, professional website — design, copy, and pages — ready to launch instantly.
        </motion.p>

        {/* Feature chips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3, ease: EASE }}
          className="flex flex-wrap justify-center gap-3 mb-12">
          {[
            "⚡ Generate in 60 seconds",
            "🎨 Auto design + copy",
            "🌍 Multilingual support",
            "📱 Mobile-first always",
            "🔌 One-click publish",
          ].map(f => (
            <span key={f} className="px-4 py-2 bg-white/10 border border-white/20 rounded-full text-white/80 text-sm">
              {f}
            </span>
          ))}
        </motion.div>

        {/* Waitlist form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4, ease: EASE }}>
          {submitted ? (
            <div className="inline-flex items-center gap-3 px-6 py-4 bg-green-500/20 border border-green-500/40 rounded-2xl text-green-400 font-semibold">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              You&apos;re on the waitlist! We&apos;ll notify you when it launches.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="flex-1 px-5 py-3.5 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/40 outline-none focus:border-[#6B21A8] focus:bg-white/15 transition-colors text-sm"
              />
              <button type="submit" disabled={loading || !email.trim()}
                className="px-6 py-3.5 bg-[#6B21A8] text-white font-semibold rounded-2xl hover:shadow-[0_0_30px_rgba(107,33,168,0.6)] transition-shadow disabled:opacity-60 text-sm whitespace-nowrap">
                {loading ? "Joining…" : "Notify Me"}
              </button>
            </form>
          )}
          <p className="text-white/30 text-xs mt-3">No spam. Early access only. Launching Q3 2026.</p>
        </motion.div>
      </div>
    </section>
  );
}
