"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

type Ease = [number, number, number, number];
const EASE: Ease = [0.22, 1, 0.36, 1];

const INPUT =
  "w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-base text-black placeholder-gray-400 outline-none transition-all duration-300 hover:border-gray-300 focus:border-[#6B21A8] focus:bg-white focus:shadow-[0_0_0_4px_rgba(107,33,168,0.1)]";

const SUBJECTS = [
  "General Inquiry",
  "Technical Support",
  "Billing Question",
  "Domain Issue",
  "Partnership",
];

const SOCIALS = [
  { label: "Instagram",  href: "https://www.instagram.com/thebshopafrica/",        Icon: InstagramIcon },
  { label: "X / Twitter",href: "https://x.com/thebshopafrica",                     Icon: TwitterIcon   },
  { label: "LinkedIn",   href: "https://rw.linkedin.com/company/the-bshop-africa", Icon: LinkedInIcon  },
  { label: "TikTok",     href: "https://www.tiktok.com/@thebshopafrica",           Icon: TikTokIcon    },
];

const FAQ_TEASER = [
  {
    q: "How do I get started with hosting?",
    a: "Choose a plan on our Hosting page, search for your domain, and complete checkout. Your hosting account is ready within minutes and comes with full cPanel access.",
  },
  {
    q: "How long does domain registration take?",
    a: "Registration is instant for most TLDs (.com, .net, .org, .xyz). You'll receive a confirmation email within minutes of completing your purchase.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept Visa, Mastercard, PayPal, and PawaPay (Mobile Money). All transactions are secured with 256-bit SSL encryption.",
  },
];

