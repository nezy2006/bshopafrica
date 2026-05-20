"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/lib/admin-utils";

const INPUT = "w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm text-black outline-none focus:border-[#6B21A8] focus:bg-white focus:shadow-[0_0_0_4px_rgba(107,33,168,0.1)] transition-all";

const DEFAULTS: Record<string, string> = {
  site_name:           "The B.Shop",
  contact_email:       "hello@bshopafrica.com",
  support_hours:       "Monday–Friday, 9AM–5PM CAT",
  announcement_text:   "Get a FREE DOMAIN on Your First Year",
  announcement_enabled:"true",
  facebook_url:        "",
  twitter_url:         "",
  instagram_url:       "",
  linkedin_url:        "",
};

export default function SettingsPage() {
  const [settings, setSettings] = useState(DEFAULTS);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then((json: { success: boolean; data?: Record<string, string> }) => {
      if (json.success && json.data) setSettings(s => ({ ...s, ...json.data }));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const set = (key: string, value: string) => setSettings(s => ({ ...s, [key]: value }));

  const save = async () => {
    setSaving(true); setSaved(false);
    try {
      await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) });
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch { /* error */ }
    setSaving(false);
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
      <h2 className="font-bold text-black text-base border-b border-gray-100 pb-3">{title}</h2>
      {children}
    </div>
  );

  const Field = ({ label, k, type = "text", hint }: { label: string; k: string; type?: string; hint?: string }) => (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <input type={type} value={settings[k] ?? ""} onChange={e => set(k, e.target.value)} className={INPUT} disabled={loading} />
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );

  return (
    <div className="max-w-3xl">
      <PageHeader title="Site Settings" subtitle="Configure your website settings" />

      <div className="space-y-6">
        <Section title="General">
          <Field label="Site Name" k="site_name" />
          <Field label="Contact Email" k="contact_email" type="email" />
          <Field label="Support Hours" k="support_hours" hint="Displayed on the Contact page" />
        </Section>

        <Section title="Announcement Bar">
          <Field label="Announcement Text" k="announcement_text" />
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Show Announcement Bar</label>
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => set("announcement_enabled", settings.announcement_enabled === "true" ? "false" : "true")}
                className={`relative w-11 h-6 rounded-full cursor-pointer transition-colors ${settings.announcement_enabled === "true" ? "bg-[#6B21A8]" : "bg-gray-200"}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${settings.announcement_enabled === "true" ? "left-6" : "left-1"}`} />
              </div>
              <span className="text-sm text-gray-600">{settings.announcement_enabled === "true" ? "Enabled" : "Disabled"}</span>
            </label>
          </div>
        </Section>

        <Section title="Social Media">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Facebook URL" k="facebook_url" type="url" />
            <Field label="Twitter URL"  k="twitter_url"  type="url" />
            <Field label="Instagram URL" k="instagram_url" type="url" />
            <Field label="LinkedIn URL"  k="linkedin_url"  type="url" />
          </div>
        </Section>

        <div className="flex items-center gap-4">
          <button onClick={save} disabled={saving || loading}
            className="px-8 py-3.5 bg-[#6B21A8] text-white font-bold rounded-xl hover:bg-[#581c87] transition-all disabled:opacity-60 text-sm">
            {saving ? "Saving…" : "Save Settings"}
          </button>
          {saved && <span className="text-green-600 text-sm font-semibold animate-pulse">✓ Saved successfully</span>}
        </div>
      </div>
    </div>
  );
}
