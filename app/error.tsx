"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

export default function GlobalError({ error }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Technical details never reach the user — logged here for our own
    // debugging (visible in server logs / browser console only).
    console.error("[app/error]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <Image
        src="/The-Bshop-logo-REVAMPED-2025_white-logo-landscape-scaled.png"
        alt="The B.Shop"
        width={180}
        height={54}
        className="h-10 w-auto object-contain mb-10 bg-[#6B21A8] rounded-xl px-4 py-2"
      />

      <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-6">
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>

      <h1 className="text-2xl sm:text-3xl font-black text-black mb-3">Something went wrong</h1>
      <p className="text-gray-500 text-base max-w-md mb-8">
        We&apos;re sorry, an unexpected error occurred. Our team has been notified.
      </p>

      <div className="flex flex-wrap gap-3 justify-center">
        <Link href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#6B21A8] text-white font-bold rounded-full hover:bg-[#581c87] hover:shadow-[0_0_28px_rgba(107,33,168,0.4)] transition-all text-sm">
          Go Home
        </Link>
        <Link href="/contact"
          className="inline-flex items-center gap-2 px-6 py-3 border-2 border-gray-200 text-gray-700 font-bold rounded-full hover:border-[#6B21A8] hover:text-[#6B21A8] transition-colors text-sm">
          Open Support Ticket
        </Link>
      </div>
    </div>
  );
}
