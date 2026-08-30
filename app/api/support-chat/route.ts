import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { getSession } from "@/lib/session-store";
import { openTicket, addTicketReply } from "@/lib/whmcs";
import { sendSmtpMail } from "@/lib/mailer";
import { pushAdminNotification } from "@/lib/admin-notifications";
import { markTicketChatOrigin } from "@/lib/ticket-meta";
import { config } from "@/lib/config";
import {
  getOrCreateChatSession, appendChatMessages, escalateChatSession,
  newMessage, type ChatMessage, type ChatSession,
} from "@/lib/chat-store";
import { getAutoResponse } from "@/lib/chat-rules";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const HISTORY_LIMIT = 10;

const systemPrompt = `You are a friendly and knowledgeable customer support agent for The B.Shop Africa, a web hosting and domain registration company serving Africa and beyond.

COMPANY INFO:
- Website: bshopafrica.com
- Email: admin@bshopafrica.com
- WhatsApp: +250724684369
- Hosting plans start from $8/month
- Free domain with first year of hosting
- Payments: MTN MoMo, Airtel Money, PayPal

SITE PAGES AND WHAT THEY DO:
- bshopafrica.com → Homepage
- bshopafrica.com/domains → Search and buy domains
- bshopafrica.com/hosting → View and buy hosting plans
- bshopafrica.com/transfer → Transfer domain from another registrar
- bshopafrica.com/cart → Shopping cart
- bshopafrica.com/checkout → Payment page (MTN, Airtel, PayPal)
- bshopafrica.com/login → Client login
- bshopafrica.com/signup → Create new account
- bshopafrica.com/forgot-password → Reset password
- bshopafrica.com/dashboard → Client dashboard (after login)
- bshopafrica.com/dashboard → My Domains (manage domains)
- bshopafrica.com/dashboard → My Hosting (manage hosting)
- bshopafrica.com/dashboard → Invoices (view and pay bills)
- bshopafrica.com/dashboard → Support Tickets (get help)
- bshopafrica.com/dashboard → Account Settings (change password)
- bshopafrica.com/about → About us
- bshopafrica.com/contact → Contact us

HOW TO DO COMMON TASKS:

Register a domain:
1. Go to bshopafrica.com/domains
2. Type your domain name and search
3. If available, click Add to Cart
4. Go to checkout and pay with MTN, Airtel or PayPal

Buy hosting:
1. Go to bshopafrica.com/hosting
2. Choose a plan and click Get Started
3. Add a free domain in cart
4. Checkout and pay

Login to cPanel:
1. Login at bshopafrica.com/login
2. Go to dashboard → My Hosting
3. Click "cPanel Login" button next to your hosting
4. You are automatically logged in to cPanel

Change nameservers:
1. Login at bshopafrica.com/login
2. Go to dashboard → My Domains
3. Click "DNS" button next to your domain
4. Update the nameservers in the popup
5. Changes take 24-48 hours to propagate

Renew domain or hosting:
1. Login at bshopafrica.com/login
2. Go to dashboard → My Domains or My Hosting
3. Click "Renew" button (appears when within 30 days of expiry)
4. Pay with MTN, Airtel or PayPal

Pay an invoice:
1. Login at bshopafrica.com/login
2. Go to dashboard → Invoices
3. Find unpaid invoice and click "Pay Now"
4. Choose payment method and complete payment

Reset password:
1. Go to bshopafrica.com/forgot-password
2. Enter your email address
3. Check email for reset link
4. Click link and enter new password

Transfer a domain to us:
1. Get EPP/Authorization code from current registrar
2. Go to bshopafrica.com/transfer
3. Enter domain name and EPP code
4. Complete payment

Set up email:
- SMTP Host: mail.yourdomain.com, Port: 465 (SSL)
- IMAP Host: mail.yourdomain.com, Port: 993 (SSL)
- Username: your full email address
- Password: as set in cPanel

Open support ticket:
1. Login at bshopafrica.com/login
2. Go to dashboard → Support Tickets
3. Click "Open New Ticket"
4. Describe your issue and submit

NAMESERVERS:
ns1.mysecurecloudhost.com
ns2.mysecurecloudhost.com
ns3.mysecurecloudhost.com
ns4.mysecurecloudhost.com

HOSTING PLANS:
- Business Starter Kit: includes hosting + free domain
- All plans include cPanel, email accounts, SSL certificate
- Plans billed monthly or annually

PAYMENT METHODS:
- MTN Mobile Money (Rwanda and other African countries)
- Airtel Money (Rwanda and other African countries)
- PayPal (worldwide)

GUIDELINES:
- Be friendly, helpful and concise
- Guide clients step by step through our site
- Always give direct links when helpful (e.g. bshopafrica.com/dashboard)
- If client is not logged in and needs account info, ask them to login first
- For complex technical issues you cannot solve, say you will escalate to human support
- Keep responses short and clear - this is a chat widget not an essay
- Answer in the same language the client uses
- NEVER make up information you don't know

When you truly cannot help or client explicitly asks for human support, end your response with exactly:
[ESCALATE: brief reason]`;

function toGroqRole(role: ChatMessage["role"]): "user" | "assistant" {
  return role === "client" ? "user" : "assistant";
}

