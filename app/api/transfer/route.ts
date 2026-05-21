import { NextRequest, NextResponse } from "next/server";
import { BSHOP_NAMESERVERS } from "@/lib/whmcs";

async function callWhmcs(action: string, params: Record<string, string | number>) {
  const url        = process.env.WHMCS_URL        ?? "";
  const identifier = process.env.WHMCS_IDENTIFIER ?? "";
  const secret     = process.env.WHMCS_SECRET     ?? "";
  const body = new URLSearchParams({
    identifier, secret, action, responsetype: "json",
    ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
  });
  const res  = await fetch(`${url}/includes/api.php`, {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(), cache: "no-store",
  });
  return res.json() as Promise<Record<string, unknown>>;
}

function parseDomain(raw: string): { name: string; tld: string; full: string } | null {
  const s = raw.toLowerCase().replace(/https?:\/\//g, "").replace(/\//g, "").trim();
  const dot = s.indexOf(".");
  if (dot < 1) return null;
  const name = s.slice(0, dot);
  const tld  = s.slice(dot); // e.g. ".com" or ".co.rw"
  return { name, tld, full: s };
}

export async function POST(req: NextRequest) {
  let action = "", domain = "", authCode = "";
  try {
    const body = (await req.json()) as Record<string, string>;
    action   = body.action   ?? "";
    domain   = body.domain   ?? "";
    authCode = body.authCode ?? "";
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  /* ── checkTransfer ── */
  if (action === "checkTransfer") {
    const parsed = parseDomain(domain);
    if (!parsed) return NextResponse.json({ success: false, error: "Invalid domain name" }, { status: 400 });

    try {
      // Get TLD pricing
      const pricing = await callWhmcs("GetTLDPricing", { currencyid: 1 });
      const pricingMap = pricing.pricing as Record<string, Record<string, Record<string, string>>> | undefined;
      const tldKey = parsed.tld.replace(/^\./, ""); // strip leading dot
      const transferPrice = parseFloat(pricingMap?.[tldKey]?.transfer?.["1"] ?? "0");
      const supported = transferPrice > 0;

      // Check domain exists via WHOIS
      let exists = true;
      try {
        const whois = await callWhmcs("DomainWhois", { domain: parsed.full });
        exists = String(whois.status ?? "").toLowerCase() !== "available";
      } catch { /* assume exists if WHOIS fails */ }

      if (!supported) {
        return NextResponse.json({
          success: true,
          eligible: false,
          domain: parsed.full,
          tld: parsed.tld,
          transferPrice: 0,
          currency: "USD",
          message: `Sorry, we don't currently support transfers for ${parsed.tld} domains. Please contact support.`,
        });
      }

      if (!exists) {
        return NextResponse.json({
          success: true,
          eligible: false,
          domain: parsed.full,
          tld: parsed.tld,
          transferPrice,
          currency: "USD",
          message: "This domain doesn't appear to be registered. You can register it instead.",
        });
      }

      return NextResponse.json({
        success: true,
        eligible: true,
        domain:   parsed.full,
        tld:      parsed.tld,
        transferPrice: transferPrice > 0 ? transferPrice : 14.99,
        currency: "USD",
        nameservers: Object.values(BSHOP_NAMESERVERS),
        message: `Great! ${parsed.full} is eligible for transfer. The fee covers one year of renewal.`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Check failed";
      console.error("[/api/transfer] checkTransfer:", msg);
      // Graceful fallback — return eligible with a placeholder price
      const parsed2 = parseDomain(domain)!;
      return NextResponse.json({
        success: true,
        eligible: true,
        domain:   parsed2.full,
        tld:      parsed2.tld,
        transferPrice: 14.99,
        currency: "USD",
        nameservers: Object.values(BSHOP_NAMESERVERS),
        message: `${parsed2.full} appears eligible for transfer. Price shown is an estimate.`,
      });
    }
  }

  /* ── addTransferToCart (validation only — actual save happens client-side) ── */
  if (action === "addTransferToCart") {
    if (!domain || !authCode) {
      return NextResponse.json({ success: false, error: "Domain and auth code are required" }, { status: 400 });
    }
    const parsed = parseDomain(domain);
    if (!parsed) return NextResponse.json({ success: false, error: "Invalid domain" }, { status: 400 });

    return NextResponse.json({
      success: true,
      cartItem: {
        id:            `transfer_${parsed.full}`,
        type:          "transfer",
        domain:        parsed.full,
        tld:           parsed.tld,
        authCode,
        nameservers:   Object.values(BSHOP_NAMESERVERS),
      },
    });
  }

  return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
}
