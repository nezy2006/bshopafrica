import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const NS = [
  "ns1.mysecurecloudhost.com",
  "ns2.mysecurecloudhost.com",
  "ns3.mysecurecloudhost.com",
  "ns4.mysecurecloudhost.com",
];

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface GenerateParams {
  businessName:    string;
  businessType:    string;
  location:        string;
  phone:           string;
  email:           string;
  tagline:         string;
  colorScheme:     string;
  pages:           string[];
  specialRequests: string;
}

interface DeployParams {
  clientId: number;
  domain:   string;
  siteData: string; // JSON string
}

/* ─── Color maps ─────────────────────────────────────────────────────────── */

const COLOR_MAP: Record<string, { primary: string; secondary: string; accent: string }> = {
  purple:     { primary: "#6B21A8", secondary: "#4c1d95", accent: "#c084fc" },
  blue:       { primary: "#1d4ed8", secondary: "#1e3a8a", accent: "#60a5fa" },
  green:      { primary: "#15803d", secondary: "#14532d", accent: "#4ade80" },
  "red/orange": { primary: "#ea580c", secondary: "#9a3412", accent: "#fb923c" },
  "black/dark": { primary: "#111827", secondary: "#030712", accent: "#6b7280" },
  "gold/yellow": { primary: "#b45309", secondary: "#92400e", accent: "#fbbf24" },
};

/* ─── HTML generation ────────────────────────────────────────────────────── */

