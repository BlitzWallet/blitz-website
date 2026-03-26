# Paylink Flashnet Migration Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Lendaswap SDK stablecoin flow with Flashnet's quote→deposit→submit REST API across three files.

**Architecture:** Create a new viem-only TypeScript bundle (`src/paylink-flashnet.ts`) that exports `watchForTransfer` and `getTokenBalance`; update the build entrypoint; surgically rewrite the HTML screens and inline JS in `netlify/handle-paylink.js`. The server-side Netlify handler function is untouched.

**Tech Stack:** viem (EVM client), esbuild (bundle), vanilla JS inline script, Netlify serverless function

**Spec:** `docs/superpowers/specs/2026-03-25-paylink-flashnet-migration-design.md`

---

## Note on testing

This repo has no configured test suite (`CLAUDE.md`: "No build step or test suite is configured"). Each task is verified by building and manually inspecting in `netlify dev`. Exact verification steps are provided per task.

---

## Chunk 1: Client Bundle + Build Script

### Task 1: Create `src/paylink-flashnet.ts`

**Files:**
- Delete: `src/paylink-swap.ts`
- Create: `src/paylink-flashnet.ts`

- [ ] **Step 1: Delete the old file**

```bash
rm "src/paylink-swap.ts"
```

- [ ] **Step 2: Create `src/paylink-flashnet.ts`**

```typescript
import { createPublicClient, http, parseAbiItem } from 'viem';
import { mainnet, polygon, arbitrum, optimism, base } from 'viem/chains';

const CHAIN_MAP = {
  1: mainnet,
  137: polygon,
  42161: arbitrum,
  10: optimism,
  8453: base,
} as const;

const TRANSFER_EVENT = parseAbiItem(
  'event Transfer(address indexed from, address indexed to, uint256 value)',
);

export function watchForTransfer(params: {
  depositAddress: `0x${string}`;
  tokenAddress: `0x${string}`;
  chainId: number;
  onFound: (txHash: string, from: string) => void;
}): { stop: () => void } {
  const { depositAddress, tokenAddress, chainId, onFound } = params;
  const chain = CHAIN_MAP[chainId as keyof typeof CHAIN_MAP];
  if (!chain) throw new Error(`Unsupported chainId: ${chainId}`);

  const client = createPublicClient({ chain, transport: http() });
  let stopped = false;
  let fromBlock: bigint;
  let intervalId: ReturnType<typeof setInterval>;

  // Start: snapshot current block then begin polling
  client.getBlockNumber().then((currentBlock) => {
    if (stopped) return;
    fromBlock = currentBlock;

    intervalId = setInterval(async () => {
      if (stopped) return;
      try {
        const logs = await client.getLogs({
          address: tokenAddress,
          event: TRANSFER_EVENT,
          args: { to: depositAddress },
          fromBlock,
          toBlock: 'latest',
        });

        if (logs.length > 0) {
          // Advance fromBlock to max block in results + 1
          const maxBlock = logs.reduce(
            (m, l) => (l.blockNumber != null && l.blockNumber > m ? l.blockNumber : m),
            fromBlock,
          );
          fromBlock = maxBlock + 1n;

          const first = logs[0];
          if (!stopped && first.transactionHash && first.args.from) {
            stopped = true;
            clearInterval(intervalId);
            onFound(first.transactionHash, first.args.from as string);
          }
        } else {
          // No logs: advance by 1 to avoid re-scanning the same block
          fromBlock = fromBlock + 1n;
        }
      } catch {
        // transient RPC error — continue polling next tick
      }
    }, 10_000);
  });

  return {
    stop() {
      stopped = true;
      if (intervalId != null) clearInterval(intervalId);
    },
  };
}

export async function getTokenBalance(params: {
  tokenAddress: `0x${string}`;
  walletAddress: `0x${string}`;
  chainId: number;
}): Promise<bigint> {
  const { tokenAddress, walletAddress, chainId } = params;
  const chain = CHAIN_MAP[chainId as keyof typeof CHAIN_MAP];
  if (!chain) throw new Error(`Unsupported chainId: ${chainId}`);
  const client = createPublicClient({ chain, transport: http() });
  return client.readContract({
    address: tokenAddress,
    abi: [parseAbiItem('function balanceOf(address) view returns (uint256)')],
    functionName: 'balanceOf',
    args: [walletAddress],
  }) as Promise<bigint>;
}
```

- [ ] **Step 3: Verify the file saved correctly**

```bash
head -5 src/paylink-flashnet.ts
```

Expected: sees `import { createPublicClient` on line 1.

---

### Task 2: Update build script entrypoint

**Files:**
- Modify: `scripts/build-paylink-swap.mjs` (line 9)

- [ ] **Step 1: Update the entrypoint path**

In `scripts/build-paylink-swap.mjs`, find:
```js
  entryPoints: [path.join(root, "src", "paylink-swap.ts")],
```
Replace with:
```js
  entryPoints: [path.join(root, "src", "paylink-flashnet.ts")],
```

- [ ] **Step 2: Build the bundle**

```bash
node scripts/build-paylink-swap.mjs
```

Expected: exits 0, no errors. `public/paylink-swap.js` is updated.

- [ ] **Step 3: Verify the bundle exposes the right globals**

