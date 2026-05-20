"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

const NAV_LINKS = [
  { label: "Home",             href: "/" },
  { label: "About Us",         href: "/about" },
  { label: "Digital Campfire", href: "/digital-campfire" },
  { label: "Contact Us",       href: "/contact" },
];

export default function Header() {
  const [scrolled,  setScrolled]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    /* sits 40 px below the announcement bar */
    <motion.header
      className={`fixed top-8 left-0 right-0 z-40 transition-all duration-500 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.08)]"
          : "bg-white/10 backdrop-blur-sm"
      }`}
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0,   opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Image
              src={scrolled ? "/logo.png" : "/The-Bshop-logo-REVAMPED-2025_white-logo-landscape-scaled.png"}
              alt="The B.Shop"
              width={160}
              height={50}
              className="h-10 w-auto object-contain transition-opacity duration-300"
              priority
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`relative group text-sm font-medium transition-colors duration-200 ${
                  scrolled ? "text-gray-800 hover:text-[#6B21A8]" : "text-white hover:text-white/80"
                }`}
              >
                {link.label}
                {/* animated underline */}
                <span className={`absolute -bottom-0.5 left-0 h-[2px] w-0 rounded-full transition-all duration-300 ease-out group-hover:w-full ${
                  scrolled ? "bg-[#6B21A8]" : "bg-white"
                }`} />
              </Link>
            ))}
          </nav>

          {/* Auth buttons */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              href="/login"
              className={`text-sm font-medium transition-colors px-4 py-2 rounded-lg ${
                scrolled ? "text-gray-700 hover:text-[#6B21A8]" : "text-white hover:text-white/80"
              }`}
            >
              Login
            </Link>
            <Link
              href="/signup"
              className={`text-sm font-medium transition-colors px-4 py-2 rounded-lg ${
                scrolled ? "text-gray-700 hover:text-[#6B21A8]" : "text-white hover:text-white/80"
              }`}
            >
              Signup
            </Link>

            {/* Get Started with shine sweep */}
            <Link href="/get-started" className="relative overflow-hidden ml-2 inline-flex items-center px-5 py-2.5 rounded-full bg-[#6B21A8] text-white text-sm font-semibold transition-shadow duration-300 hover:shadow-[0_0_25px_rgba(107,33,168,0.55)]">
              <span className="relative z-10">Get Started</span>
              <motion.span
                className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                initial={{ x: "-150%" }}
                whileHover={{ x: "250%" }}
                transition={{ duration: 0.55, ease: "easeInOut" }}
              />
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className={`md:hidden relative p-2 flex flex-col justify-center items-center w-10 h-10 rounded-lg transition-colors ${
              scrolled ? "hover:bg-gray-100" : "hover:bg-white/20"
            }`}
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <motion.span
              className={`block w-6 h-0.5 origin-center transition-colors duration-300 ${scrolled ? "bg-gray-800" : "bg-white"}`}
              animate={menuOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.25 }}
            />
            <motion.span
              className={`block w-6 h-0.5 mt-1.5 transition-colors duration-300 ${scrolled ? "bg-gray-800" : "bg-white"}`}
              animate={menuOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.2 }}
            />
            <motion.span
              className={`block w-6 h-0.5 origin-center mt-1.5 transition-colors duration-300 ${scrolled ? "bg-gray-800" : "bg-white"}`}
              animate={menuOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.25 }}
            />
          </button>
        </div>
      </div>

      {/* Mobile slide-down drawer */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden overflow-hidden bg-white border-t border-gray-100 shadow-lg"
          >
            <div className="px-4 pt-3 pb-5 flex flex-col gap-1">
              {NAV_LINKS.map((link, i) => (
                <motion.div
                  key={link.label}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.07 + 0.05, duration: 0.3 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="block px-3 py-2.5 text-gray-800 font-medium rounded-lg hover:bg-purple-50 hover:text-[#6B21A8] transition-colors"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                <Link href="/login"  className="flex-1 text-center py-2.5 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">Login</Link>
                <Link href="/signup" className="flex-1 text-center py-2.5 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">Signup</Link>
                <Link href="/get-started" className="flex-1 text-center py-2.5 bg-[#6B21A8] text-white font-semibold rounded-full hover:bg-[#581c87] transition-colors">Get Started</Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
