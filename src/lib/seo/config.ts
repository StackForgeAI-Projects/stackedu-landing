import type { Market } from "@/lib/market";
import { getPublicContactEmail, getStackeduSiteUrl, STACKEDU_SITE_URL } from "@/lib/market";

export type SeoRoute =
  | "/"
  | "/next"
  | "/blog"
  | "/careers"
  | "/privacy"
  | "/terms";

export type MarketSeoProfile = {
  market: Market;
  siteUrl: string;
  siteName: string;
  locale: string;
  alternateLocales: string[];
  titleDefault: string;
  titleTemplate: string;
  description: string;
  keywords: string[];
  ogImage: string;
  ogImageAlt: string;
  geoRegion: string;
  geoPlacename: string;
  geoPosition: string;
  icbm: string;
  themeColor: string;
  category: string;
};

const SHARED_KEYWORDS = [
  "StackEDU",
  "StackEdu",
  "education technology",
  "edtech",
  "school management system",
  "university management software",
  "student information system",
  "SIS",
  "admissions software",
  "fee management",
  "e-learning platform",
  "e-library",
  "academic records",
  "higher education software",
  "tertiary education",
  "college management system",
  "polytechnic software",
  "mobile money school fees",
  "AI education",
  "AI powered edtech",
  "StackForgeAI",
  "information technology education",
  "digital skills training",
  "academy management",
  "training management system",
] as const;

const RW_KEYWORDS = [
  ...SHARED_KEYWORDS,
  "education in Rwanda",
  "edtech Rwanda",
  "education Kigali",
  "university software Rwanda",
  "school management Rwanda",
  "Rwandan universities",
  "Rwandan colleges",
  "tertiary education Rwanda",
  "higher education Rwanda",
  "student management system Rwanda",
  "fee payment Rwanda",
  "MoMo school fees",
  "MTN MoMo education",
  "Kigali edtech",
  "Rwanda digital education",
  "Vision 2050 education",
  "ICT education Rwanda",
  "online learning Rwanda",
  "StackEDU Rwanda",
  "stackedu.rw",
] as const;

const AFRICA_KEYWORDS = [
  ...SHARED_KEYWORDS,
  "education in Africa",
  "edtech Africa",
  "African universities",
  "African colleges",
  "school management Africa",
  "university software Africa",
  "higher education Africa",
  "tertiary education Africa",
  "student management system Africa",
  "mobile money tuition Africa",
  "M-Pesa school fees",
  "digital education Africa",
  "online learning Africa",
  "AI education Africa",
  "StackEDU Africa",
  "stackedu.africa",
] as const;

const profiles: Record<Market, MarketSeoProfile> = {
  rw: {
    market: "rw",
    siteUrl: STACKEDU_SITE_URL.rw,
    siteName: "StackEDU Rwanda",
    locale: "en_RW",
    alternateLocales: ["rw_RW", "fr_RW", "en_US"],
    titleDefault:
      "StackEDU Rwanda — School & University Management Software in Kigali",
    titleTemplate: "%s | StackEDU Rwanda",
    description:
      "StackEDU is Rwanda's AI-powered edtech platform for universities, polytechnics and colleges. Unify admissions, academics, fees, e-learning and e-library — built in Kigali by StackForgeAI.",
    keywords: [...RW_KEYWORDS],
    ogImage: "/images/stackedu-hero.webp",
    ogImageAlt: "StackEDU platform for Rwandan tertiary institutions",
    geoRegion: "RW",
    geoPlacename: "Kigali, Rwanda",
    geoPosition: "-1.9441;30.0619",
    icbm: "-1.9441, 30.0619",
    themeColor: "#0f766e",
    category: "education",
  },
  africa: {
    market: "africa",
    siteUrl: STACKEDU_SITE_URL.africa,
    siteName: "StackEDU Africa",
    locale: "en",
    alternateLocales: ["fr", "en_US"],
    titleDefault:
      "StackEDU — School & University Management Software Across Africa",
    titleTemplate: "%s | StackEDU Africa",
    description:
      "StackEDU is Africa's AI-powered edtech platform for universities, polytechnics and colleges. Unify admissions, academics, fees, e-learning and e-library — built by StackForgeAI.",
    keywords: [...AFRICA_KEYWORDS],
    ogImage: "/images/stackedu-hero.webp",
    ogImageAlt: "StackEDU platform for African tertiary institutions",
    geoRegion: "AF",
    geoPlacename: "Africa · HQ Kigali, Rwanda",
    geoPosition: "-1.9441;30.0619",
    icbm: "-1.9441, 30.0619",
    themeColor: "#0f766e",
    category: "education",
  },
};

