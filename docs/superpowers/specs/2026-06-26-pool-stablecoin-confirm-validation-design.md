# Pool Stablecoin Confirm Validation + Refund Address Screen

**Date:** 2026-06-26
**Status:** Approved (design)
**Files touched:** `netlify/handle-pool.js` only. No backend changes. No changes to `src/paylink-flashnet.ts`.

## Problem

Stablecoin contributions to payment pools work end-to-end *except* the on-page
confirm validation. The deposit screen currently polls FlashNet's status
endpoint directly with the public client key keyed on `quoteId`:

```
GET https://orchestration.flashnet.xyz/v1/orchestration/status?quoteId=...
Authorization: Bearer fnp_...
```

FlashNet's read-token security model rejects this: a public client key
(`fnp_`) can only read an order's status when it presents a short-lived
`readToken`. That token is only issued by the **submit** endpoint, and submit
requires the **deposit transaction id**. The current pool code never submits
and never obtains a deposit txid, so status polling never returns a usable
result.

Additionally, the quote is generated without a refund address, so a failed
swap has no destination to auto-return funds to. The backend already supports
a `refundAddress` (it forwards `refundChain` + `refundAddress` to FlashNet);
the website simply never collects or sends one.

## Goals

1. Collect an optional refund address before generating a stablecoin quote.
2. Detect the on-chain deposit and obtain its transaction id.
3. Submit `{ quoteId, txHash }` to FlashNet with the public key to obtain
   `{ orderId, readToken }`.
4. Poll status by `orderId` with the `readToken` until completed/failed.

## Non-goals

- No backend changes (kept as a documented fallback only — see Risks).
- No changes to `src/paylink-flashnet.ts` or the `public/paylink-swap.js`
  bundle. We consume the existing global as-is.
- No new network support; the existing stablecoin network list is unchanged.

## Architecture

Everything is client-side inside the inline page script of
`netlify/handle-pool.js`, mirroring the proven paylink flow in
`netlify/handle-paylink.js`.

The pool page loads the existing bundle once:

```html
<script src="${domain}/public/paylink-swap.js"></script>
```

and reuses the global it exposes:

- `PaylinkSwap.watchForTransfer({ depositAddress, tokenAddress, chainId, onFound })`
- `PaylinkSwap.pollForBalance({ tokenAddress, depositAddress, chainId, expectedAmount, onFound })`

`paylink-swap.js` is built from `src/paylink-flashnet.ts` by
`scripts/build-paylink-swap.mjs` (esbuild → IIFE, `globalName: PaylinkSwap`).
No rebuild is required because the source is unchanged.

### Flow

```
amount entry
  → "Pay with Stablecoins"
  → stableNetwork  (currency + network selection)        [existing]
  → stableRefund   (NEW: optional refund address)        [new step]
  → generatePoolStablecoinQuote()  (now passes refundAddress)
  → stablePayment  (QR + deposit)                        [existing screen, new logic]
        EVM:     watchForTransfer + pollForBalance ──┐
        non-EVM: manual "paste tx hash" input ───────┤
                                                     ▼
                                          onSwapDeposit(txHash, from)
                                                     ▼
        POST /v1/orchestration/submit  (Bearer fnp_, { quoteId, txHash, sourceAddress })
                                                     ▼
                                          { orderId, readToken }
                                                     ▼
        GET /v1/orchestration/status?id=orderId  (Bearer fnp_ + X-Read-Token)
                                                     ▼
                                   completed → success | failed/expired → expired UI
```

## Components

### 1. Refund-address screen — new `showStep('stableRefund')`

- Inserted **after** network/currency selection and **before** quote
  generation, because `refundAddress` must be present in the quote-creation
  request body (the backend sets `refundChain: network, refundAddress` only
  when an address is provided).
