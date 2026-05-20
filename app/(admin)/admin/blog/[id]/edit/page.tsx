"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/lib/admin-utils";

const CATEGORIES = ["General", "Hosting Tips", "Domain Guide", "Business Growth", "Tech News", "Company News"];
const INPUT = "w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm text-black outline-none focus:border-[#6B21A8] focus:bg-white focus:shadow-[0_0_0_4px_rgba(107,33,168,0.1)] transition-all";

interface Post { id: number; title: string; slug: string; excerpt: string; content: string; category: string; author: string; published: boolean; coverImage: string | null; readTime: string; }

export default function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const router   = useRouter();
  const [id,     setId]     = useState<number | null>(null);
  const [form,   setForm]   = useState<Omit<Post, "id"> | null>(null);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  useEffect(() => {
    params.then(async ({ id: rawId }) => {
      setId(Number(rawId));
      try {
        const res  = await fetch(`/api/blog/${rawId}`);
        const json = await res.json() as { success: boolean; data?: Post };
        if (json.success && json.data) {
          const { id: _, ...rest } = json.data;
          setForm({ ...rest, coverImage: rest.coverImage ?? "" });
        }
      } catch { setError("Failed to load post."); }
    });
  }, [params]);

  const set = (k: string, v: string | boolean) => setForm(f => f ? { ...f, [k]: v } : f);

  const submit = async (publish?: boolean) => {
    if (!form) return;
    setSaving(true); setError("");
    try {
      const body = publish !== undefined ? { ...form, published: publish } : form;
      const res  = await fetch(`/api/blog/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json() as { success: boolean; error?: string };
      if (!json.success) { setError(json.error ?? "Failed to save."); }
      else router.push("/admin/blog");
    } catch { setError("Something went wrong."); }
    finally { setSaving(false); }
  };

  if (!form) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 rounded-full border-4 border-[#6B21A8] border-t-transparent animate-spin" /></div>;

  return (
    <div className="max-w-4xl">
      <PageHeader title="Edit Blog Post" subtitle={`Editing: ${form.title}`} />

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
          <input value={form.title} onChange={e => set("title", e.target.value)} className={INPUT} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Slug</label>
          <input value={form.slug} onChange={e => set("slug", e.target.value)} className={INPUT} />
        </div>
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
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Cover Image URL</label>
            <input value={form.coverImage ?? ""} onChange={e => set("coverImage", e.target.value)} className={INPUT} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Read Time</label>
            <input value={form.readTime} onChange={e => set("readTime", e.target.value)} className={INPUT} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Excerpt</label>
          <textarea value={form.excerpt} onChange={e => set("excerpt", e.target.value)} rows={3} className={`${INPUT} resize-none`} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Content <span className="text-gray-400 font-normal">(HTML supported)</span></label>
          <textarea value={form.content} onChange={e => set("content", e.target.value)} rows={16} className={`${INPUT} resize-y font-mono text-xs`} />
        </div>

        {error && <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-3 font-medium">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button onClick={() => submit()} disabled={saving} className="px-6 py-3 border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:border-gray-300 text-sm disabled:opacity-60">Save</button>
          <button onClick={() => submit(!form.published)} disabled={saving} className="px-6 py-3 bg-[#6B21A8] text-white font-bold rounded-xl hover:bg-[#581c87] text-sm disabled:opacity-60">
            {saving ? "Saving…" : form.published ? "Unpublish" : "Publish"}
          </button>
          <button onClick={() => router.back()} className="ml-auto px-4 py-3 text-gray-400 text-sm font-medium hover:text-gray-600">Cancel</button>
        </div>
      </div>
    </div>
  );
}
