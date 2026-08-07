const BTN_INK_CORE =
  "items-center justify-center gap-2 rounded-full bg-ink text-white transition-colors duration-200 hover:bg-primary shadow-soft";

export const BTN_INK = `inline-flex ${BTN_INK_CORE}`;

export const BTN_INK_SM = `${BTN_INK} px-5 py-2.5 text-sm font-semibold`;

/** Header CTA: visible from `lg` up only (avoids `inline-flex` overriding `hidden`). */
export const BTN_INK_HEADER_CTA = `hidden lg:inline-flex ${BTN_INK_CORE} px-5 py-2.5 text-sm font-semibold`;

export const BTN_INK_LG = `${BTN_INK} px-7 py-3.5 text-sm font-bold`;
