import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isAdminUnauthorized, logAdminActivity, getRequestIp } from "@/lib/admin-auth";
import { getAdminClients, getExpiringClientContacts, sendClientEmail } from "@/lib/whmcs";
import { sendSmtpMail } from "@/lib/mailer";

const MAX_RECIPIENTS = 500;
const BATCH_SIZE = 5;

type Filter = "all" | "hosting_expiring" | "domains_expiring" | "custom";

async function runInBatches<T>(items: T[], size: number, fn: (item: T) => Promise<boolean>): Promise<{ sent: number; failed: number }> {
  let sent = 0, failed = 0;
  for (let i = 0; i < items.length; i += size) {
    const batch = items.slice(i, i + size);
    const results = await Promise.allSettled(batch.map(fn));
    for (const r of results) {
      if (r.status === "fulfilled" && r.value) sent++; else failed++;
    }
  }
  return { sent, failed };
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req, "emails");
  if (isAdminUnauthorized(admin)) return admin;

  const body = (await req.json()) as { filter?: Filter; customEmails?: string[]; subject?: string; message?: string };
  const subject = (body.subject ?? "").trim();
  const message = (body.message ?? "").trim();
  if (!subject || !message) return NextResponse.json({ success: false, error: "Subject and message are required" }, { status: 400 });

  const filter: Filter = body.filter ?? "all";
  let result: { sent: number; failed: number };

  if (filter === "custom") {
    const emails = (body.customEmails ?? []).map(e => e.trim()).filter(Boolean).slice(0, MAX_RECIPIENTS);
    if (emails.length === 0) return NextResponse.json({ success: false, error: "No recipient emails provided" }, { status: 400 });
    result = await runInBatches(emails, BATCH_SIZE, email => sendSmtpMail(email, subject, message));
  } else {
    let recipients: { id: number }[];
    if (filter === "all") {
      const { clients } = await getAdminClients(0, MAX_RECIPIENTS);
      recipients = clients;
    } else {
      recipients = await getExpiringClientContacts(filter === "hosting_expiring" ? "hosting" : "domain", 30);
    }
    recipients = recipients.slice(0, MAX_RECIPIENTS);
    if (recipients.length === 0) return NextResponse.json({ success: false, error: "No matching recipients found" }, { status: 400 });
    result = await runInBatches(recipients, BATCH_SIZE, r => sendClientEmail(r.id, subject, message).then(() => true).catch(() => false));
  }

  await logAdminActivity(admin.id, "mass_email", `filter=${filter} sent=${result.sent} failed=${result.failed}`, getRequestIp(req));
  return NextResponse.json({ success: true, data: result });
}
