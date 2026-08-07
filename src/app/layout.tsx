import type { Metadata } from "next";
import { headers } from "next/headers";
import { Plus_Jakarta_Sans } from "next/font/google";
import { getMarketFromHost, GOOGLE_SITE_VERIFICATION } from "@/lib/market";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const baseMetadata: Metadata = {
  title: "StackEDU — One platform for Rwandan tertiary institutions",
  description:
    "StackEDU unifies admissions, academics, fees, e-learning and e-library for Rwandan universities, polytechnics and colleges. Built by StackForgeAI.",
  authors: [{ name: "StackForgeAI" }],
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png" }],
  },
  openGraph: {
    title: "StackEDU — One platform for Rwandan tertiary institutions",
    description:
      "StackEDU unifies admissions, academics, fees, e-learning and e-library for Rwandan universities, polytechnics and colleges. Built by StackForgeAI.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "StackEDU — One platform for Rwandan tertiary institutions",
    description:
      "StackEDU unifies admissions, academics, fees, e-learning and e-library for Rwandan universities, polytechnics and colleges. Built by StackForgeAI.",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const market = getMarketFromHost(host);

  return {
    ...baseMetadata,
    verification: {
      google: GOOGLE_SITE_VERIFICATION[market],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakarta.variable} h-full`}>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