/* ─── Icons ──────────────────────────────────────────────────────────────── */
function MailIcon({ cls = "w-6 h-6" }: { cls?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={cls}>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}
function ClockIcon({ cls = "w-6 h-6" }: { cls?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={cls}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
function MapPinIcon({ cls = "w-6 h-6" }: { cls?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={cls}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
function ShareIcon({ cls = "w-6 h-6" }: { cls?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={cls}>
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51"  x2="8.59"  y2="10.49" />
    </svg>
  );
}
function PaperclipIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}
function ChevronIcon() {
  return (
    <svg className="w-4 h-4 pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="6 9 12 15 18 9" />
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
function TwitterIcon() {
  return <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>;
}
function InstagramIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><rect width="20" height="20" x="2" y="2" rx="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>;
}
function LinkedInIcon() {
  return <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect width="4" height="12" x="2" y="9" /><circle cx="4" cy="4" r="2" /></svg>;
}
function TikTokIcon() {
  return <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" /></svg>;
}

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
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full opacity-25"
        style={{
          background: "radial-gradient(ellipse at center, rgba(216,180,254,0.5) 0%, transparent 70%)",
          filter: "blur(70px)",
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <motion.span
          className="inline-block px-4 py-1.5 bg-white/15 text-white text-xs font-semibold tracking-widest rounded-full uppercase mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Contact Us
        </motion.span>

        <motion.h1
          className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.08] tracking-tight mb-5"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.75, ease: EASE }}
        >
          We&apos;re Here to Help
        </motion.h1>

        <motion.p
          className="text-lg text-purple-200 max-w-xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.65 }}
        >
          Our team is available Monday–Friday, 9 AM–5 PM CAT.
          <br className="hidden sm:block" /> We reply within 48 hours.
        </motion.p>
      </div>
    </section>
  );
}

/* ─── Contact form ───────────────────────────────────────────────────────── */
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };
const fadeUp  = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" as const } },
};

function ContactForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name,        setName]        = useState("");
  const [email,       setEmail]       = useState("");
  const [phone,       setPhone]       = useState("");
  const [subject,     setSubject]     = useState(SUBJECTS[0]);
  const [message,     setMessage]     = useState("");
  const [fileName,    setFileName]    = useState<string | null>(null);
  const [errors,      setErrors]      = useState<Record<string, string>>({});
  const [loading,     setLoading]     = useState(false);
  const [sent,        setSent]        = useState(false);
  const [ticketId,    setTicketId]    = useState("");
  const [submitError, setSubmitError] = useState("");

  const validate = useCallback(() => {
    const e: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 2)
      e.name = "Please enter your full name (min. 2 characters).";
    if (!email.trim())
      e.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(email))
      e.email = "Please enter a valid email address.";
    if (!message.trim() || message.trim().length < 20)
      e.message = "Message must be at least 20 characters.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [name, email, message]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/contact", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name, email, phone, subject, message }),
      });
      const json = (await res.json()) as { success: boolean; ticketId?: string; error?: string };
      if (json.success) {
        setTicketId(json.ticketId ?? "");
        setSent(true);
      } else {
        setSubmitError(json.error ?? "Failed to send. Please try again.");
      }
    } catch {
      setSubmitError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1    }}
        transition={{ duration: 0.5, ease: EASE }}
        className="flex flex-col items-center justify-center py-12 text-center"
      >
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 18 }}
          className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center mb-6 shadow-[0_0_32px_rgba(34,197,94,0.35)]"
        >
          <motion.svg viewBox="0 0 52 52" fill="none" className="w-10 h-10">
            <motion.path
              d="M14 27l9 9 16-18"
              stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
            />
          </motion.svg>
        </motion.div>

        <motion.h3
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0  }}
          transition={{ delay: 0.4, duration: 0.45 }}
          className="text-2xl font-black text-black mb-2"
        >
          Message sent!
        </motion.h3>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0  }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="text-gray-500 mb-8 max-w-xs"
        >
          {ticketId ? `Ticket #${ticketId} created. ` : ""}We&apos;ll reply within 48 hours.
        </motion.p>
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65 }}
          onClick={() => { setSent(false); setName(""); setEmail(""); setPhone(""); setMessage(""); setFileName(null); }}
          className="text-sm text-[#6B21A8] font-semibold hover:underline"
        >
          ← Send another message
        </motion.button>
      </motion.div>
    );
  }

  return (
    <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
      <motion.div variants={fadeUp} className="mb-6">
        <h2 className="text-2xl font-black text-black">Send Us a Message</h2>
      </motion.div>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">

        {/* Full Name */}
        <motion.div variants={fadeUp}>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Full Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Jane Doe"
            className={`${INPUT} ${errors.name ? "border-red-300 focus:border-red-400 focus:shadow-[0_0_0_4px_rgba(239,68,68,0.1)]" : ""}`}
          />
          {errors.name && <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.name}</p>}
        </motion.div>

        {/* Email */}
        <motion.div variants={fadeUp}>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Email Address <span className="text-red-400">*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@company.com"
            className={`${INPUT} ${errors.email ? "border-red-300 focus:border-red-400 focus:shadow-[0_0_0_4px_rgba(239,68,68,0.1)]" : ""}`}
          />
          {errors.email && <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.email}</p>}
        </motion.div>

        {/* Phone */}
        <motion.div variants={fadeUp}>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Phone Number <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+250 700 000 000"
            className={INPUT}
          />
        </motion.div>

        {/* Subject */}
        <motion.div variants={fadeUp}>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
          <div className="relative">
            <select
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className={`${INPUT} appearance-none pr-10 cursor-pointer`}
            >
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronIcon />
          </div>
        </motion.div>

        {/* Message */}
        <motion.div variants={fadeUp}>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Message <span className="text-red-400">*</span>
          </label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Tell us how we can help you…"
            rows={5}
            className={`${INPUT} resize-none ${errors.message ? "border-red-300 focus:border-red-400 focus:shadow-[0_0_0_4px_rgba(239,68,68,0.1)]" : ""}`}
          />
          <div className="flex justify-between mt-1">
            {errors.message
              ? <p className="text-xs text-red-500 font-medium">{errors.message}</p>
              : <span />}
            <span className={`text-xs ml-auto ${message.length < 20 ? "text-gray-400" : "text-green-500"}`}>
              {message.length} / 20 min
            </span>
          </div>
        </motion.div>

        {/* File attachment */}
        <motion.div variants={fadeUp}>
          <input
            ref={fileInputRef}
            type="file"
            className="sr-only"
            onChange={e => setFileName(e.target.files?.[0]?.name ?? null)}
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 text-gray-500 hover:border-[#6B21A8] hover:text-[#6B21A8] hover:bg-purple-50 transition-all duration-200 text-sm font-medium"
          >
            <PaperclipIcon />
            {fileName ? (
              <span className="text-[#6B21A8] font-semibold truncate">{fileName}</span>
            ) : (
              <span>Attach a file <span className="text-gray-400 font-normal">(optional — PDF, DOC, image)</span></span>
            )}
          </button>
        </motion.div>

        {/* Error */}
        {submitError && (
          <motion.div variants={fadeUp} className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {submitError}
          </motion.div>
        )}

        {/* Submit */}
        <motion.div variants={fadeUp}>
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={!loading ? { scale: 1.01 } : {}}
            whileTap={!loading  ? { scale: 0.98 } : {}}
            className="w-full flex items-center justify-center gap-2 py-4 bg-[#6B21A8] text-white font-black rounded-xl text-base transition-all duration-300 hover:bg-[#581c87] hover:shadow-[0_0_28px_rgba(107,33,168,0.45)] disabled:opacity-70"
          >
            {loading ? <><Spinner /><span>Sending…</span></> : "Send Message"}
          </motion.button>
        </motion.div>
      </form>
    </motion.div>
  );
}

