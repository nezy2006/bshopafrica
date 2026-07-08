// In-memory store for pending PawaPay deposits.
// Holds full cart context so the callback can create the WHMCS order autonomously.
// Works in long-running Node.js deployments; not suitable for serverless edge functions.

export interface DepositRecord {
  clientId:    string;
  clientEmail: string;
  cartItems:   unknown[]; // CartItem[] serialised to plain objects
  totalUSD:    number;
  totalRWF:    number;
  invoiceId?:  number;    // set for direct invoice payments (renewals) — callback skips order creation
  createdAt:   number;   // Date.now()
}

export const depositStore = new Map<string, DepositRecord>();

/** Remove entries older than 24 hours. */
export function cleanupDeposits(): void {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  for (const [key, val] of depositStore) {
    if (val.createdAt < cutoff) depositStore.delete(key);
  }
}
