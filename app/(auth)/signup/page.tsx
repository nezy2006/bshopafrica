"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

type Ease = [number, number, number, number];
const EASE: Ease = [0.22, 1, 0.36, 1];

const PERKS = [
  "Free domain for your first year",
  "Professional email included",
  "24/7 expert support",
];

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const fadeUp  = {
  hidden:  { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" as const } },
};

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

/* ─── Password strength ──────────────────────────────────────────────────── */
function getStrength(pw: string): 0 | 1 | 2 | 3 {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(3, s) as 0 | 1 | 2 | 3;
}

const STRENGTH_LABEL = ["", "Weak", "Fair", "Strong"];
const STRENGTH_COLOR = ["", "bg-red-400", "bg-yellow-400", "bg-green-500"];
const STRENGTH_TEXT  = ["", "text-red-500", "text-yellow-600", "text-green-600"];

function StrengthBar({ password }: { password: string }) {
  const s = getStrength(password);
  if (!password) return null;
  return (
    <div className="mt-2">
      <div className="flex gap-1.5 h-1.5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`flex-1 rounded-full transition-all duration-400 ${
              s >= i ? STRENGTH_COLOR[s] : "bg-gray-200"
            }`}
          />
        ))}
      </div>
      <p className={`text-xs mt-1 font-semibold ${STRENGTH_TEXT[s]}`}>
        {STRENGTH_LABEL[s]}
      </p>
    </div>
  );
}

/* ─── Input component ────────────────────────────────────────────────────── */
function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div variants={fadeUp}>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      {children}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1 text-xs text-red-500 font-medium"
        >
          {error}
        </motion.p>
      )}
    </motion.div>
  );
}

const INPUT =
  "w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-base text-black placeholder-gray-400 outline-none transition-all duration-300 hover:border-gray-300 focus:border-[#6B21A8] focus:bg-white focus:shadow-[0_0_0_4px_rgba(107,33,168,0.1)]";

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
          backgroundImage:
            "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full opacity-20"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(216,180,254,0.5) 0%, transparent 70%)",
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
          Start Your<br />Digital Journey
        </motion.h1>
        <motion.p
          className="text-purple-200 text-lg mb-10 max-w-xs leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.65 }}
        >
          Join hundreds of African businesses already growing with The B.Shop
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

/* ─── Signup Page ────────────────────────────────────────────────────────── */
export default function SignupPage() {
  const [firstName,       setFirstName]       = useState("");
  const [lastName,        setLastName]        = useState("");
  const [email,           setEmail]           = useState("");
  const [phone,           setPhone]           = useState("");
  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw,          setShowPw]          = useState(false);
  const [showCpw,         setShowCpw]         = useState(false);
  const [agreed,          setAgreed]          = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [errors,          setErrors]          = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!firstName.trim())  e.firstName       = "First name is required";
    if (!lastName.trim())   e.lastName        = "Last name is required";
    if (!email.trim())      e.email           = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Enter a valid email address";
    if (!phone.trim())      e.phone           = "Phone number is required";
    if (!password)          e.password        = "Password is required";
    else if (password.length < 8) e.password  = "Password must be at least 8 characters";
    if (!confirmPassword)   e.confirmPassword = "Please confirm your password";
    else if (password !== confirmPassword) e.confirmPassword = "Passwords do not match";
    if (!agreed)            e.agreed          = "You must agree to continue";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 2000));
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      <LeftPanel />

      {/* Right — form (scrollable on small screens) */}
      <div className="w-full lg:w-1/2 flex items-start justify-center overflow-y-auto bg-white">
        <motion.div
          className="w-full max-w-md px-8 sm:px-12 py-12"
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          {/* mobile logo */}
          <motion.div variants={fadeUp} className="lg:hidden mb-10 flex justify-center">
            <Image
              src="/logo.png"
              alt="The B.Shop"
              width={160}
              height={48}
              className="h-10 w-auto object-contain"
            />
          </motion.div>

          <motion.div variants={fadeUp} className="mb-8">
            <h2 className="text-3xl font-black text-black mb-1">Create Your Account</h2>
            <p className="text-gray-500 text-sm">Get started in under 2 minutes.</p>
          </motion.div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            {/* First + Last Name */}
            <motion.div variants={fadeUp} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Jane"
                  className={INPUT}
                />
                {errors.firstName && (
                  <p className="mt-1 text-xs text-red-500 font-medium">{errors.firstName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  className={INPUT}
                />
                {errors.lastName && (
                  <p className="mt-1 text-xs text-red-500 font-medium">{errors.lastName}</p>
                )}
              </div>
            </motion.div>

            {/* Email */}
            <Field label="Email Address" error={errors.email}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className={INPUT}
              />
            </Field>

            {/* Phone */}
            <Field label="Phone Number" error={errors.phone}>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+250 700 000 000"
                className={INPUT}
              />
            </Field>

            {/* Password */}
            <Field label="Password" error={errors.password}>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className={`${INPUT} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#6B21A8] transition-colors"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  <EyeIcon open={showPw} />
                </button>
              </div>
              <StrengthBar password={password} />
            </Field>

            {/* Confirm Password */}
            <Field label="Confirm Password" error={errors.confirmPassword}>
              <div className="relative">
                <input
                  type={showCpw ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className={`${INPUT} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowCpw((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#6B21A8] transition-colors"
                  aria-label={showCpw ? "Hide password" : "Show password"}
                >
                  <EyeIcon open={showCpw} />
                </button>
              </div>
            </Field>

            {/* Terms checkbox */}
            <motion.div variants={fadeUp}>
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    onClick={() => setAgreed((v) => !v)}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 cursor-pointer ${
                      agreed
                        ? "bg-[#6B21A8] border-[#6B21A8]"
                        : "bg-white border-gray-300 group-hover:border-[#6B21A8]"
                    }`}
                  >
                    {agreed && (
                      <svg viewBox="0 0 12 10" fill="none" className="w-3 h-3">
                        <path d="M1 5l3.5 3.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-sm text-gray-600 leading-snug">
                  I agree to the{" "}
                  <Link href="#" className="text-[#6B21A8] font-semibold hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="#" className="text-[#6B21A8] font-semibold hover:underline">
                    Privacy Policy
                  </Link>
                </span>
              </label>
              {errors.agreed && (
                <p className="mt-1 text-xs text-red-500 font-medium">{errors.agreed}</p>
              )}
            </motion.div>

            {/* Submit */}
            <motion.div variants={fadeUp}>
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={!loading ? { scale: 1.01 } : {}}
                whileTap={!loading ? { scale: 0.98 } : {}}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#6B21A8] text-white font-bold rounded-xl text-base transition-all duration-300 hover:bg-[#581c87] hover:shadow-[0_0_28px_rgba(107,33,168,0.45)] disabled:opacity-70"
              >
                {loading ? <><Spinner /><span>Creating account…</span></> : "Create Account"}
              </motion.button>
            </motion.div>
          </form>

          {/* Log in link */}
          <motion.p variants={fadeUp} className="mt-8 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/login" className="text-[#6B21A8] font-bold hover:underline">
              Log in
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
