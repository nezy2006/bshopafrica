"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";
import WhatsAppButton from "@/components/WhatsAppButton";
import ScrollProgress from "@/components/ScrollProgress";

function isDashboard(pathname: string) {
  return pathname.startsWith("/dashboard");
}

export function SiteHeader() {
  const pathname = usePathname();
  if (isDashboard(pathname)) return null;
  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 h-8 bg-black flex items-center justify-center px-4">
        <p className="text-sm font-semibold tracking-wide shimmer-text whitespace-nowrap">
          Get a FREE DOMAIN on Your First Year
        </p>
      </div>
      <Header />
    </>
  );
}

export function SiteFooter() {
  const pathname = usePathname();
  if (isDashboard(pathname)) return null;
  return <Footer />;
}

export function SiteExtras() {
  const pathname = usePathname();
  if (isDashboard(pathname)) return null;
  return (
    <>
      <ScrollProgress />
      <CookieBanner />
      <WhatsAppButton />
    </>
  );
}
