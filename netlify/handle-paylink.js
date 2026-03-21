// ── 1. Fetch paylink data from Cloud Function ──────────────────────────────

async function fetchPaylinkData(paylinkId, baseUrl) {
  try {
    const res = await fetch(baseUrl + "/getPaylinkData", {
      method: "POST",
      body: JSON.stringify({ paylinkId, checkInvoice: true }),
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) {
      console.error("[handle-paylink] Cloud Function returned", res.status);
      return null;
    }

    const json = await res.json();
    if (json?.status !== "SUCCESS") {
      console.error("[handle-paylink] Unexpected status:", json?.status);
      return null;
    }

    return json?.data ?? null;
  } catch (err) {
    console.error("[handle-paylink] fetch error:", err.message);
    return null;
  }
}

// ── 2. Format amount label ─────────────────────────────────────────────────

function formatAmountLabel(data) {
  if (!data) return null;
  const amount = Number(data.amount ?? 0);
  return `\u20BF${amount.toLocaleString("en-US")}`;
}

// ── 3. Build OG image URL ──────────────────────────────────────────────────

function buildOgImageUrl(baseUrl, paylinkId, data) {
  return (
    baseUrl +
    "/og-paylink" +
    "?username=" +
    encodeURIComponent(data.username ?? "") +
    "&amount=" +
    (data.amount ?? 0) +
    "&description=" +
    encodeURIComponent(data.description ?? "") +
    "&id=" +
    encodeURIComponent(paylinkId) +
    "&v=1"
  );
}

// ── 4. Handler ─────────────────────────────────────────────────────────────

export async function handler(event, context) {
  const path = (event.path || "").replace(/\/+$/, "");
  let paylinkId = path.split("/").pop() || "";
  const domain = event.rawUrl.replace(event.path, "");
  try {
    paylinkId = decodeURIComponent(paylinkId);
  } catch (e) {
    // Keep raw paylinkId if decode fails.
  }

  const paylinkData = await fetchPaylinkData(paylinkId, domain);

  let ogTitle, ogDescription, ogImage;

  if (paylinkData) {
    const amountLabel = formatAmountLabel(paylinkData);
    const username = paylinkData.name ?? "Someone";
    ogTitle = `${username} is requesting ${amountLabel}`;
    ogDescription = `Pay ${username} on Blitz Wallet`;
    ogImage = buildOgImageUrl(domain, paylinkId, paylinkData);
  } else {
    ogTitle = "Payment Request — Blitz Wallet";
    ogDescription =
      "Pay with Bitcoin Lightning or stablecoins on Blitz Wallet.";
    ogImage = "https://blitzwalletapp.com/public/twitterCard.png";
  }

  const html = generateHTML({
    ogTitle,
    ogDescription,
    ogImage,
    paylinkId,
    paylinkData,
    domain,
  });

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "text/html",
    },
    body: html,
  };
}

// ── 5. Generate HTML ───────────────────────────────────────────────────────

