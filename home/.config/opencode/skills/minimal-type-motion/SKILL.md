---
name: minimal-type-motion
description: Measured type and motion tokens from Linear, Vercel, Stripe and Apple - scale, tracking, line-height, durations, easings. Use for display type or UI animation work.
---

# Minimal Type & Motion

Numbers below were read with `getComputedStyle` from the live sites on 2026-11-17, not from memory. Use them as a starting point, then adjust to the face you actually ship.

## What the sites actually do

| Site | Display face | h1 size / line-height | Tracking | Weight | Body |
|---|---|---|---|---|---|
| Linear | Inter Variable | 64 / 64 px (1.00) | **−0.022 em** | 510 | 15 / 24 px, Inter |
| Vercel | Geist Sans | 64 / 64 px (1.00) | **−0.060 em** | 400 | 16 / 24 px, Geist Mono |
| Stripe | sohne-var | 48 / 55.2 px (1.15) | −0.020 em | 300 | 14 / 19.6 px, weight 300 |
| Apple | SF Pro Text | 34 / 50 px (1.47) | −0.011 em | 600 | — |
| Arc | system-ui | 60 / 72 px (1.20) | normal | 300 | 15 / 22.5 px |

Three patterns worth copying:

1. **Tracking is negative and grows with size.** Every site with a large display cuts spacing; the bigger the type, the more it cuts. Below 16 px the tracking is zero or slightly negative, never positive.
2. **Display line-height is 1.0–1.2.** Body is 1.5–1.6. The ratio inverts as size grows — this is what makes large type read as one shape instead of stacked lines.
3. **One face, one mono accent.** Linear: Inter + Berkeley Mono. Vercel: Geist Sans + Geist Mono. The mono is used for labels, code and small metadata, not for paragraphs.

## Motion, measured

| Site | State-change duration | Easing |
|---|---|---|
| Apple | 320 ms | `cubic-bezier(0.4, 0, 0.6, 1)` (standard) |
| Arc | 150 ms | `ease` |

Rules that hold across them:

- **100–160 ms** for an instant response (hover, press, focus ring). Above 200 ms a hover feels laggy.
- **240–320 ms** for a layout change (expand, page transition, drawer). Above 400 ms it reads as a loading state.
- **Ease-in on entrances, ease-out on exits.** Never linear for movement; `linear` is only for opacity cross-fades and progress bars.
- **Animate `opacity` and `transform` only.** Width, height, top, left and box-shadow trigger layout or paint on every frame; if you need height, animate a `scaleY` on a wrapper or use `grid-template-rows: 0fr → 1fr`.
- **One accent animation per view.** Two things moving at once reads as noise, not polish.
- **Scroll-triggered reveals fire once.** Re-triggering on every pass is the most common cheap-looking mistake.

## Tokens to start from

```css
:root {
  --font-sans: "Inter Variable", system-ui, sans-serif;
  --font-mono: "Berkeley Mono", ui-monospace, monospace;

  /* display scale, ratio ≈ 1.33 */
  --text-xs: 12px;
  --text-sm: 14px;
  --text-base: 16px;
  --text-lg: 21px;
  --text-xl: 32px;
  --text-2xl: 48px;
  --text-3xl: 64px;

  /* line-height inverts with size */
  --lh-display: 1.05;   /* ≥48px */
  --lh-title: 1.2;      /* 24–47px */
  --lh-body: 1.55;      /* ≤16px */

  /* tracking in em, not px */
  --tr-display: -0.03em;  /* ≥48px */
  --tr-title: -0.015em;   /* 24–47px */
  --tr-body: -0.005em;    /* 16px */
  --tr-mono: 0.02em;      /* labels set in mono, slightly open */

  /* motion */
  --dur-instant: 120ms;
  --dur-state: 180ms;
  --dur-layout: 280ms;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);   /* entrances */
  --ease-in: cubic-bezier(0.4, 0, 1, 1);       /* exits */
  --ease-standard: cubic-bezier(0.4, 0, 0.6, 1); /* anything else */
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

## Checklist before calling a page done

- [ ] Two faces maximum: one sans, one mono. No third.
- [ ] Two weights maximum per face — or a variable axis, but only two named stops.
- [ ] Display sizes have `line-height` ≤ 1.2 and negative tracking in `em`.
- [ ] Body text is 15–16 px with `line-height` 1.5–1.6; nothing below 13 px except legal.
- [ ] The type scale has ≤ 6 steps and a consistent ratio (1.25–1.4).
- [ ] Hover/press transitions are 100–180 ms and animate only `opacity`/`transform`/`color`.
- [ ] `prefers-reduced-motion` is honoured and leaves a usable page.
- [ ] One accent colour; borders 1 px; shadows none or one.
- [ ] Tabular numbers (`font-variant-numeric: tabular-nums`) wherever numbers align in a column.

## Where this does not apply

Editorial and marketing layouts with deliberate asymmetry, and dashboards that need dense data tables, break these rules on purpose. The rules are for product UI and landing pages that want to feel quiet.
