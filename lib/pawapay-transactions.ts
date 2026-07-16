import { query, execute } from "@/lib/db";

let schemaReady: Promise<void> | null = null;

export function ensurePawapayTransactionsSchema(): Promise<void> {
  if (!schemaReady) schemaReady = migrate();
  return schemaReady;
}

async function migrate() {
  await execute(`
    CREATE TABLE IF NOT EXISTS pawapay_transactions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      deposit_id VARCHAR(64) UNIQUE NOT NULL,
      client_id VARCHAR(32),
      client_email VARCHAR(255),
      phone VARCHAR(32),
      provider VARCHAR(64),
      amount_usd DECIMAL(10,2) DEFAULT 0,
      amount_local DECIMAL(14,2) DEFAULT 0,
      currency VARCHAR(8) DEFAULT 'RWF',
      status VARCHAR(32) NOT NULL,
      failure_reason VARCHAR(255),
      invoice_id INT,
      order_ids VARCHAR(255),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

export interface PawapayTransactionInput {
  depositId: string; clientId?: string; clientEmail?: string; phone?: string; provider?: string;
  amountUSD?: number; amountLocal?: number; currency?: string; status: string;
  failureReason?: string; invoiceId?: number; orderIds?: number[];
}

export async function recordPawapayTransaction(t: PawapayTransactionInput): Promise<void> {
  await ensurePawapayTransactionsSchema();
  await execute(
    `INSERT INTO pawapay_transactions
       (deposit_id, client_id, client_email, phone, provider, amount_usd, amount_local, currency, status, failure_reason, invoice_id, order_ids)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       status = VALUES(status), failure_reason = VALUES(failure_reason),
       invoice_id = VALUES(invoice_id), order_ids = VALUES(order_ids)`,
    [
      t.depositId, t.clientId ?? null, t.clientEmail ?? null, t.phone ?? null, t.provider ?? null,
      t.amountUSD ?? 0, t.amountLocal ?? 0, t.currency ?? "RWF", t.status,
      t.failureReason ?? null, t.invoiceId ?? null, t.orderIds?.join(",") ?? null,
    ]
  );
}

export interface PawapayTransactionRow {
  id: number; deposit_id: string; client_id: string | null; client_email: string | null;
  phone: string | null; provider: string | null; amount_usd: string; amount_local: string;
  currency: string; status: string; failure_reason: string | null; invoice_id: number | null;
  order_ids: string | null; created_at: string;
}

export async function getPawapayTransactions(limit = 200): Promise<PawapayTransactionRow[]> {
  await ensurePawapayTransactionsSchema();
  return query<PawapayTransactionRow>(
    "SELECT * FROM pawapay_transactions ORDER BY created_at DESC LIMIT ?",
    [limit]
  );
}
