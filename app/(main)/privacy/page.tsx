import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy | The B.Shop Africa",
  description: "How The B.Shop Africa collects, uses, and protects your personal data across our hosting, domain, and payment services.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="July 2026">
      <LegalSection title="1. Information We Collect">
        <p>When you create an account, place an order, or contact support, we collect information such as your name, email address, phone number, billing address, and payment details necessary to process transactions. Payment card details are handled directly by PayPal and are never stored on our servers; mobile money payments are processed through PawaPay.</p>
        <p>We also automatically collect technical information — IP address, browser type, and usage data — via cookies and similar technologies to operate and improve the Services.</p>
      </LegalSection>

      <LegalSection title="2. How We Use Your Information">
        <p>We use your information to: provision and manage hosting and domain services; process payments and send invoices; respond to support requests; send service-related notifications (renewal reminders, security alerts); and, where you have opted in, send marketing communications.</p>
      </LegalSection>

      <LegalSection title="3. Cookies">
        <p>We use cookies to keep you signed in, remember your cart, and understand how visitors use our site. You can control cookies through your browser settings; disabling cookies may affect site functionality such as staying logged in.</p>
      </LegalSection>

      <LegalSection title="4. Sharing Your Information">
        <p>We share information with third parties only as necessary to deliver the Services: domain registries and registrar partners (for domain registration), WHMCS (our billing platform), PayPal and PawaPay (payment processing), and our hosting infrastructure providers. We do not sell your personal data to third parties.</p>
      </LegalSection>

      <LegalSection title="5. Data Retention">
        <p>We retain account and billing records for as long as your account is active and for a reasonable period afterward to comply with tax, accounting, and legal obligations.</p>
      </LegalSection>

      <LegalSection title="6. Your Rights">
        <p>Depending on your jurisdiction, you may have the right to access, correct, export, or request deletion of your personal data. Where applicable data protection law (including the EU/UK GDPR) grants you these rights, we will honor requests sent to <a href="mailto:admin@bshopafrica.com" className="text-[#6B21A8] font-semibold hover:underline">admin@bshopafrica.com</a> within a reasonable timeframe, subject to our legal and contractual obligations (e.g. retaining billing records).</p>
      </LegalSection>

      <LegalSection title="7. Security">
        <p>We apply reasonable technical and organizational measures — including encrypted connections, hashed passwords, and access controls — to protect your data. No system is completely secure, and we cannot guarantee absolute security of information transmitted over the internet.</p>
      </LegalSection>

      <LegalSection title="8. Children's Privacy">
        <p>Our Services are not directed to individuals under 18. We do not knowingly collect personal data from minors.</p>
      </LegalSection>

      <LegalSection title="9. Changes to This Policy">
        <p>We may update this Privacy Policy from time to time. Material changes will be reflected by an updated "Last updated" date at the top of this page.</p>
      </LegalSection>

      <LegalSection title="10. Contact">
        <p>For privacy questions or requests, contact <a href="mailto:admin@bshopafrica.com" className="text-[#6B21A8] font-semibold hover:underline">admin@bshopafrica.com</a>.</p>
      </LegalSection>
    </LegalPage>
  );
}
