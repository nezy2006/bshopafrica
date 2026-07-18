"use client";
import { Package, Server, Info } from "lucide-react";

import { useState, useEffect, useCallback } from "react";
import { whmcsAdmin, PageHeader, SearchBar, TableCard, THead, SkeletonRows, Badge, Pagination, EmptyState, Modal } from "@/lib/admin-utils";
import type { WhmcsProduct, AdminHostingAccount } from "@/lib/whmcs";

const PER = 20;
const INPUT = "w-full px-3.5 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm text-black outline-none focus:border-[#6B21A8] focus:bg-white transition-all";

function ProductsTab() {
  const [products, setProducts] = useState<WhmcsProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { whmcsAdmin<WhmcsProduct[]>("getProducts").then(p => { setProducts(p ?? []); setLoading(false); }); }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-800">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        Product templates (pricing, description) are read-only here — WHMCS's remote API has no action to edit or enable/disable an existing product. Make template changes in WHMCS itself (Setup → Products/Services).
      </div>
      <TableCard>
        <THead cols={["ID", "Product Name", "Description"]} />
        <tbody>
          {loading ? <SkeletonRows cols={3} /> : products.length === 0 ? <EmptyState icon={<Package className="w-5 h-5" />} message="No products found" /> : products.map(p => (
            <tr key={p.pid} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="px-5 py-3.5 font-bold text-[#6B21A8]">#{p.pid}</td>
              <td className="px-5 py-3.5 font-medium text-black">{p.name}</td>
              <td className="px-5 py-3.5 text-gray-500 max-w-md truncate" dangerouslySetInnerHTML={{ __html: p.description }} />
            </tr>
          ))}
        </tbody>
      </TableCard>
    </div>
  );
}

function EditServiceModal({ svc, onClose, onDone }: { svc: AdminHostingAccount; onClose: () => void; onDone: () => void }) {
  const [nextDueDate, setNextDueDate] = useState(svc.nextduedate);
  const [amount, setAmount] = useState(svc.amount);
  const [busy, setBusy] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    await whmcsAdmin("adminUpdateService", { serviceId: svc.id, nextDueDate, recurringAmount: Number(amount) });
    setBusy(false);
    onDone();
  };

  return (
    <Modal title={`Edit Service — ${svc.name}`} onClose={onClose}>
      <form onSubmit={save} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Next Due Date</label>
          <input type="date" value={nextDueDate} onChange={e => setNextDueDate(e.target.value)} className={INPUT} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Recurring Amount (price override)</label>
          <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className={INPUT} />
        </div>
        <button type="submit" disabled={busy} className="w-full py-3 bg-[#6B21A8] text-white font-semibold rounded-xl disabled:opacity-60 hover:bg-[#581c87] transition-colors">{busy ? "Saving…" : "Save Changes"}</button>
      </form>
    </Modal>
  );
}

