import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";

interface BlogRow { id: number; title: string; slug: string; excerpt: string; content: string; category: string; author: string; published: number; coverImage: string | null; readTime: string; createdAt: string; updatedAt: string; }

export async function GET() {
  try {
    const posts = await query<BlogRow>(
      "SELECT id, title, slug, excerpt, category, author, coverImage, readTime, createdAt FROM BlogPost WHERE published = 1 ORDER BY createdAt DESC"
    );
    return NextResponse.json({ success: true, data: posts });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch posts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const b = await req.json() as { title: string; slug: string; excerpt: string; content: string; category: string; author?: string; published?: boolean; coverImage?: string; readTime?: string };
    const { insertId } = await execute(
      "INSERT INTO BlogPost (title, slug, excerpt, content, category, author, published, coverImage, readTime, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())",
      [b.title, b.slug, b.excerpt, b.content, b.category, b.author ?? "The B.Shop Team", b.published ? 1 : 0, b.coverImage ?? null, b.readTime ?? "5 min read"]
    );
    return NextResponse.json({ success: true, data: { id: insertId } }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : "Failed to create post" }, { status: 500 });
  }
}
