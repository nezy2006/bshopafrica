export const config = {
  whmcsUrl: process.env.WHMCS_URL || 'https://bshopafrica.com/billing',
  whmcsIdentifier: process.env.WHMCS_IDENTIFIER || 'XOzQQWD7BneW7NWNIpATh0wW0YWtaIlg',
  whmcsSecret: process.env.WHMCS_SECRET || 'pkL8ESq1jUzXSjuUBPnPfgquaQPCEZnT',
  pawapayApiKey: process.env.PAWAPAY_API_KEY || '',
  pawapayEnvironment: process.env.PAWAPAY_ENVIRONMENT || 'production',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
  databaseUrl: process.env.DATABASE_URL || 'mysql://bshopafrica_cms_admin:qLinT{aOE%fS@localhost:3306/bshopafrica_cms',
  // Direct WHMCS database fallback for password read/write (lib/whmcs-db.ts).
  // Unset by default — feature is a no-op until this is explicitly configured.
  // NEVER hardcode a fallback value here; this is production DB credentials.
  whmcsDbUrl: process.env.WHMCS_DB_URL || '',
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://bshopafrica.com',
  websiteBuilderProductId: process.env.WEBSITE_BUILDER_PRODUCT_ID || '34',
  smtpHost: process.env.SMTP_HOST || 'mail.bshopafrica.com',
  smtpPort: parseInt(process.env.SMTP_PORT || '465', 10),
  smtpUser: process.env.SMTP_USER || 'admin@bshopafrica.com',
  smtpPass: process.env.SMTP_PASS || 'qLinT{aOE%fS',
  whmHost: process.env.WHM_HOST || 'https://s12759.usc1.stableserver.net:2087',
  whmUser: process.env.WHM_USER || 'bshopafrica',
  whmToken: process.env.WHM_TOKEN || 'GDFFJ2O94Q3EBRWM0I3EJIU9TRZ9GZL6',
  paypalClientId: process.env.PAYPAL_CLIENT_ID || 'BAA0p9XJO6gvgll1226UD07h7JmurHzuLrprmda1iSzKBAmTHQzSkYH4LIjA7fJKsiYpL2kmP6dJTusa3M',
  paypalClientSecret: process.env.PAYPAL_CLIENT_SECRET || 'EABPJfE9_Qnn9fFVUdC4us4_oT5TZzF4JA08GU0sQO7A0eoNAypbsap-HL_tM0MRAFKDD3j6E6HT3Do-',
  paypalEnvironment: process.env.PAYPAL_ENVIRONMENT || 'live',
}
