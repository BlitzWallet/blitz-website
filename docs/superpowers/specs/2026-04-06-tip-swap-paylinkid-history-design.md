# Tip Swap: PayLink ID Fix + Swap History
**Date:** 2026-04-06
**Branch:** add_stablecoins_to_tips

---

## Context

The tips page stablecoin flow has three broken wires and one unimplemented backend branch:

1. `generatePayLinkId()` is called inside `confirmStablecoin()` but the result is never saved to state — it's thrown away after the fetch.
2. `doPoll()` sends `{ requestUsername }` to `/getPaylinkData` but the backend expects `{ paylinkId }`.
3. `handleTxHash()` sends `{ requestUsername, quoteId }` to `/submitPaylinkSwap` but the backend expects `{ paylinkId }`.
4. The tip swap creation branch in `createInvoice.js` (lines 128–132) is stubbed with `return;` — the logic to look up the tip recipient, create a Firestore doc, and get a Flashnet quote is missing.

Additionally, there is no localStorage swap history for tips, making it impossible for users or support to reference past quote IDs.

---

## Scope

Two files in this repo, one file in firebase-backend:

| File | Change |
|------|--------|
| `pages/tips/tips.js` | Add `currentPaylinkId` state; fix API calls; add localStorage history |
| `tips_page.html` | Add "View past swaps" button on input screen; add history overlay |
| `firebase-backend/functions/functionLogic/createInvoice.js` | Implement tip swap creation branch |

---

## Design

### 1. `tips.js` — State & API fixes

**New state variable** (add alongside existing stablecoin state, ~line 435):
```js
let currentPaylinkId = null;
```

**`confirmStablecoin()`** — generate and persist the ID before the fetch, then use it in the body. Two changes are required: (a) assign to state before the fetch, and (b) replace the inline `generatePayLinkId()` call inside `JSON.stringify` with `currentPaylinkId`:
```js
// Before the fetch:
currentPaylinkId = generatePayLinkId();

// In the fetch body, replace the inline call:
body: JSON.stringify({
  paylinkId: currentPaylinkId,   // was: generatePayLinkId()
  tipUsername: username,
  // ... rest unchanged
})
```
A fresh ID is generated on each `confirmStablecoin()` call, so retrying after an error naturally produces a new paylinkId.

**`doPoll()`** — fix body:
```js
body: JSON.stringify({ paylinkId: currentPaylinkId, checkInvoice: true })
```
Remove the `requestUsername` field.

**`handleTxHash()`** — fix `submitPaylinkSwap` body:
```js
body: JSON.stringify({
  paylinkId: currentPaylinkId,
  txHash,
  sourceAddress: sourceAddress || null,
})
```
Remove `requestUsername` and `quoteId`.

**`resetToInputScreen()`** — add reset:
```js
currentPaylinkId = null;
```

**After successful swap creation** in `confirmStablecoin()` (after `depositAddress`/`quoteId` are set), call:
```js
saveToSwapHistory({
  paylinkId: currentPaylinkId,
  quoteId: currentQuoteId,
  network: selectedStableNetwork,
  currency: selectedCryptoToken,
  username,
  timestamp: Date.now(),
});
```

---

### 2. `tips.js` — localStorage swap history

**Storage key constant:**
```js
const SWAP_HISTORY_KEY = 'blitz_tip_swap_history';
```

**Functions to add** (mirroring `handle-paylink.js` pattern):

