# Gift Page UX — Step-by-Step Claim Flow

**Date:** 2026-03-26

## Problem

When a user who doesn't have Blitz Wallet installed lands on a gift page and clicks the deeplink, they see an error because the app isn't installed. The current page offers a single "Download Blitz Wallet" button that opens a modal with instructions buried in prose text — there's no visible guidance on the page itself.

## Goal

Replace the confusing single-button flow with a clear, always-visible two-step guide on the gift card so users immediately understand what to do.

## Design

### Gift Card Layout (after info grid)

```
─────────── divider ───────────

① Download Blitz Wallet
   Get the free app from the App Store or Google Play
   [Download Blitz Wallet] button

② Claim Your Gift
   Already installed? Tap below to open your gift
   [Open in Blitz Wallet]   [Copy Gift Link]
```

- The gift icon, title, amount, description, and info grid remain unchanged above the divider.
- The divider visually separates gift details from the "how to claim" steps.
- Expired/claimed gifts still show the existing error badge — steps section is only shown for active gifts (`!isClaimed && !isExpired`).
- `loadError` / `!giftData` branches render an error card before `renderGiftCard` sets the steps HTML, so steps correctly don't appear there.

### Step 1 — Download

- Button label: "Download Blitz Wallet"
- Button class: `step-btn primary download-btn`
- **No onclick needed.** The existing delegated click handler (IIFE script in `<body>`, line 901) listens for `.download-btn` clicks. On mobile it redirects directly to the app store; on desktop it opens the QR code modal (`#modalContainer`).

### Step 2 — Claim

- Primary button: "Open in Blitz Wallet"
  - Class: `step-btn primary`
  - Action: new `openInApp()` function → `window.location.href = 'blitz-wallet://gift/${giftId}'`
  - `giftId` is already a top-level JS const inlined by the server template (`const giftId = '${giftId}';`)
  - If app is installed, opens directly to the gift claim screen; if not, the custom scheme fails silently
- Secondary button: "Copy Gift Link"
  - Class: `step-btn secondary copy-button` ← **must keep `.copy-button`** so the existing `copyGift()` selector (`document.querySelector('.copy-button')`) still finds the button for the "Link Copied!" feedback

## Implementation

**Single file modified:** `netlify/handle-gift.js`

### CSS additions (inside `<style>` block)

```css
.steps-divider {
  border: none;
  border-top: 1px solid var(--lm-backgroundOffset);
  margin: 1.5rem 0;
}

.steps-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  text-align: left; /* override .gift-card { text-align: center } */
}

.step {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.step-number {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, var(--primary_color), var(--tertiary_color));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 0.9rem;
}

.step-content {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  flex: 1;
}

.step-title {
  font-weight: 600;
  font-size: 1rem;
  color: var(--lm-text);
}

.step-description {
  font-size: 0.9rem;
  opacity: 0.7;
  line-height: 1.4;
}

.step-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
}

.step-btn {
  padding: 0.75rem 1.25rem;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  font-family: var(--description_font);
  border: none;
  transition: all 0.3s ease;
}

.step-btn.primary {
  background: linear-gradient(135deg, var(--primary_color), var(--tertiary_color));
  color: white;
  box-shadow: 0 4px 15px rgba(3, 117, 246, 0.3);
}

.step-btn.primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(3, 117, 246, 0.4);
}

.step-btn.secondary {
  background: transparent;
  color: var(--primary_color);
  border: 1px solid var(--lm-backgroundOffset);
}

.step-btn.secondary:hover {
  background: var(--lm-background);
  border-color: var(--primary_color);
}
```

### JS addition (inside the `<head>` `<script>` block)

Add `openInApp()` function alongside the existing utility functions:

```js
function openInApp() {
  window.location.href = `blitz-wallet://gift/${giftId}`;
}
```

### HTML changes in `renderGiftCard()`

Replace the two existing inline buttons (inside the `(!isClaimed && !isExpired)` ternary):

**Before:**
```html
<button class="claim-button download-btn">
  Download Blitz Wallet
</button>
<button class="copy-button" onclick="copyGift()">
  Copy Gift Link
</button>
```

**After:**
```html
<hr class="steps-divider" />
<div class="steps-section">
  <div class="step">
    <div class="step-number">1</div>
    <div class="step-content">
      <div class="step-title">Download Blitz Wallet</div>
      <div class="step-description">Get the free app from the App Store or Google Play.</div>
      <div class="step-actions">
        <button class="step-btn primary download-btn">Download Blitz Wallet</button>
      </div>
    </div>
  </div>
  <div class="step">
    <div class="step-number">2</div>
    <div class="step-content">
      <div class="step-title">Claim Your Gift</div>
      <div class="step-description">Already installed? Tap below to open your gift in Blitz.</div>
      <div class="step-actions">
        <button class="step-btn primary" onclick="openInApp()">Open in Blitz Wallet</button>
        <button class="step-btn secondary copy-button" onclick="copyGift()">Copy Gift Link</button>
      </div>
    </div>
  </div>
</div>
```

## Reused Existing Code

| What | Where | How reused |
|---|---|---|
| `.download-btn` delegated click handler | handle-gift.js, IIFE in `<body>` (line 901) | Step 1 button carries this class; no onclick needed |
| `#modalContainer` QR download modal | handle-gift.js, `<body>` | Opened by the delegated handler on desktop |
| `copyGift()` | handle-gift.js, `<head>` script | Step 2 copy button; keeps `.copy-button` class so selector works |
| `lucide.createIcons()` | handle-gift.js, `<head>` script (line 738) | Already called after `renderGiftCard` sets innerHTML — no change needed |

## What Is NOT Changed

- The old simple modal (`#downloadModal` / `#downloadBackdrop`) — remains in the file as-is
- `detectOS()`, `showDownloadModal(os)`, `claimGift()` — remain but are no longer called by the new UI
- All expired/claimed/error states

## Verification

1. Run `netlify dev` and open `http://localhost:8888/gift/<valid-gift-id>`
2. Confirm two numbered steps appear below the info grid on an active gift
3. Step 1 "Download Blitz Wallet" button:
   - On desktop: opens QR code modal (`#modalContainer`) with iOS/Android tabs
   - On mobile: redirects directly to App Store or Play Store
4. Step 2 "Open in Blitz Wallet": fires deeplink `blitz-wallet://gift/<id>` (error expected if app not installed)
5. Step 2 "Copy Gift Link": copies URL, button label changes to "Link Copied!" and reverts after 2 seconds
6. Visit a gift that is expired or already claimed — confirm only the error badge shows, no steps section
