import type { Market } from "@/lib/market";
import type { Locale } from "./locales";
import { mergeMessages } from "./merge-messages";
import { africaMessagesByLocale } from "./messages-africa";
import { messages, type Messages } from "./messages";

export function getMessagesForMarket(locale: Locale, market: Market): Messages {
  const base = messages[locale];
  if (market === "rw") return base;
  return mergeMessages(base, africaMessagesByLocale[locale] as Partial<Messages>);
}
