import { SiteHeader, SiteFooter, SiteExtras } from "@/components/SiteShell";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <SiteExtras />
    </>
  );
}
