export type Market = "rw" | "africa";

export const RW_HOSTS = ["stackedu.rw", "www.stackedu.rw"] as const;
export const AFRICA_HOSTS = ["stackedu.africa", "www.stackedu.africa"] as const;
const LOCAL_DEV_HOSTS = ["localhost", "127.0.0.1"] as const;

export function isKnownMarketHost(hostname: string): boolean {
  const host = hostname.toLowerCase().split(":")[0] ?? "";
  return (
    (RW_HOSTS as readonly string[]).includes(host) ||
    (AFRICA_HOSTS as readonly string[]).includes(host)
  );
}

/** Resolve market from request host (stackedu.rw vs stackedu.africa). */
export function getMarketFromHost(host: string): Market {
  const hostname = host.toLowerCase().split(":")[0] ?? "";
  if ((RW_HOSTS as readonly string[]).includes(hostname)) {
    return "rw";
  }
  if ((LOCAL_DEV_HOSTS as readonly string[]).includes(hostname)) {
    return "rw";
  }
  return "africa";
}

export const PUBLIC_CONTACT_EMAIL: Record<Market, string> = {
  rw: "hello@stackedu.rw",
  africa: "hello@stackedu.africa",
};

export function getPublicContactEmail(market: Market) {
  return PUBLIC_CONTACT_EMAIL[market];
}

export const STACKEDU_SITE_URL: Record<Market, string> = {
  rw: "https://stackedu.rw",
  africa: "https://stackedu.africa",
};

export function getStackeduSiteUrl(market: Market) {
  return STACKEDU_SITE_URL[market];
}

/** Plain inbox address for Resend `to` (handles `<email>` and stray spaces). */
function normalizeRecipientEmail(value: string | undefined): string {
  if (!value) return "";
  const trimmed = value.trim();
  const bracket = trimmed.match(/<([^>]+)>/);
  if (bracket) return bracket[1]!.trim();
  return trimmed;
}

/** Sender for Resend `from` — plain email or `Name <email>`. */
function normalizeSenderEmail(value: string | undefined): string {
  if (!value) return "";
  const trimmed = value.trim();
  const bareBracket = trimmed.match(/^<\s*([^>]+)\s*>$/);
  if (bareBracket) return bareBracket[1]!.trim();
  return trimmed;
}

export function getContactEmailConfig(market: Market) {
  const legacyKey = process.env.RESEND_API_KEY?.trim();
  const legacyFrom = process.env.CONTACT_FROM_EMAIL?.trim();
  const legacyTo = process.env.CONTACT_TO_EMAIL?.trim();

  if (market === "rw") {
    return {
      apiKey: process.env.RESEND_API_KEY_RW?.trim() || legacyKey || "",
      from: normalizeSenderEmail(
        process.env.CONTACT_FROM_EMAIL_RW || legacyFrom || "StackEDU <hello@stackedu.rw>",
      ),
      to: normalizeRecipientEmail(
        process.env.CONTACT_TO_EMAIL_RW || legacyTo || "hello@stackedu.africa",
      ),
    };
  }

  return {
    apiKey: process.env.RESEND_API_KEY_AFRICA?.trim() || legacyKey || "",
    from: normalizeSenderEmail(
      process.env.CONTACT_FROM_EMAIL_AFRICA || legacyFrom || "StackEDU <hello@stackedu.africa>",
    ),
    to: normalizeRecipientEmail(
      process.env.CONTACT_TO_EMAIL_AFRICA || legacyTo || "hello@stackedu.africa",
    ),
  };
}
