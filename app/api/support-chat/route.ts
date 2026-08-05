import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSession } from "@/lib/session-store";
import { getClientDetails, getClientProducts, getClientDomains, openTicket, addTicketReply } from "@/lib/whmcs";
import { sendSmtpMail } from "@/lib/mailer";
import { pushAdminNotification } from "@/lib/admin-notifications";
import { markTicketChatOrigin } from "@/lib/ticket-meta";
import { config } from "@/lib/config";
import {
  getOrCreateChatSession, appendChatMessages, escalateChatSession,
  newMessage, type ChatMessage, type ChatSession,
} from "@/lib/chat-store";

const anthropic = new Anthropic();

const BASE_SYSTEM_PROMPT = `You are a helpful customer support assistant for The B.Shop Africa,
a web hosting and domain registration company serving Africa and beyond.

You help clients with:
- Domain registration and transfer questions
- Hosting plans (Business Starter Kit, etc.)
- Payment methods (MTN MoMo, Airtel Money, PayPal)
- Account and billing questions
- Technical support for cPanel
- Email setup
- DNS and nameserver questions

Company info:
- Website: bshopafrica.com
- Email: admin@bshopafrica.com
- WhatsApp: +250724684369
- Hosting plans start from $8/mo
- Free domain with first year of hosting
- Supports MTN MoMo, Airtel Money, PayPal payments
- Nameservers: ns1-ns4.mysecurecloudhost.com

Guidelines:
- Be friendly, professional and concise
- Answer in the same language the client uses
- If client is logged in, personalize responses
- For billing issues, direct to their dashboard
- For technical issues you cannot solve, offer to escalate to human support
- NEVER make up information you don't know
- If asked about specific account details, ask them to login to dashboard

When you cannot help or client requests human support, respond with:
[ESCALATE: reason for escalation]
at the end of your message.

Common solutions:
- Can't login: go to /forgot-password
- Payment failed: check balance, try again or use different method
- Domain not working: DNS propagation takes 24-48 hours
- cPanel access: go to dashboard → My Hosting → cPanel Login
- Invoice: go to dashboard → Invoices`;

const ESCALATE_RE = /\[ESCALATE:\s*([^\]]+)\]\s*$/i;

function toAnthropicRole(role: ChatMessage["role"]): "user" | "assistant" {
  return role === "client" ? "user" : "assistant";
}

async function buildPersonalizationBlock(clientId: number): Promise<string> {
  try {
    const [details, products, domains] = await Promise.all([
      getClientDetails(clientId),
      getClientProducts(clientId).catch(() => []),
      getClientDomains(clientId).catch(() => []),
    ]);
    const services = products.map(p => `${p.name} (${p.status}, domain: ${p.domain || "n/a"})`).join("; ") || "none";
    const domainNames = domains.map(d => `${d.domainname} (${d.status})`).join("; ") || "none";
    return `

The client is logged in. Greet them by first name.
- Name: ${details.firstname} ${details.lastname}
- Email: ${details.email}
- Active services: ${services}
- Domains: ${domainNames}
Use this to personalize your answer, but never invent details beyond what's listed here.`;
  } catch {
    return "";
  }
}

function transcriptText(messages: ChatMessage[]): string {
  return messages
    .map(m => `${m.role === "client" ? "Client" : m.role === "agent" ? `Agent (${m.agentName ?? "Staff"})` : "AI"}: ${m.content}`)
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
        reply: "Thanks — I've passed that along to our support team. They'll reply here shortly.",
        shouldEscalate: false,
        status: "escalated",
      });
    }

    let personalization = "";
    if (authedSession?.clientId) {
      personalization = await buildPersonalizationBlock(authedSession.clientId);
    }

    const history = session.messages.map(m => ({
      role: toAnthropicRole(m.role),
      content: m.content,
    }));

    const completion = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: BASE_SYSTEM_PROMPT + personalization,
      messages: history,
    });

    const textBlock = completion.content.find(b => b.type === "text");
    const rawReply = textBlock && "text" in textBlock ? textBlock.text : "Sorry, I couldn't generate a response — please try again.";

    const escalateMatch = rawReply.match(ESCALATE_RE);
    const shouldEscalate = Boolean(escalateMatch);
    const escalationReason = escalateMatch?.[1]?.trim();
    const displayReply = rawReply.replace(ESCALATE_RE, "").trim();

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
