"use client";
import { Mail, Send, Info } from "lucide-react";

import { useState, useEffect } from "react";
import { whmcsAdmin, PageHeader, TableCard, THead, SkeletonRows, Badge, EmptyState, ClientPicker, type PickableClient } from "@/lib/admin-utils";
import { adminHeaders } from "@/lib/admin-auth-client";
import type { EmailTemplate, ClientEmailLogEntry } from "@/lib/whmcs";

const INPUT = "w-full px-3.5 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm text-black outline-none focus:border-[#6B21A8] focus:bg-white transition-all";

function TemplatesTab() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [testEmail, setTestEmail] = useState<Record<number, string>>({});
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => { whmcsAdmin<EmailTemplate[]>("adminGetEmailTemplates").then(t => { setTemplates(t ?? []); setLoading(false); }); }, []);

  const sendTest = async (t: EmailTemplate) => {
    const to = testEmail[t.id]?.trim();
    if (!to) { alert("Enter an email address to send the test to."); return; }
    setBusyId(t.id);
    const res = await whmcsAdmin("adminSendTestEmail", { to, subject: t.subject });
    setBusyId(null);
    alert(res ? "Test email sent." : "Failed to send — check SMTP settings.");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-800">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        WHMCS templates are read-only here — the API has no action to edit them remotely. Edit content in WHMCS (Configuration → Email Templates). "Send Test" delivers a subject-line preview via SMTP; merge fields aren't substituted.
      </div>
      <TableCard>
        <THead cols={["ID", "Template Name", "Subject", "Test Send"]} />
        <tbody>
          {loading ? <SkeletonRows cols={4} /> : templates.length === 0 ? <EmptyState icon={<Mail className="w-5 h-5" />} message="No templates found" /> : templates.map(t => (
            <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="px-5 py-3.5 text-gray-400">#{t.id}</td>
              <td className="px-5 py-3.5 font-medium text-black">{t.name}</td>
              <td className="px-5 py-3.5 text-gray-500 max-w-xs truncate">{t.subject}</td>
              <td className="px-5 py-3.5">
                <div className="flex gap-2">
                  <input value={testEmail[t.id] ?? ""} onChange={e => setTestEmail(m => ({ ...m, [t.id]: e.target.value }))} placeholder="you@example.com" className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#6B21A8] w-40" />
                  <button onClick={() => sendTest(t)} disabled={busyId === t.id} className="text-xs text-[#6B21A8] font-semibold hover:underline disabled:opacity-50">{busyId === t.id ? "Sending…" : "Send"}</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </TableCard>
    </div>
  );
}

const FILTERS = [
  { id: "all", label: "All Clients" },
  { id: "hosting_expiring", label: "Hosting Expiring This Month" },
  { id: "domains_expiring", label: "Domains Expiring This Month" },
  { id: "custom", label: "Custom Email List" },
] as const;

function MassEmailTab() {
  const [filter, setFilter] = useState<typeof FILTERS[number]["id"]>("all");
  const [customEmails, setCustomEmails] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    if (!confirm(`Send this email to: ${FILTERS.find(f => f.id === filter)?.label}?`)) return;
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/mass-email", {
        method: "POST", headers: { "Content-Type": "application/json", ...adminHeaders() },
        body: JSON.stringify({
          filter, subject, message,
          customEmails: filter === "custom" ? customEmails.split(/[\n,]/).map(e => e.trim()).filter(Boolean) : undefined,
        }),
      });
      const json = await res.json() as { success: boolean; data?: { sent: number; failed: number }; error?: string };
      if (json.success && json.data) setResult(json.data);
      else alert(json.error ?? "Send failed");
    } finally { setBusy(false); }
  };

  return (
    <form onSubmit={send} className="max-w-2xl bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Recipients</label>
        <select value={filter} onChange={e => setFilter(e.target.value as typeof filter)} className={INPUT}>
          {FILTERS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
        </select>
      </div>
      {filter === "custom" && (
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Email Addresses (comma or newline separated)</label>
          <textarea value={customEmails} onChange={e => setCustomEmails(e.target.value)} rows={3} className={`${INPUT} resize-none`} />
        </div>
      )}
      <input value={subject} onChange={e => setSubject(e.target.value)} required placeholder="Subject" className={INPUT} />
      <textarea value={message} onChange={e => setMessage(e.target.value)} required rows={8} placeholder="Message…" className={`${INPUT} resize-none`} />
      <p className="text-xs text-gray-400">Capped at 500 recipients per send, delivered in small batches.</p>
      <button type="submit" disabled={busy} className="flex items-center gap-2 px-6 py-3 bg-[#6B21A8] text-white font-bold rounded-xl hover:bg-[#581c87] disabled:opacity-60">
        <Send className="w-4 h-4" /> {busy ? "Sending…" : "Send"}
      </button>
      {result && <p className="text-sm font-semibold text-green-600">Sent to {result.sent} recipient(s){result.failed ? `, ${result.failed} failed` : ""}.</p>}
    </form>
  );
}

function EmailLogTab() {
  const [client, setClient] = useState<PickableClient | null>(null);
  const [emails, setEmails] = useState<ClientEmailLogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!client) { setEmails([]); return; }
    setLoading(true);
    whmcsAdmin<ClientEmailLogEntry[]>("adminGetClientEmails", { clientId: client.id }).then(e => { setEmails(e ?? []); setLoading(false); });
  }, [client]);

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-800">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        WHMCS's email log API is per-client (GetEmails requires a client id) — there's no bulk system-wide log endpoint. Pick a client to see everything sent to them.
      </div>
      <div className="max-w-md"><ClientPicker client={client} onSelect={setClient} /></div>
      {client && (
        <TableCard>
          <THead cols={["Subject", "To", "Date", "Status"]} />
          <tbody>
            {loading ? <SkeletonRows cols={4} /> : emails.length === 0 ? <EmptyState icon={<Mail className="w-5 h-5" />} message="No emails found for this client" /> : emails.map(e => (
              <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-5 py-3.5 font-medium text-black">{e.subject}</td>
                <td className="px-5 py-3.5 text-gray-500 text-xs">{e.to}</td>
                <td className="px-5 py-3.5 text-gray-400 text-xs">{e.date}</td>
                <td className="px-5 py-3.5">{e.failed ? <Badge status="Failed" /> : <Badge status="Sent" />}</td>
              </tr>
            ))}
          </tbody>
        </TableCard>
      )}
    </div>
  );
}

export default function EmailsPage() {
  const [tab, setTab] = useState<"templates" | "mass" | "log">("templates");
  const tabs = [
    { id: "templates" as const, label: "Templates" },
    { id: "mass" as const, label: "Mass Email" },
    { id: "log" as const, label: "Email Log" },
  ];

  return (
    <div>
      <PageHeader title="Email Management" subtitle="Templates, mass email, and per-client send history" />
      <div className="flex gap-2 mb-6">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-bold rounded-xl transition-colors ${tab === t.id ? "bg-[#6B21A8] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
          >{t.label}</button>
        ))}
      </div>
      {tab === "templates" && <TemplatesTab />}
      {tab === "mass" && <MassEmailTab />}
      {tab === "log" && <EmailLogTab />}
    </div>
  );
}
