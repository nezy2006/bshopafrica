import { SiteHeader, SiteFooter, SiteExtras } from "@/components/SiteShell";
import PageTransition from "@/components/PageTransition";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {/* Extra top padding compensates for the announcement banner (if enabled)
          shifting the fixed header stack down — see components/AnnouncementBanner.tsx.
          Individual pages' own top padding is unaffected; this just adds to it. */}
      <main className="flex-1" style={{ paddingTop: "var(--announce-h, 0px)" }}>
        <PageTransition>{children}</PageTransition>
      </main>
      <SiteFooter />
      <SiteExtras />
    </>
  );
}
