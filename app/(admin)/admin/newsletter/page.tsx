"use client";

import { useState, useEffect } from "react";
import { PageHeader, SearchBar, TableCard, THead, SkeletonRows, EmptyState } from "@/lib/admin-utils";

interface Sub { id: number; email: string; createdAt: string; }

export default function NewsletterPage() {
  const [subs,    setSubs]    = useState<Sub[]>([]);
  const [search,  setSearch]  = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res  = await fetch("/api/newsletter");
      const json = await res.json() as { success: boolean; data?: Sub[] };
      if (json.success && json.data) setSubs(json.data);
    } catch { /* db not connected */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const remove = async (id: number) => {
    if (!confirm("Remove this subscriber?")) return;
    try {
      await fetch("/api/newsletter", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      setSubs(s => s.filter(x => x.id !== id));
    } catch { /* error */ }
  };

  const exportCsv = () => {
    const csv = ["Email,Joined", ...filtered.map(s => `${s.email},${s.createdAt}`)].join("\n");
    const a = document.createElement("a");
    a.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
    a.download = "newsletter-subscribers.csv";
    a.click();
  };

  const filtered = search ? subs.filter(s => s.email.toLowerCase().includes(search.toLowerCase())) : subs;

  return (
    <div>
      <PageHeader
        title="Newsletter Subscribers"
        subtitle={`${subs.length} total subscribers`}
        action={<button onClick={exportCsv} className="px-5 py-2.5 border-2 border-[#6B21A8] text-[#6B21A8] text-sm font-bold rounded-xl hover:bg-purple-50 transition-colors">Export CSV</button>}
      />
      <SearchBar value={search} onChange={setSearch} placeholder="Search by email…" />

      <TableCard>
        <THead cols={["Email", "Subscribed", "Action"]} />
        <tbody>
          {loading ? <SkeletonRows cols={3} /> : filtered.length === 0 ? <EmptyState icon="📧" message="No subscribers yet" /> : filtered.map(s => (
            <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <td className="px-5 py-3.5 font-medium text-black">{s.email}</td>
              <td className="px-5 py-3.5 text-gray-400 text-xs">{new Date(s.createdAt).toLocaleDateString()}</td>
              <td className="px-5 py-3.5">
                <button onClick={() => remove(s.id)} className="text-xs text-red-500 font-semibold hover:underline">Remove</button>
              </td>
            </tr>
          ))}
        </tbody>
      </TableCard>
    </div>
  );
}
