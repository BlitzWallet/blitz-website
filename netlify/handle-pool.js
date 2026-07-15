import { signedRequestHeaders, PROXY_ORIGIN } from "./lib/sign-request.js";
import { designCss } from "./lib/design-css.js";

async function fetchFreshPoolData(poolId, baseUrl) {
  try {
    const res = await fetch(PROXY_ORIGIN + "/getPoolData", {
      method: "POST",
      headers: signedRequestHeaders(),
      body: JSON.stringify({ poolId }),
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) {
      console.error("[OG pool] Cloud Function returned", res.status);
      return null;
    }

    const json = await res.json();
    if (json?.status !== "SUCCESS") {
      console.error("[OG pool] Unexpected status:", json?.status);
      return null;
    }

    return json?.data ?? null;
  } catch (err) {
    console.error("[OG pool] fetch error:", err.message);
    return null;
  }
}

async function fetchPoolData(poolId, baseUrl) {
  const promise = fetchFreshPoolData(poolId, baseUrl);
  const data = await promise;
  return data;
}

// ── 2. Format goal amount for display ─────────────────────────────────────────
//
// goalAmount is always stored in SATS. poolDenomination is only a display
// preference (which fiat currency to show the sat amount in), mirroring the
// client's satsToFiat/formatAmount. Do NOT treat the goal as fiat cents.

function formatPoolGoal(data, btcPrice) {
  if (!data) return null;
  const goalSats = Number(data.goalAmount ?? 0);
  return goalSats;
}

// ── 3. Build og:image URL ─────────────────────────────────────────────────────

function buildPoolOgImageUrl(baseUrl, poolId, goalLabel, pct) {
  const goal = encodeURIComponent(goalLabel ?? "");
  const pctValue = Number.isFinite(pct)
    ? Math.max(0, Math.min(100, Math.round(pct)))
    : 0;

  return (
    `${baseUrl}/og-pool` +
    `?goal=${goal}` +
    `&pct=${pctValue}` +
    `&id=${encodeURIComponent(poolId)}` +
    `&v=2`
  );
}

export async function handler(event, context) {
  const path = (event.path || "").replace(/\/+$/, "");
  let poolId = path.split("/").pop() || "";
  try {
    poolId = decodeURIComponent(poolId);
  } catch (e) {
    // Keep raw poolId if decode fails.
  }
  const baseUrl = process.env.URL || "https://blitzwalletapp.com";
  const poolData = await fetchPoolData(poolId, baseUrl);

  let ogTitle, ogDescription, ogImage;

  if (poolData) {
    const goalLabel = formatPoolGoal(poolData, poolData.btcPrice);
    const poolTitle = poolData.poolTitle ?? "Pool";
    const creatorName = poolData.creatorName ?? "";
    const goalAmount = Number(poolData.goalAmount ?? 0);
    const currentAmount = Number(poolData.currentAmount ?? 0);
    const pct =
      goalAmount > 0
        ? Math.min(Math.round((currentAmount / goalAmount) * 100), 100)
        : 0;

    ogTitle =
      `${creatorName} shared a pool for ${poolTitle}, Open the link to contribute.`
        .trim()
        .replace(/ — Pool by $/, "");
    ogDescription = ogTitle;
    ogImage = buildPoolOgImageUrl(baseUrl, poolId, goalLabel, pct);
  } else {
    ogTitle = "Join this Bitcoin Pool on Blitz Wallet";
    ogDescription =
      "Contribute to a community Bitcoin pool via Lightning — no app required.";
    ogImage = `https://blitzwalletapp.com/public/twitterCard.png`;
  }

  const html = generateHTML({
    poolId,
    ogTitle,
    ogDescription,
    ogImage,
    poolData,
  });

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "text/html",
    },
    body: html,
  };
}