/* ─── Info card ──────────────────────────────────────────────────────────── */
function InfoCard({
  icon, title, lines, index,
}: {
  icon:  React.ReactNode;
  title: string;
  lines: React.ReactNode[];
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.55, ease: EASE }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4"
    >
      <div className="w-11 h-11 rounded-xl bg-purple-100 text-[#6B21A8] flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="font-bold text-black text-sm mb-1">{title}</p>
        {lines.map((line, i) => (
          <div key={i} className="text-gray-500 text-sm leading-relaxed">{line}</div>
        ))}
      </div>
    </motion.div>
  );
}

/* ─── Right column contact cards ─────────────────────────────────────────── */
function ContactCards() {
  return (
    <div className="space-y-4">
      <InfoCard
        index={0}
        icon={<MailIcon />}
        title="Email Us"
        lines={[
          <a key="email" href="mailto:hello@bshopafrica.com" className="text-[#6B21A8] font-semibold hover:underline">
            hello@bshopafrica.com
          </a>,
          "For general inquiries",
        ]}
      />

      <InfoCard
        index={1}
        icon={<ClockIcon />}
        title="Support Hours"
        lines={["Monday – Friday", "9:00 AM – 5:00 PM CAT", "Replies within 48 hours"]}
      />

      <InfoCard
        index={2}
        icon={<MapPinIcon />}
        title="Based In"
        lines={[
          <span key="city" className="font-semibold text-black">Kigali, Rwanda</span>,
          "Serving all of Africa",
        ]}
      />

      {/* Social media card */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3, duration: 0.55, ease: EASE }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
      >
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-purple-100 text-[#6B21A8] flex items-center justify-center flex-shrink-0">
            <ShareIcon />
          </div>
          <div>
            <p className="font-bold text-black text-sm mb-3">Follow Us</p>
            <div className="flex gap-2">
              {SOCIALS.map(({ label, href, Icon }) => (
                <motion.a
                  key={label}
                  href={href}
                  aria-label={label}
                  whileHover={{ scale: 1.18, rotate: 5 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="w-9 h-9 rounded-full bg-purple-100 hover:bg-[#6B21A8] text-[#6B21A8] hover:text-white flex items-center justify-center transition-colors duration-200"
                >
                  <Icon />
                </motion.a>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── FAQ teaser accordion ───────────────────────────────────────────────── */
function TeaserItem({ item, index }: { item: { q: string; a: string }; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, duration: 0.5, ease: "easeOut" }}
      className={`rounded-xl overflow-hidden border transition-all duration-300 ${
        open ? "border-purple-200 bg-purple-50" : "border-gray-200 bg-white"
      }`}
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className={`font-semibold text-sm sm:text-base leading-snug transition-colors duration-200 ${
          open ? "text-[#6B21A8]" : "text-black"
        }`}>
          {item.q}
        </span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.22 }}
          className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xl font-light leading-none transition-colors duration-200 ${
            open ? "bg-[#6B21A8] text-white" : "bg-gray-100 text-gray-500"
          }`}
        >
          +
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{    height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: EASE }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-4 text-sm text-gray-600 leading-relaxed">{item.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function FAQTeaser() {
  return (
    <section className="bg-white py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block px-4 py-1.5 bg-purple-100 text-[#6B21A8] text-xs font-semibold tracking-widest rounded-full uppercase mb-4">
            FAQ
          </span>
          <h2 className="text-4xl font-black text-black">Quick Answers</h2>
        </motion.div>

        <div className="space-y-3 mb-8">
          {FAQ_TEASER.map((item, i) => (
            <TeaserItem key={item.q} item={item} index={i} />
          ))}
        </div>

        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Link
            href="/#faq"
            className="inline-flex items-center gap-2 text-[#6B21A8] font-bold text-sm hover:underline"
          >
            See all FAQs
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </motion.div>
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
          backgroundImage:
            "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)",
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
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: EASE }}
      >
        <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight mb-4">
          Ready to get started?
        </h2>
        <p className="text-purple-200 text-lg mb-10">
          Join hundreds of African businesses already online with The B.Shop
        </p>
        <motion.a
          href="/signup"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          className="inline-flex items-center gap-2 px-9 py-4 bg-white text-[#6B21A8] font-black rounded-full text-base transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,255,255,0.25)]"
        >
          Get Started
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.a>
      </motion.div>
    </section>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function ContactPage() {
  return (
    <>
      <HeroSection />

      {/* Contact section */}
      <section className="bg-gray-50 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-[1fr_360px] gap-10 items-start">

            {/* Left — form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, ease: EASE }}
              className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 sm:p-10"
            >
              <ContactForm />
            </motion.div>

            {/* Right — info cards */}
            <ContactCards />
          </div>
        </div>
      </section>

      <FAQTeaser />
      <CTASection />
    </>
  );
}
