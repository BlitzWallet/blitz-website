# Localization Design — Blitz Wallet Website

**Date:** 2026-04-05
**Status:** Approved

## Problem

The Blitz Wallet marketing website is English-only. With a global Bitcoin audience across Latin America, Europe, and beyond, visitors who don't speak English can't read the site's content.

## Solution

Add i18next-based localization with URL prefix routing, supporting Spanish (es), Portuguese (pt), French (fr), and German (de) alongside English. Translation strings are initially English placeholders; the team fills in actual translations later.

---

## Architecture

### Libraries (CDN)

- `i18next` — core translation engine
- `i18next-http-backend` — fetches locale JSON files on demand
- `i18next-browser-languagedetector` — reads language from URL path prefix

### URL Structure

| URL | Language |
|-----|----------|
| `/` | English (default) |
| `/es/` | Spanish |
| `/pt/` | Portuguese |
| `/fr/` | French |
| `/de/` | German |

All language variants are served from the same underlying HTML files. i18next reads the URL prefix, fetches the matching locale JSON, and swaps DOM text for all `data-i18n` attribute targets before the page renders.

### Translation Files

Location: `/src/i18n/{lang}.json`

One file per language (en, es, pt, fr, de), organized by section:

```json
{
  "nav": { "products": "Products", "download": "Download" },
  "home": {
    "hero": { "title": "The Bitcoin wallet for everyone" }
  },
  "about": { ... },
  "contact": { ... },
  "footer": { ... },
  "modal": { ... }
}
```

Non-English files start as copies of en.json (placeholders) for you to fill in.

---

## Routing (netlify.toml)

### Static Pages — Language Prefix Rewrites

Added before all existing redirects. Status 200 = URL stays as `/es/...` but Netlify serves the same HTML:

```toml
[[redirects]]
  from = "/es/*"
  to = "/:splat"
  status = 200

[[redirects]]
  from = "/pt/*"
  to = "/:splat"
  status = 200

[[redirects]]
  from = "/fr/*"
  to = "/:splat"
  status = 200

[[redirects]]
  from = "/de/*"
  to = "/:splat"
  status = 200
```

### Netlify Functions — Language Prefix Routes

For gift, paylink, pool, and profile pages, language-prefixed routes pass `?lang=XX` to the function:

```toml
# profile
[[redirects]]
  from = "/es/u/:username"
  to = "/.netlify/functions/dynamic-profile?lang=es"
  status = 200

# gift
[[redirects]]
  from = "/es/gift/:giftInfo"
  to = "/.netlify/functions/handle-gift?lang=es"
  status = 200

# pool
[[redirects]]
  from = "/es/pools/:poolId"
  to = "/.netlify/functions/handle-pool?lang=es"
  status = 200

# paylink
[[redirects]]
  from = "/es/paylink/:paylinkId"
  to = "/.netlify/functions/handle-paylink?lang=es"
  status = 200
```

(Repeated for pt, fr, de.)

These must be placed **before** the existing `/:username` catch-all redirect.

---

## HTML Changes

### data-i18n Attributes

Every translatable text element gets a `data-i18n` dot-path key:

```html
<!-- Text content -->
<h1 data-i18n="home.hero.title"></h1>

<!-- Attribute translation (placeholder, aria-label, etc.) -->
<input data-i18n="contact.form.emailPlaceholder" data-i18n-attr="placeholder">
```

### Pages to Update

| File | Content to Tag |
|------|---------------|
| `index.html` | Hero, products, features, FAQ, CTA sections (~1200 words) |
| `pages/about/index.html` | Mission, vision, problem/solution, values (~1400 words) |
| `pages/contact/index.html` | Form labels, instructions (~100 words) |
| `pages/blog/index.html` | Headings, category labels (~50 words) |
| Navbar HTML (all pages) | Nav links, download button |
| Footer HTML (all pages) | Column headers, links |
| `src/components/downloadModal/index.js` | Modal text (built in JS) |

### New Files

| File | Purpose |
|------|---------|
| `src/js/i18n.js` | Initializes i18next, walks DOM, swaps text |
| `src/i18n/en.json` | English master translation file |
| `src/i18n/es.json` | Spanish (English placeholder) |
| `src/i18n/pt.json` | Portuguese (English placeholder) |
| `src/i18n/fr.json` | French (English placeholder) |
| `src/i18n/de.json` | German (English placeholder) |

---

## Language Switcher

A globe-icon dropdown added to the right side of every navbar:

```
🌐 EN ▾
  English  (/ — no prefix)
  Español  (/es/...)
  Português (/pt/...)
  Français  (/fr/...)
  Deutsch   (/de/...)
```

Clicking a language option navigates to `/{lang}{current-path}` (or removes the prefix for English). Active language is highlighted. Switcher is injected by `i18n.js` so it only needs to be added once.

---

## Netlify Functions

Each of the four functions (`dynamic-profile.js`, `handle-gift.js`, `handle-pool.js`, `handle-paylink.js`) is updated to:

1. Read `event.queryStringParameters.lang` (default `'en'`)
2. Look up UI strings from an inline `translations` object
3. Interpolate translated strings into the generated HTML

```javascript
const translations = {
  en: { title: 'Claim your gift', button: 'Claim' },
  es: { title: 'Claim your gift', button: 'Claim' }, // placeholder
  // ...
};
const t = translations[lang] || translations.en;
```

All non-English entries start as copies of English for you to fill in.

---

## Verification

1. Start dev server: `npm run dev`
2. Visit `http://localhost:3000` — page renders in English
3. Visit `http://localhost:3000/es/` — same page, i18next loads `es.json`, text is same (placeholder) but lang attribute changes
4. Click language switcher — URL changes to `/es/...`, switcher highlights Spanish
5. Navigate between pages — language prefix persists in links
6. Test `netlify dev` for function routes: `http://localhost:8888/es/gift/test-id` → function receives `?lang=es`