export function getMarketSeo(market: Market): MarketSeoProfile {
  return profiles[market];
}

export type PageSeoCopy = {
  title: string;
  description: string;
  path: SeoRoute;
  keywords?: string[];
};

export function getHomePageSeo(market: Market): PageSeoCopy {
  const seo = getMarketSeo(market);
  return {
    title: seo.titleDefault,
    description: seo.description,
    path: "/",
    keywords: seo.keywords,
  };
}

export function getNextPageSeo(market: Market): PageSeoCopy {
  if (market === "rw") {
    return {
      title: "StackForgeNext — Free Tech Training for Rwanda's Youth",
      description:
        "StackForgeNext is StackForgeAI's community initiative delivering free tech training, coding, AI skills and digital education to youth across Rwanda. Partner with schools and universities in Kigali and beyond.",
      path: "/next",
      keywords: [
        "StackForgeNext",
        "free tech training Rwanda",
        "coding academy Kigali",
        "digital skills Rwanda",
        "youth training Rwanda",
        "AI training Rwanda",
        "community education Rwanda",
        "tech academy Kigali",
      ],
    };
  }

  return {
    title: "StackForgeNext — Free Tech Training for Africa's Youth",
    description:
      "StackForgeNext is StackForgeAI's community initiative delivering free tech training, coding, AI skills and digital education to youth across Africa. Partner with schools, universities and community organizations.",
    path: "/next",
    keywords: [
      "StackForgeNext",
      "free tech training Africa",
      "coding academy Africa",
      "digital skills Africa",
      "youth training Africa",
      "AI training Africa",
      "community education Africa",
    ],
  };
}

export function getStaticPageSeo(
  market: Market,
  page: Exclude<SeoRoute, "/" | "/next">,
): PageSeoCopy {
  const brand = market === "rw" ? "StackEDU Rwanda" : "StackEDU Africa";
  const region = market === "rw" ? "Rwanda" : "Africa";

  const pages: Record<Exclude<SeoRoute, "/" | "/next">, PageSeoCopy> = {
    "/blog": {
      title: `Blog — ${brand}`,
      description: `Insights on edtech, higher education, student information systems and digital learning across ${region}. Coming soon from StackEDU.`,
      path: "/blog",
      keywords: ["StackEDU blog", `edtech ${region}`, "education technology news"],
    },
    "/careers": {
      title: `Careers — ${brand}`,
      description: `Join StackEDU and StackForgeAI. Careers in edtech, software engineering and education technology in ${region}. Coming soon.`,
      path: "/careers",
      keywords: ["StackEDU careers", `edtech jobs ${region}`, "StackForgeAI careers"],
    },
    "/privacy": {
      title: `Privacy Policy — ${brand}`,
      description: `Privacy policy for StackEDU, the school and university management platform serving institutions in ${region}.`,
      path: "/privacy",
    },
    "/terms": {
      title: `Terms and Conditions — ${brand}`,
      description: `Terms and conditions for StackEDU, the school and university management platform serving institutions in ${region}.`,
      path: "/terms",
    },
  };

  return pages[page];
}

export function absoluteUrl(market: Market, path = "/"): string {
  const base = getStackeduSiteUrl(market).replace(/\/$/, "");
  if (!path || path === "/") return `${base}/`;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function getContactEmailForSeo(market: Market) {
  return getPublicContactEmail(market);
}

export const SITEMAP_ROUTES: { path: SeoRoute; priority: number; changeFrequency: "weekly" | "monthly" | "yearly" }[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/next", priority: 0.9, changeFrequency: "weekly" },
  { path: "/blog", priority: 0.5, changeFrequency: "monthly" },
  { path: "/careers", priority: 0.5, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
];
