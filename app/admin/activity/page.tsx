"use client";
import { Activity } from "lucide-react";

import { useState, useEffect, useMemo } from "react";
import { PageHeader, TableCard, THead, SkeletonRows, EmptyState, SearchBar } from "@/lib/admin-utils";
import { adminHeaders } from "@/lib/admin-auth-client";

interface LogEntry {
  id: number; admin_id: number; admin_name: string; action: string; details: string | null; ip_address: string | null; created_at: string;
}

function actionLabel(action: string): string {
  return action.replace(/_/g, " ").replace(/^./, c => c.toUpperCase());
}

export default function ActivityLogPage() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res  = await fetch("/api/admin/activity?limit=200", { headers: adminHeaders() });
        const json = await res.json() as { success: boolean; data?: LogEntry[] };
        if (json.success && json.data) setEntries(json.data);
      } catch { /* offline */ }
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!search) return entries;
    const q = search.toLowerCase();
    return entries.filter(e => e.admin_name.toLowerCase().includes(q) || e.action.toLowerCase().includes(q) || (e.details ?? "").toLowerCase().includes(q));
  }, [entries, search]);

  return (
    <div>
      <PageHeader title="Activity Log" subtitle="Full audit trail of admin actions" />
      <SearchBar value={search} onChange={setSearch} placeholder="Search by admin, action, or detail…" />

      <TableCard>
        <THead cols={["Admin", "Action", "Details", "IP Address", "When"]} />
        <tbody>
          {loading ? <SkeletonRows cols={5} /> : filtered.length === 0 ? <EmptyState icon={<Activity className="w-5 h-5" />} message="No activity recorded yet" /> : filtered.map(e => (
            <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <td className="px-5 py-3.5 font-medium text-black">{e.admin_name}</td>
              <td className="px-5 py-3.5 text-gray-700">{actionLabel(e.action)}</td>
              <td className="px-5 py-3.5 text-gray-400 text-xs max-w-xs truncate">{e.details || "—"}</td>
              <td className="px-5 py-3.5 text-gray-400 text-xs font-mono">{e.ip_address || "—"}</td>
              <td className="px-5 py-3.5 text-gray-400 text-xs whitespace-nowrap">{new Date(e.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </TableCard>
    </div>
  );
}
