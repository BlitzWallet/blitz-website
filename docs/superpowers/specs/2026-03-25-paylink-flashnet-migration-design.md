# Paylink Stablecoin Flow: Lendaswap → Flashnet Migration

**Date:** 2026-03-25
**Scope:** USDC/USDT → Spark (BTC) stablecoin payments on the paylink page
**Approach:** Option A — surgical in-place rewrite of `handle-paylink.js` + replace `paylink-swap.ts`

---

## 1. File Changes

| File | Action |
|------|--------|
| `src/paylink-swap.ts` | Delete — replaced by `src/paylink-flashnet.ts` |
| `src/paylink-flashnet.ts` | New file: viem-only `watchForTransfer` + `getTokenBalance` exports |
| `scripts/build-paylink-swap.mjs` | Update `entryPoints` path only (`paylink-swap.ts` → `paylink-flashnet.ts`); all other flags unchanged |
| `netlify/handle-paylink.js` | In-place rewrite of HTML template + inline `<script>` block; server-side handler unchanged |
| `netlify.toml` | Unchanged |

Output stays `public/paylink-swap.js` with `globalName: 'PaylinkSwap'` (IIFE). Build flags `bundle: true`, `platform: 'browser'`, `target: ['es2020']`, `sourcemap: true`, `minify: false` are all unchanged.

---

## 2. Backend API Contract

### POST `/createPayLinkInvoice`

Dual-shape — backend inspects `network`/`currency` presence:

| Shape | Request | Response |
|-------|---------|----------|
| BTC (unchanged) | `{ paylinkId }` | `{ status: "SUCCESS", invoice }` |
| Flashnet stablecoin | `{ paylinkId, network, currency }` | `{ status: "SUCCESS", depositAddress, amountIn, estimatedOut, quoteId }` |

- `amountIn`: raw integer string in token smallest units (e.g. `"1000000"` = 1.00 USDC). Parse as `BigInt(String(resp.amountIn))`.
- `estimatedOut`: BTC sats integer estimate for display only.
- `quoteId`: stored server-side linked to `paylinkId`; not passed back to client.

### POST `/submitPaylinkSwap`

Request: `{ paylinkId, txHash, sourceAddress }`
- `sourceAddress`: MetaMask → `accounts[0]`; viem watcher → `log.args.from`; manual → `null`

Response (success): `{ status: "SUCCESS" }`

### POST `/getPaylinkData`

Request: `{ paylinkId, checkInvoice: true }`
Response: `{ status: "SUCCESS", data: { isPaid: bool, ... } }`

---

## 3. Network / Currency Map

Currency is selected on `screen-initial`; `screen-network` re-renders filtered grid on entry.

| Currency | Networks |
|----------|----------|
| USDC | Ethereum, Arbitrum, Optimism, Polygon, Base, Solana |
| USDT | Ethereum, Arbitrum, Optimism, Tron |

### EVM Token Addresses (6 decimals)

All supported tokens (USDC and USDT across all supported EVM chains) use 6 decimal places. This is a fixed property of the token set; `formatTokenAmount` callers always pass `6`.

| Network | chainId | USDC | USDT |
|---------|---------|------|------|
| Ethereum | 1 | `0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48` | `0xdac17f958d2ee523a2206206994597c13d831ec7` |
| Polygon | 137 | `0x3c499c542cef5e3811e1192ce70d8cc03d5c3359` | — |
| Arbitrum | 42161 | `0xaf88d065e77c8cc2239327c5edb3a432268e5831` | `0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9` |
| Optimism | 10 | `0x0b2c639c533813f4aa9d7837caf62653d097ff85` | `0x94b008aa00579c1307b0ef2c499ad98a8ce58e58` |
| Base | 8453 | `0x833589fcd6edb6e08f4c7c32d4f71b54bda02913` | — |

Non-EVM (Solana/USDC, Tron/USDT): backend returns a raw string address. No wallet buttons, no viem monitoring. Manual txHash input only.

### `NETWORK_MAP` (inline script block)

Defined in the HTML `<script>` block (not the TypeScript bundle). Used by `confirmStablecoin()` to resolve `currentChainId` and `currentTokenAddress` from `selectedNetwork` + `selectedCurrency`.

