export const config = {
  whmcsUrl: process.env.WHMCS_URL || 'https://bshopafrica.com/billing',
  whmcsIdentifier: process.env.WHMCS_IDENTIFIER || 'XOzQQWD7BneW7NWNIpATh0wW0YWtaIlg',
  whmcsSecret: process.env.WHMCS_SECRET || 'pkL8ESq1jUzXSjuUBPnPfgquaQPCEZnT',
  pawapayApiKey: process.env.PAWAPAY_API_KEY || '',
  pawapayEnvironment: process.env.PAWAPAY_ENVIRONMENT || 'production',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
  databaseUrl: process.env.DATABASE_URL || 'mysql://bshopafrica_cms_admin:qLinT{aOE%fS@localhost:3306/bshopafrica_cms',
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://test.bshopafrica.com',
  websiteBuilderProductId: process.env.WEBSITE_BUILDER_PRODUCT_ID || '34',
}
