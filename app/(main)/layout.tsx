import { SiteHeader, SiteFooter, SiteExtras } from "@/components/SiteShell";
import PageTransition from "@/components/PageTransition";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <PageTransition>{children}</PageTransition>
      </main>
      <SiteFooter />
      <SiteExtras />
    </>
  );
}