```js
const NETWORK_MAP = {
  ethereum: { chainId: 1,     usdc: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', usdt: '0xdac17f958d2ee523a2206206994597c13d831ec7' },
  polygon:  { chainId: 137,   usdc: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359', usdt: null },
  arbitrum: { chainId: 42161, usdc: '0xaf88d065e77c8cc2239327c5edb3a432268e5831', usdt: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9' },
  optimism: { chainId: 10,    usdc: '0x0b2c639c533813f4aa9d7837caf62653d097ff85', usdt: '0x94b008aa00579c1307b0ef2c499ad98a8ce58e58' },
  base:     { chainId: 8453,  usdc: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', usdt: null },
  solana:   { chainId: null,  usdc: null, usdt: null },   // non-EVM
  tron:     { chainId: null,  usdc: null, usdt: null },   // non-EVM
};
```

For a given `selectedNetwork` + `selectedCurrency`:
- `currentChainId = NETWORK_MAP[selectedNetwork].chainId`  (null for non-EVM)
- `currentTokenAddress = NETWORK_MAP[selectedNetwork][selectedCurrency.toLowerCase()]`  (null for non-EVM)

---

## 4. Client Bundle: `src/paylink-flashnet.ts`

### `watchForTransfer(params)`

```ts
params: {
  depositAddress: `0x${string}`;
  tokenAddress: `0x${string}`;
  chainId: number;
  onFound: (txHash: string, from: string) => void;
}
returns: { stop: () => void }
```

Implementation details:

1. Create a `PublicClient` for `chainId` using `CHAIN_MAP`.
2. Call `getBlockNumber()` to get the starting `fromBlock`.
3. Set a `setInterval` at 10 000 ms.
4. On each tick, call `getLogs` with:
   - `address`: `tokenAddress`
   - `event`: `Transfer(address indexed from, address indexed to, uint256 value)` (via `parseAbiItem`)
   - `args`: `{ to: depositAddress }`
   - `fromBlock`: current `fromBlock`
   - `toBlock`: `'latest'`
5. **`fromBlock` advancement after each poll:**
   - If logs were returned: advance `fromBlock` to `(max block number among returned logs) + 1n`
   - If no logs were returned: advance `fromBlock` to `fromBlock + 1n`
   - In both cases `fromBlock` always advances by at least 1 after every poll.
6. On first matching log: call `onFound(log.transactionHash, log.args.from)`, clear the interval, return.
7. **No internal timeout** — runs until `stop()` is called or a match is found. The UI layer is responsible for stopping via `swapWatcher.stop()` (called inside `handleTxHash`).
8. `stop()` clears the interval immediately; subsequent `onFound` calls are suppressed via a `stopped` flag.

### `getTokenBalance(params)`

```ts
params: {
  tokenAddress: `0x${string}`;
  walletAddress: `0x${string}`;
  chainId: number;
}
returns: Promise<bigint>
```

- Reads `balanceOf(walletAddress)` via `readContract` on the ERC-20 contract
- Supports same 5 EVM chains as `CHAIN_MAP`

**Imports:** `createPublicClient`, `http`, `parseAbiItem` from viem; chains from `viem/chains`. No Lendaswap SDK.

---

## 5. Stablecoin Flow Logic

### State Variables

```js
let selectedCurrency = 'USDC';   // set on screen-initial
let selectedNetwork = null;       // set on screen-network
let depositAddress = null;
let amountInRaw = null;           // BigInt from BigInt(String(resp.amountIn))
let estimatedOut = null;
let currentChainId = null;        // null for non-EVM
let currentTokenAddress = null;   // null for non-EVM
let txHashSubmitted = false;      // double-submit guard
let swapWatcher = null;           // { stop() } from watchForTransfer
let shouldPoll = false;
let pollTimer = null;
let pollCount = 0;
const MAX_POLLS = 20;
```

localStorage key: `paylink_swap_${PAYLINK_ID}`
Format after submit: `{ txHash, sourceAddress }` (`sourceAddress` may be null)
Stale detection: entries with a `swapId` key are old Lendaswap shape and are discarded. The resume check `stored.txHash && !stored.swapId` handles all cases: a valid new entry has `txHash` and no `swapId`; a Lendaswap entry fails `!stored.swapId`; any malformed entry missing `txHash` fails the first condition.

### Helper: `formatTokenAmount(raw, decimals)`

Defined in the inline script block. `raw` is a `BigInt`. Returns a decimal string formatted to 2 decimal places. All current call sites pass `decimals = 6` (the fixed precision for all supported tokens).

