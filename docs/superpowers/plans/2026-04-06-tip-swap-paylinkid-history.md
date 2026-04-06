# Tip Swap: PayLink ID Fix + Swap History Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the broken stablecoin tip swap wiring (paylinkId never persisted, wrong fields sent to backend APIs), implement the stubbed tip swap creation backend, and add localStorage swap history UI so users can reference past quote IDs for support.

**Architecture:** `currentPaylinkId` is generated once per swap attempt in `confirmStablecoin()` and stored in module state; all three downstream API calls (`createPayLinkInvoice`, `getPaylinkData`, `submitPaylinkSwap`) use this stored ID. The backend tip branch creates a `blitzPaylinks` Firestore doc (tagged `isTipPayment: true`) and gets a Flashnet quote, returning the deposit address. localStorage history mirrors the `handle-paylink.js` pattern using key `blitz_tip_swap_history`.

**Tech Stack:** Vanilla JS (no bundler/framework), Netlify static site, Firebase Cloud Functions (Node.js), Firestore, Flashnet Orchestration API

**Spec:** `docs/superpowers/specs/2026-04-06-tip-swap-paylinkid-history-design.md`

---

## Status note

As of plan writing, the following are already implemented on the `add_stablecoins_to_tips` branch:
- ✅ **Backend** (`createInvoice.js`): tip swap creation branch is fully implemented
- ✅ **`tips.js`**: `currentPaylinkId` state, all three API call fixes, localStorage history functions, `saveToSwapHistory` call in `confirmStablecoin()`
- ✅ **`tips_page.html`**: "View past swaps" button on input screen, swap history overlay markup

**The only remaining work is fixing the CSS selector mismatch in `pages/tips/tips.css`.**

---

## Chunk 1: Fix CSS selector mismatch for swap history overlay

## Task 1: Fix `pages/tips/tips.css` — align selectors with actual HTML/JS class names

**Files:**
- Modify: `pages/tips/tips.css`

**The problem:** The CSS was written with ID selectors (`#tip-swap-history-modal`) and prefixed class names (`.tip-swap-history-header`, `.tip-swap-history-item`) that don't match what the HTML and JS actually use. The HTML uses `class="swap-history-modal"`, `class="swap-history-header"`. The JS `renderSwapHistory()` generates `class="swap-history-item"`, `class="swap-quote"`, `class="chain-icon-wrapper"`, `class="chain-icon"`, `class="token-overlay"`, `class="quote-middle"`, `class="quote-id"`, `class="quote-time"`, `class="copy-btn"`.

**What the CSS currently has** (lines 854–925):
```css
#tip-swap-history-overlay { ... }   /* ✅ matches: element has id="tip-swap-history-overlay" */
#tip-swap-history-modal { ... }     /* ❌ no match: modal div uses class="swap-history-modal", no id */
.tip-swap-history-header { ... }    /* ❌ no match: HTML uses class="swap-history-header" */
.tip-swap-history-header button { } /* ❌ no match */
.tip-swap-history-item { ... }      /* ❌ no match: JS generates class="swap-history-item" */
.tip-swap-history-item .swap-meta { }  /* ❌ no match */
.tip-swap-history-item .swap-quote { } /* ❌ no match */
.tip-swap-history-item .copy-btn { }   /* ❌ no match */
.swap-quote { display:flex; ... }   /* ✅ matches the .swap-quote div */
```

**Missing CSS entirely:** `.chain-icon-wrapper`, `.chain-icon`, `.token-overlay`, `.quote-middle`, `.quote-id`, `.quote-time`, and standalone `.copy-btn`

- [ ] **Step 1: Replace the swap history CSS block in `pages/tips/tips.css`**

Find the existing swap history block (lines 854–925) starting with:
```css
/* ──swap history overlay ─────────────── */
#tip-swap-history-overlay {
```
and ending with:
```css
.swap-quote {
  display: flex;
  align-items: center;
  gap: 10px;
}
```

Replace the entire block with:

```css
/* ── Swap history overlay ──────────────────────────────────────────────────── */

#tip-swap-history-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
}

.swap-history-modal {
  background: var(--lm-background);
  border-radius: 1rem;
  width: 90%;
  max-width: 480px;
  max-height: 70vh;
  overflow-y: auto;
  padding: 0 1.25rem 1.25rem;
}

.swap-history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  position: sticky;
  top: 0;
  z-index: 99;
  background: var(--lm-background);
  padding: 1.25rem 0 0.75rem;
}

.swap-history-header button {
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
}

.swap-history-item {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding: 0.75rem 0;
}

.swap-quote {
  display: flex;
  align-items: center;
  gap: 10px;
}

.chain-icon-wrapper {
  position: relative;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
}

.chain-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
}

.token-overlay {
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
}

.quote-middle {
  flex: 1;
  min-width: 0;
}

.quote-id {
  font-size: 0.75rem;
  word-break: break-all;
  opacity: 0.9;
}

.quote-time {
  font-size: 0.7rem;
  opacity: 0.45;
  margin-top: 2px;
}

.copy-btn {
  font-size: 0.7rem;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: transparent;
  color: inherit;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
}

.copy-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}
```

- [ ] **Step 2: Manual UI verification**

Load a tip page in the browser. Verify:

1. Click "View past swaps" button — overlay background dims correctly (not transparent)
2. The modal panel appears centered with background color, rounded corners, and scrollable content
3. Header "Past Swaps" + ✕ button are sticky at the top of the modal
4. "No swaps yet." appears if localStorage is empty
5. After a swap creation, reopen history — confirm entry shows chain/token icons positioned correctly (token badge in bottom-right of chain icon), quote ID text, timestamp, and Copy button
6. Click outside modal → closes. Click ✕ → closes.

- [ ] **Step 3: Commit**

```bash
cd "/Users/blakekaufman/Desktop/Bliltz Wallet, LLC/blitz-wallet-website"
git add pages/tips/tips.css
git commit -m "fix: correct CSS selectors for swap history overlay and add missing icon/quote styles"
```

---

## Final verification checklist

- [ ] Overlay backdrop renders with dark semi-transparent background when opened
- [ ] Modal panel has correct background, border-radius, max-height with scroll
- [ ] Each history entry shows chain icon + token badge overlay correctly positioned
- [ ] Quote ID and timestamp are readable in each entry
- [ ] Copy button is styled and functional (copies quote ID to clipboard)
- [ ] Overlay closes on backdrop click and ✕ button click
- [ ] `blitz_tip_swap_history` localStorage key is populated after a real swap creation (check DevTools → Application → Local Storage)
- [ ] Backend: Firestore `blitzPaylinks/{paylinkId}` doc is created with `isTipPayment: true` when tip swap is initiated