```bash
node -e "require('./public/paylink-swap.js'); console.log(typeof global.PaylinkSwap.watchForTransfer, typeof global.PaylinkSwap.getTokenBalance);"
```

Expected output: `function function`

> Note: `public/paylink-swap.js` is an IIFE that assigns to `globalThis.PaylinkSwap`. In Node.js `globalThis === global`, so the bundle is accessible as `global.PaylinkSwap` after `require()`. If the check returns `undefined undefined`, open the bundle and confirm the IIFE wrapper ends with `})(globalThis.PaylinkSwap = globalThis.PaylinkSwap || {})` or similar esbuild IIFE output.

- [ ] **Step 4: Commit**

```bash
git add src/paylink-flashnet.ts scripts/build-paylink-swap.mjs public/paylink-swap.js public/paylink-swap.js.map
git commit -m "feat: replace paylink-swap.ts with viem-only paylink-flashnet.ts"
```

---

## Chunk 2: handle-paylink.js — HTML Screen Changes

**Files:**
- Modify: `netlify/handle-paylink.js`

The HTML lives inside the template literal in `generateHTML()`. All edits in this chunk are to that template string. The server-side `handler` function (lines 1–100) is untouched.

### Task 3: Move currency toggle to `screen-initial`; rebuild `screen-network`

The currency toggle (`btn-usdc`/`btn-usdt`) currently lives in `screen-network` (around line 1035). Move it to `screen-initial` (before the payment buttons). Replace `screen-network`'s static card list with a dynamic `#network-grid` div.

- [ ] **Step 1: Add currency toggle to `screen-initial` and remove `btn-resume-swap`**

Find in `generateHTML`'s template literal:
```html
          <button class="btn-primary" id="btn-btc" onclick="startBtcFlow()">Pay with Bitcoin</button>
          <button class="btn-secondary" id="btn-stable" onclick="showNetworkSelect()">Pay with USDC or USDT</button>
          <button class="btn-secondary" id="btn-resume-swap" style="display:none;" onclick="resumeSwapFromStorage()">Resume swap</button>
```

Replace with:
```html
          <div class="currency-toggle" style="margin-bottom:0.75rem;">
            <button id="btn-usdc" class="active" onclick="selectCurrency('USDC')">USDC</button>
            <button id="btn-usdt" onclick="selectCurrency('USDT')">USDT</button>
          </div>
          <button class="btn-primary" id="btn-btc" onclick="startBtcFlow()">Pay with Bitcoin</button>
          <button class="btn-secondary" id="btn-stable" onclick="showNetworkSelect()">Pay with USDC or USDT</button>
```

- [ ] **Step 2: Replace `screen-network` with dynamic grid**

> **Note:** The back button in the file uses 9-space indentation (one space less than the surrounding elements — this is the exact whitespace in the source file). The Find string below must match exactly.

Find (note the 9-space indent on the back button line):
```
        <!-- Screen 2b: Network selection -->
        <div id="screen-network" class="screen">
         <button class="btn-back" onclick="goBack()"><i data-lucide="arrow-left"></i> Back</button>
          <h2 class="screen-title">Select Network</h2>
          <div class="network-cards">
            <div class="network-card" id="card-polygon"  onclick="selectNetwork('polygon')">Polygon</div>
            <div class="network-card" id="card-arbitrum" onclick="selectNetwork('arbitrum')">Arbitrum</div>
          </div>
          <div class="currency-toggle">
            <button id="btn-usdc" class="active" onclick="selectCurrency('USDC')">USDC</button>
            <button id="btn-usdt" onclick="selectCurrency('USDT')">USDT</button>
          </div>
          <button class="btn-primary" id="btn-continue-stable" onclick="confirmStablecoin()">Continue</button>
        </div>
```

Replace with:
```html
        <!-- Screen 2b: Network selection -->
        <div id="screen-network" class="screen">
         <button class="btn-back" onclick="goBack()"><i data-lucide="arrow-left"></i> Back</button>
          <h2 class="screen-title">Select Network</h2>
          <div class="network-cards" id="network-grid">
            <!-- populated dynamically by showNetworkSelect() -->
          </div>
          <button class="btn-primary" id="btn-continue-stable" onclick="confirmStablecoin()">Continue</button>
        </div>
```

---

### Task 4: Rebuild `screen-stable-pay`

The current screen is missing the `txhash-detect-status`, `txhash-input`, `txhash-error`, and the amount label now shows `depositAddress → sats` instead of just the token amount.

- [ ] **Step 1: Replace `screen-stable-pay`**

Find:
```html
        <!-- Screen 3: Stablecoin deposit -->
        <div id="screen-stable-pay" class="screen">
          <button class="btn-back" onclick="goBack('network')"><i data-lucide="arrow-left"></i> Back</button>
          <p class="requester" id="stable-network-label"></p>
          <p class="amount" id="stable-amount-label"></p>
          <div class="qr-wrapper">
            <div id="qr-stable-address"></div>
          </div>
          <div onclick="copyAddress()" class="address-box" id="stable-address-text"></div>
          <button class="btn-primary" id="btn-open-wallet" onclick="openWallet()" style="display:none;">Open Wallet</button>
          <button class="btn-primary" id="btn-connect-pay" onclick="connectAndPay()" style="display:none;">Connect &amp; Pay</button>
          <div class="warning-callout">
            After sending USDC/USDT, return to this page so we can complete your payment.
          </div>
        </div>
```

