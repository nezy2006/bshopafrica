# WHMCS Integration Setup Guide

## 1. Enable AutoAuth (Single Sign-On)

AutoAuth allows clients to click "Login to cPanel" in their dashboard and be automatically logged into the WHMCS client area without re-entering credentials.

### Steps:
1. Log in to WHMCS Admin Panel → **Setup → General Settings → Security**
2. Scroll to **"AutoAuth Key"**
3. If empty, click **Generate** to create a key
4. Copy the key value
5. Add to your server's `.env.local`:
   ```
   WHMCS_AUTOAUTH_KEY=your_autoauth_key_here
   ```
6. Restart the Node.js server after updating `.env.local`

---

## 2. Frontend Redirect Hook

To redirect clients from WHMCS back to your frontend (bshopafrica.com) after login, create this hook file on your server:

**File:** `/billing/includes/hooks/frontend_redirect.php`

```php
<?php

add_hook('ClientAreaPageLogin', 1, function($vars) {
    // After successful login, redirect to the frontend dashboard
    if (isset($_SESSION['uid']) && $_SESSION['uid'] > 0) {
        header('Location: https://bshopafrica.com/dashboard');
        exit();
    }
});

add_hook('ClientLogin', 1, function($vars) {
    // Log the client in and redirect to frontend
    $clientId = $vars['userid'];
    $email    = $vars['email'];
    // You can store session data here if needed
});
```

---

## 3. API IP Whitelist

WHMCS restricts API access by IP address. Without whitelisting, all API calls return a 403 error.

### Steps:
1. WHMCS Admin → **Configuration → System Settings → General Settings → Security**
2. Find **"API IP Access Restriction"**
3. Add your server's public IP address
4. To find your server IP: `curl https://api.ipify.org` on the server
5. For development: add your local/office IP too
6. Click **Save Changes**

---

## 4. Email Notification Setup

Configure WHMCS to send proper email notifications:

1. WHMCS Admin → **Setup → General Settings → Mail**
2. Set **Mail Type** to SMTP (recommended for deliverability)
3. Configure SMTP settings:
   - **SMTP Host:** mail.bshopafrica.com (or your mail server)
   - **SMTP Port:** 587 (TLS) or 465 (SSL)
   - **SMTP Username:** noreply@bshopafrica.com
   - **SMTP Password:** your email password
   - **From Email:** noreply@bshopafrica.com
   - **From Name:** The B.Shop

### Enable These Email Templates:
- **Support → New Ticket Open** (client confirmation on ticket creation)
- **Support → Ticket Reply** (notification when staff replies)
- **Billing → Invoice Created** (invoice notification)
- **Billing → Invoice Payment Confirmation** (payment receipt)
- **Orders → New Order** (order confirmation)
- **Services → Domain Registration** (domain confirmation)

---

## 5. Support Departments

The contact form and dashboard submit tickets to department ID 1 (Technical Support by default).

To update department IDs:
1. WHMCS Admin → **Support → Support Departments**
2. Note the IDs next to each department
3. Update `app/api/contact/route.ts` and `app/api/whmcs/route.ts` accordingly

Default mapping:
- `deptid: 1` → Technical Support
- `deptid: 2` → Billing
- `deptid: 3` → General Inquiries

---

## 6. Environment Variables Reference

```env
# WHMCS API
WHMCS_URL=https://bshopafrica.com/billing
WHMCS_IDENTIFIER=your_api_identifier
WHMCS_SECRET=your_api_secret
WHMCS_AUTOAUTH_KEY=your_autoauth_key

# Database (MySQL on hosting server)
DATABASE_URL=mysql://username:password@localhost:3306/database_name

# Server
PORT=3000
NODE_ENV=production
```

---

## 7. WordPress Blog Integration (Future)

When ready to connect WordPress for the Digital Campfire blog:

1. Install WordPress at `https://bshopafrica.com/blog/`
2. Enable REST API (enabled by default in WP 4.7+)
3. Update `app/(main)/digital-campfire/page.tsx`:

```typescript
// Replace static ARTICLES array with:
const res = await fetch('https://bshopafrica.com/blog/wp-json/wp/v2/posts?per_page=6');
const articles = await res.json();
```

---

## 8. Tawk.to Live Chat

1. Sign up at [https://dashboard.tawk.to](https://dashboard.tawk.to)
2. Create a new property for bshopafrica.com
3. Go to **Administration → Chat Widget** and copy your Property ID
4. Update `components/TawkChat.tsx`:
   ```typescript
   const TAWK_PROPERTY_ID = "your_actual_property_id";
   ```
5. Rebuild and redeploy
