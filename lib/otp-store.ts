export interface OtpEntry {
  code:         string;
  expiry:       number;
  requestCount: number;
  windowStart:  number;
}

// Process-level singleton so send-otp and verify-otp share the same store
declare global {
  // eslint-disable-next-line no-var
  var __bshopOtpStore: Map<string, OtpEntry> | undefined;
}

export const otpStore: Map<string, OtpEntry> =
  globalThis.__bshopOtpStore ??
  (globalThis.__bshopOtpStore = new Map<string, OtpEntry>());
