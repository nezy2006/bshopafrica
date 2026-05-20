"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/lib/admin-utils";

const CATEGORIES = ["General", "Hosting Tips", "Domain Guide", "Business Growth", "Tech News", "Company News"];

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const INPUT = "w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm text-black outline-none focus:border-[#6B21A8] focus:bg-white focus:shadow-[0_0_0_4px_rgba(107,33,168,0.1)] transition-all";

export default function NewBlogPostPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "", slug: "", excerpt: "", content: "", category: CATEGORIES[0],
    author: "The B.Shop Team", coverImage: "", readTime: "5 min read", published: false,
  });
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");

  const set = (k: string, v: string | boolean) => {
    setForm(f => {
      const next = { ...f, [k]: v };
      if (k === "title") next.slug = slugify(v as string);
      return next;
    });
  };

  const submit = async (publish: boolean) => {
    if (!form.title || !form.excerpt || !form.content) { setError("Title, excerpt and content are required."); return; }
    setSaving(true); setError("");
    try {
      const res  = await fetch("/api/blog", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, published: publish }) });
      const json = await res.json() as { success: boolean; error?: string };
      if (!json.success) { setError(json.error ?? "Failed to save post."); }
      else router.push("/admin/blog");
    } catch { setError("Something went wrong."); }
    finally { setSaving(false); }
  };

  return (
    <div className="max-w-4xl">
      <PageHeader title="New Blog Post" subtitle="Create a new blog article" />

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Title <span className="text-red-400">*</span></label>
          <input value={form.title} onChange={e => set("title", e.target.value)} placeholder="Your post title…" className={INPUT} />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Slug</label>
          <input value={form.slug} onChange={e => set("slug", e.target.value)} placeholder="auto-generated-from-title" className={INPUT} />
        </div>

        {/* Category + Author */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
            <select value={form.category} onChange={e => set("category", e.target.value)} className={`${INPUT} cursor-pointer`}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Author</label>
            <input value={form.author} onChange={e => set("author", e.target.value)} className={INPUT} />
          </div>
        </div>

        {/* Cover image + Read time */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Cover Image URL</label>
            <input value={form.coverImage} onChange={e => set("coverImage", e.target.value)} placeholder="https://…" className={INPUT} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Read Time</label>
            <input value={form.readTime} onChange={e => set("readTime", e.target.value)} placeholder="5 min read" className={INPUT} />
          </div>
        </div>

        {/* Excerpt */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Excerpt <span className="text-red-400">*</span></label>
          <textarea value={form.excerpt} onChange={e => set("excerpt", e.target.value)} rows={3} placeholder="Short description for previews and SEO…" className={`${INPUT} resize-none`} />
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Content <span className="text-red-400">*</span> <span className="text-gray-400 font-normal">(HTML supported)</span></label>
          <textarea value={form.content} onChange={e => set("content", e.target.value)} rows={16}
            placeholder="Write your post content here. You can use HTML tags for formatting…"
            className={`${INPUT} resize-y font-mono text-xs`} />
        </div>

        {error && <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-3 font-medium">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button onClick={() => submit(false)} disabled={saving}
            className="px-6 py-3 border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:border-gray-300 transition-all text-sm disabled:opacity-60">
            Save Draft
          </button>
          <button onClick={() => submit(true)} disabled={saving}
            className="px-6 py-3 bg-[#6B21A8] text-white font-bold rounded-xl hover:bg-[#581c87] transition-all text-sm disabled:opacity-60">
            {saving ? "Publishing…" : "Publish"}
          </button>
          <button onClick={() => router.back()} className="ml-auto px-4 py-3 text-gray-400 text-sm font-medium hover:text-gray-600 transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  );
}
