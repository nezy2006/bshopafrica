"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

type Ease = [number, number, number, number];
const EASE: Ease = [0.22, 1, 0.36, 1];

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.09 } } };
const fadeUp  = {
  hidden:  { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" as const } },
};

function Spinner() {
  return (
    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

function LeftPanel() {
  return (
    <motion.div
      className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#3b0764] via-[#6B21A8] to-[#4c1d95] relative flex-col p-14 overflow-hidden"
      initial={{ x: -60, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: EASE }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full opacity-20"
        style={{
          background: "radial-gradient(ellipse at center, rgba(216,180,254,0.5) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />
      <div className="relative z-10">
        <Image
          src="/The-Bshop-logo-REVAMPED-2025_white-logo-landscape-scaled.png"
          alt="The B.Shop"
          width={180}
          height={54}
          className="h-11 w-auto object-contain"
        />
      </div>
      <div className="relative z-10 mt-auto mb-auto pt-16">
        <motion.div
          className="w-20 h-20 rounded-2xl bg-white/15 flex items-center justify-center mb-8 text-white"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.6, ease: EASE }}
        >
          <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </motion.div>
        <motion.h1
          className="text-5xl font-black text-white mb-4 leading-tight"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.75, ease: EASE }}
        >
          Reset Your Password
        </motion.h1>
        <motion.p
          className="text-purple-200 text-lg max-w-xs leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.65 }}
        >
          Enter your email and we&apos;ll send you a reset link
        </motion.p>
      </div>
    </motion.div>
  );
}

export default function ForgotPasswordPage() {
  const [step,    setStep]    = useState<"form" | "success">("form");
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch("/api/auth/reset-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: email.trim() }),
      });
      const json = await res.json() as { success: boolean; error?: string };
      if (!json.success) {
        setError(json.error ?? "Something went wrong. Please try again.");
        return;
      }
      setStep("success");
      setCooldown(30);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setLoading(true);
    try {
      await fetch("/api/auth/reset-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: email.trim() }),
      });
      setCooldown(30);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex">
      <LeftPanel />

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 bg-white">
        <AnimatePresence mode="wait">
          {step === "form" ? (
            <motion.div
              key="form"
              className="w-full max-w-md"
              variants={stagger}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, x: -20 }}
            >
              {/* mobile logo */}
              <motion.div variants={fadeUp} className="lg:hidden mb-10 flex justify-center">
                <Image src="/logo.png" alt="The B.Shop" width={160} height={48} className="h-10 w-auto object-contain" />
              </motion.div>

              <motion.div variants={fadeUp} className="mb-8">
                <h2 className="text-3xl font-black text-black mb-1">Forgot Password?</h2>
                <p className="text-gray-500 text-sm">Enter your account email address</p>
              </motion.div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <motion.div variants={fadeUp}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-base text-black placeholder-gray-400 outline-none transition-all duration-300 hover:border-gray-300 focus:border-[#6B21A8] focus:bg-white focus:shadow-[0_0_0_4px_rgba(107,33,168,0.1)]"
                  />
                </motion.div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl"
                  >
                    <svg className="w-4 h-4 text-red-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                    <p className="text-sm text-red-600 font-medium">{error}</p>
                  </motion.div>
                )}

                <motion.div variants={fadeUp}>
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={!loading ? { scale: 1.01 } : {}}
                    whileTap={!loading ? { scale: 0.98 } : {}}
                    className="relative overflow-hidden w-full flex items-center justify-center gap-2 py-3.5 bg-[#6B21A8] text-white font-bold rounded-xl text-base transition-all duration-300 hover:bg-[#581c87] hover:shadow-[0_0_28px_rgba(107,33,168,0.45)] disabled:opacity-70"
                  >
                    {loading ? <><Spinner /><span>Sending…</span></> : "Send Reset Link"}
                  </motion.button>
                </motion.div>
              </form>

              <motion.p variants={fadeUp} className="mt-8 text-center text-sm text-gray-500">
                Remember your password?{" "}
                <Link href="/login" className="text-[#6B21A8] font-bold hover:underline">
                  Back to Login
                </Link>
              </motion.p>
            </motion.div>
          ) : (
            /* ── Success state ── */
            <motion.div
              key="success"
              className="w-full max-w-md text-center"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              {/* mobile logo */}
              <div className="lg:hidden mb-10 flex justify-center">
                <Image src="/logo.png" alt="The B.Shop" width={160} height={48} className="h-10 w-auto object-contain" />
              </div>

              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 18 }}
                className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6"
              >
                <svg className="w-10 h-10 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.5 }}
                className="text-3xl font-black text-black mb-3"
              >
                Check your email!
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.5 }}
                className="text-gray-500 text-sm leading-relaxed mb-8"
              >
                We sent a password reset link to<br />
                <span className="font-semibold text-gray-700">{email}</span>
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.5 }}
                className="mb-8 px-5 py-4 bg-gray-50 rounded-2xl border border-gray-100 text-sm text-gray-500"
              >
                Didn&apos;t receive it? Check your spam folder or{" "}
                {cooldown > 0 ? (
                  <span className="text-gray-400">resend in {cooldown}s</span>
                ) : (
                  <button
                    onClick={handleResend}
                    disabled={loading}
                    className="text-[#6B21A8] font-semibold hover:underline disabled:opacity-60"
                  >
                    {loading ? "Sending…" : "resend"}
                  </button>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.5 }}
              >
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 w-full py-3.5 bg-[#6B21A8] text-white font-bold rounded-xl text-base transition-all duration-300 hover:bg-[#581c87] hover:shadow-[0_0_28px_rgba(107,33,168,0.45)]"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                  Back to Login
                </Link>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
