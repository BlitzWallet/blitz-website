# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **Blitz Wallet** marketing/PR website — a static site with Netlify serverless functions. It serves as the public-facing promotional site for a Bitcoin Lightning wallet app.

## Development Commands

```bash
# Install dependencies
npm install

# Start dev server (runs TypeScript watch + nodemon)
npm run dev

# No build step or test suite is configured
```

Local dev server runs at `http://localhost:3000`. For Netlify function testing, use `netlify dev` with the Netlify CLI.

## Architecture

**Stack**: Vanilla HTML/CSS/JavaScript — no frontend framework, no bundler, no TypeScript on the frontend.

**Hosting**: Netlify with serverless functions in `/netlify/`. All redirects and routing rules are in `netlify.toml`.

### Routing Model

Static pages live in `/pages/` and `/index.html`. Dynamic routes are handled by Netlify functions:

| Route | Handler |
|-------|---------|
| `/u/:username` | `netlify/dynamic-profile.js` — generates user profile pages with OG metadata from Firestore |
| `/gift/:giftInfo` | `netlify/handle-gift.js` — gift claiming pages |
| `/pools/:poolId` | `netlify/handle-pool.js` — pool contribution pages |
| `/:username` (catch-all) | Redirects to `/tips_page.html` |

API routes (LNURL, gift details, pool data) are Netlify proxy redirects to Google Cloud Functions at `*-6krimtymjq-uc.a.run.app`. These proxies add a signed `X-From: Netlify` header using `API_SIGNATURE_TOKEN`.

### Netlify Functions

The three functions in `/netlify/` use Firebase Admin SDK to query Firestore and return fully-rendered HTML pages with dynamic OG meta tags. They require Firebase service account credentials in environment variables.

### Blog System

Blog posts are static HTML pages in `/pages/blog/`. The blog index is driven by `/pages/blog/blogContentList.js`, which exports an array of post metadata. Adding a new post requires both creating the HTML file and adding an entry to that list.

### Nostr Integration

`.well-known/nostr.json` is auto-regenerated nightly by the GitHub Actions workflow in `.github/workflows/update-nostr-json.yml`, which calls `scripts/generate-nostr-json.js` to pull NIP-5 handle data from Firestore.

### App Deep Linking

`/src/js/profile.js` detects the user's device (iOS/Android/other) and redirects to the appropriate app store or uses the `blitz-wallet://u/:username` deep link scheme. `.well-known/apple-app-site-association` and `.well-known/assetlinks.json` configure universal/app links.

### Shared Components

- `/src/js/navbar.js` — mobile menu toggle, scroll-based styling
- `/src/components/downloadModal/` — reusable "download the app" modal included across pages
- Google Analytics (`G-WNRJ7Y4RVE`) is included on all pages via gtag.js
