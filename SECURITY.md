# Security Policy

The Blitz Wallet website ([blitzwalletapp.com](https://blitzwalletapp.com)) is the public, promotional site for Blitz — a self-custodial Bitcoin/Lightning wallet built on the Spark Layer 2 network. While this repository does not custody keys or funds directly, vulnerabilities here can still put user funds and privacy at risk through phishing, deep-link abuse, or misdirection to malicious payment flows. We take every report seriously.

This policy covers the website codebase in this repository, including static pages, Netlify Functions, proxy redirects, and `.well-known` configuration. For vulnerabilities in the Blitz Wallet app itself (key management, Spark/Lightning/Liquid swaps, etc.), please use the same contact below — we will route it — or report directly to the [BlitzWallet](https://github.com/BlitzWallet/BlitzWallet) repository if it has a separate policy.

## Reporting a Vulnerability

Please do not report security vulnerabilities through public GitHub issues, discussions, or social media.

Instead, email us at `security@blitzwalletapp.com`.

Please avoid including seeds, private keys, or other credentials in your report. If your report contains sensitive details, we will provide an encrypted channel upon first contact.

### What to include

To help us triage and resolve the issue quickly, please include as much of the following as you can:

- A description of the vulnerability and its potential impact
- The affected URL(s) and component(s) (e.g. `/u/:username`, `/gift/:giftInfo`, `/pools/:poolId`, `/paylink/:paylinkId`, `/.well-known/lnurlp/:username`, `/.well-known/nostr.json`, `apple-app-site-association` / `assetlinks.json`)
- Step-by-step instructions to reproduce the issue, including browser/OS and whether you tested on `blitzwalletapp.com` or a local `netlify dev` instance
- Any relevant headers, requests, or responses (please redact seeds, private keys, tokens, and other credentials)
- Any proof-of-concept code, logs, or screenshots
- Whether the issue has been disclosed anywhere else

### What to expect

- We will acknowledge your report within 7 days and keep you informed as we investigate
- We will work with you to understand and validate the issue
- Once a fix is released, we are happy to credit you for the discovery if you would like
- We ask that you give us a reasonable amount of time to address the issue before any public disclosure, and that you avoid actions that put user funds or data at risk while researching

## Scope

Reports of particular interest for this website include:

- Cross-site scripting (XSS) or HTML injection via dynamic pages and OG metadata (`dynamic-profile`, `handle-gift`, `handle-pool`, `handle-paylink`, `tips_page.html` catch-all `/:username`)
- Open redirect, URL spoofing, or domain-confusion across canonical and alias domains (`blitzwalletapp.com`, `blitz-wallet.com`, `blitzwallet.app`, `www.blitzwallet.app`)
- Deep-link abuse or app-association flaws (`blitz-wallet://u/:username`, `.well-known/apple-app-site-association`, `.well-known/assetlinks.json`)
- Server-side request forgery, header injection, or signature bypass on proxied API routes (`/getInvoice`, `/handleFLashnetRequset`, `/getBitcoinGiftDetails`, `/getPoolData`, `/createPoolInvoice`, `/checkPoolPayment`, `/getPaylinkData`, `/createPayLinkInvoice`, `/submitPaylinkSwap`, `/.well-known/lnurlp/:username`, `/.well-known/lnurlverify/:sparkIDCode`) including `X-From: Netlify` / `API_SIGNATURE_TOKEN` handling
- Rate-limit bypass on proxied endpoints
- Cache poisoning or header misconfiguration (CSP `frame-ancestors`, `X-Frame-Options`, `Strict-Transport-Security`, `Referrer-Policy`)
- Unauthorized access to or exposure of Firestore / Firebase data via Netlify Functions
- Exposure or manipulation of `.well-known/nostr.json` (NIP-05) or Lightning Address infrastructure
- Supply-chain or build integrity issues affecting deployed Netlify Functions and edge headers
- Gift, pool, or pay-link abuse originating from website logic (expired/reclaimed links, unclaimed balance exposure)

Issues in third-party dependencies (Netlify platform, Firebase Admin SDK, Spark SDK, Breez Liquid SDK, etc.) should be reported upstream to the respective projects, though we appreciate a heads-up if the Blitz website is affected.

### Out of scope

The following are generally out of scope unless you can demonstrate a concrete security impact on users or funds:

- Denial-of-service without a security boundary bypass
- SPF/DKIM/DMARC best-practice suggestions without a spoofing proof-of-concept
- Clickjacking on pages with no sensitive action
- Social engineering or physical access
- Reports from automated scanners without a validated exploit

## Supported Versions

The Blitz Wallet website is continuously deployed from this repository — there are no versioned releases. Only the current production deployment at `https://blitzwalletapp.com` is supported with security updates.

For the Blitz Wallet app itself, only the latest release is supported. Please make sure you are running the most recent version of the app before reporting an app-related issue if possible.