```js
function formatTokenAmount(raw, decimals) {
  const divisor = 10 ** decimals;
  return (Number(raw) / divisor).toFixed(2);
}
```

### `showNetworkSelect()`

1. Re-renders network cards in `#network-grid` filtered by `selectedCurrency`:
   - USDC → Ethereum, Polygon, Arbitrum, Optimism, Base, Solana
   - USDT → Ethereum, Arbitrum, Optimism, Tron
2. Resets `selectedNetwork = null` and clears all `.selected` card highlights
3. Navigates to `screen-network`

### `confirmStablecoin()`

1. Validate `selectedNetwork` is set; if not, show alert and return
2. Disable Continue button; show `screen-creating-swap`
3. POST `/createPayLinkInvoice` with `{ paylinkId, network: selectedNetwork, currency: selectedCurrency }`
4. **On network error or non-SUCCESS response:** navigate back to `screen-network`, re-enable Continue button, call `showAlert('Failed to create swap. Please try again.')`; return
5. Parse: `depositAddress`, `amountInRaw = BigInt(String(resp.amountIn))`, `estimatedOut`
6. Set `currentChainId` and `currentTokenAddress` from `NETWORK_MAP`
7. Render QR for `depositAddress`; set amount label: `formatTokenAmount(amountInRaw, 6) + " " + selectedCurrency + " → ~" + estimatedOut + " sats"`
8. **EVM (`currentChainId !== null`):**
   - Start `swapWatcher = PaylinkSwap.watchForTransfer({ depositAddress, tokenAddress: currentTokenAddress, chainId: currentChainId, onFound: (txHash, from) => handleTxHash(txHash, from) })`
   - Show Open-Wallet button (mobile) + Connect-&-Pay button (desktop)
   - Set `txhash-detect-status` text to `"Monitoring for transaction…"`
9. **Non-EVM:**
   - Hide wallet buttons
   - Set `txhash-detect-status` text to `"Auto-detection unavailable for this network. Paste your tx hash after sending."`
10. Show txHash input + Submit button
11. Navigate to `screen-stable-pay`

### `handleTxHash(txHash, sourceAddress)` — single entry point

All three paths (MetaMask, viem watcher, manual) call this function.

```
if txHashSubmitted → return immediately (double-submit guard)
txHashSubmitted = true
if swapWatcher: swapWatcher.stop(); swapWatcher = null

validate format:
  EVM:     /^0x[0-9a-fA-F]{64}$/.test(txHash)
  non-EVM: !currentChainId && txHash.trim().length > 10
  invalid → txHashSubmitted = false; showTxHashError('Invalid transaction hash format.'); return

show screen-processing
try:
  POST /submitPaylinkSwap { paylinkId, txHash, sourceAddress: sourceAddress || null }
  if response.status !== 'SUCCESS' → throw
  saveSwapContext({ txHash, sourceAddress: sourceAddress || null })
  startIsPaidPolling()
catch:
  txHashSubmitted = false
  showScreen('screen-stable-pay')
  showTxHashError('Submission failed. Please try again.')
```

### `connectAndPay()` — MetaMask path

```js
async function connectAndPay() {
  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x' + currentChainId.toString(16) }],
    });
    const addrPadded = depositAddress.replace('0x', '').toLowerCase().padStart(64, '0');
    const amtPadded  = amountInRaw.toString(16).padStart(64, '0');
    const data = '0xa9059cbb' + addrPadded + amtPadded;
    const txHash = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [{ from: accounts[0], to: currentTokenAddress, data }],
    });
    handleTxHash(txHash, accounts[0]);
  } catch (err) {
    // All wallet errors (user rejection, chain switch failure, error code 4902, etc.)
    // are treated identically: show an inline error, no navigation.
    // wallet_addEthereumChain fallback is out of scope for v1.
    // txHashSubmitted has NOT been set (handleTxHash was not called), so no reset needed.
    showTxHashError('Wallet error: ' + (err.message || 'Request rejected.'));
  }
}
```

`txHashSubmitted` guard in `handleTxHash` prevents double-submit if viem watcher fires concurrently.

### `submitManualTxHash()` — manual path

```js
function submitManualTxHash() {
  const val = document.getElementById('txhash-input').value.trim();
  handleTxHash(val, null);
}
```