Replace with:
```html
        <!-- Screen 3: Stablecoin deposit -->
        <div id="screen-stable-pay" class="screen">
          <p class="requester" id="stable-network-label"></p>
          <p class="status-text" id="stable-amount-label" style="margin-bottom:0.75rem;"></p>
          <div class="qr-wrapper">
            <div id="qr-stable-address"></div>
          </div>
          <div onclick="copyAddress()" class="address-box" id="stable-address-text"></div>
          <button class="btn-primary" id="btn-open-wallet" onclick="openWallet()" style="display:none;">Open Wallet</button>
          <button class="btn-primary" id="btn-connect-pay" onclick="connectAndPay()" style="display:none;">Connect &amp; Pay</button>
          <p class="status-text" id="txhash-detect-status" style="margin-top:0.75rem;"></p>
          <input type="text" id="txhash-input" placeholder="Paste transaction hash" style="width:100%;padding:0.75rem;border:1px solid var(--lm-backgroundOffset);border-radius:8px;font-size:0.95rem;margin-top:0.5rem;font-family:var(--description_font);" />
          <p id="txhash-error" style="color:#e53e3e;font-size:0.9rem;margin-top:0.4rem;display:none;"></p>
          <button class="btn-secondary" onclick="submitManualTxHash()" style="margin-top:0.5rem;">Submit Transaction Hash</button>
        </div>
```

---

### Task 5: Remove `screen-recovery` and `#gear-overlay`; add `screen-error`

- [ ] **Step 1: Remove `screen-recovery`**

Find and delete the entire block:
```html
        <!-- Screen 3b: Swap recovery -->
        <div id="screen-recovery" class="screen">
          <button class="btn-back" onclick="goBack()"><i data-lucide="arrow-left"></i> Back</button>
          <h2 class="screen-title">Swap recovery</h2>
          <p id="recovery-status" class="status-text">Loading swap…</p>
          <div class="qr-wrapper">
            <div id="qr-recovery-address"></div>
          </div>
          <div onclick="copyAddress()" class="address-box" id="recovery-address-text"></div>
          <p id="recovery-amount" class="status-text"></p>
          <div class="recovery-actions">
            <button class="btn-primary" onclick="retryRelay()">Retry relay</button>
            <button class="btn-secondary" onclick="refreshSwapStatus()">Refresh status</button>
          </div>
          <button class="btn-primary" id="btn-collab-refund" onclick="requestCollabRefund()" style="display:none;">
            Refund Tokens
          </button>
          <p id="refund-countdown" class="status-text"></p>
          <button class="btn-secondary" id="btn-timeout-refund" onclick="requestTimeoutRefund()" style="display:none;">
            Check Unilateral Refund
          </button>
          <button class="btn-primary" id="btn-submit-refund" onclick="submitRefundTx()" style="display:none;">
            Submit Refund via Wallet
          </button>
        </div>
```

Replace it with `screen-error` in the same position:
```html
        <!-- Screen: error / timeout -->
        <div id="screen-error" class="screen">
          <div class="error-box">
            <h2>Taking longer than expected</h2>
            <p>Your payment is still processing. Your tx hash has been submitted successfully.</p>
            <p class="status-text" id="error-txhash-display" style="word-break:break-all;margin:0.75rem 0;"></p>
            <p>Please <a href="https://blitzwalletapp.com" target="_blank">contact support</a> with the tx hash above if this persists.</p>
            <button class="btn-secondary" onclick="retryIsPaidPolling()">Check again</button>
          </div>
        </div>
```

- [ ] **Step 2: Remove `#gear-overlay`**

Find and delete the entire block:
```html
    <!-- Gear overlay: recovery seed -->
    <div id="gear-overlay" class="overlay-backdrop">
      <div class="overlay-card">
        <button class="overlay-close" onclick="closeGearOverlay()"><i data-lucide="x"></i></button>
        <p class="overlay-title">Recovery</p>
        <div class="warning-callout">
          ⚠️ This seed recovers your USDT/USDC → Lightning swaps. Do not share it publicly.
        </div>
        <p class="overlay-body">
          If a stablecoin-to-Lightning swap fails or gets stuck, this seed lets you recover your funds using an external wallet.
        </p>
        <button class="btn-secondary" onclick="revealGearSeed()">Reveal recovery seed</button>
        <div id="seed-gear" style="display:none; margin-top:1rem;">
          <div class="seed-box" id="seed-gear-text"></div>
          <button class="btn-secondary" onclick="copyGearSeed()">Copy seed</button>
        </div>
      </div>
    </div>
```

- [ ] **Step 3: Manually verify HTML structure**

Run `netlify dev` (or `npm run dev`), visit `/paylink/test`. Confirm:
- `screen-initial` shows currency toggle + BTC + stable buttons (if paylink data exists)
- `screen-network` renders but `#network-grid` is empty (JS not yet updated)
- `screen-error` div exists in DOM (check DevTools)
- No `screen-recovery` in DOM
- No `#gear-overlay` in DOM

