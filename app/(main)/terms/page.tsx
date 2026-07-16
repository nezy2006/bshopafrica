import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service | The B.Shop Africa",
  description: "The terms and conditions governing domain registration, web hosting, and payment services provided by The B.Shop Africa.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="July 2026">
      <LegalSection title="1. Agreement to Terms">
        <p>These Terms of Service ("Terms") govern your access to and use of domain registration, web hosting, and related services ("Services") provided by The B.Shop Africa ("B.Shop", "we", "us"). By creating an account, placing an order, or using our Services, you agree to be bound by these Terms.</p>
      </LegalSection>

      <LegalSection title="2. Account Registration">
        <p>You must provide accurate, current, and complete information when creating an account. You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account.</p>
      </LegalSection>

      <LegalSection title="3. Hosting Services">
        <p>Hosting plans are provisioned on a subscription basis and billed according to the billing cycle selected at checkout (monthly, quarterly, or annually). We reserve the right to suspend or terminate hosting accounts that violate our Acceptable Use Policy, including but not limited to: distribution of malware, spam, illegal content, or activity that threatens the stability of shared infrastructure.</p>
        <p>You are responsible for maintaining backups of your own content. While we take reasonable measures to protect data integrity, B.Shop is not liable for data loss arising from hardware failure, user error, or events outside our control.</p>
      </LegalSection>

      <LegalSection title="4. Domain Registration">
        <p>Domain registrations are processed through our accredited registrar partners and are subject to the policies of the relevant domain registry (e.g. ICANN for gTLDs). Domain names are registered in your name as the registrant unless otherwise specified. It is your responsibility to renew domains before their expiry date — expired domains may enter a redemption period with additional recovery fees, or may be released for registration by others.</p>
      </LegalSection>

      <LegalSection title="5. Payments">
        <p>We accept payment via PayPal (including major debit and credit cards through PayPal's checkout), MTN Mobile Money, and Airtel Money. All prices are displayed in USD unless otherwise noted; mobile money charges are converted to local currency at the prevailing rate shown at checkout.</p>
        <p>Invoices are due on the date specified in your account. Services may be suspended for non-payment after the grace period noted on the invoice. You are responsible for any fees, taxes, or currency conversion charges applied by your payment provider.</p>
      </LegalSection>

      <LegalSection title="6. Refunds">
        <p>Refund eligibility is governed by our <a href="/refund" className="text-[#6B21A8] font-semibold hover:underline">Refund Policy</a>, which forms part of these Terms.</p>
      </LegalSection>

      <LegalSection title="7. Service Modifications">
        <p>We may modify, suspend, or discontinue any part of the Services at any time. We will make reasonable efforts to notify you in advance of changes that materially affect your use of paid Services.</p>
      </LegalSection>

      <LegalSection title="8. Limitation of Liability">
        <p>To the maximum extent permitted by law, B.Shop's total liability arising from these Terms or your use of the Services is limited to the amount you paid for the Service giving rise to the claim in the 12 months preceding the claim. We are not liable for indirect, incidental, or consequential damages.</p>
      </LegalSection>

      <LegalSection title="9. Termination">
        <p>You may cancel your Services at any time from your dashboard or by contacting support. We may suspend or terminate your account for violation of these Terms, non-payment, or fraudulent activity.</p>
      </LegalSection>

      <LegalSection title="10. Contact">
        <p>Questions about these Terms can be sent to <a href="mailto:admin@bshopafrica.com" className="text-[#6B21A8] font-semibold hover:underline">admin@bshopafrica.com</a>.</p>
      </LegalSection>
    </LegalPage>
  );
}
