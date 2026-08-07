import type { Metadata } from "next";
import { ComingSoonPage } from "@/components/ComingSoonPage";

export const metadata: Metadata = {
  title: "Blog — StackEDU",
  description: "StackEDU blog — coming soon.",
};

export default function BlogPage() {
  return <ComingSoonPage title="Blog" />;
}
