---
name: quiet-ui
description: The user's own interface language - monospace, duotone, hairline rules, no accent colour, motion 220-280 ms. Use when building any UI for them, on web or in a desktop app.
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
| Motion | 220 ms for state, 280 ms for layout, entrance and state only |
| Themes | dark and light, system default, remembered |
| Imagery | none — type, rules and numbers only |

References they picked: Linear, Vercel, Are.na, GitHub, Notion. **Stripe was explicitly rejected**, and so was the earlier draft's accent colour and editorial layout.

## Rules that make it read as quiet

1. **No accent colour.** Emphasis comes from weight, size and the panel surface. A red link or blue button breaks the language.
2. **One face.** Hierarchy is size + colour + weight, never a second family. No sans/mono pairing.
3. **Hairlines carry structure.** A 1 px border, a `gap: 1px` grid on a line-coloured background — instead of cards with shadows.
4. **Numbers align.** `font-variant-numeric: tabular-nums` wherever values sit in a column.
5. **Motion is a response, not decoration.** It exists for hover, press, focus and entrance. Nothing loops, nothing parallaxes.
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

  --dur-state: 220ms; --dur-layout: 280ms;
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
- [ ] 220 ms state, 280 ms layout; nothing above 300 ms.
- [ ] `prefers-reduced-motion` leaves a working page.
- [ ] Numbers in columns use tabular figures.
- [ ] No CTA button, no hero illustration, no emoji.
