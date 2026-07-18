import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isAdminUnauthorized, logAdminActivity, getRequestIp } from "@/lib/admin-auth";
import {
  getCannedResponses, createCannedResponse, updateCannedResponse, deleteCannedResponse,
  type CannedResponseCategory,
} from "@/lib/canned-responses";

const VALID_CATEGORIES: CannedResponseCategory[] = ["Technical", "Billing", "General", "Domain"];

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req, "tickets");
  if (isAdminUnauthorized(admin)) return admin;
  const responses = await getCannedResponses();
  return NextResponse.json({ success: true, data: responses });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req, "tickets");
  if (isAdminUnauthorized(admin)) return admin;

  const body = (await req.json()) as { category?: string; title?: string; body?: string };
  if (!body.title?.trim() || !body.body?.trim()) {
    return NextResponse.json({ success: false, error: "title and body are required" }, { status: 400 });
  }
  const category = VALID_CATEGORIES.includes(body.category as CannedResponseCategory) ? (body.category as CannedResponseCategory) : "General";
  const id = await createCannedResponse(category, body.title.trim(), body.body.trim(), admin.id);
  await logAdminActivity(admin.id, "create_canned_response", `id=${id} title=${body.title}`, getRequestIp(req));
  return NextResponse.json({ success: true, data: { id } }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin(req, "tickets");
  if (isAdminUnauthorized(admin)) return admin;

  const body = (await req.json()) as { id?: number; category?: string; title?: string; body?: string };
  if (!body.id) return NextResponse.json({ success: false, error: "id is required" }, { status: 400 });
  if (body.category && !VALID_CATEGORIES.includes(body.category as CannedResponseCategory)) {
    return NextResponse.json({ success: false, error: "Invalid category" }, { status: 400 });
  }
  await updateCannedResponse(body.id, { category: body.category as CannedResponseCategory | undefined, title: body.title, body: body.body });
  await logAdminActivity(admin.id, "update_canned_response", `id=${body.id}`, getRequestIp(req));
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin(req, "tickets");
  if (isAdminUnauthorized(admin)) return admin;

  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  if (!id) return NextResponse.json({ success: false, error: "id is required" }, { status: 400 });
  await deleteCannedResponse(id);
  await logAdminActivity(admin.id, "delete_canned_response", `id=${id}`, getRequestIp(req));
  return NextResponse.json({ success: true });
}