```js
function getSwapHistory() {
  const raw = localStorage.getItem(SWAP_HISTORY_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch (e) { return []; }
}

function saveToSwapHistory(entry) {
  const history = getSwapHistory();
  history.unshift(entry);
  localStorage.setItem(SWAP_HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
}

function showSwapHistory() {
  renderSwapHistory();
  document.getElementById('tip-swap-history-overlay').style.display = 'flex';
}

function hideSwapHistory() {
  document.getElementById('tip-swap-history-overlay').style.display = 'none';
}

function renderSwapHistory() {
  const listEl = document.getElementById('tip-swap-history-list');
  if (!listEl) return;
  const history = getSwapHistory();
  if (!history.length) {
    listEl.innerHTML = '<p style="opacity:0.5;font-size:0.85rem;">No swaps yet.</p>';
    return;
  }
  listEl.innerHTML = history.map((entry) => {
    const time = new Date(entry.timestamp).toLocaleString();
    const chain = (entry.network || '').toLowerCase();
    const currency = (entry.currency || '').toLowerCase();
    const chainImage = chain === 'polygon'
      ? `/src/assets/images/chain-${chain}.png`
      : `/src/assets/images/chain-${chain}.svg`;
    const tokenImage = currency === 'usdc'
      ? `/src/assets/images/usdc.svg`
      : `/src/assets/images/usdt.svg`;
    return `
      <div class="swap-history-item">
        <div class="swap-quote">
          <div class="chain-icon-wrapper">
            <img src="${chainImage}" class="chain-icon" />
            <img src="${tokenImage}" class="token-overlay" />
          </div>
          <div class="quote-middle">
            <div class="quote-id">${entry.quoteId || ''}</div>
            <div class="quote-time">${time}</div>
          </div>
          <button class="copy-btn" data-qid="${entry.quoteId}">Copy</button>
        </div>
      </div>
    `;
  }).join('');

  listEl.querySelectorAll('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      navigator.clipboard.writeText(btn.dataset.qid);
    });
  });
}
```

---

### 3. `tips_page.html` — UI additions

**"View past swaps" link on input screen** — add after the `Switch Currency` button (line ~128):
```html
<button class="swap-history-btn" onclick="showSwapHistory()">
  View past swaps
</button>
```

**History overlay** — add before closing `</body>`:
```html
<div id="tip-swap-history-overlay" style="display:none;"
     class="swap-history-overlay" onclick="hideSwapHistory()">
  <div class="swap-history-modal" onclick="event.stopPropagation()">
    <div class="swap-history-header">
      <h3>Past Swaps</h3>
      <button onclick="hideSwapHistory()">✕</button>
    </div>
    <div id="tip-swap-history-list"></div>
  </div>
</div>
```

CSS follows the existing `swap-history-*` class patterns from `handle-paylink.js`. Styles go in `pages/tips/tips.css`.

---

### 4. `createInvoice.js` — Tip swap implementation

All names used below (`VALID_NETWORKS`, `VALID_CURRENCIES`, `FLASHNET_BASE_URL`, `hexToSparkAddress`, `loadBitcoinPrice`) are already imported/defined at the top of `createInvoice.js` (lines 8, 13, 21–30) — no additional imports needed.

Replace the stubbed `return;` in the `if (fiatAmount && fiatCode && tipUsername && paylinkId)` branch with:

```js
// 1. Validate network and currency
if (!VALID_NETWORKS.has(network) || !VALID_CURRENCIES.has(currency)) {
  return res.status(400).json({ status: "ERROR", reason: "Unsupported network or currency" });
}

// 2. Look up tip recipient
const userSnap = await db.collection("blitzWalletUsers")
  .where("contacts.myProfile.uniqueNameLower", "==", tipUsername.toLowerCase())
  .get();

if (userSnap.empty) {
  return res.status(400).json({ status: "ERROR", reason: "User not found" });
}

const userData = userSnap.docs[0].data();
const identityPubKey = userData.contacts?.myProfile?.sparkIdentityPubKey;
if (!identityPubKey) {
  return res.status(400).json({ status: "ERROR", reason: "User has not set up payments" });
}
const creatorUUID = userData.uuid;

// 3. Derive Spark address
const sparkResult = hexToSparkAddress(identityPubKey);
if (!sparkResult.success) {
  throw new Error(`Failed to derive Spark address: ${sparkResult.error}`);
}

// 4. Convert fiatAmount → USDC units
// Load BTC price in fiatCode (and USD if fiatCode != USD) to compute USD equivalent
const [btcInFiat, btcInUsd] = await Promise.all([
  loadBitcoinPrice(fiatCode),
  fiatCode.toUpperCase() !== 'USD' ? loadBitcoinPrice('USD') : Promise.resolve(null),
]);
const btcInUsdValue = fiatCode.toUpperCase() === 'USD' ? btcInFiat.value : btcInUsd.value;
const fiatToUsdRatio = fiatCode.toUpperCase() === 'USD' ? 1 : (btcInUsdValue / btcInFiat.value);
const usdEquivalent = fiatAmount * fiatToUsdRatio;
const amountSmallestUnits = String(Math.round(usdEquivalent * 1.0075 * 1_000_000));

// 5. Create Firestore doc for this tip swap
await db.collection("blitzPaylinks").doc(paylinkId).set({
  isTipPayment: true,
  tipUsername,
  creatorUUID,
  identityPubKey,
  fiatAmount,
  fiatCode,
  network,
  currency,
  isPaid: false,
  createdAt: Date.now(),
});

// 6. Create Flashnet quote
const quoteRes = await fetch(`${FLASHNET_BASE_URL}/v1/orchestration/quote`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.FLASHNET_API_KEY}`,
    "X-Idempotency-Key": `tip-quote:${paylinkId}`,
  },
  body: JSON.stringify({
    sourceChain: network,
    sourceAsset: currency,
    destinationChain: "spark",
    destinationAsset: "BTC",
    amount: amountSmallestUnits,
    recipientAddress: sparkResult.address,
    slippageBps: 50,
    affiliateId: "tip",
    ...(refundAddress ? { refundChain: network, refundAddress } : {}),
  }),
});

if (!quoteRes.ok) {
  const errBody = await quoteRes.text();
  throw new Error(`Flashnet quote failed: ${errBody}`);
}

const quote = await quoteRes.json();

// 7. Update doc with quote data
await db.collection("blitzPaylinks").doc(paylinkId).update({
  quoteId: quote.quoteId,
  depositAddress: quote.depositAddress,
  amountIn: quote.amountIn,
  sourceChain: network,
  sourceAsset: currency,
});

return res.status(200).json({
  status: "SUCCESS",
  depositAddress: quote.depositAddress,
  amountIn: quote.amountIn,
  estimatedOut: quote.estimatedOut,
  quoteId: quote.quoteId,
});
```

---

## Data Flow

```
User enters amount → confirmStablecoin()
  → currentPaylinkId = generatePayLinkId()   [NEW: persisted to state]
  → POST /createPayLinkInvoice {paylinkId, tipUsername, network, currency, fiatAmount, fiatCode}
    → backend: lookup user, create blitzPaylinks doc, Flashnet quote
    → returns {depositAddress, amountIn, quoteId}
  → saveToSwapHistory({paylinkId, quoteId, network, currency, username, timestamp})  [NEW]
  → show stable-pay-screen

User sends funds → handleTxHash(txHash, sourceAddress)
  → POST /submitPaylinkSwap {paylinkId, txHash, sourceAddress}  [FIXED: was requestUsername]
  → startIsPaidPolling()

doPoll()
  → POST /getPaylinkData {paylinkId, checkInvoice: true}  [FIXED: was requestUsername]
  → if isPaid → show success screen
```

---

## Verification

1. **Swap creation:** Call `/createPayLinkInvoice` with `{ paylinkId: "abc123xyz", tipUsername: "testuser", network: "base", currency: "USDC", fiatAmount: 10, fiatCode: "USD" }` — expect `blitzPaylinks/abc123xyz` doc created in Firestore and a valid `depositAddress` + `quoteId` returned.

2. **Polling fix:** After swap creation, confirm `doPoll()` sends `{ paylinkId: currentPaylinkId }` (check Network tab in DevTools) — not `requestUsername`.

3. **Submit fix:** Trigger `handleTxHash()` with a test hash — confirm the fetch body contains `paylinkId`, not `requestUsername`.

4. **History:** After a successful swap creation, open DevTools → Application → localStorage → confirm `blitz_tip_swap_history` entry exists with `quoteId`, `network`, `currency`, `timestamp`.

5. **History UI:** Click "View past swaps" on the input screen — confirm modal opens, entry shows chain/token icons and a working "Copy" button for the quote ID.
