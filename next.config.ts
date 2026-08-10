import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  redirects: async () => [
    {
      source: "/sitemap",
      destination: "/sitemap.xml",
      permanent: true,
    },
  ],
};

export default nextConfig;
