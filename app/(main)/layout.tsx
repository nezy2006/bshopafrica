import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";
import WhatsAppButton from "@/components/WhatsAppButton";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 h-8 bg-black flex items-center justify-center px-4">
        <p className="text-sm font-semibold tracking-wide shimmer-text whitespace-nowrap">
          Get a FREE DOMAIN on Your First Year
        </p>
      </div>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CookieBanner />
      <WhatsAppButton />
    </>
  );
}
