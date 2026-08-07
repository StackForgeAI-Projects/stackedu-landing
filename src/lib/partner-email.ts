import type { Market } from "@/lib/market";
import { escapeHtml, fieldRow, marketCountryLabel } from "@/lib/contact-email";

export type PartnerEmailPayload = {
  org: string;
  name: string;
  email: string;
  phone: string;
  timeline: string;
  capacities: string[];
  message: string;
  market: Market;
  siteHost: string;
  submittedAt: string;
  ip: string;
  userAgent: string;
  visitorCountry?: string;
};

function emailShell(title: string, intro: string, rows: string, footerMeta: PartnerEmailPayload) {
  const { submittedAt, ip, userAgent } = footerMeta;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#09090b;padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;">
            <tr>
              <td style="padding-bottom:24px;">
                <div style="font-size:28px;font-weight:800;line-height:1.2;color:#fafafa;">
                  <span style="color:#86efac;">StackForgeNext</span>
                  <span style="color:#71717a;"> · Partner with us</span>
                </div>
                <div style="margin-top:10px;font-size:15px;line-height:1.6;color:#a1a1aa;">
                  ${intro}
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
                © StackForgeNext · Kigali, Rwanda
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function buildPartnerEmailHtml(payload: PartnerEmailPayload) {
  const {
    org,
    name,
    email,
    phone,
    timeline,
    capacities,
    message,
    market,
    siteHost,
    visitorCountry,
  } = payload;

  const countryLine = visitorCountry
    ? `${marketCountryLabel(market)} · ${escapeHtml(siteHost)} · visitor: ${escapeHtml(visitorCountry)}`
    : `${marketCountryLabel(market)} · ${escapeHtml(siteHost)}`;

  const capacityList = capacities
    .map((item) => `• ${escapeHtml(item)}`)
    .join("<br />");

  const rows = [
    fieldRow(
      "From",
      `${escapeHtml(name)} &lt;<a href="mailto:${escapeHtml(email)}" style="color:#86efac;text-decoration:none;">${escapeHtml(email)}</a>&gt;`,
    ),
    fieldRow("Organization", escapeHtml(org)),
    fieldRow(
      "Phone / WhatsApp",
      `<a href="tel:${escapeHtml(phone.replace(/\s/g, ""))}" style="color:#f4f4f5;text-decoration:none;">${escapeHtml(phone)}</a>`,
    ),
    fieldRow("Preferred start", timeline ? escapeHtml(timeline) : "Not specified"),
    fieldRow("Partnership interests", capacityList || "—"),
    fieldRow("Country", countryLine),
    fieldRow(
      "Message",
      message ? escapeHtml(message).replaceAll("\n", "<br />") : "—",
    ),
  ].join("");

  return emailShell(
    "StackForgeNext partner form",
    `A new Partner with us submission has arrived from <span style="color:#d4d4d8;">${escapeHtml(siteHost)}</span>`,
    rows,
    payload,
  );
}

export function buildPartnerEmailText(payload: PartnerEmailPayload) {
  const countryLine = payload.visitorCountry
    ? `${marketCountryLabel(payload.market)} · ${payload.siteHost} · visitor: ${payload.visitorCountry}`
    : `${marketCountryLabel(payload.market)} · ${payload.siteHost}`;

  const capacities = payload.capacities.map((item) => `• ${item}`).join("\n");

  return `StackForgeNext · Partner with us form

A new Partner with us submission has arrived from ${payload.siteHost}

FROM
${payload.name} <${payload.email}>

ORGANIZATION
${payload.org}

PHONE / WHATSAPP
${payload.phone}

PREFERRED START
${payload.timeline || "Not specified"}

PARTNERSHIP INTERESTS
${capacities || "—"}

COUNTRY
${countryLine}

MESSAGE
${payload.message || "—"}

---
Submitted: ${payload.submittedAt}
IP: ${payload.ip}
User-Agent: ${payload.userAgent}

© StackForgeNext · Kigali, Rwanda`;
}
