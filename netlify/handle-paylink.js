import { signedRequestHeaders, PROXY_ORIGIN } from "./lib/sign-request.js";
import { designCss } from "./lib/design-css.js";

// ── 1. Fetch paylink data from Cloud Function ──────────────────────────────

async function fetchFreshPaylinkData(paylinkId, baseUrl) {
  try {
    const res = await fetch(PROXY_ORIGIN + "/getPaylinkData", {
      method: "POST",
      headers: signedRequestHeaders(),
      body: JSON.stringify({
        paylinkId,
        shouldLoadBitcoinPrice: true,
      }),
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

async function fetchPaylinkData(paylinkId, baseUrl) {
  const promise = fetchFreshPaylinkData(paylinkId, baseUrl);
  const data = await promise;
  return data;
}

// ── 2. Format amount label ─────────────────────────────────────────────────

function formatAmountLabel(data) {
  if (!data) return null;
  if (data.currencyType !== "BTC" && Number(data.displayAmount ?? 0) > 0) {
    const rawAmount = Number(data.displayAmount);
    return `$${rawAmount.toFixed(2).toLocaleString("en-US")}`;
  }
  const amount = Number(data.amount ?? 0);
  return `₿${amount.toLocaleString("en-US")}`;
}

// ── 3. Build OG image URL ──────────────────────────────────────────────────

function buildOgImageUrl(baseUrl, paylinkId, data) {
  return (
    baseUrl +
    "/og-paylink" +
    "?amount=" +
    (data.amount ?? 0) +
    "&rawAmount=" +
    (data.rawAmount ?? 0) +
    "&currencyType=" +
    (data.currencyType ?? "BTC") +
    "&v=3"
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
  // Only inlinedData (to seed the client) and amount (a numeric fallback below)
  // are still consumed server-side. All display text is now rendered client-side
  // from the live fetch — see renderInitialScreen() — so the server no longer
  // bakes username/amount/description into the markup.
  const inlinedData = JSON.stringify(paylinkData ?? null);
  const amount = Number(paylinkData?.amount ?? 0);

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
    <meta property="og:image:type"   content="image/png" />
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
        min-height: 100dvh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: calc(70px + 1rem) 1rem 2rem;
        flex-direction: column;
      }

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

      nav a { display: flex; }
      nav img { height: 40px; }

      .nav-download-btn {
        background: var(--color-brand);
        color: white;
        padding: 0.6rem 1.2rem;
        border-radius: 50px;
        font-weight: 500;
        font-size: 0.9rem;
        text-decoration: none;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px var(--color-brand-strong);
        margin-left: auto;
      }

      .nav-download-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px var(--color-brand-strong);
      }

      /* Nav swap-history (gear) button */
      #gear-btn {
        background: var(--color-bg);
        border: none;
        cursor: pointer;
        color: var(--color-ink);
        padding: 0.4rem;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: opacity 0.2s;
        margin-left: 10px;
      }
      #gear-btn:hover { opacity: 0.7; }
      #gear-btn svg { width: 28px; height: 28px; }

      /* Download Modal */
      .modal-backdrop {
        position: fixed;
        inset: 0;
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

      .modal-container.active { bottom: 0; }

      .download-modal {
        background: var(--color-surface);
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

      .modal-close:hover { background: var(--color-ink); }
      .modal-close svg { width: 20px; height: 20px; color: var(--color-ink); }
      .modal-close:hover svg { color: white; }

      .modal-header { text-align: center; margin-bottom: 2rem; }
      .modal-header h2 { font-size: 1.8rem; margin-bottom: 0.5rem; color: var(--color-ink); }
      .modal-header p { color: var(--color-ink); opacity: 0.7; }

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

      .modal-tab svg { width: 18px; height: 18px; }

      .modal-tab.active {
        background: var(--color-surface);
        color: var(--color-brand);
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      }

      .modal-content { text-align: center; }

      /* Base QR box (download modal) */
      .qr-wrapper {
        background: var(--color-surface);
        padding: 1rem;
        border-radius: 20px;
        display: inline-block;
        border: 2px solid var(--color-surface-offset);
      }

      #qr-code { display: block; }

      .modal-instructions {
        font-size: 0.95rem;
        color: var(--color-ink);
        opacity: 0.8;
        margin-bottom: 1.5rem;
      }

      .store-badges { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }

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

      .store-badge svg { width: 24px; height: 24px; }
      .store-badge:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15); }

      /* ── Card + screen system ──────────────────────────────────────────── */
      .paylink-container { width: 100%; max-width: 550px; margin: 0 auto; }

      .paylink-card {
        display: flex;
        justify-content: center;
        background: var(--color-surface);
        border-radius: 24px;
        padding: 2rem;
        box-shadow: var(--shadow-card);
        border: 1px solid var(--color-surface-offset);
        position: relative;
      }

      .tips-screen {
        display: none;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        width: 100%;
        animation: fadeIn 0.2s ease;
      }
      .tips-screen.active { display: flex; }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(6px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      .screen-title {
        font-size: 1.25rem;
        font-weight: 500;
        color: var(--color-ink);
        text-align: center;
        margin: 0 0 0.5rem;
      }

      .screen-subtitle {
        font-size: 0.875rem;
        color: var(--color-ink-60);
        text-align: center;
        margin: 0;
      }

      /* ── Initial payment chooser ───────────────────────────────────────── */
      .request-text { text-align: center; margin-bottom: 0.5rem; }

      .requester { font-size: 1.05rem; color: var(--color-ink-60); }

      .amount {
        font-size: 2.5rem;
        font-weight: 500;
        color: var(--color-brand);
        line-height: 1.1;
        margin: 0.35rem 0;
      }

      .pay-description { font-size: 0.95rem; color: var(--color-ink-60); }

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

      .options-text{
       opacity:0.5;
      
      }

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
      .payment-option-icon-wrap--cashapp { background: #00d54b; }
      .payment-option-icon-wrap--cashapp img { width: 62%; height: 62%; }

      .payment-option-text { flex: 1; display: flex; flex-direction: column; gap: 2px; }
      .payment-option-label { font-weight: 500; font-size: 0.95rem; color: var(--color-ink); }
      .payment-option-sub { font-size: 0.8rem; color: var(--color-ink-60); }

      /* ── Currency toggle + network grid ────────────────────────────────── */
      .currency-toggle {
        display: flex;
        gap: 0.5rem;
        background: var(--color-surface-warm);
        border-radius: 10px;
        padding: 4px;
        width: 100%;
      }

      .currency-toggle-btn {
        flex: 1;
        padding: 0.5rem;
        border: none;
        border-radius: 8px;
        background: transparent;
        font-weight: 500;
        font-size: 0.9rem;
        cursor: pointer;
        color: var(--color-ink-60);
        font-family: var(--font-sans);
        transition: background 0.15s, color 0.15s;
      }

      .currency-toggle-btn.active {
        background: var(--color-surface);
        color: var(--color-ink);
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
      }

      .network-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.75rem;
        width: 100%;
      }

      .network-card {
        padding: 0.875rem;
        background: var(--color-surface);
        border: 1.5px solid var(--color-surface-offset);
        border-radius: 10px;
        text-align: center;
        font-weight: 500;
        font-size: 0.9rem;
        cursor: pointer;
        color: var(--color-ink);
        transition: border-color 0.15s, box-shadow 0.15s;
      }

      .network-card:hover { border-color: var(--color-brand); }

      .network-card.selected {
        border-color: var(--color-brand);
        background: rgba(3, 117, 246, 0.06);
        color: var(--color-brand);
        box-shadow: 0 0 0 3px rgba(3, 117, 246, 0.12);
      }

      /* ── Refund input ──────────────────────────────────────────────────── */
      .refund-input {
        width: 100%;
        padding: 0.875rem 1rem;
        border: 1.5px solid var(--color-surface-offset);
        border-radius: 10px;
        font-size: 0.9rem;
        outline: none;
        box-sizing: border-box;
        font-family: var(--font-sans);
        background: var(--color-surface);
        color: var(--color-ink);
        transition: border-color 0.15s;
      }
      .refund-input:focus { border-color: var(--color-brand); }

      .hint { font-size: 0.8rem; color: var(--color-ink-45); text-align: center; margin: 0; }

      /* ── Action buttons (inside screens) ───────────────────────────────── */
      .action-button {
        width: 100%;
        padding: 1rem;
        border: none;
        border-radius: 12px;
        font-size: 1rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
        font-family: var(--font-sans);
      }

      .action-button.primary {
        background: var(--color-brand);
        color: white;
        box-shadow: 0 4px 15px var(--color-brand-strong);
      }
      .action-button.primary:hover { transform: translateY(-2px); box-shadow: 0 6px 20px var(--color-brand-strong); }

      .action-button.secondary {
        background: transparent;
        color: var(--color-ink);
        border: 1px solid var(--color-surface-offset);
      }
      .action-button.secondary:hover { background: var(--color-surface-warm); }

      .action-button:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }

      .btn-back {
        align-self: flex-start;
        background: none;
        border: none;
        color: var(--color-brand);
        font-family: var(--font-sans);
        font-size: 0.95rem;
        font-weight: 500;
        cursor: pointer;
        padding: 0.25rem 0;
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
      }
      .btn-back:hover { opacity: 0.75; }
      .btn-back svg { width: 18px; height: 18px; }

      /* ── Creating / processing loaders ─────────────────────────────────── */
      .creating-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        padding: 2rem 0;
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

      /* ── QR screens ────────────────────────────────────────────────────── */
      .qr-screen-title { font-weight: 500; font-size: 1.1rem; text-align: center; margin: 0; color: var(--color-ink); }

      .qr-amount {
        font-size: 1.5rem;
        font-weight: 500;
        line-height: 1.1;
        color: var(--color-brand);
        margin: 0;
        text-align: center;
      }

      .paylink-card .qr-wrapper {
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
        align-self: center;
      }

      .paylink-card .qr-wrapper.clickable { cursor: pointer; }
      .paylink-card .qr-wrapper.clickable:hover { opacity: 0.92; }

      #qr-stable-address,
      #invoice-qr-code {
        display: flex;
        justify-content: center;
        align-items: center;
        background: white;
        padding: 6%;
        border-radius: 12px;
      }

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
        width: calc(100% - 100px);
        font-size: 0.85rem;
        color: var(--color-ink);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        margin-right: auto;
      }

      .stable-tron-submit {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        width: 100%;
        padding-top: 1rem;
        border-top: 1px solid var(--color-surface-offset);
      }
      .stable-tron-submit .screen-subtitle { margin: 0; }

      .qr-actions { display: flex; flex-direction: column; gap: 0.75rem; width: 100%; }

      /* ── Success screen ────────────────────────────────────────────────── */
      .success-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        padding: 1.5rem 0;
      }

      .success-icon {
        width: 72px;
        height: 72px;
        background: var(--color-brand);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
      }
      .success-icon svg { width: 38px; height: 38px; }

      .success-title { font-size: 1.35rem; font-weight: 500; color: var(--color-ink); margin: 0; }
      .success-sub { font-size: 0.9rem; color: var(--color-ink-60); margin: 0; text-align: center; }

      /* ── Already-paid notice ───────────────────────────────────────────── */
      .paid-notice {
        width: 100%;
        font-size: 0.9rem;
        color: var(--color-brand);
        background: rgba(3, 117, 246, 0.08);
        border-radius: 10px;
        padding: 0.75rem 1rem;
        text-align: center;
        display: none;
      }

      /* ── Swap history overlay ──────────────────────────────────────────── */
      #swap-history-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.6);
        z-index: 200;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
      }
      #swap-history-modal {
        background: var(--color-surface);
        border-radius: 1rem;
        width: 100%;
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
        color: var(--color-ink);
        position: sticky;
        top: 0;
        z-index: 99;
        background: var(--color-surface);
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
        border-top: 1px solid var(--color-surface-offset);
        padding: 0.75rem 0;
        color: var(--color-ink);
      }
      .swap-history-item:first-child { border-top: none; }
      .swap-quote { display: flex; align-items: center; gap: 10px; }
      .chain-icon-wrapper { position: relative; width: 36px; height: 36px; flex-shrink: 0; }
      .chain-icon { width: 36px; height: 36px; border-radius: 50%; }
      .token-overlay { position: absolute; bottom: -4px; right: -4px; width: 18px; height: 18px; border-radius: 50%; }
      .quote-middle { flex: 1; min-width: 0; }
      .quote-id { font-size: 0.75rem; word-break: break-all; opacity: 0.9; }
      .quote-time { font-size: 0.7rem; opacity: 0.45; margin-top: 2px; }
      .copy-btn {
        font-size: 0.7rem;
        padding: 0.15rem 0.4rem;
        border-radius: 4px;
        border: 1px solid var(--color-surface-offset);
        background: transparent;
        color: inherit;
        cursor: pointer;
        white-space: nowrap;
        flex-shrink: 0;
      }
      .copy-btn:hover { background: var(--color-surface-warm); }
      .copy-btn.copied { border-color: var(--color-brand); color: var(--color-brand); }

      @media (max-width: 500px) {
        .paylink-card { padding: 1.75rem 1.25rem; }
        .amount { font-size: 2.1rem; }
        .download-modal { padding: 2.5rem 1.5rem 2rem; }
        .modal-header h2 { font-size: 1.5rem; }
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
        <div onclick="showSwapHistory()" id="gear-btn">
          <i class="historyIcon" data-lucide="history"></i>
        </div>
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

    <!-- Swap history overlay -->
    <div onclick="hideSwapHistory(event)" id="swap-history-overlay" style="display:none;">
      <div id="swap-history-modal" onclick="event.stopPropagation()">
        <div class="swap-history-header">
          <span>Swap History</span>
          <button onclick="hideSwapHistory(event)"><i data-lucide="x"></i></button>
        </div>
        <div id="swap-history-list"></div>
      </div>
    </div>

    <!-- Alert overlay: replaces native alert() -->
    <div id="alert-overlay" class="overlay-backdrop">
      <div class="overlay-card">
        <p class="overlay-title">Notice</p>
        <p id="alert-message" class="overlay-body"></p>
        <button class="btn-primary" style="width:100%;" onclick="closeAlert()">OK</button>
      </div>
    </div>

    <div class="paylink-container">
      <div class="paylink-card">

        <!-- Screen 0: Loading -->
        <div id="screen-loading" class="tips-screen active">
          <div class="creating-content">
            <div class="spinner" style="--spinner-size: 40px;"></div>
          </div>
        </div>

        <!-- Screen 1: initial payment chooser -->
        <div id="screen-initial" class="tips-screen">
          <div class="request-text">
            <p class="requester" id="initial-requester"></p>
            <p class="amount" id="initial-amount" style="display:none;"></p>
            <p class="pay-description" id="initial-description" style="display:none;"></p>
          </div>
          <div id="paid-notice" class="paid-notice">This payment has already been completed.</div>
          <div class="payment-options" id="payment-options">
            <p class="options-text">Pay with</p>
            <button class="payment-option-btn" id="btn-btc" onclick="startBtcFlow()">
              <span class="payment-option-icon-wrap payment-option-icon-wrap--bitcoin">
                <img src="/src/assets/images/bitcoinIcon.png" alt="Bitcoin" />
              </span>
              <span class="payment-option-text">
                <span class="payment-option-label">Bitcoin</span>
                <span class="payment-option-sub">Via Lightning</span>
              </span>
            </button>
            <button class="payment-option-btn" id="btn-stable" onclick="showNetworkSelect()">
              <span class="payment-option-icon-wrap payment-option-icon-wrap--stable">
                <img src="/src/assets/images/dollarIcon.png" alt="Stablecoins" />
              </span>
              <span class="payment-option-text">
                <span class="payment-option-label">Stablecoins</span>
                <span class="payment-option-sub">USDC or USDT</span>
              </span>
            </button>
            <button class="payment-option-btn" id="btn-cashapp" onclick="startCashAppFlow()">
              <span class="payment-option-icon-wrap payment-option-icon-wrap--cashapp">
                <img src="/src/assets/images/cashapp-logo.svg" alt="Cash App" />
              </span>
              <span class="payment-option-text">
                <span class="payment-option-label">Cash App</span>
                <span class="payment-option-sub">Pay instantly</span>
              </span>
            </button>
          </div>
        </div>

        <!-- Screen 2: Network selection -->
        <div id="screen-network" class="tips-screen">
          <button class="btn-back" onclick="showScreen('screen-initial')"><i data-lucide="arrow-left"></i> Back</button>
          <h2 class="screen-title">Pay with stablecoin</h2>
          <p class="screen-subtitle">Choose a token and the chain you'll send from.</p>
          <div class="currency-toggle">
            <button id="btn-usdc" class="currency-toggle-btn active" onclick="selectCurrency('USDC')">USDC</button>
            <button id="btn-usdt" class="currency-toggle-btn" onclick="selectCurrency('USDT')">USDT</button>
          </div>
          <div class="network-grid" id="network-grid"></div>
          <button class="action-button primary" id="btn-continue-stable" onclick="proceedToRefundAddress()">Continue</button>
        </div>

        <!-- Screen 3: Refund address -->
        <div id="screen-refund-address" class="tips-screen">
          <button class="btn-back" onclick="showScreen('screen-network')"><i data-lucide="arrow-left"></i> Back</button>
          <h2 class="screen-title">Refund address</h2>
          <p class="screen-subtitle">If the swap fails, funds will be returned to this address.</p>
          <input type="text" id="refund-address-input" class="refund-input" placeholder="Your address (optional)" />
          <p class="hint">Refund addresses are optional.</p>
          <button class="action-button primary" onclick="proceedFromRefundAddress()">Continue</button>
        </div>

        <!-- Screen: creating swap -->
        <div id="screen-creating-swap" class="tips-screen">
          <div class="creating-content">
            <div class="creating-spinner" id="creating-spinner"></div>
            <p class="creating-status" id="creating-status">Creating swap…</p>
            <p class="creating-error" id="creating-error" style="display:none;"></p>
            <button class="action-button secondary" id="creating-back-btn" style="display:none;" onclick="showScreen('screen-network')">Go back</button>
          </div>
        </div>

        <!-- Screen: creating invoice -->
        <div id="screen-creating-invoice" class="tips-screen">
          <div class="creating-content">
            <div class="creating-spinner"></div>
            <p class="creating-status">Creating invoice…</p>
          </div>
        </div>

        <!-- Screen: stablecoin deposit -->
        <div id="screen-stable-pay" class="tips-screen">
          <p class="qr-screen-title" id="stable-screen-title"></p>
          <p class="qr-amount" id="stable-amount"></p>
          <div class="qr-wrapper clickable" id="stable-qr-wrapper">
            <div id="qr-stable-address"></div>
            <span class="qr-tap-hint"><i data-lucide="copy"></i> Tap to copy</span>
          </div>
          <div class="qr-copy-row">
            <span class="qr-copy-text" id="stable-address-text"></span>
            <button class="qr-clipboard-btn" id="copy-stable-addr-btn" aria-label="Copy address"><i data-lucide="copy"></i></button>
          </div>
          <div class="stable-tron-submit" id="stable-tron-submit" style="display:none;">
            <p class="screen-subtitle">Paste your Tron transaction hash to confirm your payment.</p>
            <input type="text" class="refund-input" id="stable-tron-txhash" placeholder="Transaction hash" />
            <p class="creating-error" id="stable-tron-error" style="display:none;"></p>
            <button class="action-button primary" onclick="submitTronDeposit()">Submit payment</button>
          </div>
          <div class="qr-actions">
            <button class="action-button primary" id="stable-primary-btn">Connect and Pay</button>
            <button class="action-button secondary" onclick="resetToInitial()">Cancel</button>
          </div>
        </div>

        <!-- Screen: stablecoin processing -->
        <div id="screen-stable-processing" class="tips-screen">
          <div class="creating-content">
            <div class="creating-spinner" id="stable-processing-spinner"></div>
            <p class="creating-status" id="stable-processing-status">Waiting for payment…</p>
            <p class="creating-error" id="stable-processing-error" style="display:none;"></p>
            <button class="action-button primary" id="stable-processing-restart-btn" style="display:none;" onclick="resetToInitial()">Start over</button>
          </div>
        </div>

        <!-- Screen: Bitcoin invoice -->
        <div id="screen-invoice" class="tips-screen">
          <p class="qr-screen-title" id="invoice-title">Send Bitcoin via Lightning</p>
          <p class="qr-amount" id="invoice-amount" style="display:none;"></p>
          <div class="qr-wrapper clickable" id="invoice-qr-wrapper">
            <div id="invoice-qr-code"></div>
            <span class="qr-tap-hint"><i data-lucide="copy"></i> Tap to copy</span>
          </div>
          <div class="qr-actions" style="margin-top:20px;">
            <button class="action-button primary" id="invoice-primary-btn">Copy Invoice</button>
            <button class="action-button secondary" onclick="resetToInitial()">Cancel</button>
          </div>
        </div>

        <!-- Screen: error / timeout -->
        <div id="screen-error" class="tips-screen">
          <div class="error-box">
            <h2>Taking longer than expected</h2>
            <p>Your payment is still processing. Your transaction has been submitted successfully.</p>
            <p class="screen-subtitle" id="error-quote-id" style="word-break:break-all;margin:0.75rem 0;"></p>
            <p>Please <a href="https://blitzwalletapp.com/pages/contact/" target="_blank">contact support</a> with the quote ID above if this persists.</p>
          </div>
          <button class="action-button secondary" onclick="retryStablePolling()">Check again</button>
        </div>

        <!-- Screen: Success -->
        <div id="screen-success" class="tips-screen">
          <div class="success-content">
            <div class="success-icon"><i data-lucide="check"></i></div>
            <h2 class="success-title">Payment received!</h2>
            <p class="success-sub">The payment was completed successfully.</p>
          </div>
        </div>

      </div>
    </div>

    <script>
      const IOS_STORE_URL = 'https://apps.apple.com/us/app/blitz-wallet/id6476810582';
      const ANDROID_STORE_URL = 'https://play.google.com/store/apps/details?id=com.blitzwallet';
      const PAYLINK_ID = ${JSON.stringify(paylinkId)};
      const PAYLINK_DATA = ${inlinedData};
      let currentPaylinkData = PAYLINK_DATA;
      const SWAP_STORAGE_KEY = \`paylink_swap_\${PAYLINK_ID}\`;
      const SWAP_HISTORY_KEY = 'blitz_swap_history';

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

      // ── FlashNet orchestration (mirrors the tips page) ─────────────────
      const FLASHNET_STATUS_URL = 'https://orchestration.flashnet.xyz/v1/orchestration/status';
      const FLASHNET_SUBMIT_URL = 'https://orchestration.flashnet.xyz/v1/orchestration/submit';
      const FLASHNET_PUBLIC_KEY = 'fnp_bAo-P5knxK04W3ZjPOu0vRkXQ_hlaBkrmYiW7E_ZuYQ';
      const STABLE_POLL_MS = 6000;
      const MAX_STABLE_POLLS = 150; // ~10 min
      const FLASHNET_DONE_STATUSES = new Set(['completed']);
      const FLASHNET_FAILED_STATUSES = new Set(['failed', 'expired', 'refunded', 'unfulfilled']);

      // ── Shared payment state ───────────────────────────────────────────
      let selectedNetwork = null;
      let selectedCurrency = 'USDC';
      let depositAddress = null;
      let amountInRaw = null;
      let currentChainId = null;
      let currentTokenAddress = null;
      let currentQuoteId = null;
      let currentAttemptId = null;
      let refundAddress = null;

      // FlashNet stablecoin state
      let currentOrderId = null;
      let currentReadToken = null;
      let depositDetected = false;
      let stablePaymentActive = false;
      let stablePollTimer = null;
      let stablePollCount = 0;
      // Guards the Tron manual proof-of-payment submit (double-submit protection).
      let txHashSubmitted = false;

      // Bitcoin / Lightning state
      let bitcoinInvoice = null;
      let pollTimer = null;
      let shouldPoll = false;
      let pollCount = 0;
      let pollLimited = false;
      const MAX_POLLS = 50;

      // ── screen navigation ──────────────────────────────────────────────
      function showScreen(id) {
        document.querySelectorAll('.tips-screen').forEach(s => s.classList.remove('active'));
        const el = document.getElementById(id);
        if (el) el.classList.add('active');
      }

      function resetToInitial() {
        stopPolling();
        stopStablePolling();
        txHashSubmitted = false;
        depositDetected = false;
        currentOrderId = null;
        currentReadToken = null;
        selectedNetwork = null;
        depositAddress = null;
        amountInRaw = null;
        currentChainId = null;
        currentTokenAddress = null;
        currentQuoteId = null;
        refundAddress = null;
        clearSwapContext();

        document.querySelectorAll('.network-card').forEach(c => c.classList.remove('selected'));

        const procSpinner = document.getElementById('stable-processing-spinner');
        if (procSpinner) procSpinner.style.display = '';
        const procErr = document.getElementById('stable-processing-error');
        if (procErr) procErr.style.display = 'none';
        const procRestart = document.getElementById('stable-processing-restart-btn');
        if (procRestart) procRestart.style.display = 'none';
        setProcessingStatus('Waiting for payment…');

        const stableQr = document.getElementById('qr-stable-address');
        if (stableQr) stableQr.innerHTML = '';
        const invoiceQr = document.getElementById('invoice-qr-code');
        if (invoiceQr) invoiceQr.innerHTML = '';

        const btcBtn = document.getElementById('btn-btc');
        if (btcBtn) btcBtn.disabled = false;

        showScreen('screen-initial');
      }

      function stopPolling() {
        shouldPoll = false;
        if (pollTimer) { clearTimeout(pollTimer); pollTimer = null; }
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

      // ── helpers ────────────────────────────────────────────────────────
      function isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      }

      function formatTokenAmount(raw, decimals) {
        if (!raw) return '';
        if (!decimals) return raw.toString();
        return (Number(raw) / Math.pow(10, decimals)).toFixed(2);
      }

      function formatNetworkLabel(network) {
        return NETWORK_LABELS[network] || (network ? network.charAt(0).toUpperCase() + network.slice(1) : '');
      }

      // Client-side mirror of the server formatAmountLabel().
      function formatClientAmountLabel(data) {
        if (!data) return null;
        if (data.currencyType !== 'BTC' && Number(data.displayAmount ?? 0) > 0) {
          const rawAmount = Number(data.displayAmount);
          return '$' + rawAmount.toFixed(2).toLocaleString('en-US');
        }
        const amount = Number(data.amount ?? 0);
        return '₿' + amount.toLocaleString('en-US');
      }

      // ── swap context (resume) + swap history ───────────────────────────
      function loadSwapContext() {
        const raw = localStorage.getItem(SWAP_STORAGE_KEY);
        if (!raw) return null;
        try { return JSON.parse(raw); } catch (e) { return null; }
      }
      function saveSwapContext(context) {
        localStorage.setItem(SWAP_STORAGE_KEY, JSON.stringify(context));
      }
      function clearSwapContext() {
        localStorage.removeItem(SWAP_STORAGE_KEY);
      }

      function persistSwapContext() {
        saveSwapContext({
          quoteId: currentQuoteId,
          attemptId: currentAttemptId,
          orderId: currentOrderId,
          readToken: currentReadToken,
          selectedNetwork,
          selectedCurrency,
          depositAddress,
          amountInRaw: amountInRaw != null ? amountInRaw.toString() : null,
          currentChainId,
          currentTokenAddress,
          time: Date.now(),
        });
      }

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
        document.getElementById('swap-history-overlay').style.display = 'flex';
      }
      function hideSwapHistory(e) {
        if (e) e.preventDefault();
        document.getElementById('swap-history-overlay').style.display = 'none';
      }

      function renderSwapHistory() {
        const listEl = document.getElementById('swap-history-list');
        if (!listEl) return;
        const history = getSwapHistory();
        if (!history.length) {
          listEl.innerHTML = '<p style="opacity:0.5;font-size:0.85rem;padding:0.75rem 0;">No swaps yet.</p>';
          return;
        }
        listEl.innerHTML = history.map(function(entry) {
          const time = new Date(entry.time || entry.timestamp).toLocaleString();
          const chain = (entry.selectedNetwork || entry.network || '').toLowerCase();
          const currency = (entry.selectedCurrency || entry.currency || '').toLowerCase();
          const iconName = chain === 'bsc' ? 'bnb' : chain;
          const chainImage = chain === 'polygon'
            ? \`/src/assets/images/chain-\${iconName}.png\`
            : \`/src/assets/images/chain-\${iconName}.svg\`;
          const tokenImage = currency === 'usdc'
            ? '/src/assets/images/usdc.svg'
            : '/src/assets/images/usdt.svg';
          const quoteId = entry.quoteId || entry.currentQuoteId || '';
          return \`
            <div class="swap-history-item">
              <div class="swap-quote">
                <div class="chain-icon-wrapper">
                  <img src="\${chainImage}" class="chain-icon" />
                  <img src="\${tokenImage}" class="token-overlay" />
                </div>
                <div class="quote-middle">
                  <div class="quote-id">\${quoteId}</div>
                  <div class="quote-time">\${time}</div>
                </div>
                <button class="copy-btn" data-qid="\${quoteId}">Copy</button>
              </div>
            </div>
          \`;
        }).join('');

        listEl.querySelectorAll('.copy-btn').forEach(function(btn) {
          btn.addEventListener('click', async function() {
            let ok = true;
            try { await navigator.clipboard.writeText(btn.dataset.qid); } catch (err) { ok = false; }
            clearTimeout(btn._copyTimer);
            btn.classList.toggle('copied', ok);
            btn.textContent = ok ? 'Copied!' : 'Failed';
            btn._copyTimer = setTimeout(function() {
              btn.classList.remove('copied');
              btn.textContent = 'Copy';
            }, 1500);
          });
        });
      }

      // ── copy helpers ───────────────────────────────────────────────────
      function copyAddress() {
        if (!depositAddress) return;
        navigator.clipboard.writeText(depositAddress);
        showAlert('Copied!');
      }
      function copyQuoteId() {
        if (!currentQuoteId) return;
        navigator.clipboard.writeText(currentQuoteId);
        showAlert('Copied!');
      }

      // ── Bitcoin / Lightning flow ───────────────────────────────────────
      function buildInvoiceScreen(invoice) {
        bitcoinInvoice = invoice;
        depositAddress = invoice;

        const amountEl = document.getElementById('invoice-amount');
        if (amountEl) {
          const label = formatClientAmountLabel(currentPaylinkData);
          if (Number(currentPaylinkData?.amount ?? 0) > 0 && label) {
            amountEl.textContent = label;
            amountEl.style.display = '';
          } else {
            amountEl.style.display = 'none';
          }
        }

        const addrEl = document.getElementById('invoice-address-text');
        if (addrEl) addrEl.textContent = invoice;

        const qrEl = document.getElementById('invoice-qr-code');
        if (qrEl) {
          qrEl.innerHTML = '';
          new QRCode(qrEl, {
            text: invoice.toUpperCase(),
            width: 220, height: 220,
            colorDark: '#000000', colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.M,
          });
        }

        const primaryBtn = document.getElementById('invoice-primary-btn');
        if (primaryBtn) {
          if (isMobileDevice()) {
            primaryBtn.textContent = 'Open Wallet';
            primaryBtn.onclick = openBitcoinWallet;
          } else {
            primaryBtn.textContent = 'Copy Invoice';
            primaryBtn.onclick = function() {
              navigator.clipboard.writeText(invoice);
              showAlert('Copied!');
            };
          }
        }

        const qrWrapper = document.getElementById('invoice-qr-wrapper');
        if (qrWrapper) qrWrapper.onclick = function() { navigator.clipboard.writeText(invoice); showAlert('Copied!'); };
        const addrBtn = document.getElementById('copy-invoice-addr-btn');
        if (addrBtn) addrBtn.onclick = function(e) { e.stopPropagation(); navigator.clipboard.writeText(invoice); showAlert('Copied!'); };
      }

      async function startBtcFlow() {
        const btcBtn = document.getElementById('btn-btc');
        if (btcBtn) btcBtn.disabled = true;
        showScreen('screen-creating-invoice');
        try {
          const res = await fetch('/createPayLinkInvoice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paylinkId: PAYLINK_ID }),
          });
          const json = await res.json();
          if (!json || json.status !== 'SUCCESS' || !json.invoice) {
            showAlert('Could not create a Lightning invoice. Please try again.');
            if (btcBtn) btcBtn.disabled = false;
            showScreen('screen-initial');
            return;
          }
          currentAttemptId = json.attemptId || null;
          buildInvoiceScreen(json.invoice);
          showScreen('screen-invoice');
          startPolling();
        } catch (err) {
          console.log(err);
          showAlert('Network error. Please try again.');
          if (btcBtn) btcBtn.disabled = false;
          showScreen('screen-initial');
        }
      }

      function buildCashAppLightningUrl(invoice) {
        return \`https://cash.app/launch/lightning/\${encodeURIComponent(invoice)}\`;
      }

      async function startCashAppFlow() {
        const btn = document.getElementById('btn-cashapp');
        if (btn) btn.disabled = true;
        try {
          const res = await fetch('/createPayLinkInvoice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paylinkId: PAYLINK_ID }),
          });
          const json = await res.json();
          if (!json || json.status !== 'SUCCESS' || !json.invoice) throw new Error('invoice');
          bitcoinInvoice = json.invoice;
          depositAddress = json.invoice;
          currentAttemptId = json.attemptId || null;
          startPolling();
          window.location.href = buildCashAppLightningUrl(json.invoice);
        } catch (err) {
          showAlert('Could not create a Lightning invoice. Please try again.');
        } finally {
          if (btn)  setTimeout(() => {
                      btn.disabled = false;
                    }, 500);
        }
      }

      function openBitcoinWallet() {
        if (!bitcoinInvoice) return;
        window.location.href = \`lightning:\${bitcoinInvoice}\`;
      }

      // ── Stablecoin: network selection ──────────────────────────────────
      function updateCurrencyGrid() {
        const grid = document.getElementById('network-grid');
        if (!grid) return;
        const networks = CURRENCY_NETWORKS[selectedCurrency] || [];
        grid.innerHTML = networks.map(function(n) {
          return \`<div class="network-card" id="card-\${n}" onclick="selectNetwork('\${n}')">\${NETWORK_LABELS[n]}</div>\`;
        }).join('');
      }

      function showNetworkSelect() {
        let satAmount;
        const rawAmt   = Number(currentPaylinkData?.rawAmount   ?? 0);
        const btcPrice = Number(currentPaylinkData?.bitcoinPrice ?? 0);
        if (currentPaylinkData?.currencyType !== 'BTC' && rawAmt > 0 && btcPrice > 0) {
          satAmount = Math.round((rawAmt / btcPrice) * 100000000);
        } else {
          satAmount = Number(currentPaylinkData?.amount ?? ${amount});
        }
        if (satAmount < 1300) {
          showAlert('Minimum USDC/USDT amount is ${formatAmountLabel({ amount: 1300 })}');
          return;
        }
        selectedNetwork = null;
        updateCurrencyGrid();
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
        selectedNetwork = null;
        const usdcBtn = document.getElementById('btn-usdc');
        const usdtBtn = document.getElementById('btn-usdt');
        if (usdcBtn) usdcBtn.classList.toggle('active', currency === 'USDC');
        if (usdtBtn) usdtBtn.classList.toggle('active', currency === 'USDT');
        updateCurrencyGrid();
      }

      function proceedToRefundAddress() {
        if (!selectedNetwork) {
          showAlert('Please select a network.');
          return;
        }
        const input = document.getElementById('refund-address-input');
        if (input) {
          input.value = '';
          input.placeholder = \`Your \${formatNetworkLabel(selectedNetwork)} address (optional)\`;
        }
        refundAddress = null;
        showScreen('screen-refund-address');
      }

      function proceedFromRefundAddress() {
        const input = document.getElementById('refund-address-input');
        refundAddress = input ? input.value.trim() : null;
        if (!refundAddress) refundAddress = null;
        confirmStablecoin();
      }

      // ── Stablecoin: create swap + render pay screen ────────────────────
      function renderStablePayScreen() {
        const titleEl = document.getElementById('stable-screen-title');
        if (titleEl) titleEl.textContent = 'Send ' + selectedCurrency + ' on ' + formatNetworkLabel(selectedNetwork);

        const amountEl = document.getElementById('stable-amount');
        if (amountEl) amountEl.textContent = formatTokenAmount(amountInRaw, (NETWORK_MAP[selectedNetwork]?.decimals || 6)) + ' ' + selectedCurrency;

        const addrEl = document.getElementById('stable-address-text');
        if (addrEl) addrEl.textContent = depositAddress;

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

        // Primary action button (mobile: Open Wallet; web + EVM: Connect and Pay)
        const primaryBtn = document.getElementById('stable-primary-btn');
        if (primaryBtn) {
          if (isMobileDevice()) {
            primaryBtn.textContent = 'Open Wallet';
            primaryBtn.style.display = '';
            primaryBtn.onclick = openStableWallet;
          } else {
            const hasEVMSupport = !!(currentTokenAddress && currentChainId);
            primaryBtn.textContent = 'Connect and Pay';
            primaryBtn.style.display = hasEVMSupport ? '' : 'none';
            primaryBtn.onclick = connectAndPay;
          }
        }

        // Copy handlers
        const qrWrapper = document.getElementById('stable-qr-wrapper');
        if (qrWrapper) qrWrapper.onclick = copyAddress;
        const copyAddrBtn = document.getElementById('copy-stable-addr-btn');
        if (copyAddrBtn) copyAddrBtn.onclick = function(e) { e.stopPropagation(); copyAddress(); };
        const copyQuoteBtn = document.getElementById('copy-quote-id-btn');
        if (copyQuoteBtn) copyQuoteBtn.onclick = function(e) { e.stopPropagation(); copyQuoteId(); };

        // Tron manual submit block
        const tronBlock = document.getElementById('stable-tron-submit');
        const tronInput = document.getElementById('stable-tron-txhash');
        const tronErr = document.getElementById('stable-tron-error');
        if (tronErr) tronErr.style.display = 'none';
        if (selectedNetwork === 'tron') {
          if (tronInput) tronInput.value = '';
          if (tronBlock) tronBlock.style.display = 'flex';
        } else {
          if (tronBlock) tronBlock.style.display = 'none';
        }
      }

      async function confirmStablecoin() {
        if (!selectedNetwork) {
          showAlert('Please select a network first.');
          return;
        }
        const continueBtn = document.getElementById('btn-continue-stable');
        if (continueBtn) continueBtn.disabled = true;

        const spinnerEl = document.getElementById('creating-spinner');
        const statusEl  = document.getElementById('creating-status');
        const errorEl   = document.getElementById('creating-error');
        const backBtn   = document.getElementById('creating-back-btn');
        if (spinnerEl) spinnerEl.style.display = '';
        if (statusEl)  { statusEl.textContent = 'Creating swap…'; statusEl.style.display = 'block'; }
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
            }),
          });
          const json = await res.json();
          if (!json || json.status !== 'SUCCESS' || !json.depositAddress) throw new Error('create-failed');

          depositAddress = json.depositAddress;
          amountInRaw    = BigInt(String(json.amountIn));
          currentQuoteId = json.quoteId;
          currentAttemptId = json.attemptId || null;

          const networkEntry = NETWORK_MAP[selectedNetwork] || {};
          currentChainId      = networkEntry.chainId || null;
          currentTokenAddress = currentChainId ? (networkEntry[selectedCurrency.toLowerCase()] || null) : null;

          // Reset FlashNet order/submit state for this attempt.
          txHashSubmitted = false;
          depositDetected = false;
          currentOrderId = null;
          currentReadToken = null;

          saveToSwapHistory({
            quoteId: currentQuoteId,
            selectedNetwork,
            selectedCurrency,
            time: Date.now(),
          });
          persistSwapContext();

          renderStablePayScreen();
          showScreen('screen-stable-pay');

          // Tron is the only chain FlashNet doesn't auto-detect — wait for the
          // manual proof-of-payment submit. All other chains poll immediately.
          if (selectedNetwork !== 'tron') {
            startStableStatusPolling();
          }
        } catch (err) {
          if (continueBtn) continueBtn.disabled = false;
          if (errorEl) { errorEl.textContent = 'Failed to create swap. Please try again.'; errorEl.style.display = 'block'; }
          if (statusEl) statusEl.style.display = 'none';
          if (spinnerEl) spinnerEl.style.display = 'none';
          if (backBtn) backBtn.style.display = 'inline-block';
        } finally {
          if (continueBtn) continueBtn.disabled = false;
        }
      }

      // ── Wallet deep link / MetaMask integration ────────────────────────
      function buildEip681Uri() {
        if (!currentTokenAddress || !depositAddress || !currentChainId || !amountInRaw) return null;
        // ERC-20 transfer per EIP-681; uint256 value is decimal (not hex)
        return \`ethereum:\${currentTokenAddress}@\${currentChainId}/transfer?address=\${depositAddress}&uint256=\${amountInRaw.toString()}\`;
      }

      function openStableWallet() {
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
          // Fire the transfer. FlashNet auto-detects the deposit and the status
          // poll (already running) picks it up — nothing to submit here.
          await window.ethereum.request({
            method: 'eth_sendTransaction',
            params: [{ from: accounts[0], to: currentTokenAddress, data }],
          });
        } catch (err) {
          // All wallet errors treated identically (rejection, chain switch failure, etc.)
          showAlert('Wallet error: ' + (err.message || 'Request rejected.'));
        }
      }

      // ── Tron manual proof-of-payment submit ────────────────────────────
      function showTronError(message) {
        const errEl = document.getElementById('stable-tron-error');
        if (errEl) { errEl.textContent = message; errEl.style.display = 'block'; }
      }

      async function submitTronDeposit() {
        const input = document.getElementById('stable-tron-txhash');
        const txHash = (input?.value || '').trim();
        if (txHash.length < 10) {
          showTronError('Enter a valid transaction hash.');
          return;
        }
        if (txHashSubmitted) return;
        txHashSubmitted = true;

        showScreen('screen-stable-processing');
        setProcessingStatus('Confirming your payment…');

        try {
          const res = await fetch(FLASHNET_SUBMIT_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer ' + FLASHNET_PUBLIC_KEY,
              'X-Idempotency-Key': 'paylink-quote:' + currentQuoteId,
            },
            body: JSON.stringify({ quoteId: currentQuoteId, txHash }),
            signal: AbortSignal.timeout(8000),
          });
          if (!res.ok) throw new Error('submit-failed');
          const json = await res.json();
          currentOrderId = json.orderId || json.order?.orderId || json.order?.id || null;
          currentReadToken = json.readToken || json.order?.readToken || null;
          if (!currentOrderId) throw new Error('no-order-id');
          depositDetected = true;
          persistSwapContext();
          startStableStatusPolling();
        } catch (err) {
          console.error('Tron submit failed:', err);
          txHashSubmitted = false;
          showScreen('screen-stable-pay');
          showTronError('Submission failed. Check the hash and try again.');
        }
      }

      // ── FlashNet status polling ────────────────────────────────────────
      function setProcessingStatus(text) {
        const el = document.getElementById('stable-processing-status');
        if (el) el.textContent = text;
      }

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
            return 'Delivering your Bitcoin…';
          case 'refunding':
            return 'Refunding your payment…';
          default:
            return 'Processing swap…';
        }
      }

      function startStableStatusPolling() {
        stopStablePolling();
        stablePaymentActive = true;
        stablePollCount = 0;
        stablePollTimer = setTimeout(pollStableStatus, STABLE_POLL_MS);
      }

      function retryStablePolling() {
        startStableStatusPolling();
        showScreen('screen-stable-processing');
      }

      function stopStablePolling() {
        stablePaymentActive = false;
        if (stablePollTimer) { clearTimeout(stablePollTimer); stablePollTimer = null; }
      }

      async function fetchFlashnetStatus() {
        // Phase 1: no orderId yet → query by quoteId to detect the deposit +
        // capture the auto-created orderId. Phase 2: query by orderId.
        const param = currentOrderId
          ? 'id=' + encodeURIComponent(currentOrderId)
          : 'quoteId=' + encodeURIComponent(currentQuoteId);
        const headers = { Authorization: 'Bearer ' + FLASHNET_PUBLIC_KEY };
        if (currentReadToken) headers['X-Read-Token'] = currentReadToken;
        const res = await fetch(FLASHNET_STATUS_URL + '?' + param, {
          headers,
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) return null;
        return await res.json();
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
                persistSwapContext();
                showScreen('screen-stable-processing');
              }
              const status = order.status;
              if (status) setProcessingStatus(statusLabel(status));
              if (status && FLASHNET_DONE_STATUSES.has(status)) { onSwapCompleted(); return; }
              if (status && FLASHNET_FAILED_STATUSES.has(status)) { onSwapFailed(); return; }
            }
          } catch (e) { /* transient — keep polling */ }
        }
        stablePollCount++;
        if (stablePollCount >= MAX_STABLE_POLLS) { onSwapTimeout(); return; }
        stablePollTimer = setTimeout(pollStableStatus, STABLE_POLL_MS);
      }

      async function onSwapCompleted() {
        stopStablePolling();
        clearSwapContext();
        markPaid(); // fire-and-retry; records the credit in the Blitz backend
        showScreen('screen-success');
      }

      function showStableProcessingError(message) {
        stopStablePolling();
        const spinner = document.getElementById('stable-processing-spinner');
        if (spinner) spinner.style.display = 'none';
        setProcessingStatus('');
        const errEl = document.getElementById('stable-processing-error');
        if (errEl) { errEl.textContent = message; errEl.style.display = 'block'; }
        const restartBtn = document.getElementById('stable-processing-restart-btn');
        if (restartBtn) restartBtn.style.display = 'block';
      }

      function onSwapFailed() {
        clearSwapContext();
        showStableProcessingError('The swap could not be completed. If you were charged, contact support with Quote ID: ' + (currentQuoteId || '') + '.');
      }

      function onSwapTimeout() {
        const el = document.getElementById('error-quote-id');
        if (el) el.textContent = currentQuoteId ? 'Quote ID: ' + currentQuoteId : '';
        showScreen('screen-error');
      }

      // Records the credit against THIS paylink attempt. Bounded retry so a slow
      // backend still records it; the success screen isn't blocked on it.
      async function markPaid() {
        for (let attempt = 0; attempt < 5; attempt++) {
          try {
            const res = await fetch('/getPaylinkData', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                paylinkId: PAYLINK_ID,
                checkInvoice: true,
                ...(currentAttemptId ? { attemptId: currentAttemptId } : {}),
              }),
              signal: AbortSignal.timeout(8000),
            });
            const json = await res.json();
            if (json?.data?.attemptPaid || json?.data?.isPaid) return;
          } catch (e) { /* network error — retry */ }
          await new Promise(function(r) { setTimeout(r, 3000); });
        }
      }

      // ── Bitcoin/Lightning payment polling (backend) ────────────────────
      // Unbounded polling while a payer waits on an invoice (LN flow).
      function startPolling() {
        stopPolling();
        pollCount = 0;
        pollLimited = false;
        shouldPoll = true;
        if (document.visibilityState !== 'hidden') _schedulePoll();
      }

      function _schedulePoll() {
        pollTimer = setTimeout(_doPoll, 10000);
      }

      async function _doPoll() {
        pollTimer = null;
        if (!shouldPoll) return;
        pollCount++;
        try {
          const res = await fetch('/getPaylinkData', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              paylinkId: PAYLINK_ID,
              checkInvoice: true,
              ...(currentAttemptId ? { attemptId: currentAttemptId } : {}),
            }),
            signal: AbortSignal.timeout(15000),
          });
          if (res.ok) {
            const json = await res.json();
            if (json?.data?.attemptPaid) {
              stopPolling();
              clearSwapContext();
              showScreen('screen-success');
              return;
            }
          }
        } catch (err) { /* transient error — still reschedule */ }
        if (pollLimited && pollCount >= MAX_POLLS) {
          stopPolling();
          showScreen('screen-error');
          return;
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

      // ── initial render ─────────────────────────────────────────────────
      async function fetchCurrentPaylinkData() {
        try {
          if (currentPaylinkData) {
             return { data: currentPaylinkData, notFound: false };
          }
          const res = await fetch('/getPaylinkData', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paylinkId: PAYLINK_ID, shouldLoadBitcoinPrice: true }),
            cache: 'no-store',
            signal: AbortSignal.timeout(6000),
          });
          if (!res.ok) return { data: null, notFound: false };
          const json = await res.json();
          if (json?.status !== 'SUCCESS') return { data: null, notFound: true };
          return { data: json?.data ?? null, notFound: !json?.data };
        } catch (err) {
          return { data: null, notFound: false };
        }
      }

      function showPaylinkUnavailable() {
        const initialScreen = document.getElementById('screen-initial');
        if (!initialScreen) return;
        initialScreen.innerHTML = \`
          <div class="error-box">
            <h2>Payment Request Not Found</h2>
            <p>This paylink doesn't exist or has expired.</p>
          </div>
        \`;
      }

      function renderInitialScreen(data) {
        const requesterEl = document.getElementById('initial-requester');
        const amountEl = document.getElementById('initial-amount');
        const descEl = document.getElementById('initial-description');

        const username = data?.name ?? 'Someone';
        if (requesterEl) requesterEl.textContent = username + ' requested';

        const amountLabel = formatClientAmountLabel(data);
        if (amountEl) {
          if (Number(data?.amount ?? 0) > 0 && amountLabel) {
            amountEl.textContent = amountLabel;
            amountEl.style.display = '';
          } else {
            amountEl.style.display = 'none';
          }
        }

        const description = data?.description ?? '';
        if (descEl) {
          if (description) {
            descEl.textContent = 'for "' + description + '"';
            descEl.style.display = '';
          } else {
            descEl.style.display = 'none';
          }
        }
      }

      function updatePaidNotice(data) {
        const paidNotice = document.getElementById('paid-notice');
        const isPaid = !!data?.isPaid;
        if (paidNotice) paidNotice.style.display = isPaid ? 'block' : 'none';
        ['payment-options'].forEach(function(id) {
          const el = document.getElementById(id);
          if (el) el.style.display = isPaid ? 'none' : '';
        });
      }

      // Shown when the paylink was fulfilled by a *different* payment while this
      // payer was waiting — never a success screen for a payment they didn't make.
      function showAlreadyCompleted() {
        updatePaidNotice({ isPaid: true });
        showScreen('screen-initial');
      }

      document.addEventListener('DOMContentLoaded', async () => {
        if (window.lucide) lucide.createIcons();
        const livePaylink = await fetchCurrentPaylinkData();

        // Resume an in-flight stablecoin swap (FlashNet model).
        const stored = loadSwapContext();
        if (stored && stored.quoteId && !livePaylink?.data?.isPaid) {
          if (livePaylink.data) currentPaylinkData = livePaylink.data;
          currentQuoteId = stored.quoteId;
          currentAttemptId = stored.attemptId || null;
          currentOrderId = stored.orderId || null;
          currentReadToken = stored.readToken || null;
          selectedNetwork = stored.selectedNetwork || null;
          selectedCurrency = stored.selectedCurrency || 'USDC';
          depositAddress = stored.depositAddress || null;
          amountInRaw = stored.amountInRaw != null ? BigInt(stored.amountInRaw) : null;
          currentChainId = stored.currentChainId || null;
          currentTokenAddress = stored.currentTokenAddress || null;

          if (currentOrderId) {
            depositDetected = true;
            showScreen('screen-stable-processing');
          } else {
            renderStablePayScreen();
            showScreen('screen-stable-pay');
            if (window.lucide) lucide.createIcons();
          }
          startStableStatusPolling();
          return;
        }

        if (livePaylink.data) {
          currentPaylinkData = livePaylink.data;
          renderInitialScreen(currentPaylinkData);
          updatePaidNotice(currentPaylinkData);
          showScreen('screen-initial');
        } else {
          currentPaylinkData = null;
          showPaylinkUnavailable();
          showScreen('screen-initial');
        }
      });

      // ── download modal ─────────────────────────────────────────────────
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
            width: 200, height: 200,
            colorDark: '#000000', colorLight: '#ffffff',
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

        function isAndroidDevice() { return /Android/i.test(navigator.userAgent); }
        function isIOSDevice() { return /iPhone|iPad|iPod/i.test(navigator.userAgent); }

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

        if (window.lucide) lucide.createIcons();
      })();
    </script>
  </body>
</html>`;
}
