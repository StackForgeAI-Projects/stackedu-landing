/**
 * Public Cloudinary delivery helpers.
 * Playback only needs the cloud name + public ID (or a full public URL).
 * Never put API secrets in the frontend.
 */

const VIDEO_EXT = /\.(mp4|webm|mov)$/i;

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

/**
 * Accepts a public ID or a full Cloudinary delivery URL and returns a playable URL.
 */
export function getHeroVideoUrl(): string {
  const direct = process.env.NEXT_PUBLIC_HERO_VIDEO_URL?.trim();
  const rawId = process.env.NEXT_PUBLIC_HERO_VIDEO_ID?.trim();
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();

  const input = direct || rawId || "";
  if (!input) return "";

  if (/^https?:\/\//i.test(input) || input.includes("https://res.cloudinary.com/")) {
    const url = unwrapCloudinaryUrl(input);
    const parsed = url.match(
      /^https:\/\/res\.cloudinary\.com\/([^/]+)\/video\/upload\/(.+)$/i,
    );
    if (!parsed) return url;

    const [, urlCloud, path] = parsed;
    // Keep version + public id; drop any existing transform segments (contain , or :).
    const deliveryPath = stripVideoExt(path)
      .split("/")
      .filter((segment) => !segment.includes(",") && !segment.includes(":"))
      .join("/");

    return buildDeliveryUrl(urlCloud, deliveryPath || path);
  }

  if (!cloud) return "";
  return buildDeliveryUrl(cloud, input);
}
