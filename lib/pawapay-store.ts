// In-memory store for pending PawaPay deposits.
// Holds full cart context so the callback can create the WHMCS order autonomously.
// Works in long-running Node.js deployments; not suitable for serverless edge functions.

export interface DepositRecord {
  clientId:      string;
  clientEmail:   string;
  cartItems:     unknown[]; // CartItem[] serialised to plain objects
  totalUSD:      number;
  totalRWF:      number;
  phone?:        string;    // MSISDN in international format, e.g. 250785094435
  provider?:     string;    // PawaPay provider code, e.g. MTN_MOMO_RWA
  invoiceId?:    number;    // set for direct invoice payments (renewals) — callback skips order creation
  createdAt:     number;    // Date.now()
  status?:       string;    // set by the callback route on terminal failure, for debugging/audit
  failureReason?: string;   // PawaPay failureCode (e.g. NOT_ENOUGH_FUNDS) — status/route.ts reads this live from PawaPay instead, this is a secondary record
}

export const depositStore = new Map<string, DepositRecord>();

/** Remove entries older than 24 hours. */
export function cleanupDeposits(): void {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  for (const [key, val] of depositStore) {
    if (val.createdAt < cutoff) depositStore.delete(key);
  }
}
