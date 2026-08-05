import { NextRequest, NextResponse } from "next/server";
import { getTicket } from "@/lib/whmcs";
import { getChatSession, syncAgentReplies, closeChatSession, newMessage } from "@/lib/chat-store";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) return NextResponse.json({ error: "sessionId is required" }, { status: 400 });

  const session = await getChatSession(sessionId);
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  if (session.status !== "escalated" || !session.ticket_id) {
    return NextResponse.json({ status: session.status, newMessages: [] });
  }

  try {
    const ticket = await getTicket(session.ticket_id);
    const staffReplies = ticket.replies.filter(r => r.type === "staff");

    const unseen = staffReplies.slice(session.last_synced_reply_count);
    const newMessages = unseen.map(r => newMessage("agent", r.message, r.name || r.admin || "Support Team"));

    if (newMessages.length > 0) {
      await syncAgentReplies(sessionId, newMessages, staffReplies.length);
    }

    if (ticket.status === "Closed") {
      await closeChatSession(sessionId);
    }

    return NextResponse.json({
      status: ticket.status === "Closed" ? "closed" : "escalated",
      newMessages: newMessages.map(m => ({ id: m.id, role: m.role, content: m.content, ts: m.ts, agentName: m.agentName })),
    });
  } catch (err) {
    console.error("[/api/support-chat/status]", err instanceof Error ? err.message : err);
    return NextResponse.json({ status: session.status, newMessages: [] });
  }
}
