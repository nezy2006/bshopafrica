/* SVG-based payment brand cards — 60 × 38 px each */
export function VisaCard() {
  return (
    <div className="w-[60px] h-[38px] rounded-md flex items-center justify-center" style={{ background: "#1A1F71" }}>
      <svg viewBox="0 0 60 24" className="w-[44px]" fill="none">
        <text x="2" y="20" fontFamily="Arial, sans-serif" fontWeight="900" fontStyle="italic" fontSize="22" fill="white" letterSpacing="-1">VISA</text>
      </svg>
    </div>
  );
}

export function MastercardCard() {
  return (
    <div className="w-[60px] h-[38px] rounded-md border border-gray-200 bg-white flex flex-col items-center justify-center gap-0.5">
      <div className="flex">
        <div className="w-[22px] h-[14px] rounded-full" style={{ background: "#EB001B", opacity: 0.9 }} />
        <div className="w-[22px] h-[14px] rounded-full -ml-[11px]" style={{ background: "#F79E1B", opacity: 0.9 }} />
      </div>
      <span style={{ fontSize: "6px", fontFamily: "Arial", color: "#333", letterSpacing: "0.02em" }}>mastercard</span>
    </div>
  );
}

export function PaypalCard() {
  return (
    <div className="w-[60px] h-[38px] rounded-md border border-gray-200 bg-white flex items-center justify-center">
      <svg viewBox="0 0 50 18" className="w-[44px]" fill="none">
        <text x="0" y="14" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="14" fill="#003087">Pay</text>
        <text x="25" y="14" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="14" fill="#009CDE">Pal</text>
      </svg>
    </div>
  );
}

export function PawapayCard() {
  return (
    <div className="w-[60px] h-[38px] rounded-md flex items-center justify-center gap-1" style={{ background: "#00C853" }}>
      <svg viewBox="0 0 10 16" className="w-2 h-3" fill="white">
        <rect x="1" y="0" width="8" height="12" rx="2" stroke="white" strokeWidth="1.5" fill="none"/>
        <rect x="3" y="13" width="4" height="2" rx="1" fill="white"/>
      </svg>
      <div className="text-white font-bold leading-none" style={{ fontSize: "9px", letterSpacing: "-0.02em" }}>
        <span>pawa</span><span style={{ opacity: 0.8 }}>pay</span>
      </div>
    </div>
  );
}

export function PayoneerCard() {
  return (
    <div className="w-[60px] h-[38px] rounded-md border border-gray-200 bg-white flex items-center justify-center">
      <svg viewBox="0 0 58 14" className="w-[52px]" fill="none">
        <text x="0" y="11" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="10" fill="#FF4800" letterSpacing="-0.3">Payoneer</text>
      </svg>
    </div>
  );
}

export function PaymentIconsRow({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      <VisaCard />
      <MastercardCard />
      <PaypalCard />
      <PawapayCard />
      <PayoneerCard />
    </div>
  );
}
