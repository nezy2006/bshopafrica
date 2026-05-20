"use client";

import { useState, useEffect, useCallback } from "react";
import { whmcsAdmin, PageHeader, SearchBar, TableCard, THead, SkeletonRows, Badge, Pagination, EmptyState } from "@/lib/admin-utils";
import type { AdminOrder } from "@/lib/whmcs";

const PER = 20;

export default function OrdersPage() {
  const [orders,  setOrders]  = useState<AdminOrder[]>([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [search,  setSearch]  = useState("");
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const res = await whmcsAdmin<{ orders: AdminOrder[]; total: number }>(
      "adminGetOrders", { limitstart: (page - 1) * PER, limitnum: PER }
    );
    if (res) { setOrders(res.orders); setTotal(res.total); }
    setLoading(false);
  }, [page]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const filtered = search
    ? orders.filter(o => `${o.firstname} ${o.lastname} ${o.id}`.toLowerCase().includes(search.toLowerCase()))
    : orders;

  return (
    <div>
      <PageHeader title="Orders" subtitle={`${total} total orders`} />
      <SearchBar value={search} onChange={setSearch} placeholder="Search by client name or order ID…" />

      <TableCard>
        <THead cols={["Order ID", "Client", "Amount", "Currency", "Date", "Status"]} />
        <tbody>
          {loading ? <SkeletonRows cols={6} /> : filtered.length === 0 ? <EmptyState icon="🛒" message="No orders found" /> : filtered.map(o => (
            <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <td className="px-5 py-3.5 font-bold text-[#6B21A8]">#{o.id}</td>
              <td className="px-5 py-3.5 font-medium text-black">{o.firstname} {o.lastname}</td>
              <td className="px-5 py-3.5 font-semibold">${o.amount}</td>
              <td className="px-5 py-3.5 text-gray-500">{o.currencycode}</td>
              <td className="px-5 py-3.5 text-gray-500">{o.date}</td>
              <td className="px-5 py-3.5"><Badge status={o.status} /></td>
            </tr>
          ))}
        </tbody>
      </TableCard>
      <Pagination page={page} total={total} perPage={PER} onChange={setPage} />
    </div>
  );
}
