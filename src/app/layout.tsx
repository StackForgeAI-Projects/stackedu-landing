import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { GoogleAnalytics } from "@/components/seo/GoogleAnalytics";
import { GA_MEASUREMENT_ID_RW } from "@/lib/market";
import { buildRootMetadata } from "@/lib/seo/metadata";
import { getRequestMarket } from "@/lib/seo/request-market";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export async function generateMetadata(): Promise<Metadata> {
  const market = await getRequestMarket();
  return buildRootMetadata(market);
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const market = await getRequestMarket();
  const lang = market === "rw" ? "en-RW" : "en";

  return (
    <html lang={lang} className={`${plusJakarta.variable} h-full`}>
      <head>
        {market === "rw" ? <GoogleAnalytics measurementId={GA_MEASUREMENT_ID_RW} /> : null}
      </head>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