- [ ] **Step 4: Commit**

```bash
git add netlify/handle-paylink.js
git commit -m "feat: rebuild paylink HTML screens for Flashnet flow"
```

---

## Chunk 3: handle-paylink.js — Replace Inline JS

The entire inline `<script>` block (from `const IOS_STORE_URL` through `document.addEventListener('DOMContentLoaded'...` and the modal IIFE) needs its stablecoin section replaced. The safest approach is a targeted replacement of the JS that changes, while leaving the unchanged portions (BTC flow, polling, modal IIFE, alert overlay) intact.

### Task 6: Replace state variables and maps

The old code declares state vars including `currentSwapId`, `currentSwap`, `swapPolling`, `relayInFlight`, `relayAttempted`, `balancePollTimer`, `balancePolling`, `expectedAmountRaw`, `stableAddress` and `TOKEN_MAP`. Replace all of these.

- [ ] **Step 1: Replace `TOKEN_MAP` and old state vars with `NETWORK_MAP` and new state**

Find (starting at the `<script>` block constants, ~line 1102):
```js
      const TOKEN_MAP = {
        ethereum: {
          USDC: {
            token_id: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            symbol: 'USDC',
            name: 'USD Coin',
            decimals: 6,
            chain: '1',
          },
          USDT: {
            token_id: '0xdac17f958d2ee523a2206206994597c13d831ec7',
            symbol: 'USDT',
            name: 'Tether USD',
            decimals: 6,
            chain: '1',
          },
        },
        polygon: {
          USDC: {
            token_id: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
            symbol: 'USDC',
            name: 'USD Coin',
            decimals: 6,
            chain: '137',
          },
          USDT: {
            token_id: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
            symbol: 'USDT',
            name: 'Tether USD',
            decimals: 6,
            chain: '137',
          },
        },
        arbitrum: {
          USDC: {
            token_id: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
            symbol: 'USDC',
            name: 'USD Coin',
            decimals: 6,
            chain: '42161',
          },
          USDT: {
            token_id: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
            symbol: 'USDT',
            name: 'Tether USD',
            decimals: 6,
            chain: '42161',
          },
        },
      };

      let selectedNetwork = null;
      let selectedCurrency = 'USDC';
      let pollTimer = null;
      let shouldPoll = false;
      let stableAddress = null;
      let currentSwapId = null;
      let currentSwap = null;
      let swapPollTimer = null;
      let swapPolling = false;
      let relayInFlight = false;
      let relayAttempted = false;
      let balancePollTimer = null;    let balancePolling = false;
      let expectedAmountRaw = null;   let currentTokenAddress = null;
      let currentChainId = null;      let currentDepositAddress = null;
      let bitcoinInvoice = null;
```

Replace with:
```js
      const NETWORK_MAP = {
        ethereum: { chainId: 1,     usdc: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', usdt: '0xdac17f958d2ee523a2206206994597c13d831ec7' },
        polygon:  { chainId: 137,   usdc: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359', usdt: null },
        arbitrum: { chainId: 42161, usdc: '0xaf88d065e77c8cc2239327c5edb3a432268e5831', usdt: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9' },
        optimism: { chainId: 10,    usdc: '0x0b2c639c533813f4aa9d7837caf62653d097ff85', usdt: '0x94b008aa00579c1307b0ef2c499ad98a8ce58e58' },
        base:     { chainId: 8453,  usdc: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', usdt: null },
        solana:   { chainId: null,  usdc: null, usdt: null },
        tron:     { chainId: null,  usdc: null, usdt: null },
      };

      const NETWORK_LABELS = {
        ethereum: 'Ethereum', polygon: 'Polygon', arbitrum: 'Arbitrum',
        optimism: 'Optimism', base: 'Base', solana: 'Solana', tron: 'Tron',
      };

      const CURRENCY_NETWORKS = {
        USDC: ['ethereum', 'arbitrum', 'optimism', 'polygon', 'base', 'solana'],
        USDT: ['ethereum', 'arbitrum', 'optimism', 'tron'],
      };

      let selectedNetwork = null;
      let selectedCurrency = 'USDC';
      let depositAddress = null;
      let amountInRaw = null;
      let estimatedOut = null;
      let currentChainId = null;
      let currentTokenAddress = null;
      let txHashSubmitted = false;
      let swapWatcher = null;
      let pollTimer = null;
      let shouldPoll = false;
      let pollCount = 0;
      const MAX_POLLS = 20;
      let bitcoinInvoice = null;
```

---

### Task 7: Replace `goBack`, remove balance/swap polling, remove relay/refund functions

- [ ] **Step 1: Replace `goBack`**

