---
name: quiet-ui
description: User's own UI language - monospace, duotone, hairlines, no accent colour, smooth motion 220-280 ms with 50 ms stagger. Use for any interface built for them, web or desktop.
---

# Quiet UI

The user's own look, confirmed by two surveys on 2026-11-17. Build the interface in this language unless they say otherwise. `reference.html` next to this file is a working specimen — open it before writing markup.

## Confirmed decisions

| Dimension | Choice |
|---|---|
| Character | Swiss minimalism, quiet — loudness 3/10, density 4/10 |
| Colour | **duotone: ink + paper, no accent colour at all** |
| Face | **one monospace family everywhere** — JetBrains Mono, `ui-monospace` fallback |
| Edges | 1 px hairline borders, radius **3 px**, **no shadows** |
| Motion | **smooth, and it should feel good** — 220 ms state, 280 ms layout, stagger 40–60 ms, ease-out on entrance |
| Themes | dark and light, system default, remembered |
| Imagery | none — type, rules and numbers only |

References they picked: Linear, Vercel, Are.na, GitHub, Notion. **Stripe was explicitly rejected**, and so was the earlier draft's accent colour and editorial layout.

## Rules that make it read as quiet

1. **No accent colour.** Emphasis comes from weight, size and the panel surface. A red link or blue button breaks the language.
2. **One face.** Hierarchy is size + colour + weight, never a second family. No sans/mono pairing.
3. **Hairlines carry structure.** A 1 px border, a `gap: 1px` grid on a line-coloured background — instead of cards with shadows.
4. **Numbers align.** `font-variant-numeric: tabular-nums` wherever values sit in a column.
5. **Motion is a response, and it should be pleasant.** It exists for hover, press, focus and entrance — and the easing matters more than the duration. Nothing loops, nothing parallaxes, nothing bounces for its own sake.
6. **Labels are the only uppercase text.** 12 px, `letter-spacing: 0.08em`, muted colour. Everything else is sentence case.
7. **No CTA.** The user does not want a button that tells a visitor what to do; a link inside a sentence is enough.

## Tokens

```css
:root {
  --font: "JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace;

  --text-xs: 12px; --text-sm: 14px; --text-base: 15px;
  --text-lg: 21px; --text-xl: 32px; --text-2xl: 48px;

  --lh-display: 1.08; --lh-title: 1.20; --lh-body: 1.65;
  --tr-display: -0.02em; --tr-body: 0; --tr-label: 0.08em;

  --dur-state: 220ms; --dur-layout: 280ms; --dur-enter: 280ms; --stagger: 50ms;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-standard: cubic-bezier(0.4, 0, 0.6, 1);

  --radius: 3px;
  --col: 880px;
  --gut: clamp(16px, 3vw, 32px);
}

html[data-theme="light"] {
  --paper: #f4f2ec; --panel: #eceadf; --ink: #14140f;
  --muted: #6f6d64; --line: #d6d3c7;
}
html[data-theme="dark"] {
  --paper: #121210; --panel: #191917; --ink: #e9e6da;
  --muted: #948f7f; --line: #2b2a25;
}
```

## Patterns

**Hairline grid** — the card replacement:

```css
.grid { display: grid; gap: 1px; background: var(--line);
        border: 1px solid var(--line); border-radius: var(--radius); }
.cell { background: var(--paper); padding: 20px; }
.cell:hover { background: var(--panel); }
```

**Toggle** — a 1 px bordered button that inverts when active:

```css
.tog { border: 1px solid var(--line); border-radius: var(--radius);
       background: transparent; color: var(--ink); padding: 6px 10px;
       font-size: var(--text-xs); text-transform: uppercase; letter-spacing: var(--tr-label);
       transition: border-color var(--dur-state) var(--ease-out),
                   background-color var(--dur-state) var(--ease-out); }
.tog[aria-pressed="true"] { background: var(--ink); color: var(--paper); }
```

**Section header** — number, then a claim, nothing else:

