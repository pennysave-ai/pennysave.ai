// Shared class strings for the marketing pages. No components and no
// imports, so the client islands (form, Stakes toggle) can use these without
// pulling the header and footer into the browser bundle.

/**
 * The brand gradient. Buttons carry white labels on it by choice: white is
 * 2.6–3.6:1 here, under WCAG AA's 4.5:1, accepted for the brand look (see
 * DESIGN.md, "The Bright Label Trade-off").
 */
export const GRADIENT = "bg-[linear-gradient(180deg,#E4829B,#E155E0,#AE66E8)]";
export const GRADIENT_TEXT =
  "bg-[linear-gradient(90deg,#E4829B,#E155E0,#AE66E8)] bg-clip-text text-transparent";
/** Gradient pill with a white label. */
export const PRIMARY_BUTTON_FLAT = `flex items-center rounded-full ${GRADIENT} font-medium text-white transition-opacity hover:opacity-90`;
export const PRIMARY_BUTTON = `${PRIMARY_BUTTON_FLAT} shadow-[0_10px_32px_rgba(225,85,224,.4)]`;
export const GHOST_BUTTON =
  "flex items-center rounded-full border border-white/22 bg-white/6 text-white transition-colors hover:bg-white/10";
export const EYEBROW = "text-xs font-medium tracking-[.16em] text-rose";
export const CARD = "border border-card-edge bg-card";
/** Page background shared by every page in the (landing) route group. */
export const PAGE =
  "landing relative min-h-screen overflow-x-clip bg-midnight text-white antialiased selection:bg-orchid/40 selection:text-white";
