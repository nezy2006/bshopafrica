// Every credential below reads from the environment ONLY — no hardcoded
// fallback values. This file is committed to source control; a missing env
// var must fail loudly at call time, not silently fall back to a real secret
// baked into the repo. Non-sensitive defaults (public URLs, hostnames) are
// fine to keep as fallbacks.
export const config = {
  whmcsUrl: process.env.WHMCS_URL || 'https://bshopafrica.com/billing',
  whmcsIdentifier: process.env.WHMCS_IDENTIFIER || '',
  whmcsSecret: process.env.WHMCS_SECRET || '',
  pawapayApiKey: process.env.PAWAPAY_API_KEY || '',
  pawapayEnvironment: process.env.PAWAPAY_ENVIRONMENT || 'production',
  adminPassword: process.env.ADMIN_PASSWORD || '',
  databaseUrl: process.env.DATABASE_URL || '',
  // Direct WHMCS database fallback for password read/write (lib/whmcs-db.ts).
  // Unset by default — feature is a no-op until this is explicitly configured.
  whmcsDbUrl: process.env.WHMCS_DB_URL || '',
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://bshopafrica.com',
  websiteBuilderProductId: process.env.WEBSITE_BUILDER_PRODUCT_ID || '34',
  smtpHost: process.env.SMTP_HOST || 'mail.bshopafrica.com',
  smtpPort: parseInt(process.env.SMTP_PORT || '465', 10),
  smtpUser: process.env.SMTP_USER || 'admin@bshopafrica.com',
  smtpPass: process.env.SMTP_PASS || '',
  whmHost: process.env.WHM_HOST || 'https://s12759.usc1.stableserver.net:2087',
  whmUser: process.env.WHM_USER || 'bshopafrica',
  whmToken: process.env.WHM_TOKEN || '',
  paypalClientId: process.env.PAYPAL_CLIENT_ID || '',
  paypalClientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
  paypalEnvironment: process.env.PAYPAL_ENVIRONMENT || 'live',
}
