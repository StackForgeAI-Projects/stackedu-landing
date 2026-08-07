/**
 * Public Cloudinary delivery helpers.
 * Playback only needs the cloud name + public ID (or a full public URL).
 * Never put API secrets in the frontend.
 */

import type { Locale } from "@/lib/i18n/locales";

const VIDEO_EXT = /\.(mp4|webm|mov)$/i;

const DEFAULT_HERO_VIDEO_URL_FR =
  "https://res.cloudinary.com/iikwn37o/video/upload/v1786066360/StackEDU_Demo_French_tnqdsv.mp4";

const DEFAULT_HERO_VIDEO_URL_RW =
  "https://res.cloudinary.com/iikwn37o/video/upload/v1786121432/StackEDU_Demo_Kiyarwanda_kc4dxk.mp4";

function stripVideoExt(value: string) {
  return value.replace(VIDEO_EXT, "");
}

/** Prefer the last full Cloudinary URL if a value was accidentally double-wrapped. */
function unwrapCloudinaryUrl(value: string) {
  const marker = "https://res.cloudinary.com/";
  const idx = value.toLowerCase().lastIndexOf(marker);
  return idx === -1 ? value : value.slice(idx);
}

function buildDeliveryUrl(cloud: string, publicId: string) {
  const id = stripVideoExt(publicId.replace(/^\/+/, ""));
  return `https://res.cloudinary.com/${cloud}/video/upload/f_auto:video,q_auto/${id}`;
}

function resolveVideoUrl(input: string, cloudName?: string): string {
  if (!input) return "";

  if (/^https?:\/\//i.test(input) || input.includes("https://res.cloudinary.com/")) {
    const url = unwrapCloudinaryUrl(input);
    const parsed = url.match(
      /^https:\/\/res\.cloudinary\.com\/([^/]+)\/video\/upload\/(.+)$/i,
    );
    if (!parsed) return url;

    const [, urlCloud, path] = parsed;
    const deliveryPath = stripVideoExt(path)
      .split("/")
      .filter((segment) => !segment.includes(",") && !segment.includes(":"))
      .join("/");

    return buildDeliveryUrl(urlCloud, deliveryPath || path);
  }

  if (!cloudName) return "";
  return buildDeliveryUrl(cloudName, input);
}

function getDefaultEnglishVideoInput() {
  return (
    process.env.NEXT_PUBLIC_HERO_VIDEO_URL?.trim() ||
    process.env.NEXT_PUBLIC_HERO_VIDEO_ID?.trim() ||
    ""
  );
}

function getFrenchVideoInput() {
  return (
    process.env.NEXT_PUBLIC_HERO_VIDEO_URL_FR?.trim() ||
    process.env.NEXT_PUBLIC_HERO_VIDEO_ID_FR?.trim() ||
    DEFAULT_HERO_VIDEO_URL_FR
  );
}

function getKinyarwandaVideoInput() {
  return (
    process.env.NEXT_PUBLIC_HERO_VIDEO_URL_RW?.trim() ||
    process.env.NEXT_PUBLIC_HERO_VIDEO_ID_RW?.trim() ||
    DEFAULT_HERO_VIDEO_URL_RW
  );
}

/** Returns a playable hero demo URL for the active locale. */
export function getHeroVideoUrl(locale: Locale = "en"): string {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();

  if (locale === "fr") {
    return resolveVideoUrl(getFrenchVideoInput(), cloud);
  }

  if (locale === "rw") {
    return resolveVideoUrl(getKinyarwandaVideoInput(), cloud);
  }

  return resolveVideoUrl(getDefaultEnglishVideoInput(), cloud);
}