function generateHTML({ poolId, ogTitle, ogDescription, ogImage, poolData }) {
  const inlinedData = JSON.stringify(poolData ?? null);
  const inlinedPoolId = JSON.stringify(poolId);
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="canonical" href="https://blitzwalletapp.com/pools/${poolId}" />

    <!-- Favicon -->
    <link rel="icon" type="image/png" href="/public/favicon/favicon-96x96.png" sizes="96x96" />
    <link rel="icon" type="image/svg+xml" href="/public/favicon/favicon.svg" />
    <link rel="shortcut icon" href="/public/favicon/favicon.ico" />
    <link rel="apple-touch-icon" href="/public/favicon/favicon.ico" />
    <meta name="apple-mobile-web-app-title" content="Blitz Wallet" />
    <meta
      name="apple-itunes-app"
      content="app-id=6476810582, app-argument=https://blitzwalletapp.com/pools/${poolId}"
    />
    <link rel="manifest" href="/public/favicon/site.webmanifest" />

    <title>${ogTitle}</title>
    <meta name="description" content="${ogDescription}" />

    <!-- Open Graph -->
    <meta property="og:image"        content="${ogImage}" />
    <meta property="og:image:width"  content="1200" />
    <meta property="og:image:height" content="628" />
    <meta property="og:image:type"   content="image/png" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://blitzwalletapp.com/pools/${poolId}" />
   <meta property="og:title"        content="${ogTitle}" />
    <meta property="og:description"  content="${ogDescription}" />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image"       content="${ogImage}" />
    <meta property="twitter:url" content="https://blitzwalletapp.com/pools/${poolId}" />
    <meta property="twitter:title" content="${ogTitle}" />
    <meta property="twitter:description" content="${ogDescription}" />

    <meta name="robots" content="noindex,nofollow">
    <meta name="googlebot" content="noindex,nofollow">

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Noto+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">

    <!-- Lucide Icons -->
    <script src="https://unpkg.com/lucide@latest"></script>

    <!-- QR Code Library -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>

    <!-- Currency formatting -->
    <script src="/src/js/format-currency.js"></script>

    <style>
      ${designCss}

      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: var(--font-sans);
        background: var(--color-bg);
        color: var(--color-ink);
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: calc(70px + 1rem) 1rem 1rem;
      }

      .pool-container {
        width: 100%;
        max-width: 550px;
        margin: 25px auto;
      }

      .pool-card {
        position: relative;
        background: white;
        border-radius: 24px;
        padding: 2rem;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
        border: 1px solid var(--color-surface-offset);
        text-align: center;
      }

      /* Loading (.spinner + @keyframes spin come from the shared design CSS;
         size it up to the 50px this page used) */
      .loading-container .spinner {
        --spinner-size: 50px;
      }

      .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.5rem;
        opacity: 1;
        transition: opacity 0.3s ease;
        padding: 3rem 0;
      }

      .loading-container.fade-out {
        opacity: 0;
      }

      .loading-container p {
        font-size: 1rem;
        opacity: 0.8;
      }

      .content-container {
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      .content-container.fade-in {
        opacity: 1;
      }


      /* Progress Ring */
      .progress-ring-container {
        width: 100%;
        max-width: 300px;
        height: auto;
        aspect-ratio: 1;
        position: relative;
        margin: 0 auto 1.5rem;

      }

      .progress-ring-svg {
        transform: rotate(-90deg);
        width: 100%;
        height: 100%;
      }

      .progress-ring-bg {
        fill: none;
        stroke: var(--color-surface-offset);
        stroke-width: 4;
      }

      .progress-ring-fill {
        fill: none;
        stroke: url(#progressGradient);
        stroke-width: 4;
        stroke-linecap: round;
        transition: stroke-dashoffset 1s ease;
      }

      .progress-ring-text {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
      }

      .progress-amount {
        font-size: 1.5rem;
        font-weight: 500;
        line-height:34px;
        color: var(--color-ink);
      }

      .progress-goal {
        font-size: 0.8rem;
        color: #888;
        margin-top: 2px;
      }

      /* Pool Info */
      .pool-title {
        font-size: 1.8rem;
        font-weight: 500;
        margin-bottom: 0.5rem;
        color: var(--color-ink);
      }

      .pool-meta {
        font-size: 0.95rem;
        color: #888;
        margin-bottom: 1.5rem;
      }

      .pool-meta span {
        margin: 0 0.25rem;
      }

      /* Status Badge */
      .status-badge {
        display: inline-block;
        padding: 0.5rem 1rem;
        border-radius: 50px;
        font-size: 0.9rem;
        font-weight: 500;
        margin-bottom: 1rem;
      }

      .status-badge.closed {
        background: #fee2e2;
        color: #991b1b;
      }

      .status-badge.active {
        background: #d1fae5;
        color: #065f46;
      }

      /* Buttons */
      .btn-primary {
        background: var(--color-brand);
        color: white;
        padding: 1rem 2rem;
        border: none;
        border-radius: 12px;
        font-size: 1.1rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
        width: 100%;
        margin-top: 0.75rem;
        font-family: var(--font-sans);
        box-shadow: 0 4px 15px rgba(3, 117, 246, 0.3);
      }

      .btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(3, 117, 246, 0.4);
      }

      .btn-primary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
      }

      .btn-secondary {
        display: flex;
        background: transparent;
        color: var(--lmt-text);
        padding: 1rem 2rem;
        border: 1px solid var(--color-surface-offset);
        border-radius: 12px;
        font-size: 1rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
        width: 100%;
        margin-top: 0.75rem;
        font-family: var(--font-sans);
        align-items: center;
        justify-content: center;
      }

      .btn-secondary:hover {
        background: var(--color-bg);
        border-color: var(--color-brand);
      }

      .btn-secondary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
      }

      .btn-content {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
      }

      .btn-content img {
        width: 20px;
        height: 20px;
        display: block;
      }

      .loading-dots {
        display: inline-flex;
        align-items: center;
        gap: 0.2rem;
      }

      .loading-dots span {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: currentColor;
        animation: button-dot-pulse 1.2s infinite ease-in-out both;
      }

      .loading-dots span:nth-child(1) { animation-delay: -0.24s; }
      .loading-dots span:nth-child(2) { animation-delay: -0.12s; }

      @keyframes button-dot-pulse {
        0%, 80%, 100% { transform: scale(0.4); opacity: 0.45; }
        40% { transform: scale(1); opacity: 1; }
      }

      .btn-back {
        background: none;
        border: none;
        color: var(--color-brand);
        font-size: 0.95rem;
        cursor: pointer;
        padding: 0.5rem 0;
        margin-bottom: 1rem;
        font-family: var(--font-sans);
        display: flex;
        align-items: center;
        gap: 0.25rem;
      }

      /* ── Past contributions (mirrors the tips swap-history panel) ─────── */
      .pool-history-btn {
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--lm-background);
        border: 1px solid var(--lm-backgroundOffset);
        border-radius: 50%;
        color: var(--lm-text);
        cursor: pointer;
        margin-left: auto;
        z-index: 6;
        transition: background var(--ease-micro), border-color var(--ease-micro), color var(--ease-micro);
      }
      .pool-history-btn:hover {
        border-color: var(--primary_color);
        color: var(--primary_color);
      }
      .pool-history-btn svg { width: 20px; height: 20px; stroke-width: 1.75; }

      .pool-history-dropdown {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: white;
        border-radius: 24px;
        max-height: 0;
        overflow: hidden;
        opacity: 0;
        transition: all 0.3s ease;
        z-index: 10;
      }
      .pool-history-dropdown.active {
        max-height: 100%;
        opacity: 1;
        padding: 2rem 2rem 0;
      }
      .pool-history-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .pool-history-title {
        font-size: 1.1rem;
        font-weight: 500;
        color: var(--lm-text);
      }
      .pool-history-close {
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--lm-background);
        border: 1px solid var(--lm-backgroundOffset);
        border-radius: 50%;
        color: var(--lm-text);
        cursor: pointer;
        transition: background var(--ease-micro), border-color var(--ease-micro), color var(--ease-micro);
      }
      .pool-history-close:hover {
        border-color: var(--primary_color);
        color: var(--primary_color);
      }
      .pool-history-close svg { width: 18px; height: 18px; }

      .pool-history-list {
        max-height: calc(100% - 96px);
        margin-top: 1rem;
        overflow-y: auto;
        color: var(--lm-text);
        text-align: left;
      }
      .pool-history-item {
        border-top: 1px solid var(--lm-backgroundOffset);
        padding: 0.75rem 0;
      }
      .pool-history-item:first-child { border-top: none; }
      .swap-quote { display: flex; align-items: center; gap: 10px; }
      .chain-icon-wrapper { position: relative; width: 36px; height: 36px; flex-shrink: 0; }
      .chain-icon { width: 36px; height: 36px; border-radius: 50%; }
      .token-overlay {
        position: absolute;
        bottom: -4px;
        right: -4px;
        width: 18px;
        height: 18px;
        border-radius: 50%;
      }
      .quote-middle { flex: 1; min-width: 0; }
      .pool-history-pool {
        font-size: 0.8rem;
        font-weight: 500;
        color: var(--lm-text);
        word-break: break-word;
      }
      .pool-history-amount { font-size: 0.72rem; opacity: 0.6; margin-top: 1px; }
      .quote-id { font-size: 0.75rem; word-break: break-all; opacity: 0.9; margin-top: 1px; }
      .quote-time { font-size: 0.7rem; opacity: 0.45; margin-top: 2px; }
      .copy-btn {
        font-size: 0.7rem;
        padding: 0.15rem 0.4rem;
        border-radius: 4px;
        border: 1px solid var(--lm-backgroundOffset);
        background: transparent;
        color: inherit;
        cursor: pointer;
        white-space: nowrap;
        flex-shrink: 0;
      }
      .copy-btn:hover { background: var(--lm-background); }
      .copy-btn.copied {
        border-color: var(--color-brand);
        color: var(--color-brand);
        background: transparent;
      }

      /* Amount Grid */
      .amount-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 0.75rem;
        margin: 1.5rem 0;
      }

      .amount-option {
        background: white;
        border: 2px solid var(--color-surface-offset);
        border-radius: 12px;
        padding: 1rem;
        font-size: 1.1rem;
        cursor: pointer;
        transition: all 0.2s ease;
        font-family: var(--font-sans);
        color: var(--color-ink);
      }

      .amount-option:hover {
        border-color: var(--color-brand);
      }

      .amount-option.selected {
        border-color: var(--color-brand);
        background: rgba(3, 117, 246, 0.05);
        color: var(--color-brand);
      }

      .amount-option.custom-btn {
        font-size: 1.4rem;
        letter-spacing: 2px;
      }

      /* Custom Amount Input */
      .custom-amount-wrapper {
        display: none;
        margin: 1rem 0;
      }

      .custom-amount-wrapper.visible {
        display: block;
      }

      .custom-amount-input {
        width: 100%;
        padding: 10px;
        font-size: 1rem;
        font-family: var(--font-sans);
        border: 2px solid var(--color-surface-offset);
        border-radius: 12px;
        text-align: center;
        outline: none;
        transition: border-color 0.2s ease;
        color: var(--color-ink);
      }

      .custom-amount-input:focus {
        border-color: var(--color-brand);
      }

      .custom-amount-input::placeholder {
        color: #ccc;
      }

      /* Name Input */
      .name-input-section {
        margin: 1.5rem 0;
        text-align: left;
      }

      .name-input-label {
        font-size: 0.9rem;
        font-weight: 500;
        color: #888;
        margin-bottom: 0.5rem;
      }

      .name-input {
        width: 100%;
        padding: 10px;
        font-size: 1rem;
        font-family: var(--font-sans);
        border: 2px solid var(--color-surface-offset);
        border-radius: 12px;
        outline: none;
        transition: border-color 0.2s ease;
        color: var(--color-ink);
      }

      .name-input:focus {
        border-color: var(--color-brand);
      }

      .name-input::placeholder {
        color: #ccc;
      }

      /* Error Text */
      .error-text {
        color: #991b1b;
        font-size: 0.9rem;
        margin-top: 0.5rem;
        text-align: center;
      }

      /* QR Section */
      .qr-section {
        text-align: center;
        padding: 1rem 0;
      }

      .qr-code-container {
        display: inline-block;
        padding: 1rem;
        background: white;
        border-radius: 16px;
        border: 1px solid var(--color-surface-offset);
        margin: 1rem 0;
      }

      .qr-code-container canvas {
        display: block;
      }

      .invoice-amount-display {
        font-size: 1.5rem;
        font-weight: 500;
        color: var(--color-brand);
        margin: 0.5rem 0;
      }

      .waiting-text {
        font-size: 0.95rem;
        color: #888;
        margin: 1rem 0;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
      }

      .waiting-dot {
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--color-brand);
        animation: pulse-dot 1.4s infinite ease-in-out both;
      }

      .waiting-dot:nth-child(1) { animation-delay: -0.32s; }
      .waiting-dot:nth-child(2) { animation-delay: -0.16s; }

      @keyframes pulse-dot {
        0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
        40% { transform: scale(1); opacity: 1; }
      }

      .copy-invoice-btn {
        background: none;
        border: none;
        color: var(--color-brand);
        font-size: 0.9rem;
        font-weight: 500;
        cursor: pointer;
        padding: 0.5rem 1rem;
        font-family: var(--font-sans);
        text-decoration: underline;
      }

      /* Success State */
      .success-icon {
        width: 80px;
        height: 80px;
        background: var(--color-brand);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 1.5rem;
      }

      .success-icon svg {
        width: 40px;
        height: 40px;
        color: var(--color-bg);
      }

      .success-title {
        font-size: 1.5rem;
        font-weight: 500;
        margin-bottom: 0.5rem;
      }

      .success-subtitle {
        font-size: 1rem;
        color: #888;
        margin-bottom: 1.5rem;
      }

      /* Error (.error-box comes from the shared design CSS) */

      /* Step progress dots */
      .pool-stepper {
        display: none; /* renderStepper toggles to flex when in-flow */
        justify-content: center;
        gap: 0.5rem;
        margin-top: 1.5rem;
      }

      .stepper-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--color-surface-offset); /* upcoming */
        transition: width var(--ease-micro), background var(--ease-micro);
      }

      .stepper-dot.done { background: var(--color-brand-strong); }

      .stepper-dot.active {
        background: var(--color-brand);
        width: 24px;
        border-radius: 999px;
      }

      /* Step Transitions */
      .step {
        display: none;
      }

      .step.active {
        display: block;
      }

      /* Divider */
      .divider {
        height: 1px;
        background: var(--color-surface-offset);
        margin: 1.5rem 0;
      }

      /* Expired Invoice */
      .expired-notice {
        background: #fef3c7;
        border: 1px solid #fde68a;
        border-radius: 12px;
        padding: 1rem;
        margin: 1rem 0;
        font-size: 0.9rem;
        color: #92400e;
      }

      /* Pool info header: history + currency-switch icons, top-left inline */
      .pool-info-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
        justify-content: space-between;
      }

      /* Currency switch icon (mirrors the app's CurrencySwitchButton) */
      .currency-switch-btn {
        position: relative;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--lm-background);
        border: 1px solid var(--lm-backgroundOffset);
        border-radius: 50%;
        color: var(--lm-text);
        cursor: pointer;
        transition: background var(--ease-micro), border-color var(--ease-micro), color var(--ease-micro);
      }
      .currency-switch-btn:hover {
        border-color: var(--primary_color);
        color: var(--primary_color);
      }
      .currency-switch-btn .cs-main { width: 28px; height: 28px; stroke-width: 1.75; }
      .cs-badge {
       width: 10px; height: 10px; stroke-width: 2.25;  position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
       
        
        
      }
     

      /* Stablecoin: network selection */
      .network-cards {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        gap: 0.75rem;
        margin: 1rem 0 1.5rem;
      }

      .network-card {
        border: 1.5px solid var(--color-surface-offset);
        border-radius: 10px;
        padding: 0.875rem 0.5rem;
        cursor: pointer;
        font-weight: 500;
        font-size: 0.9rem;
        transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
        text-align: center;
        width: 100%;
        color: var(--color-ink);
        background: var(--color-surface);
      }

      .network-card:hover {
        border-color: var(--color-brand);
      }

      .network-card.selected {
        border-color: var(--color-brand);
        background: rgba(3, 117, 246, 0.06);
        color: var(--color-brand);
        box-shadow: 0 0 0 3px rgba(3, 117, 246, 0.12);
      }

      .currency-toggle {
        display: flex;
        gap: 0.5rem;
        background: var(--color-surface-warm);
        border-radius: 10px;
        padding: 4px;
        width: 100%;
        margin: 0.5rem 0 1rem;
      }

      .currency-toggle button {
        flex: 1;
        padding: 0.5rem;
        border: none;
        border-radius: 8px;
        background: transparent;
        font-family: var(--font-sans);
        font-weight: 500;
        cursor: pointer;
        transition: background 0.15s, color 0.15s;
        font-size: 0.9rem;
        color: var(--color-ink-60);
      }

      .currency-toggle button.active {
        background: var(--color-surface);
        color: var(--color-ink);
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
      }

      .section-label {
        font-size: 0.85rem;
        font-weight: 500;
        color: #888;
        text-align: left;
        width: 100%;
      }

      .address-box {
        width: 100%;
        background: var(--color-bg);
        border-radius: 10px;
        padding: 0.75rem 1rem;
        font-family: monospace;
        font-size: 0.85rem;
        margin: 1rem auto 0;
        cursor: pointer;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        display: block;
      }

      /* ─────────────────────────────────────────────────────────────────────
         Ported UI from the paylink/tips pages: flex "flow" screens, payment-
         method cards, dedicated loaders, and richer QR screens. Scoped to
         .pool-card so nothing clashes with the download modal.
         ───────────────────────────────────────────────────────────────────── */

      /* Flex layout for the upgraded steps (method / loaders / payment) so the
         ported components center exactly like the paylink screens. Existing
         steps (info / amount / name) keep the plain block layout above. */
      .step.flow-screen.active {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        animation: stepFadeIn 0.3s ease;
      }

      @keyframes stepFadeIn {
        from { opacity: 0; transform: translateY(6px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      .flow-screen .btn-back { align-self: flex-start; margin-bottom: 0.25rem; }
      .flow-screen .btn-primary,
      .flow-screen .btn-secondary { margin-top: 0; }

      /* Payment-method chooser cards */
      .payment-options {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        width: 100%;
      }

      .payment-option-btn {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem 1.25rem;
        background: var(--color-surface);
        border: 1.5px solid var(--color-surface-offset);
        border-radius: 14px;
        cursor: pointer;
        text-align: left;
        transition: border-color 0.15s, box-shadow 0.15s, background 0.15s, transform 0.15s;
        width: 100%;
        font-family: var(--font-sans);
      }

      .payment-option-btn:hover {
        border-color: var(--color-brand);
        box-shadow: 0 0 0 3px rgba(3, 117, 246, 0.08);
        transform: translateY(-1px);
      }

      .payment-option-btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none; box-shadow: none; }

      .payment-option-icon-wrap {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        overflow: hidden;
      }
      .payment-option-icon-wrap img { width: 55%; height: 55%; object-fit: contain; }

      .payment-option-icon-wrap--bitcoin { background: var(--color-orange); }
      .payment-option-icon-wrap--stable  { background: var(--color-green); }
      .payment-option-icon-wrap--cashapp img { width: 100%; height: 100%; }

      .payment-option-text { flex: 1; display: flex; flex-direction: column; gap: 2px; }
      .payment-option-label { font-weight: 500; font-size: 0.95rem; color: var(--color-ink); }
      .payment-option-sub { font-size: 0.8rem; color: var(--color-ink-60); }

      /* Dedicated loading screens (creating invoice / creating swap) */
      .creating-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        padding: 2rem 0;
        width: 100%;
      }

      .creating-spinner {
        width: 40px;
        height: 40px;
        border: 3px solid var(--color-surface-offset);
        border-top-color: var(--color-brand);
        border-radius: 50%;
        animation: spin 0.8s linear infinite; /* @keyframes spin from designCss */
      }

      .creating-status { font-size: 0.95rem; color: var(--color-ink-60); text-align: center; margin: 0; }
      .creating-error { font-size: 0.875rem; color: var(--color-error-text); text-align: center; margin: 0; }

      /* QR payment screens */
      .qr-screen-title { font-weight: 500; font-size: 1.25rem; text-align: center; margin: 0; color: var(--color-ink); }

      .qr-amount {
        font-size: 1.5rem;
        font-weight: 500;
        line-height: 1.1;
        color: var(--color-brand);
        margin: 0;
        text-align: center;
      }

      .pool-card .qr-wrapper {
        width: 90%;
        max-width: 320px;
        background: var(--color-surface-warm);
        border: none;
        border-radius: 16px;
        padding: 3%;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        margin: 0 auto;
      }

      .pool-card .qr-wrapper.clickable { cursor: pointer; }
      .pool-card .qr-wrapper.clickable:hover { opacity: 0.92; }

      .pool-card #qrStableContainer,
      .pool-card #qrCodeContainer {
        display: flex;
        justify-content: center;
        align-items: center;
        background: white;
        padding: 6%;
        border-radius: 12px;
      }
      .pool-card #qrStableContainer canvas,
      .pool-card #qrCodeContainer canvas { display: block; }

      .qr-tap-hint {
        color: var(--color-ink);
        font-size: 0.8rem;
        text-align: center;
        opacity: 0.7;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
      }
      .qr-tap-hint svg { width: 16px; height: 16px; }

      .qr-copy-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: var(--color-surface-warm);
        border-radius: 12px;
        padding: 0.625rem 0.875rem;
        width: 100%;
        box-sizing: border-box;
      }

      .qr-copy-text {
        flex: 1;
        font-size: 0.85rem;
        color: var(--color-ink);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .qr-clipboard-btn {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0;
        color: var(--color-ink);
        opacity: 0.6;
        display: flex;
        align-items: center;
        flex-shrink: 0;
      }
      .qr-clipboard-btn:hover { opacity: 1; }
      .qr-clipboard-btn svg { width: 18px; height: 18px; }

      .qr-info-section { display: flex; flex-direction: column; gap: 0.5rem; width: 100%; }

      .qr-info-row {
        display: flex;
        align-items: center;
        background: var(--color-surface-warm);
        border-radius: 12px;
        padding: 0.625rem 0.875rem;
      }

      .qr-info-label {
        width: max-content;
        font-size: 0.85rem;
        color: var(--color-ink);
        opacity: 0.8;
        margin-right: 0.5rem;
      }

      .qr-info-value {
        width: 100%;
        font-size: 0.85rem;
        color: var(--color-ink);
        overflow: hidden;
        text-align:center;
        text-overflow: ellipsis;
        white-space: nowrap;
        margin-right: auto;
      }

      .qr-actions { display: flex; flex-direction: column; gap: 0.75rem; width: 100%; }

      /* Navbar */
      nav {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        z-index: 1000;
        background: var(--color-bg);
        border-bottom: 1px solid var(--color-surface-offset);
        display: flex;
        justify-content: center;
        padding: 0 1rem;
      }

      .nav-inner {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 0;
      }

      nav a {
      display:flex;
      }
      nav img {
        height: 40px;
      }

      .nav-download-btn {
        background: var(--color-brand);
        color: white;
        padding: 0.6rem 1.2rem;
        border-radius: 50px;
        font-weight: 500;
        font-size: 0.9rem;
        text-decoration: none;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(3, 117, 246, 0.3);
      }

      .nav-download-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(3, 117, 246, 0.4);
      }

      /* Download Modal */
      .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        opacity: 0;
        transition: opacity 0.4s ease;
        pointer-events: none;
        z-index: 9998;
      }

      .modal-backdrop.active {
        opacity: 1;
        pointer-events: all;
      }

      .modal-container {
        position: fixed;
        bottom: -200%;
        left: 0;
        right: 0;
        z-index: 9999;
        transition: bottom 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .modal-container.active {
        bottom: 0;
      }

      .download-modal {
        background: white;
        border-radius: 30px 30px 0 0;
        padding: 2.5rem 2rem 2rem;
        max-width: 600px;
        margin: 0 auto;
        box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.2);
        position: relative;
      }

      .modal-close {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: var(--color-surface-offset);
        border: none;
        width: 35px;
        height: 35px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
      }

      .modal-close:hover {
        background: var(--color-ink);
      }

      .modal-close svg {
        width: 20px;
        height: 20px;
        color: var(--color-ink);
      }

      .modal-close:hover svg {
        color: white;
      }

      .modal-header {
        text-align: center;
        margin-bottom: 2rem;
      }

      .modal-header h2 {
        font-size: 1.8rem;
        margin-bottom: 0.5rem;
        color: var(--color-ink);
      }

      .modal-header p {
        color: var(--color-ink);
        opacity: 0.7;
      }

      .modal-tabs {
        display: flex;
        background: var(--color-surface-offset);
        border-radius: 50px;
        padding: 0.3rem;
        margin-bottom: 2rem;
        gap: 0.3rem;
      }

      .modal-tab {
        flex: 1;
        padding: 0.7rem 1.5rem;
        border: none;
        background: transparent;
        border-radius: 50px;
        cursor: pointer;
        font-weight: 500;
        font-size: 0.95rem;
        color: var(--color-ink);
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
      }

      .modal-tab svg {
        width: 18px;
        height: 18px;
      }

      .modal-tab.active {
        background: white;
        color: var(--color-brand);
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      }

      .modal-content {
        text-align: center;
      }

      .download-modal .qr-wrapper {
        background: white;
        padding: 1.5rem;
        border-radius: 20px;
        display: inline-block;
        border: 2px solid var(--color-surface-offset);
        margin-bottom: 1.5rem;
      }

      .download-modal #qr-code {
        display: block;
      }

      .modal-instructions {
        font-size: 0.95rem;
        color: var(--color-ink);
        opacity: 0.8;
        margin-bottom: 1.5rem;
      }

      .store-badges {
        display: flex;
        gap: 1rem;
        justify-content: center;
        flex-wrap: wrap;
      }

      .store-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.7rem;
        padding: 0.8rem 1.5rem;
        background: var(--color-ink);
        color: white;
        text-decoration: none;
        border-radius: 12px;
        font-weight: 500;
        transition: all 0.3s ease;
      }

      .store-badge svg {
        width: 24px;
        height: 24px;
      }

      .store-badge:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
      }

      .action-button {
        width: 100%;
        padding: 1rem;
        border: none;
        border-radius: 12px;
        font-size: 1rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
        font-family: var(--description_font);
      }

      .action-button.secondary {
        background: transparent;
        color: var(--lm-text);
        border: 1px solid var(--lm-backgroundOffset);
      }
      
      .action-button.secondary.last {
       margin-top: 1rem
      }

      .action-button.secondary:hover {
        background: var(--lm-background);
      }

      @media screen and (max-width: 500px) {
        .pool-card {
          padding: 2rem 1.5rem;
        }

        .pool-title {
          font-size: 1.5rem;
        }

        .progress-amount {
          font-size: 1.5rem;
        }

        .amount-option {
          padding: 0.75rem;
          font-size: 1rem;
        }

        .download-modal {
          padding: 2.5rem 1.5rem 2rem;
        }

        .modal-header h2 {
          font-size: 1.5rem;
        }
      }
    </style>

    <script>
      const IOS_STORE_URL = 'https://apps.apple.com/us/app/blitz-wallet/id6476810582';
      const ANDROID_STORE_URL = 'https://play.google.com/store/apps/details?id=com.blitzwallet';
      const POOL_DATA = ${inlinedData};
      const poolId = ${inlinedPoolId};

      // Payment detection config. Status checks go straight to Spark's free
      // read-only API; the Blitz backend is only called to confirm + record.
      const SPARK_SDK_URL = 'https://esm.sh/@buildonspark/spark-sdk@0.8.6?bundle';
      const BOLT11_DECODER_URL = 'https://esm.sh/light-bolt11-decoder@3.2.0';
      // Optional: the pool receiving wallet's spark address (sp1...). When set,
      // enables transfer-based detection for invoices without a sparkInvoice.
      let poolWalletSparkAddress = POOL_DATA?.sparkAddress || null;
      const SPARK_POLL_MS = 5000;
      const BACKEND_SAFETY_POLL_MS = 60000;
      const DEFAULT_INVOICE_EXPIRY_SECONDS = 3600;

      let pageHidden = false;
      let poolData = null;
      let selectedAmountSats = 0;
      let currentStep = 'info';
      let paymentActive = false;
      let invoiceError = '';

      // Denomination state
      let btcPrice = null;
      let poolCurrency = 'USD';
      let displayDenomination = 'USD';
      const PRESET_AMOUNTS_SATS = [1000, 5000, 10000, 25000, 50000];
      const PRESET_AMOUNTS_FIAT = [1, 5, 10, 25, 50];
      const PRESET_AMOUNTS_USD = [1, 5, 10, 25, 50];
      const MIN_STABLECOIN_USD = 1;

      // ── Stablecoin (FlashNet) payment ──────────────────────────────────
      // 'bitcoin' (Lightning) or 'stablecoin' (USDC/USDT → BTC swap).
      let paymentMode = 'bitcoin';
      let selectedUsdAmount = 0;

      const FLASHNET_STATUS_URL = 'https://orchestration.flashnet.xyz/v1/orchestration/status';
      const FLASHNET_PUBLIC_KEY = 'fnp_bAo-P5knxK04W3ZjPOu0vRkXQ_hlaBkrmYiW7E_ZuYQ';
      const STABLE_POLL_MS = 6000;
      const MAX_STABLE_POLLS = 100; // ~10 min
      const FLASHNET_DONE_STATUSES = new Set(['completed']);
      const FLASHNET_FAILED_STATUSES = new Set(['failed', 'expired', 'refunded', 'unfulfilled']);

      const NETWORK_MAP = {
        ethereum: { chainId: 1,     usdc: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', usdt: '0xdac17f958d2ee523a2206206994597c13d831ec7', decimals: 6 },
        polygon:  { chainId: 137,   usdc: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359', usdt: null, decimals: 6 },
        arbitrum: { chainId: 42161, usdc: '0xaf88d065e77c8cc2239327c5edb3a432268e5831', usdt: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9', decimals: 6 },
        optimism: { chainId: 10,    usdc: '0x0b2c639c533813f4aa9d7837caf62653d097ff85', usdt: '0x94b008aa00579c1307b0ef2c499ad98a8ce58e58', decimals: 6 },
        base:     { chainId: 8453,  usdc: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', usdt: null, decimals: 6 },
        bsc:      { chainId: 56,    usdc: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', usdt: '0x55d398326f99059fF775485246999027B3197955', decimals: 18 },
        solana:   { chainId: null,  usdc: null, usdt: null },
        tron:     { chainId: null,  usdc: null, usdt: null },
      };

      const NETWORK_LABELS = {
        ethereum: 'Ethereum', polygon: 'Polygon', arbitrum: 'Arbitrum',
        optimism: 'Optimism', base: 'Base', bsc: 'BNB', solana: 'Solana', tron: 'Tron',
      };

      const CURRENCY_NETWORKS = {
        USDC: ['ethereum', 'arbitrum', 'optimism', 'polygon', 'base', 'bsc', 'solana'],
        USDT: ['ethereum', 'arbitrum', 'optimism', 'bsc', 'tron'],
      };

      let selectedNetwork = null;
      let selectedCurrency = 'USDC';
      let depositAddress = null;
      let amountInRaw = null;
      let currentChainId = null;
      let currentTokenAddress = null;
      let currentQuoteId = null;
      let currentAttemptId = null;
      let refundAddress = '';
      let currentOrderId = null;
      let currentReadToken = null;
      let depositDetected = false;
      let txHashSubmitted = false;

      function detectOS() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) return 'ios';
        if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) return 'ios';
        if (/android/i.test(userAgent)) return 'android';
        return 'other';
      }

      function applyPoolData(data) {
        poolData = data || null;
        btcPrice = data?.btcPrice || null;
        poolCurrency = data?.poolDenomination || 'USD';
        displayDenomination = poolCurrency;
        poolWalletSparkAddress = data?.sparkAddress || null;
        return poolData;
      }

      async function fetchPoolData() {
        if (POOL_DATA) {
          applyPoolData(POOL_DATA);
          return { data: POOL_DATA, error: null, notFound: false };
        }
        try {
          const response = await fetch('/getPoolData', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ poolId }),
            cache: 'no-store'
          });
          if (!response.ok) throw new Error('Failed to fetch pool data');
          const {data,status} = await response.json();
          if (status !== 'SUCCESS') return { data: null, error: null, notFound: true };

          applyPoolData(data);
          return { data, error: null, notFound: !data };
        } catch (error) {
          return { data: null, error: error.message, notFound: false };
        }
      }

      async function createInvoice(amount, contributorName) {
        try {
          const response = await fetch('/createPoolInvoice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ poolId, satAmount: amount, contributorName })
          });
          if (!response.ok) throw new Error('Failed to create invoice');
          const {data} = await response.json();
          return { data, error: null };
        } catch (error) {
          return { data: null, error: error.message };
        }
      }

      async function checkPayment(invoiceId) {
        try {
          const response = await fetch('/checkPoolPayment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ invoiceId })
          });
          if (!response.ok) return { paid: false, error: true };
          const data = await response.json();
          return data;
        } catch {
          return { paid: false, error: true };
        }
      }

      function formatSats(sats) {
        return sats?.toLocaleString()||0;
      }

      // Conversion functions
      function satsToFiat(sats) {
        if (typeof sats !== 'number' || !btcPrice || btcPrice <= 0) return null;
        return sats * (btcPrice / 100000000);
      }

      function fiatToSats(fiatAmount) {
        if (typeof fiatAmount !== 'number' || !btcPrice || btcPrice <= 0) return null;
        return Math.round(100000000 / btcPrice * fiatAmount);
      }

      function formatAmount(sats, denomination) {
        if (denomination === 'SAT') {
          return formatSats(sats) + ' SAT';
        }

        const fiatAmount = satsToFiat(sats);
        if (fiatAmount === null) {
          return formatSats(sats) + ' SAT'; // Fallback
        }

        return formatCurrency({ amount: fiatAmount.toFixed(2), code: denomination })[0];
      }

      function toggleDenomination() {
        // Switch between poolCurrency and SAT
        displayDenomination = (displayDenomination === 'SAT') ? poolCurrency : 'SAT';

        // Clear selection state
        selectedAmountSats = 0;

        // Refresh the display
        if (poolData) {
          renderPoolInfo(poolData);
        }
      }

      function getProgressPercent(current, goal) {
        if (goal === 0) return 0;
        return Math.min((current / goal) * 100, 100);
      }


      // Input steps per payment path. Loader / QR / success screens are absent
      // on purpose, so the stepper hides on them.
      const STEP_FLOW = {
        bitcoin:    ['amount', 'name'],
        cashapp:    ['amount', 'name'],
        stablecoin: ['amount', 'name', 'stableNetwork', 'stableRefund'],
      };

      function renderStepper(stepName) {
        const el = document.getElementById('pool-stepper');
        if (!el) return;
        const flow = STEP_FLOW[paymentMode] || STEP_FLOW.bitcoin;
        const idx = flow.indexOf(stepName);
        if (idx === -1) { el.style.display = 'none'; el.innerHTML = ''; return; }
        el.style.display = 'flex';
        el.innerHTML = flow.map((_, i) =>
          '<span class="stepper-dot' +
          (i === idx ? ' active' : i < idx ? ' done' : '') + '"></span>'
        ).join('');
      }

      function showStep(stepName) {
        currentStep = stepName;
        document.querySelectorAll('.step').forEach(el => el.classList.remove('active'));
        const step = document.getElementById('step-' + currentStep);
        if (step) step.classList.add('active');
        renderStepper(currentStep);
      }

      // Shared toast/overlay (replaces native alert()).
      function showAlert(message) {
        const el = document.getElementById('alert-message');
        if (el) el.textContent = message;
        document.getElementById('alert-overlay').classList.add('active');
      }

      function closeAlert() {
        document.getElementById('alert-overlay').classList.remove('active');
      }

      function renderPoolInfo(pool) {
        const container = document.getElementById('app');
        const loadingContainer = document.querySelector('.loading-container');

        if (loadingContainer) loadingContainer.classList.add('fade-out');

        if (!pool){
          container.innerHTML = \`
            <div class="content-container">
              <span style="margin-bottom:0px" class="status-badge closed">This pool does not exist</span>
            </div>
          \`

          setTimeout(() => {
              const cc = container.querySelector('.content-container');
              if (cc) cc.classList.add('fade-in');
            }, 50);

          return
        }

        setTimeout(() => {
          const percent = getProgressPercent(pool?.currentAmount, pool?.goalAmount);
          const circumference = 2 * Math.PI * 75;
          const dashOffset = circumference - (percent / 100) * circumference;
          const isClosed = pool.status === 'closed';
          const closedDate = pool.closedAt ? new Date(pool.closedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';

          container.innerHTML = \`
            <div class="content-container">
              <!-- STEP: Pool Info -->
              <div id="step-info" class="step active">
                <div class="pool-info-header">
                 \${btcPrice && btcPrice > 0 ? \`
                    <button type="button" class="currency-switch-btn" aria-label="Switch currency" title="Switch currency" onclick="toggleDenomination()">
                      <i data-lucide="rotate-cw" class="cs-main"></i>
                      <i class="cs-badge" data-lucide="\${displayDenomination === 'SAT' ? 'dollar-sign' : 'bitcoin'}"></i>
                    </button>
                  \` : ''}

                  <button type="button" class="pool-history-btn" aria-label="Past swaps" title="Past swaps" onclick="showPoolHistory(event)">
                    <i data-lucide="menu"></i>
                  </button>
                </div>
                <h1 class="pool-title">\${escapeHtml(pool.poolTitle)}</h1>
                <p class="pool-meta">
                  By \${escapeHtml(pool.creatorName)}
                </p>

                 \${isClosed ? '<span class="status-badge closed">Closed' + (closedDate ? ' ' + closedDate : '') + '</span>' : ''}


                <div class="progress-ring-container">
                  <svg class="progress-ring-svg" viewBox="0 0 170 170">
                    <defs>
                      <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stop-color="var(--color-brand)" />
                        <stop offset="100%" stop-color="var(--color-brand)" />
                      </linearGradient>
                    </defs>
                    <circle class="progress-ring-bg" cx="85" cy="85" r="75" />
                    <circle class="progress-ring-fill" cx="85" cy="85" r="75"
                      stroke-dasharray="\${circumference}"
                      stroke-dashoffset="\${circumference}"
                      data-target-offset="\${dashOffset}" />
                  </svg>
                  <div class="progress-ring-text">
                    <div class="progress-amount">\${formatAmount(pool.currentAmount, displayDenomination)}</div>
                    <div class="progress-goal">of \${formatAmount(pool.goalAmount, displayDenomination)} goal</div>
                  </div>
                </div>


                \${!isClosed ? \`
                  <button class="btn-primary" onclick="showStep('method')">
                    Contribute
                  </button>
                \` : ''}

                <!-- Past contributions panel (mirrors the tips swap-history panel) -->
                <div class="pool-history-dropdown" id="pool-history-overlay" onclick="event.stopPropagation()">
                  <div class="pool-history-header">
                    <span class="pool-history-title">Past swaps</span>
                    <button type="button" class="pool-history-close" aria-label="Close" onclick="hidePoolHistory(event)">
                      <i data-lucide="x"></i>
                    </button>
                  </div>
                  <div class="pool-history-list" id="pool-history-list"></div>
                </div>
              </div>

              <!-- STEP: Payment method chooser -->
              <div id="step-method" class="step flow-screen">
                <h2 class="qr-screen-title" style="margin-bottom:0.5rem;">How would you like to pay?</h2>
                <div class="payment-options">
                  <button class="payment-option-btn" onclick="startContribute('bitcoin')">
                    <span class="payment-option-icon-wrap payment-option-icon-wrap--bitcoin">
                      <img src="/src/assets/images/bitcoinIcon.png" alt="Bitcoin" />
                    </span>
                    <span class="payment-option-text">
                      <span class="payment-option-label">Bitcoin</span>
                      <span class="payment-option-sub">Via Lightning</span>
                    </span>
                  </button>
                  <button class="payment-option-btn" onclick="startContribute('stablecoin')">
                    <span class="payment-option-icon-wrap payment-option-icon-wrap--stable">
                      <img src="/src/assets/images/dollarIcon.png" alt="Stablecoins" />
                    </span>
                    <span class="payment-option-text">
                      <span class="payment-option-label">Stablecoins</span>
                      <span class="payment-option-sub">USDC or USDT</span>
                    </span>
                  </button>
                  <button class="payment-option-btn" onclick="startContribute('cashapp')">
                    <span class="payment-option-icon-wrap payment-option-icon-wrap--cashapp">
                      <img src="/src/assets/images/cashapp-logo.svg" alt="Cash App" />
                    </span>
                    <span class="payment-option-text">
                      <span class="payment-option-label">Cash App</span>
                      <span class="payment-option-sub">Pay instantly</span>
                    </span>
                  </button>
                </div>
                <button class="action-button secondary" onclick="showStep('info')">
                Back
                </button>
              </div>

              <!-- STEP: Amount Selection -->
              <div id="step-amount" class="step">
                <div id="amountStepBody"></div>
                 <button class="action-button secondary last" onclick="showStep('method')">
                Back
                </button>
              </div>

              <!-- STEP: Name Input -->
              <div id="step-name" class="step">
                <h2 style="font-size:1.25rem;font-weight:500;margin-bottom:0.5rem;">Add your name</h2>
                <p style="font-size:0.9rem;color:#888;margin-bottom:0.25rem;">Optional. This will be visible to the pool creator.</p>

                <div class="name-input-section">
                  <input type="text" class="name-input" id="contributorNameInput"
                    placeholder="Your name (optional)" maxlength="50">
                </div>

                <div id="invoiceErrorContainer"></div>

                <!-- Bitcoin action -->
                <div id="nameButtonsBitcoin" style="display:none;">
                  <button class="btn-primary" onclick="generateInvoice()" id="generateInvoiceBtn">
                    Generate Invoice
                  </button>
                </div>

                <!-- Cash App action -->
                <div id="nameButtonsCashapp" style="display:none;">
                  <button class="btn-primary" onclick="generateCashAppInvoice()" id="generateCashAppInvoiceBtn">
                    <span class="btn-content">
                      <img src="/src/assets/images/cashapp-logo.svg" alt="" aria-hidden="true" />
                      <span>Pay with Cash App</span>
                    </span>
                  </button>
                </div>

                <!-- Stablecoin action -->
                <div id="nameButtonsStablecoin" style="display:none;">
                  <button class="btn-primary" onclick="goToStableNetwork()" id="continueToStableBtn">
                    Continue
                  </button>
                </div>

                <button class="action-button secondary last" onclick="showStep('amount')">
                 Back
                </button>
              </div>

              <!-- STEP: Creating invoice loader (Bitcoin / Cash App) -->
              <div id="step-creatingInvoice" class="step flow-screen">
                <div class="creating-content">
                  <div class="creating-spinner"></div>
                  <p class="creating-status" id="creatingInvoiceStatus">Creating invoice…</p>
                  <p class="creating-error" id="creatingInvoiceError" style="display:none;"></p>
                  <button class="btn-secondary" id="creatingInvoiceBackBtn" style="display:none;" onclick="showStep('name')">
                    Go back
                  </button>
                </div>
              </div>

              <!-- STEP: Stablecoin network/currency selection -->
              <div id="step-stableNetwork" class="step">
                <h2 style="font-size:1.25rem;font-weight:500;margin-bottom:0.25rem;">Pay with stablecoin</h2>
                <p style="font-size:0.9rem;color:#888;margin-bottom:1rem;">Choose a token and the chain you'll send from.</p>

                <p class="section-label">Token</p>
                <div class="currency-toggle">
                  <button id="btn-usdc" class="active" onclick="selectCurrency('USDC')">USDC</button>
                  <button id="btn-usdt" onclick="selectCurrency('USDT')">USDT</button>
                </div>

                <p class="section-label">Network</p>
                <div class="network-cards" id="network-grid"></div>

                <div id="stableQuoteErrorContainer"></div>

                <button class="btn-primary" id="generateStableBtn" onclick="goToRefundStep()">
                  Continue
                </button>
                <button class="action-button secondary last" onclick="showStep('name')">
                  Back
                </button>
              </div>

              <!-- STEP: Stablecoin refund address (optional) -->
              <div id="step-stableRefund" class="step">
                <h2 style="font-size:1.25rem;font-weight:500;margin-bottom:0.25rem;">Refund address</h2>
                <p style="font-size:0.9rem;color:#888;margin-bottom:1rem;">
                  Optional. Where should we send your funds if the swap fails? Leave blank to skip.
                </p>
                <input id="refundAddressInput" class="name-input" type="text"
                  autocomplete="off" spellcheck="false"
                  placeholder="Enter refund address" />
                <div id="refundErrorContainer"></div>
                <div id="refundSkipWarning" class="expired-notice" style="display:none;">
                  No refund address set — if the swap fails, funds cannot be returned automatically.
                </div>
                <button class="btn-primary" id="refundContinueBtn" onclick="submitRefundAndQuote()">
                  Generate invoice
                </button>
                <button class="action-button secondary last" onclick="showStep('stableNetwork')">
                  Back
                </button>
              </div>

              <!-- STEP: Creating swap loader (stablecoin) -->
              <div id="step-creatingSwap" class="step flow-screen">
                <div class="creating-content">
                  <div class="creating-spinner"></div>
                  <p class="creating-status" id="creatingSwapStatus">Creating swap…</p>
                  <p class="creating-error" id="creatingSwapError" style="display:none;"></p>
                  <button class="btn-secondary" id="creatingSwapBackBtn" style="display:none;" onclick="showStep('stableRefund')">
                    Go back
                  </button>
                </div>
              </div>

              <!-- STEP: Stablecoin deposit / scan to pay -->
              <div id="step-stablePayment" class="step flow-screen">
                <p class="qr-screen-title" id="stableNetworkLabel"></p>
                <p class="qr-amount" id="stableAmountLabel"></p>

                <div class="qr-wrapper clickable" onclick="copyDepositAddress()">
                  <div id="qrStableContainer"></div>
                  <span class="qr-tap-hint"><i data-lucide="copy"></i> Tap to copy</span>
                </div>

                <div class="qr-copy-row">
                  <span class="qr-copy-text" id="stableAddressText"></span>
                  <button class="qr-clipboard-btn" id="copyDepositBtn" onclick="copyDepositAddress()" aria-label="Copy address">
                    <i data-lucide="copy"></i>
                  </button>
                </div>

                <div class="waiting-text" id="stableWaitingText">
                  <span class="waiting-dot"></span>
                  <span class="waiting-dot"></span>
                  <span class="waiting-dot"></span>
                  <span id="stableWaitingLabel" style="margin-left:0.25rem;">Waiting for payment</span>
                </div>

                <div id="stableManualTx" style="display:none;width:100%;">
                  <p style="font-size:0.85rem;color:#888;margin-bottom:0.5rem;">
                    After sending, paste your transaction hash to confirm:
                  </p>
                  <input style="margin-bottom:1rem;" id="stableTxHashInput" class="name-input" type="text"
                    autocomplete="off" spellcheck="false" placeholder="Transaction hash" />
                  <div id="stableTxHashError"></div>
                  <button class="btn-primary" id="stableTxHashSubmitBtn" onclick="submitTronDeposit()">
                    Confirm payment
                  </button>
                </div>

                <div id="stableSubmitError" class="expired-notice" style="display:none;"></div>

                <div class="expired-notice" id="stableExpiredNotice" style="display:none;">
                  This quote has expired. Generate a new one to contribute.
                </div>

                <div class="qr-actions">
                  <button class="btn-primary" id="stablePrimaryBtn" style="display:none;" onclick="openWallet()">
                    Open in Wallet
                  </button>
                  <button class="btn-primary" id="regenerateStableBtn" style="display:none;" onclick="regenerateStableQuote()">
                    Generate New Invoice
                  </button>
                </div>
                <button class="action-button secondary" onclick="cancelStablePayment()">
                  Cancel
                </button>
              </div>

              <!-- STEP: QR / Payment -->
              <div id="step-payment" class="step flow-screen">
                <p class="qr-screen-title">Send Bitcoin via Lightning</p>
                <p class="qr-amount" id="paymentAmountDisplay"></p>

                <div class="qr-wrapper clickable" onclick="copyInvoice()">
                  <div id="qrCodeContainer"></div>
                  <span class="qr-tap-hint"><i data-lucide="copy"></i> Tap to copy</span>
                </div>

                <div class="waiting-text">
                  <span class="waiting-dot"></span>
                  <span class="waiting-dot"></span>
                  <span class="waiting-dot"></span>
                  <span style="margin-left:0.25rem;">Waiting for payment</span>
                </div>

                <div class="expired-notice" id="invoiceExpiredNotice" style="display:none;">
                  This invoice has expired. Generate a new one to contribute.
                </div>

                <div class="qr-actions">
                  <button class="btn-primary" onclick="copyInvoice()" id="copyInvoiceBtn">
                    Copy Invoice
                  </button>
                  <button class="btn-primary" id="regenerateInvoiceBtn" style="display:none;" onclick="regenerateInvoice()">
                    Generate New Invoice
                  </button>
                </div>
                <button class="action-button secondary" onclick="cancelPayment()">
                  Cancel
                </button>
              </div>

              <!-- STEP: Success -->
              <div id="step-success" class="step">
                <div class="success-icon">
                  <i data-lucide="check"></i>
                </div>
                <h2 class="success-title">Payment Received!</h2>
                <p class="success-subtitle">Your contribution has been recorded.</p>
                <button class="btn-primary" onclick="returnToPool()">
                  Back to Pool
                </button>
              </div>

              <!-- Step progress dots (shared across input steps) -->
              <div class="pool-stepper" id="pool-stepper"></div>
            </div>
          \`;

          lucide.createIcons();

          // Animate progress ring
          requestAnimationFrame(() => {
            const fillCircle = document.querySelector('.progress-ring-fill');
            if (fillCircle) {
              const target = fillCircle.getAttribute('data-target-offset');
              fillCircle.style.strokeDashoffset = target;
            }
          });

          setTimeout(() => {
            const cc = container.querySelector('.content-container');
            if (cc) cc.classList.add('fade-in');
          }, 50);
        }, 300);
      }

      function selectPreset(sats, el) {
        // Extract sats from data attribute (in case button was re-rendered)
        const satAmount = parseInt(el.getAttribute('data-sats')) || sats;
        selectedAmountSats = satAmount;
        document.querySelectorAll('.amount-option').forEach(b => b.classList.remove('selected'));
        el.classList.add('selected');

        // Clear custom input
        const customInput = document.getElementById('customAmountInput');
        if (customInput) customInput.value = '';
        document.getElementById('customAmountWrapper').classList.remove('visible');

        document.getElementById('continueToNameBtn').disabled = false;
      }

      function toggleCustomAmount() {
        const wrapper = document.getElementById('customAmountWrapper');
        const isVisible = wrapper.classList.contains('visible');
        if (isVisible) {
          wrapper.classList.remove('visible');
        } else {
          wrapper.classList.add('visible');
          document.getElementById('customAmountInput').focus();
          // Deselect presets
          document.querySelectorAll('.amount-option').forEach(b => b.classList.remove('selected'));
          document.querySelector('.custom-btn').classList.add('selected');
        }
      }

      function onCustomAmountInput(value) {
        let sats;

        if (displayDenomination === 'SAT') {
          // Parse directly as sats
          sats = parseInt(value, 10);
        } else {
          // Convert fiat to sats
          const fiatAmount = parseFloat(value);
          if (!fiatAmount || fiatAmount <= 0) {
            selectedAmountSats = 0;
            document.getElementById('continueToNameBtn').disabled = true;
            return;
          }
          sats = fiatToSats(fiatAmount);
        }

        if (sats && sats > 0) {
          selectedAmountSats = sats;
          document.getElementById('continueToNameBtn').disabled = false;
        } else {
          selectedAmountSats = 0;
          document.getElementById('continueToNameBtn').disabled = true;
        }
      }

      // ── Payment-mode entry + amount step rendering ────────────────────
      function startContribute(mode) {
        paymentMode = mode;
        selectedAmountSats = 0;
        selectedUsdAmount = 0;
        renderAmountStep();
        const btcBtns = document.getElementById('nameButtonsBitcoin');
        const cashBtns = document.getElementById('nameButtonsCashapp');
        const stableBtns = document.getElementById('nameButtonsStablecoin');
        if (btcBtns) btcBtns.style.display = (mode === 'bitcoin') ? 'block' : 'none';
        if (cashBtns) cashBtns.style.display = (mode === 'cashapp') ? 'block' : 'none';
        if (stableBtns) stableBtns.style.display = (mode === 'stablecoin') ? 'block' : 'none';
        showStep('amount');
        lucide.createIcons();
      }

      function renderAmountStep() {
        const body = document.getElementById('amountStepBody');
        if (!body) return;
        let grid = '';
        let inputAttrs = '';
        let desc = '';
        if (paymentMode === 'stablecoin') {
          desc = 'Select a preset or enter a custom amount in USD.';
          grid = PRESET_AMOUNTS_USD.map(function (usd) {
            return '<button class="amount-option" onclick="selectPresetUsd(' + usd + ', this)" data-usd="' + usd + '">$' + usd + '</button>';
          }).join('');
          inputAttrs = 'placeholder="Enter USD amount" min="1" step="0.01" oninput="onCustomUsdInput(this.value)"';
        } else {
          desc = 'Select a preset or enter a custom amount' + (displayDenomination === 'SAT' ? ' in sats' : '') + '.';
          if (displayDenomination === 'SAT') {
            grid = PRESET_AMOUNTS_SATS.map(function (sats) {
              return '<button class="amount-option" onclick="selectPreset(' + sats + ', this)" data-sats="' + sats + '">' + sats.toLocaleString() + ' SAT</button>';
            }).join('');
          } else {
            grid = PRESET_AMOUNTS_FIAT.map(function (fiat) {
              const sats = fiatToSats(fiat);
              const formatted = formatCurrency({ amount: fiat, code: displayDenomination })[0];
              return '<button class="amount-option" onclick="selectPreset(' + sats + ', this)" data-sats="' + sats + '">' + formatted + '</button>';
            }).join('');
          }
          inputAttrs = 'placeholder="' + (displayDenomination === 'SAT' ? 'Enter sats' : 'Enter ' + displayDenomination + ' amount') + '" min="1" oninput="onCustomAmountInput(this.value)"';
        }

        body.innerHTML =
          '<h2 style="font-size:1.25rem;font-weight:500;margin-bottom:0.5rem;">Choose an amount</h2>' +
          '<p style="font-size:0.9rem;color:#888;margin-bottom:1rem;">' + desc + '</p>' +
          '<div class="amount-grid">' + grid +
          '<button class="amount-option custom-btn" onclick="toggleCustomAmount()">...</button></div>' +
          '<div class="custom-amount-wrapper" id="customAmountWrapper">' +
          '<input type="number" class="custom-amount-input" id="customAmountInput" ' + inputAttrs + '></div>' +
          '<button class="btn-primary" id="continueToNameBtn" disabled onclick="showStep(\\'name\\')">Continue</button>';
      }

      function selectPresetUsd(usd, el) {
        selectedUsdAmount = parseFloat(el.getAttribute('data-usd')) || usd;
        document.querySelectorAll('.amount-option').forEach(function (b) { b.classList.remove('selected'); });
        el.classList.add('selected');
        const customInput = document.getElementById('customAmountInput');
        if (customInput) customInput.value = '';
        document.getElementById('customAmountWrapper').classList.remove('visible');
        document.getElementById('continueToNameBtn').disabled = false;
      }

      function onCustomUsdInput(value) {
        const usd = parseFloat(value);
        if (usd && usd >= 1) {
          selectedUsdAmount = usd;
          document.getElementById('continueToNameBtn').disabled = false;
        } else {
          selectedUsdAmount = 0;
          document.getElementById('continueToNameBtn').disabled = true;
        }
      }

      // ── Stablecoin network / currency selection ───────────────────────
      function goToStableNetwork() {
        if (selectedUsdAmount < MIN_STABLECOIN_USD) {
          showAlert('Minimum stablecoin amount is $' + MIN_STABLECOIN_USD);
          return;
        }
        selectCurrency('USDC');
        showStep('stableNetwork');
        lucide.createIcons();
      }

      function updateCurrencyGrid() {
        const grid = document.getElementById('network-grid');
        if (!grid) return;
        const networks = CURRENCY_NETWORKS[selectedCurrency] || [];
        grid.innerHTML = networks.map(function (n) {
          return '<div class="network-card" id="card-' + n + '" onclick="selectNetwork(\\'' + n + '\\')">' + NETWORK_LABELS[n] + '</div>';
        }).join('');
      }

      function selectNetwork(network) {
        // A different network invalidates any previously entered refund address
        // (e.g. an EVM 0x… address must not carry over to Tron/Solana).
        if (network !== selectedNetwork) {
          refundAddress = '';
          const ri = document.getElementById('refundAddressInput');
          if (ri) ri.value = '';
        }
        selectedNetwork = network;
        document.querySelectorAll('.network-card').forEach(function (c) { c.classList.remove('selected'); });
        const card = document.getElementById('card-' + network);
        if (card) card.classList.add('selected');
      }

      function selectCurrency(currency) {
        selectedCurrency = currency;
        selectedNetwork = null;
        const usdcBtn = document.getElementById('btn-usdc');
        const usdtBtn = document.getElementById('btn-usdt');
        if (usdcBtn) usdcBtn.classList.toggle('active', currency === 'USDC');
        if (usdtBtn) usdtBtn.classList.toggle('active', currency === 'USDT');
        updateCurrencyGrid();
      }

      // ── Stablecoin quote creation + deposit screen ────────────────────
      async function createStablecoinQuote(params) {
        try {
          const response = await fetch('/createPoolInvoice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              poolId,
              usdAmount: params.usdAmount,
              contributorName: params.contributorName,
              network: params.network,
              currency: params.currency,
              refundAddress: params.refundAddress || undefined,
            }),
          });
          const json = await response.json().catch(function () { return null; });
          if (!response.ok || !json || json.status !== 'SUCCESS' || !json.data) {
            return { data: null, error: (json && json.message) || 'Failed to generate invoice. Please try again.' };
          }
          return { data: json.data, error: null };
        } catch (error) {
          return { data: null, error: error.message };
        }
      }

      function formatTokenAmount(raw, decimals) {
        if (!raw) return '';
        if (!decimals) return String(raw);
        return (Number(raw) / Math.pow(10, decimals)).toFixed(2);
      }

      function goToRefundStep() {
        if (!selectedNetwork) { showStableQuoteError('Please select a network.'); return; }
        const errEl = document.getElementById('refundErrorContainer');
        if (errEl) errEl.innerHTML = '';
        const warn = document.getElementById('refundSkipWarning');
        if (warn) warn.style.display = 'none';
        showStep('stableRefund');
        lucide.createIcons();
      }

      // EVM networks (chainId present) require a 0x + 40 hex address.
      // Non-EVM (Solana, Tron) only get a non-empty check.
      function validateRefundAddress(value) {
        const meta = NETWORK_MAP[selectedNetwork] || {};
        const v = (value || '').trim();
        if (!v) return { ok: true, value: '' };
        if (meta.chainId) {
          if (!/^0x[0-9a-fA-F]{40}$/.test(v)) {
            return { ok: false, error: 'Enter a valid address for ' + (NETWORK_LABELS[selectedNetwork] || selectedNetwork) + ' (0x + 40 hex characters).' };
          }
        } else if (v.length < 10) {
          return { ok: false, error: 'Enter a valid refund address.' };
        }
        return { ok: true, value: v };
      }

      function submitRefundAndQuote() {
        const input = document.getElementById('refundAddressInput');
        const errEl = document.getElementById('refundErrorContainer');
        const result = validateRefundAddress(input ? input.value : '');
        if (!result.ok) {
          if (errEl) errEl.innerHTML = '<p class="error-text">' + escapeHtml(result.error) + '</p>';
          return;
        }
        if (errEl) errEl.innerHTML = '';
        refundAddress = result.value;
        generatePoolStablecoinQuote();
      }


      // Loader helpers for the dedicated "creating swap" screen.
      function resetCreatingSwapUI() {
        const status = document.getElementById('creatingSwapStatus');
        const err = document.getElementById('creatingSwapError');
        const back = document.getElementById('creatingSwapBackBtn');
        if (status) { status.style.display = ''; status.textContent = 'Creating swap…'; }
        if (err) { err.style.display = 'none'; err.textContent = ''; }
        if (back) back.style.display = 'none';
      }

      function showCreatingSwapError(msg) {
        const status = document.getElementById('creatingSwapStatus');
        const err = document.getElementById('creatingSwapError');
        const back = document.getElementById('creatingSwapBackBtn');
        if (status) status.style.display = 'none';
        if (err) { err.style.display = 'block'; err.textContent = msg; }
        if (back) back.style.display = 'block';
      }

      // ── Past contributions (localStorage; mirrors the tips swap history) ──
      const POOL_HISTORY_KEY = 'blitz_pool_swap_history';

      function getPoolHistory() {
        const raw = localStorage.getItem(POOL_HISTORY_KEY);
        if (!raw) return [];
        try { return JSON.parse(raw); } catch (e) { return []; }
      }

      function savePoolContribution(entry) {
        const history = getPoolHistory();
        history.unshift(entry);
        localStorage.setItem(POOL_HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
      }

      function showPoolHistory(e) {
        if (e) e.stopPropagation();
        renderPoolHistory();
        const overlay = document.getElementById('pool-history-overlay');
        if (overlay) overlay.classList.add('active');
      }

      function hidePoolHistory(e) {
        if (e) e.stopPropagation();
        const overlay = document.getElementById('pool-history-overlay');
        if (overlay) overlay.classList.remove('active');
      }

      function renderPoolHistory() {
        const listEl = document.getElementById('pool-history-list');
        if (!listEl) return;
        const history = getPoolHistory();
        const filteredHistory = history.filter(p => p.poolId === poolId) 
        if (!filteredHistory.length) {
          listEl.innerHTML = '<p style="opacity:0.5;font-size:0.85rem;">No swaps yet.</p>';
          return;
        }
        listEl.innerHTML = filteredHistory.map(function (entry) {
          const time = new Date(entry.timestamp).toLocaleString();
          const chain = (entry.network || '').toLowerCase();
          const currency = (entry.currency || '').toLowerCase();
          const iconName = chain === 'bsc' ? 'bnb' : chain;
          const chainImage = chain === 'polygon'
            ? '/src/assets/images/chain-' + iconName + '.png'
            : '/src/assets/images/chain-' + iconName + '.svg';
          const tokenImage = currency === 'usdc'
            ? '/src/assets/images/usdc.svg'
            : '/src/assets/images/usdt.svg';
          const amountLabel = (entry.usdAmount != null && entry.usdAmount !== '' ? '$' + entry.usdAmount : '')
            + (entry.currency ? ' · ' + entry.currency : '')
            + (entry.network ? ' on ' + entry.network : '');
          return \`
            <div class="pool-history-item">
              <div class="swap-quote">
                <div class="chain-icon-wrapper">
                  <img src="\${chainImage}" class="chain-icon" />
                  <img src="\${tokenImage}" class="token-overlay" />
                </div>
                <div class="quote-middle">
                  <div class="quote-id">\${entry.quoteId || ''}</div>
                  <div class="quote-time">\${time}</div>
                </div>
                <button class="copy-btn" data-qid="\${entry.quoteId || ''}">Copy</button>
              </div>
            </div>
          \`;
        }).join('');

        listEl.querySelectorAll('.copy-btn').forEach(function (btn) {
          btn.addEventListener('click', async function () {
            let ok = true;
            try { await navigator.clipboard.writeText(btn.dataset.qid); } catch (err) { ok = false; }
            clearTimeout(btn._copyTimer);
            btn.classList.toggle('copied', ok);
            btn.textContent = ok ? 'Copied!' : 'Failed';
            btn._copyTimer = setTimeout(function () {
              btn.classList.remove('copied');
              btn.textContent = 'Copy';
            }, 1500);
          });
        });
      }

      // Outside-click dismiss (attached once). Safe when the panel is absent.
      document.addEventListener('click', function () {
        const overlay = document.getElementById('pool-history-overlay');
        if (overlay) overlay.classList.remove('active');
      });

      async function generatePoolStablecoinQuote() {
        if (!selectedNetwork) { showStableQuoteError('Please select a network.'); return; }
        const name = document.getElementById('contributorNameInput')?.value?.trim() || '';

        showStep('creatingSwap');
        lucide.createIcons();
        resetCreatingSwapUI();

        const { data, error } = await createStablecoinQuote({
          usdAmount: selectedUsdAmount,
          contributorName: name,
          network: selectedNetwork,
          currency: selectedCurrency,
          refundAddress: refundAddress,
        });

        if (!data) { showCreatingSwapError(error || 'Failed to generate invoice. Please try again.'); return; }

        depositAddress = data.depositAddress;
        amountInRaw = BigInt(String(data.amountIn));
        currentQuoteId = data.quoteId;
        currentAttemptId = data.attemptId || null;

        // Persist this contribution locally (mirrors the tips page — saved at
        // quote-creation time). Powers the "Past contributions" panel on the
        // pool homepage.
        savePoolContribution({
          poolId: poolId,
          poolTitle: (poolData && poolData.poolTitle) || '',
          quoteId: currentQuoteId,
          network: selectedNetwork,
          currency: selectedCurrency,
          usdAmount: selectedUsdAmount,
          timestamp: Date.now(),
        });

        const meta = NETWORK_MAP[selectedNetwork] || {};
        currentChainId = meta.chainId || null;
        currentTokenAddress = currentChainId ? (meta[selectedCurrency.toLowerCase()] || null) : null;

        // Reset FlashNet order/submit state for this attempt.
        txHashSubmitted = false;
        depositDetected = false;
        currentOrderId = null;
        currentReadToken = null;

        renderStablePayment();
        showStep('stablePayment');
        lucide.createIcons();

        // Tron is the only chain FlashNet doesn't auto-detect — wait for the
        // manual proof-of-payment submit. Every other chain polls immediately
        // (phase 1 by quoteId detects the deposit + captures the orderId).
        if (selectedNetwork !== 'tron') {
          startStablePolling();
        }
      }

      // Single source of truth for the lone loading message on the deposit
      // screen. Pass null to hide the loading line entirely.
      function setStableStatus(message) {
        const waiting = document.getElementById('stableWaitingText');
        const label = document.getElementById('stableWaitingLabel');
        if (label && message != null) label.textContent = message;
        if (waiting) waiting.style.display = (message == null) ? 'none' : 'flex';
      }

      // Friendly copy for the FlashNet order lifecycle (mirrors paylink/tips).
      function statusLabel(status) {
        switch (status) {
          case 'processing':
          case 'confirming':
            return 'Confirming your payment…';
          case 'bridging':
          case 'swapping':
          case 'awaiting_approval':
            return 'Swapping to Bitcoin…';
          case 'delivering':
            return 'Delivering the contribution…';
          case 'refunding':
            return 'Refunding your payment…';
          default:
            return 'Processing swap…';
        }
      }

      // Once FlashNet reports the deposit, flip to the dedicated spinner screen
      // (the same one used for "Creating swap…") and drive its status text.
      function showConfirmingView(text) {
        resetCreatingSwapUI();
        const status = document.getElementById('creatingSwapStatus');
        const back = document.getElementById('creatingSwapBackBtn');
        if (status) { status.style.display = ''; status.textContent = text || 'Confirming your payment…'; }
        if (back) back.style.display = 'none';
        showStep('creatingSwap');
        lucide.createIcons();
      }

      function renderStablePayment() {
        resetStablePaymentUI();
        const meta = NETWORK_MAP[selectedNetwork] || {};
        const netLabel = document.getElementById('stableNetworkLabel');
        const amtLabel = document.getElementById('stableAmountLabel');
        const addrEl = document.getElementById('stableAddressText');
        if (netLabel) netLabel.textContent = 'Send ' + selectedCurrency + ' on ' + (NETWORK_LABELS[selectedNetwork] || selectedNetwork);
        if (amtLabel) amtLabel.textContent = formatTokenAmount(amountInRaw, meta.decimals || 6) + ' ' + selectedCurrency;
        if (addrEl) addrEl.textContent = depositAddress || '';

        const qr = document.getElementById('qrStableContainer');
        if (qr) {
          qr.innerHTML = '';
          if (depositAddress) {
            new QRCode(qr, {
              text: depositAddress,
              width: 220,
              height: 220,
              colorDark: '#000000',
              colorLight: '#ffffff',
              correctLevel: QRCode.CorrectLevel.M,
            });
          }
        }

        setStableStatus('Waiting for payment');

        // Primary action button — mobile: Open in Wallet (EIP-681 deep link);
        // desktop + EVM: Connect and Pay (window.ethereum); non-EVM desktop: hidden.
        const primaryBtn = document.getElementById('stablePrimaryBtn');
        if (primaryBtn) {
          if (isMobileDevice()) {
            primaryBtn.textContent = 'Open in Wallet';
            primaryBtn.style.display = buildEip681Uri() ? 'block' : 'none';
            primaryBtn.onclick = openWallet;
          } else {
            const hasEVMSupport = !!(currentTokenAddress && currentChainId);
            primaryBtn.textContent = 'Connect and Pay';
            primaryBtn.style.display = hasEVMSupport ? 'block' : 'none';
            primaryBtn.onclick = connectAndPay;
          }
        }

        // Manual proof-of-payment entry is Tron-only (FlashNet can't auto-detect it).
        const manualEl = document.getElementById('stableManualTx');
        if (manualEl) manualEl.style.display = (selectedNetwork === 'tron') ? 'block' : 'none';
        const tronInput = document.getElementById('stableTxHashInput');
        if (tronInput) tronInput.value = '';
        const tronErr = document.getElementById('stableTxHashError');
        if (tronErr) tronErr.innerHTML = '';
      }

      function buildEip681Uri() {
        if (!currentTokenAddress || !depositAddress || !currentChainId || !amountInRaw) return null;
        return 'ethereum:' + currentTokenAddress + '@' + currentChainId + '/transfer?address=' + depositAddress + '&uint256=' + String(amountInRaw);
      }

      function openWallet() {
        const uri = buildEip681Uri();
        if (uri) window.location.href = uri;
      }

      // Desktop browser wallet (MetaMask, etc.): connect, switch chain, and fire
      // the ERC-20 transfer. FlashNet auto-detects the deposit; the running
      // status poll picks it up — nothing to submit here.
      async function connectAndPay() {
        if (!window.ethereum || !currentTokenAddress || !depositAddress || !currentChainId || !amountInRaw) return;
        try {
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x' + currentChainId.toString(16) }],
          });
          const addrPadded = depositAddress.replace('0x', '').toLowerCase().padStart(64, '0');
          const amtPadded = amountInRaw.toString(16).padStart(64, '0');
          const data = '0xa9059cbb' + addrPadded + amtPadded;
          await window.ethereum.request({
            method: 'eth_sendTransaction',
            params: [{ from: accounts[0], to: currentTokenAddress, data: data }],
          });
        } catch (err) {
          showAlert('Wallet error: ' + (err.message || 'Request rejected.'));
        }
      }

      function copyDepositAddress() {
        if (!depositAddress) return;
        navigator.clipboard.writeText(depositAddress);
        showAlert('Copied!');
      }

      function copyStableQuoteId() {
        if (!currentQuoteId) return;
        navigator.clipboard.writeText(currentQuoteId);
        showAlert('Copied!');
      }

      function isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      }

      function showStableQuoteError(msg) {
        const errEl = document.getElementById('stableQuoteErrorContainer');
        if (errEl) errEl.innerHTML = '<p class="error-text">' + escapeHtml(msg) + '</p>';
      }

      // ── Deposit submission — obtain the order's read token from FlashNet ──
      const FLASHNET_SUBMIT_URL = 'https://orchestration.flashnet.xyz/v1/orchestration/submit';

      function showTronError(message) {
        const errEl = document.getElementById('stableTxHashError');
        if (errEl) errEl.innerHTML = '<p class="error-text">' + escapeHtml(message) + '</p>';
      }

      // Tron only — FlashNet can't auto-detect Tron deposits, so the payer pastes
      // the tx hash and we submit it to obtain the order id + read token.
      async function submitTronDeposit() {
        const input = document.getElementById('stableTxHashInput');
        const txHash = (input ? input.value : '').trim();
        if (txHash.length < 10) {
          showTronError('Enter a valid transaction hash.');
          return;
        }
        if (txHashSubmitted) return;
        txHashSubmitted = true;

        showConfirmingView('Confirming your payment…');

        try {
          const res = await fetch(FLASHNET_SUBMIT_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + FLASHNET_PUBLIC_KEY,
              'X-Idempotency-Key': 'pool-quote:' + currentQuoteId,
            },
            body: JSON.stringify({ quoteId: currentQuoteId, txHash: txHash }),
            signal: AbortSignal.timeout(8000),
          });
          if (!res.ok) throw new Error('submit-failed');
          const json = await res.json();
          currentOrderId = json.orderId || (json.order && (json.order.orderId || json.order.id)) || null;
          currentReadToken = json.readToken || (json.order && json.order.readToken) || null;
          if (!currentOrderId) throw new Error('no-order-id');
          depositDetected = true;
          startStablePolling();
        } catch (err) {
          // Return to the (still-intact) pay screen WITHOUT re-rendering, so the
          // payer's pasted tx hash is preserved for another attempt.
          txHashSubmitted = false;
          showStep('stablePayment');
          lucide.createIcons();
          showTronError('Submission failed. Check the hash and try again.');
        }
      }

      // ── Stablecoin payment polling — direct to FlashNet, no backend ───
      let stablePollTimer = null;
      let stablePollCount = 0;
      let stablePaymentActive = false;

      function startStablePolling() {
        stopStablePolling();
        stablePaymentActive = true;
        stablePollCount = 0;
        stablePollTimer = setTimeout(pollStableStatus, STABLE_POLL_MS);
      }

      function stopStablePolling() {
        stablePaymentActive = false;
        if (stablePollTimer) { clearTimeout(stablePollTimer); stablePollTimer = null; }
      }

      // Read order status with the public client key. Phase 1 (no orderId yet):
      // query by quoteId to detect the deposit + capture the auto-created orderId.
      // Phase 2: query by orderId (with the readToken if we have one). Returns the
      // full response so the poller can read order.id and order.status.
      async function fetchFlashnetStatus() {
        const param = currentOrderId
          ? 'id=' + encodeURIComponent(currentOrderId)
          : 'quoteId=' + encodeURIComponent(currentQuoteId);
        const headers = { 'Authorization': 'Bearer ' + FLASHNET_PUBLIC_KEY };
        if (currentReadToken) headers['X-Read-Token'] = currentReadToken;
        try {
          const res = await fetch(FLASHNET_STATUS_URL + '?' + param, {
            headers: headers,
            signal: AbortSignal.timeout(8000),
          });
          if (!res.ok) return null;
          return await res.json();
        } catch (e) {
          return null;
        }
      }

      async function pollStableStatus() {
        stablePollTimer = null;
        if (!stablePaymentActive) return;
        if (!document.hidden) {
          try {
            const json = await fetchFlashnetStatus();
            if (!stablePaymentActive) return;
            const order = json && json.order;
            if (order && order.id) {
              currentOrderId = order.id;
              if (!depositDetected) {
                depositDetected = true;
                showConfirmingView(statusLabel(order.status));
              } else if (order.status) {
                const s = document.getElementById('creatingSwapStatus');
                if (s) s.textContent = statusLabel(order.status);
              }
              if (order.status && FLASHNET_DONE_STATUSES.has(order.status)) { onSwapCompleted(); return; }
              if (order.status && FLASHNET_FAILED_STATUSES.has(order.status)) { onSwapFailed(); return; }
            }
          } catch (e) { /* transient — keep polling */ }
        }
        stablePollCount++;
        if (stablePollCount >= MAX_STABLE_POLLS) {
          stopStablePolling();
          if (depositDetected) {
            onSwapFailed('The swap timed out. If you were charged, contact support with Quote ID: ' + (currentQuoteId || '') + '.');
          } else {
            showStableExpiredUI();
          }
          return;
        }
        stablePollTimer = setTimeout(pollStableStatus, STABLE_POLL_MS);
      }

      async function onSwapCompleted() {
        stopStablePolling();
        recordPoolContribution(); // fire-and-retry; records the contribution in the Blitz backend
        showContributionSuccess(fiatToSats(selectedUsdAmount) || 0);
      }

      function onSwapFailed(message) {
        stopStablePolling();
        const msg = message || ('The swap could not be completed. If you were charged, contact support with Quote ID: ' + (currentQuoteId || '') + '.');
        if (depositDetected) {
          // We're on the confirming (creatingSwap) spinner screen — surface the
          // error there with the "Go back" action to start a new quote.
          showCreatingSwapError(msg);
        } else {
          showStableExpiredUI();
        }
      }

      // Records the stablecoin contribution against this pool after a FlashNet
      // completion. Bounded retry (mirrors paylink's markPaid) so a slow backend
      // still records it; the success screen isn't blocked on it.
      // TODO(backend contract): confirm which identifier GCF /checkPoolPayment
      // expects to record a stablecoin (FlashNet) contribution — quoteId, orderId,
      // attemptId — or whether the backend records it via a FlashNet webhook. The
      // Lightning path calls /checkPoolPayment with { invoiceId }; this sends the
      // stablecoin identifiers plus checkSwap:true.
      async function recordPoolContribution() {
        for (let attempt = 0; attempt < 5; attempt++) {
          try {
            const res = await fetch('/checkPoolPayment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                poolId: poolId,
                quoteId: currentQuoteId,
                orderId: currentOrderId,
                attemptId: currentAttemptId,
                checkSwap: true,
              }),
              signal: AbortSignal.timeout(8000),
            });
            const json = await res.json().catch(function () { return null; });
            if (res.ok && json && (json.paid || json.recorded || json.status === 'SUCCESS')) return;
          } catch (e) { /* network error — retry */ }
          await new Promise(function (r) { setTimeout(r, 3000); });
        }
      }

      function showStableExpiredUI() {
        if (currentStep !== 'stablePayment') return;
        const notice = document.getElementById('stableExpiredNotice');
        const regen = document.getElementById('regenerateStableBtn');
        const waiting = document.getElementById('stableWaitingText');
        const copyBtn = document.getElementById('copyDepositBtn');
        const primaryBtn = document.getElementById('stablePrimaryBtn');
        const qr = document.getElementById('qrStableContainer');
        if (notice) notice.style.display = 'block';
        if (regen) regen.style.display = 'block';
        if (waiting) waiting.style.display = 'none';
        if (copyBtn) copyBtn.style.display = 'none';
        if (primaryBtn) primaryBtn.style.display = 'none';
        if (qr) qr.style.opacity = '0.25';
        const manualEl = document.getElementById('stableManualTx');
        if (manualEl) manualEl.style.display = 'none';
      }

      function resetStablePaymentUI() {
        const notice = document.getElementById('stableExpiredNotice');
        const regen = document.getElementById('regenerateStableBtn');
        const waiting = document.getElementById('stableWaitingText');
        const copyBtn = document.getElementById('copyDepositBtn');
        const qr = document.getElementById('qrStableContainer');
        const submitErr = document.getElementById('stableSubmitError');
        if (notice) notice.style.display = 'none';
        if (regen) regen.style.display = 'none';
        if (waiting) waiting.style.display = 'flex';
        if (copyBtn) copyBtn.style.display = '';
        if (qr) qr.style.opacity = '1';
        if (submitErr) { submitErr.style.display = 'none'; submitErr.textContent = ''; }
      }

      function regenerateStableQuote() {
        stopStablePolling();
        txHashSubmitted = false;
        depositDetected = false;
        currentOrderId = null;
        currentReadToken = null;
        resetStablePaymentUI();
        showStep('stableNetwork');
        lucide.createIcons();
      }

      function cancelStablePayment() {
        stopStablePolling();
        txHashSubmitted = false;
        depositDetected = false;
        currentOrderId = null;
        currentReadToken = null;
        showStep('stableNetwork');
        lucide.createIcons();
      }

      let currentInvoice = '';
      let currentInvoiceId = '';

      function buildCashAppLightningUrl(invoice) {
        return \`https://cash.app/launch/lightning/\${encodeURIComponent(invoice)}\`;
      }

      // Loader helpers for the dedicated "creating invoice" screen (Bitcoin / Cash App).
      function resetCreatingInvoiceUI(message) {
        const status = document.getElementById('creatingInvoiceStatus');
        const err = document.getElementById('creatingInvoiceError');
        const back = document.getElementById('creatingInvoiceBackBtn');
        if (status) { status.style.display = ''; status.textContent = message || 'Creating invoice…'; }
        if (err) { err.style.display = 'none'; err.textContent = ''; }
        if (back) back.style.display = 'none';
      }

      function showCreatingInvoiceError(msg) {
        const status = document.getElementById('creatingInvoiceStatus');
        const err = document.getElementById('creatingInvoiceError');
        const back = document.getElementById('creatingInvoiceBackBtn');
        if (status) status.style.display = 'none';
        if (err) { err.style.display = 'block'; err.textContent = msg; }
        if (back) back.style.display = 'block';
      }

      // Build the Lightning payment screen (QR + polling). Shared by the
      // Bitcoin and Cash App paths.
      function showLightningPaymentScreen() {
        showStep('payment');
        lucide.createIcons();
        resetPaymentStepUI();
        document.getElementById('paymentAmountDisplay').textContent = formatAmount(selectedAmountSats, displayDenomination);
        const qrContainer = document.getElementById('qrCodeContainer');
        qrContainer.innerHTML = '';
        new QRCode(qrContainer, {
          text: 'lightning:' + currentInvoice,
          width: 220,
          height: 220,
          colorDark: '#000000',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.M,
        });
        startPaymentPolling();
      }

      async function generateInvoice() {
        const name = document.getElementById('contributorNameInput')?.value?.trim() || '';

        showStep('creatingInvoice');
        lucide.createIcons();
        resetCreatingInvoiceUI('Creating invoice…');

        const { data } = await createInvoice(selectedAmountSats, name);

        if (!data) {
          showCreatingInvoiceError('Failed to generate invoice. Please try again.');
          return;
        }

        currentInvoice = data.invoice.encodedInvoice;
        currentInvoiceId = data.id;
        showLightningPaymentScreen();
      }

      async function generateCashAppInvoice() {
        const name = document.getElementById('contributorNameInput')?.value?.trim() || '';

        showStep('creatingInvoice');
        lucide.createIcons();
        resetCreatingInvoiceUI('Opening Cash App…');

        const { data } = await createInvoice(selectedAmountSats, name);

        if (!data) {
          showCreatingInvoiceError('Failed to generate invoice. Please try again.');
          return;
        }

        currentInvoice = data.invoice.encodedInvoice;
        currentInvoiceId = data.id;
        // Land on the Lightning payment screen so returning from Cash App shows a
        // live QR + waiting state, then hand off to the Cash App app.
        showLightningPaymentScreen();
        window.location.href = buildCashAppLightningUrl(currentInvoice);
      }

      // ── Payment detection ──────────────────────────────────────────────
      // Layer 1 polls Spark's read-only API every 5s (no Blitz backend cost).
      // Layer 2 calls /checkPoolPayment: a 60s safety net while the Spark
      // detector works, or a backoff poll (5s→10s→20s→30s) when it doesn't.
      // Everything stops once the invoice expires.

      let invoiceAmountSats = 0;
      let lastContributionSats = 0;
      let invoiceCreatedAtMs = 0;
      let invoiceExpiresAtMs = 0;
      let sparkTimer = null;
      let backendTimer = null;
      // Transfer ids the backend has already rejected for this invoice. The
      // Spark pre-filter only matches by amount, so two screens picking the
      // same amount both match a single payment's transfer; once the backend
      // says a transfer isn't ours we stop re-checking it.
      const triedTransferIds = new Set();
      let sparkDetectorDisabled = false;
      let backendCheckInFlight = false;
      let sparkSdkPromise = null;
      let sparkClient = null;
      let bolt11DecoderPromise = null;

      function sparkDetectorAvailable() {
        return !sparkDetectorDisabled && !!poolWalletSparkAddress;
      }

      function backendBackoffDelay() {
        const elapsed = Date.now() - invoiceCreatedAtMs;
        if (elapsed < 60000) return 5000;
        if (elapsed < 180000) return 10000;
        if (elapsed < 600000) return 20000;
        return 30000;
      }

      function invoiceHasExpired() {
        return !!invoiceExpiresAtMs && Date.now() >= invoiceExpiresAtMs;
      }

      async function getSparkClient() {
        if (sparkClient) return sparkClient;
        if (!sparkSdkPromise) sparkSdkPromise = import(SPARK_SDK_URL);
        const sdk = await sparkSdkPromise;
        sparkClient = sdk.SparkReadonlyClient.createPublic({ network: 'MAINNET' });
        return sparkClient;
      }

      // Pre-filter: ask Spark (not the Blitz backend) for transfers to the pool
      // wallet that match this invoice's amount and haven't already been
      // rejected by the backend. Returns the array of new candidate transfer
      // ids ([] when none). Matching by amount is not unique, so the backend
      // is what ultimately confirms a given candidate is ours.
      async function sparkCheckPaid() {
        const client = await getSparkClient();
        const out = await client.getTransfers({
          sparkAddress: poolWalletSparkAddress,
          limit: 20,
          createdAfter: new Date(invoiceCreatedAtMs - 60000),
        });
        const transfers = (out && out.transfers) || [];
        return transfers
          .filter(function (t) {
            return Number(t.totalValue) === invoiceAmountSats && !triedTransferIds.has(t.id);
          })
          .map(function (t) { return t.id; });
      }

      function scheduleSparkCheck(delayMs) {
        if (sparkTimer) clearTimeout(sparkTimer);
        sparkTimer = setTimeout(sparkLoop, delayMs);
      }

      function scheduleBackendCheck(delayMs) {
        if (backendTimer) clearTimeout(backendTimer);
        backendTimer = setTimeout(backendLoop, delayMs);
      }

      async function sparkLoop() {
        sparkTimer = null;
        if (!paymentActive || !sparkDetectorAvailable()) return;
        if (invoiceHasExpired()) { handleInvoiceExpired(); return; }
        if (!document.hidden) {
          try {
            const newTransferIds = await sparkCheckPaid();
            if (!paymentActive) return;
            if (newTransferIds.length) {
              const result = await confirmWithBackend();
              if (!paymentActive) return;
              if (result === true) return; // paid — success UI already shown
              if (result === false) {
                // Backend says our invoice isn't paid, so none of these
                // transfers belong to this screen. Stop re-checking them.
                newTransferIds.forEach(function (id) { triedTransferIds.add(id); });
              }
              // result === null (in flight / backend error): leave untried, retry.
            }
          } catch (error) {
            console.error('Spark status check failed, falling back to backend polling:', error);
            sparkDetectorDisabled = true;
            scheduleBackendCheck(backendBackoffDelay());
            return;
          }
        }
        scheduleSparkCheck(SPARK_POLL_MS);
      }

      async function backendLoop() {
        backendTimer = null;
        if (!paymentActive) return;
        if (invoiceHasExpired()) { handleInvoiceExpired(); return; }
        if (!document.hidden) {
          const confirmed = await confirmWithBackend();
          if (confirmed || !paymentActive) return;
        }
        scheduleBackendCheck(sparkDetectorAvailable() ? BACKEND_SAFETY_POLL_MS : backendBackoffDelay());
      }

      // The backend confirm is what records the contribution in Firestore, so
      // it always runs at least once even when Spark already reports paid.
      async function confirmWithBackend() {
        if (backendCheckInFlight) return null;
        backendCheckInFlight = true;
        try {
          const result = await checkPayment(currentInvoiceId);
          if (!paymentActive) return null;
          if (result.paid) {
            stopPaymentPolling();
            showContributionSuccess(invoiceAmountSats);
            return true;
          }
          if (result.error) return null; // transient — don't mark tried, retry
          return false; // genuine not-paid → safe to mark candidates tried
        } finally {
          backendCheckInFlight = false;
        }
      }

      async function resolveInvoiceExpiry() {
        invoiceExpiresAtMs = invoiceCreatedAtMs + DEFAULT_INVOICE_EXPIRY_SECONDS * 1000;
        try {
          if (!bolt11DecoderPromise) bolt11DecoderPromise = import(BOLT11_DECODER_URL);
          const decoder = await bolt11DecoderPromise;
          const decoded = decoder.decode(currentInvoice);
          let timestamp = 0;
          let expiry = DEFAULT_INVOICE_EXPIRY_SECONDS;
          (decoded.sections || []).forEach(function (section) {
            if (section.name === 'timestamp') timestamp = Number(section.value);
            if (section.name === 'expiry') expiry = Number(section.value);
          });
          if (timestamp > 0 && expiry > 0) invoiceExpiresAtMs = (timestamp + expiry) * 1000;
        } catch (error) {
          console.error('Could not decode invoice expiry, using default:', error);
        }
      }

      async function handleInvoiceExpired() {
        if (!paymentActive) return;
        stopPaymentPolling();
        // One final check in case the payment landed at the buzzer.
        const result = await checkPayment(currentInvoiceId);
        if (result.paid) {
          showContributionSuccess(invoiceAmountSats);
          return;
        }
        showInvoiceExpiredUI();
      }

      function showInvoiceExpiredUI() {
        if (currentStep !== 'payment') return;
        const notice = document.getElementById('invoiceExpiredNotice');
        const regen = document.getElementById('regenerateInvoiceBtn');
        const waiting = document.querySelector('#step-payment .waiting-text');
        const copyBtn = document.getElementById('copyInvoiceBtn');
        const qr = document.getElementById('qrCodeContainer');
        if (notice) notice.style.display = 'block';
        if (regen) regen.style.display = 'block';
        if (waiting) waiting.style.display = 'none';
        if (copyBtn) copyBtn.style.display = 'none';
        if (qr) qr.style.opacity = '0.25';
      }

      function resetPaymentStepUI() {
        const notice = document.getElementById('invoiceExpiredNotice');
        const regen = document.getElementById('regenerateInvoiceBtn');
        const waiting = document.querySelector('#step-payment .waiting-text');
        const copyBtn = document.getElementById('copyInvoiceBtn');
        const qr = document.getElementById('qrCodeContainer');
        if (notice) notice.style.display = 'none';
        if (regen) regen.style.display = 'none';
        if (waiting) waiting.style.display = 'flex';
        if (copyBtn) copyBtn.style.display = '';
        if (qr) qr.style.opacity = '1';
      }

      function regenerateInvoice() {
        stopPaymentPolling();
        resetPaymentStepUI();
        showStep('name');
        lucide.createIcons();
      }

      function startPaymentPolling() {
        stopPaymentPolling();
        paymentActive = true;
        sparkDetectorDisabled = false;
        triedTransferIds.clear();
        invoiceAmountSats = selectedAmountSats;
        invoiceCreatedAtMs = Date.now();
        resolveInvoiceExpiry();
        if (sparkDetectorAvailable()) {
          scheduleSparkCheck(SPARK_POLL_MS);
          scheduleBackendCheck(BACKEND_SAFETY_POLL_MS);
        } else {
          scheduleBackendCheck(backendBackoffDelay());
        }
      }

      function stopPaymentPolling() {
        paymentActive = false;
        if (sparkTimer) { clearTimeout(sparkTimer); sparkTimer = null; }
        if (backendTimer) { clearTimeout(backendTimer); backendTimer = null; }
      }

      function cancelPayment() {
        stopPaymentPolling();
        showStep('name');
        lucide.createIcons();
      }

      function showContributionSuccess(contributedSats) {
        lastContributionSats = Number(contributedSats) || 0;
        showStep('success');
        lucide.createIcons();
      }

      function returnToPool() {
        // Backend caches pool data (~45s), so a fresh fetch here can still return
        // the pre-contribution total. Optimistically apply the amount we just
        // contributed; a full page refresh later pulls the corrected value from
        // the backend.
        if (poolData && lastContributionSats > 0) {
          poolData.currentAmount = (Number(poolData.currentAmount) || 0) + lastContributionSats;
        }
        lastContributionSats = 0;
        showStep('info');
        renderPoolInfo(poolData);
      }

      function copyInvoice() {
        if (!currentInvoice) return;
        navigator.clipboard.writeText(currentInvoice);
        showAlert('Copied!');
      }

      function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
      }

      // Handle visibility change to pause/resume polling
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          pageHidden = true;
        } else {
          pageHidden = false;
          // Confirm immediately when the user returns to an active invoice.
          if (paymentActive) {
            if (invoiceHasExpired()) {
              handleInvoiceExpired();
            } else {
              confirmWithBackend();
            }
          }
        }
      });

      window.addEventListener('pagehide', () => {
        pageHidden = true;
      });

      document.addEventListener('DOMContentLoaded', async () => {
        const livePool = await fetchPoolData();
        let initialData = livePool.data;
        if (!initialData && !livePool.notFound) {
          // Cached preview HTML can be stale; use embedded data only when the
          // fresh page-load fetch failed or timed out.
          initialData = POOL_DATA;
          if (initialData) applyPoolData(initialData);
        }
        if (!initialData) applyPoolData(null);
        renderPoolInfo(initialData);
      });
    </script>
  </head>
  <body>
    <!-- Alert overlay: replaces native alert() -->
    <div id="alert-overlay" class="overlay-backdrop">
      <div class="overlay-card">
        <p class="overlay-title">Notice</p>
        <p id="alert-message" class="overlay-body"></p>
        <button class="btn-primary" onclick="closeAlert()">OK</button>
      </div>
    </div>
    <nav>
      <div class="nav-inner">
        <a href="/">
          <img src="/public/favicon/favicon.svg" alt="Blitz Wallet" />
        </a>
        <a href="#" class="nav-download-btn download-btn">Download</a>
      </div>
    </nav>

    <div class="modal-backdrop" id="modalBackdrop"></div>
    <div class="modal-container" id="modalContainer">
      <div class="download-modal">
        <button class="modal-close" id="modalClose">
          <i data-lucide="x"></i>
        </button>
        <div class="modal-header">
          <h2>Download Blitz Wallet</h2>
          <p>Choose your platform to get started</p>
        </div>
        <div class="modal-tabs">
          <button class="modal-tab active" data-platform="ios">
            <i data-lucide="apple"></i>
            <span>iOS</span>
          </button>
          <button class="modal-tab" data-platform="android">
            <i data-lucide="smartphone"></i>
            <span>Android</span>
          </button>
        </div>
        <div class="modal-content">
          <div class="qr-wrapper">
            <div id="qr-code"></div>
          </div>
          <p class="modal-instructions">Scan with your mobile device</p>
          <div class="store-badges">
            <a href="https://apps.apple.com/us/app/blitz-wallet/id6476810582" class="store-badge" target="_blank">
              <i data-lucide="apple"></i>
              <span>App Store</span>
            </a>
            <a href="https://play.google.com/store/apps/details?id=com.blitzwallet" class="store-badge" target="_blank">
              <i data-lucide="play"></i>
              <span>Play Store</span>
            </a>
          </div>
        </div>
      </div>
    </div>

    <div class="pool-container">
      <div class="pool-card">
        <div id="app"> 
     
          <div class="loading-container">
            <div class="spinner"></div>
            <p>Loading pool...</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Download Modal JS -->
    <script>
      (function() {
        const modalContainer = document.getElementById('modalContainer');
        const modalBackdrop = document.getElementById('modalBackdrop');
        const modalClose = document.getElementById('modalClose');
        const modalTabs = document.querySelectorAll('.modal-tab');
        let qrcode = null;

        function initQRCode(url) {
          const qrElement = document.getElementById('qr-code');
          qrElement.innerHTML = '';
          qrcode = new QRCode(qrElement, {
            text: url,
            width: 200,
            height: 200,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H,
          });
        }

        function showModal() {
          modalContainer.classList.add('active');
          modalBackdrop.classList.add('active');
          document.body.style.overflow = 'hidden';
          if (!qrcode) initQRCode(IOS_STORE_URL);
        }

        function hideModal() {
          modalContainer.classList.remove('active');
          modalBackdrop.classList.remove('active');
          document.body.style.overflow = '';
        }

        function isMobileDevice() {
          return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        }

        function isAndroidDevice() {
          return /Android/i.test(navigator.userAgent);
        }

        function isIOSDevice() {
          return /iPhone|iPad|iPod/i.test(navigator.userAgent);
        }

        modalTabs.forEach(function(tab) {
          tab.addEventListener('click', function() {
            modalTabs.forEach(function(t) { t.classList.remove('active'); });
            tab.classList.add('active');
            var platform = tab.dataset.platform;
            var url = platform === 'ios' ? IOS_STORE_URL : ANDROID_STORE_URL;
            initQRCode(url);
          });
        });

        modalClose.addEventListener('click', hideModal);
        modalBackdrop.addEventListener('click', hideModal);

        document.querySelectorAll('.download-btn').forEach(function(btn) {
          btn.addEventListener('click', function(e) {
            e.preventDefault();
            if (isMobileDevice()) {
              if (isAndroidDevice()) {
                window.location.href = ANDROID_STORE_URL;
              } else if (isIOSDevice()) {
                window.location.href = IOS_STORE_URL;
              }
            } else {
              showModal();
            }
          });
        });

        lucide.createIcons();
      })();
    </script>
     <!-- Google Analytics -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-WNRJ7Y4RVE"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-WNRJ7Y4RVE');
    </script>
  </body>
</html>`;
}
