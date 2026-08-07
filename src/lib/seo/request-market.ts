import { headers } from "next/headers";
import { getMarketFromHost, type Market } from "@/lib/market";

/** Resolve market from the current request host (App Router). */
export async function getRequestMarket(): Promise<Market> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  return getMarketFromHost(host);
}
