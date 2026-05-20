import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";

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
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to save settings" }, { status: 500 });
  }
}
