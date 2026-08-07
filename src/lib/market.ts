export type Market = "rw" | "africa";

/** Resolve market from request host (stackedu.rw vs stackedu.africa). */
export function getMarketFromHost(host: string): Market {
  const hostname = host.toLowerCase().split(":")[0] ?? "";
  if (hostname === "stackedu.rw" || hostname === "www.stackedu.rw") {
    return "rw";
  }
  return "africa";
}

export function getContactEmailConfig(market: Market) {
  const legacyKey = process.env.RESEND_API_KEY?.trim();
  const legacyFrom = process.env.CONTACT_FROM_EMAIL?.trim();

  if (market === "rw") {
    return {
      apiKey: process.env.RESEND_API_KEY_RW?.trim() || legacyKey || "",
      from:
        process.env.CONTACT_FROM_EMAIL_RW?.trim() ||
        legacyFrom ||
        "StackEDU <hello@stackedu.rw>",
    };
  }

  return {
    apiKey: process.env.RESEND_API_KEY_AFRICA?.trim() || legacyKey || "",
    from:
      process.env.CONTACT_FROM_EMAIL_AFRICA?.trim() ||
      legacyFrom ||
      "StackEDU <hello@stackedu.africa>",
  };
}
