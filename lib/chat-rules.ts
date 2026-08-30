// Rule-based fallback for the support chat widget. Used only when the Groq
// call itself fails (wrong model, rate limit, network) — see
// app/api/support-chat/route.ts. Keyword matching over the same topics the
// AI's system prompt covers, so a client never sees "offline" even when the
// LLM is unreachable.

interface Rule {
  keywords: string[];
  reply: string;
}

const RULES: Rule[] = [
  {
    keywords: ["domain", "register domain", "buy domain"],
    reply: "You can search and register a domain at bshopafrica.com/domains — type your domain name, and if it's available you can add it to your cart and check out with MTN, Airtel, or PayPal.",
  },
  {
    keywords: ["hosting", "web hosting", "host my site", "hosting plan"],
    reply: "Our hosting plans start from $8/month and include a free domain for the first year. Check them out at bshopafrica.com/hosting.",
  },
  {
    keywords: ["transfer"],
    reply: "To transfer a domain to us, get the EPP/authorization code from your current registrar, then go to bshopafrica.com/transfer and enter your domain name and code.",
  },
  {
    keywords: ["cpanel", "control panel"],
    reply: "Log in at bshopafrica.com/login, go to Dashboard → My Hosting, and click \"cPanel Login\" next to your hosting plan — you'll be logged in automatically.",
  },
  {
    keywords: ["nameserver", "dns", "ns1", "ns2"],
    reply: "You can update nameservers from Dashboard → My Domains → DNS. Our default nameservers are ns1.mysecurecloudhost.com and ns2.mysecurecloudhost.com. Changes take 24-48 hours to propagate.",
  },
  {
    keywords: ["renew", "renewal", "expiring", "expire"],
    reply: "You can renew a domain or hosting plan from Dashboard → My Domains or My Hosting — a \"Renew\" button appears when you're within 30 days of expiry.",
  },
  {
    keywords: ["invoice", "pay bill", "unpaid", "payment due"],
    reply: "You can view and pay any unpaid invoice from Dashboard → Invoices — click \"Pay Now\" and choose MTN, Airtel, or PayPal.",
  },
  {
    keywords: ["password", "reset password", "forgot password"],
    reply: "Go to bshopafrica.com/forgot-password, enter your email address, and follow the reset link we send you.",
  },
  {
    keywords: ["email", "smtp", "imap", "mail setup", "set up email"],
    reply: "For email client setup: SMTP host mail.yourdomain.com (port 465, SSL), IMAP host mail.yourdomain.com (port 993, SSL). Use your full email address and the password set in cPanel.",
  },
  {
    keywords: ["price", "pricing", "cost", "how much"],
    reply: "Hosting starts from $8/month with a free domain for the first year. Exact domain prices depend on the extension — search at bshopafrica.com/domains to see live pricing.",
  },
  {
    keywords: ["paypal", "mtn", "airtel", "mobile money", "momo", "payment method"],
    reply: "We accept MTN Mobile Money, Airtel Money, and PayPal at checkout.",
  },
  {
    keywords: ["ticket", "support ticket", "open a ticket", "human", "agent", "talk to someone"],
    reply: "I'll connect you with our human support team now — one moment.",
  },
  {
    keywords: ["hello", "hi", "hey"],
    reply: "Hi there! 👋 I'm here to help with hosting, domains, and your account. What can I help you with today?",
  },
];

const FALLBACK_REPLY =
  "Thanks for reaching out! I'm having trouble processing that right now, but our team can help — you can open a support ticket from your dashboard, or reach us on WhatsApp at +250724684369.";

/** Best-effort keyword match against the client's message. Never throws. */
export function getAutoResponse(message: string): string {
  const lower = message.toLowerCase();
  for (const rule of RULES) {
    if (rule.keywords.some(k => lower.includes(k))) return rule.reply;
  }
  return FALLBACK_REPLY;
}
