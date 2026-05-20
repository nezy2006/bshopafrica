"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const pref = localStorage.getItem("bshop_cookie_consent");
    if (!pref) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem("bshop_cookie_consent", "accepted");
    setVisible(false);
  };

  const manage = () => {
    localStorage.setItem("bshop_cookie_consent", "managed");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0,   opacity: 1 }}
          exit={{    y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6"
        >
          <div className="max-w-4xl mx-auto bg-gray-900 border border-white/10 rounded-2xl px-5 py-4 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <span className="text-xl flex-shrink-0 mt-0.5">🍪</span>
              <p className="text-sm text-gray-300 leading-relaxed">
                We use cookies to improve your experience and analyse site performance.{" "}
                <Link href="#" className="text-[#c084fc] hover:text-white underline underline-offset-2 transition-colors">
                  Privacy Policy
                </Link>
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0 w-full sm:w-auto">
              <button
                onClick={manage}
                className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold text-gray-400 border border-white/15 rounded-lg hover:border-white/30 hover:text-white transition-all"
              >
                Manage
              </button>
              <button
                onClick={accept}
                className="flex-1 sm:flex-none px-5 py-2 text-xs font-bold bg-[#6B21A8] hover:bg-[#7c3aed] text-white rounded-lg transition-all hover:shadow-[0_0_16px_rgba(107,33,168,0.5)]"
              >
                Accept All
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
