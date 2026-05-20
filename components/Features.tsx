"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Zap, Tag, Handshake, Globe } from "lucide-react";

const FEATURES = [
  {
    Icon: Zap,
    color: "bg-yellow-50 text-yellow-600",
    title: "Effortless & Fast",
    desc: "LiteSpeed servers and optimised stacks mean your site loads in milliseconds — anywhere on the continent.",
  },
  {
    Icon: Tag,
    color: "bg-green-50 text-green-600",
    title: "Transparently Priced",
    desc: "One price, no surprises. What you see on our pricing page is exactly what you pay, forever.",
  },
  {
    Icon: Handshake,
    color: "bg-blue-50 text-blue-600",
    title: "Powered by Partnership",
    desc: "We grow when you grow. Our team of experts is invested in your success from day one.",
  },
  {
    Icon: Globe,
    color: "bg-purple-50 text-purple-600",
    title: "Proudly African",
    desc: "Built in Africa, for Africa. Local support, local understanding, global infrastructure.",
  },
];

export default function Features() {
  return (
    <section className="bg-white py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* ── Left ── */}
          <motion.div
            className="flex flex-col gap-10"
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
          >
            <div>
              <span className="inline-block px-4 py-1.5 bg-purple-100 text-[#6B21A8] text-xs font-semibold tracking-widest rounded-full uppercase mb-4">
                Why The B.Shop
              </span>
              <h2 className="text-4xl sm:text-5xl font-black text-black leading-tight">
                The Foundation for{" "}
                <span className="text-[#6B21A8]">Africa&apos;s</span>
                <br />
                Digital Future
              </h2>
              <p className="mt-5 text-gray-500 text-lg leading-relaxed max-w-md">
                We built The B.Shop because African businesses deserve world-class
                web infrastructure at fair prices. Your growth is our mission.
              </p>
            </div>

            {/* floating image */}
            <div className="relative flex justify-center lg:justify-start">
              <div
                className="absolute inset-0 rounded-3xl"
                style={{
                  background:
                    "radial-gradient(circle at 40% 60%, rgba(107,33,168,0.12) 0%, transparent 65%)",
                }}
              />
              <div className="animate-float">
                <Image
                  src="/vecteezy_handshake-people-3d-graphic_45686485.png"
                  alt="Partnership"
                  width={360}
                  height={360}
                  className="w-64 sm:w-80 h-auto object-contain drop-shadow-xl"
                />
              </div>
            </div>
          </motion.div>

          {/* ── Right: feature cards ── */}
          <div className="grid sm:grid-cols-2 gap-5">
            {FEATURES.map((feat, i) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{
                  delay: i * 0.12,
                  duration: 0.6,
                  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
                }}
                whileHover={{
                  y: -6,
                  boxShadow: "0 20px 50px rgba(107,33,168,0.14)",
                }}
                className="bg-white rounded-2xl p-4 border border-gray-100 shadow-md hover:border-purple-200 cursor-default"
              >
                <div className={`w-11 h-11 rounded-xl ${feat.color} flex items-center justify-center mb-3`}>
                  <feat.Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-black mb-2">
                  {feat.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {feat.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
