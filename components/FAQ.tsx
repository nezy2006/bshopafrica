"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ITEMS = [
  {
    q: "What is web hosting and why do I need it?",
    a: "Web hosting is a service that stores your website's files and makes them accessible on the internet 24/7. Without hosting, your website simply can't be seen by anyone online. The B.Shop provides fast, secure hosting optimised for African businesses.",
  },
  {
    q: "How do I register a domain name?",
    a: "Use our Domain Search above to check if your desired name is available. Once you find one you love, add it to your cart and complete checkout. The whole process takes under 5 minutes.",
  },
  {
    q: "Do all plans include a free domain?",
    a: "Yes! Every hosting plan we offer includes one free domain registration for the first year. After that, renewal is billed at standard rates — no surprises.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept Visa, Mastercard, PayPal, and Payoneer. All transactions are secured with 256-bit SSL encryption.",
  },
  {
    q: "Is there a money-back guarantee?",
    a: "Absolutely. We offer a 30-day money-back guarantee on all hosting plans. If you're not satisfied for any reason, contact our support team and we'll process your refund promptly — no awkward questions.",
  },
  {
    q: "How do I migrate my existing website?",
    a: "Our technical team offers free website migration for all new customers. Simply open a support ticket after signing up and we'll handle the entire transfer for you — zero downtime, zero headache.",
  },
  {
    q: "Do you offer email hosting?",
    a: "Yes. Every plan includes professional email accounts with your domain (e.g. you@yourbusiness.com). Our plans include between 10 and 30 email accounts depending on the tier you choose.",
  },
];

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
        open
          ? "border-white/30 bg-white"
          : "border-white/10 bg-white/5"
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
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
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

export default function FAQ() {
  return (
    <section className="bg-[#6B21A8] py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-[1fr_360px] gap-14 items-start">

          {/* ── Left: accordion ── */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-10"
            >
              <span className="inline-block px-4 py-1.5 bg-white/15 text-white text-xs font-semibold tracking-widest rounded-full uppercase mb-4">
                FAQ
              </span>
              <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight">
                Questions?<br />We&apos;ve got answers.
              </h2>
              <p className="mt-4 text-purple-200 text-base">
                Can&apos;t find what you&apos;re looking for? Chat with our support team.
              </p>
            </motion.div>

            <div className="space-y-3">
              {ITEMS.map((item, i) => (
                <AccordionItem key={item.q} item={item} index={i} />
              ))}
            </div>
          </div>

          {/* ── Right: support card (floating) ── */}
          {/* outer: framer slide-in; inner: CSS float — separate so transforms don't clash */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
          <div className="animate-float" style={{ willChange: "transform" }}>
            <div className="bg-white rounded-3xl p-8 shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center text-3xl mb-6">
                💬
              </div>
              <h3 className="text-xl font-black text-black mb-2">
                Still have questions?
              </h3>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                Our friendly support team is available 24/7 to help you get
                online. Don&apos;t hesitate to reach out.
              </p>

              <a
                href="/contact"
                className="flex items-center justify-center w-full py-3.5 rounded-xl bg-[#6B21A8] text-white font-semibold text-sm hover:bg-[#581c87] transition-all duration-200 hover:shadow-[0_0_24px_rgba(107,33,168,0.45)] mb-4"
              >
                Chat with Support
              </a>
              <a
                href="mailto:admin@bshopafrica.com"
                className="flex items-center justify-center w-full py-3.5 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold text-sm hover:border-[#6B21A8] hover:text-[#6B21A8] transition-all duration-200"
              >
                admin@bshopafrica.com
              </a>

            </div>
          </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
