import { NextRequest, NextResponse } from "next/server";
import { resolveReferralCode } from "@/lib/affiliate-store";
import { getAffiliateById } from "@/lib/whmcs";

// Public/unauthenticated — used by the checkout page to confirm a referral
// code before it's applied. Never errors on a bad code; it just reports
// { valid: false } so a stale/mistyped code never blocks checkout.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")?.trim() ?? "";
  if (!code) return NextResponse.json({ valid: false });

  const clientIdParam = req.nextUrl.searchParams.get("clientId");
  const clientId = clientIdParam ? Number(clientIdParam) : null;

  try {
    const affiliateId = await resolveReferralCode(code);
    if (!affiliateId) return NextResponse.json({ valid: false });

    const affiliate = await getAffiliateById(affiliateId);
    if (!affiliate) return NextResponse.json({ valid: false });

    // Self-referral: the logged-in client is trying to use their own code.
    if (clientId && affiliate.clientId === clientId) {
      return NextResponse.json({ valid: false, error: "You cannot use your own referral code" });
    }

    return NextResponse.json({
      valid: true,
      affiliateName: affiliate.firstname || `Affiliate #${affiliateId}`,
      affid: affiliateId,
    });
  } catch (e) {
    console.error("[api/affiliate/validate]", e);
    return NextResponse.json({ valid: false });
  }
}
