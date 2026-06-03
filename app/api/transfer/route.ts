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
    if (!parsed) return NextResponse.json({ success: false, error: "Invalid domain name — please enter a full domain like example.com" }, { status: 400 });

    console.log("[/api/transfer] checkTransfer:", parsed.full);

    try {
      // Get TLD pricing from WHMCS
      const pricing = await callWhmcs("GetTLDPricing", { currencyid: 1 });
      console.log("[/api/transfer] GetTLDPricing result:", pricing.result);

      if (pricing.result !== "success") {
        console.error("[/api/transfer] GetTLDPricing failed:", pricing);
        return NextResponse.json({
          success: false,
          error: "Unable to verify transfer eligibility right now. Please try again in a moment.",
        }, { status: 502 });
      }

      const pricingMap = pricing.pricing as Record<string, Record<string, Record<string, string>>> | undefined;
      const tldKey = parsed.tld.replace(/^\./, ""); // strip leading dot: ".com" → "com"
      const transferPrice = parseFloat(pricingMap?.[tldKey]?.transfer?.["1"] ?? "0");
      const supported = transferPrice > 0;

      console.log("[/api/transfer] tldKey:", tldKey, "transferPrice:", transferPrice, "supported:", supported);

      if (!supported) {
        return NextResponse.json({
          success: true,
          eligible: false,
          domain: parsed.full,
          tld: parsed.tld,
          transferPrice: 0,
          currency: "USD",
          message: `We don't currently support transfers for .${tldKey} domains. Please contact support or register a new domain instead.`,
        });
      }

      // Check domain exists via WHOIS (best-effort — don't fail if WHOIS is unavailable)
      let exists = true;
      try {
        const whois = await callWhmcs("DomainWhois", { domain: parsed.full });
        console.log("[/api/transfer] DomainWhois status:", whois.status);
        exists = String(whois.status ?? "").toLowerCase() !== "available";
      } catch (e) {
        console.warn("[/api/transfer] DomainWhois failed (ignored):", e instanceof Error ? e.message : e);
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
        domain:        parsed.full,
        tld:           parsed.tld,
        transferPrice,
        currency:      "USD",
        nameservers:   Object.values(BSHOP_NAMESERVERS),
        message:       `${parsed.full} is eligible for transfer. The fee includes one year of renewal.`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[/api/transfer] checkTransfer exception:", msg);
      return NextResponse.json({
        success: false,
        error: "Unable to verify this domain. Please try again or contact support if the problem continues.",
      }, { status: 500 });
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
