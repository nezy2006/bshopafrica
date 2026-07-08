export interface ResetTokenRecord {
  clientId: number;
  email:    string;
  expiry:   number;
}

// Process-level singleton so the request and confirm routes share the same store
declare global {
  // eslint-disable-next-line no-var
  var __bshopResetTokenStore: Map<string, ResetTokenRecord> | undefined;
}

export const resetTokenStore: Map<string, ResetTokenRecord> =
  globalThis.__bshopResetTokenStore ??
  (globalThis.__bshopResetTokenStore = new Map<string, ResetTokenRecord>());

/** Remove expired tokens. */
export function cleanupResetTokens(): void {
  const now = Date.now();
  for (const [token, rec] of resetTokenStore) {
    if (rec.expiry < now) resetTokenStore.delete(token);
  }
}
