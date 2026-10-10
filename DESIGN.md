---
name: PennySave.ai
description: Budgeting for iPhone, made effortless. A dark, sleek marketing site lit by one pink-violet glow.
colors:
  orchid-glow: "#E155E0"
  rose-blush: "#E4829B"
  violet-haze: "#AE66E8"
  orchid-mist: "#F0A8EF"
  midnight-indigo: "#0E0E24"
  deep-night: "#0B0B1E"
  card-indigo: "#151533"
  card-edge: "#2A2A48"
  numeral-indigo: "#3C3C62"
  ink-white: "#FFFFFF"
  text-strong: "#E6E6F0"
  text-label: "#DCDCEB"
  text-lead: "#C9C9DA"
  text-muted: "#B9B9CC"
  text-quiet: "#9A9AAC"
  text-faint: "#8E8EA6"
  placeholder: "#6E6E88"
  mint-yes: "#4FD1A5"
  coral-no: "#F26A82"
  notice: "#F0C464"
  notice-ink: "#EDE3C8"
typography:
  display:
    fontFamily: "Poppins, system-ui, sans-serif"
    fontSize: "clamp(40px, 6vw, 68px)"
    fontWeight: 500
    lineHeight: 1.04
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Poppins, system-ui, sans-serif"
    fontSize: "clamp(32px, 4.4vw, 52px)"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Poppins, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 500
    lineHeight: 1.3
  body-lead:
    fontFamily: "Poppins, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.65
  body:
    fontFamily: "Poppins, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.7
  label:
    fontFamily: "Poppins, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    letterSpacing: "0.16em"
  meta:
    fontFamily: "Poppins, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
  chip:
    fontFamily: "Poppins, system-ui, sans-serif"
    fontSize: "10.5px"
    fontWeight: 400
  chip-lg:
    fontFamily: "Poppins, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 400
rounded:
  icon: "10px"
  field: "16px"
  card-sm: "24px"
  card: "28px"
  card-lg: "32px"
  panel: "40px"
  pill: "9999px"
spacing:
  gutter: "24px"
  card-gap: "20px"
  card-pad: "30px"
  card-pad-lg: "34px"
  section: "104px"
  section-sm: "96px"
  container: "1200px"
  container-narrow: "960px"
components:
  button-primary:
    backgroundColor: "{colors.orchid-glow}"
    textColor: "{colors.ink-white}"
    rounded: "{rounded.pill}"
    typography: "{typography.body}"
    padding: "0 28px"
    height: "54px"
  button-ghost:
    backgroundColor: "rgba(255,255,255,0.06)"
    textColor: "{colors.ink-white}"
    rounded: "{rounded.pill}"
    padding: "0 24px"
    height: "54px"
  segmented-active:
    backgroundColor: "{colors.ink-white}"
    textColor: "{colors.card-indigo}"
    rounded: "{rounded.pill}"
    height: "44px"
  card:
    backgroundColor: "{colors.card-indigo}"
    textColor: "{colors.ink-white}"
    rounded: "{rounded.card-lg}"
    padding: "{spacing.card-pad-lg}"
  card-glass:
    backgroundColor: "rgba(255,255,255,0.04)"
    textColor: "{colors.ink-white}"
    rounded: "{rounded.card-sm}"
    padding: "22px"
  chip-premium:
    backgroundColor: "rgba(225,85,224,0.18)"
    textColor: "{colors.orchid-mist}"
    rounded: "{rounded.pill}"
    padding: "0 8px"
    height: "20px"
  input:
    backgroundColor: "{colors.midnight-indigo}"
    textColor: "{colors.ink-white}"
    rounded: "{rounded.field}"
    padding: "0 16px"
---

# Design System: PennySave.ai

## Overview

**Creative North Star: "Glow in the Dark"**

PennySave's marketing site is a dark, restful room where the things that matter light up. The surfaces are deep midnight indigo, close to black but never neutral gray, and almost everything on them is quiet: soft lavender-gray text, hairline borders, flat cards. Against that calm, one rose → orchid → violet gradient carries all the energy. It fills the primary button, colors the second half of the hero headline, and spills behind sections as soft radial light. When something glows, it is because the visitor should look there.

The mood is premium, sleek and confident: a polished fintech feel without the coldness. Shapes are generous and soft (pill buttons, cards rounded at 28–40px), the type is a single geometric sans at only two weights, and the copy does the talking at large sizes with tight tracking. Density is low: sections breathe with 104px of vertical space, and every block keeps to a 1200px column.

The page alternates two near-black tones in bands (midnight indigo and a slightly deeper night) instead of using dividers or color blocks. Light comes from the gradient glows, not from lighter surfaces.