function buildHomePage(data: Record<string, unknown>, businessName: string): string {
  const home = (data.pages as Record<string, unknown>)?.home as Record<string, unknown> ?? {};
  const footer = (data.footer as Record<string, unknown>) ?? {};
  const primary = String(data.colorPrimary ?? "#6B21A8");
  const secondary = String(data.colorSecondary ?? "#4c1d95");
  const accent = String(data.colorAccent ?? "#c084fc");
  const services = (home.services as Array<Record<string, string>>) ?? [];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${String(data.siteName ?? businessName)}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:system-ui,-apple-system,sans-serif;color:#111;}
    nav{background:${primary};padding:1rem 2rem;display:flex;align-items:center;justify-content:space-between;}
    nav .logo{color:#fff;font-weight:900;font-size:1.2rem;}
    nav .links{display:flex;gap:1.5rem;}
    nav .links a{color:rgba(255,255,255,.8);text-decoration:none;font-size:.9rem;font-weight:600;}
    nav .links a:hover{color:#fff;}
    .hero{background:linear-gradient(135deg,${secondary},${primary});color:#fff;padding:6rem 2rem;text-align:center;}
    .hero h1{font-size:3rem;font-weight:900;line-height:1.1;margin-bottom:1.5rem;}
    .hero p{font-size:1.2rem;opacity:.85;max-width:600px;margin:0 auto 2rem;}
    .hero a{display:inline-block;padding:.9rem 2.5rem;background:#fff;color:${primary};font-weight:700;border-radius:50px;text-decoration:none;font-size:1rem;}
    .hero a:hover{transform:translateY(-2px);box-shadow:0 8px 25px rgba(0,0,0,.2);}
    section{padding:5rem 2rem;}
    section h2{text-align:center;font-size:2rem;font-weight:900;margin-bottom:1rem;color:#111;}
    section .subtitle{text-align:center;color:#666;margin-bottom:3rem;}
    .about{background:#f9fafb;}
    .about-content{max-width:700px;margin:0 auto;text-align:center;color:#444;line-height:1.7;font-size:1.05rem;}
    .services-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1.5rem;max-width:1000px;margin:0 auto;}
    .service-card{background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:2rem;text-align:center;box-shadow:0 1px 8px rgba(0,0,0,.06);}
    .service-card:hover{transform:translateY(-4px);box-shadow:0 8px 30px rgba(0,0,0,.1);}
    .service-card .icon{width:48px;height:48px;border-radius:12px;background:${primary}20;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;font-size:1.5rem;}
    .service-card h3{font-weight:700;margin-bottom:.5rem;color:#111;}
    .service-card p{color:#666;font-size:.9rem;line-height:1.5;}
    .cta{background:linear-gradient(135deg,${secondary},${primary});color:#fff;text-align:center;}
    .cta h2{color:#fff;}
    .cta p{opacity:.85;margin-bottom:2rem;}
    .cta a{display:inline-block;padding:.9rem 2.5rem;background:#fff;color:${primary};font-weight:700;border-radius:50px;text-decoration:none;}
    footer{background:#111;color:#aaa;text-align:center;padding:2rem;font-size:.875rem;}
    footer .tagline{margin-bottom:.5rem;}
    @media(max-width:640px){.hero h1{font-size:2rem;}nav .links{display:none;}}
  </style>
</head>
<body>
  <nav>
    <div class="logo">${String(data.siteName ?? businessName)}</div>
    <div class="links">
      <a href="index.html">Home</a>
      <a href="about.html">About</a>
      <a href="services.html">Services</a>
      <a href="contact.html">Contact</a>
    </div>
  </nav>
  <div class="hero">
    <h1>${String(home.heroHeadline ?? businessName)}</h1>
    <p>${String(home.heroSubtext ?? String(data.tagline ?? ""))}</p>
    <a href="contact.html">${String(home.heroButtonText ?? "Get In Touch")}</a>
  </div>
  <section class="about">
    <h2>${String(home.aboutTitle ?? "About Us")}</h2>
    <div class="about-content"><p>${String(home.aboutText ?? "")}</p></div>
  </section>
  <section>
    <h2>${String(home.servicesTitle ?? "Our Services")}</h2>
    <p class="subtitle">What we offer</p>
    <div class="services-grid">
      ${services.map(s => `
      <div class="service-card">
        <div class="icon">⭐</div>
        <h3>${String(s.name ?? "")}</h3>
        <p>${String(s.description ?? "")}</p>
      </div>`).join("")}
    </div>
  </section>
  <section class="cta">
    <h2>${String(home.ctaText ?? "Ready to get started?")}</h2>
    <p>Contact us today to learn more.</p>
    <a href="contact.html">${String(home.ctaButton ?? "Contact Us")}</a>
  </section>
  <footer>
    <div class="tagline">${String(footer.tagline ?? "")}</div>
    <div>${String(footer.copyright ?? `© 2025 ${businessName}. All rights reserved.`)}</div>
  </footer>
</body>
</html>`;
}

function buildAboutPage(data: Record<string, unknown>, businessName: string): string {
  const about = (data.pages as Record<string, unknown>)?.about as Record<string, unknown> ?? {};
  const footer = (data.footer as Record<string, unknown>) ?? {};
  const primary = String(data.colorPrimary ?? "#6B21A8");
  const secondary = String(data.colorSecondary ?? "#4c1d95");
  const values = (about.values as string[]) ?? [];

  return `<!DOCTYPE html>
<html lang="en"><head>
  <meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>About — ${String(data.siteName ?? businessName)}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:system-ui,-apple-system,sans-serif;color:#111;}
    nav{background:${primary};padding:1rem 2rem;display:flex;align-items:center;justify-content:space-between;}
    nav .logo{color:#fff;font-weight:900;font-size:1.2rem;}
    nav .links{display:flex;gap:1.5rem;}
    nav .links a{color:rgba(255,255,255,.8);text-decoration:none;font-size:.9rem;font-weight:600;}
    .page-hero{background:${secondary};color:#fff;padding:4rem 2rem;text-align:center;}
    .page-hero h1{font-size:2.5rem;font-weight:900;}
    section{padding:4rem 2rem;max-width:800px;margin:0 auto;}
    h2{font-size:1.5rem;font-weight:800;margin-bottom:1rem;color:${primary};}
    p{color:#555;line-height:1.7;margin-bottom:1.5rem;}
    .values{display:flex;flex-wrap:wrap;gap:1rem;margin-top:1rem;}
    .value{padding:.6rem 1.2rem;background:${primary}15;border-radius:50px;color:${primary};font-weight:600;font-size:.9rem;}
    footer{background:#111;color:#aaa;text-align:center;padding:2rem;font-size:.875rem;}
  </style>
</head>
<body>
  <nav>
    <div class="logo">${String(data.siteName ?? businessName)}</div>
    <div class="links">
      <a href="index.html">Home</a><a href="about.html">About</a>
      <a href="services.html">Services</a><a href="contact.html">Contact</a>
    </div>
  </nav>
  <div class="page-hero"><h1>${String(about.title ?? "About Us")}</h1></div>
  <section>
    <h2>Our Story</h2><p>${String(about.story ?? "")}</p>
    <h2>Our Mission</h2><p>${String(about.mission ?? "")}</p>
    <h2>Our Values</h2>
    <div class="values">${values.map(v => `<span class="value">${v}</span>`).join("")}</div>
  </section>
  <footer><div>${String(footer.copyright ?? `© 2025 ${businessName}`)}</div></footer>
</body></html>`;
}

function buildServicesPage(data: Record<string, unknown>, businessName: string): string {
  const svc = (data.pages as Record<string, unknown>)?.services as Record<string, unknown> ?? {};
  const footer = (data.footer as Record<string, unknown>) ?? {};
  const primary = String(data.colorPrimary ?? "#6B21A8");
  const secondary = String(data.colorSecondary ?? "#4c1d95");
  const items = (svc.items as Array<Record<string, string>>) ?? [];

  return `<!DOCTYPE html>
<html lang="en"><head>
  <meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Services — ${String(data.siteName ?? businessName)}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:system-ui,-apple-system,sans-serif;color:#111;}
    nav{background:${primary};padding:1rem 2rem;display:flex;align-items:center;justify-content:space-between;}
    nav .logo{color:#fff;font-weight:900;font-size:1.2rem;}
    nav .links{display:flex;gap:1.5rem;}
    nav .links a{color:rgba(255,255,255,.8);text-decoration:none;font-size:.9rem;font-weight:600;}
    .page-hero{background:${secondary};color:#fff;padding:4rem 2rem;text-align:center;}
    .page-hero h1{font-size:2.5rem;font-weight:900;}
    .page-hero p{margin-top:.75rem;opacity:.85;}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1.5rem;padding:4rem 2rem;max-width:1100px;margin:0 auto;}
    .card{background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:2rem;box-shadow:0 1px 6px rgba(0,0,0,.06);}
    .card h3{font-weight:800;font-size:1.1rem;margin-bottom:.5rem;color:#111;}
    .card p{color:#666;font-size:.9rem;line-height:1.6;margin-bottom:1rem;}
    .price{font-weight:900;color:${primary};font-size:1rem;}
    footer{background:#111;color:#aaa;text-align:center;padding:2rem;font-size:.875rem;}
  </style>
</head>
<body>
  <nav>
    <div class="logo">${String(data.siteName ?? businessName)}</div>
    <div class="links">
      <a href="index.html">Home</a><a href="about.html">About</a>
      <a href="services.html">Services</a><a href="contact.html">Contact</a>
    </div>
  </nav>
  <div class="page-hero">
    <h1>${String(svc.title ?? "Our Services")}</h1>
    <p>${String(svc.subtitle ?? "")}</p>
  </div>
  <div class="grid">
    ${items.map(item => `
    <div class="card">
      <h3>${String(item.name ?? "")}</h3>
      <p>${String(item.description ?? "")}</p>
      ${item.price ? `<div class="price">${String(item.price)}</div>` : ""}
    </div>`).join("")}
  </div>
  <footer><div>${String(footer.copyright ?? `© 2025 ${businessName}`)}</div></footer>
</body></html>`;
}

function buildContactPage(data: Record<string, unknown>, businessName: string): string {
  const contact = (data.pages as Record<string, unknown>)?.contact as Record<string, unknown> ?? {};
  const footer  = (data.footer as Record<string, unknown>) ?? {};
  const primary   = String(data.colorPrimary   ?? "#6B21A8");
  const secondary = String(data.colorSecondary ?? "#4c1d95");

  return `<!DOCTYPE html>
<html lang="en"><head>
  <meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Contact — ${String(data.siteName ?? businessName)}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:system-ui,-apple-system,sans-serif;color:#111;}
    nav{background:${primary};padding:1rem 2rem;display:flex;align-items:center;justify-content:space-between;}
    nav .logo{color:#fff;font-weight:900;font-size:1.2rem;}
    nav .links{display:flex;gap:1.5rem;}
    nav .links a{color:rgba(255,255,255,.8);text-decoration:none;font-size:.9rem;font-weight:600;}
    .page-hero{background:${secondary};color:#fff;padding:4rem 2rem;text-align:center;}
    .page-hero h1{font-size:2.5rem;font-weight:900;}
    .page-hero p{margin-top:.75rem;opacity:.85;}
    .content{display:grid;grid-template-columns:1fr 1fr;gap:3rem;padding:4rem 2rem;max-width:1000px;margin:0 auto;}
    @media(max-width:700px){.content{grid-template-columns:1fr;}}
    .info-item{display:flex;align-items:flex-start;gap:1rem;margin-bottom:1.5rem;}
    .info-icon{width:40px;height:40px;border-radius:10px;background:${primary}15;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:${primary};}
    .info-label{font-weight:700;font-size:.8rem;text-transform:uppercase;letter-spacing:.05em;color:#999;margin-bottom:.25rem;}
    .info-value{color:#333;font-weight:600;}
    form input,form textarea{width:100%;padding:.8rem 1rem;border:2px solid #e5e7eb;border-radius:10px;font-size:.9rem;outline:none;font-family:inherit;margin-bottom:1rem;}
    form input:focus,form textarea:focus{border-color:${primary};}
    form textarea{min-height:120px;resize:vertical;}
    form button{width:100%;padding:.9rem;background:${primary};color:#fff;font-weight:700;border:none;border-radius:10px;cursor:pointer;font-size:1rem;}
    form button:hover{background:${secondary};}
    footer{background:#111;color:#aaa;text-align:center;padding:2rem;font-size:.875rem;}
  </style>
</head>
<body>
  <nav>
    <div class="logo">${String(data.siteName ?? businessName)}</div>
    <div class="links">
      <a href="index.html">Home</a><a href="about.html">About</a>
      <a href="services.html">Services</a><a href="contact.html">Contact</a>
    </div>
  </nav>
  <div class="page-hero">
    <h1>${String(contact.title ?? "Contact Us")}</h1>
    <p>${String(contact.subtitle ?? "We'd love to hear from you")}</p>
  </div>
  <div class="content">
    <div>
      <div class="info-item">
        <div class="info-icon">📍</div>
        <div><div class="info-label">Address</div><div class="info-value">${String(contact.address ?? "")}</div></div>
      </div>
      <div class="info-item">
        <div class="info-icon">📞</div>
        <div><div class="info-label">Phone</div><div class="info-value">${String(contact.phone ?? "")}</div></div>
      </div>
      <div class="info-item">
        <div class="info-icon">✉️</div>
        <div><div class="info-label">Email</div><div class="info-value">${String(contact.email ?? "")}</div></div>
      </div>
      <p style="color:#666;font-size:.9rem;margin-top:1rem;">${String(contact.mapText ?? "")}</p>
    </div>
    <form onsubmit="event.preventDefault();alert('Message sent! We will get back to you soon.')">
      <input type="text" placeholder="Your Name" required />
      <input type="email" placeholder="Your Email" required />
      <textarea placeholder="Your Message"></textarea>
      <button type="submit">Send Message</button>
    </form>
  </div>
  <footer><div>${String(footer.copyright ?? `© 2025 ${businessName}`)}</div></footer>
</body></html>`;
}

/* ─── Route handler ──────────────────────────────────────────────────────── */

export async function POST(req: NextRequest) {
  let action: string | undefined;
  let params: Record<string, unknown> = {};

  try {
    const body = (await req.json()) as { action?: string } & Record<string, unknown>;
    action = body.action;
    params = body;
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  /* ── generate ─────────────────────────────────────────────────────────── */
  if (action === "generate") {
    const p = params as unknown as GenerateParams & { action: string };

    if (!p.businessName?.trim()) {
      return NextResponse.json({ success: false, error: "Business name is required" }, { status: 400 });
    }

    const colors = COLOR_MAP[p.colorScheme?.toLowerCase()] ?? COLOR_MAP["purple"];

    const userPrompt = `Generate a complete professional website for:
Business Name: ${p.businessName}
Business Type: ${p.businessType}
Location: ${p.location}
Phone: ${p.phone}
Email: ${p.email}
Tagline: ${p.tagline || "Quality you can trust"}
Color Scheme: ${p.colorScheme || "Purple"}
Pages needed: ${(p.pages ?? []).join(", ") || "Home, Services, Contact"}
Special requests: ${p.specialRequests || "None"}

Return JSON with this EXACT structure (no markdown, no backticks, raw JSON only):
{
  "siteName": "${p.businessName}",
  "tagline": "their tagline here",
  "colorPrimary": "${colors.primary}",
  "colorSecondary": "${colors.secondary}",
  "colorAccent": "${colors.accent}",
  "pages": {
    "home": {
      "heroHeadline": "compelling headline",
      "heroSubtext": "supporting subtext",
      "heroButtonText": "CTA text",
      "aboutTitle": "About section title",
      "aboutText": "2-3 sentence about paragraph",
      "servicesTitle": "Services section title",
      "services": [
        {"name": "Service 1", "description": "Description", "icon": "star"},
        {"name": "Service 2", "description": "Description", "icon": "heart"},
        {"name": "Service 3", "description": "Description", "icon": "zap"}
      ],
      "ctaText": "CTA section headline",
      "ctaButton": "CTA button text"
    },
    "about": {
      "title": "About Us",
      "story": "2-3 paragraph origin story",
      "mission": "1-2 sentence mission statement",
      "values": ["Value 1", "Value 2", "Value 3", "Value 4"]
    },
    "services": {
      "title": "Our Services",
      "subtitle": "Subtitle",
      "items": [
        {"name": "Service", "description": "Full description", "price": "Starting from $X"},
        {"name": "Service", "description": "Full description", "price": "Starting from $X"},
        {"name": "Service", "description": "Full description", "price": "Starting from $X"},
        {"name": "Service", "description": "Full description", "price": "Starting from $X"}
      ]
    },
    "contact": {
      "title": "Contact Us",
      "subtitle": "Friendly subtitle",
      "address": "${p.location}",
      "phone": "${p.phone}",
      "email": "${p.email}",
      "mapText": "Find us in ${p.location}"
    }
  },
  "footer": {
    "tagline": "Short footer tagline",
    "copyright": "© 2025 ${p.businessName}. All rights reserved."
  }
}`;

    try {
      const message = await client.messages.create({
        model:      "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system:     "You are a professional web designer. Generate complete website content for a business. Return ONLY valid JSON, no markdown, no backticks, no extra text.",
        messages:   [{ role: "user", content: userPrompt }],
      });

      const rawText = (message.content[0] as { type: string; text: string }).text.trim();

      // Strip any accidental markdown fences
      const jsonText = rawText.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();

      let siteData: Record<string, unknown>;
      try {
        siteData = JSON.parse(jsonText) as Record<string, unknown>;
      } catch {
        return NextResponse.json({ success: false, error: "AI returned invalid JSON. Please try again." }, { status: 500 });
      }

      return NextResponse.json({ success: true, siteData });

    } catch (err) {
      console.error("[website-builder generate]", err);
      return NextResponse.json({ success: false, error: "AI generation failed. Please try again." }, { status: 500 });
    }
  }

  /* ── deploy ───────────────────────────────────────────────────────────── */
  if (action === "deploy") {
    const p = params as unknown as DeployParams & { action: string };

    let siteData: Record<string, unknown>;
    try {
      siteData = JSON.parse(p.siteData) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ success: false, error: "Invalid site data" }, { status: 400 });
    }

    const businessName = String((siteData.siteName as string | undefined) ?? "My Business");

    const files: Record<string, string> = {
      "index.html":    buildHomePage(siteData, businessName),
      "about.html":    buildAboutPage(siteData, businessName),
      "services.html": buildServicesPage(siteData, businessName),
      "contact.html":  buildContactPage(siteData, businessName),
    };

    // Attempt WHM file upload via cPanel UAPI
    const whmcsUrl   = process.env.WHMCS_URL ?? "";
    const whmcsId    = process.env.WHMCS_IDENTIFIER ?? "";
    const whmcsSecret = process.env.WHMCS_SECRET ?? "";

    let deployedFiles = 0;
    const domain = p.domain?.trim();

    if (whmcsUrl && whmcsId && whmcsSecret && domain) {
      // Derive cPanel username from domain (first 8 chars, alphanumeric only)
      const cpUser = domain.replace(/[^a-z0-9]/gi, "").slice(0, 8).toLowerCase();

      for (const [filename, content] of Object.entries(files)) {
        try {
          const uploadBody = new URLSearchParams({
            action:     "cpanel",
            identifier: whmcsId,
            secret:     whmcsSecret,
            username:   cpUser,
            cpanel_action: "uapi",
            module:     "Fileman",
            function:   "save_file_content",
            "args[0]":  `/home/${cpUser}/public_html/${filename}`,
            "args[1]":  content,
          });

          const uploadRes = await fetch(`${whmcsUrl}/includes/api.php`, {
            method:  "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body:    uploadBody.toString(),
          });

          if (uploadRes.ok) deployedFiles++;
        } catch {
          // Non-fatal — continue with other files
        }
      }
    }

    return NextResponse.json({
      success:       true,
      siteUrl:       domain ? `https://${domain}` : null,
      deployedFiles,
      nameservers:   NS,
      message:       deployedFiles > 0
        ? `${deployedFiles} files deployed to ${domain}`
        : "Site data generated. Manual upload may be required.",
    });
  }

  return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
}
