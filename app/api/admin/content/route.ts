import { NextRequest, NextResponse } from "next/server";
import { getAllSiteContent, setSiteContent, deleteSiteContent } from "@/lib/site-content";
import { requireAdmin, isAdminUnauthorized, logAdminActivity, getRequestIp } from "@/lib/admin-auth";

// GET is intentionally public (no admin check) — this is how the site itself
// (announcement banner, homepage copy) reads its own content at render time.
// Only POST/PUT/DELETE (the actual writes) are admin-gated.
export async function GET() {
  try {
    const data = await getAllSiteContent();
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("[/api/admin/content] GET", err);
    return NextResponse.json({ success: false, error: "Failed to fetch content" }, { status: 500 });
  }
}

async function handleWrite(req: NextRequest) {
  const admin = await requireAdmin(req, "content");
  if (isAdminUnauthorized(admin)) return admin;
  try {
    const body = await req.json() as Record<string, string>;
    if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).length === 0) {
      return NextResponse.json({ success: false, error: "Body must be a non-empty key/value object" }, { status: 400 });
    }
    await setSiteContent(body, admin.id);
    await logAdminActivity(admin.id, "update_content", Object.keys(body).join(", "), getRequestIp(req));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[/api/admin/content] POST/PUT", err);
    return NextResponse.json({ success: false, error: "Failed to save content" }, { status: 500 });
  }
}

export const POST = handleWrite;
export const PUT  = handleWrite;

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin(req, "content");
  if (isAdminUnauthorized(admin)) return admin;
  try {
    const key = req.nextUrl.searchParams.get("key");
    if (!key) return NextResponse.json({ success: false, error: "key query param is required" }, { status: 400 });
    await deleteSiteContent(key);
    await logAdminActivity(admin.id, "delete_content", key, getRequestIp(req));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[/api/admin/content] DELETE", err);
    return NextResponse.json({ success: false, error: "Failed to delete content" }, { status: 500 });
  }
}