### `buildEip681Uri()` — Open Wallet (mobile EIP-681)

EIP-681 URI format for ERC-20 transfer. The `uint256` value is encoded as a **decimal integer** (not hex), per the EIP-681 spec.

```
ethereum:<tokenAddress>@<chainId>/transfer?address=<depositAddress>&uint256=<amountInRaw>
```

Example for 1.00 USDC on Arbitrum (`amountInRaw = 1000000n`):
```
ethereum:0xaf88d065e77c8cc2239327c5edb3a432268e5831@42161/transfer?address=0xDEPOSIT&uint256=1000000
```

The Open Wallet button (mobile only) sets `window.location.href = buildEip681Uri()`.

### isPaid Polling

`shouldPoll` is set to `false` by two paths: (1) inside `_doPaylinkPoll` on success, and (2) inside `_doPaylinkPoll` when `MAX_POLLS` is reached (before calling `showErrorScreen()`). `showErrorScreen()` itself does not set `shouldPoll` — it is already `false` by the time it is called.

```js
function startIsPaidPolling() {
  pollCount = 0;
  shouldPoll = true;
  _schedulePaylinkPoll();
}

function _schedulePaylinkPoll() {
  pollTimer = setTimeout(_doPaylinkPoll, 5000);
}

async function _doPaylinkPoll() {
  pollTimer = null;
  if (!shouldPoll) return;
  pollCount++;
  try {
    const res = await fetch('/getPaylinkData', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paylinkId: PAYLINK_ID, checkInvoice: true }),
    });
    const json = await res.json();
    if (json?.data?.isPaid) {
      shouldPoll = false;
      clearSwapContext();
      showScreen('screen-success');
      return;
    }
  } catch (e) { /* network error — continue polling */ }
  if (pollCount >= MAX_POLLS) {
    shouldPoll = false;   // set here, before showErrorScreen()
    showErrorScreen();
    return;
  }
  _schedulePaylinkPoll();
}

// Called by the "Check again" button on screen-error.
// txHashSubmitted is NOT reset — the hash was already submitted successfully.
// The user cannot re-submit a different hash from screen-error; they can only retry polling.
// On success, _doPaylinkPoll will navigate to screen-success.
function retryIsPaidPolling() {
  if (pollTimer) { clearTimeout(pollTimer); pollTimer = null; }
  pollCount = 0;
  shouldPoll = true;
  _schedulePaylinkPoll();
}
```

### `showErrorScreen()`

```js
function showErrorScreen() {
  const stored = loadSwapContext();
  const el = document.getElementById('error-txhash-display');
  if (el) el.textContent = stored?.txHash || '(unknown)';
  showScreen('screen-error');
}
```

### Resume on Page Load

```js
document.addEventListener('DOMContentLoaded', () => {
  const stored = loadSwapContext();
  // Resume condition: entry must have txHash AND must not be old Lendaswap shape (swapId key).
  // An entry missing txHash but lacking swapId is also ignored by the txHash check.
  if (stored && stored.txHash && !stored.swapId) {
    txHashSubmitted = true;
    showScreen('screen-processing');
    startIsPaidPolling();
  }
});
```

---

## 6. Screens

### Removed

- `screen-recovery` + all refund buttons
- `#gear-overlay` (seed recovery / mnemonic reveal)
- `btn-resume-swap` (old Lendaswap resume — `updateResumeButton()` function also removed)

### Unchanged

- `screen-initial` — currency toggle (`btn-usdc`/`btn-usdt`) stays here
- `screen-btc` — no changes
- `screen-success` — no changes
- `screen-creating-swap` — loading spinner only
- `screen-processing` — spinner + "Waiting for confirmation…"

### Modified: `screen-network`

Network cards render dynamically via `showNetworkSelect()` (JS populates `#network-grid` on entry). Continue button calls `confirmStablecoin()`. Back button returns to `screen-initial`.

### Modified: `screen-stable-pay`

- QR code of `depositAddress` rendered into `#qr-stable-address`
- Amount label: e.g. `"1.00 USDC → ~2800 sats"`
- **EVM only:** Open Wallet button (mobile, shown via `isMobileDevice()`) + Connect & Pay button (desktop)
- `#txhash-detect-status` text slot
- `#txhash-input` + Submit button
- `#txhash-error` inline error text slot (shown by `showTxHashError`, cleared on new attempt)
- **No back button** on `screen-stable-pay`. Once a deposit address has been issued, the user cannot navigate back. They can only submit a txHash or close the page.