function UpgradeServiceModal({ svc, products, onClose, onDone }: { svc: AdminHostingAccount; products: WhmcsProduct[]; onClose: () => void; onDone: () => void }) {
  const [newProductId, setNewProductId] = useState<number | null>(null);
  const [cycle, setCycle] = useState<"monthly" | "annually">("annually");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductId) return;
    setBusy(true);
    await whmcsAdmin("adminUpgradeService", { serviceId: svc.id, newProductId, newBillingCycle: cycle, paymentMethod: "paypal" });
    setBusy(false);
    onDone();
  };

  return (
    <Modal title={`Upgrade/Downgrade — ${svc.name}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">New Product</label>
          <select value={newProductId ?? ""} onChange={e => setNewProductId(Number(e.target.value) || null)} required className={INPUT}>
            <option value="">Select product…</option>
            {products.map(p => <option key={p.pid} value={p.pid}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Billing Cycle</label>
          <select value={cycle} onChange={e => setCycle(e.target.value as "monthly" | "annually")} className={INPUT}>
            <option value="annually">Annually</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        <p className="text-xs text-gray-400">This bills the price difference immediately via the client's payment method and provisions the change through the hosting module.</p>
        <button type="submit" disabled={busy || !newProductId} className="w-full py-3 bg-[#6B21A8] text-white font-semibold rounded-xl disabled:opacity-60 hover:bg-[#581c87] transition-colors">{busy ? "Processing…" : "Upgrade / Downgrade"}</button>
      </form>
    </Modal>
  );
}

function ServicesTab() {
  const [services, setServices] = useState<AdminHostingAccount[]>([]);
  const [products, setProducts] = useState<WhmcsProduct[]>([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [search,   setSearch]   = useState("");
  const [status,   setStatus]   = useState("");
  const [loading,  setLoading]  = useState(true);
  const [busyId,   setBusyId]   = useState<number | null>(null);
  const [editSvc,     setEditSvc]     = useState<AdminHostingAccount | null>(null);
  const [upgradeSvc,  setUpgradeSvc]  = useState<AdminHostingAccount | null>(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const res = await whmcsAdmin<{ hosting: AdminHostingAccount[]; total: number }>("adminGetHosting", { limitstart: (page - 1) * PER, limitnum: PER, status });
    if (res) { setServices(res.hosting); setTotal(res.total); }
    setLoading(false);
  }, [page, status]);

  useEffect(() => { fetch_(); }, [fetch_]);
  useEffect(() => { whmcsAdmin<WhmcsProduct[]>("getProducts").then(p => setProducts(p ?? [])); }, []);

  const filtered = search
    ? services.filter(s => s.domain.toLowerCase().includes(search.toLowerCase()) || `${s.firstname} ${s.lastname}`.toLowerCase().includes(search.toLowerCase()))
    : services;

  const run = async (id: number, action: string) => {
    setBusyId(id);
    await whmcsAdmin(action, { serviceId: id });
    setBusyId(null);
    fetch_();
  };

  return (
    <div>
      <SearchBar value={search} onChange={setSearch} placeholder="Search by domain or client…">
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="px-3 py-2.5 text-sm border-2 border-gray-200 rounded-xl bg-white outline-none focus:border-[#6B21A8] cursor-pointer">
          {["", "Active", "Suspended", "Terminated", "Cancelled", "Pending"].map(s => <option key={s} value={s}>{s || "All statuses"}</option>)}
        </select>
      </SearchBar>

      <TableCard>
        <THead cols={["Domain", "Client", "Plan", "Amount", "Next Due", "Status", "Actions"]} />
        <tbody>
          {loading ? <SkeletonRows cols={7} /> : filtered.length === 0 ? <EmptyState icon={<Server className="w-5 h-5" />} message="No services found" /> : filtered.map(svc => (
            <tr key={svc.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <td className="px-5 py-3.5 font-bold text-[#6B21A8]">{svc.domain || "—"}</td>
              <td className="px-5 py-3.5 text-gray-700">{svc.firstname} {svc.lastname}</td>
              <td className="px-5 py-3.5 text-gray-600">{svc.name}</td>
              <td className="px-5 py-3.5 font-semibold">${svc.amount}</td>
              <td className="px-5 py-3.5 text-gray-500">{svc.nextduedate}</td>
              <td className="px-5 py-3.5"><Badge status={svc.status} /></td>
              <td className="px-5 py-3.5">
                <div className="flex flex-wrap gap-2">
                  {svc.status === "Active" && <button onClick={() => run(svc.id, "adminSuspendService")} disabled={busyId === svc.id} className="text-xs text-red-600 font-semibold hover:underline disabled:opacity-50">Suspend</button>}
                  {svc.status === "Suspended" && <button onClick={() => run(svc.id, "adminUnsuspendService")} disabled={busyId === svc.id} className="text-xs text-green-600 font-semibold hover:underline disabled:opacity-50">Unsuspend</button>}
                  <button onClick={() => setUpgradeSvc(svc)} disabled={busyId === svc.id} className="text-xs text-[#6B21A8] font-semibold hover:underline disabled:opacity-50">Upgrade</button>
                  <button onClick={() => setEditSvc(svc)} disabled={busyId === svc.id} className="text-xs text-gray-600 font-semibold hover:underline disabled:opacity-50">Edit</button>
                  <button onClick={() => run(svc.id, "adminSendServiceWelcomeEmail")} disabled={busyId === svc.id} className="text-xs text-blue-600 font-semibold hover:underline disabled:opacity-50">Welcome Email</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </TableCard>
      <Pagination page={page} total={total} perPage={PER} onChange={setPage} />

      {editSvc && <EditServiceModal svc={editSvc} onClose={() => setEditSvc(null)} onDone={() => { setEditSvc(null); fetch_(); }} />}
      {upgradeSvc && <UpgradeServiceModal svc={upgradeSvc} products={products} onClose={() => setUpgradeSvc(null)} onDone={() => { setUpgradeSvc(null); fetch_(); }} />}
    </div>
  );
}

export default function ProductsPage() {
  const [tab, setTab] = useState<"products" | "services">("services");

  return (
    <div>
      <PageHeader title="Products & Services" subtitle="Hosting product catalog and active client services" />
      <div className="flex gap-2 mb-5">
        {(["services", "products"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-bold rounded-xl transition-colors ${tab === t ? "bg-[#6B21A8] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
          >{t === "services" ? "Services" : "Products"}</button>
        ))}
      </div>
      {tab === "services" ? <ServicesTab /> : <ProductsTab />}
    </div>
  );
}
