import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";

interface SubRow { id: number; email: string; createdAt: string; }

export async function GET() {
  try {
    const subs = await query<SubRow>("SELECT * FROM NewsletterSubscriber ORDER BY createdAt DESC");
    return NextResponse.json({ success: true, data: subs, total: subs.length });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch subscribers" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json() as { email: string };
    const { insertId } = await execute("INSERT INTO NewsletterSubscriber (email, createdAt) VALUES (?, NOW())", [email]);
    return NextResponse.json({ success: true, data: { id: insertId, email } }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to subscribe" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json() as { id: number };
    await execute("DELETE FROM NewsletterSubscriber WHERE id = ?", [id]);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to delete subscriber" }, { status: 500 });
  }
}
