import type { Metadata } from "next";
import { ComingSoonPage } from "@/components/ComingSoonPage";

export const metadata: Metadata = {
  title: "Careers — StackEDU",
  description: "StackEDU careers — coming soon.",
};

export default function CareersPage() {
  return <ComingSoonPage title="Careers" />;
}
