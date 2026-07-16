import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Refund Policy | The B.Shop Africa",
  description: "The B.Shop Africa's 30-day money-back guarantee for hosting, and refund terms for domains and other services.",
};

export default function RefundPage() {
  return (
    <LegalPage title="Refund Policy" updated="July 2026">
      <LegalSection title="30-Day Money-Back Guarantee — Hosting">
        <p>If you're not satisfied with your web hosting plan, you may request a full refund within 30 days of your initial purchase. This guarantee applies to the first billing cycle of a new hosting account only, and covers the hosting plan fee — it does not cover add-ons already consumed (e.g. a domain registered as part of the same order, SSL certificates, or third-party licenses).</p>
        <p>To request a refund, contact <a href="mailto:admin@bshopafrica.com" className="text-[#6B21A8] font-semibold hover:underline">admin@bshopafrica.com</a> or open a billing ticket from your dashboard within the 30-day window. Approved refunds are issued to the original payment method (PayPal, MTN Mobile Money, or Airtel Money) within 5–10 business days.</p>
      </LegalSection>

      <LegalSection title="Renewals">
        <p>The money-back guarantee applies only to a hosting plan's first term. Renewal payments (monthly, quarterly, or annual) are non-refundable once the service period has begun, though we're happy to help you cancel auto-renewal for future terms.</p>
      </LegalSection>

      <LegalSection title="Domain Registrations">
        <p>Domain name registrations and transfers are non-refundable once processed, in line with registry policy — the registration fee is paid to the domain registry at the moment of registration and cannot be recovered. This applies even if the domain was purchased as part of a bundle with hosting.</p>
      </LegalSection>

      <LegalSection title="Mobile Money & PayPal Payments">
        <p>Refunds for mobile money payments (MTN, Airtel) are issued back to the originating mobile money account. Refunds for PayPal payments are issued to the original PayPal account or card used. Processing times depend on your provider and are typically 5–10 business days after approval.</p>
      </LegalSection>

      <LegalSection title="Accounts Suspended for Abuse">
        <p>No refund will be issued for services suspended or terminated due to a violation of our Terms of Service, including fraudulent activity, abuse, or non-payment.</p>
      </LegalSection>

      <LegalSection title="Questions">
        <p>If you're unsure whether your purchase qualifies for a refund, reach out to our support team before requesting a cancellation — we're happy to walk through the options with you.</p>
      </LegalSection>
    </LegalPage>
  );
}
