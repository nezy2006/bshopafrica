import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isAdminUnauthorized, logAdminActivity, getRequestIp, listAdminUsers } from "@/lib/admin-auth";
import { getTicketMeta, assignTicket, setTicketEscalated } from "@/lib/ticket-meta";
import {
  getTicket, addAdminTicketReply, addTicketNote, closeTicket, reopenTicket,
  updateTicketPriority, updateTicketDepartment, getTicketDepartments,
} from "@/lib/whmcs";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req, "tickets");
  if (isAdminUnauthorized(admin)) return admin;

  const ticketId = Number((await params).id);
  const [ticket, meta, departments, admins] = await Promise.all([
    getTicket(ticketId),
    getTicketMeta(ticketId),
    getTicketDepartments().catch(() => []),
    listAdminUsers().catch(() => []),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      ticket, meta, departments,
      assignableAdmins: admins.filter(a => a.is_active).map(a => ({ id: a.id, name: a.name })),
    },
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req, "tickets");
  if (isAdminUnauthorized(admin)) return admin;

  const ticketId = Number((await params).id);
  const ip = getRequestIp(req);
  const body = (await req.json()) as Record<string, unknown>;
  const action = String(body.action ?? "");

  switch (action) {
    case "reply": {
      const message = String(body.message ?? "").trim();
      if (!message) return NextResponse.json({ success: false, error: "Message is required" }, { status: 400 });
      await addAdminTicketReply(ticketId, admin.name, message);
      await logAdminActivity(admin.id, "reply_ticket", `ticketId=${ticketId}`, ip);
      break;
    }
    case "note": {
      const message = String(body.message ?? "").trim();
      if (!message) return NextResponse.json({ success: false, error: "Note is required" }, { status: 400 });
      await addTicketNote(ticketId, admin.name, message);
      await logAdminActivity(admin.id, "add_ticket_note", `ticketId=${ticketId}`, ip);
      break;
    }
    case "assign": {
      const adminId = body.adminId === null || body.adminId === undefined ? null : Number(body.adminId);
      await assignTicket(ticketId, adminId);
      await logAdminActivity(admin.id, "assign_ticket", `ticketId=${ticketId} to=${adminId ?? "unassigned"}`, ip);
      break;
    }
    case "escalate": {
      await updateTicketPriority(ticketId, "High");
      await setTicketEscalated(ticketId, true);
      await logAdminActivity(admin.id, "escalate_ticket", `ticketId=${ticketId}`, ip);
      break;
    }
    case "close": {
      await closeTicket(ticketId);
      await logAdminActivity(admin.id, "close_ticket", `ticketId=${ticketId}`, ip);
      break;
    }
    case "reopen": {
      await reopenTicket(ticketId);
      await logAdminActivity(admin.id, "reopen_ticket", `ticketId=${ticketId}`, ip);
      break;
    }
    case "priority": {
      const priority = String(body.priority ?? "Medium");
      await updateTicketPriority(ticketId, priority);
      await logAdminActivity(admin.id, "set_ticket_priority", `ticketId=${ticketId} priority=${priority}`, ip);
      break;
    }
    case "department": {
      const deptId = Number(body.deptId ?? 0);
      if (!deptId) return NextResponse.json({ success: false, error: "deptId is required" }, { status: 400 });
      await updateTicketDepartment(ticketId, deptId);
      await logAdminActivity(admin.id, "transfer_ticket", `ticketId=${ticketId} deptId=${deptId}`, ip);
      break;
    }
    default:
      return NextResponse.json({ success: false, error: `Unknown action: "${action}"` }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
