"use client";

import React from "react";

/* ─── Card wrapper ───────────────────────────────────────────────────────── */
interface PaymentOptionCardProps {
  id:       string;
  selected: boolean;
  onSelect: () => void;
  logo:     React.ReactNode;
  title:    string;
  subtitle: string;
}

export function PaymentOptionCard({ id, selected, onSelect, logo, title, subtitle }: PaymentOptionCardProps) {
  return (
    <button
      type="button"
      key={id}
      onClick={onSelect}
      className={`relative flex flex-col items-center gap-2 p-3.5 rounded-2xl border-2 text-center w-full transition-all duration-200 ${
        selected
          ? "border-[#6B21A8] bg-purple-50 shadow-[0_0_0_4px_rgba(107,33,168,0.08)]"
          : "border-gray-200 hover:border-gray-300 bg-white"
      }`}
    >
      {selected && (
        <span className="absolute top-2 right-2 w-4 h-4 bg-[#6B21A8] rounded-full flex items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 8 6" fill="none" className="w-2.5 h-2.5">
            <path d="M1 3l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
      <div className="w-full flex justify-center">{logo}</div>
      <p className="font-bold text-xs text-gray-800 leading-tight">{title}</p>
      <p className="text-[11px] text-gray-400 leading-snug">{subtitle}</p>
    </button>
  );
}

/* ─── PayPal logo ─────────────────────────────────────────────────────────── */
export function PayPalLogo() {
  return (
    <div className="flex items-center justify-center gap-1 h-8">
      <svg viewBox="0 0 24 24" className="h-6 w-auto" fill="none">
        {/* P mark */}
        <rect width="24" height="24" rx="4" fill="#003087" />
        <text x="4" y="17" fontFamily="Arial" fontWeight="bold" fontSize="14" fill="#009CDE">P</text>
        <text x="10" y="17" fontFamily="Arial" fontWeight="bold" fontSize="14" fill="#ffffff">P</text>
      </svg>
      <span className="font-black text-[#003087] text-sm tracking-tight">PayPal</span>
    </div>
  );
}

export function PayPalWordmark() {
  return (
    <div className="flex items-center justify-center gap-0.5">
      <span className="font-black text-[#003087] text-xl tracking-tight">Pay</span>
      <span className="font-black text-[#009CDE] text-xl tracking-tight">Pal</span>
    </div>
  );
}

/* ─── Card logos (Visa + Mastercard) ─────────────────────────────────────── */
export function CardLogo() {
  return (
    <div className="flex items-center justify-center gap-2 h-8">
      {/* Visa */}
      <div className="bg-[#1A1F71] rounded px-1.5 py-0.5">
        <span className="text-white font-black text-[10px] italic tracking-widest">VISA</span>
      </div>
      {/* Mastercard */}
      <div className="flex items-center">
        <div className="w-5 h-5 rounded-full bg-[#EB001B] opacity-90" />
        <div className="w-5 h-5 rounded-full bg-[#F79E1B] -ml-2.5 opacity-90" />
      </div>
    </div>
  );
}

/* ─── MTN logo ────────────────────────────────────────────────────────────── */
export function MtnLogo() {
  return (
    <div className="flex items-center justify-center h-8">
      <div className="bg-[#FFC107] rounded-lg px-3 py-1">
        <span className="font-black text-black text-sm tracking-wider">MTN</span>
      </div>
    </div>
  );
}

/* ─── Airtel logo ─────────────────────────────────────────────────────────── */
export function AirtelLogo() {
  return (
    <div className="flex items-center justify-center h-8">
      <div className="bg-[#FF0000] rounded-lg px-2.5 py-1">
        <span className="font-black text-white text-sm tracking-wide">airtel</span>
      </div>
    </div>
  );
}
