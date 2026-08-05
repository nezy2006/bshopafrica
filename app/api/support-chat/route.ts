import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session-store";
import { openTicket, addTicketReply } from "@/lib/whmcs";
import { sendSmtpMail } from "@/lib/mailer";
import { pushAdminNotification } from "@/lib/admin-notifications";
import { markTicketChatOrigin } from "@/lib/ticket-meta";
import { config } from "@/lib/config";
import { getAutoResponse } from "@/lib/chat-rules";
import {
  getOrCreateChatSession, appendChatMessages, escalateChatSession,
  newMessage, type ChatMessage, type ChatSession,
} from "@/lib/chat-store";

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
    // message onto the WHMCS ticket instead of running it through the rules.
    if (session.status === "escalated" && session.ticket_id) {
      await addTicketReply(session.ticket_id, session.client_id ?? 0, message).catch(() => {});
      return NextResponse.json({
        reply: "Thanks — I've passed that along to our support team. They'll reply here shortly.",
        shouldEscalate: false,
        status: "escalated",
      });
    }

    const { response: displayReply, shouldEscalate, escalationReason } = getAutoResponse(message);

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
