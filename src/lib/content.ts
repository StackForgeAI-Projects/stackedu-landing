import {
  GraduationCap,
  BookOpen,
  Wallet,
  ShieldCheck,
  Users,
  Library,
  ClipboardList,
  Calendar,
  Video,
  Bot,
  Settings2,
  type LucideIcon,
} from "lucide-react";

export const ROLE_ICONS: LucideIcon[] = [
  GraduationCap,
  BookOpen,
  Wallet,
  ClipboardList,
  Library,
  ShieldCheck,
];

export const ROLE_TAGS = ["ST", "LC", "BR", "AA", "LB", "IT"] as const;

export const MODULE_ICONS: LucideIcon[] = [
  Users,
  GraduationCap,
  Calendar,
  Wallet,
  Video,
  Library,
  Bot,
  Settings2,
];

export const NAV_HREFS = ["#about", "#roles", "#modules", "#pricing", "#contact"] as const;

export const PARTNERS = ["Crescent University", "ADECOM College"] as const;

export const SOLUTION_POSITIONS = [
  "top-2 -left-3 sm:-left-6 lg:-left-8",
  "top-[30%] -right-3 sm:-right-6 lg:-right-8",
  "bottom-24 -left-3 sm:-left-6 lg:-left-8",
  "bottom-2 -right-3 sm:-right-6 lg:-right-8",
] as const;

export const PLAN_FEATURED = [false, true, false] as const;

export const PAYMENT_DOTS: (string | undefined)[] = ["#FFCC00", "#ED1C24", undefined, undefined];

export const WHATSAPP_URL = "https://wa.me/250799486531";
