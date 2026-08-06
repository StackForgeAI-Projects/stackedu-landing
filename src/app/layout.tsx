import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
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
