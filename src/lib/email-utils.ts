import { getMarketFromHost, type Market } from "@/lib/market";

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export type EmailRequestMeta = {
  host: string;
  market: Market;
  siteHost: string;
  submittedAt: string;
  ip: string;
  userAgent: string;
  visitorCountry?: string;
};

export function getEmailRequestMeta(request: Request): EmailRequestMeta {
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "Unknown";

  return {
    host,
    market: getMarketFromHost(host),
    siteHost: host.split(":")[0] || "stackedu.africa",
    submittedAt: new Date().toUTCString(),
    ip,
    userAgent: request.headers.get("user-agent") || "Unknown",
    visitorCountry: request.headers.get("x-vercel-ip-country") || undefined,
  };
}
