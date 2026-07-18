"use client";
import { ShoppingCart, Plus, Eye, AlertTriangle } from "lucide-react";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { whmcsAdmin, PageHeader, SearchBar, TableCard, THead, SkeletonRows, Badge, Pagination, EmptyState, Modal } from "@/lib/admin-utils";
import type { AdminOrder, AdminOrderDetail } from "@/lib/whmcs";

const PER = 20;
const STATUSES = ["", "Pending", "Active", "Cancelled", "Fraud"];

function OrderDetailModal({ orderId, onClose }: { orderId: number; onClose: () => void }) {
  const [detail, setDetail] = useState<AdminOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    whmcsAdmin<AdminOrderDetail>("adminGetOrderDetail", { orderId }).then(d => { setDetail(d); setLoading(false); });
  }, [orderId]);

  return (
    <Modal title={`Order #${orderId}`} onClose={onClose} maxWidth="max-w-lg">
      {loading || !detail ? (
        <div className="py-10 flex justify-center"><div className="w-6 h-6 rounded-full border-4 border-[#6B21A8] border-t-transparent animate-spin" /></div>
      ) : (
        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div><p className="text-gray-400 text-xs uppercase font-semibold">Client</p><p className="font-medium text-black">{detail.firstname} {detail.lastname}</p></div>
            <div><p className="text-gray-400 text-xs uppercase font-semibold">Status</p><Badge status={detail.status} /></div>
            <div><p className="text-gray-400 text-xs uppercase font-semibold">Amount</p><p className="font-bold text-black">${detail.amount} {detail.currencycode}</p></div>
            <div><p className="text-gray-400 text-xs uppercase font-semibold">Payment Method</p><p className="text-black">{detail.paymentmethod || "—"}</p></div>
            <div><p className="text-gray-400 text-xs uppercase font-semibold">Date</p><p className="text-black">{detail.date}</p></div>
            <div><p className="text-gray-400 text-xs uppercase font-semibold">Invoice</p><p className="text-black">{detail.invoiceid ? `#${detail.invoiceid}` : "—"}</p></div>
          </div>
          <div>
            <p className="text-gray-400 text-xs uppercase font-semibold mb-1.5">Line Items</p>
            <div className="space-y-1">
              {detail.lineitems.length === 0 ? <p className="text-gray-400 text-xs">No line items</p> : detail.lineitems.map((li, i) => (
                <div key={i} className="flex justify-between bg-gray-50 rounded-lg px-3 py-2">
                  <span className="text-gray-700">{li.description || li.type}</span>
                  <span className="font-semibold text-black">${li.amount}</span>
                </div>
              ))}
            </div>
          </div>
          {detail.notes && (
            <div><p className="text-gray-400 text-xs uppercase font-semibold mb-1">Notes</p><p className="text-gray-600 whitespace-pre-wrap">{detail.notes}</p></div>
          )}
        </div>
      )}
    </Modal>
  );
}

export default function OrdersPage() {
  const [orders,  setOrders]  = useState<AdminOrder[]>([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [search,  setSearch]  = useState("");
  const [status,  setStatus]  = useState("");
  const [loading, setLoading] = useState(true);
  const [viewOrderId, setViewOrderId] = useState<number | null>(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const res = await whmcsAdmin<{ orders: AdminOrder[]; total: number }>(
      "adminGetOrders", { limitstart: (page - 1) * PER, limitnum: PER, status }
    );
    if (res) { setOrders(res.orders); setTotal(res.total); }
    setLoading(false);
  }, [page, status]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const filtered = search
    ? orders.filter(o => `${o.firstname} ${o.lastname} ${o.id}`.toLowerCase().includes(search.toLowerCase()))
    : orders;

  const markFraud = async (o: AdminOrder) => {
    if (!confirm(`Mark order #${o.id} as fraud? This can optionally cancel any linked PayPal subscription.`)) return;
    const cancelSub = confirm("Also cancel the linked PayPal subscription, if any? (OK = yes, Cancel = no)");
    await whmcsAdmin("adminMarkOrderFraud", { orderId: o.id, cancelSubscription: cancelSub });
    fetch_();
  };

  return (
    <div>
      <PageHeader title="Orders" subtitle={`${total} total orders`}
        action={<Link href="/admin/orders/new" className="flex items-center gap-1.5 px-4 py-2.5 bg-[#6B21A8] text-white text-sm font-bold rounded-xl hover:bg-[#581c87] transition-colors"><Plus className="w-4 h-4" /> New Order</Link>}
      />
      <SearchBar value={search} onChange={setSearch} placeholder="Search by client name or order ID…">
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="px-3 py-2.5 text-sm border-2 border-gray-200 rounded-xl bg-white outline-none focus:border-[#6B21A8] cursor-pointer">
          {STATUSES.map(s => <option key={s} value={s}>{s || "All statuses"}</option>)}
        </select>
      </SearchBar>

      <TableCard>
        <THead cols={["Order ID", "Client", "Product", "Amount", "Payment Method", "Date", "Status", "Actions"]} />
        <tbody>
          {loading ? <SkeletonRows cols={8} /> : filtered.length === 0 ? <EmptyState icon={<ShoppingCart className="w-5 h-5" />} message="No orders found" /> : filtered.map(o => (
            <tr key={o.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${o.status === "Pending" ? "bg-yellow-50/40" : ""}`}>
              <td className="px-5 py-3.5 font-bold text-[#6B21A8]">#{o.id}</td>
              <td className="px-5 py-3.5 font-medium text-black">{o.firstname} {o.lastname}</td>
              <td className="px-5 py-3.5 text-gray-600 max-w-[180px] truncate">{o.product || "—"}</td>
              <td className="px-5 py-3.5 font-semibold">${o.amount} <span className="text-xs text-gray-400">{o.currencycode}</span></td>
              <td className="px-5 py-3.5 text-gray-500">{o.paymentmethod || "—"}</td>
              <td className="px-5 py-3.5 text-gray-500">{o.date}</td>
              <td className="px-5 py-3.5"><Badge status={o.status} /></td>
              <td className="px-5 py-3.5">
                <div className="flex gap-2 items-center">
                  <button onClick={() => setViewOrderId(o.id)} title="View details" className="text-gray-400 hover:text-[#6B21A8]"><Eye className="w-4 h-4" /></button>
                  {o.status === "Pending" && (
                    <button onClick={async () => { await whmcsAdmin("adminAcceptOrder", { orderId: o.id }); fetch_(); }} className="text-xs px-2.5 py-1 bg-green-100 text-green-700 font-semibold rounded-lg hover:bg-green-200 transition-colors">Accept</button>
                  )}
                  {(o.status === "Pending" || o.status === "Active") && (
                    <button onClick={async () => { await whmcsAdmin("adminCancelOrder", { orderId: o.id }); fetch_(); }} className="text-xs px-2.5 py-1 bg-red-100 text-red-700 font-semibold rounded-lg hover:bg-red-200 transition-colors">Cancel</button>
                  )}
                  {o.status !== "Fraud" && (
                    <button onClick={() => markFraud(o)} title="Mark as fraud" className="text-gray-400 hover:text-red-600"><AlertTriangle className="w-4 h-4" /></button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </TableCard>
      <Pagination page={page} total={total} perPage={PER} onChange={setPage} />

      {viewOrderId !== null && <OrderDetailModal orderId={viewOrderId} onClose={() => setViewOrderId(null)} />}
    </div>
  );
}
