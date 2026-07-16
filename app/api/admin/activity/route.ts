import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isAdminUnauthorized, getActivityLog } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (isAdminUnauthorized(admin)) return admin;
  if (admin.role !== "super_admin" && admin.role !== "admin") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const limit   = Number(req.nextUrl.searchParams.get("limit") ?? 100);
  const idParam = req.nextUrl.searchParams.get("adminId");
  const log = await getActivityLog(limit, idParam ? Number(idParam) : undefined);
  return NextResponse.json({ success: true, data: log });
}
