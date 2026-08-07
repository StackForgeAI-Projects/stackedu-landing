import type { Market } from "@/lib/market";

export type ContactEmailPayload = {
  name: string;
  institution: string;
  email: string;
  phone: string;
  message: string;
  market: Market;
  siteHost: string;
  submittedAt: string;
  ip: string;
  userAgent: string;
  visitorCountry?: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function marketCountryLabel(market: Market) {
  return market === "rw" ? "Rwanda" : "Africa";
}

function fieldRow(label: string, valueHtml: string) {
  return `
    <tr>
      <td style="padding:0 0 20px;">
        <div style="font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#86efac;margin-bottom:8px;">${label}</div>
        <div style="font-size:16px;line-height:1.5;color:#f4f4f5;">${valueHtml}</div>
      </td>
    </tr>`;
}

export function buildContactEmailHtml(payload: ContactEmailPayload) {
  const {
    name,
    institution,
    email,
    phone,
    message,
    market,
    siteHost,
    submittedAt,
    ip,
    userAgent,
    visitorCountry,
  } = payload;

  const countryLine = visitorCountry
    ? `${marketCountryLabel(market)} · ${escapeHtml(siteHost)} · visitor: ${escapeHtml(visitorCountry)}`
    : `${marketCountryLabel(market)} · ${escapeHtml(siteHost)}`;

  const rows = [
    fieldRow(
      "From",
      `${escapeHtml(name)} &lt;<a href="mailto:${escapeHtml(email)}" style="color:#86efac;text-decoration:none;">${escapeHtml(email)}</a>&gt;`,
    ),
    fieldRow("Institution", escapeHtml(institution)),
    fieldRow(
      "Phone / WhatsApp",
      `<a href="tel:${escapeHtml(phone.replace(/\s/g, ""))}" style="color:#f4f4f5;text-decoration:none;">${escapeHtml(phone)}</a>`,
    ),
    fieldRow("Country", countryLine),
    fieldRow("Message", escapeHtml(message).replaceAll("\n", "<br />")),
  ].join("");

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>StackEDU demo request</title>
  </head>
  <body style="margin:0;padding:0;background:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#09090b;padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;">
            <tr>
              <td style="padding-bottom:24px;">
                <div style="font-size:28px;font-weight:800;line-height:1.2;color:#fafafa;">
                  <span style="color:#86efac;">StackEDU</span>
                  <span style="color:#71717a;"> · New demo request</span>
                </div>
                <div style="margin-top:10px;font-size:15px;line-height:1.6;color:#a1a1aa;">
                  A new Book a Demo submission has arrived from <span style="color:#d4d4d8;">${escapeHtml(siteHost)}</span>
                </div>
              </td>
            </tr>
            <tr>
              <td style="background:#18181b;border:1px solid #27272a;border-radius:20px;padding:28px 24px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  ${rows}
                </table>
                <div style="margin-top:8px;padding-top:20px;border-top:1px solid #27272a;font-size:12px;line-height:1.7;color:#71717a;">
                  <div><span style="color:#52525b;">Submitted:</span> ${escapeHtml(submittedAt)}</div>
                  <div><span style="color:#52525b;">IP:</span> ${escapeHtml(ip)}</div>
                  <div><span style="color:#52525b;">User-Agent:</span> ${escapeHtml(userAgent)}</div>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding-top:24px;text-align:center;font-size:12px;color:#52525b;">
                © StackEDU · Kigali, Rwanda
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function buildContactEmailText(payload: ContactEmailPayload) {
  const countryLine = payload.visitorCountry
    ? `${marketCountryLabel(payload.market)} · ${payload.siteHost} · visitor: ${payload.visitorCountry}`
    : `${marketCountryLabel(payload.market)} · ${payload.siteHost}`;

  return `StackEDU · New demo request

A new Book a Demo submission has arrived from ${payload.siteHost}

FROM
${payload.name} <${payload.email}>

INSTITUTION
${payload.institution}

PHONE / WHATSAPP
${payload.phone}

COUNTRY
${countryLine}

MESSAGE
${payload.message}

---
Submitted: ${payload.submittedAt}
IP: ${payload.ip}
User-Agent: ${payload.userAgent}

© StackEDU · Kigali, Rwanda`;
}
