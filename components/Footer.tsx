"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { PaymentIconsRow } from "@/components/PaymentIcons";

/* ─── Social icons ──────────────────────────────────────────────────────── */
function TwitterIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}
function LinkedinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}
function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
    </svg>
  );
}

const SOCIALS = [
  { icon: <InstagramIcon />, href: "https://www.instagram.com/thebshopafrica/",        label: "Instagram" },
  { icon: <TwitterIcon />,   href: "https://x.com/thebshopafrica",                     label: "X / Twitter" },
  { icon: <LinkedinIcon />,  href: "https://rw.linkedin.com/company/the-bshop-africa", label: "LinkedIn" },
  { icon: <TikTokIcon />,    href: "https://www.tiktok.com/@b.shopafrica_",           label: "TikTok" },
];

const FOOTER_LINKS = {
  "Hosting": [
    { label: "Business Starter", href: "/hosting" },
    { label: "Business Grower",  href: "/hosting" },
    { label: "Business Plus",    href: "/hosting" },
    { label: "Compare Plans",    href: "/hosting#compare" },
  ],
  "Domains": [
    { label: "Domain Search",    href: "/domains" },
    { label: "Domain Transfer",  href: "/transfer" },
    { label: "Domain Pricing",   href: "/domains" },
    { label: "WHOIS Lookup",     href: "#" },
  ],
  "Company": [
    { label: "About Us",         href: "/about" },
    { label: "Digital Campfire", href: "/digital-campfire" },
    { label: "Website Builder",  href: "/website-builder" },
    { label: "Contact Us",       href: "/contact" },
    { label: "Privacy Policy",   href: "/privacy" },
  ],
};

const PAYMENTS = ["Visa", "Mastercard", "PayPal", "Payoneer"];
const TRUST: { icon: React.ReactNode; label: string }[] = [
  {
    icon: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    label: "SSL Secured",
  },
  {
    icon: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>,
    label: "30-Day Money Back",
  },
  {
    icon: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/><path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>,
    label: "24/7 Support",
  },
];
const LEGAL   = [
  { label: "Terms of Service", href: "/terms" },
  { label: "Privacy Policy",   href: "/privacy" },
  { label: "Refund Policy",    href: "/refund" },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

export default function Footer() {
  const [email, setEmail] = useState("");
  const [focused, setFocused] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) setSubmitted(true);
  };

  return (
    <footer className="bg-black text-white pt-12 pb-5 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-16 border-b border-white/10">

          {/* Brand column */}
          <motion.div
            className="lg:col-span-2 space-y-6"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65 }}
          >
            <Image
              src="/The-Bshop-logo-REVAMPED-2025_white-logo-landscape-scaled.png"
              alt="The B.Shop"
              width={200}
              height={60}
              className="h-12 w-auto object-contain"
            />
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
              Africa&apos;s premier web hosting provider. Fast, reliable, and
              transparently priced — helping businesses across Africa and beyond
              establish their digital presence.
            </p>

            {/* Address + contact */}
            <div className="space-y-1.5">
              <p className="flex items-center gap-2 text-sm text-gray-500">
                <svg className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                Africa and beyond
              </p>
              <p className="flex items-center gap-2 text-sm text-gray-500">
                <svg className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                <a href="mailto:admin@bshopafrica.com" className="hover:text-white transition-colors">admin@bshopafrica.com</a>
              </p>
            </div>

            {/* Social icons */}
            <div className="flex gap-3">
              {SOCIALS.map((s) => (
                <motion.a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  whileHover={{ rotate: 360, scale: 1.2 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#6B21A8] flex items-center justify-center text-gray-400 hover:text-white transition-colors duration-200"
                >
                  {s.icon}
                </motion.a>
              ))}
            </div>

            {/* Newsletter */}
            <div>
              <p className="text-sm font-semibold text-white mb-3">
                Stay in the loop
              </p>
              {submitted ? (
                <p className="text-sm text-green-400">
                  ✓ You&apos;re subscribed! Welcome to the family.
                </p>
              ) : (
                <form onSubmit={handleNewsletter} className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    placeholder="your@email.com"
                    className={`flex-1 px-4 py-2.5 text-sm rounded-xl bg-white/10 border transition-all duration-300 outline-none text-white placeholder-gray-500 ${
                      focused
                        ? "border-[#6B21A8] shadow-[0_0_0_3px_rgba(107,33,168,0.2)]"
                        : "border-white/15"
                    }`}
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-[#6B21A8] hover:bg-[#7c3aed] rounded-xl text-sm font-semibold transition-all duration-200 hover:shadow-[0_0_16px_rgba(107,33,168,0.5)] whitespace-nowrap"
                  >
                    Subscribe
                  </button>
                </form>
              )}
            </div>
          </motion.div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([heading, links], colIdx) => (
            <motion.div
              key={heading}
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ delay: colIdx * 0.1 }}
            >
              <motion.h4
                variants={itemVariants}
                className="text-sm font-bold text-white mb-4 uppercase tracking-widest"
              >
                {heading}
              </motion.h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <motion.li key={link.label} variants={itemVariants}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-400 hover:text-white hover:pl-1 transition-all duration-200"
                    >
                      {link.label}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Trust badges */}
        <motion.div
          className="py-6 border-b border-white/10 flex flex-wrap gap-3 justify-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {TRUST.map((t) => (
            <span key={t.label} className="flex items-center gap-1.5 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs text-gray-400 font-medium">
              {t.icon}{t.label}
            </span>
          ))}
        </motion.div>

        {/* Bottom bar */}
        <motion.div
          className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} The B.Shop · All rights reserved.
            </p>
            <div className="flex gap-3">
              {LEGAL.map((l) => (
                <Link key={l.label} href={l.href} className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Payment icons */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">We Accept</span>
            <PaymentIconsRow />
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
