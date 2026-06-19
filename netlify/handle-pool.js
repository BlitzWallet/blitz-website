const PREVIEW_HTML_CACHE_SECONDS = numberFromEnv(
  process.env.PREVIEW_HTML_CACHE_SECONDS,
  3_600,
);
const PREVIEW_HTML_FAILURE_CACHE_SECONDS = numberFromEnv(
  process.env.PREVIEW_HTML_FAILURE_CACHE_SECONDS,
  60,
);
const POOL_DATA_CACHE_TTL_MS = numberFromEnv(
  process.env.POOL_DATA_CACHE_TTL_MS,
  PREVIEW_HTML_CACHE_SECONDS * 1000,
);
const POOL_DATA_CACHE_MAX_ENTRIES = numberFromEnv(
  process.env.POOL_DATA_CACHE_MAX_ENTRIES,
  250,
);
// Failed fetches are cached briefly so one timeout doesn't serve
// "pool does not exist" for the full TTL.
const POOL_DATA_FAILURE_CACHE_TTL_MS = numberFromEnv(
  process.env.POOL_DATA_FAILURE_CACHE_TTL_MS,
  5_000,
);
const poolDataCache = new Map();

function numberFromEnv(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

function buildPreviewCacheHeaders(hasPreviewData) {
  const ttl = hasPreviewData
    ? PREVIEW_HTML_CACHE_SECONDS
    : PREVIEW_HTML_FAILURE_CACHE_SECONDS;

  return {
    "Cache-Control": "public, max-age=0, must-revalidate",
    "CDN-Cache-Control": `public, s-maxage=${ttl}`,
    "Netlify-CDN-Cache-Control": `public, s-maxage=${ttl}`,
  };
}

function readPoolDataCache(cacheKey) {
  const cached = poolDataCache.get(cacheKey);
  if (!cached) return null;
  if (cached.expiresAt > Date.now()) return cached;
  poolDataCache.delete(cacheKey);
  return null;
}

function writePoolDataCache(cacheKey, entry) {
  if (poolDataCache.size >= POOL_DATA_CACHE_MAX_ENTRIES) {
    const oldestKey = poolDataCache.keys().next().value;
    if (oldestKey) poolDataCache.delete(oldestKey);
  }
  poolDataCache.set(cacheKey, entry);
}

async function fetchFreshPoolData(poolId, baseUrl) {
  try {
    const res = await fetch(baseUrl + "/getPoolData", {
      method: "POST",
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
  const cacheKey = String(poolId || "").trim();
  if (!cacheKey) return null;

  const cached = readPoolDataCache(cacheKey);
  console.log(cached);
  if (cached?.promise) return cached.promise;
  if (cached && "data" in cached) return cached.data;

  const promise = fetchFreshPoolData(cacheKey, baseUrl);
  writePoolDataCache(cacheKey, {
    promise,
    expiresAt: Date.now() + POOL_DATA_CACHE_TTL_MS,
  });

  const data = await promise;
  writePoolDataCache(cacheKey, {
    data,
    expiresAt:
      Date.now() +
      (data ? POOL_DATA_CACHE_TTL_MS : POOL_DATA_FAILURE_CACHE_TTL_MS),
  });
  return data;
}

// ── 2. Format goal amount for display ─────────────────────────────────────────
//
// Mirrors the btcPrice conversion logic already in handle-pool.js.
// Pass in the same btcPrice you already compute in handler().

function formatPoolGoal(data, btcPrice) {
  if (!data) return null;
  const goalAmount = Number(data.goalAmount ?? 0);
  return `${goalAmount.toLocaleString("en-US")} SAT`;

  const denomination = data.denomination ?? "SAT"; // "SAT" | "BTC" | "USD" | other fiat

  if (
    denomination === "USD" ||
    (denomination !== "SAT" && denomination !== "BTC")
  ) {
    // Fiat goal stored in cents → divide by 100 for display
    const fiatGoal = goalAmount / 100;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency:
        denomination === "SAT" || denomination === "BTC" ? "USD" : denomination,
    }).format(fiatGoal);
  }

  // SAT / BTC goal
  if (denomination === "BTC" || goalAmount >= 100_000) {
    const btc = goalAmount / 1e8;
    return `${btc.toLocaleString("en-US", { maximumFractionDigits: 8 })} BTC`;
  }
}

// ── 3. Build og:image URL ─────────────────────────────────────────────────────

function buildPoolOgImageUrl(baseUrl, poolId, goalLabel) {
  const goal = encodeURIComponent(goalLabel ?? "");

  return (
    `${baseUrl}/og-pool` +
    `?goal=${goal}` +
    `&pct=0` +
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
    const pct = Math.max(
      Math.round(poolData.currentAmount / poolData.goalAmount),
      100,
    );

    ogTitle =
      `${creatorName} shared a pool for ${poolTitle}, Open the link to contribute.`
        .trim()
        .replace(/ — Pool by $/, "");
    ogDescription = `Help raise ${goalLabel} for ${poolTitle} on Blitz Wallet.`;
    ogImage = buildPoolOgImageUrl(
      baseUrl,
      poolId,
      Number(poolData.goalAmount ?? 0),
    );
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
      ...buildPreviewCacheHeaders(!!poolData),
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
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
     <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Noto+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">

    <!-- Lucide Icons -->
    <script src="https://unpkg.com/lucide@latest"></script>

    <!-- QR Code Library -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>

    <!-- Currency formatting -->
    <script src="/src/js/format-currency.js"></script>

    <style>
      :root {
        --title_font: "Poppins", "Noto Sans", sans-serif;
        --description_font: "Poppins", "Noto Sans", sans-serif;
        --primary_color: #0375f6;
        --secondary_color: #21374f;
        --tertiary_color: #009bf0;
        --lm-background: #f2f2f2;
        --lm-backgroundOffset: #e3e3e3;
        --lm-text: #262626;
      }

      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: var(--description_font);
        background: var(--lm-background);
        color: var(--lm-text);
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: calc(70px + 1rem) 1rem 1rem;
      }

      .pool-container {
        width: 100%;
        max-width: 500px;
        margin: 25px auto;
      }

      .pool-card {
        background: white;
        border-radius: 24px;
        padding: 3rem 2.5rem;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
        border: 1px solid var(--lm-backgroundOffset);
        text-align: center;
      }

      /* Loading */
      .loading-spinner {
        display: inline-block;
        width: 50px;
        height: 50px;
        border: 5px solid var(--lm-backgroundOffset);
        border-radius: 50%;
        border-top-color: var(--primary_color);
        animation: spin 1s ease-in-out infinite;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
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
        position: relative;
        width: 250px;
        height: 250px;
        margin: 0 auto 1.5rem;
      }

      .progress-ring-svg {
        transform: rotate(-90deg);
        width: 250px;
        height: 250px;
      }

      .progress-ring-bg {
        fill: none;
        stroke: var(--lm-backgroundOffset);
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
        color: var(--lm-text);
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
        color: var(--lm-text);
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
        background: linear-gradient(135deg, var(--primary_color), var(--tertiary_color));
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
        font-family: var(--description_font);
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
        color: var(--primary_color);
        padding: 1rem 2rem;
        border: 1px solid var(--lm-backgroundOffset);
        border-radius: 12px;
        font-size: 1rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
        width: 100%;
        margin-top: 0.75rem;
        font-family: var(--description_font);
        align-items: center;
        justify-content: center;
      }

      .btn-secondary:hover {
        background: var(--lm-background);
        border-color: var(--primary_color);
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
        color: var(--primary_color);
        font-size: 0.95rem;
        cursor: pointer;
        padding: 0.5rem 0;
        margin-bottom: 1rem;
        font-family: var(--description_font);
        display: flex;
        align-items: center;
        gap: 0.25rem;
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
        border: 2px solid var(--lm-backgroundOffset);
        border-radius: 12px;
        padding: 1rem;
        font-size: 1.1rem;
        cursor: pointer;
        transition: all 0.2s ease;
        font-family: var(--description_font);
        color: var(--lm-text);
      }

      .amount-option:hover {
        border-color: var(--primary_color);
      }

      .amount-option.selected {
        border-color: var(--primary_color);
        background: rgba(3, 117, 246, 0.05);
        color: var(--primary_color);
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
        font-family: var(--description_font);
        border: 2px solid var(--lm-backgroundOffset);
        border-radius: 12px;
        text-align: center;
        outline: none;
        transition: border-color 0.2s ease;
        color: var(--lm-text);
      }

      .custom-amount-input:focus {
        border-color: var(--primary_color);
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
        font-family: var(--description_font);
        border: 2px solid var(--lm-backgroundOffset);
        border-radius: 12px;
        outline: none;
        transition: border-color 0.2s ease;
        color: var(--lm-text);
      }

      .name-input:focus {
        border-color: var(--primary_color);
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
        border: 1px solid var(--lm-backgroundOffset);
        margin: 1rem 0;
      }

      .qr-code-container canvas {
        display: block;
      }

      .invoice-amount-display {
        font-size: 1.5rem;
        font-weight: 500;
        color: var(--primary_color);
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
        background: var(--primary_color);
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
        color: var(--primary_color);
        font-size: 0.9rem;
        font-weight: 500;
        cursor: pointer;
        padding: 0.5rem 1rem;
        font-family: var(--description_font);
        text-decoration: underline;
      }

      /* Success State */
      .success-icon {
        width: 80px;
        height: 80px;
        background: var(--primary_color);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 1.5rem;
      }

      .success-icon svg {
        width: 40px;
        height: 40px;
        color: var(--lm-background);
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

      /* Error */
      .error-message {
        padding: 2rem;
        border-radius: 12px;
        background: #fef2f2;
        border: 1px solid #fecaca;
      }

      .error-message h2 {
        color: #991b1b;
        margin-bottom: 1rem;
      }

      .error-message p {
        color: #991b1b;
        margin-top: 0.5rem;
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
        background: var(--lm-backgroundOffset);
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

      /* Denomination Toggle Button */
      .denomination-toggle-btn {
        background: transparent;
        border: 2px solid var(--lm-backgroundOffset);
        color: var(--primary_color);
        padding: 0.6rem 1rem;
        border-radius: 50px;
        font-size: 0.85rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        margin-bottom: 1rem;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        font-family: var(--description_font);
      }

      .denomination-toggle-btn:hover {
        background: var(--lm-background);
        border-color: var(--primary_color);
      }

      .denomination-toggle-btn svg {
        transition: transform 0.3s ease;
      }

      .denomination-toggle-btn:hover svg {
        transform: rotate(180deg);
      }

      /* Navbar */
      nav {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        z-index: 1000;
        background: var(--lm-background);
        border-bottom: 1px solid var(--lm-backgroundOffset);
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
        background: linear-gradient(135deg, var(--primary_color) 0%, var(--tertiary_color) 100%);
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
        background: var(--lm-backgroundOffset);
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
        background: var(--lm-text);
      }

      .modal-close svg {
        width: 20px;
        height: 20px;
        color: var(--lm-text);
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
        color: var(--lm-text);
      }

      .modal-header p {
        color: var(--lm-text);
        opacity: 0.7;
      }

      .modal-tabs {
        display: flex;
        background: var(--lm-backgroundOffset);
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
        color: var(--lm-text);
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
        color: var(--primary_color);
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      }

      .modal-content {
        text-align: center;
      }

      .qr-wrapper {
        background: white;
        padding: 1.5rem;
        border-radius: 20px;
        display: inline-block;
        border: 2px solid var(--lm-backgroundOffset);
        margin-bottom: 1.5rem;
      }

      #qr-code {
        display: block;
      }

      .modal-instructions {
        font-size: 0.95rem;
        color: var(--lm-text);
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
        background: var(--lm-text);
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


      function showStep(stepName) {
        currentStep = stepName;
        document.querySelectorAll('.step').forEach(el => el.classList.remove('active'));
        const step = document.getElementById('step-' + currentStep);
        if (step) step.classList.add('active');
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
                <h1 class="pool-title">\${escapeHtml(pool.poolTitle)}</h1>
                <p class="pool-meta">
                  By \${escapeHtml(pool.creatorName)}
                </p>

                \${isClosed ? '<span class="status-badge closed">Closed' + (closedDate ? ' ' + closedDate : '') + '</span>' : ''}

                \${btcPrice && btcPrice > 0 ? \`
                  <button class="denomination-toggle-btn" onclick="toggleDenomination()" id="denomToggleBtn">
                    <i data-lucide="refresh-cw" style="width:14px;height:14px;"></i>
                    Switch to \${displayDenomination === 'SAT' ? poolCurrency : 'BTC'}
                  </button>
                \` : ''}

                <div class="progress-ring-container">
                  <svg class="progress-ring-svg" viewBox="0 0 170 170">
                    <defs>
                      <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stop-color="var(--primary_color)" />
                        <stop offset="100%" stop-color="var(--tertiary_color)" />
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
                  <button class="btn-primary" onclick="showStep('amount')">
                    Contribute
                  </button>
                \` : ''}
              </div>

              <!-- STEP: Amount Selection -->
              <div id="step-amount" class="step">
                <button class="btn-back" onclick="showStep('info')">
                  <i data-lucide="arrow-left" style="width:16px;height:16px;"></i> Back
                </button>
                <h2 style="font-size:1.4rem;font-weight:500;margin-bottom:0.5rem;">Choose an amount</h2>
                <p style="font-size:0.9rem;color:#888;margin-bottom:1rem;">Select a preset or enter a custom amount\${displayDenomination === 'SAT' ? ' in sats' : ''}.</p>

                <div class="amount-grid">
                  \${displayDenomination === 'SAT'
                    ? PRESET_AMOUNTS_SATS.map(sats => \`<button class="amount-option" onclick="selectPreset(\${sats}, this)" data-sats="\${sats}">\${sats.toLocaleString() + " SAT"}</button>\`).join('')
                    : PRESET_AMOUNTS_FIAT.map(fiat => {
                        const sats = fiatToSats(fiat);
                        const formatted = formatCurrency({ amount: fiat, code: displayDenomination })[0];
                        return \`<button class="amount-option" onclick="selectPreset(\${sats}, this)" data-sats="\${sats}">\${formatted}</button>\`;
                      }).join('')
                  }
                  <button class="amount-option custom-btn" onclick="toggleCustomAmount()">...</button>
                </div>

                <div class="custom-amount-wrapper" id="customAmountWrapper">
                  <input type="number" class="custom-amount-input" id="customAmountInput"
                    placeholder="\${displayDenomination === 'SAT' ? 'Enter sats' : 'Enter ' + displayDenomination + ' amount'}" min="1" oninput="onCustomAmountInput(this.value)">
                </div>

                <button class="btn-primary" id="continueToNameBtn" disabled onclick="showStep('name')">
                  Continue
                </button>
              </div>

              <!-- STEP: Name Input -->
              <div id="step-name" class="step">
                <button class="btn-back" onclick="showStep('amount')">
                  <i data-lucide="arrow-left" style="width:16px;height:16px;"></i> Back
                </button>
                <h2 style="font-size:1.4rem;font-weight:500;margin-bottom:0.5rem;">Add your name</h2>
                <p style="font-size:0.9rem;color:#888;margin-bottom:0.25rem;">Optional. This will be visible to the pool creator.</p>

                <div class="name-input-section">
                  <input type="text" class="name-input" id="contributorNameInput"
                    placeholder="Your name (optional)" maxlength="50">
                </div>

                <div id="invoiceErrorContainer"></div>

                <button class="btn-primary" onclick="generateInvoice()" id="generateInvoiceBtn">
                  Generate Invoice
                </button>
                <button class="btn-secondary" onclick="generateCashAppInvoice()" id="generateCashAppInvoiceBtn">
                  <span class="btn-content">
                    <img src="/src/assets/images/cashapp-logo.svg" alt="" aria-hidden="true" />
                    <span>Pay with Cash App</span>
                  </span>
                </button>
              </div>

              <!-- STEP: QR / Payment -->
              <div id="step-payment" class="step">
                <button class="btn-back" onclick="cancelPayment()">
                  <i data-lucide="arrow-left" style="width:16px;height:16px;"></i> Back
                </button>
                <h2 style="font-size:1.4rem;font-weight:500;margin-bottom:0.5rem;">Scan to Pay</h2>
                <div class="invoice-amount-display" id="paymentAmountDisplay"></div>

                <div class="qr-code-container" id="qrCodeContainer"></div>

                <div class="waiting-text">
                  <span class="waiting-dot"></span>
                  <span class="waiting-dot"></span>
                  <span class="waiting-dot"></span>
                  <span style="margin-left:0.25rem;">Waiting for payment</span>
                </div>

                <div class="expired-notice" id="invoiceExpiredNotice" style="display:none;">
                  This invoice has expired. Generate a new one to contribute.
                </div>

                <button class="copy-invoice-btn" onclick="copyInvoice()" id="copyInvoiceBtn">
                  Copy Invoice
                </button>

                <button class="btn-primary" id="regenerateInvoiceBtn" style="display:none;" onclick="regenerateInvoice()">
                  Generate New Invoice
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

      let currentInvoice = '';
      let currentInvoiceId = '';
      const CASH_APP_BUTTON_HTML = '<span class="btn-content"><img src="/src/assets/images/cashapp-logo.svg" alt="" aria-hidden="true" /><span>Pay with Cash App</span></span>';
      const CASH_APP_LOADING_HTML = '<span class="btn-content"><span>Opening Cash App</span><span class="loading-dots" aria-hidden="true"><span></span><span></span><span></span></span></span>';

      function buildCashAppLightningUrl(invoice) {
        return \`https://cash.app/launch/lightning/\${encodeURIComponent(invoice)}\`;
      }

      async function generateInvoice() {
        const name = document.getElementById('contributorNameInput')?.value?.trim() || '';
        const btn = document.getElementById('generateInvoiceBtn');
        const cashAppBtn = document.getElementById('generateCashAppInvoiceBtn');
        const errorContainer = document.getElementById('invoiceErrorContainer');
        
        btn.disabled = true;
        btn.textContent = 'Generating...';
        if (cashAppBtn) cashAppBtn.disabled = true;
        errorContainer.innerHTML = '';

        const { data, error } = await createInvoice(selectedAmountSats, name);

        if (!data) {
          btn.disabled = false;
          btn.textContent = 'Retry Invoice Generation';
          if (cashAppBtn) cashAppBtn.disabled = false;
          errorContainer.innerHTML = '<p class="error-text">Failed to generate invoice. Please try again.</p>';
          return;
        }

        currentInvoice = data.invoice.encodedInvoice;
        const displayInvoice = "lightning:" + currentInvoice
        currentInvoiceId = data.id;

        // Update name step amount display
        showStep('payment');
        lucide.createIcons();
        resetPaymentStepUI();

        document.getElementById('paymentAmountDisplay').textContent = formatAmount(selectedAmountSats, displayDenomination);

        // Render QR code
        const qrContainer = document.getElementById('qrCodeContainer');
        qrContainer.innerHTML = '';
        new QRCode(qrContainer, {
          text: displayInvoice,
          width: 220,
          height: 220,
          colorDark: '#000000',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.M,
        });

        // Start polling
        startPaymentPolling();

        btn.disabled = false;
        btn.textContent = 'Generate Invoice';
        if (cashAppBtn) cashAppBtn.disabled = false;
      }

      async function generateCashAppInvoice() {
        const name = document.getElementById('contributorNameInput')?.value?.trim() || '';
        const btn = document.getElementById('generateInvoiceBtn');
        const cashAppBtn = document.getElementById('generateCashAppInvoiceBtn');
        const errorContainer = document.getElementById('invoiceErrorContainer');

        if (btn) btn.disabled = true;
        if (cashAppBtn) {
          cashAppBtn.disabled = true;
          cashAppBtn.innerHTML = CASH_APP_LOADING_HTML;
        }
        if (errorContainer) errorContainer.innerHTML = '';

        const { data } = await createInvoice(selectedAmountSats, name);

        if (!data) {
          if (btn) btn.disabled = false;
          if (cashAppBtn) {
            cashAppBtn.disabled = false;
            cashAppBtn.innerHTML = CASH_APP_BUTTON_HTML;
          }
          if (errorContainer) {
            errorContainer.innerHTML = '<p class="error-text">Failed to generate invoice. Please try again.</p>';
          }
          return;
        }

        currentInvoice = data.invoice.encodedInvoice;
        currentInvoiceId = data.id;
        startPaymentPolling();
        window.location.href = buildCashAppLightningUrl(currentInvoice);

        if (btn) btn.disabled = false;
        if (cashAppBtn) {
          cashAppBtn.disabled = false;
          cashAppBtn.innerHTML = CASH_APP_BUTTON_HTML;
        }
      }

      // ── Payment detection ──────────────────────────────────────────────
      // Layer 1 polls Spark's read-only API every 5s (no Blitz backend cost).
      // Layer 2 calls /checkPoolPayment: a 60s safety net while the Spark
      // detector works, or a backoff poll (5s→10s→20s→30s) when it doesn't.
      // Everything stops once the invoice expires.

      let invoiceAmountSats = 0;
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
            showStep('success');
            lucide.createIcons();
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
          showStep('success');
          lucide.createIcons();
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

      async function returnToPool() {
        // Refresh pool data
        showStep('info');
        const { data } = await fetchPoolData();
        if (data) {
          renderPoolInfo(poolData);
        }
      }

      function copyPoolLink() {
        const link = \`https://blitzwalletapp.com/pools/\${poolId}\`;
        navigator.clipboard.writeText(link);
        const btn = document.getElementById('copyLinkBtn');
        if (btn) {
          const original = btn.textContent;
          btn.textContent = 'Link Copied!';
          setTimeout(() => { btn.textContent = original; }, 2000);
        }
      }

      function copyInvoice() {
        navigator.clipboard.writeText(currentInvoice);
        const btn = document.getElementById('copyInvoiceBtn');
        if (btn) {
          const original = btn.textContent;
          btn.textContent = 'Copied!';
          setTimeout(() => { btn.textContent = original; }, 2000);
        }
      }

      function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
      }

      // Update the name step amount display when entering that step
      const origShowStep = showStep;
      showStep = function(stepName) {
        origShowStep(stepName);
        if (stepName === 'name') {
          const amountEl = document.querySelector('#step-name strong');
          if (amountEl) amountEl.textContent = formatSats(selectedAmountSats) + ' SAT';
        }
      };

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
        console.log(initialData,!initialData)
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
            <div class="loading-spinner"></div>
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
  </body>
</html>`;
}
