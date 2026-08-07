import type { Metadata } from "next";
import { headers } from "next/headers";
import { LandingPage } from "@/components/landing/LandingPage";
import { getMarketFromHost } from "@/lib/market";

export async function generateMetadata(): Promise<Metadata> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const market = getMarketFromHost(host);

  if (market === "africa") {
    return {
      title: "StackEDU — One platform for African tertiary institutions",
      description:
        "StackEDU unifies admissions, academics, fees, e-learning and e-library for universities, polytechnics and colleges across Africa. Built by StackForgeAI.",
      openGraph: {
        title: "StackEDU — One platform for African tertiary institutions",
        description:
          "StackEDU unifies admissions, academics, fees, e-learning and e-library for universities, polytechnics and colleges across Africa. Built by StackForgeAI.",
      },
      twitter: {
        title: "StackEDU — One platform for African tertiary institutions",
        description:
          "StackEDU unifies admissions, academics, fees, e-learning and e-library for universities, polytechnics and colleges across Africa. Built by StackForgeAI.",
      },
    };
  }

  return {};
}

export default async function Home() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";

  return <LandingPage market={getMarketFromHost(host)} />;
}
