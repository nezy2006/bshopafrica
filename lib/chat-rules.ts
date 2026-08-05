interface ChatRule {
  keywords: string[];
  response: string;
}

const rules: ChatRule[] = [
  {
    keywords: ['login', 'cant login', 'cannot login', 'sign in', 'password', 'forgot'],
    response: "If you're having trouble logging in, try resetting your password at https://bshopafrica.com/forgot-password. If you've forgotten your password, enter your email and we'll send you a reset link."
  },
  {
    keywords: ['domain', 'register', 'buy domain', 'search domain'],
    response: "You can search and register domains at https://bshopafrica.com/domains. We offer competitive pricing with free domain on your first year of hosting!"
  },
  {
    keywords: ['hosting', 'cpanel', 'web hosting', 'plan', 'package'],
    response: "We offer hosting plans starting from $8/month. Visit https://bshopafrica.com/hosting to see all plans. Every plan includes a free domain for the first year!"
  },
  {
    keywords: ['payment', 'pay', 'mtn', 'airtel', 'mobile money', 'paypal'],
    response: "We accept MTN Mobile Money, Airtel Money, and PayPal. If your payment failed, please check your balance and try again. For help with payments, go to your dashboard at https://bshopafrica.com/dashboard"
  },
  {
    keywords: ['invoice', 'bill', 'receipt', 'unpaid'],
    response: "You can view and pay your invoices in your dashboard at https://bshopafrica.com/dashboard → Invoices. Click 'Pay Now' on any unpaid invoice."
  },
  {
    keywords: ['renew', 'renewal', 'expire', 'expiring'],
    response: "To renew your domain or hosting, go to https://bshopafrica.com/dashboard → My Domains or My Hosting. The Renew button appears when your service is within 30 days of expiry."
  },
  {
    keywords: ['transfer', 'move domain', 'domain transfer'],
    response: "You can transfer your domain to us at https://bshopafrica.com/transfer. You'll need the EPP/Authorization code from your current registrar."
  },
  {
    keywords: ['ticket', 'support', 'help', 'problem', 'issue', 'not working'],
    response: "For technical issues, please open a support ticket at https://bshopafrica.com/dashboard → Support Tickets. Our team will respond within 24 hours."
  },
  {
    keywords: ['dns', 'nameserver', 'name server', 'propagation'],
    response: "Our nameservers are: ns1.mysecurecloudhost.com, ns2.mysecurecloudhost.com, ns3.mysecurecloudhost.com, ns4.mysecurecloudhost.com. DNS propagation can take 24-48 hours after changes."
  },
  {
    keywords: ['email', 'smtp', 'imap', 'mail setup'],
    response: "To set up email, use these settings: SMTP/IMAP Host: mail.yourdomain.com, Port: 465 (SSL) for SMTP, 993 (SSL) for IMAP. Username: your full email address. You can create email accounts in cPanel."
  },
  {
    keywords: ['price', 'cost', 'how much', 'pricing'],
    response: "Our hosting plans start from $8/month. Domain registration starts from $10/year. Visit https://bshopafrica.com/hosting for full pricing details."
  },
  {
    keywords: ['cancel', 'refund', 'money back'],
    response: "For cancellation or refund requests, please open a support ticket at https://bshopafrica.com/dashboard → Support Tickets. Our team will assist you."
  },
  {
    keywords: ['contact', 'phone', 'whatsapp', 'call'],
    response: "You can reach us via:\n📧 Email: admin@bshopafrica.com\n💬 WhatsApp: +250724684369\n🎫 Support Ticket: https://bshopafrica.com/dashboard"
  },
  {
    keywords: ['website builder', 'weebly', 'builder'],
    response: "We offer website builder powered by Weebly. Visit https://bshopafrica.com/website-builder to see plans starting from Free!"
  },
  {
    keywords: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'],
    response: "Hello! 👋 Welcome to BShop Africa Support. How can I help you today? I can assist with domains, hosting, payments, account issues and more."
  },
  {
    keywords: ['thank', 'thanks', 'thank you'],
    response: "You're welcome! Is there anything else I can help you with? 😊"
  },
];

export function getAutoResponse(message: string): {
  response: string;
  shouldEscalate: boolean;
  escalationReason?: string;
} {
  const lowerMessage = message.toLowerCase();

  // Check each rule
  for (const rule of rules) {
    if (rule.keywords.some(keyword => lowerMessage.includes(keyword))) {
      return { response: rule.response, shouldEscalate: false };
    }
  }

  // No match - escalate to human
  return {
    response: "I'm not sure I have the right answer for that. Let me connect you with our support team who can help you better. Please wait while I create a support ticket for you...",
    shouldEscalate: true,
    escalationReason: message
  };
}
