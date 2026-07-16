import { NextRequest, NextResponse } from "next/server";
import {
  requireAdmin, isAdminUnauthorized, listAdminUsers, createAdminUser,
  updateAdminUser, resetAdminPassword, logAdminActivity, getRequestIp,
  type AdminRole,
} from "@/lib/admin-auth";

const VALID_ROLES: AdminRole[] = ["super_admin", "admin", "support", "billing", "sales"];

function isSuperAdmin(req: NextRequest) {
  return requireAdmin(req);
}

export async function GET(req: NextRequest) {
  const admin = await isSuperAdmin(req);
  if (isAdminUnauthorized(admin)) return admin;
  if (admin.role !== "super_admin") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  const admins = await listAdminUsers();
  return NextResponse.json({ success: true, data: admins });
}

export async function POST(req: NextRequest) {
  const admin = await isSuperAdmin(req);
  if (isAdminUnauthorized(admin)) return admin;
  if (admin.role !== "super_admin") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  const body = (await req.json()) as { name?: string; email?: string; password?: string; role?: string; department?: string };
  if (!body.name || !body.email || !body.password || !body.role || !VALID_ROLES.includes(body.role as AdminRole)) {
    return NextResponse.json({ success: false, error: "name, email, password, and a valid role are required" }, { status: 400 });
  }
  try {
    const id = await createAdminUser(body.name, body.email, body.password, body.role as AdminRole, body.department);
    await logAdminActivity(admin.id, "create_admin", `email=${body.email} role=${body.role}`, getRequestIp(req));
    return NextResponse.json({ success: true, data: { id } }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error && /Duplicate entry/.test(err.message) ? "An admin with that email already exists." : "Failed to create admin.";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  const admin = await isSuperAdmin(req);
  if (isAdminUnauthorized(admin)) return admin;
  if (admin.role !== "super_admin") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  const body = (await req.json()) as { id?: number; name?: string; role?: string; department?: string; is_active?: boolean; newPassword?: string };
  if (!body.id) return NextResponse.json({ success: false, error: "id is required" }, { status: 400 });

  if (body.role && !VALID_ROLES.includes(body.role as AdminRole)) {
    return NextResponse.json({ success: false, error: "Invalid role" }, { status: 400 });
  }
  if (body.id === admin.id && body.is_active === false) {
    return NextResponse.json({ success: false, error: "You cannot deactivate your own account." }, { status: 400 });
  }

  await updateAdminUser(body.id, {
    name: body.name, role: body.role as AdminRole | undefined,
    department: body.department, is_active: body.is_active,
  });
  if (body.newPassword) await resetAdminPassword(body.id, body.newPassword);

  await logAdminActivity(admin.id, "update_admin", `id=${body.id}`, getRequestIp(req));
  return NextResponse.json({ success: true });
}