```html
<p class="label">02 / typography</p>
<h2>A scale that inverts its leading.</h2>
```

## Motion that pleases the eye

Smooth is not a duration, it is an **easing plus a small distance**. Four numbers do the work:

| Decision | Value | Why it feels good |
|---|---|---|
| entrance | `opacity 0 → 1`, `translateY(8px) → 0`, 280 ms, `--ease-out` | the curve decelerates into place, so it settles instead of stopping |
| hover | border and background, 220 ms, `--ease-out` | fast enough to feel like a response, slow enough not to flicker |
| press | `transform: scale(.985)` on `:active`, return on release | 1.5 % is imperceptible as a size change, felt as weight |
| stagger | 50 ms between siblings, **max 5 items** | reads as one gesture; a 20-item cascade reads as a loading screen |

Rules that separate pleasant from cheap:

- **Ease-out for entrances, ease-in for exits.** `linear` only for opacity cross-fades and progress bars.
- **Distance small, duration short.** 8–12 px of travel and 280 ms; a 40 px slide at 600 ms is the tell of a template.
- **One property per interaction.** Lifting a card: `translateY(-2px)` and border colour together is fine; adding shadow, scale and blur is not.
- **Never animate a layout property.** `height`, `width`, `top` and `box-shadow` cost a frame budget; `transform` and `opacity` do not.
- **Reveal once.** `IntersectionObserver` with `threshold: 0.15`, `unobserve` after firing. Re-triggering on scroll-up is the most common cheap look.
- **Numbers may count, but stay under 600 ms** and only when a value actually changed.
- **Micro-overshoot is allowed once** — a button returning from `scale(.985)` with `--ease-out` already overshoots by a hair. Do not add a `cubic-bezier` that visibly bounces; that is loud.
- **Hover on a touch device does not exist.** Never put information behind hover alone.

```css
/* staggered entrance, the whole pattern */
.reveal { opacity: 0; transform: translateY(8px);
          transition: opacity var(--dur-enter) var(--ease-out),
                      transform var(--dur-enter) var(--ease-out); }
.reveal.in { opacity: 1; transform: none; }
```

```js
const io = new IntersectionObserver((es) => {
  for (const e of es) if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
}, { threshold: 0.15, rootMargin: "0px 0px -10% 0px" });
document.querySelectorAll(".reveal").forEach((el, i) => {
  el.style.transitionDelay = `${Math.min(i, 4) * 50}ms`;   // max 5 staggered items
  io.observe(el);
});
```

## Portability to desktop apps

The same decisions map directly; only the sizes change:

- **GTK4** — `font-family: "JetBrains Mono"` in CSS, `border-radius: 3px`, 1 px `border` with the line colour, no `box-shadow`; animate with `transition` on `background-color` and `transform` only.
- **Tauri / Electron** — the CSS above works unchanged.
- **Qt/QML** — `font.family: "JetBrains Mono"`, `radius: 3`, animate `Behavior on opacity` and `transform`, never `width`/`height`.
- **TUI** — the same pairing: ink on paper, one accent-free palette, labels uppercase, values right-aligned with tabular digits.

## Checklist

- [ ] One font family, no second one anywhere.
- [ ] Zero saturated colours — only ink, paper, panel, muted, line.
- [ ] Every separator is a 1 px rule; no shadows, no gradients.
- [ ] Radius 3 px; nothing pill-shaped.
- [ ] Only `opacity`/`transform`/`background-color`/`border-color` animate.
- [ ] 220 ms state, 280 ms layout; nothing above 300 ms except a counting number (≤600).
- [ ] Every entrance uses ease-out and travels 8–12 px, not 40.
- [ ] Stagger ≤50 ms and applied to at most 5 siblings.
- [ ] A reveal fires once; scrolling back up does not replay it.
- [ ] At least one interaction has a felt response (press scale or border shift), so the page does not feel static.
- [ ] `prefers-reduced-motion` leaves a working page.
- [ ] Numbers in columns use tabular figures.
- [ ] No CTA button, no hero illustration, no emoji.
