# Blitz Wallet Design System

The website has one aesthetic: the **simplistic, minimal, warm-neutral** look of the
home page (`index.html` / `pages/home/home.css`). **Home is the reference. Everything
else conforms to it.** When in doubt, open the home page and match it.

Two files hold the system:

| File | Purpose |
| --- | --- |
| [`src/assets/styles/index.css`](../src/assets/styles/index.css) | Design tokens (`:root`) + minimal base element styles |
| [`src/assets/styles/components.css`](../src/assets/styles/components.css) | Reusable component primitives (buttons, spinner, error box, loader, toast) |

Serverless functions can't `<link>` these, so the same tokens + primitives are
exported as a string from [`netlify/lib/design-css.js`](../netlify/lib/design-css.js)
and injected into each function's `<style>` block. **Keep the two in sync** — if you
change a token or primitive here, mirror it there.

## The rule

**Never hardcode a color, spacing, radius, shadow, or duration that a token exists
for.** If you're typing `#0375f6`, `#fbfaf7`, `rgba(18,17,17,…)`, `8px`, `999px`, or
`260ms`, use the token instead. If no token fits, add one to `index.css` (and
`design-css.js`) rather than inventing a local literal — that's how fragmentation
started.

## Tokens

### Color

| Token | Value | Use |
| --- | --- | --- |
| `--color-brand` | `#0375f6` | Primary accent, links, active states, primary buttons |
| `--color-brand-strong` | `rgba(3,117,246,0.28)` | Primary button hover shadow |
| `--color-green` | `#44be82` | Success / secondary accent |
| `--color-orange` | `#ffac30` | BTC token accent |
| `--color-ink` | `#121111` | Primary text |
| `--color-ink-70` | `rgba(18,17,17,0.68)` | Nav links, strong secondary text |
| `--color-ink-60` | `rgba(18,17,17,0.60)` | Body copy |
| `--color-ink-45` | `rgba(18,17,17,0.45)` | Muted / meta text |
| `--color-hairline` | `rgba(18,17,17,0.08)` | 1px card borders |
| `--color-bg` | `#fbfaf7` | Page background |
| `--color-surface` | `#ffffff` | Cards / panels |
| `--color-surface-warm` | `#f6f4ef` | Footer, subtle sections |
| `--color-surface-offset` | `#edebe7` | Chips, offsets, borders |
| `--color-error-bg` / `-border` / `-text` | `#fef2f2` / `#fecaca` / `#991b1b` | Error box only |

**Surfaces:** page = `--color-bg`; cards on the page = `--color-surface`; a section
that needs to recede = `--color-surface-warm`; small chips/offsets =
`--color-surface-offset`. **Ink:** headings/primary text = `--color-ink`; supporting
copy steps down the ramp (`-70` → `-60` → `-45`).

### Type, spacing, radius, shadow, motion

| Token | Value | Use |
| --- | --- | --- |
| `--font-sans` | `"Poppins", sans-serif` | Everything (loaded by `font-loader.js`) |
| `--fs-hero` / `--fs-h2` | `clamp(4.1rem,8.4vw,5rem)` / `clamp(2.75rem,6vw,4.9rem)` | Display headings |
| `--fs-lead` / `--fs-body` / `--fs-label` | `1.15rem` / `1rem` / `0.85rem` | Copy sizes |
| `--space-section` | `clamp(5rem,9vw,8rem)` | Section vertical padding |
| `--space-gutter` | `2rem` (→ `1rem` under 680px) | Horizontal gutter |
| `--container-max` | `1120px` | Content max-width |
| `--radius-card` / `--radius-pill` | `8px` / `999px` | Cards & buttons / pills & badges |
| `--shadow-card` / `--shadow-nav` / `--shadow-btn` | (see file) | Cards / nav / buttons |
| `--ease-micro` | `260ms ease` | Buttons, hovers, micro-interactions |
| `--ease-spring` | `cubic-bezier(0.22,1.18,0.36,1)` | Signature moments (word rotate, etc.) |

Legacy aliases (`--primary_color`, `--lm-background`, `--lm-text`, …) still resolve to
the semantic tokens so existing CSS keeps working. Prefer the semantic names in new or
updated code.

## Primitives

### Buttons

```html
<button class="btn-primary">Download the app</button>
<button class="btn-secondary">Learn more</button>
```

Solid Blitz-blue primary with a `translateY(-2px)` lift on hover; brand-outline
secondary for light surfaces. Do **not** rebuild buttons per page and do **not** use a
blue→green gradient (that variant is retired). The home hero ships its own over-dark
`.btn-secondary` for placement on dark elements — that's the only sanctioned override.

### Spinner

```html
<div class="spinner"></div>
<div class="spinner" style="--spinner-size: 32px"></div>
```

One spinner. Size with `--spinner-size` (default 40px). There is exactly one
`@keyframes spin`.

### Full-screen loader

```html
<div class="loading-screen">
  <div class="loading-screen-content">
    <img class="loading-wordmark" src="/public/…/wordmark.svg" alt="Blitz Wallet" />
    <div class="spinner"></div>
    <div class="loading-copy"><p>Loading…</p></div>
  </div>
</div>
```

### Error box

```html
<div class="error-box">
  <h2>Gift Not Found</h2>
  <p>This gift doesn't exist or has already been claimed.</p>
</div>
```

Every failure/not-found state uses this. Every fetch that can fail must render it —
never silently fall back to an empty page.

### Toast / overlay

```html
<div class="overlay-backdrop">          <!-- add .active to show -->
  <div class="overlay-card">
    <div class="overlay-title">Copied!</div>
    <div class="overlay-body">Payment link copied to your clipboard.</div>
    <button class="btn-primary">OK</button>
  </div>
</div>
```

This is the **only** notification mechanism. Do not use native `alert()` and do not
signal by swapping a button's text.

## Out of scope (follow-up)

- The 16 per-article blog stylesheets (`pages/blog/*/style.css`) and
  `masterBlogTheme.css` still carry local literals; migrate them in a later pass.
  `masterBlogTheme.css` also references stale modal selectors (`.modal`,
  `.modalContainer.active`) that no longer match the real download modal.
- No dark mode yet; tokens are structured so a `[data-theme]` layer can be added later.
