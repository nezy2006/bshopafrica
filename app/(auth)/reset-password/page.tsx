"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
          Choose a New Password
        </motion.h1>
        <motion.p
          className="text-purple-200 text-lg max-w-xs leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.65 }}
        >
          Almost done — set a strong new password to get back into your account
        </motion.p>
      </div>
    </motion.div>
  );
}

/* ─── Password strength ──────────────────────────────────────────────────── */
function getStrength(pw: string) {
  const checks = [
    pw.length >= 8,
    /[A-Z]/.test(pw),
    /[a-z]/.test(pw),
    /[0-9]/.test(pw),
    /[!@#$%^&*]/.test(pw),
  ];
  const score = checks.filter(Boolean).length;
  const meta = [
    { label: "Weak",   color: "bg-red-500"    },
    { label: "Weak",   color: "bg-red-500"    },
    { label: "Fair",   color: "bg-orange-500" },
    { label: "Good",   color: "bg-blue-500"   },
    { label: "Strong", color: "bg-green-500"  },
  ][Math.max(score - 1, 0)];
  return { score, label: score === 0 ? "" : meta.label, color: meta.color };
}

function ResetPasswordInner() {
  const router = useRouter();
  const params = useSearchParams();
  const token  = params.get("token") ?? "";

  const [step,     setStep]     = useState<"form" | "success">("form");
  const [newPw,    setNewPw]    = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const strength   = getStrength(newPw);
  const strengthOk = newPw.length === 0 || strength.score >= 3;

  useEffect(() => {
    if (step === "success") {
      const t = setTimeout(() => router.push("/login"), 2500);
      return () => clearTimeout(t);
    }
  }, [step, router]);

  if (!token) {
    return (
      <motion.div className="w-full max-w-md text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2 className="text-3xl font-black text-black mb-3">Invalid Reset Link</h2>
        <p className="text-gray-500 text-sm mb-8">This password reset link is missing its token. Please request a new one.</p>
        <Link href="/forgot-password" className="inline-flex items-center justify-center gap-2 w-full py-3.5 bg-[#6B21A8] text-white font-bold rounded-xl text-base hover:bg-[#581c87] transition-all duration-300">
          Request New Link
        </Link>
      </motion.div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!newPw || !confirm) { setError("Please fill in both password fields."); return; }
    if (newPw !== confirm)  { setError("Passwords do not match."); return; }
    if (strength.score < 3) { setError("Please choose a stronger password (at least Fair)."); return; }

    setLoading(true);
    try {
      const res  = await fetch("/api/auth/reset-password/confirm", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ token, newPassword: newPw }),
      });
      const json = await res.json() as { success: boolean; error?: string };
      if (!json.success) {
        setError(json.error ?? "Failed to reset password. Please try again.");
        return;
      }
      setStep("success");
    } catch {
      setError("Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {step === "form" ? (
        <motion.div key="form" className="w-full max-w-md" variants={stagger} initial="hidden" animate="visible" exit={{ opacity: 0, x: -20 }}>
          <div className="lg:hidden mb-10 flex justify-center">
            <Image src="/logo.png" alt="The B.Shop" width={160} height={48} className="h-10 w-auto object-contain" />
          </div>

          <motion.div variants={fadeUp} className="mb-8">
            <h2 className="text-3xl font-black text-black mb-1">Reset Your Password</h2>
            <p className="text-gray-500 text-sm">Enter a new password for your account</p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <motion.div variants={fadeUp}>
              <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
              <input
                type="password" value={newPw} onChange={e => setNewPw(e.target.value)} required
                className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-base text-black outline-none transition-all duration-300 hover:border-gray-300 focus:border-[#6B21A8] focus:bg-white focus:shadow-[0_0_0_4px_rgba(107,33,168,0.1)]"
              />
              {newPw && (
                <div className="mt-2.5 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden flex gap-0.5">
                      {[0, 1, 2, 3, 4].map(i => (
                        <div key={i} className={`flex-1 h-full rounded-full transition-colors ${i < strength.score ? strength.color : "bg-gray-100"}`} />
                      ))}
                    </div>
                    <span className={`text-xs font-medium w-12 text-right ${
                      strength.score <= 2 ? "text-red-600" : strength.score === 3 ? "text-orange-600" : strength.score === 4 ? "text-blue-600" : "text-green-600"
                    }`}>{strength.label}</span>
                  </div>
                  <p className="text-xs text-gray-400">Use 8+ characters with upper/lowercase, a number, and a symbol.</p>
                </div>
              )}
            </motion.div>

            <motion.div variants={fadeUp}>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm New Password</label>
              <input
                type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
                className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-base text-black outline-none transition-all duration-300 hover:border-gray-300 focus:border-[#6B21A8] focus:bg-white focus:shadow-[0_0_0_4px_rgba(107,33,168,0.1)]"
              />
            </motion.div>

            {error && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                <svg className="w-4 h-4 text-red-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                <p className="text-sm text-red-600 font-medium">{error}</p>
              </motion.div>
            )}

            <motion.div variants={fadeUp}>
              <motion.button
                type="submit" disabled={loading || !strengthOk}
                whileHover={!loading ? { scale: 1.01 } : {}}
                whileTap={!loading ? { scale: 0.98 } : {}}
                className="relative overflow-hidden w-full flex items-center justify-center gap-2 py-3.5 bg-[#6B21A8] text-white font-bold rounded-xl text-base transition-all duration-300 hover:bg-[#581c87] hover:shadow-[0_0_28px_rgba(107,33,168,0.45)] disabled:opacity-70"
              >
                {loading ? <><Spinner /><span>Resetting…</span></> : "Reset Password"}
              </motion.button>
            </motion.div>
          </form>

          <motion.p variants={fadeUp} className="mt-8 text-center text-sm text-gray-500">
            Remember your password?{" "}
            <Link href="/login" className="text-[#6B21A8] font-bold hover:underline">Back to Login</Link>
          </motion.p>
        </motion.div>
      ) : (
        <motion.div key="success" className="w-full max-w-md text-center" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, ease: EASE }}>
          <div className="lg:hidden mb-10 flex justify-center">
            <Image src="/logo.png" alt="The B.Shop" width={160} height={48} className="h-10 w-auto object-contain" />
          </div>

          <motion.div
            initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
            className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6"
          >
            <svg className="w-10 h-10 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </motion.div>

          <h2 className="text-3xl font-black text-black mb-3">Password Updated!</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-8">
            Redirecting you to login with your new password…
          </p>

          <Link href="/login" className="inline-flex items-center justify-center gap-2 w-full py-3.5 bg-[#6B21A8] text-white font-bold rounded-xl text-base transition-all duration-300 hover:bg-[#581c87] hover:shadow-[0_0_28px_rgba(107,33,168,0.45)]">
            Go to Login Now
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex">
      <LeftPanel />
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 bg-white">
        <Suspense fallback={<div className="w-8 h-8 border-4 border-[#6B21A8] border-t-transparent rounded-full animate-spin" />}>
          <ResetPasswordInner />
        </Suspense>
      </div>
    </div>
  );
}
