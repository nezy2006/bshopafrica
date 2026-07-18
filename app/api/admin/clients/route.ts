import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isAdminUnauthorized } from "@/lib/admin-auth";
import { getAdminClients, getClientDetails, getClientProducts, getClientDomains, type AdminClient } from "@/lib/whmcs";

export interface EnrichedClient extends AdminClient {
  balance: string; lastlogin: string; servicesCount: number; domainsCount: number;
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req, "clients");
  if (isAdminUnauthorized(admin)) return admin;

  const { searchParams } = new URL(req.url);
  const limitstart = Number(searchParams.get("limitstart") ?? 0);
  const limitnum   = Number(searchParams.get("limitnum") ?? 20);
  const search     = searchParams.get("search") ?? "";

  const { clients, total } = await getAdminClients(limitstart, limitnum, search);

  // One page (<=20 rows by convention) worth of per-client detail lookups run
  // concurrently — WHMCS's list APIs don't return balance/lastlogin/counts in bulk.
  const enriched: EnrichedClient[] = await Promise.all(
    clients.map(async c => {
      const [details, products, domains] = await Promise.all([
        getClientDetails(c.id).catch(() => null),
        getClientProducts(c.id).catch(() => []),
        getClientDomains(c.id).catch(() => []),
      ]);
      return {
        ...c,
        balance: details?.credit ?? "0.00",
        lastlogin: details?.lastlogin ?? "",
        servicesCount: products.length,
        domainsCount: domains.length,
      };
    })
  );

  return NextResponse.json({ success: true, data: { clients: enriched, total } });
}