Find:
```js
      function goBack(target) {
        stopBalancePolling();
        // Reset refund/wallet button visibility
        ['btn-collab-refund', 'btn-timeout-refund', 'btn-submit-refund', 'btn-open-wallet', 'btn-connect-pay'].forEach(id => {
          const el = document.getElementById(id);
          if (el) { el.style.display = 'none'; el.disabled = false; }
        });
        const countdown = document.getElementById('refund-countdown');
        if (countdown) countdown.textContent = '';
        pendingRefundTx = null;
        if (target === 'network') {
          stopPolling();
          stopSwapPolling();
          document.getElementById('qr-stable-address').innerHTML = '';
          stableAddress = null;
          showScreen('screen-network');
        } else {
          stopPolling();
          stopSwapPolling();
          document.getElementById('btn-btc').disabled = false;
          document.getElementById('qr-btc-invoice').innerHTML = '';
          document.getElementById('qr-stable-address').innerHTML = '';
          stableAddress = null;
          selectedNetwork = null;
          document.querySelectorAll('.network-card').forEach(c => c.classList.remove('selected'));
          showScreen('screen-initial');
        }
      }
```

Replace with:
```js
      function goBack() {
        stopPolling();
        document.getElementById('btn-btc').disabled = false;
        document.getElementById('qr-btc-invoice').innerHTML = '';
        document.getElementById('qr-stable-address').innerHTML = '';
        depositAddress = null;
        selectedNetwork = null;
        document.querySelectorAll('.network-card').forEach(c => c.classList.remove('selected'));
        showScreen('screen-initial');
      }
```

- [ ] **Step 2: Remove `stopSwapPolling`, balance polling, and relay/refund/recovery functions**

Find and delete each of the following function blocks entirely:

- `function stopSwapPolling() { ... }`
- `function startBalancePolling() { ... }`
- `function stopBalancePolling() { ... }`
- `function scheduleBalancePoll() { ... }`
- `async function doBalancePoll() { ... }`
- `async function attemptRelay() { ... }`
- `async function resumeSwapFromStorage() { ... }`
- `async function retryRelay() { ... }`
- `async function refreshSwapStatus() { ... }`
- `async function requestCollabRefund() { ... }`
- `async function requestTimeoutRefund() { ... }`
- `async function submitRefundTx() { ... }`
- `function startRefundCountdown(timelockExpiry) { ... }`
- `function openGearOverlay() { ... }`
- `function closeGearOverlay() { ... }`
- `async function revealGearSeed() { ... }`
- `function copyGearSeed() { ... }`
- `function updateResumeButton() { ... }`
- `function getSwapStatus(swap) { ... }`
- `function getSwapAddress(swap) { ... }`
- `function getSwapSourceAmount(swap) { ... }`
- `const TERMINAL_STATES = new Set([...])` and `const COLLAB_REFUND_STATUSES = new Set([...])` — both Set declarations, plus the 3 helper functions below them: `isTerminalSuccess`, `isTerminalFailure`, `needsCollabRefund`
- `const STATUS_LABELS = ...` and `function friendlyStatus(s) { ... }`
- `function updateSwapDetails(swap, context) { ... }`
- `function startSwapPolling() { ... }`
- `function scheduleSwapPoll() { ... }`
- `async function doSwapPoll() { ... }`
- `function setRecoveryStatus(message) { ... }`
- `function getTokenInfo(network, currency) { ... }`

Also remove the `let pendingRefundTx = null;` line — it is at module scope (~line 1853 in the original file), just before the `requestCollabRefund` function body.

---

### Task 8: Replace `buildEip681Uri` / `openWallet` / `connectAndPay` / `showWalletButtons` / storage helpers

- [ ] **Step 1: Replace `buildEip681Uri`**

Find:
```js
      function buildEip681Uri() {
        if (!currentTokenAddress || !currentDepositAddress || !currentChainId || !expectedAmountRaw) return null;
        // ERC-20 transfer: ethereum:<token>@<chainId>/transfer?address=<to>&uint256=<amount>
        return \`ethereum:\${currentTokenAddress}@\${currentChainId}/transfer?address=\${currentDepositAddress}&uint256=\${expectedAmountRaw.toString()}\`;
      }
```

Replace with:
```js
      function buildEip681Uri() {
        if (!currentTokenAddress || !depositAddress || !currentChainId || !amountInRaw) return null;
        // ERC-20 transfer per EIP-681; uint256 value is decimal (not hex)
        return \`ethereum:\${currentTokenAddress}@\${currentChainId}/transfer?address=\${depositAddress}&uint256=\${amountInRaw.toString()}\`;
      }
```

- [ ] **Step 2: Replace `openWallet`**

Find:
```js
      function openWallet() {
        const uri = buildEip681Uri();
        if (!uri) return;
        window.location.href = uri;
      }
```

Replace with:
```js
      function openWallet() {
        const uri = buildEip681Uri();
        if (!uri) return;
        window.location.href = uri;
      }
```

(No change needed — this function is already correct.)

- [ ] **Step 3: Replace `connectAndPay`**

Find:
```js
      async function connectAndPay() {
        if (!window.ethereum || !currentTokenAddress || !currentDepositAddress || !currentChainId || !expectedAmountRaw) return;
        try {
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          const chainHex = '0x' + currentChainId.toString(16);
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain', params: [{ chainId: chainHex }],
            });
          } catch (switchErr) { if (switchErr.code === 4902) throw switchErr; }
          // ABI-encode ERC-20 transfer(address,uint256)
          // selector: 0xa9059cbb
          const addrPadded = currentDepositAddress.replace('0x', '').toLowerCase().padStart(64, '0');
          const amtPadded = expectedAmountRaw.toString(16).padStart(64, '0');
          const data = '0xa9059cbb' + addrPadded + amtPadded;
          await window.ethereum.request({
            method: 'eth_sendTransaction',
            params: [{ from: accounts[0], to: currentTokenAddress, data }],
          });
        } catch (err) {
         if (err.code !== 4001) showAlert('Wallet error: ' + (err.message || err));
        }
      }
```

