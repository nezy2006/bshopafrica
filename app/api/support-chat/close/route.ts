import { NextRequest, NextResponse } from "next/server";
import { addTicketNote } from "@/lib/whmcs";
import { getChatSession, closeChatSession } from "@/lib/chat-store";

export async function POST(req: NextRequest) {
  let body: { sessionId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  const sessionId = (body.sessionId ?? "").trim();
  if (!sessionId) return NextResponse.json({ error: "sessionId is required" }, { status: 400 });

  const session = await getChatSession(sessionId);
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  if (session.status === "escalated" && session.ticket_id) {
    await addTicketNote(session.ticket_id, "Chat Widget", "Client closed the chat").catch(() => {});
  }

  await closeChatSession(sessionId);
  return NextResponse.json({ success: true });
}
