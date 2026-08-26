import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { requireAdmin, isAdminUnauthorized } from "@/lib/admin-auth";

interface BlogRow { id: number; title: string; slug: string; excerpt: string; content: string; category: string; author: string; published: number; featured: number; publishAt: string | null; coverImage: string | null; readTime: string; createdAt: string; updatedAt: string; }

let schemaMigrated = false;
async function ensureSchema() {
  if (schemaMigrated) return;
  schemaMigrated = true;
  const cols = ["coverImage VARCHAR(500)", "readTime VARCHAR(50)", "featured TINYINT(1) NOT NULL DEFAULT 0", "publishAt DATETIME NULL"];
  for (const col of cols) {
    try { await execute(`ALTER TABLE BlogPost ADD COLUMN ${col}`); } catch (e: unknown) {
      if ((e as { code?: string }).code !== "ER_DUP_FIELDNAME") console.error("[migration]", col, e);
    }
  }
}

export async function GET(req: NextRequest) {
  try {
    await ensureSchema();
    // ?all=1 is the admin listing (drafts + scheduled included) — requires admin auth.
    // The plain public GET only returns posts that are published and whose
    // scheduled publishAt (if any) has already passed.
    const wantsAll = req.nextUrl.searchParams.get("all") === "1";
    if (wantsAll) {
      const admin = await requireAdmin(req, "blog");
      if (isAdminUnauthorized(admin)) return admin;
      const posts = await query<BlogRow>(
        "SELECT id, title, slug, excerpt, category, author, published, featured, publishAt, coverImage, readTime, createdAt FROM BlogPost ORDER BY createdAt DESC"
      );
      return NextResponse.json({ success: true, data: posts });
    }
    const posts = await query<BlogRow>(
      "SELECT id, title, slug, excerpt, category, author, featured, coverImage, readTime, createdAt FROM BlogPost WHERE published = 1 AND (publishAt IS NULL OR publishAt <= NOW()) ORDER BY featured DESC, createdAt DESC"
    );
    return NextResponse.json({ success: true, data: posts });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch posts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureSchema();
    const admin = await requireAdmin(req, "blog");
    if (isAdminUnauthorized(admin)) return admin;
    const b = await req.json() as { title: string; slug: string; excerpt: string; content: string; category: string; author?: string; published?: boolean; featured?: boolean; publishAt?: string | null; coverImage?: string; readTime?: string };
    const { insertId } = await execute(
      "INSERT INTO BlogPost (title, slug, excerpt, content, category, author, published, featured, publishAt, coverImage, readTime, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())",
      [b.title, b.slug, b.excerpt, b.content, b.category, b.author ?? "The B.Shop Team", b.published ? 1 : 0, b.featured ? 1 : 0, b.publishAt ?? null, b.coverImage ?? null, b.readTime ?? "5 min read"]
    );
    return NextResponse.json({ success: true, data: { id: insertId } }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : "Failed to create post" }, { status: 500 });
  }
}
