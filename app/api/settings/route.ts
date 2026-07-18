import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { requireAdmin, isAdminUnauthorized, logAdminActivity, getRequestIp } from "@/lib/admin-auth";

interface SettingRow { id: number; key: string; value: string; updatedAt: string; }

export async function GET() {
  try {
    const rows = await query<SettingRow>("SELECT `key`, `value` FROM SiteSettings");
    const map = Object.fromEntries(rows.map(r => [r.key, r.value]));
    return NextResponse.json({ success: true, data: map });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Writes are admin-only — this table backs public site copy (site name, announcement
  // bar) as well as new admin-only settings, so GET stays public but POST must not.
  const admin = await requireAdmin(req, "settings");
  if (isAdminUnauthorized(admin)) return admin;
  try {
    const body = await req.json() as Record<string, string>;
    await Promise.all(
      Object.entries(body).map(([key, value]) =>
        execute(
          "INSERT INTO SiteSettings (`key`, `value`, updatedAt) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), updatedAt = NOW()",
          [key, value]
        )
      )
    );
    await logAdminActivity(admin.id, "update_settings", Object.keys(body).join(", "), getRequestIp(req));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to save settings" }, { status: 500 });
  }
}
