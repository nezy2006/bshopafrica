"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import NextImage from "next/image";
import { PageHeader } from "@/lib/admin-utils";

/* ─── Constants ──────────────────────────────────────────────────────────── */
const CATEGORIES = ["News", "Tutorial", "Tips", "Company Update", "Industry"];
const INPUT = "w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm text-black outline-none focus:border-[#6B21A8] focus:bg-white focus:shadow-[0_0_0_4px_rgba(107,33,168,0.1)] transition-all";
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/* ─── Toolbar button ─────────────────────────────────────────────────────── */
function ToolBtn({
  active, onClick, title, children,
}: {
  active?: boolean; onClick: () => void; title: string; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      title={title}
      className={`px-2 py-1.5 rounded-lg text-sm font-medium transition-all ${
        active
          ? "bg-[#6B21A8] text-white"
          : "text-gray-600 hover:bg-purple-50 hover:text-[#6B21A8]"
      }`}
    >
      {children}
    </button>
  );
}

/* ─── Toolbar ────────────────────────────────────────────────────────────── */
function Toolbar({ editor }: { editor: Editor | null }) {
  const [linkUrl, setLinkUrl] = useState("");
  const [showLink, setShowLink] = useState(false);
  const [imgUrl,   setImgUrl]  = useState("");
  const [showImg,  setShowImg] = useState(false);

  if (!editor) return null;

  const addLink = () => {
    if (!linkUrl) { editor.chain().focus().unsetLink().run(); return; }
    editor.chain().focus().extendMarkRange("link").setLink({ href: linkUrl }).run();
    setLinkUrl(""); setShowLink(false);
  };

  const addImage = () => {
    if (imgUrl) { editor.chain().focus().setImage({ src: imgUrl }).run(); }
    setImgUrl(""); setShowImg(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b-2 border-gray-100 bg-gray-50 rounded-t-xl">
      {/* Text style */}
      <ToolBtn active={editor.isActive("bold")}   onClick={() => editor.chain().focus().toggleBold().run()}   title="Bold">   <b>B</b>   </ToolBtn>
      <ToolBtn active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic"> <i>I</i>   </ToolBtn>
      <ToolBtn active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough"> <s>S</s> </ToolBtn>
      <ToolBtn active={editor.isActive("code")}   onClick={() => editor.chain().focus().toggleCode().run()}   title="Inline code"> <code className="text-xs">`c`</code> </ToolBtn>

      <span className="w-px h-5 bg-gray-200 mx-1" />

      {/* Headings */}
      <ToolBtn active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Heading 1">H1</ToolBtn>
      <ToolBtn active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading 2">H2</ToolBtn>
      <ToolBtn active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Heading 3">H3</ToolBtn>

      <span className="w-px h-5 bg-gray-200 mx-1" />

      {/* Lists */}
      <ToolBtn active={editor.isActive("bulletList")}  onClick={() => editor.chain().focus().toggleBulletList().run()}  title="Bullet list">  ≡</ToolBtn>
      <ToolBtn active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered list">1.</ToolBtn>
      <ToolBtn active={editor.isActive("blockquote")}  onClick={() => editor.chain().focus().toggleBlockquote().run()}  title="Quote">  ❝</ToolBtn>
      <ToolBtn active={editor.isActive("codeBlock")}   onClick={() => editor.chain().focus().toggleCodeBlock().run()}   title="Code block"> {"</>"} </ToolBtn>

      <span className="w-px h-5 bg-gray-200 mx-1" />

      {/* Link */}
      <div className="relative">
        <ToolBtn active={editor.isActive("link") || showLink} onClick={() => setShowLink(v => !v)} title="Link">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        </ToolBtn>
        {showLink && (
          <div className="absolute top-full left-0 mt-1 z-10 flex gap-1 bg-white border border-gray-200 rounded-xl shadow-lg p-2 w-64">
            <input
              value={linkUrl} onChange={e => setLinkUrl(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addLink()}
              placeholder="https://…"
              className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#6B21A8]"
            />
            <button type="button" onClick={addLink} className="px-2 py-1 bg-[#6B21A8] text-white text-xs rounded-lg font-bold">Add</button>
          </div>
        )}
      </div>

      {/* Image from URL */}
      <div className="relative">
        <ToolBtn active={showImg} onClick={() => setShowImg(v => !v)} title="Insert image">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
        </ToolBtn>
        {showImg && (
          <div className="absolute top-full left-0 mt-1 z-10 flex gap-1 bg-white border border-gray-200 rounded-xl shadow-lg p-2 w-64">
            <input
              value={imgUrl} onChange={e => setImgUrl(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addImage()}
              placeholder="Image URL…"
              className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#6B21A8]"
            />
            <button type="button" onClick={addImage} className="px-2 py-1 bg-[#6B21A8] text-white text-xs rounded-lg font-bold">Add</button>
          </div>
        )}
      </div>

      <span className="w-px h-5 bg-gray-200 mx-1" />

      {/* Undo/Redo */}
      <ToolBtn onClick={() => editor.chain().focus().undo().run()} title="Undo">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().redo().run()} title="Redo">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/></svg>
      </ToolBtn>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────── */
export default function NewBlogPostPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title:       "",
    slug:        "",
    coverImage:  "",
    category:    CATEGORIES[0],
    tags:        "",
    author:      "The B.Shop Team",
    seoDesc:     "",
  });
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState("");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: "noopener noreferrer" } }),
      Placeholder.configure({ placeholder: "Write your article content here…" }),
    ],
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none min-h-[400px] px-6 py-5 outline-none text-black",
      },
    },
  });

  const set = (k: string, v: string) => {
    setForm(f => {
      const next = { ...f, [k]: v };
      if (k === "title") next.slug = slugify(v);
      return next;
    });
  };

  const saveDraft = useCallback(async (silent = false) => {
    if (!form.title || !editor) return;
    if (!silent) setSaving(true);
    try {
      const res  = await fetch("/api/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          content:   editor.getHTML(),
          excerpt:   form.seoDesc,
          published: false,
        }),
      });
      const json = await res.json() as { success: boolean; error?: string };
      if (json.success) setLastSaved(new Date());
      else if (!silent) setError(json.error ?? "Failed to save draft.");
    } catch {
      if (!silent) setError("Something went wrong.");
    } finally {
      if (!silent) setSaving(false);
    }
  }, [form, editor]);

  const publish = async () => {
    if (!form.title || !editor?.getText().trim()) {
      setError("Title and content are required.");
      return;
    }
    setSaving(true); setError("");
    try {
      const res  = await fetch("/api/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          content:   editor.getHTML(),
          excerpt:   form.seoDesc,
          published: true,
        }),
      });
      const json = await res.json() as { success: boolean; error?: string };
      if (json.success) router.push("/admin/blog");
      else setError(json.error ?? "Failed to publish.");
    } catch { setError("Something went wrong."); }
    finally { setSaving(false); }
  };

  /* Auto-save every 30 s */
  useEffect(() => {
    autoSaveRef.current = setInterval(() => { saveDraft(true); }, 30_000);
    return () => { if (autoSaveRef.current) clearInterval(autoSaveRef.current); };
  }, [saveDraft]);

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="New Blog Post"
        subtitle="Create a new article"
        action={
          <div className="flex items-center gap-2">
            {lastSaved && (
              <span className="text-xs text-gray-400">
                Auto-saved {lastSaved.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={() => saveDraft(false)} disabled={saving}
              className="px-4 py-2 border-2 border-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:border-gray-300 transition-all disabled:opacity-60"
            >
              Save Draft
            </button>
            <button
              onClick={publish} disabled={saving}
              className="px-5 py-2 bg-[#6B21A8] text-white text-sm font-bold rounded-xl hover:bg-[#581c87] transition-all disabled:opacity-60"
            >
              {saving ? "Saving…" : "Publish"}
            </button>
          </div>
        }
      />

      <div className="space-y-6">
        {/* Title */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <input
            value={form.title}
            onChange={e => set("title", e.target.value)}
            placeholder="Article title…"
            className="w-full text-3xl font-black text-black placeholder-gray-300 outline-none border-none bg-transparent"
          />
        </div>

        {/* Cover image */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">Cover Image</label>
          <div className="flex gap-3">
            <input
              value={form.coverImage}
              onChange={e => set("coverImage", e.target.value)}
              placeholder="Paste image URL here…"
              className={`${INPUT} flex-1`}
            />
          </div>
          {form.coverImage && (
            <div className="mt-3 relative w-full h-40 rounded-xl overflow-hidden bg-gray-100">
              <NextImage src={form.coverImage} alt="Cover preview" fill className="object-cover" unoptimized />
            </div>
          )}
        </div>

        {/* Meta row */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Category</label>
            <select value={form.category} onChange={e => set("category", e.target.value)} className={`${INPUT} cursor-pointer`}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Author</label>
            <input value={form.author} onChange={e => set("author", e.target.value)} className={INPUT} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Tags <span className="normal-case font-normal">(comma separated)</span></label>
            <input value={form.tags} onChange={e => set("tags", e.target.value)} placeholder="hosting, domain, tips" className={INPUT} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Slug</label>
            <input value={form.slug} onChange={e => set("slug", e.target.value)} placeholder="auto-generated" className={INPUT} />
          </div>
        </div>

        {/* Rich text editor */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <Toolbar editor={editor} />
          <EditorContent editor={editor} />
        </div>

        {/* SEO description */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            SEO Description <span className="text-gray-400 font-normal">({form.seoDesc.length}/160)</span>
          </label>
          <textarea
            value={form.seoDesc}
            onChange={e => set("seoDesc", e.target.value.slice(0, 160))}
            rows={3}
            placeholder="Brief description for search engines and previews…"
            className={`${INPUT} resize-none`}
          />
        </div>

        {error && <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-3 font-medium">{error}</p>}

        {/* Bottom action bar */}
        <div className="flex items-center gap-3 pb-8">
          <button
            onClick={() => saveDraft(false)} disabled={saving}
            className="px-6 py-3 border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:border-gray-300 transition-all text-sm disabled:opacity-60"
          >
            Save Draft
          </button>
          <button
            onClick={publish} disabled={saving}
            className="px-6 py-3 bg-[#6B21A8] text-white font-bold rounded-xl hover:bg-[#581c87] transition-all text-sm disabled:opacity-60"
          >
            {saving ? "Publishing…" : "Publish"}
          </button>
          <button onClick={() => router.back()} className="ml-auto px-4 py-3 text-gray-400 text-sm font-medium hover:text-gray-600 transition-colors">
            Cancel
          </button>
        </div>
      </div>

      <style>{`
        .ProseMirror { min-height: 400px; }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }
        .ProseMirror h1 { font-size: 2em; font-weight: 900; margin: 0.67em 0; }
        .ProseMirror h2 { font-size: 1.5em; font-weight: 800; margin: 0.83em 0; }
        .ProseMirror h3 { font-size: 1.17em; font-weight: 700; margin: 1em 0; }
        .ProseMirror blockquote { border-left: 4px solid #6B21A8; padding-left: 1rem; color: #6b7280; margin: 1rem 0; font-style: italic; }
        .ProseMirror pre { background: #1e1e1e; color: #d4d4d4; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; }
        .ProseMirror code { background: #f3f4f6; color: #6B21A8; padding: 0.1em 0.3em; border-radius: 0.25rem; font-size: 0.875em; }
        .ProseMirror pre code { background: none; color: inherit; padding: 0; }
        .ProseMirror ul { list-style: disc; padding-left: 1.5rem; }
        .ProseMirror ol { list-style: decimal; padding-left: 1.5rem; }
        .ProseMirror a { color: #6B21A8; text-decoration: underline; }
        .ProseMirror img { max-width: 100%; border-radius: 0.5rem; margin: 1rem 0; }
        .ProseMirror hr { border: none; border-top: 2px solid #e5e7eb; margin: 2rem 0; }
      `}</style>
    </div>
  );
}
