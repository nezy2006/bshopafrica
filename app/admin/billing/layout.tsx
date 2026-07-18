"use client";
import { usePathname, useRouter } from "next/navigation";
import { PageHeader } from "@/lib/admin-utils";

const TABS = [
  { href: "/admin/billing/invoices",     label: "Invoices" },
  { href: "/admin/billing/transactions", label: "Transactions" },
  { href: "/admin/billing/quotes",       label: "Quotes" },
];

export default function BillingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div>
      <PageHeader title="Billing & Payments" subtitle="Invoices, transactions, and quotes" />
      <div className="flex gap-2 mb-5">
        {TABS.map(t => (
          <button key={t.href} onClick={() => router.push(t.href)}
            className={`px-4 py-2 text-sm font-bold rounded-xl transition-colors ${pathname.startsWith(t.href) ? "bg-[#6B21A8] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
          >{t.label}</button>
        ))}
      </div>
      {children}
    </div>
  );
}