Replace with:
```js
      async function connectAndPay() {
        if (!window.ethereum || !currentTokenAddress || !depositAddress || !currentChainId || !amountInRaw) return;
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
          // All wallet errors treated identically (rejection, chain switch failure, etc.)
          // wallet_addEthereumChain fallback is out of scope for v1.
          // txHashSubmitted not set (handleTxHash not called), so no reset needed.
          showTxHashError('Wallet error: ' + (err.message || 'Request rejected.'));
        }
      }
```

- [ ] **Step 4: Replace `showWalletButtons`**

Find:
```js
      function showWalletButtons() {
        const uri = buildEip681Uri();
        const openBtn = document.getElementById('btn-open-wallet');
        const connectBtn = document.getElementById('btn-connect-pay');
        if (openBtn && isMobileDevice()) openBtn.style.display = uri ? 'block' : 'none';
        if (connectBtn && !isMobileDevice()) connectBtn.style.display = window.ethereum ? 'block' : 'none';
      }
```

Replace with:
```js
      function showWalletButtons() {
        const uri = buildEip681Uri();
        const openBtn = document.getElementById('btn-open-wallet');
        const connectBtn = document.getElementById('btn-connect-pay');
        if (openBtn) openBtn.style.display = (isMobileDevice() && uri) ? 'block' : 'none';
        if (connectBtn) connectBtn.style.display = (!isMobileDevice() && !!window.ethereum) ? 'block' : 'none';
      }
```

- [ ] **Step 5: Update `saveSwapContext` and `clearSwapContext` to remove `updateResumeButton()` call**

Find:
```js
      function saveSwapContext(context) {
        localStorage.setItem(SWAP_STORAGE_KEY, JSON.stringify(context));
        updateResumeButton();
      }

      function clearSwapContext() {
        localStorage.removeItem(SWAP_STORAGE_KEY);
        updateResumeButton();
      }
```

Replace with:
```js
      function saveSwapContext(context) {
        localStorage.setItem(SWAP_STORAGE_KEY, JSON.stringify(context));
      }

      function clearSwapContext() {
        localStorage.removeItem(SWAP_STORAGE_KEY);
      }
```

- [ ] **Step 6: Update `copyAddress` to use `depositAddress` instead of `stableAddress`**

Find:
```js
      function copyAddress() {
        if (!stableAddress) return;
        navigator.clipboard.writeText(stableAddress);
```

Replace with:
```js
      function copyAddress() {
        if (!depositAddress) return;
        navigator.clipboard.writeText(depositAddress);
```

---

### Task 9: Replace `showNetworkSelect`, `selectNetwork`, `selectCurrency`, `confirmStablecoin`

- [ ] **Step 1: Replace `showNetworkSelect`**

Find:
```js
      function showNetworkSelect() {
        if (${amount} < 1000){
         showAlert('Minimum USDC/USDT amount is ${formatAmountLabel({ amount: 1000 })}');
         return
        }
        showScreen('screen-network');
      }
```

Replace with:
```js
      function showNetworkSelect() {
        if (${amount} < 1000){
          showAlert('Minimum USDC/USDT amount is ${formatAmountLabel({ amount: 1000 })}');
          return;
        }
        selectedNetwork = null;
        // Render network cards filtered by selectedCurrency
        const grid = document.getElementById('network-grid');
        if (grid) {
          const networks = CURRENCY_NETWORKS[selectedCurrency] || [];
          grid.innerHTML = networks.map(n =>
            \`<div class="network-card" id="card-\${n}" onclick="selectNetwork('\${n}')">\${NETWORK_LABELS[n]}</div>\`
          ).join('');
        }
        showScreen('screen-network');
      }
```

- [ ] **Step 2: Replace `selectNetwork`**

Find:
```js
      function selectNetwork(network) {
        selectedNetwork = network;
        document.querySelectorAll('.network-card').forEach(c => c.classList.remove('selected'));
        document.getElementById('card-' + network).classList.add('selected');
      }
```

Replace with:
```js
      function selectNetwork(network) {
        selectedNetwork = network;
        document.querySelectorAll('.network-card').forEach(c => c.classList.remove('selected'));
        const card = document.getElementById('card-' + network);
        if (card) card.classList.add('selected');
      }
```

- [ ] **Step 3: Replace `selectCurrency`**

Find:
```js
      function selectCurrency(currency) {
        selectedCurrency = currency;
        document.getElementById('btn-usdc').classList.toggle('active', currency === 'USDC');
        document.getElementById('btn-usdt').classList.toggle('active', currency === 'USDT');
      }
```

Replace with:
```js
      function selectCurrency(currency) {
        selectedCurrency = currency;
        const usdcBtn = document.getElementById('btn-usdc');
        const usdtBtn = document.getElementById('btn-usdt');
        if (usdcBtn) usdcBtn.classList.toggle('active', currency === 'USDC');
        if (usdtBtn) usdtBtn.classList.toggle('active', currency === 'USDT');
      }
```

