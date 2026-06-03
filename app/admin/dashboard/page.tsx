"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { whmcsAdmin, StatCard, BarChart, Badge, SkeletonRows, THead, TableCard } from "@/lib/admin-utils";
import type { AdminStats, AdminOrder, AdminClient } from "@/lib/whmcs";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function Icon({ d }: { d: string }) {
  return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={d} strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

export default function AdminDashboard() {
  const [stats,   setStats]   = useState<AdminStats | null>(null);
  const [orders,  setOrders]  = useState<AdminOrder[]>([]);
  const [clients, setClients] = useState<AdminClient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      whmcsAdmin<AdminStats>("adminGetStats"),
      whmcsAdmin<{ orders: AdminOrder[] }>("adminGetOrders", { limitstart: 0, limitnum: 8 }),
      whmcsAdmin<{ clients: AdminClient[] }>("adminGetClients", { limitstart: 0, limitnum: 8 }),
    ]).then(([s, o, c]) => {
      if (s) setStats(s);
      if (o) setOrders(o.orders);
      if (c) setClients(c.clients);
      setLoading(false);
    });
  }, []);

  const now = new Date();
  const chartData = MONTHS.map((key, i) => ({
    key,
    value: i === now.getMonth() ? parseFloat(stats?.income_thismonth ?? "0") : 0,
  }));

  const weekData = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((key, i) => ({
    key,
    value: i < 5 ? Math.round((stats?.orders_thismonth ?? 0) / 5) : 0,
  }));

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-black text-black">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">{now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {loading ? Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse"><div className="w-11 h-11 rounded-xl bg-gray-100 mb-3"/><div className="h-3 bg-gray-100 rounded mb-2 w-3/4"/><div className="h-7 bg-gray-100 rounded w-1/2"/></div>
        )) : (<>
          <StatCard label="Total Clients"   value={stats?.clients_total ?? 0}       color="purple" sub="registered" icon={<Icon d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/>}/>
          <StatCard label="Orders/Month"    value={stats?.orders_thismonth ?? 0}     color="blue"   sub="this month"  icon={<Icon d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z M3 6h18 M16 10a4 4 0 0 1-8 0"/>}/>
          <StatCard label="Revenue/Month"   value={`$${stats?.income_thismonth ?? "0"}`} color="green" sub="USD"   icon={<Icon d="M12 2v20 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>}/>
          <StatCard label="Active Clients"  value={stats?.clients_active ?? 0}       color="orange" sub="active"     icon={<Icon d="M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4 12 14.01l-3-3"/>}/>
          <StatCard label="Open Tickets"    value={stats?.tickets_open ?? 0}         color="red"    sub="need reply"  icon={<Icon d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z M9 12h6"/>}/>
          <StatCard label="Pending Orders"  value={stats?.orders_pending ?? 0}       color="purple" sub="awaiting"   icon={<Icon d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>}/>
        </>)}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <BarChart data={chartData} label="Monthly Revenue (USD)" />
        <BarChart data={weekData}  label="Orders This Week" />
      </div>

      {/* Tables */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-black text-sm">Recent Orders</h2>
            <a href="/admin/orders" className="text-xs text-[#6B21A8] font-semibold hover:underline">View all →</a>
          </div>
          <TableCard>
            <THead cols={["ID", "Client", "Amount", "Status"]} />
            <tbody>
              {loading ? <SkeletonRows cols={4} rows={6} /> : orders.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-gray-400 text-sm">No orders yet</td></tr>
              ) : orders.map(o => (
                <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-bold text-[#6B21A8]">#{o.id}</td>
                  <td className="px-5 py-3 text-gray-700">{o.firstname} {o.lastname}</td>
                  <td className="px-5 py-3 font-semibold">${o.amount}</td>
                  <td className="px-5 py-3"><Badge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </TableCard>
        </div>

        {/* Recent clients */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-black text-sm">Recent Clients</h2>
            <a href="/admin/clients" className="text-xs text-[#6B21A8] font-semibold hover:underline">View all →</a>
          </div>
          <TableCard>
            <THead cols={["Name", "Email", "Country", "Status"]} />
            <tbody>
              {loading ? <SkeletonRows cols={4} rows={6} /> : clients.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-gray-400 text-sm">No clients yet</td></tr>
              ) : clients.map(c => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-semibold text-black">{c.firstname} {c.lastname}</td>
                  <td className="px-5 py-3 text-gray-500 text-xs">{c.email}</td>
                  <td className="px-5 py-3 text-gray-500">{c.country || "—"}</td>
                  <td className="px-5 py-3"><Badge status={c.status} /></td>
                </tr>
              ))}
            </tbody>
          </TableCard>
        </div>
      </div>
    </div>
  );
}
