"use client";

import Link from "next/link";
import Image from "next/image";
import { Home, Server, Globe, LayoutDashboard, Mail } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteShell";
import DomainSearch from "@/components/DomainSearch";

const QUICK_LINKS = [
  { label: "Home",      href: "/",          icon: Home },
  { label: "Hosting",   href: "/hosting",   icon: Server },
  { label: "Domains",   href: "/domains",   icon: Globe },
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Contact",   href: "/contact",   icon: Mail },
];

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main className="flex-1" style={{ paddingTop: "var(--announce-h, 0px)" }}>
        {/* Purple gradient hero */}
        <div className="relative bg-gradient-to-br from-[#3b0764] via-[#6B21A8] to-[#4c1d95] pt-32 pb-20 px-4 text-center overflow-hidden">
          <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-20"
            style={{ background: "radial-gradient(ellipse, rgba(216,180,254,0.6) 0%, transparent 70%)", filter: "blur(60px)" }} />

          <div className="relative z-10 max-w-lg mx-auto">
            <Image
              src="/The-Bshop-logo-REVAMPED-2025_white-logo-landscape-scaled.png"
              alt="The B.Shop"
              width={180}
              height={54}
              className="h-10 w-auto object-contain mx-auto mb-8"
            />
            <p className="text-8xl sm:text-9xl font-black text-white leading-none mb-2">404</p>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-2 mb-3">Oops! Page not found</h1>
            <p className="text-white/70 text-base mb-2 max-w-sm mx-auto">
              The page you are looking for does not exist or has been moved.
            </p>
          </div>
        </div>

        {/* Domain search — same widget as the homepage */}
        <DomainSearch />

        {/* Quick links */}
        <div className="bg-white pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-5">Or jump straight to</p>
            <div className="flex flex-wrap gap-3 justify-center">
              {QUICK_LINKS.map(({ label, href, icon: Icon }) => (
                <Link key={label} href={href}
                  className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-gray-200 text-gray-700 font-semibold rounded-full hover:border-[#6B21A8] hover:text-[#6B21A8] transition-colors text-sm">
                  <Icon className="w-4 h-4" />{label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
