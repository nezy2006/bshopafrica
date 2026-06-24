"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { setAuth } from "@/lib/auth";

type Ease = [number, number, number, number];
const EASE: Ease = [0.22, 1, 0.36, 1];

const PERKS = [
  "Manage your domains",
  "View and pay invoices",
  "Access your cPanel",
];

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.09 } } };
const fadeUp  = {
  hidden:  { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" as const } },
};

type LoginStep = "credentials" | "otp";

interface PendingClient {
  clientId:  number;
  firstname: string;
  lastname:  string;
  email:     string;
}

/* ─── Icons ──────────────────────────────────────────────────────────────── */
function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
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

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

/* ─── Left panel ─────────────────────────────────────────────────────────── */
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
        <motion.h1
          className="text-5xl font-black text-white mb-4 leading-tight"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.75, ease: EASE }}
        >
          Welcome Back
        </motion.h1>
        <motion.p
          className="text-purple-200 text-lg mb-10 max-w-xs leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.65 }}
        >
          Log in to manage your domains, hosting, and more
        </motion.p>
        <ul className="space-y-4">
          {PERKS.map((perk, i) => (
            <motion.li
              key={perk}
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.55 + i * 0.1, duration: 0.5 }}
            >
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-bold">
                ✓
              </span>
              <span className="text-white/90 font-medium">{perk}</span>
            </motion.li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

/* ─── Login Page ─────────────────────────────────────────────────────────── */
export default function LoginPage() {
  const router = useRouter();

  const [step,           setStep]           = useState<LoginStep>("credentials");
  const [email,          setEmail]          = useState("");
  const [password,       setPassword]       = useState("");
  const [showPw,         setShowPw]         = useState(false);
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState<string | null>(null);
  const [notFound,       setNotFound]       = useState(false);
  const [pendingClient,  setPendingClient]  = useState<PendingClient | null>(null);

  // OTP step
  const [otp,            setOtp]            = useState(["", "", "", "", "", ""]);
  const [otpLoading,     setOtpLoading]     = useState(false);
  const [otpError,       setOtpError]       = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [devCode,        setDevCode]        = useState<string | null>(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  /* ── Credentials step ── */
  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const res  = await fetch("/api/whmcs", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action: "loginClient", params: { email, password } }),
      });
      const json = (await res.json()) as {
        success:    boolean;
        data?:      PendingClient;
        error?:     string;
        errorType?: "not_found" | "wrong_password";
      };
      if (!json.success || !json.data?.clientId) {
        if (json.errorType === "not_found") {
          setNotFound(true);
        } else {
          setError(json.error ?? "Invalid email or password. Please try again.");
        }
        return;
      }
      setPendingClient(json.data);
      const code = await sendOtp(json.data.email || email, json.data.clientId);
      setDevCode(code ?? null);
      setStep("otp");
      setResendCooldown(30);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const sendOtp = async (emailAddr: string, clientId: number): Promise<string | undefined> => {
    const res  = await fetch("/api/auth/send-otp", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email: emailAddr, clientId }),
    });
    const json = (await res.json()) as { success: boolean; devCode?: string };
    return json.devCode;
  };

  /* ── OTP digit input ── */
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (digits.length === 6) {
      setOtp(digits.split(""));
      setTimeout(() => otpRefs.current[5]?.focus(), 0);
    }
  };

  /* ── Verify OTP ── */
  const handleVerifyOtp = async () => {
    if (!pendingClient) return;
    const code = otp.join("");
    if (code.length !== 6) { setOtpError("Please enter the 6-digit code."); return; }
    setOtpLoading(true);
    setOtpError(null);
    try {
      const res  = await fetch("/api/auth/verify-otp", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: pendingClient.email || email, otp: code }),
      });
      const json = (await res.json()) as { success: boolean; error?: string };
      if (!json.success) {
        setOtpError(json.error ?? "Invalid code. Please try again.");
        return;
      }
      setAuth(pendingClient.clientId, pendingClient.firstname, pendingClient.lastname, pendingClient.email || email);
      window.dispatchEvent(new Event("bshop_cart_update"));
      router.push("/dashboard");
    } catch {
      setOtpError("Something went wrong. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  /* ── Resend OTP ── */
  const handleResend = async () => {
    if (!pendingClient || resendCooldown > 0) return;
    setOtpError(null);
    setOtp(["", "", "", "", "", ""]);
    const code = await sendOtp(pendingClient.email || email, pendingClient.clientId);
    setDevCode(code ?? null);
    setResendCooldown(30);
    otpRefs.current[0]?.focus();
  };

  const maskedEmail = pendingClient
    ? (pendingClient.email || email).replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + "*".repeat(Math.max(1, b.length)) + c)
    : email;

  return (
    <div className="min-h-screen flex">
      <LeftPanel />

      {/* Right — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 bg-white">
        <AnimatePresence mode="wait">
          {step === "credentials" ? (
            <motion.div
              key="credentials"
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
                <h2 className="text-3xl font-black text-black mb-1">Log In to Your Account</h2>
                <p className="text-gray-500 text-sm">Welcome back — we missed you.</p>
              </motion.div>

              <form onSubmit={handleCredentials} className="space-y-5">
                <motion.div variants={fadeUp}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-base text-black placeholder-gray-400 outline-none transition-all duration-300 hover:border-gray-300 focus:border-[#6B21A8] focus:bg-white focus:shadow-[0_0_0_4px_rgba(107,33,168,0.1)]"
                  />
                </motion.div>

                <motion.div variants={fadeUp}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-700">Password</label>
                    <Link
                      href="/forgot-password"
                      className="text-xs font-semibold text-[#6B21A8] hover:underline"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full px-4 py-3.5 pr-12 rounded-xl border-2 border-gray-200 bg-gray-50 text-base text-black placeholder-gray-400 outline-none transition-all duration-300 hover:border-gray-300 focus:border-[#6B21A8] focus:bg-white focus:shadow-[0_0_0_4px_rgba(107,33,168,0.1)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#6B21A8] transition-colors"
                    >
                      <EyeIcon open={showPw} />
                    </button>
                  </div>
                </motion.div>

                <motion.div variants={fadeUp}>
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={!loading ? { scale: 1.01 } : {}}
                    whileTap={!loading ? { scale: 0.98 } : {}}
                    className="relative overflow-hidden w-full flex items-center justify-center gap-2 py-3.5 bg-[#6B21A8] text-white font-bold rounded-xl text-base transition-all duration-300 hover:bg-[#581c87] hover:shadow-[0_0_28px_rgba(107,33,168,0.45)] disabled:opacity-70"
                  >
                    {loading ? <><Spinner /><span>Logging in…</span></> : "Log In"}
                  </motion.button>
                </motion.div>
              </form>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl"
                >
                  <span className="text-red-500 text-base">✕</span>
                  <p className="text-sm text-red-600 font-medium">{error}</p>
                </motion.div>
              )}

              {notFound && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 px-4 py-3.5 bg-amber-50 border border-amber-200 rounded-xl"
                >
                  <p className="text-sm text-amber-800 font-medium mb-1.5">
                    No account found with that email address.
                  </p>
                  <Link
                    href={`/signup?email=${encodeURIComponent(email)}`}
                    className="inline-block text-sm font-bold text-[#6B21A8] hover:underline"
                  >
                    Create an account →
                  </Link>
                </motion.div>
              )}

              <motion.div variants={fadeUp} className="my-6 flex items-center gap-4">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 font-medium">or</span>
                <div className="flex-1 h-px bg-gray-200" />
              </motion.div>

              <motion.div variants={fadeUp}>
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-3 py-3.5 border-2 border-gray-200 rounded-xl text-gray-700 font-semibold text-sm hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
                >
                  <GoogleIcon />
                  Continue with Google
                </button>
              </motion.div>

              <motion.p variants={fadeUp} className="mt-8 text-center text-sm text-gray-500">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="text-[#6B21A8] font-bold hover:underline">
                  Sign up
                </Link>
              </motion.p>
            </motion.div>
          ) : (
            /* ── OTP Step ── */
            <motion.div
              key="otp"
              className="w-full max-w-md"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              {/* mobile logo */}
              <div className="lg:hidden mb-10 flex justify-center">
                <Image src="/logo.png" alt="The B.Shop" width={160} height={48} className="h-10 w-auto object-contain" />
              </div>

              <div className="mb-8 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-5 text-[#6B21A8]">
                  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <h2 className="text-3xl font-black text-black mb-2">Check your email</h2>
                <p className="text-gray-500 text-sm leading-relaxed">
                  We sent a 6-digit code to<br />
                  <span className="font-semibold text-gray-700">{maskedEmail}</span>
                </p>
              </div>

              {/* Fallback: shown when WHMCS email delivery fails */}
              {devCode && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-5 px-4 py-3.5 bg-yellow-50 border border-yellow-300 rounded-xl text-sm"
                >
                  <p className="font-semibold text-yellow-800 mb-1">Email delivery issue — use this code:</p>
                  <p className="text-2xl font-black tracking-[0.3em] text-yellow-900">{devCode}</p>
                </motion.div>
              )}

              {/* 6 OTP boxes */}
              <div className="flex gap-3 justify-center mb-6" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    className="w-12 h-14 text-center text-xl font-bold rounded-xl border-2 border-gray-200 bg-gray-50 text-black outline-none transition-all duration-200 focus:border-[#6B21A8] focus:bg-white focus:shadow-[0_0_0_4px_rgba(107,33,168,0.1)] caret-transparent"
                  />
                ))}
              </div>

              {otpError && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl"
                >
                  <span className="text-red-500">✕</span>
                  <p className="text-sm text-red-600 font-medium">{otpError}</p>
                </motion.div>
              )}

              <motion.button
                onClick={handleVerifyOtp}
                disabled={otpLoading || otp.join("").length < 6}
                whileHover={!otpLoading ? { scale: 1.01 } : {}}
                whileTap={!otpLoading ? { scale: 0.98 } : {}}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#6B21A8] text-white font-bold rounded-xl text-base transition-all duration-300 hover:bg-[#581c87] hover:shadow-[0_0_28px_rgba(107,33,168,0.45)] disabled:opacity-50"
              >
                {otpLoading ? <><Spinner /><span>Verifying…</span></> : "Verify Code"}
              </motion.button>

              <div className="mt-5 text-center space-y-3">
                <p className="text-sm text-gray-500">
                  Didn&apos;t receive it?{" "}
                  {resendCooldown > 0 ? (
                    <span className="text-gray-400">Resend in {resendCooldown}s</span>
                  ) : (
                    <button onClick={handleResend} className="text-[#6B21A8] font-semibold hover:underline">
                      Resend code
                    </button>
                  )}
                </p>
                <button
                  onClick={() => { setStep("credentials"); setOtp(["","","","","",""]); setOtpError(null); setDevCode(null); }}
                  className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ← Back to login
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
