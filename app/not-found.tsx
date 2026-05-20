import Link from "next/link";
import Image from "next/image";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Purple gradient top */}
      <div className="relative bg-gradient-to-br from-[#3b0764] via-[#6B21A8] to-[#4c1d95] pt-36 pb-20 px-4 text-center overflow-hidden">
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-20"
          style={{ background: "radial-gradient(ellipse, rgba(216,180,254,0.6) 0%, transparent 70%)", filter: "blur(60px)" }} />

        <div className="relative z-10 max-w-lg mx-auto">
          <p className="text-8xl sm:text-9xl font-black text-white/20 select-none leading-none mb-0">404</p>
          <h1 className="text-3xl sm:text-4xl font-black text-white mt-2 mb-3">Page Not Found</h1>
          <p className="text-white/60 text-base mb-8 max-w-sm mx-auto">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>

          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#6B21A8] font-bold rounded-full hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-shadow text-sm">
              <Home className="w-4 h-4" />Go Home
            </Link>
            <Link href="/domains"
              className="inline-flex items-center gap-2 px-6 py-3 border-2 border-white/40 text-white font-bold rounded-full hover:bg-white/10 transition-colors text-sm">
              <Search className="w-4 h-4" />Search Domains
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom card */}
      <div className="flex-1 bg-gray-50 flex items-start justify-center pt-12 px-4">
        <div className="max-w-md text-center">
          <div className="w-24 h-24 mx-auto mb-6 relative">
            <Image src="/logo.png" alt="The B.Shop" fill className="object-contain opacity-30" />
          </div>
          <p className="text-gray-500 text-sm">
            Need help? Visit our{" "}
            <Link href="/contact" className="text-[#6B21A8] font-semibold hover:underline">Contact page</Link>{" "}
            or explore our{" "}
            <Link href="/hosting" className="text-[#6B21A8] font-semibold hover:underline">Hosting plans</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
