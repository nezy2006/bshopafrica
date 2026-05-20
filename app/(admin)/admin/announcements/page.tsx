"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

async function whmcs<T>(action: string, params: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch("/api/whmcs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, params }),
  });
  const json = (await res.json()) as { success: boolean; data?: T; error?: string };
  if (!json.success) throw new Error(json.error ?? "API error");
  return json.data as T;
}

type Target = "all" | "new" | "active";

export default function AdminAnnouncementsPage() {
  const [form, setForm] = useState({
    subject: "",
    message: "",
    target:  "all" as Target,
  });
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [error,    setError]    = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) return;
    setLoading(true); setError(""); setSuccess(false);
    try {
      await whmcs("adminAddAnnouncement", { subject: form.subject, message: form.message });
      setSuccess(true);
      setForm({ subject: "", message: "", target: "all" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-28 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin/dashboard" className="text-sm text-gray-500 hover:text-[#6B21A8] transition-colors">← Admin</Link>
          <span className="text-gray-300">/</span>
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
        </div>

        {/* Form */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }}
          className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
          <h2 className="font-semibold text-gray-900 text-lg">Create Announcement</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
              <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                placeholder="Announcement subject"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#6B21A8] transition-colors" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
              <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                placeholder="Write your announcement…" rows={8}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#6B21A8] resize-y transition-colors" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Send To</label>
              <div className="flex gap-3">
                {([
                  { value: "all",    label: "All Clients" },
                  { value: "active", label: "Active Clients" },
                  { value: "new",    label: "New Clients" },
                ] as { value: Target; label: string }[]).map(opt => (
                  <button key={opt.value} type="button" onClick={() => setForm(f => ({ ...f, target: opt.value }))}
                    className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                      form.target === opt.value ? "border-[#6B21A8] bg-[#6B21A8] text-white" : "border-gray-200 text-gray-600 hover:border-purple-300"
                    }`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Feedback */}
            <AnimatePresence>
              {success && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  Announcement published successfully!
                </motion.div>
              )}
              {error && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setForm({ subject: "", message: "", target: "all" })}
                className="px-5 py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors">
                Clear
              </button>
              <button type="submit" disabled={loading || !form.subject.trim() || !form.message.trim()}
                className="px-6 py-2.5 bg-[#6B21A8] text-white text-sm font-semibold rounded-xl disabled:opacity-50 hover:bg-[#581c87] transition-colors">
                {loading ? "Publishing…" : "Publish Announcement"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
