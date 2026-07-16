import { NextRequest, NextResponse } from "next/server";
import {
  ensureAdminSchema, verifyAdminLogin, createAdminSession, getAdminBySession,
  deleteAdminSession, logAdminActivity, checkAdminLoginRateLimit,
  recordAdminLoginFailure, clearAdminLoginFailures, getRequestIp,
} from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  await ensureAdminSchema();
  const { email, password } = (await req.json()) as { email: string; password: string };
  const ip = getRequestIp(req);

  const blocked = checkAdminLoginRateLimit(ip);
  if (blocked) return NextResponse.json({ success: false, error: blocked }, { status: 429 });

  const admin = await verifyAdminLogin(email, password);
  if (!admin) {
    recordAdminLoginFailure(ip);
    return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 });
  }
  clearAdminLoginFailures(ip);

  const token = await createAdminSession(admin.id);
  await logAdminActivity(admin.id, "login", undefined, ip);
  return NextResponse.json({ success: true, token, admin });
}

export async function GET(req: NextRequest) {
  const admin = await getAdminBySession(req.headers.get("x-admin-token"));
  if (!admin) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ success: true, admin });
}

export async function DELETE(req: NextRequest) {
  const token = req.headers.get("x-admin-token");
  const admin = await getAdminBySession(token);
  if (admin) await logAdminActivity(admin.id, "logout", undefined, getRequestIp(req));
  await deleteAdminSession(token);
  return NextResponse.json({ success: true });
}
