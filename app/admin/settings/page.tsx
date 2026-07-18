"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Info, Plus, Trash2, Pencil } from "lucide-react";
import { PageHeader, Tabs, TableCard, THead, EmptyState, Modal, whmcsAdmin } from "@/lib/admin-utils";
import { adminHeaders, getCurrentAdmin } from "@/lib/admin-auth-client";
import type { PaymentMethod } from "@/lib/whmcs";

const INPUT = "w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm text-black outline-none focus:border-[#6B21A8] focus:bg-white focus:shadow-[0_0_0_4px_rgba(107,33,168,0.1)] transition-all";

const DEFAULTS: Record<string, string> = {
  site_name: "The B.Shop", contact_email: "admin@bshopafrica.com", support_hours: "Monday–Friday, 9AM–5PM CAT",
  announcement_text: "Get a FREE DOMAIN on Your First Year", announcement_enabled: "true",
  facebook_url: "", twitter_url: "", instagram_url: "", linkedin_url: "",
  company_logo_url: "", company_address: "", company_phone: "",
  "automation.invoice_generation_days": "14", "automation.overdue_notice_days": "1,7,14",
  "security.session_timeout_hours": "8", "security.max_login_attempts": "5",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
      <h2 className="font-bold text-black text-base border-b border-gray-100 pb-3">{title}</h2>
      {children}
    </div>
  );
}