function generateHTML({
  ogTitle,
  ogDescription,
  ogImage,
  paylinkId,
  paylinkData,
  domain,
}) {
  const inlinedData = JSON.stringify(paylinkData ?? null);
  const username = paylinkData?.name ?? "";
  const amount = Number(paylinkData?.amount ?? 0);
  const amountLabel = amount ? `₿${amount.toLocaleString("en-US")}` : "";
  const description = paylinkData?.description ?? "";
  const isPaid = paylinkData?.isPaid ?? false;
  const paylinkUrl = `https://blitzwalletapp.com/paylink/${paylinkId}`;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="canonical" href="https://blitzwalletapp.com/paylink/${paylinkId}" />

    <meta name="apple-mobile-web-app-title" content="Blitz Wallet" />
    <meta
      name="apple-itunes-app"
      content="app-id=6476810582, app-argument=https://blitzwalletapp.com/paylink/${paylinkId}"
    />

    <!-- Favicon -->
    <link rel="icon" type="image/png" href="/public/favicon/favicon-96x96.png" sizes="96x96" />
    <link rel="icon" type="image/svg+xml" href="/public/favicon/favicon.svg" />
    <link rel="shortcut icon" href="/public/favicon/favicon.ico" />
    <link rel="apple-touch-icon" href="/public/favicon/favicon.ico" />
    <link rel="manifest" href="/public/favicon/site.webmanifest" />

    <title>${ogTitle}</title>
    <meta name="description" content="${ogDescription}" />

    <!-- Open Graph -->
    <meta property="og:image"        content="${ogImage}" />
    <meta property="og:image:width"  content="1200" />
    <meta property="og:image:height" content="628" />
    <meta property="og:type"         content="website" />
    <meta property="og:url"          content="https://blitzwalletapp.com/paylink/${paylinkId}" />
    <meta property="og:title"        content="${ogTitle}" />
    <meta property="og:description"  content="${ogDescription}" />

    <!-- Twitter -->
    <meta name="twitter:card"        content="summary_large_image" />
    <meta name="twitter:image"       content="${ogImage}" />
    <meta property="twitter:url"     content="https://blitzwalletapp.com/paylink/${paylinkId}" />
    <meta property="twitter:title"   content="${ogTitle}" />
    <meta property="twitter:description" content="${ogDescription}" />

    <meta name="robots" content="noindex,nofollow">
    <meta name="googlebot" content="noindex,nofollow">

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">

     <!-- Lucide Icons -->
    <script src="https://unpkg.com/lucide@latest"></script>

    <!-- QR Code Library -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>

    <style>
      :root {
        --title_font: "Poppins", sans-serif;
        --description_font: "Poppins", sans-serif;
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
        align-items: center;
        justify-content: center;
        padding: 1rem;
        padding-top:90px;
        flex-direction:column;
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
        margin-left: auto;
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
    
    
      /* Download Modal */

      .paylink-container {
        width: 100%;
        max-width: 680px;
        margin: 0 auto;
      }

      .paylink-card {
        background: white;
        border-radius: 24px;
        padding: 3rem 2.5rem;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
        border: 1px solid var(--lm-backgroundOffset);
        text-align: center;
      }

      /* ── screen management ─────────────────────────────────────────── */
      .screen { display: none; }
      .screen.active { display: block; }

      /* ── request layout (initial screen) ──────────────────────────── */
      .request-layout {
        display: flex;
        gap: 2rem;
        align-items: center;
        justify-content: center;
        margin-bottom: 2rem;
      }

      .request-text {
        text-align: center;
        flex: 1;
      }

      .requester {
        font-size: 1.1rem;
        opacity: 0.7;
        margin-bottom: 0.5rem;
      }

      .amount {
        font-size: 3rem;
        font-weight: 700;
        color: var(--primary_color);
        line-height: 1.1;
        margin-bottom: 0.5rem;
      }

      .pay-description {
        font-size: 1rem;
        opacity: 0.7;
        margin-top: 0.5rem;
      }

      .qr-side {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
        flex-shrink: 0;
      }

      .qr-side p {
        font-size: 0.85rem;
        opacity: 0.6;
      }

      @media (max-width: 768px) {
        .qr-side { display: none; }
        .request-layout { flex-direction: column; }
      }

      /* ── buttons ───────────────────────────────────────────────────── */
      .btn-primary {
        background: linear-gradient(135deg, var(--primary_color), var(--tertiary_color));
        color: white;
        padding: 1rem 2rem;
        border: none;
        border-radius: 12px;
        font-size: 1.05rem;
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
        background: transparent;
        color: var(--primary_color);
        padding: 1rem 2rem;
        border: 1px solid var(--lm-backgroundOffset);
        border-radius: 12px;
        font-size: 1.05rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
        width: 100%;
        margin-top: 0.75rem;
        font-family: var(--description_font);
      }

      .btn-secondary:hover {
        background: var(--lm-background);
        border-color: var(--primary_color);
      }

      .btn-back {
        background: none;
        border: none;
        color: var(--primary_color);
        font-family: var(--description_font);
        font-size: 0.95rem;
        font-weight: 500;
        cursor: pointer;
        padding: 0.25rem 0;
        margin-bottom: 1.5rem;
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        width: 100%;
      }

      .btn-back:hover { opacity: 0.75; }

      /* ── network selection ─────────────────────────────────────────── */
      .screen-title {
        font-size: 1.5rem;
        font-weight: 500;
        margin-bottom: 1.5rem;
      }

      .network-cards {
        display: flex;
        gap: 0.75rem;
        justify-content: center;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
      }

      .network-card {
        border: 2px solid var(--lm-backgroundOffset);
        border-radius: 12px;
        padding: 1rem 1.5rem;
        cursor: pointer;
        font-weight: 500;
        font-size: 0.95rem;
        transition: all 0.2s ease;
        min-width: 120px;
      }

      .network-card:hover {
        border-color: var(--primary_color);
      }

      .network-card.selected {
        border-color: var(--primary_color);
        background: rgba(3, 117, 246, 0.06);
        color: var(--primary_color);
      }

      .currency-toggle {
        display: flex;
        gap: 0.5rem;
        justify-content: center;
        margin-bottom: 1.5rem;
      }

      .currency-toggle button {
        padding: 0.6rem 1.5rem;
        border-radius: 8px;
        border: 2px solid var(--lm-backgroundOffset);
        background: transparent;
        font-family: var(--description_font);
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 0.95rem;
      }

      .currency-toggle button.active {
        border-color: var(--primary_color);
        background: rgba(3, 117, 246, 0.06);
        color: var(--primary_color);
      }

      /* ── address display ───────────────────────────────────────────── */
      .address-box {
        background: var(--lm-background);
        border-radius: 10px;
        padding: 0.75rem 1rem;
        font-family: monospace;
        font-size: 0.85rem;
        word-break: break-all;
        margin: 1rem 0;
        text-align: left;
        cursor: pointer;
      }

      /* ── status text ───────────────────────────────────────────────── */
      .status-text {
        font-size: 0.95rem;
        opacity: 0.7;
        margin: 0.75rem 0;
      }

      .warning-callout {
        background: #fff7ed;
        border: 1px solid #fed7aa;
        color: #9a3412;
        border-radius: 10px;
        padding: 0.75rem 1rem;
        font-size: 0.9rem;
        margin: 1rem 0;
        text-align: left;
      }

      .seed-section {
        margin-top: 1rem;
        text-align: left;
      }

      .seed-warning {
        font-size: 0.85rem;
        color: #9a3412;
        margin-bottom: 0.5rem;
      }

      .seed-box {
        background: #0f172a;
        color: #f8fafc;
        border-radius: 8px;
        padding: 0.75rem;
        font-family: monospace;
        font-size: 0.85rem;
        word-break: break-word;
        margin-bottom: 0.75rem;
      }

      .recovery-actions {
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
        margin-top: 0.75rem;
      }

      .recovery-actions button {
        flex: 1;
        min-width: 160px;
      }

      /* ── spinner ───────────────────────────────────────────────────── */
      .spinner {
        display: inline-block;
        width: 32px;
        height: 32px;
        border: 3px solid var(--lm-backgroundOffset);
        border-radius: 50%;
        border-top-color: var(--primary_color);
        animation: spin 1s ease-in-out infinite;
        margin: 0.5rem auto;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      /* ── success screen ────────────────────────────────────────────── */
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
        font-size: 1.75rem;
        font-weight: 500;
        margin-bottom: 0.75rem;
      }

      .success-text {
        font-size: 1rem;
        opacity: 0.7;
      }

      /* ── already-paid state ────────────────────────────────────────── */
      .paid-notice {
        font-size: 0.9rem;
        color: #1e3a8a;
        background: #dbeafe;
        border-radius: 8px;
        padding: 0.6rem 1rem;
        margin-top: 1rem;
      }

      /* ── error state ───────────────────────────────────────────────── */
      .error-box {
        padding: 2rem;
        border-radius: 12px;
        background: #fef2f2;
        border: 1px solid #fecaca;
      }

      .error-box h2 {
        color: #991b1b;
        margin-bottom: 0.75rem;
      }

      .error-box p {
        color: #991b1b;
        font-size: 0.95rem;
      }

      @media (max-width: 500px) {
        .paylink-card { padding: 2rem 1.5rem; }
        .amount { font-size: 2.5rem; }

         .download-modal {
          padding: 2.5rem 1.5rem 2rem;
        }

        .modal-header h2 {
          font-size: 1.5rem;
        }
      }

      /* ── gear button ────────────────────────────────────────────────── */
      #gear-btn {        
        background: var(--lm-background);
        border: none;
        cursor: pointer;
        color: var(--lm-text);
        padding: 0.4rem;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: opacity 0.2s;
        margin-left: 10px;
      }
      #gear-btn:hover { opacity: 1; }
      #gear-btn svg { width: 30px; height: 30px; }

      /* ── overlays (gear + alert) ─────────────────────────────────────── */
      .overlay-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.5);
        z-index: 9990;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 1rem;
      }
      .overlay-backdrop.active { display: flex; }

      .overlay-card {
        background: #fff;
        border-radius: 16px;
        padding: 2rem;
        max-width: 420px;
        width: 100%;
        position: relative;
      }

      .overlay-close {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: transparent;
        border: none;
        cursor: pointer;
        color: var(--lm-text);
        opacity: 0.5;
        padding: 0.25rem;
        line-height: 1;
      }
      .overlay-close:hover { opacity: 1; }

      .overlay-title {
        font-size: 1.1rem;
        font-weight: 500;
        margin-bottom: 0.75rem;
      }

      .overlay-body {
        font-size: 0.9rem;
        line-height: 1.5;
        color: var(--lm-text);
        opacity: 0.85;
        margin-bottom: 1rem;
      }

      /* ── full-screen loading (creating-swap, processing) ─────────────── */
      .loading-screen {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 3rem 1rem;
        text-align: center;
        gap: 1rem;
      }

      .loading-screen .spinner { margin: 0; }

      .loading-status {
        font-size: 1rem;
        opacity: 0.75;
      }

      .loading-error {
        font-size: 0.9rem;
        color: #991b1b;
        margin-top: 0.5rem;
      }
    </style>
  </head>
  <body>
  <nav>
      <div class="nav-inner">
        <a href="/">
          <img src="/public/favicon/favicon.svg" alt="Blitz Wallet" />
        </a>
        <a href="#" class="nav-download-btn download-btn">Download</a>
         <button id="gear-btn" onclick="openGearOverlay()" aria-label="Recovery options">
          <i color="#0375f6" data-lucide="settings"></i>
        </button>
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

    <!-- Alert overlay: replaces native alert() -->
    <div id="alert-overlay" class="overlay-backdrop">
      <div class="overlay-card">
        <p class="overlay-title">Notice</p>
        <p id="alert-message" class="overlay-body"></p>
        <button class="btn-primary" onclick="closeAlert()">OK</button>
      </div>
    </div>

    <div class="paylink-container">
      <div class="paylink-card">

        <!-- Screen: creating / resuming swap -->
        <div id="screen-creating-swap" class="screen">
          <div class="loading-screen">
            <div class="spinner" id="creating-spinner"></div>
            <p class="loading-status" id="creating-status">Creating swap…</p>
            <p class="loading-error" id="creating-error" style="display:none;"></p>
            <button class="btn-secondary" id="creating-back-btn" style="display:none;" onclick="showScreen('screen-network')">Go back</button>
          </div>
        </div>

        <!-- Screen: relay in progress -->
        <div id="screen-processing" class="screen">
          <div class="loading-screen">
            <div class="spinner"></div>
            <p class="loading-status" id="processing-status">Deposit Received…</p>
          </div>
        </div>

        <!-- Screen 1: initial -->
        <div id="screen-initial" class="screen active">
          ${
            paylinkData
              ? `
          <div class="request-layout">
            <div class="request-text">
              <p class="requester">${username} requested you</p>
              <p class="amount">${amountLabel}</p>
              ${description ? `<p class="pay-description">for "${description}"</p>` : ""}
            </div>
          </div>
          ${
            isPaid
              ? `
          <div class="paid-notice">This payment has already been completed.</div>
          `
              : `
          <button class="btn-primary" id="btn-btc" onclick="startBtcFlow()">Pay with Bitcoin</button>
          <button class="btn-secondary" id="btn-stable" onclick="showNetworkSelect()">Pay with USDC or USDT</button>
          <button class="btn-secondary" id="btn-resume-swap" style="display:none;" onclick="resumeSwapFromStorage()">Resume swap</button>
          `
          }
          `
              : `
          <div class="error-box">
            <h2>Payment Request Not Found</h2>
            <p>This paylink doesn't exist or has expired.</p>
          </div>
          `
          }
        </div>

        <!-- Screen 2a: Bitcoin QR -->
        <div id="screen-btc" class="screen">
          <button class="btn-back" onclick="goBack()">← Back</button>
          <p class="requester">Pay ${username} via Lightning</p>
          <div style="cursor:pointer;" onclick="copyBitcoinAddress()" class="qr-wrapper">
            <div id="qr-btc-invoice"></div>
          </div>
          <p class="amount">${amountLabel}</p>
          <button class="btn-primary" id="btn-open-wallet" onclick="openBitcoinWallet()">Open Wallet</button>
          <p id="btc-status" class="status-text">Waiting for payment…</p>
          <div class="spinner"></div>
        </div>

        <!-- Screen 2b: Network selection -->
        <div id="screen-network" class="screen">
          <button class="btn-back" onclick="goBack()">← Back</button>
          <h2 class="screen-title">Select Network</h2>
          <div class="network-cards">
            <div class="network-card" id="card-ethereum" onclick="selectNetwork('ethereum')">Ethereum</div>
            <div class="network-card" id="card-polygon"  onclick="selectNetwork('polygon')">Polygon</div>
            <div class="network-card" id="card-arbitrum" onclick="selectNetwork('arbitrum')">Arbitrum</div>
          </div>
          <div class="currency-toggle">
            <button id="btn-usdc" class="active" onclick="selectCurrency('USDC')">USDC</button>
            <button id="btn-usdt" onclick="selectCurrency('USDT')">USDT</button>
          </div>
          <button class="btn-primary" id="btn-continue-stable" onclick="confirmStablecoin()">Continue</button>
        </div>


        <!-- Screen 3: Stablecoin deposit -->
        <div id="screen-stable-pay" class="screen">
          <button class="btn-back" onclick="goBack('network')">← Back</button>
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


        <!-- Screen 3b: Swap recovery -->
        <div id="screen-recovery" class="screen">
          <button class="btn-back" onclick="goBack()">← Back</button>
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

        <!-- Screen 4: Success -->
        <div id="screen-success" class="screen">
           <div class="success-icon">
              <i data-lucide="check"></i>
            </div>
          <h2 class="success-title">Payment received!</h2>
          <p class="success-text">Thank you for paying ${username}.</p>
        </div>

      </div>
    </div>

    <!-- QRCode.js -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
    <script src="${domain}/public/paylink-swap.js"></script>

    <script>
      const IOS_STORE_URL = 'https://apps.apple.com/us/app/blitz-wallet/id6476810582';
      const ANDROID_STORE_URL = 'https://play.google.com/store/apps/details?id=com.blitzwallet';
      const PAYLINK_ID = ${JSON.stringify(paylinkId)};
      const PAYLINK_DATA = ${inlinedData};
      const SWAP_STORAGE_KEY = \`paylink_swap_\${PAYLINK_ID}\`;

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

      // ── screen navigation ─────────────────────────────────────────────
      function showScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(id).classList.add('active');
      }

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

      function stopPolling() {
        shouldPoll = false;
        if (pollTimer) { clearTimeout(pollTimer); pollTimer = null; }
      }

      function stopSwapPolling() {
        swapPolling = false;
        if (swapPollTimer) { clearTimeout(swapPollTimer); swapPollTimer = null; }
      }

      // ── EVM balance polling ───────────────────────────────────────────
      function startBalancePolling() {
        stopBalancePolling();
        balancePolling = true;
        if (document.visibilityState !== 'hidden') scheduleBalancePoll();
      }

      function stopBalancePolling() {
        balancePolling = false;
        if (balancePollTimer) { clearTimeout(balancePollTimer); balancePollTimer = null; }
      }

      function scheduleBalancePoll() {
        balancePollTimer = setTimeout(doBalancePoll, 10000);
      }

      async function doBalancePoll() {
        balancePollTimer = null;
        if (!balancePolling || !currentTokenAddress || !currentDepositAddress || !currentChainId) return;
        try {
          const balance = await PaylinkSwap.getTokenBalance({
            tokenAddress: currentTokenAddress,
            walletAddress: currentDepositAddress,
            chainId: currentChainId,
          });
          console.log("EVM swap balance",balance)
          if (expectedAmountRaw !== null && balance >= expectedAmountRaw) {
            attemptRelay();
          } else if (currentSwap) {
            // On refresh, balance may be 0 because relay already swept tokens.
            // Check swap status and show processing screen if swap is in a loading state.
            const status = getSwapStatus(currentSwap);
            const s = String(status).toLowerCase();
            const isLoadingState = s === 'clientfunded' || s === 'serverfunded';
            if (isLoadingState) {
              setProcessingStatus(friendlyStatus(status));
              showScreen('screen-processing');
            }
          }
        } catch (err) {
          // silent — non-fatal
        }
        if (balancePolling) scheduleBalancePoll();
      }

      // ── Wallet deep link / MetaMask integration ───────────────────────
      function buildEip681Uri() {
        if (!currentTokenAddress || !currentDepositAddress || !currentChainId || !expectedAmountRaw) return null;
        // ERC-20 transfer: ethereum:<token>@<chainId>/transfer?address=<to>&uint256=<amount>
        return \`ethereum:\${currentTokenAddress}@\${currentChainId}/transfer?address=\${currentDepositAddress}&uint256=\${expectedAmountRaw.toString()}\`;
      }

      function openWallet() {
        const uri = buildEip681Uri();
        if (!uri) return;
        window.location.href = uri;
      }

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

      function isMobileDevice() {
          return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      }

      function showWalletButtons() {
        const uri = buildEip681Uri();
        const openBtn = document.getElementById('btn-open-wallet');
        const connectBtn = document.getElementById('btn-connect-pay');
        if (openBtn && isMobileDevice()) openBtn.style.display = uri ? 'block' : 'none';
        if (connectBtn && !isMobileDevice()) connectBtn.style.display = window.ethereum ? 'block' : 'none';
      }

      // ── initial QR (desktop) ──────────────────────────────────────────
      function loadSwapContext() {
        const raw = localStorage.getItem(SWAP_STORAGE_KEY);
        if (!raw) return null;
        try {
          return JSON.parse(raw);
        } catch (e) {
          return null;
        }
      }

      function saveSwapContext(context) {
        localStorage.setItem(SWAP_STORAGE_KEY, JSON.stringify(context));
        updateResumeButton();
      }

      function clearSwapContext() {
        localStorage.removeItem(SWAP_STORAGE_KEY);
        updateResumeButton();
      }

      function updateResumeButton() {
        const btn = document.getElementById('btn-resume-swap');
        if (!btn) return;
        btn.style.display = loadSwapContext() ? 'block' : 'none';
      }

      function formatNetworkLabel(network) {
        if (!network) return '';
        return network.charAt(0).toUpperCase() + network.slice(1);
      }

      function getTokenInfo(network, currency) {
        const entry = TOKEN_MAP[network?.toLowerCase()] || {};
        return entry[currency] || null;
      }

      function formatTokenAmount(raw, decimals) {
        if (!raw) return '';
        const rawStr = raw.toString();
        if (!decimals) return rawStr;
        const amount = raw / Math.pow(10,decimals)
        return amount.toFixed(2)
      }

      function setRecoveryStatus(message) {
        const el = document.getElementById('recovery-status');
        if (el) el.textContent = message;
      }


      function setCreatingStatus(msg, isError) {
        const statusEl = document.getElementById('creating-status');
        const errorEl = document.getElementById('creating-error');
        const spinnerEl = document.getElementById('creating-spinner');
        if (isError) {
          if (statusEl) statusEl.style.display = 'none';
          if (spinnerEl) spinnerEl.style.display = 'none';
          if (errorEl) { errorEl.textContent = msg; errorEl.style.display = 'block'; }
          const backBtn = document.getElementById('creating-back-btn');
          if (backBtn) backBtn.style.display = 'inline-block';
        } else {
          if (statusEl) { statusEl.textContent = msg; statusEl.style.display = 'block'; }
          if (errorEl) errorEl.style.display = 'none';
          if (spinnerEl) spinnerEl.style.display = 'inline-block';
        }
      }

  function setProcessingStatus(msg) {
    const el = document.getElementById('processing-status');
    if (el) el.textContent = msg;
  }

  // ── gear overlay ───────────────────────────────────────────────────
  function openGearOverlay() {
    document.getElementById('gear-overlay').classList.add('active');
  }

  function closeGearOverlay() {
    document.getElementById('gear-overlay').classList.remove('active');
  }

  async function revealGearSeed() {
    const wrapper = document.getElementById('seed-gear');
    const textEl = document.getElementById('seed-gear-text');
    if (!wrapper || !textEl) return;
    wrapper.style.display = 'block';
    textEl.textContent = 'Loading recovery seed…';
    try {
      const mnemonic = await PaylinkSwap.getMnemonic();
      textEl.textContent = mnemonic || 'Recovery seed unavailable.';
    } catch (err) {
      textEl.textContent = 'Unable to load recovery seed.';
    }
  }

    function copyGearSeed() {
      const textEl = document.getElementById('seed-gear-text');
      if (!textEl) return;
      navigator.clipboard.writeText(textEl.textContent || '');
      const btn = event.target; 
      const orig = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = orig; }, 2000);
    }

        // ── alert overlay ──────────────────────────────────────────────────
      function showAlert(message) {
        const el = document.getElementById('alert-message');
        if (el) el.textContent = message;
        document.getElementById('alert-overlay').classList.add('active');
      }

      function closeAlert() {
        document.getElementById('alert-overlay').classList.remove('active');
      }

      // ── Bitcoin flow ──────────────────────────────────────────────────
      async function startBtcFlow() {
        document.getElementById('btn-btc').disabled = true;
        try {
          const res = await fetch('/createPayLinkInvoice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paylinkId: PAYLINK_ID }),
          });
          const json = await res.json();
          if (!json || json.status !== 'SUCCESS' || !json.invoice) {
            showAlert('Could not create a Lightning invoice. Please try again.');
            document.getElementById('btn-btc').disabled = false;
            return;
          }
          showScreen('screen-btc');
          const qrEl = document.getElementById('qr-btc-invoice');
          qrEl.innerHTML = '';
          new QRCode(qrEl, {
            text: json.invoice.toUpperCase(),
            width: 220,
            height: 220,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.M,
          });
          bitcoinInvoice = json.invoice;
          startPolling();
        } catch (err) {
          showAlert('Network error. Please try again.');
          document.getElementById('btn-btc').disabled = false;
        }
      }

      function copyBitcoinAddress() {
        if (!bitcoinInvoice) return;
        event.preventDefault();
        navigator.clipboard.writeText(bitcoinInvoice);
        showAlert('Copied!');
      }

      function openBitcoinWallet() {
        if (!bitcoinInvoice) return;
        window.location.href = \`lightning:\${bitcoinInvoice}\`;
      }

      // ── Stablecoin flow ───────────────────────────────────────────────
      function showNetworkSelect() {
        if (${amount} < 500){
         showAlert('Minimum USDC/USDT amount is ${formatAmountLabel({ amount: 500 })}');
         return
        }
        showScreen('screen-network');
      }

      function selectNetwork(network) {
        selectedNetwork = network;
        document.querySelectorAll('.network-card').forEach(c => c.classList.remove('selected'));
        document.getElementById('card-' + network).classList.add('selected');
      }

      function selectCurrency(currency) {
        selectedCurrency = currency;
        document.getElementById('btn-usdc').classList.toggle('active', currency === 'USDC');
        document.getElementById('btn-usdt').classList.toggle('active', currency === 'USDT');
      }

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

      function getSwapStatus(swap) {
        return swap?.response?.status || swap?.status || '';
      }

      function getSwapAddress(swap) {
        return (
          swap?.response?.client_evm_address || swap?.client_evm_address
        );
      }

      function getSwapSourceAmount(swap) {
        return swap?.source_amount || swap?.response?.source_amount || '';
      }

      const TERMINAL_STATES = new Set([
        'serverredeemed', 'clientredeemed', 'clientredeeming',
        'clientrefunded', 'expired',
        'clientrefundedserverfunded', 'clientrefundedserverrefunded',
        'clientredeemedandclientrefunded',
      ]);
      const COLLAB_REFUND_STATUSES = new Set([
        'clientfundedserverrefunded', 'clientinvalidfunded',
        'clientfundedtoolate', 'serverpaymenterror',
      ]);

      function isTerminalSuccess(status) {
        const s = String(status).toLowerCase();
        return s === 'serverredeemed' || s === 'clientredeemed' || s === 'clientredeeming';
      }
      function isTerminalFailure(status) {
        const s = String(status).toLowerCase();
        return TERMINAL_STATES.has(s) && !isTerminalSuccess(s);
      }
      function needsCollabRefund(status) {
        return COLLAB_REFUND_STATUSES.has(String(status).toLowerCase());
      }

      const STATUS_LABELS = {
        clientfunded: 'Starting swap\u2026',
        serverfunded: 'Payment sent!',
        serverredeemed: 'Payment confirmed!',
        clientredeemed: 'Payment confirmed!',
        clientredeeming: 'Completing payment\u2026',
        expired: 'Swap expired.',
      };
      function friendlyStatus(s) {
        return STATUS_LABELS[String(s).toLowerCase()] || 'Processing Payment\u2026';
      }

      function updateSwapDetails(swap, context) {
        const address = getSwapAddress(swap);
        const amountRaw = getSwapSourceAmount(swap);
        const tokenInfo = getTokenInfo(selectedNetwork, selectedCurrency);
        const amountFormatted = tokenInfo
          ? formatTokenAmount(amountRaw, tokenInfo.decimals)
          : amountRaw;

        
        if (context === 'stable') {
          stableAddress = address;
          document.getElementById('stable-network-label').textContent =
            'Send ' + selectedCurrency + ' on ' + formatNetworkLabel(selectedNetwork);
          document.getElementById('stable-amount-label').textContent =
            amountFormatted ? \`\${amountFormatted} \${selectedCurrency}\` : '';
          document.getElementById('stable-address-text').textContent = address || '';

          const qrEl = document.getElementById('qr-stable-address');
          
          if (qrEl && address) {
            qrEl.innerHTML = '';
            new QRCode(qrEl, {
              text: address,
              width: 220,
              height: 220,
              colorDark: '#000000',
              colorLight: '#ffffff',
              correctLevel: QRCode.CorrectLevel.H,
            });
          }
        }

        if (context === 'recovery') {
          document.getElementById('recovery-address-text').textContent = address || '';
          document.getElementById('recovery-amount').textContent =
            amountFormatted ? \`Required: \${amountFormatted} \${selectedCurrency}\` : '';
          const qrEl = document.getElementById('qr-recovery-address');
          if (qrEl && address) {
            qrEl.innerHTML = '';
            new QRCode(qrEl, {
              text: address,
              width: 220,
              height: 220,
              colorDark: '#000000',
              colorLight: '#ffffff',
              correctLevel: QRCode.CorrectLevel.H,
            });
          }
        }
      }

      async function confirmStablecoin() {
        if (!selectedNetwork) {
          showAlert('Please select a network first.');
          return;
        }

        const tokenInfo = getTokenInfo(selectedNetwork, selectedCurrency);
        if (!tokenInfo) {
          showAlert('Selected token is not supported.');
          return;
        }

        const continueBtn = document.getElementById('btn-continue-stable');
        if (continueBtn) continueBtn.disabled = true;

        // Reset creating screen state
        const backBtn = document.getElementById('creating-back-btn');
        if (backBtn) { backBtn.style.display = 'none'; backBtn.setAttribute('onclick', "showScreen('screen-network')"); }
        const spinnerEl = document.getElementById('creating-spinner');
        if (spinnerEl) spinnerEl.style.display = 'inline-block';
        const statusEl = document.getElementById('creating-status');
        if (statusEl) statusEl.style.display = 'block';

        showScreen('screen-creating-swap');
        setCreatingStatus('Creating swap…');

        try {
          relayAttempted = false;
          const invoice = await createLightningInvoice();
          const swap = await PaylinkSwap.createSwap({
            sourceAsset: tokenInfo,
            targetAddress: invoice,
          });
          

          const swapId = swap?.response?.id || swap?.id;
          if (!swapId) {
            throw new Error('swap-id');
          }

          currentSwapId = swapId;
          currentSwap = swap;
          currentTokenAddress = tokenInfo.token_id;
          currentChainId = Number(tokenInfo.chain);
          currentDepositAddress = getSwapAddress(swap);
          expectedAmountRaw = swap?.response?.source_amount
            ? BigInt(Math.round(Number(swap.response.source_amount))) : null;
          saveSwapContext({ swapId, network: selectedNetwork, currency: selectedCurrency });
          updateSwapDetails(swap, 'stable');
          showWalletButtons();
          startSwapPolling();
          startBalancePolling();
          showScreen('screen-stable-pay');
        } catch (err) {
         console.log(err)
         setCreatingStatus('Failed to create swap. Please try again.', true)
        } finally {
          if (continueBtn) continueBtn.disabled = false;
        }
      }

      function startSwapPolling() {
        stopSwapPolling();
        swapPolling = true;
        if (document.visibilityState !== 'hidden') scheduleSwapPoll();
      }

      function scheduleSwapPoll() {
        swapPollTimer = setTimeout(doSwapPoll, 7000);
      }

      async function doSwapPoll() {
        swapPollTimer = null;
        if (!swapPolling || !currentSwapId) return;

        try {
          const swap = await PaylinkSwap.getSwap(currentSwapId);
          currentSwap = swap;
          const status = getSwapStatus(swap);
          console.log("Current swap poll", swap)

          if (isTerminalSuccess(status)) {
            clearSwapContext(); stopSwapPolling(); stopBalancePolling();
            showScreen('screen-success'); return;
          }
          if (isTerminalFailure(status)) {
            stopSwapPolling(); stopBalancePolling();
            setRecoveryStatus(friendlyStatus(status));
            updateSwapDetails(swap, 'recovery');
            showScreen('screen-recovery'); return;
          }
          if (needsCollabRefund(status)) {
            stopSwapPolling(); stopBalancePolling();
            setRecoveryStatus(\`Swap issue (\${status}) \u2014 your tokens can be refunded.\`);
            updateSwapDetails(swap, 'recovery');
            const collabBtn = document.getElementById('btn-collab-refund');
            if (collabBtn) collabBtn.style.setProperty('display', 'block');
            showScreen('screen-recovery'); return;
          }

          updateSwapDetails(swap, 'stable');
          setProcessingStatus(friendlyStatus(status))
        } catch (err) {
        //  silent error, will repoll next time
        }

        if (swapPolling) scheduleSwapPoll();
      }

      async function attemptRelay() {
        if (relayInFlight || relayAttempted || !currentSwapId) return;
        relayInFlight = true;
        relayAttempted = true;    // never reset automatically after being set
        try {
          setProcessingStatus('Payment Received\u2026')
          showScreen('screen-processing');
          stopBalancePolling();
          await PaylinkSwap.fundSwapGasless(currentSwapId);
        } catch (err) {
          // non-fatal
          startBalancePolling()
        } finally {
          relayInFlight = false;
        }
      }

      async function resumeSwapFromStorage() {
        relayAttempted = false;
        const context = loadSwapContext();
        if (!context || !context.swapId) return;
        currentSwapId = context.swapId;
        
        selectedNetwork = context.network;
        selectedCurrency = context.currency || 'USDC';

        // Reset creating screen and configure back button for resume path
        const backBtn = document.getElementById('creating-back-btn');
        if (backBtn) { backBtn.style.display = 'none'; backBtn.setAttribute('onclick', "showScreen('screen-initial')"); }
        const spinnerEl = document.getElementById('creating-spinner');
        if (spinnerEl) spinnerEl.style.display = 'inline-block';
        const statusEl = document.getElementById('creating-status');
        if (statusEl) statusEl.style.display = 'block';


        showScreen('screen-creating-swap');
        setCreatingStatus('Resuming swap…');
       

        try {
          const swap = await PaylinkSwap.getSwap(currentSwapId);
          
          currentSwap = swap;
          
          const tokenInfo = getTokenInfo(swap.chain, selectedCurrency);
          currentTokenAddress = tokenInfo.token_id;
          currentChainId = Number(tokenInfo.chain);
          currentDepositAddress = getSwapAddress(swap);
          expectedAmountRaw = swap?.source_amount
            ? BigInt(Math.round(Number(swap.source_amount))) : null;
          updateSwapDetails(swap, 'stable');
         
          const status = getSwapStatus(swap);

          if (isTerminalSuccess(status)) {
            clearSwapContext();
            showScreen('screen-success');
          } else if (needsCollabRefund(status)) {
            stopSwapPolling(); stopBalancePolling();
            setRecoveryStatus(\`Swap issue (\${status}) — your tokens can be refunded.\`);
            updateSwapDetails(swap, 'recovery');
            const collabBtn = document.getElementById('btn-collab-refund');
            if (collabBtn) collabBtn.style.setProperty('display', 'block');
            showScreen('screen-recovery');
          } else if (isTerminalFailure(status)) {
            stopSwapPolling(); stopBalancePolling();
            setRecoveryStatus(friendlyStatus(status));
            updateSwapDetails(swap, 'recovery');
            showScreen('screen-recovery');
          } else {
            const s = String(status).toLowerCase();
            const isProcessing = s === 'clientfunded' || s === 'serverfunded';
            updateSwapDetails(swap, 'stable');
            showWalletButtons();
            startSwapPolling();
            startBalancePolling();
            if (isProcessing) {
              setProcessingStatus(friendlyStatus(status));
              showScreen('screen-processing');
            } else {
              showScreen('screen-stable-pay');
            }
          }
        } catch (err) {
         console.log(err)
          setCreatingStatus('Unable to load swap. Please try again.', true);
        }
      }

      async function retryRelay() {
        if (!currentSwapId) return;
        setRecoveryStatus('Retrying relay…');
        try {
          await PaylinkSwap.fundSwapGasless(currentSwapId);
          setRecoveryStatus('Relay requested. Checking status…');
          refreshSwapStatus();
        } catch (err) {
          setRecoveryStatus('Relay retry failed. Please try again.');
        }
      }

      async function refreshSwapStatus() {
        if (!currentSwapId) return;
        try {
          const swap = await PaylinkSwap.getSwap(currentSwapId);
          currentSwap = swap;
          updateSwapDetails(swap, 'recovery');
          const status = getSwapStatus(swap);
          if (isTerminalSuccess(status)) {
            clearSwapContext();
            showScreen('screen-success');
            return;
          }
          if (isTerminalFailure(status)) {
            setRecoveryStatus(\`Swap status: \${status || 'failed'}\`);
            return;
          }
          setRecoveryStatus(\`Swap status: \${status || 'pending'}\`);
        } catch (err) {
          setRecoveryStatus('Unable to refresh status.');
        }
      }

      // ── Collaborative refund (gasless, instant) ───────────────────────────
      let pendingRefundTx = null;

      async function requestCollabRefund() {
        if (!currentSwapId) return;
        const btn = document.getElementById('btn-collab-refund');
        if (btn) btn.disabled = true;
        setRecoveryStatus('Requesting refund\u2026');
        try {
          await PaylinkSwap.collabRefundEvmSwap(currentSwapId);
          setRecoveryStatus('Refund submitted \u2014 funds will return to your wallet shortly.');
          clearSwapContext();
        } catch (err) {
          // Collab failed — fall back to timeout path
          setRecoveryStatus('Collaborative refund unavailable. Checking unilateral path\u2026');
          await requestTimeoutRefund();
        } finally {
          if (btn) btn.disabled = false;
        }
      }

      // ── Unilateral / timeout refund ───────────────────────────────────────
      async function requestTimeoutRefund() {
        if (!currentSwapId) return;
        setRecoveryStatus('Checking refund availability\u2026');
        try {
          const result = await PaylinkSwap.refundSwapTimeout(currentSwapId);
          const evm = result?.evmRefundData;
          if (!evm) {
            setRecoveryStatus('Could not retrieve refund data. Please contact support.');
            return;
          }
          if (!evm.timelockExpired) {
            const availableAt = new Date(evm.timelockExpiry * 1000).toLocaleString();
            setRecoveryStatus(\`Refund available at: \${availableAt}. Please return then.\`);
            startRefundCountdown(evm.timelockExpiry);
            return;
          }
          // Timelock expired — user must submit tx
          pendingRefundTx = { to: evm.to, data: evm.data };
          setRecoveryStatus('Refund ready. Submit the transaction with your EVM wallet.');
          const submitBtn = document.getElementById('btn-submit-refund');
          if (submitBtn) submitBtn.style.setProperty('display', 'block');
        } catch (err) {
          setRecoveryStatus('Refund check failed. Please try again.');
        }
      }

      async function submitRefundTx() {
        if (!pendingRefundTx || !window.ethereum) {
          setRecoveryStatus('Please submit manually: use the calldata above with your EVM wallet.');
          return;
        }
        try {
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          const chainHex = '0x' + currentChainId.toString(16);
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain', params: [{ chainId: chainHex }],
            });
          } catch (switchErr) { if (switchErr.code === 4902) throw switchErr; }
          const txHash = await window.ethereum.request({
            method: 'eth_sendTransaction',
            params: [{ from: accounts[0], to: pendingRefundTx.to, data: pendingRefundTx.data }],
          });
          setRecoveryStatus(\`Refund submitted: \${txHash.slice(0, 10)}\u2026\`);
          clearSwapContext();
        } catch (err) {
          if (err.code === 4001) setRecoveryStatus('Transaction cancelled.');
          else setRecoveryStatus('Failed to submit. Please use your wallet manually with the calldata shown.');
        }
      }

      function startRefundCountdown(timelockExpiry) {
        const el = document.getElementById('refund-countdown');
        if (!el) return;
        function tick() {
          const remaining = timelockExpiry * 1000 - Date.now();
          if (remaining <= 0) {
            el.textContent = 'Refund is now available.';
            const timeoutBtn = document.getElementById('btn-timeout-refund');
            if (timeoutBtn) timeoutBtn.style.setProperty('display', 'block');
            return;
          }
          const h = Math.floor(remaining / 3600000);
          const m = Math.floor((remaining % 3600000) / 60000);
          const s = Math.floor((remaining % 60000) / 1000);
          el.textContent = \`Available in \${h}h \${m}m \${s}s\`;
          setTimeout(tick, 1000);
        }
        tick();
      }

      // ── copy address ──────────────────────────────────────────────────
      function copyAddress() {
        if (!stableAddress) return;
        navigator.clipboard.writeText(stableAddress);
        const btn = event.target;
        const orig = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = orig; }, 2000);
      }


      // ── payment polling ───────────────────────────────────────────────
      function startPolling() {
        stopPolling();
        shouldPoll = true;
        if (document.visibilityState !== 'hidden') _schedulePoll();
      }

      function _schedulePoll() {
        pollTimer = setTimeout(_doPoll, 8000);
      }

      async function _doPoll() {
        pollTimer = null;
        if (!shouldPoll) return;
        try {
          const res = await fetch('/getPaylinkData', {
            method: 'POST',
            body: JSON.stringify({ paylinkId: PAYLINK_ID, checkInvoice: true }),
            signal: AbortSignal.timeout(6000),
          });
          if (res.ok) {
            const json = await res.json();
            if (json?.data?.isPaid) {
              stopPolling();
              showScreen('screen-success');
              return;
            }
          }
        } catch (err) {
          // transient error — still reschedule
        }
        if (shouldPoll) _schedulePoll();
      }

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          if (pollTimer) { clearTimeout(pollTimer); pollTimer = null; }
        } else if (shouldPoll && !pollTimer) {
          _schedulePoll();
        }
      });

      // ── init ──────────────────────────────────────────────────────────
      document.addEventListener('DOMContentLoaded', () => {
        updateResumeButton();
        const existingSwap = loadSwapContext();
        if (existingSwap && existingSwap.swapId) {
          resumeSwapFromStorage();
        }
      });
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