function transcriptText(messages: ChatMessage[]): string {
  return messages
    .map(m => `${m.role === "client" ? "Client" : m.role === "agent" ? `Agent (${m.agentName ?? "Staff"})` : "Support"}: ${m.content}`)
    .join("\n\n");
}

async function escalate(session: ChatSession, reason: string, messages: ChatMessage[]) {
  const clientId = session.client_id ?? 0;
  const email = session.client_email ?? undefined;
  const name = session.client_name ?? undefined;

  const { ticketId, tid } = await openTicket({
    clientId,
    subject: `Chat Escalation: ${reason}`,
    message: `Escalation reason: ${reason}\n\n--- Chat transcript ---\n${transcriptText(messages)}`,
    deptId: 1,
    priority: "Medium",
    name: !clientId ? name : undefined,
    email: !clientId ? email : undefined,
  });

  await escalateChatSession(session.id, ticketId);
  await markTicketChatOrigin(ticketId).catch(() => {});
  await pushAdminNotification(
    "new_ticket",
    `Chat Escalation: ${reason}`,
    `From ${name || email || "a website visitor"}`,
    `/admin/tickets/${ticketId}`
  ).catch(() => {});

  const adminLink = `${config.appUrl}/admin/tickets/${ticketId}`;
  const emailBody = `A chat session was escalated to human support.

Client: ${name || "Unknown"} ${email ? `<${email}>` : "(not logged in)"}
Escalation reason: ${reason}
WHMCS ticket: ${tid}

--- Full chat transcript ---
${transcriptText(messages)}

View in admin dashboard: ${adminLink}

Reply to this email to respond to client.`;
  await sendSmtpMail(
    "admin@bshopafrica.com",
    "🚨 Chat Escalation - Action Required",
    emailBody
  ).catch(() => {});

  return { ticketId, tid };
}

export async function POST(req: NextRequest) {
  let body: { message?: string; sessionId?: string; email?: string; name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  const message = (body.message ?? "").trim();
  const sessionId = (body.sessionId ?? "").trim();
  if (!message || !sessionId) {
    return NextResponse.json({ error: "message and sessionId are required" }, { status: 400 });
  }

  // clientId is never trusted from the request body — resolved from the
  // server-side session bound to the x-session-token header, same pattern
  // as /api/whmcs. Otherwise the widget is talking to a guest identified by
  // the email they typed in.
  const authedSession = getSession(req.headers.get("x-session-token"));

  try {
    let session = await getOrCreateChatSession(sessionId, {
      clientId: authedSession?.clientId ?? null,
      clientEmail: authedSession?.email ?? body.email ?? null,
      clientName: body.name ?? null,
    });

    const clientMsg = newMessage("client", message);
    await appendChatMessages(sessionId, [clientMsg]);
    session = { ...session, messages: [...session.messages, clientMsg] };

    // Once escalated, the client is talking to a human — forward their
    // message onto the WHMCS ticket instead of calling the AI again.
    if (session.status === "escalated" && session.ticket_id) {
      await addTicketReply(session.ticket_id, session.client_id ?? 0, message).catch(() => {});
      return NextResponse.json({
        reply: "Please wait, a support agent will be with you shortly.",
        shouldEscalate: false,
        status: "escalated",
      });
    }

    // Last 10 prior turns (excluding the message just appended, which is
    // sent as the final user turn below) so the model remembers context.
    const conversationHistory = session.messages
      .slice(0, -1)
      .slice(-HISTORY_LIMIT)
      .map(m => ({ role: toGroqRole(m.role), content: m.content }));

    // If Groq is down, rate-limited, or the model changes out from under us,
    // fall back to rule-based responses rather than surfacing an error —
    // the client should never see "offline". The failure is logged
    // server-side only.
    let reply: string;
    try {
      const completion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          ...conversationHistory,
          { role: "user", content: message },
        ],
        model: "llama3-70b-8192",
        max_tokens: 500,
        temperature: 0.7,
      });
      reply = completion.choices[0]?.message?.content ||
        "I'm having trouble responding right now. Please try again or open a support ticket.";
    } catch (groqErr) {
      console.error("[/api/support-chat] Groq call failed, using rule-based fallback:", groqErr instanceof Error ? groqErr.message : groqErr);
      reply = getAutoResponse(message);
    }

    const shouldEscalate = reply.includes("[ESCALATE:");
    const escalationReason = shouldEscalate
      ? reply.match(/\[ESCALATE: (.*?)\]/)?.[1] || message
      : undefined;
    const displayReply = reply.replace(/\[ESCALATE:.*?\]/g, "").trim();

    const aiMsg = newMessage("ai", displayReply);
    await appendChatMessages(sessionId, [aiMsg]);

    if (shouldEscalate && escalationReason) {
      const allMessages = [...session.messages, aiMsg];
      await escalate(session, escalationReason, allMessages);
      return NextResponse.json({
        reply: displayReply || "You've been connected to our support team. A team member will respond shortly. You can also check your support tickets in your dashboard.",
        shouldEscalate: true,
        escalationReason,
        status: "escalated",
      });
    }

    return NextResponse.json({ reply: displayReply, shouldEscalate: false, status: "active" });
  } catch (err) {
    console.error("[/api/support-chat]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
