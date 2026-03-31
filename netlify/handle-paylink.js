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
  const amountLabel = amount
    ? `<p class="amount"><span style="font-weight:400;">₿</span>${amount.toLocaleString("en-US")}</p>`
    : "";
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
     <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Noto+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">

     <!-- Lucide Icons -->
    <script src="https://unpkg.com/lucide@latest"></script>

    <!-- QR Code Library -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>

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
        min-height: 100dvh;
        display: flex;
        align-items: center;
        justify-content: center;
         padding: calc(70px + 1rem) 1rem 1rem;
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
        padding: 1rem;
        border-radius: 20px;
        display: inline-block;
        border: 2px solid var(--lm-backgroundOffset);
      }

      .qr-wrapper:not(:first-child) {
        cursor: pointer;
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
        align-items: center;
        justify-content: center;
        margin-bottom: 1rem;
      }

      .request-text {
        text-align: center;
        flex: 1;
        gap: 1rem;
      }

      .request-text .requester {
       margin-bottom: 1rem;
      }

      .requester {
        font-size: 1.1rem;
        opacity: 0.7;
      }

      .amount {
        font-size: 3rem;
        font-weight: 500;
        color: var(--primary_color);
        line-height: 1.1;
        margin-bottom: 1rem;
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
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.network-card {
  border: 2px solid var(--lm-backgroundOffset);
  border-radius: 12px;
  padding: 1rem 0.5rem;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  text-align: center;
  width: 100%;
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
        width: 100%;
        background: var(--lm-background);
        border-radius: 10px;
        padding: 0.75rem 1rem;
        font-family: monospace;
        font-size: 0.85rem;
        word-break: break-all;
        margin: 1rem auto 0;
        cursor: pointer;
        white-space: nowrap;       /* Prevent wrapping */
        overflow: hidden;          /* Hide overflow */
        text-overflow: ellipsis;   /* Show ... */
        display: block;            /* Or inline-block */
      }


      #screen-refund-address .screen-desc { 
        max-width: 400px;
        font-size: 0.9rem;
        opacity: 0.65;
        margin: 0 auto 1.5rem;
      }

      .refund-input {
        width: 100%;
        box-sizing: border-box;
        padding: 0.75rem 1rem;
        border: 2px solid var(--lm-backgroundOffset);
        border-radius: 10px;
        font-size: 0.95rem;
        background: var(--lm-background);
        color: var(--lm-text);
        margin: 1rem 0 0.5rem;
        outline: none;
        transition: border-color 0.2s ease;
      }
      .refund-input:focus {
        border-color: var(--primary_color);
      }
      .hint {
        font-size: 0.8rem;
        color: var(--lm-textSecondary, #888);
        margin-bottom: 1.25rem;
        text-align: left;
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
    </style>
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
            <p class="loading-status" id="processing-status">Deposit received…</p>
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
              ${amountLabel}
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
          <p class="requester">Pay ${username} via Lightning</p>
          <p class="status-text amount" style="margin-bottom:1.5rem; margin-top:0.5rem; font-size:1.5rem;"><span style="font-weight:400;">₿</span>${amount.toLocaleString("en-US")}</p>
          <div onclick="copyAddress()" class="qr-wrapper">
            <div id="qr-btc-invoice"></div>
          </div>
          <div class="waiting-text">
            <span class="waiting-dot"></span>
            <span class="waiting-dot"></span>
            <span class="waiting-dot"></span>
            <span style="margin-left:0.25rem;">Waiting for payment</span>
          </div>
          <div onclick="copyAddress()" class="address-box" id="bitcoin-address-text"></div>
          <button class="btn-primary" onclick="openBitcoinWallet()" id="bitcoin-open-buttn" style="display:none;">Open Wallet</button>
        </div>

        <!-- Screen 2b: Network selection -->
        <div id="screen-network" class="screen">
         <button class="btn-back" onclick="goBack()"><i data-lucide="arrow-left"></i> Back</button>
          <p class="screen-title" style="margin-bottom:4px;">Pay with stablecoin</p>
          <p style="font-size:0.9rem;opacity:0.65;margin-bottom:1.5rem;">Choose a token and the chain you'll send from.</p>
           <p class="section-label" style="margin-bottom:0.5rem;">Token</p>
            <div class="currency-toggle">
            <button id="btn-usdc" class="active" onclick="selectCurrency('USDC')">USDC</button>
            <button id="btn-usdt" onclick="selectCurrency('USDT')">USDT</button>
          </div>
          <p class="section-label" style="margin-bottom:0.5rem;">Network</p>
          <div class="network-cards" id="network-grid">
            <!-- populated dynamically by showNetworkSelect() -->
          </div>
         
          <button class="btn-primary" id="btn-continue-stable" onclick="proceedToRefundAddress()">Continue</button>
        </div>


        <!-- Screen 2c: Refund address -->
        <div id="screen-refund-address" class="screen">
          <button class="btn-back" onclick="showScreen('screen-network')"><i data-lucide="arrow-left"></i> Back</button>
          <h2 class="screen-title" style="margin-bottom: 4px;">Refund address</h2>
          <p class="screen-desc">Adding a refund address means if the swap fails you will get your money back.</p>
          <input
            type="text"
            id="refund-address-input"
            class="refund-input"
            placeholder="Enter refund address"
          />
          <p class="hint">Refund addresses are optional.</p>
          <button class="btn btn-primary" onclick="proceedFromRefundAddress()">Continue</button>
        </div>

        <!-- Screen 3: Stablecoin deposit -->
        <div id="screen-stable-pay" class="screen">
          <p class="requester" id="stable-network-label"></p>
          <p class="status-text amount" id="stable-amount-label" style="margin-bottom:1.5rem; margin-top:0.5rem; font-size:1.5rem;"></p>
          <div onclick="copyAddress()" class="qr-wrapper">
            <div id="qr-stable-address"></div>
          </div>
          <div onclick="copyAddress()" class="address-box" id="stable-address-text"></div>
          <button class="btn-primary" id="btn-open-wallet" onclick="openWallet()" style="display:none;">Open Wallet</button>
          <button class="btn-primary" id="btn-connect-pay" onclick="connectAndPay()" style="display:none;">Connect &amp; Pay</button>
        </div>

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

        <!-- Screen 4: Success -->
        <div id="screen-success" class="screen">
           <div class="success-icon">
              <i data-lucide="check"></i>
            </div>
          <h2 class="success-title">Payment received!</h2>
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
      let balanceWatcher = null;
      let pollTimer = null;
      let shouldPoll = false;
      let pollCount = 0;
      const MAX_POLLS = 50;
      let bitcoinInvoice = null;
      let processingStatusTimer = null;
      let processingStatusIndex = 0;
      let refundAddress = null;
      const processingStatusMessages = [
        'Deposit received…',
        'Securing funds…',
        'Preparing relay…',
        'Routing through Flashnet…',
        'Building transaction…',
        'Waiting for finality…',
        'Updating balances…',
        'Finalizing transfer…',
        'Updating balances…',
        'Almost done…',
        'Updating balances…',
        'Routing through Flashnet…',
      ];

      // ── screen navigation ─────────────────────────────────────────────
      function showScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(id).classList.add('active');
        if (id === 'screen-processing') {
          startProcessingStatusLoop();
        } else {
          stopProcessingStatusLoop();
        }
      }

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

      function stopPolling() {
        shouldPoll = false;
        if (pollTimer) { clearTimeout(pollTimer); pollTimer = null; }
      }   

      // ── Wallet deep link / MetaMask integration ───────────────────────
      function buildEip681Uri() {
        if (!currentTokenAddress || !depositAddress || !currentChainId || !amountInRaw) return null;
        // ERC-20 transfer per EIP-681; uint256 value is decimal (not hex)
        return \`ethereum:\${currentTokenAddress}@\${currentChainId}/transfer?address=\${depositAddress}&uint256=\${amountInRaw.toString()}\`;
      }

      function openWallet() {
        const uri = buildEip681Uri();
        if (!uri) return;
        window.location.href = uri;
      }

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

      function isMobileDevice() {
          return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      }

      function showWalletButtons() {
        const uri = buildEip681Uri();
        const openBtn = document.getElementById('btn-open-wallet');
        const connectBtn = document.getElementById('btn-connect-pay');
        if (openBtn) openBtn.style.display = (isMobileDevice() && uri) ? 'block' : 'none';
        if (connectBtn) connectBtn.style.display = (!isMobileDevice() && !!window.ethereum) ? 'block' : 'none';
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
      }

      function clearSwapContext() {
        localStorage.removeItem(SWAP_STORAGE_KEY);
      }

      function formatNetworkLabel(network) {
        if (!network) return '';
        return network.charAt(0).toUpperCase() + network.slice(1);
      }

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
        if (balanceWatcher) { balanceWatcher.stop(); balanceWatcher = null; }

        // Validate format
        const isEVM    = /^0x[0-9a-fA-F]{64}$/.test(txHash);
        const isNonEVM = !currentChainId && txHash.trim().length > 10;
        if (!isEVM && !isNonEVM) {
          txHashSubmitted = false;
          showTxHashError('Invalid transaction hash format.');
          return;
        }

       showScreen('screen-processing');
       startIsPaidPolling();
        try {
          const res = await fetch('/submitPaylinkSwap', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              paylinkId: PAYLINK_ID,
              txHash,
              sourceAddress: sourceAddress || null,
            }),
          });
          const json = await res.json();
          if (!json || json.status !== 'SUCCESS') throw new Error('submit-failed');
          saveSwapContext({ txHash, sourceAddress: sourceAddress || null });
        } catch (err) {
          txHashSubmitted = false;
          showScreen('screen-stable-pay');
          showTxHashError('Submission failed. Please try again.');
        }
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

  function startProcessingStatusLoop() {
    stopProcessingStatusLoop();
    processingStatusIndex = 0;
    setProcessingStatus(processingStatusMessages[processingStatusIndex]);
    processingStatusTimer = setInterval(() => {
      processingStatusIndex = (processingStatusIndex + 1) % processingStatusMessages.length;
      setProcessingStatus(processingStatusMessages[processingStatusIndex]);
    }, 5000);
  }

  function stopProcessingStatusLoop() {
    if (processingStatusTimer) {
      clearInterval(processingStatusTimer);
      processingStatusTimer = null;
    }
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
          const address = document.getElementById('bitcoin-address-text');
          const openWalletButton = document.getElementById('bitcoin-open-buttn');
          depositAddress = json.invoice;
          if (address) address.innerHTML = json.invoice
          if (openWalletButton && isMobileDevice()) openWalletButton.style.display = 'block'

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
         console.log(err)
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

      function updateCurrencyGrid(){
        const grid = document.getElementById('network-grid');
        if (grid) {
          const networks = CURRENCY_NETWORKS[selectedCurrency] || [];
          console.log(CURRENCY_NETWORKS,selectedCurrency,networks  )
          grid.innerHTML = networks.map(n =>
            \`<div class="network-card" id="card-\${n}" onclick="selectNetwork('\${n}')">\${NETWORK_LABELS[n]}</div>\`
          ).join('');
        }
      }

      // ── Stablecoin flow ───────────────────────────────────────────────
      function showNetworkSelect() {
        if (${amount} < 1300){
         showAlert('Minimum USDC/USDT amount is ${formatAmountLabel({ amount: 1300 })}');
         return
        }
       updateCurrencyGrid()
        
        showScreen('screen-network');
      }

       function selectNetwork(network) {
        selectedNetwork = network;
        document.querySelectorAll('.network-card').forEach(c => c.classList.remove('selected'));
        const card = document.getElementById('card-' + network);
        if (card) card.classList.add('selected');
      }

      function selectCurrency(currency) {
        selectedCurrency = currency;
        selectedNetwork = null; // reset network selection when currency changes
        const usdcBtn = document.getElementById('btn-usdc');
        const usdtBtn = document.getElementById('btn-usdt');
        if (usdcBtn) usdcBtn.classList.toggle('active', currency === 'USDC');
        if (usdtBtn) usdtBtn.classList.toggle('active', currency === 'USDT');
        updateCurrencyGrid()
      }


      function proceedToRefundAddress() {
        if (!selectedNetwork) {
          showAlert('Please select a network.');
          return;
        }
        // Clear previous refund address input and update placeholder to reflect selected chain
        const input = document.getElementById('refund-address-input');
        if (input) {
          input.value = '';
          const label = NETWORK_LABELS[selectedNetwork] || selectedNetwork;
          input.placeholder = \`Your \${label} address\`;
        }
        refundAddress = null;
        showScreen('screen-refund-address');
      }

    function proceedFromRefundAddress() {
      const input = document.getElementById('refund-address-input');
      refundAddress = input ? input.value.trim() : null;
      if (!refundAddress) refundAddress = null; // normalize empty string to null
      confirmStablecoin();
    }


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
            body: JSON.stringify({
              paylinkId: PAYLINK_ID,
              network: selectedNetwork,
              currency: selectedCurrency,
              ...(refundAddress ? { refundAddress } : {}),
            })
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
          if (amountLabelEl) amountLabelEl.textContent = formatTokenAmount(amountInRaw, 6) + ' ' + selectedCurrency;
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
            balanceWatcher = PaylinkSwap.pollForBalance({
              tokenAddress: currentTokenAddress,
              depositAddress,
              chainId: currentChainId,
              expectedAmount: amountInRaw,
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

     
      // ── copy address ──────────────────────────────────────────────────
      function copyAddress() {
        if (!depositAddress) return;
        navigator.clipboard.writeText(depositAddress);
        showAlert('Text copied successfully!')
      }


      // ── payment polling ───────────────────────────────────────────────
      function startPolling() {
        stopPolling();
        shouldPoll = true;
        if (document.visibilityState !== 'hidden') _schedulePoll();
      }

      function _schedulePoll() {
        pollTimer = setTimeout(_doPoll, 5000);
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
        const stored = loadSwapContext();
        // Resume if we have a txHash from a previous submission.
        // Discard stale Lendaswap entries (those have a swapId key).
        if (stored && stored.txHash && !stored.swapId) {
          txHashSubmitted = true;
          showScreen('screen-processing');
          startIsPaidPolling();
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
