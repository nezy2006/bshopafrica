import Hero from "@/components/Hero";
import DomainSearch from "@/components/DomainSearch";
import PricingCards from "@/components/PricingCards";
import Features from "@/components/Features";
import FAQ from "@/components/FAQ";

export default function Home() {
  return (
    <>
      <Hero />
      <DomainSearch />
      <PricingCards />
      <Features />
      <FAQ />
    </>
  );
}