- UI: a single text input, helper text ("Where should we send your funds if
  the swap fails?"), a **Skip** action, and a **Continue** action.
- Validation runs **only when a value is entered** (the field is optional):
  - EVM networks (`currentChainId` set): `^0x[0-9a-fA-F]{40}$`.
  - Non-EVM (Solana, Tron): non-empty / trimmed length check only.
- **Skip** path shows an inline warning that a failed swap cannot be
  auto-returned, then proceeds.
- On Continue/Skip, store the value (or empty) in `refundAddress` and call the
  existing `generatePoolStablecoinQuote()`.

### 2. Quote generation — extend existing functions

- `generatePoolStablecoinQuote()` passes `refundAddress` into
  `createStablecoinQuote(params)`.
- `createStablecoinQuote()` adds `refundAddress` to the `/createPoolInvoice`
  POST body. The backend already reads and forwards it; no backend change.

### 3. Deposit detection — replace broken direct polling on `stablePayment`

After `renderStablePayment()`:

- **EVM** (`currentChainId` truthy): start both watchers, each calling
  `onSwapDeposit(txHash, from)`. Show "Monitoring for transaction…".

  ```js
  swapWatcher = PaylinkSwap.watchForTransfer({
    depositAddress, tokenAddress: currentTokenAddress,
    chainId: currentChainId, onFound: (h, f) => onSwapDeposit(h, f),
  });
  balanceWatcher = PaylinkSwap.pollForBalance({
    tokenAddress: currentTokenAddress, depositAddress,
    chainId: currentChainId, expectedAmount: BigInt(amountInRaw),
    onFound: (h, f) => onSwapDeposit(h, f),
  });
  ```

- **Non-EVM**: hide auto-detect status, show a "paste your transaction hash"
  input + submit button that calls `onSwapDeposit(value.trim(), null)`.

### 4. Submit + readToken — new `onSwapDeposit(txHash, sourceAddress)`

- Guard with `txHashSubmitted` to prevent double submission (paylink pattern).
- Stop and null both watchers.
- Validate txid format: EVM `^0x[0-9a-fA-F]{64}$`; non-EVM accept
  `trim().length > 10`.
- Move to a processing/waiting state.
- POST:

  ```
  POST https://orchestration.flashnet.xyz/v1/orchestration/submit
  Authorization: Bearer fnp_...
  Content-Type: application/json
  { "quoteId": currentQuoteId, "txHash": txHash, "sourceAddress": sourceAddress || undefined }
  ```

- On success, store `currentOrderId = orderId`, `currentReadToken = readToken`,
  then start polling.
- On failure, show an error state including the txid and quote id for support;
  do not silently drop (we cannot fall back to backend status in this path).

### 5. Status polling — rewrite `fetchFlashnetStatus`

Replace the dual-header `quoteId` implementation with an `orderId` +
`readToken` call:

```
GET https://orchestration.flashnet.xyz/v1/orchestration/status?id=<orderId>
Authorization: Bearer fnp_...
X-Read-Token: <readToken>
```

Parse status from `json.order.status` (fallback `json.status`). Keep the
existing bounded loop (`STABLE_POLL_MS`, `MAX_STABLE_POLLS`),
`FLASHNET_DONE_STATUSES` / `FLASHNET_FAILED_STATUSES`, the expired UI, and the
regenerate path unchanged. Only the request shape and the keying (orderId
instead of quoteId) change.

## State

New module-scope variables in the inline script:

- `refundAddress` — string, default `''`.
- `currentOrderId` — string | null.
- `currentReadToken` — string | null.
- `swapWatcher`, `balanceWatcher` — `{ stop }` handles | null.
- `txHashSubmitted` — boolean guard.

Reset all of these in `regenerateStableQuote()` / `cancelStablePayment()` and
stop any live watchers.

## Error handling & edge cases

- Stop watchers on cancel, regenerate, expiry, and before re-submitting.
- Double-submit guard via `txHashSubmitted`.
- Submit non-OK → error state with txid + quoteId; offer regenerate.
- Status poll transient errors → continue the bounded loop (existing behavior).
- Bounded poll exhaustion → existing expired UI.
- Reuse existing helpers: `escapeHtml`, `showStep`, QR rendering,
  `showStableExpiredUI`, `resetStablePaymentUI`, `regenerateStableQuote`.

## Risks / open validation

The one untested assumption: whether a **public-key** (`fnp_`) submit succeeds
on a quote that was **created server-side with the secret `FLASHNET_API_KEY`**,
and whether the returned `readToken` authorizes `/status`. Both keys belong to
the same partner, so per FlashNet's `(partnerId, apiKeyId, orderId, expiry)`
binding this is expected to work, but it has not been exercised.

**Fallback if submit returns 403/unauthorized:** add a thin backend
`/submitPoolSwap` endpoint (and a status proxy) that submits and polls with the
secret key — exactly the paylink model (`submitPaylinkSwap` in
`firebase-backend/functions/functionLogic/createInvoice.js`). This is
documented here but NOT built unless the client-side path fails in testing.

## Verification

- EVM happy path: generate quote with a refund address, send USDC, confirm the
  watcher fires, submit returns `{ orderId, readToken }`, status reaches
  `completed`, success screen shows.
- Skip-refund path: quote generates without `refundAddress`; warning shown.
- Non-EVM path: manual txid paste feeds `onSwapDeposit` and submits.
- Expiry path: poll exhaustion shows the existing expired UI; regenerate works
  and resets all new state + stops watchers.
- 403 on submit: confirm the error state renders with txid + quoteId (triggers
  the documented backend fallback decision).