**Key Characteristics:**
- Dark-only: midnight indigo base, deeper bands for rhythm, no light theme.
- One gradient (rose → orchid → violet) carries all brand color and every primary action.
- Depth through colored glow first, soft neutral shadow second.
- Pill-shaped controls, big soft cards, hairline borders.
- Poppins at 400 and 500 only; big headlines with tight negative tracking.

## Colors

A cool, near-black indigo field with a warm pink-violet light source and two small signal colors. In code, every color below is a Tailwind token declared in `src/app/globals.css` (`--color-orchid` → `text-orchid`, `--color-ink-quiet` → `text-ink-quiet`); use the token, never the raw hex.

### Primary
- **Orchid Glow** (#E155E0): the brand's center. It is the middle stop of the gradient, the color of every glow and halo, step labels, the Premium checkmarks, focus borders, and the trial badge's fill.
- **Rose Blush** (#E4829B): the gradient's warm start. On its own it colors eyebrow labels and link hover states.
- **Violet Haze** (#AE66E8): the gradient's cool end. On its own it appears only as a soft radial glow behind sections.
- **Orchid Mist** (#F0A8EF): the light tint, used where orchid must be legible on dark: Premium badge text, the Premium card's border, the active "with PennySave" panel's border.

### Neutral
- **Midnight Indigo** (#0E0E24): page background, and the fill of form fields so they read as cut into the card.
- **Deep Night** (#0B0B1E): alternate section bands (problem, plan, pricing), separated by 6%-white hairlines.
- **Card Indigo** (#151533): solid card surfaces. It also serves as the dark text color on white (active segmented control, trial badge).
- **Card Edge** (#2A2A48): the 1px border on solid cards.
- **Numeral Indigo** (#3C3C62): big decorative numerals ("01", "02"), which should barely register.
- **Ink White** (#FFFFFF): headlines and button labels.
- **Text Strong** (#E6E6F0): list items and checklist text.
- **Text Label** (#DCDCEB): form labels and small badge text.
- **Text Lead** (#C9C9DA): lead paragraphs under headlines.
- **Text Muted** (#B9B9CC): card body text, nav links, footer links.
- **Text Quiet** (#9A9AAC) and **Text Faint** (#8E8EA6): meta lines, plan subtitles, copyright.
- **Placeholder** (#6E6E88): input placeholders only.

### Signal
- **Mint Yes** (#4FD1A5): positive checks, the free plan's checkmarks, and the "live" dot in the hero badge.
- **Notice Amber** (#F0C464) with **Notice Ink** (#EDE3C8): the legal page's "this translation hasn't been legally reviewed" notice only, as an 8% fill with a 35% border (text 12.9:1). It is a warning about binding text, never decoration or emphasis.
- **Coral No** (#F26A82): the "without a plan" crosses. Use it only for contrasting a bad outcome, never for errors in a way that alarms.

### Named Rules
**The One Light Source Rule.** Brand color comes only from the rose → orchid → violet family. No blues, greens or oranges as decoration; mint and coral are signals, not accents.

**The Glow Means Look Here Rule.** Gradient fills and orchid glows are reserved for the primary action, the featured plan, and the hero headline's payoff phrase. If two things on screen glow equally, one of them is wrong.

**The Translucent White Rule.** Secondary surfaces and borders are white at low opacity (4–6% fill, 7–22% border), never a new gray hex, so they stay tinted by whatever glow sits behind them.

## Typography

**Display Font:** Poppins (with system-ui, sans-serif)
**Body Font:** Poppins (with system-ui, sans-serif)

**Character:** One geometric sans at two weights. Headlines are medium (500) and tightly tracked, so they feel engineered and confident. Body text is regular (400) with generous line height, so it reads relaxed.

### Hierarchy
- **Display** (500, clamp(40px, 6vw, 68px), 1.04): the hero headline only. Its second phrase is set in the gradient, the only gradient text on the page.
- **Headline** (500, clamp(32px, 4.4vw, 52px), 1.1): every section title, balanced across lines, max ~780px wide.
- **Title** (500, 20–22px, 1.3): card and step titles. Big plan names go up to 36px at -0.03em.
- **Body Lead** (400, 17–18px, 1.65–1.7): the paragraph under a headline, max 540px wide (~60ch).
- **Body** (400, 15px, 1.7): card body text, in Text Muted.
- **Label** (500, 12px, 0.16em tracking, uppercase): eyebrows above section titles, in Rose Blush. Step labels use 0.14em tracking in Orchid Glow.
- **Meta** (400, 12–13.5px): plan subtitles, footnotes, footer, the trust row, and badges.
- **Chip** (400, 10.5px / 11px): the Premium chip and the "Coming soon" pill only.

### Named Rules
**The Two Weights Rule.** Only 400 and 500 exist. Nothing bolder: emphasis comes from size, tracking, and the gradient, never from weight 600+.

**The Tight Big, Loose Small Rule.** The larger the type, the tighter the tracking (-0.035em at display); small labels open up (+0.16em). Body text stays at normal tracking.

## Layout

- **Container:** a single centered column, 1200px max (960px for the stakes and pricing sections, 760px for legal pages), with a 24px side gutter at every width.
- **Sections:** 104px of vertical padding (hero: 72px top, 96px bottom). Sections alternate Midnight Indigo and Deep Night bands, divided by 6%-white hairlines.
- **Grids:** they wrap fluidly instead of using breakpoints, through `auto-fit` with a minimum column width: 440px for hero/guide splits, 300–340px for card rows, 230px for the small feature cards. Cards in a row use a 20px gap (14px for small cards).
- **Section header:** an eyebrow, then a headline, then an optional lead, with 16–20px gaps. Headers are left-aligned for narrative sections and centered for plan, stakes and pricing.
- **Responsive:** the nav links hide below the `md` breakpoint; everything else is fluid through clamp() type and auto-fit grids.
- **Anchors:** section anchors use a 64px scroll margin so the sticky header doesn't cover titles.

## Elevation & Depth

This is a hybrid system. Surfaces are flat at rest and separated by tone and hairline borders. Depth comes mostly from **colored glow**: orchid-tinted halos under primary buttons and the Premium card, plus large radial gradients of orchid and violet light behind sections. **Soft neutral shadows** are allowed to layer physical objects (the phone mockup, a lifted panel), but they stay dark and very diffuse, never gray.

### Shadow Vocabulary
- **CTA glow** (`box-shadow: 0 10px 32px rgba(225,85,224,.4)`): the primary button. Use the smaller `0 6px 22px rgba(225,85,224,.35)` in the header. A button that shares a viewport with another glow (the pricing CTA under the Premium halo) goes flat.
- **Premium halo** (`box-shadow: 0 10px 50px rgba(225,85,224,.25)`): the one featured card in a set.
- **Object shadow** (`box-shadow: 0 40px 90px rgba(0,0,0,.6)`): physical objects like the phone frame.
- **Logo float** (`box-shadow: 0 30px 70px rgba(0,0,0,.55), 0 0 80px rgba(225,85,224,.25)`): a hero object that both floats and glows.
- **Ambient light** (`radial-gradient(60% 60% at 80% 20%, rgba(225,85,224,.28), transparent 70%)`): the background glow behind a section; violet at about .16–.18 opacity on the opposite side.

### Named Rules
**The Colored Glow First Rule.** Reach for an orchid glow before a shadow. Neutral shadows are for objects that physically sit above the page (a phone, a floating logo), not for ordinary cards.

**The Glow Budget Rule.** One glowing element per viewport besides the persistent header CTA.

## Shapes

Everything is soft and generous. Interactive controls are full pills: buttons, segmented toggles, the language switcher, badges and social icons. Cards use large radii that scale with their size: 24px for small feature cards, 28px for problem and roadmap cards, 32px for step and pricing cards, and 40px for the final CTA panel. Form fields are 16px. Borders are always 1px hairlines. The one exception is the roadmap cards, which use a **dashed** border to mean "not shipped yet". Circles echo the shapes: status dots, check bubbles, and the concentric rings around the logo, which ripple outward on a slow 6s loop.

## Components

**Soft and luminous**: pill buttons, big rounded cards, and states that glow rather than jump.

### Buttons
- **Shape:** full pill (9999px).
- **Primary:** the vertical rose → orchid → violet gradient (`linear-gradient(180deg, #E4829B, #E155E0, #AE66E8)`) with a white 500-weight label and the CTA glow underneath.

**The Bright Label Trade-off.** White labels on the brand gradient measure 2.6:1 (rose) to 3.6:1 (violet), under WCAG AA's 4.5:1. This is a deliberate brand decision: dark labels (which pass) and the deeper app gradient (which passes with white) were both tried and rejected for the look. Keep labels short, 500 weight and at least 14px, and never put long or small text on the gradient. Sizes are 54–56px (hero, plan, pricing, final) and 40px (header). A flat variant drops the glow.
- **Hover:** fades to 90% opacity. No lift and no color shift.
- **Ghost:** 6% white fill, 22% white border, white label. Hover raises the fill to 10%. Used for the secondary action ("See how it works", "Download free").
- **Focus:** every control on the marketing pages gets a 2px Orchid Mist outline, offset 3px, on `:focus-visible` (globals.css, scoped to `.landing`). Fields keep their own orchid border and ring.

### Segmented Toggle
- **Style:** a pill track (5% white fill, 12–14% white border, 3–4px inset) holding pill segments.
- **Active:** a white segment with Card Indigo text. **Inactive:** transparent with Text Muted, turning white on hover. Used for the language switcher and the "without a plan / with PennySave" switch.
- **Hit area:** the 28px language pills extend their tap target to 44px with an invisible pseudo-element. Below 640px the switcher becomes a native select so the header stays on one row.

### Chips
- **Premium:** a 20px pill with an 18% orchid fill and Orchid Mist text at 10.5px, next to a title.
- **Trial badge:** a solid Orchid Glow pill with white text (3.2:1, under the same trade-off), overlapping the Premium card's top edge.
- **Coming soon:** a 24px pill with a 20% white border and Text Label text at 11px.
- **Hero badge:** a pill with an 18% white border and 6% fill, with a mint status dot leading.

### Cards / Containers
- **Solid card:** Card Indigo fill with a Card Edge border, 28–32px radius and 30–34px padding.
- **Glass card:** a 4% white fill with a 10% white border and 24px radius, for small feature tiles over a glow.
- **Featured (Premium):** an Orchid Mist border, a gradient fill fading from 14% orchid into Card Indigo, and the Premium halo.
- **Statements, not cards:** the problem list and the roadmap are columns under a 1px top rule (12% white solid; 20% white dashed for "not shipped yet"), not boxed cards.
- **Step card:** a solid card with a 280px illustration well on top, lit by a radial glow in that step's hue (orchid, violet, rose).

### Inputs / Fields
- **Style:** Midnight Indigo fill (darker than the card it sits in), 35% white border (3.2:1 against the card, the WCAG 1.4.11 minimum for a field edge), 16px radius, 15px text and Placeholder-colored hints.
- **Focus:** the border turns Orchid Glow with a 2px orchid ring at 25%.
- **Labels:** 14px, weight 500, in Text Label.

### Navigation
- **Skip link:** the first focusable element on every marketing page; a white pill that slides in on focus and jumps to `#main`.
- **Header:** sticky, with a 72% Midnight Indigo backdrop, an 18px blur and a 7%-white bottom hairline. It holds the logo (34px, 10px radius) plus the wordmark with ".ai" in Orchid Glow, the nav links (14px Text Muted, white on hover), the language toggle and the small primary CTA.
- **Touch targets:** every control is at least 44px tall or extends its hit area to 44px (header CTA, language select, social icons, legal tabs).
- **Footer:** a 13px Text Faint row with Text Muted links, plus round 44px social icon buttons with a 12% white border that brighten on hover.

### Phone Mockup (signature)
An iPhone frame (54px outer radius, #26264A bezel, object shadow) showing the real app's monthly dashboard. Its header is a diagonal app gradient (`#B838B4 → #A93FC6 → #8A4BD0`) with glass pills (48% white border, dark translucent fill). It is the main product proof on the page, so keep it pixel-faithful to the iOS app. It is hidden from screen readers (sample content) and zooms to 85% below 400px.

### Three-Tap Mockup (signature)
The step-one keypad card plays the product's core promise on a 6s loop: the amount resolves out of a blur, the category chip lights with an orchid ring, the Save pill presses, and three orchid dots count the taps. Expo ease-out (`cubic-bezier(0.16, 1, 0.3, 1)`). With reduced motion it rests on the finished entry.

### Trust Row
Three short facts with mint checks under the single pricing CTA (iPhone only · no bank login · cancel in the App Store). It stands in for social proof the product doesn't have yet; never replace it with invented numbers or quotes.

## Do's and Don'ts

### Do:
- **Do** keep every page on Midnight Indigo (#0E0E24) and alternate Deep Night (#0B0B1E) bands for section rhythm.
- **Do** use the rose → orchid → violet gradient for the primary CTA and one payoff phrase per headline.
- **Do** build secondary surfaces and borders from translucent white (4–6% fill, 7–22% border).
- **Do** make controls pills and cards large-radius (24–40px), with 1px hairline borders.
- **Do** use orchid glows (`rgba(225,85,224,.25–.4)`) for emphasis, and diffuse dark shadows only for floating objects.
- **Do** set headlines in Poppins 500 with negative tracking (-0.03 to -0.035em) and `text-wrap: balance`.
- **Do** gate any looping motion behind `prefers-reduced-motion: no-preference`.

### Don't:
- **Don't** introduce a light theme, gray surfaces, or a second brand hue.
- **Don't** use font weights above 500.
- **Don't** put gray drop shadows on ordinary cards. Use tone and hairlines instead.
- **Don't** let more than one element glow at full strength in a viewport, besides the header CTA.
- **Don't** use Coral No (#F26A82) for alarm-style warnings. It contrasts outcomes; it never scares.
- **Don't** use sharp corners on interactive elements.
- **Don't** put anything but short button and badge labels on the brand gradient or Orchid Glow; white text there is under AA (see The Bright Label Trade-off).
- **Don't** use Unicode glyphs (✓ ✕) as icons. Use the drawn SVG icons in `icons.tsx`.