function CompanyTab({ settings, set, save, saving, saved }: { settings: Record<string, string>; set: (k: string, v: string) => void; save: () => void; saving: boolean; saved: boolean }) {
  const Field = ({ label, k, type = "text", hint }: { label: string; k: string; type?: string; hint?: string }) => (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <input type={type} value={settings[k] ?? ""} onChange={e => set(k, e.target.value)} className={INPUT} />
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
  return (
    <div className="space-y-6 max-w-2xl">
      <Section title="Company">
        <Field label="Site Name" k="site_name" />
        <Field label="Contact Email" k="contact_email" type="email" />
        <Field label="Support Hours" k="support_hours" hint="Displayed on the Contact page" />
        <Field label="Logo URL" k="company_logo_url" />
        <Field label="Address" k="company_address" />
        <Field label="Phone" k="company_phone" />
      </Section>
      <Section title="Announcement Bar">
        <Field label="Announcement Text" k="announcement_text" />
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Show Announcement Bar</label>
          <label className="flex items-center gap-3 cursor-pointer">
            <div onClick={() => set("announcement_enabled", settings.announcement_enabled === "true" ? "false" : "true")}
              className={`relative w-11 h-6 rounded-full cursor-pointer transition-colors ${settings.announcement_enabled === "true" ? "bg-[#6B21A8]" : "bg-gray-200"}`}>
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${settings.announcement_enabled === "true" ? "left-6" : "left-1"}`} />
            </div>
            <span className="text-sm text-gray-600">{settings.announcement_enabled === "true" ? "Enabled" : "Disabled"}</span>
          </label>
        </div>
      </Section>
      <Section title="Social Media">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Facebook URL" k="facebook_url" type="url" />
          <Field label="Twitter URL" k="twitter_url" type="url" />
          <Field label="Instagram URL" k="instagram_url" type="url" />
          <Field label="LinkedIn URL" k="linkedin_url" type="url" />
        </div>
      </Section>
      <div className="flex items-center gap-4">
        <button onClick={save} disabled={saving} className="px-8 py-3.5 bg-[#6B21A8] text-white font-bold rounded-xl hover:bg-[#581c87] transition-all disabled:opacity-60 text-sm">{saving ? "Saving…" : "Save Settings"}</button>
        {saved && <span className="text-green-600 text-sm font-semibold animate-pulse">✓ Saved successfully</span>}
      </div>
    </div>
  );
}

function AutomationTab({ settings, set, save, saving, saved }: { settings: Record<string, string>; set: (k: string, v: string) => void; save: () => void; saving: boolean; saved: boolean }) {
  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-800">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        These are informational settings for our own dashboard's reminder workflows — WHMCS's own invoice-generation/overdue-notice cron behavior isn't safely editable via the remote API and must be configured in WHMCS directly.
      </div>
      <Section title="Automation">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Invoice Generation (days before due date)</label>
          <input type="number" value={settings["automation.invoice_generation_days"] ?? ""} onChange={e => set("automation.invoice_generation_days", e.target.value)} className={INPUT} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Overdue Notice Schedule (days after due, comma-separated)</label>
          <input value={settings["automation.overdue_notice_days"] ?? ""} onChange={e => set("automation.overdue_notice_days", e.target.value)} className={INPUT} />
        </div>
      </Section>
      <div className="flex items-center gap-4">
        <button onClick={save} disabled={saving} className="px-8 py-3.5 bg-[#6B21A8] text-white font-bold rounded-xl hover:bg-[#581c87] transition-all disabled:opacity-60 text-sm">{saving ? "Saving…" : "Save Settings"}</button>
        {saved && <span className="text-green-600 text-sm font-semibold animate-pulse">✓ Saved successfully</span>}
      </div>
    </div>
  );
}

function SecurityTab({ settings, set, save, saving, saved }: { settings: Record<string, string>; set: (k: string, v: string) => void; save: () => void; saving: boolean; saved: boolean }) {
  return (
    <div className="max-w-xl space-y-6">
      <Section title="Security">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Admin Session Timeout (hours)</label>
          <input type="number" min={1} value={settings["security.session_timeout_hours"] ?? ""} onChange={e => set("security.session_timeout_hours", e.target.value)} className={INPUT} />
          <p className="text-xs text-gray-400 mt-1">Applies to new logins going forward.</p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Max Failed Login Attempts Before Lockout</label>
          <input type="number" min={1} value={settings["security.max_login_attempts"] ?? ""} onChange={e => set("security.max_login_attempts", e.target.value)} className={INPUT} />
          <p className="text-xs text-gray-400 mt-1">15-minute lockout per IP once exceeded.</p>
        </div>
      </Section>
      <div className="flex items-center gap-4">
        <button onClick={save} disabled={saving} className="px-8 py-3.5 bg-[#6B21A8] text-white font-bold rounded-xl hover:bg-[#581c87] transition-all disabled:opacity-60 text-sm">{saving ? "Saving…" : "Save Settings"}</button>
        {saved && <span className="text-green-600 text-sm font-semibold animate-pulse">✓ Saved successfully</span>}
      </div>
    </div>
  );
}

function EmailSmtpTab() {
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="max-w-lg">
      <Section title="SMTP Test">
        <p className="text-xs text-gray-500">SMTP host/credentials are configured via environment variables. Send a test email to confirm delivery is working.</p>
        <div className="flex gap-2">
          <input value={to} onChange={e => setTo(e.target.value)} placeholder="you@example.com" className={INPUT} />
          <button
            onClick={async () => {
              if (!to.trim()) return;
              setBusy(true);
              const res = await whmcsAdmin("adminSendTestEmail", { to, subject: "SMTP Test — B.Shop Admin" });
              setBusy(false);
              alert(res ? "Test email sent." : "Failed — check SMTP_PASS and related env vars.");
            }}
            disabled={busy || !to.trim()}
            className="px-6 py-3 bg-[#6B21A8] text-white font-bold rounded-xl hover:bg-[#581c87] disabled:opacity-50 whitespace-nowrap"
          >{busy ? "Sending…" : "Send Test"}</button>
        </div>
      </Section>
    </div>
  );
}

function DepartmentsTab() {
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { whmcsAdmin<{ id: number; name: string }[]>("adminGetTicketDepartments").then(d => { setDepartments(d ?? []); setLoading(false); }); }, []);
  return (
    <div className="max-w-lg space-y-4">
      <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-800">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        Read-only — WHMCS's API has no action to create or edit ticket departments remotely. Manage these in WHMCS (Setup → Support Departments).
      </div>
      <TableCard>
        <THead cols={["ID", "Department"]} />
        <tbody>
          {loading ? null : departments.length === 0 ? <EmptyState icon={<Info className="w-5 h-5" />} message="No departments found" /> : departments.map(d => (
            <tr key={d.id} className="border-b border-gray-50"><td className="px-5 py-3 text-gray-400">#{d.id}</td><td className="px-5 py-3 font-medium text-black">{d.name}</td></tr>
          ))}
        </tbody>
      </TableCard>
    </div>
  );
}

function PaymentMethodsTab() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { whmcsAdmin<PaymentMethod[]>("adminGetPaymentMethods").then(m => { setMethods(m ?? []); setLoading(false); }); }, []);
  return (
    <div className="max-w-lg">
      <TableCard>
        <THead cols={["Module", "Display Name"]} />
        <tbody>
          {loading ? null : methods.length === 0 ? <EmptyState icon={<Info className="w-5 h-5" />} message="No payment methods enabled" /> : methods.map(m => (
            <tr key={m.module} className="border-b border-gray-50"><td className="px-5 py-3 text-gray-500 font-mono text-xs">{m.module}</td><td className="px-5 py-3 font-medium text-black">{m.displayname}</td></tr>
          ))}
        </tbody>
      </TableCard>
    </div>
  );
}

interface CannedResponse { id: number; category: string; title: string; body: string }
const CATEGORIES = ["Technical", "Billing", "General", "Domain"];

function CannedResponseModal({ initial, onClose, onSaved }: { initial: CannedResponse | null; onClose: () => void; onSaved: () => void }) {
  const [category, setCategory] = useState(initial?.category ?? "General");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    await fetch("/api/admin/canned-responses", {
      method: initial ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json", ...adminHeaders() },
      body: JSON.stringify(initial ? { id: initial.id, category, title, body } : { category, title, body }),
    });
    setBusy(false);
    onSaved();
  };

  return (
    <Modal title={initial ? "Edit Canned Response" : "New Canned Response"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <select value={category} onChange={e => setCategory(e.target.value)} className={INPUT}>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="Title" className={INPUT} />
        <textarea value={body} onChange={e => setBody(e.target.value)} required rows={6} placeholder="Response text…" className={`${INPUT} resize-none`} />
        <button type="submit" disabled={busy} className="w-full py-3 bg-[#6B21A8] text-white font-semibold rounded-xl disabled:opacity-60 hover:bg-[#581c87]">{busy ? "Saving…" : "Save"}</button>
      </form>
    </Modal>
  );
}

function CannedResponsesTab() {
  const [responses, setResponses] = useState<CannedResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalTarget, setModalTarget] = useState<CannedResponse | null | "new">(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/canned-responses", { headers: adminHeaders() });
    const json = await res.json() as { success: boolean; data?: CannedResponse[] };
    if (json.success && json.data) setResponses(json.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const remove = async (id: number) => {
    if (!confirm("Delete this canned response?")) return;
    await fetch(`/api/admin/canned-responses?id=${id}`, { method: "DELETE", headers: adminHeaders() });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setModalTarget("new")} className="flex items-center gap-1.5 px-4 py-2.5 bg-[#6B21A8] text-white text-sm font-bold rounded-xl hover:bg-[#581c87]"><Plus className="w-4 h-4" /> New Response</button>
      </div>
      <TableCard>
        <THead cols={["Category", "Title", "Preview", "Actions"]} />
        <tbody>
          {loading ? null : responses.length === 0 ? <EmptyState icon={<Info className="w-5 h-5" />} message="No canned responses yet" /> : responses.map(r => (
            <tr key={r.id} className="border-b border-gray-50">
              <td className="px-5 py-3 text-gray-500">{r.category}</td>
              <td className="px-5 py-3 font-medium text-black">{r.title}</td>
              <td className="px-5 py-3 text-gray-400 text-xs max-w-xs truncate">{r.body}</td>
              <td className="px-5 py-3">
                <div className="flex gap-2">
                  <button onClick={() => setModalTarget(r)} className="text-gray-400 hover:text-[#6B21A8]"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => remove(r.id)} className="text-gray-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </TableCard>
      {modalTarget && <CannedResponseModal initial={modalTarget === "new" ? null : modalTarget} onClose={() => setModalTarget(null)} onSaved={() => { setModalTarget(null); load(); }} />}
    </div>
  );
}

function AdminUsersTab() {
  return (
    <div className="max-w-lg bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center space-y-3">
      <p className="text-sm text-gray-600">Admin user management (roles, permissions, password resets) lives on the Team page.</p>
      <Link href="/admin/team" className="inline-block px-6 py-3 bg-[#6B21A8] text-white font-bold rounded-xl hover:bg-[#581c87] transition-colors">Go to Team Management</Link>
    </div>
  );
}

export default function SettingsPage() {
  const me = getCurrentAdmin();
  const [tab, setTab] = useState("company");
  const [settings, setSettings] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
      await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json", ...adminHeaders() }, body: JSON.stringify(settings) });
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch { /* error */ }
    setSaving(false);
  };

  const TABS = [
    { id: "company", label: "Company" },
    { id: "email", label: "Email/SMTP" },
    { id: "departments", label: "Departments" },
    { id: "canned", label: "Canned Responses" },
    { id: "admins", label: "Admin Users" },
    { id: "payments", label: "Payment Methods" },
    { id: "automation", label: "Automation" },
    ...(me?.role === "super_admin" ? [{ id: "security", label: "Security" }] : []),
  ];

  return (
    <div>
      <PageHeader title="Settings" subtitle="Site, billing, support, and security configuration" />
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      {loading ? (
        <div className="py-16 flex justify-center"><div className="w-8 h-8 rounded-full border-4 border-[#6B21A8] border-t-transparent animate-spin" /></div>
      ) : (<>
        {tab === "company" && <CompanyTab settings={settings} set={set} save={save} saving={saving} saved={saved} />}
        {tab === "email" && <EmailSmtpTab />}
        {tab === "departments" && <DepartmentsTab />}
        {tab === "canned" && <CannedResponsesTab />}
        {tab === "admins" && <AdminUsersTab />}
        {tab === "payments" && <PaymentMethodsTab />}
        {tab === "automation" && <AutomationTab settings={settings} set={set} save={save} saving={saving} saved={saved} />}
        {tab === "security" && me?.role === "super_admin" && <SecurityTab settings={settings} set={set} save={save} saving={saving} saved={saved} />}
      </>)}
    </div>
  );
}
