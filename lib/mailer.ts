// Shared SMTP transport — extracted from the reset-password route's inline
// nodemailer setup so Mass Email / test-send don't duplicate it a third time.
import nodemailer from "nodemailer";
import { config } from "@/lib/config";

export function smtpConfigured(): boolean {
  return Boolean(config.smtpPass);
}

export async function sendSmtpMail(to: string, subject: string, text: string, html?: string): Promise<boolean> {
  if (!smtpConfigured()) {
    console.warn("[mailer] SMTP_PASS not set — skipping send");
    return false;
  }
  try {
    const transporter = nodemailer.createTransport({
      host: config.smtpHost, port: config.smtpPort, secure: config.smtpPort === 465,
      auth: { user: config.smtpUser, pass: config.smtpPass },
    });
    await transporter.sendMail({
      from: "The B.Shop Africa <admin@bshopafrica.com>", to, replyTo: "admin@bshopafrica.com",
      subject, text, html: html ?? `<p>${text.replace(/\n/g, "<br/>")}</p>`,
    });
    return true;
  } catch (e) {
    console.error("[mailer] SMTP send failed:", e);
    return false;
  }
}
