"use client";
import { Users, Plus, X, KeyRound } from "lucide-react";

import { useState, useEffect } from "react";
import { PageHeader, TableCard, THead, SkeletonRows, Badge, EmptyState } from "@/lib/admin-utils";
import { adminHeaders, getCurrentAdmin, type AdminRole } from "@/lib/admin-auth-client";

interface AdminRow {
  id: number; name: string; email: string; role: AdminRole; department: string | null;
  is_active: number; last_login: string | null; created_at: string;
}

const ROLES: AdminRole[] = ["super_admin", "admin", "support", "billing", "sales"];

function RoleBadge({ role }: { role: AdminRole }) {
  const cls = {
    super_admin: "bg-purple-100 text-purple-700",
    admin:       "bg-blue-100 text-blue-700",
    support:     "bg-green-100 text-green-700",
    billing:     "bg-orange-100 text-orange-700",
    sales:       "bg-pink-100 text-pink-700",
  }[role];
  return <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${cls}`}>{role.replace(/_/g, " ")}</span>;
}

function AddAdminModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AdminRole>("support");
  const [department, setDepartment] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const res  = await fetch("/api/admin/team", {
        method: "POST", headers: { "Content-Type": "application/json", ...adminHeaders() },
        body: JSON.stringify({ name, email, password, role, department }),
      });
      const json = await res.json() as { success: boolean; error?: string };
      if (!json.success) { setError(json.error ?? "Failed to create admin."); setBusy(false); return; }
      onCreated();
    } catch { setError("Something went wrong."); setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-900">Add Admin</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Name</label>
            <input value={name} onChange={e => setName(e.target.value)} required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#6B21A8]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#6B21A8]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#6B21A8]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Role</label>
              <select value={role} onChange={e => setRole(e.target.value as AdminRole)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#6B21A8]">
                {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Department</label>
              <input value={department} onChange={e => setDepartment(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#6B21A8]" />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={busy} className="w-full py-3 bg-[#6B21A8] text-white font-semibold rounded-xl disabled:opacity-60 hover:bg-[#581c87] transition-colors">
            {busy ? "Creating…" : "Create Admin"}
          </button>
        </form>
      </div>
    </div>
  );
}

function ResetPasswordModal({ admin, onClose, onDone }: { admin: AdminRow; onClose: () => void; onDone: () => void }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError("");
    const res  = await fetch("/api/admin/team", {
      method: "PATCH", headers: { "Content-Type": "application/json", ...adminHeaders() },
      body: JSON.stringify({ id: admin.id, newPassword: password }),
    });
    const json = await res.json() as { success: boolean; error?: string };
    if (!json.success) { setError(json.error ?? "Failed to reset password."); setBusy(false); return; }
    onDone();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Reset Password</h3>
        <p className="text-sm text-gray-500 mb-5">{admin.email}</p>
        <form onSubmit={submit} className="space-y-4">
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
            placeholder="New password" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#6B21A8]" />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={busy} className="w-full py-3 bg-[#6B21A8] text-white font-semibold rounded-xl disabled:opacity-60 hover:bg-[#581c87] transition-colors">
            {busy ? "Saving…" : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function TeamPage() {
  const [admins,  setAdmins]  = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [resetTarget, setResetTarget] = useState<AdminRow | null>(null);
  const me = getCurrentAdmin();

  const load = async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/admin/team", { headers: adminHeaders() });
      const json = await res.json() as { success: boolean; data?: AdminRow[] };
      if (json.success && json.data) setAdmins(json.data);
    } catch { /* offline */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleActive = async (a: AdminRow) => {
    await fetch("/api/admin/team", {
      method: "PATCH", headers: { "Content-Type": "application/json", ...adminHeaders() },
      body: JSON.stringify({ id: a.id, is_active: !a.is_active }),
    });
    load();
  };

  if (me && me.role !== "super_admin") {
    return <div className="text-center py-24 text-gray-400">Team Management is only available to super admins.</div>;
  }

  return (
    <div>
      <PageHeader
        title="Team Management"
        subtitle={`${admins.length} admin accounts`}
        action={<button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-5 py-2.5 bg-[#6B21A8] text-white text-sm font-bold rounded-xl hover:bg-[#581c87] transition-colors"><Plus className="w-4 h-4" />Add Admin</button>}
      />

      <TableCard>
        <THead cols={["Name", "Email", "Role", "Department", "Status", "Last Login", "Actions"]} />
        <tbody>
          {loading ? <SkeletonRows cols={7} /> : admins.length === 0 ? <EmptyState icon={<Users className="w-5 h-5" />} message="No admins yet" /> : admins.map(a => (
            <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <td className="px-5 py-3.5 font-medium text-black">{a.name}</td>
              <td className="px-5 py-3.5 text-gray-500">{a.email}</td>
              <td className="px-5 py-3.5"><RoleBadge role={a.role} /></td>
              <td className="px-5 py-3.5 text-gray-500">{a.department || "—"}</td>
              <td className="px-5 py-3.5"><Badge status={a.is_active ? "active" : "cancelled"} /></td>
              <td className="px-5 py-3.5 text-gray-400 text-xs">{a.last_login ? new Date(a.last_login).toLocaleString() : "Never"}</td>
              <td className="px-5 py-3.5 flex gap-3">
                <button onClick={() => setResetTarget(a)} className="text-xs text-[#6B21A8] font-semibold hover:underline flex items-center gap-1"><KeyRound className="w-3 h-3" />Reset PW</button>
                <button onClick={() => toggleActive(a)} disabled={a.id === me?.id}
                  className="text-xs font-semibold hover:underline disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ color: a.is_active ? "#dc2626" : "#16a34a" }}
                >{a.is_active ? "Deactivate" : "Activate"}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </TableCard>

      {showAdd && <AddAdminModal onClose={() => setShowAdd(false)} onCreated={() => { setShowAdd(false); load(); }} />}
      {resetTarget && <ResetPasswordModal admin={resetTarget} onClose={() => setResetTarget(null)} onDone={() => setResetTarget(null)} />}
    </div>
  );
}
