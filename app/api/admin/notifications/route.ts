import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isAdminUnauthorized } from "@/lib/admin-auth";
import { getRecentNotifications, getNotificationsLastSeenId, markNotificationsSeen } from "@/lib/admin-notifications";
import { getAdminHosting, getAdminDomains } from "@/lib/whmcs";

async function getExpiringSoon(): Promise<{ label: string; link: string }[]> {
  const cutoff = Date.now() + 3 * 24 * 60 * 60 * 1000;
  const [{ hosting }, { domains }] = await Promise.all([
    getAdminHosting(0, 300, "Active").catch(() => ({ hosting: [] })),
    getAdminDomains(0, 300).catch(() => ({ domains: [] })),
  ]);
  const items: { label: string; link: string }[] = [];
  for (const h of hosting) {
    const t = new Date(h.nextduedate).getTime();
    if (!isNaN(t) && t <= cutoff && t >= Date.now() - 24 * 60 * 60 * 1000) {
      items.push({ label: `Hosting for ${h.domain || h.firstname + " " + h.lastname} due ${h.nextduedate}`, link: "/admin/products" });
    }
  }
  for (const d of domains) {
    const t = new Date(d.expirydate).getTime();
    if (!isNaN(t) && t <= cutoff && t >= Date.now() - 24 * 60 * 60 * 1000) {
      items.push({ label: `${d.domainname} expires ${d.expirydate}`, link: "/admin/domains" });
    }
  }
  return items.slice(0, 20);
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (isAdminUnauthorized(admin)) return admin;

  const [notifications, lastSeenId, expiringSoon] = await Promise.all([
    getRecentNotifications(30),
    getNotificationsLastSeenId(admin.id),
    getExpiringSoon().catch(() => []),
  ]);
  const unreadCount = notifications.filter(n => n.id > lastSeenId).length;

  return NextResponse.json({ success: true, data: { notifications, unreadCount, expiringSoon, lastSeenId } });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (isAdminUnauthorized(admin)) return admin;

  const notifications = await getRecentNotifications(1);
  const maxId = notifications[0]?.id ?? 0;
  await markNotificationsSeen(admin.id, maxId);
  return NextResponse.json({ success: true });
}
