// In-memory deposit → WHMCS invoice/order mapping for callback reconciliation.
// Survives server restarts only in long-running Node.js deployments (not serverless).
export const depositStore = new Map<string, { invoiceId: number; orderId: number; amount: number }>();
