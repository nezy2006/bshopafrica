"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import Image from "next/image";
import Link from "next/link";

const HEADLINE_WORDS = ["Your", "Digital", "Story", "Starts", "Here"];

/* ─── Magnetic button ────────────────────────────────────────────────────── */
function MagneticButton({
  href,
  variant,
  children,
}: {
  href: string;
  variant: "primary" | "secondary";
  children: React.ReactNode;
}) {
  const ref   = useRef<HTMLAnchorElement>(null);
  const [mob, setMob] = useState(false);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 280, damping: 18 });
  const sy = useSpring(my, { stiffness: 280, damping: 18 });

  useEffect(() => {
    const chk = () => setMob(window.innerWidth < 768);
    chk();
    window.addEventListener("resize", chk, { passive: true });
    return () => window.removeEventListener("resize", chk);
  }, []);

  const onMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (mob || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    mx.set((e.clientX - r.left - r.width  / 2) * 0.28);
    my.set((e.clientY - r.top  - r.height / 2) * 0.28);
  };
  const onLeave = () => { mx.set(0); my.set(0); };

  const base =
    "relative inline-flex items-center justify-center px-7 py-3.5 rounded-full font-semibold text-sm transition-all duration-300 overflow-hidden cursor-pointer select-none";

  return (
    <motion.a
      ref={ref}
      href={href}
      style={!mob ? { x: sx, y: sy } : {}}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={
        variant === "primary"
          ? `${base} bg-[#6B21A8] text-white hover:shadow-[0_0_32px_rgba(107,33,168,0.65)]`
          : `${base} border-2 border-[#6B21A8] text-[#6B21A8] hover:bg-[#6B21A8] hover:text-white hover:shadow-[0_0_20px_rgba(107,33,168,0.3)]`
      }
    >
      {children}
    </motion.a>
  );
}

/* ─── Hero ───────────────────────────────────────────────────────────────── */
export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const [mob, setMob] = useState(false);

  /* smooth parallax motion values */
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const spX  = useSpring(rawX, { stiffness: 40, damping: 18 });
  const spY  = useSpring(rawY, { stiffness: 40, damping: 18 });
  const imgX = useTransform(spX, [-0.5, 0.5], [18, -18]);
  const imgY = useTransform(spY, [-0.5, 0.5], [14, -14]);

  useEffect(() => {
    const chk = () => setMob(window.innerWidth < 768);
    chk();
    window.addEventListener("resize", chk, { passive: true });
    return () => window.removeEventListener("resize", chk);
  }, []);

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (mob || !sectionRef.current) return;
      const r = sectionRef.current.getBoundingClientRect();
      rawX.set((e.clientX - r.left) / r.width  - 0.5);
      rawY.set((e.clientY - r.top)  / r.height - 0.5);
    },
    [mob, rawX, rawY]
  );

  /* word-by-word stagger */
  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.14 } },
  };
  const wordVariants = {
    hidden:  { y: 70, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
    },
  };

  return (
    <section
      ref={sectionRef}
      onMouseMove={onMouseMove}
      /* pt accounts for 32 px bar + 64 px header */
      className="relative min-h-screen bg-white flex items-center overflow-hidden pt-24"
    >
      {/* subtle grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#6B21A8 1px,transparent 1px),linear-gradient(90deg,#6B21A8 1px,transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-10 lg:py-14">
        <div className="grid lg:grid-cols-2 gap-14 items-center">

          {/* ── Left ── */}
          <div className="space-y-8 text-center lg:text-left">
            <motion.h1
              className="text-5xl sm:text-6xl lg:text-7xl font-black text-black leading-[1.08] tracking-tight"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {HEADLINE_WORDS.map((w, i) => (
                <motion.span
                  key={i}
                  variants={wordVariants}
                  className="inline-block mr-[0.22em] last:mr-0"
                >
                  {w === "Story" ? (
                    <span className="text-[#6B21A8]">{w}</span>
                  ) : (
                    w
                  )}
                </motion.span>
              ))}
            </motion.h1>

            <motion.p
              className="text-lg sm:text-xl text-gray-500 max-w-md mx-auto lg:mx-0 leading-relaxed"
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.75, ease: "easeOut" }}
            >
              Professional web hosting built for African businesses — fast,
              reliable, and transparently priced. Your story deserves the
              best foundation.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.45, duration: 0.7, ease: "easeOut" }}
            >
              <MagneticButton href="#domain-search" variant="primary">
                Find Your Domain
              </MagneticButton>
              <MagneticButton href="/contact" variant="secondary">
                Need a Pro Design? Let&apos;s Talk.
              </MagneticButton>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              className="flex items-center gap-6 justify-center lg:justify-start text-sm text-gray-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.9, duration: 0.6 }}
            >
              <span className="flex items-center gap-1.5">
                <span className="text-green-500">✓</span> Free SSL
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-green-500">✓</span> 99.9% Uptime
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-green-500">✓</span> 24/7 Support
              </span>
            </motion.div>
          </div>

          {/* ── Right ── */}
          <motion.div
            className="relative flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* breathing glow orb */}
            <div
              className="orb-breathe absolute w-[380px] h-[380px] rounded-full"
              style={{
                background:
                  "radial-gradient(circle at center, rgba(107,33,168,0.45) 0%, rgba(107,33,168,0.15) 55%, transparent 75%)",
                filter: "blur(40px)",
              }}
            />

            {/* parallax image */}
            <motion.div
              style={!mob ? { x: imgX, y: imgY } : {}}
              className="relative z-10 will-change-transform"
            >
              <Image
                src="/The-BShop-Website-images-alone-04.png"
                alt="The B.Shop — web hosting for Africa"
                width={580}
                height={580}
                className="w-full max-w-[480px] lg:max-w-[560px] h-auto object-contain drop-shadow-2xl"
                priority
              />
            </motion.div>

            {/* floating badge — domains */}
            <motion.div
              className="absolute top-6 right-4 lg:right-0 bg-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3 z-20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.7, duration: 0.6 }}
            >
              <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-lg">🌍</div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Domains from</p>
                <p className="text-sm font-bold text-black">$8<span className="text-gray-400 font-normal">/yr</span></p>
              </div>
            </motion.div>

            {/* floating badge — speed */}
            <motion.div
              className="absolute bottom-8 left-0 lg:-left-4 bg-[#6B21A8] rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3 z-20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.0, duration: 0.6 }}
            >
              <span className="text-2xl">⚡</span>
              <div>
                <p className="text-xs text-purple-300 font-medium">Performance</p>
                <p className="text-sm font-bold text-white">99.9% Uptime</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white/80 to-transparent pointer-events-none" />
    </section>
  );
}
