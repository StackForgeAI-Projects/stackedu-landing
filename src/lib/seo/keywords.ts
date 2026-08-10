import type { Market } from "@/lib/market";
import { getMarketSeo, mergeKeywords } from "@/lib/seo/config";
import { getCachedTrendingEdtechKeywords } from "@/lib/seo/trending-keywords";

/** Static SEO keywords plus daily-refreshed edtech trends for the market. */
export async function getMarketKeywords(market: Market): Promise<string[]> {
  const staticKeywords = getMarketSeo(market).keywords;
  const trending = await getCachedTrendingEdtechKeywords(market);
  return mergeKeywords(staticKeywords, trending);
}