- [ ] **Step 4: Replace `confirmStablecoin`**

Find the entire `async function confirmStablecoin()` block (lines 1612–1671) and replace it with:

```js
      async function confirmStablecoin() {
        if (!selectedNetwork) {
          showAlert('Please select a network first.');
          return;
        }
        const continueBtn = document.getElementById('btn-continue-stable');
        if (continueBtn) continueBtn.disabled = true;

        // Reset creating screen state
        const spinnerEl = document.getElementById('creating-spinner');
        const statusEl  = document.getElementById('creating-status');
        const errorEl   = document.getElementById('creating-error');
        const backBtn   = document.getElementById('creating-back-btn');
        if (spinnerEl) spinnerEl.style.display = 'inline-block';
        if (statusEl)  { statusEl.textContent = 'Creating swap\u2026'; statusEl.style.display = 'block'; }
        if (errorEl)   errorEl.style.display = 'none';
        if (backBtn)   backBtn.style.display = 'none';
        showScreen('screen-creating-swap');

        try {
          const res = await fetch('/createPayLinkInvoice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paylinkId: PAYLINK_ID, network: selectedNetwork, currency: selectedCurrency }),
          });
          const json = await res.json();
          if (!json || json.status !== 'SUCCESS' || !json.depositAddress) throw new Error('create-failed');

          depositAddress = json.depositAddress;
          amountInRaw    = BigInt(String(json.amountIn));
          estimatedOut   = json.estimatedOut;

          const networkEntry = NETWORK_MAP[selectedNetwork] || {};
          currentChainId      = networkEntry.chainId || null;
          currentTokenAddress = currentChainId ? (networkEntry[selectedCurrency.toLowerCase()] || null) : null;

          // Render QR
          const qrEl = document.getElementById('qr-stable-address');
          if (qrEl) {
            qrEl.innerHTML = '';
            new QRCode(qrEl, {
              text: depositAddress,
              width: 220, height: 220,
              colorDark: '#000000', colorLight: '#ffffff',
              correctLevel: QRCode.CorrectLevel.H,
            });
          }

          // Set labels
          const networkLabelEl = document.getElementById('stable-network-label');
          if (networkLabelEl) networkLabelEl.textContent = 'Send ' + selectedCurrency + ' on ' + (NETWORK_LABELS[selectedNetwork] || selectedNetwork);
          const amountLabelEl = document.getElementById('stable-amount-label');
          if (amountLabelEl) amountLabelEl.textContent = formatTokenAmount(amountInRaw, 6) + ' ' + selectedCurrency + ' \u2192 ~' + estimatedOut + ' sats';
          const addrEl = document.getElementById('stable-address-text');
          if (addrEl) addrEl.textContent = depositAddress;

          // Clear previous error
          showTxHashError('');

          const detectEl = document.getElementById('txhash-detect-status');
          if (currentChainId) {
            // EVM: start watcher + show wallet buttons
            swapWatcher = PaylinkSwap.watchForTransfer({
              depositAddress,
              tokenAddress: currentTokenAddress,
              chainId: currentChainId,
              onFound: (txHash, from) => handleTxHash(txHash, from),
            });
            showWalletButtons();
            if (detectEl) detectEl.textContent = 'Monitoring for transaction\u2026';
          } else {
            // Non-EVM: hide wallet buttons
            const openBtn    = document.getElementById('btn-open-wallet');
            const connectBtn = document.getElementById('btn-connect-pay');
            if (openBtn)    openBtn.style.display = 'none';
            if (connectBtn) connectBtn.style.display = 'none';
            if (detectEl) detectEl.textContent = 'Auto-detection unavailable for this network. Paste your tx hash after sending.';
          }

          showScreen('screen-stable-pay');
        } catch (err) {
          if (continueBtn) continueBtn.disabled = false;
          showScreen('screen-network');
          showAlert('Failed to create swap. Please try again.');
        }
      }
```

---

### Task 10: Add new functions: `handleTxHash`, `submitManualTxHash`, `showTxHashError`, isPaid polling, `showErrorScreen`, `formatNetworkLabel`, `formatTokenAmount` update

- [ ] **Step 1: Add helper functions after `formatTokenAmount`**

Find the existing `formatTokenAmount` function:
```js
      function formatTokenAmount(raw, decimals) {
        if (!raw) return '';
        const rawStr = raw.toString();
        if (!decimals) return rawStr;
        const amount = raw / Math.pow(10,decimals)
        return amount.toFixed(2)
      }
```

