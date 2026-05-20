import Hero from "@/components/Hero";
import DomainSearch from "@/components/DomainSearch";
import TrustBadges from "@/components/TrustBadges";
import PricingCards from "@/components/PricingCards";
import Features from "@/components/Features";
import FAQ from "@/components/FAQ";
import AIBuilderTeaser from "@/components/AIBuilderTeaser";
import TawkChat from "@/components/TawkChat";

export default function Home() {
  return (
    <>
      <Hero />
      <div className="bg-white py-6 border-b border-gray-100">
        <TrustBadges />
      </div>
      <DomainSearch />
      <PricingCards />
      <Features />
      <AIBuilderTeaser />
      <FAQ />
      <TawkChat />
    </>
  );
}
