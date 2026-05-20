import { Lock, RotateCcw, Zap, Headphones } from "lucide-react";

const BADGES = [
  { icon: Lock,       label: "SSL Secured",        color: "text-green-600  bg-green-50  border-green-200"  },
  { icon: RotateCcw,  label: "30-Day Money Back",   color: "text-blue-600   bg-blue-50   border-blue-200"   },
  { icon: Zap,        label: "99.9% Uptime",        color: "text-purple-600 bg-purple-50 border-purple-200" },
  { icon: Headphones, label: "24/7 Support",        color: "text-orange-600 bg-orange-50 border-orange-200" },
];

export default function TrustBadges({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-wrap justify-center gap-3 ${className}`}>
      {BADGES.map(({ icon: Icon, label, color }) => (
        <div key={label}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium ${color}`}>
          <Icon className="w-4 h-4" />
          {label}
        </div>
      ))}
    </div>
  );
}
