import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isAdminUnauthorized, logAdminActivity, getRequestIp, listAdminUsers } from "@/lib/admin-auth";
import { getTicketMeta, assignTicket, setTicketEscalated, linkTicketToOrderInvoice } from "@/lib/ticket-meta";
import { getCannedResponses } from "@/lib/canned-responses";
import {
  getTicket, addAdminTicketReply, addTicketNote, closeTicket, reopenTicket,
  updateTicketPriority, updateTicketDepartment, getTicketDepartments, mergeTickets,
  getTickets,
} from "@/lib/whmcs";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req, "tickets");
  if (isAdminUnauthorized(admin)) return admin;

  const ticketId = Number((await params).id);
  const [ticket, meta, departments, admins, cannedResponses] = await Promise.all([
    getTicket(ticketId),
    getTicketMeta(ticketId),
    getTicketDepartments().catch(() => []),
    listAdminUsers().catch(() => []),
    getCannedResponses().catch(() => []),
  ]);
  // Merge candidates: this client's other open tickets.
  const clientTickets = await getTickets(ticket.userid).catch(() => []);

  return NextResponse.json({
    success: true,
    data: {
      ticket, meta, departments, cannedResponses,
      assignableAdmins: admins.filter(a => a.is_active).map(a => ({ id: a.id, name: a.name })),
      mergeCandidates: clientTickets.filter(t => t.id !== ticketId),
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
    case "unescalate": {
      await setTicketEscalated(ticketId, false);
      await logAdminActivity(admin.id, "unescalate_ticket", `ticketId=${ticketId}`, ip);
      break;
    }
    case "merge": {
      const mergeIds = Array.isArray(body.mergeTicketIds) ? (body.mergeTicketIds as unknown[]).map(Number).filter(Boolean) : [];
      if (mergeIds.length === 0) return NextResponse.json({ success: false, error: "mergeTicketIds is required" }, { status: 400 });
      await mergeTickets(ticketId, mergeIds, body.newSubject ? String(body.newSubject) : undefined);
      await logAdminActivity(admin.id, "merge_ticket", `ticketId=${ticketId} merged=${mergeIds.join(",")}`, ip);
      break;
    }
    case "link": {
      const orderId = body.orderId === null || body.orderId === undefined || body.orderId === "" ? null : Number(body.orderId);
      const invoiceId = body.invoiceId === null || body.invoiceId === undefined || body.invoiceId === "" ? null : Number(body.invoiceId);
      await linkTicketToOrderInvoice(ticketId, orderId, invoiceId);
      await logAdminActivity(admin.id, "link_ticket", `ticketId=${ticketId} orderId=${orderId ?? "-"} invoiceId=${invoiceId ?? "-"}`, ip);
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
