"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info, AlertTriangle, CheckCircle2, Sparkles } from "lucide-react";
import { PageHeader, Tabs } from "@/lib/admin-utils";
import { adminHeaders } from "@/lib/admin-auth-client";
import BlogListPage from "@/app/admin/blog/page";

const INPUT = "w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm text-black outline-none focus:border-[#6B21A8] focus:bg-white focus:shadow-[0_0_0_4px_rgba(107,33,168,0.1)] transition-all";

type BannerType = "info" | "warning" | "success" | "promo";

const BANNER_TYPES: { id: BannerType; label: string; barCls: string; textCls: string; icon: React.ReactNode }[] = [
  { id: "info",    label: "Info",    barCls: "bg-blue-600",   textCls: "text-blue-700 border-blue-200 bg-blue-50",     icon: <Info className="w-4 h-4" /> },
  { id: "warning", label: "Warning", barCls: "bg-amber-500",  textCls: "text-amber-700 border-amber-200 bg-amber-50",  icon: <AlertTriangle className="w-4 h-4" /> },
  { id: "success", label: "Success", barCls: "bg-green-600",  textCls: "text-green-700 border-green-200 bg-green-50", icon: <CheckCircle2 className="w-4 h-4" /> },
  { id: "promo",   label: "Promo",   barCls: "bg-[#6B21A8]",  textCls: "text-[#6B21A8] border-purple-200 bg-purple-50", icon: <Sparkles className="w-4 h-4" /> },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
      <h2 className="font-bold text-black text-base border-b border-gray-100 pb-3">{title}</h2>
      {children}
    </div>
  );
}

function SaveFeedback({ saving, saved, error, onSave }: { saving: boolean; saved: boolean; error: string; onSave: () => void }) {
  return (
    <div className="flex items-center gap-4">
      <button onClick={onSave} disabled={saving}
        className="px-8 py-3.5 bg-[#6B21A8] text-white font-bold rounded-xl hover:bg-[#581c87] transition-all disabled:opacity-60 text-sm">
        {saving ? "Saving…" : "Save"}
      </button>
      <AnimatePresence>
        {saved && (
          <motion.span initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-green-600 text-sm font-semibold">✓ Saved successfully</motion.span>
        )}
        {error && (
          <motion.span initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-red-600 text-sm font-semibold">{error}</motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Tab 1: Announcement Banner ─────────────────────────────────────────── */
function AnnouncementBannerTab({ content, set, saveKeys }: {
  content: Record<string, string>;
  set: (k: string, v: string) => void;
  saveKeys: (keys: string[]) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState("");

  const enabled = content.announcement_enabled === "true";
  const text    = content.announcement_text ?? "";
  const type    = (content.announcement_type as BannerType) || "info";
  const active  = BANNER_TYPES.find(t => t.id === type) ?? BANNER_TYPES[0];

  const save = async () => {
    setSaving(true); setSaved(false); setError("");
    try {
      await saveKeys(["announcement_enabled", "announcement_text", "announcement_type"]);
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Failed to save. Please try again.");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Section title="Banner Settings">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Show Banner on Site</label>
          <label className="flex items-center gap-3 cursor-pointer w-fit">
            <div onClick={() => set("announcement_enabled", enabled ? "false" : "true")}
              className={`relative w-11 h-6 rounded-full cursor-pointer transition-colors ${enabled ? "bg-[#6B21A8]" : "bg-gray-200"}`}>
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${enabled ? "left-6" : "left-1"}`} />
            </div>
            <span className="text-sm text-gray-600">{enabled ? "Enabled" : "Disabled"}</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Banner Text</label>
          <input value={text} onChange={e => set("announcement_text", e.target.value)}
            placeholder="e.g. 50% off all hosting plans this week!" className={INPUT} />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Banner Type</label>
          <div className="flex flex-wrap gap-2">
            {BANNER_TYPES.map(t => (
              <button key={t.id} type="button" onClick={() => set("announcement_type", t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${
                  type === t.id ? `${t.textCls} border-current` : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}>
                {t.icon}{t.label}
              </button>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Preview">
        {!enabled ? (
          <p className="text-sm text-gray-400">Banner is disabled — nothing will show on the site.</p>
        ) : !text.trim() ? (
          <p className="text-sm text-gray-400">Enter banner text above to see a preview.</p>
        ) : (
          <div className={`${active.barCls} rounded-xl px-4 py-3 flex items-center justify-center gap-2 text-white text-sm font-semibold text-center`}>
            {active.icon}
            <span>{text}</span>
          </div>
        )}
      </Section>

      <SaveFeedback saving={saving} saved={saved} error={error} onSave={save} />
    </div>
  );
}

/* ─── Tab 3: Homepage Content ────────────────────────────────────────────── */
function HomepageContentTab({ content, set, saveKeys }: {
  content: Record<string, string>;
  set: (k: string, v: string) => void;
  saveKeys: (keys: string[]) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState("");

  const save = async () => {
    setSaving(true); setSaved(false); setError("");
    try {
      await saveKeys(["hero_headline", "hero_subtext", "promo_banner_text"]);
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Failed to save. Please try again.");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-800">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        Changes save immediately. The homepage hero currently reads its default copy from the page itself — wiring it to pull from here live is a follow-up step.
      </div>

      <Section title="Hero Section">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Hero Headline</label>
          <input value={content.hero_headline ?? ""} onChange={e => set("hero_headline", e.target.value)} className={INPUT} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Hero Subtext</label>
          <textarea value={content.hero_subtext ?? ""} onChange={e => set("hero_subtext", e.target.value)} rows={3} className={`${INPUT} resize-none`} />
        </div>
      </Section>

      <Section title="Promotional Banner">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Promo Banner Text</label>
          <input value={content.promo_banner_text ?? ""} onChange={e => set("promo_banner_text", e.target.value)} className={INPUT} />
        </div>
      </Section>

      <SaveFeedback saving={saving} saved={saved} error={error} onSave={save} />
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function ContentManagementPage() {
  const [tab, setTab] = useState("banner");
  const [content, setContent] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/content").then(r => r.json()).then((json: { success: boolean; data?: Record<string, string> }) => {
      if (json.success && json.data) setContent(json.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const set = (key: string, value: string) => setContent(c => ({ ...c, [key]: value }));

  const saveKeys = async (keys: string[]) => {
    const body = Object.fromEntries(keys.map(k => [k, content[k] ?? ""]));
    const res = await fetch("/api/admin/content", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...adminHeaders() },
      body: JSON.stringify(body),
    });
    const json = await res.json() as { success: boolean };
    if (!json.success) throw new Error("Save failed");
  };

  const TABS = [
    { id: "banner",   label: "Announcement Banner" },
    { id: "blog",     label: "Blog Posts Manager" },
    { id: "homepage", label: "Homepage Content" },
  ];

  return (
    <div>
      <PageHeader title="Content Management" subtitle="Site-wide banner, blog posts, and homepage copy" />
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      {loading ? (
        <div className="py-16 flex justify-center"><div className="w-8 h-8 rounded-full border-4 border-[#6B21A8] border-t-transparent animate-spin" /></div>
      ) : (<>
        {tab === "banner"   && <AnnouncementBannerTab content={content} set={set} saveKeys={saveKeys} />}
        {tab === "blog"     && <BlogListPage />}
        {tab === "homepage" && <HomepageContentTab content={content} set={set} saveKeys={saveKeys} />}
      </>)}
    </div>
  );
}