Replace with the updated version plus new helpers appended after it:
```js
      function formatTokenAmount(raw, decimals) {
        if (!raw) return '';
        if (!decimals) return raw.toString();
        return (Number(raw) / Math.pow(10, decimals)).toFixed(2);
      }

      function formatNetworkLabel(network) {
        return NETWORK_LABELS[network] || (network ? network.charAt(0).toUpperCase() + network.slice(1) : '');
      }

      function showTxHashError(msg) {
        const el = document.getElementById('txhash-error');
        if (!el) return;
        el.textContent = msg;
        el.style.display = msg ? 'block' : 'none';
      }

      async function handleTxHash(txHash, sourceAddress) {
        if (txHashSubmitted) return;
        txHashSubmitted = true;
        if (swapWatcher) { swapWatcher.stop(); swapWatcher = null; }

        // Validate format
        const isEVM    = /^0x[0-9a-fA-F]{64}$/.test(txHash);
        const isNonEVM = !currentChainId && txHash.trim().length > 10;
        if (!isEVM && !isNonEVM) {
          txHashSubmitted = false;
          showTxHashError('Invalid transaction hash format.');
          return;
        }

        showScreen('screen-processing');
        try {
          const res = await fetch('/submitPaylinkSwap', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paylinkId: PAYLINK_ID, txHash, sourceAddress: sourceAddress || null }),
          });
          const json = await res.json();
          if (!json || json.status !== 'SUCCESS') throw new Error('submit-failed');
          saveSwapContext({ txHash, sourceAddress: sourceAddress || null });
          startIsPaidPolling();
        } catch (err) {
          txHashSubmitted = false;
          showScreen('screen-stable-pay');
          showTxHashError('Submission failed. Please try again.');
        }
      }

      function submitManualTxHash() {
        const val = document.getElementById('txhash-input');
        if (val) handleTxHash(val.value.trim(), null);
      }

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
          shouldPoll = false;
          showErrorScreen();
          return;
        }
        _schedulePaylinkPoll();
      }

      function retryIsPaidPolling() {
        if (pollTimer) { clearTimeout(pollTimer); pollTimer = null; }
        pollCount = 0;
        shouldPoll = true;
        _schedulePaylinkPoll();
      }

      function showErrorScreen() {
        const stored = loadSwapContext();
        const el = document.getElementById('error-txhash-display');
        if (el) el.textContent = stored?.txHash || '(unknown)';
        showScreen('screen-error');
      }
```

---

### Task 11: Replace `DOMContentLoaded` handler; remove `createLightningInvoice`

- [ ] **Step 1: Remove `createLightningInvoice` (now unused)**

Find and delete:
```js
      async function createLightningInvoice() {
        const res = await fetch('/createPayLinkInvoice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paylinkId: PAYLINK_ID }),
        });
        const json = await res.json();
        if (!json || json.status !== 'SUCCESS' || !json.invoice) {
          throw new Error('invoice');
        }
        return json.invoice;
      }
```

- [ ] **Step 2: Replace `DOMContentLoaded` handler**

Find:
```js
      document.addEventListener('DOMContentLoaded', () => {
        updateResumeButton();
        const existingSwap = loadSwapContext();
        if (existingSwap && existingSwap.swapId) {
          resumeSwapFromStorage();
        }
      });
```

Replace with:
```js
      document.addEventListener('DOMContentLoaded', () => {
        const stored = loadSwapContext();
        // Resume if we have a txHash from a previous submission.
        // Discard stale Lendaswap entries (those have a swapId key).
        if (stored && stored.txHash && !stored.swapId) {
          txHashSubmitted = true;
          showScreen('screen-processing');
          startIsPaidPolling();
        }
      });
```

- [ ] **Step 3: Also update `stopPolling` to be compatible with new state**

Find:
```js
      function stopPolling() {
        shouldPoll = false;
        if (pollTimer) { clearTimeout(pollTimer); pollTimer = null; }
      }
```

This function is still used by `goBack()` for the BTC polling path. It's correct as-is. No change needed.

- [ ] **Step 4: Build and do a full manual verification pass**

Run `netlify dev`, open `/paylink/<test-id>`, then work through the verification checklist from the spec:

1. Lightning flow: click "Pay with Bitcoin" → QR renders → polling starts
2. Currency toggle: switch to USDT → "Pay with USDC or USDT" → 4 networks shown (Ethereum/Arbitrum/Optimism/Tron)
3. Switch back to USDC → 6 networks shown
4. Select Solana → Continue → spinner → QR renders; no wallet buttons; "Auto-detection unavailable" message shown
5. Select Arbitrum → Continue → spinner → QR renders; monitoring starts; Connect & Pay visible (desktop)
6. Paste valid 0x hash → Submit → jumps to processing screen
7. Paste invalid text → inline error shown; stays on stable-pay screen
8. In DevTools → Application → LocalStorage: after submit, entry shape is `{ txHash, sourceAddress }`
9. Reload page after submit → jumps directly to processing screen (resume path)
10. In DevTools → Network: POST to `/getPaylinkData` every 5s

- [ ] **Step 5: Commit**

```bash
git add netlify/handle-paylink.js
git commit -m "feat: replace Lendaswap stablecoin flow with Flashnet REST API"
```

---

## Final Verification

After all tasks are complete, run through the full spec verification checklist (Section 9 of the spec). Pay special attention to items 13–18 which require either a live Flashnet endpoint or mocking the responses in DevTools to simulate `isPaid: true`, poll timeout (20 polls), and page reload scenarios.

```bash
# Confirm no Lendaswap references remain
grep -r "lendaswap\|lendasat\|createSwap\|fundSwapGasless\|getMnemonic\|collabRefund\|swapId\|resumeSwap\|screen-recovery\|gear-overlay\|btn-resume-swap" netlify/handle-paylink.js src/
```

Expected: no matches.
