"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";
import ScrollProgress from "@/components/ScrollProgress";
import AnnouncementBanner from "@/components/AnnouncementBanner";

function isDashboard(pathname: string) {
  return pathname.startsWith("/dashboard");
}

export function SiteHeader() {
  const pathname = usePathname();
  if (isDashboard(pathname)) return null;
  return (
    <>
      <AnnouncementBanner />
      <div className="fixed left-0 right-0 z-50 h-8 bg-black flex items-center justify-center px-4"
        style={{ top: "var(--announce-h, 0px)" }}>
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
    </>
  );
}