### New: `screen-error`

Transitions: "Check again" button → `retryIsPaidPolling()` → on success navigates to `screen-success` (same `_doPaylinkPoll` success path). No back button.

```html
<div id="screen-error" class="screen">
  <div class="error-box">
    <h2>Taking longer than expected</h2>
    <p>Your payment is still processing. Your tx hash has been submitted successfully.</p>
    <p class="status-text" id="error-txhash-display"></p>
    <p>Please <a href="https://blitzwalletapp.com" target="_blank">contact support</a> with the tx hash above if this persists.</p>
    <button class="btn-secondary" onclick="retryIsPaidPolling()">Check again</button>
  </div>
</div>
```

---

## 7. Removed Items

| Removed | Was in |
|---------|--------|
| `PaylinkSwap.createSwap/getSwap/fundSwapGasless/getMnemonic` | `paylink-swap.ts` |
| `collabRefundEvmSwap/refundSwapTimeout` | `paylink-swap.ts` |
| Balance polling (`doBalancePoll`, `startBalancePolling`) | `handle-paylink.js` JS |
| Relay logic (`attemptRelay`, `relayInFlight`, `relayAttempted`) | `handle-paylink.js` JS |
| `screen-recovery` + refund buttons | `handle-paylink.js` HTML |
| `#gear-overlay` | `handle-paylink.js` HTML |
| `TERMINAL_STATES`, `COLLAB_REFUND_STATUSES`, `friendlyStatus()` | `handle-paylink.js` JS |
| `swapPolling`, `swapPollTimer`, `doSwapPoll()` | `handle-paylink.js` JS |
| `resumeSwapFromStorage()` (old shape) | `handle-paylink.js` JS |
| `updateResumeButton()` | `handle-paylink.js` JS |
| `btn-resume-swap` | `handle-paylink.js` HTML |
| Old localStorage shape `{ swapId, network, currency }` | `handle-paylink.js` JS |
| `@lendasat/lendaswap-sdk-pure` import | `paylink-swap.ts` |

---

## 8. Build Script Change

`scripts/build-paylink-swap.mjs` — only the entrypoint changes. All other flags (`bundle`, `platform`, `target`, `sourcemap`, `minify`, `outfile`, `globalName`, `format`) are unchanged:

```js
entryPoints: ['src/paylink-flashnet.ts'],  // was paylink-swap.ts
```

---

## 9. Verification Checklist

1. `npm run dev` → visit `/paylink/<test-id>`
2. Lightning ("Pay with Bitcoin") flow: unchanged — QR renders, polling detects `isPaid`
3. USDC selected on initial screen → 6 networks shown on screen-network (Ethereum/Polygon/Arbitrum/Optimism/Base/Solana)
4. USDT selected on initial screen → 4 networks shown (Ethereum/Arbitrum/Optimism/Tron)
5. Solana USDC: Continue → spinner → QR renders; no MetaMask/Open-Wallet button; "Auto-detection unavailable" note; txHash input visible
6. Arbitrum USDC: Continue → spinner → QR renders; monitoring started; Connect & Pay visible (desktop); Open Wallet visible (mobile)
7. MetaMask path: Connect & Pay → MetaMask prompts → confirm → txHash captured → processing screen immediately
8. MetaMask rejection: inline error shown; button re-enabled; no navigation away from `screen-stable-pay`
9. Viem monitoring path: send from external EVM wallet → within ~10s Transfer detected → processing screen (without user action)
10. Manual path: paste valid `0x` txHash → Submit → processing screen; invalid format shows inline error, no navigation
11. Network tab: POST `/submitPaylinkSwap` body contains `{ paylinkId, txHash, sourceAddress }`
12. POST `/getPaylinkData` called every 5s after submit
13. `isPaid: true` → success screen; localStorage cleared
14. 20 polls without success → error screen; localStorage retained; txHash displayed
15. "Check again" resets poll count and resumes; on `isPaid: true` navigates to success screen
16. Page reload mid-processing (localStorage has `{ txHash }`): jumps to processing screen, resumes polling
17. Page reload with stale Lendaswap data (localStorage has `{ swapId }`): ignored, starts fresh
18. `/createPayLinkInvoice` network failure: returns to `screen-network`, Continue re-enabled, alert shown
