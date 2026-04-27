async function fetchGiftData(giftId, baseUrl) {
  try {
    const res = await fetch(baseUrl + "/getBitcoinGiftDetails", {
      method: "POST",
      body: JSON.stringify({ giftUUID: giftId }),
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) {
      console.error("[OG gift] Cloud Function returned", res.status);
      return null;
    }

    const json = await res.json();
    if (json?.status !== "SUCCESS") {
      console.error("[OG gift] Unexpected status:", json?.status);
      return null;
    }

    return json?.data ?? null;
  } catch (err) {
    console.error("[OG gift] fetch error:", err.message);
    return null;
  }
}

// ── 2. Build the og:image URL from the gift data object ───────────────────────

function buildGiftOgImageUrl(baseUrl, giftId, data) {
  // data fields (adjust these keys to match what your Cloud Function actually returns)
  const amount = data?.amount ?? "";
  const denom = data?.denomination ?? "BTC"; // "BTC" | "USD"
  const satDisplay = data?.satDisplay ?? "SAT"; // "SAT" | "BTC"
  const message = encodeURIComponent(data?.giftMessage ?? "");
  const sender = encodeURIComponent(data?.senderName ?? "");

  return (
    `${baseUrl}/og-gift` +
    `?amount=${amount}` +
    `&denom=${encodeURIComponent(denom)}` +
    `&satDisplay=${encodeURIComponent(satDisplay)}` +
    `&message=${message}` +
    `&sender=${sender}` +
    `&id=${encodeURIComponent(giftId)}` +
    `&v=1`
  );
}

// ── 3. Format amount for og:title / og:description ────────────────────────────

function formatGiftAmountLabel(data) {
  if (!data) return null;

  const denomination = data.denomination ?? "BTC";
  const useSatSymbol = data.satDisplay === "symbol" || !data.satDisplay;

  if (denomination === "USD") {
    const amount = Number(data.dollarAmount ?? 0);
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  }

  const amount = Number(data.amount ?? 0);
  return useSatSymbol
    ? `₿${amount.toLocaleString("en-US")}`
    : `${amount.toLocaleString("en-US")} SAT`;
}

export async function handler(event, context) {
  const path = (event.path || "").replace(/\/+$/, "");
  let giftId = path.split("/").pop() || "";
  try {
    giftId = decodeURIComponent(giftId);
  } catch (e) {
    // Keep raw giftId if decode fails.
  }
  const baseUrl = process.env.URL || "https://blitzwalletapp.com";
  const giftData = await fetchGiftData(giftId, baseUrl);

  let ogTitle, ogDescription, ogImage;

  if (giftData) {
    const denomination = giftData.denomination ?? "BTC";
    const amountLabel = formatGiftAmountLabel(giftData);
    ogTitle = `Claim your ${amountLabel} ${denomination === "BTC" ? "Bitcoin" : "Dollar"} Gift!`;
    ogDescription = `You've received a ${amountLabel} Bitcoin gift. Claim it instantly on Blitz Wallet.`;
    ogImage = buildGiftOgImageUrl(baseUrl, giftId, giftData);
    console.log(ogImage);
  } else {
    // fallback — same values your current code already uses
    ogTitle = "You've received a Bitcoin Gift!";
    ogDescription = "Claim your Bitcoin gift on Blitz Wallet.";
    ogImage = `https://blitzwalletapp.com/public/twitterCardPresent.png`;
  }

  const html = generateHTML({
    ogTitle,
    ogDescription,
    ogImage,
    giftId,
    giftData,
  });

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "text/html",
    },
    body: html,
  };
}

function generateHTML({ ogTitle, ogDescription, ogImage, giftId, giftData }) {
  const inlinedData = JSON.stringify(giftData ?? null);
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="canonical" href="https://blitzwalletapp.com/gift/${giftId}" />

    <!-- Favicon -->
    <link rel="icon" type="image/png" href="/public/favicon/favicon-96x96.png" sizes="96x96" />
    <link rel="icon" type="image/svg+xml" href="/public/favicon/favicon.svg" />
    <link rel="shortcut icon" href="/public/favicon/favicon.ico" />
    <link rel="apple-touch-icon" href="/public/favicon/favicon.ico" />
    <link rel="manifest" href="/public/favicon/site.webmanifest" />
    
    <title>${ogTitle}</title>
    <meta name="description" content="${ogDescription}" />

    <!-- Open Graph -->
    <meta property="og:image"       content="${ogImage}" />
    <meta property="og:image:width"  content="1200" />
    <meta property="og:image:height" content="628" />
    <meta property="og:type" content="website" />
    <meta property="og:image:type"   content="image/png" />
    <meta property="og:url" content="https://blitzwalletapp.com/gift/${giftId}" />
    <meta property="og:title"       content="${ogTitle}" />
    <meta property="og:description" content="${ogDescription}" />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image"       content="${ogImage}" />
    <meta property="twitter:url" content="https://blitzwalletapp.com/gift/${giftId}" />
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
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: calc(70px + 1rem) 1rem 1rem;
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
        display: flex;
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

      .gift-container {
        width: 100%;
        max-width: 600px;
        margin: 0 auto;
      }

      .gift-card {
        background: white;
        border-radius: 24px;
        padding: 3rem 2.5rem;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
        border: 1px solid var(--lm-backgroundOffset);
        text-align: center;
      }

      .gift-icon {
        width: 80px;
        height: 80px;
        background: linear-gradient(135deg, var(--primary_color), var(--tertiary_color));
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 2rem;
      }

      .gift-icon svg {
        width: 45px;
        height: 45px;
        color: white;
      }

      .gift-title {
        font-size: 2rem;
        font-weight: 600;
        margin-bottom: 1.5rem;
        color: var(--lm-text);
      }

      .gift-amount {
        font-size: 3rem;
        font-weight: 600;
        color: var(--primary_color);
        margin: 1.5rem 0;
      }

      .gift-description {
        font-size: 1.1rem;
        margin-bottom: 2rem;
        opacity: 0.9;
        line-height: 1.6;
      }

      .info-grid {
        background: var(--lm-background);
        border-radius: 12px;
        padding: 1rem;
        margin: 2rem 0;
      }

      .info-item {
        display: flex;
        justify-content: space-between;
        padding: 1rem 0;
      }

      .info-item:not(:last-child) {
        border-bottom: 1px solid #e0e0e0;
      }

      .info-label {
        font-size: 0.95rem;
        opacity: 0.7;
      }

      .info-value {
        font-weight: 400;
        font-size: 0.95rem;
      }

      .claim-button {
        background: linear-gradient(135deg, var(--primary_color), var(--tertiary_color));
        color: white;
        padding: 1rem 2rem;
        border: none;
        border-radius: 12px;
        font-size: 1.1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        width: 100%;
        margin-top: 1rem;
        font-family: var(--description_font);
        box-shadow: 0 4px 15px rgba(3, 117, 246, 0.3);
      }

      .claim-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(3, 117, 246, 0.4);
      }

      .copy-button {
        background: transparent;
        color: var(--primary_color);
        padding: 1rem 2rem;
        border: 1px solid var(--lm-backgroundOffset);
        border-radius: 12px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        width: 100%;
        font-family: var(--description_font);
      }

      .copy-button:hover {
        background: var(--lm-background);
        border-color: var(--primary_color);
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

      .status-badge {
        display: inline-block;
        padding: 0.5rem 1rem;
        border-radius: 50px;
        font-size: 0.9rem;
        font-weight: 600;
        margin-bottom: 1rem;
      }

      .status-badge.success {
        background: #d1fae5;
        color: #065f46;
      }

      .status-badge.error {
        background: #fee2e2;
        color: #991b1b;
      }

      @media screen and (max-width: 500px) {
        .gift-card {
          padding: 2rem 1.5rem;
        }

        .gift-title {
          font-size: 1.6rem;
        }

        .gift-amount {
          font-size: 2.5rem;
        }

        .download-modal {
          padding: 2.5rem 1.5rem 2rem;
        }

        .modal-header h2 {
          font-size: 1.5rem;
        }
      }

      .steps-divider {
        border: none;
        border-top: 1px solid var(--lm-backgroundOffset);
        margin: 1.5rem 0;
      }

      .steps-section {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        text-align: left;
      }

      .step {
        display: flex;
        gap: 1rem;
        align-items: flex-start;
      }

      .step-number {
        flex-shrink: 0;
        width: 32px;
        height: 32px;
        background: linear-gradient(135deg, var(--primary_color), var(--tertiary_color));
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 700;
        font-size: 0.9rem;
      }

      .step-content {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        flex: 1;
      }

      .step-title {
        font-weight: 600;
        font-size: 1rem;
        color: var(--lm-text);
      }

      .step-description {
        font-size: 0.9rem;
        opacity: 0.7;
        line-height: 1.4;
      }

      .step-actions {
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
        margin-top: 0.5rem;
      }

      .step-btn {
        flex: 1;
        white-space: nowrap;
        padding: 0.75rem 1.25rem;
        border-radius: 12px;
        font-size: 0.95rem;
        font-weight: 600;
        cursor: pointer;
        font-family: var(--description_font);
        border: none;
        transition: all 0.3s ease;
      }

      .step-btn.primary {
        background: linear-gradient(135deg, var(--primary_color), var(--tertiary_color));
        color: white;
        box-shadow: 0 4px 15px rgba(3, 117, 246, 0.3);
      }

      .step-btn.primary:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(3, 117, 246, 0.4);
      }

      .step-btn.secondary {
        background: transparent;
        color: var(--primary_color);
        border: 1px solid var(--lm-backgroundOffset);
      }

      .step-btn.secondary:hover {
        background: var(--lm-background);
        border-color: var(--primary_color);
      }
    </style>

    <script>
      const IOS_STORE_URL = 'https://apps.apple.com/us/app/blitz-wallet/id6476810582';
      const ANDROID_STORE_URL = 'https://play.google.com/store/apps/details?id=com.blitzwallet';
      const giftId = '${giftId}';
      const currentUrl = new URL(window.location.href);
      let pageHidden = false;
      let claimAttemptTimer = null;
      const GIFT_DATA = ${inlinedData};

      function updateLoadingStatus(message) {
        const loadingContainer = document.querySelector('.loading-container p');
        if (loadingContainer) loadingContainer.textContent = message;
      }

      function renderGiftCard(giftData, loadError) {
        const container = document.getElementById('app');
        const loadingContainer = document.querySelector('.loading-container');
        
        if (loadingContainer) loadingContainer.classList.add('fade-out');

        setTimeout(() => {
          if (loadError) {
            container.innerHTML = \`
              <div class="content-container fade-in">
                <div class="error-message">
                  <h2>Error Loading Gift</h2>
                  <p>\${loadError}</p>
                </div>
              </div>
            \`;
            return;
          }

          if (!giftData) {
            container.innerHTML = \`
              <div class="content-container fade-in">
                <div class="error-message">
                  <h2>Gift Not Found</h2>
                  <p>This gift doesn't exist or has already been claimed.</p>
                </div>
              </div>
            \`;
            return;
          }

          const isExpired = Date.now() > giftData.expireTime;
          const isClaimed = giftData.state === 'Claimed';
          const useSatSymbol = giftData.satDisplay === 'symbol' || !giftData.satDisplay;
          const denomination = giftData.denomination || 'BTC';
          const frontSymbol = denomination === "BTC" ? '₿' : '$';
          const backText = denomination === "BTC" ? ' SAT' : ' USD';
          const giftAmount = denomination === 'BTC' ? giftData.amount : giftData.dollarAmount;
          const formattedAmount = (useSatSymbol ? frontSymbol : '') + giftAmount?.toLocaleString() + (useSatSymbol ? '' : backText);
          const giftType = denomination === 'BTC' ? 'Bitcoin' : 'Dollar';
          const expiresDate = new Date(giftData.expireTime).toLocaleDateString();
          

          container.innerHTML = \`
            <div class="content-container">
              <div class="gift-icon">
                <i data-lucide="gift"></i>
              </div>
              <h1 class="gift-title">You've Received a Gift!</h1>
              <div class="gift-amount">\${formattedAmount}</div>
              \${giftData.description ? \`<p class="gift-description">\${giftData.description}</p>\` : ''}

              \${(!isClaimed && !isExpired) ? \`
                <hr class="steps-divider" />
                <div class="steps-section">
                  <div class="step">
                    <div class="step-number">1</div>
                    <div class="step-content">
                      <div class="step-title">Download Blitz Wallet</div>
                      <div class="step-description">Get the free app from the App Store or Google Play.</div>
                      <div class="step-actions">
                        <button class="step-btn primary download-btn">Download Blitz Wallet</button>
                      </div>
                    </div>
                  </div>
                  <div class="step">
                    <div class="step-number">2</div>
                    <div class="step-content">
                      <div class="step-title">Claim Your Gift</div>
                      <div class="step-description">Already installed? Tap below to open your gift in Blitz.</div>
                      <div class="step-actions">
                        <button class="step-btn primary" onclick="openInApp()">Open in Blitz Wallet</button>
                        <button class="step-btn secondary copy-button" onclick="copyGift()">Copy Gift Link</button>
                      </div>
                    </div>
                  </div>
                </div>
              \` : \`
                <span class="status-badge error">
                  \${isClaimed ? 'Already Claimed' : 'Expired'}
                </span>
                <p class="gift-description">
                  \${isClaimed 
                    ? \`This \${giftType} gift has already been claimed.\` 
                    : \`This \${giftType} gift has expired.\`}
                </p>
              \`}
            </div>
          \`;

          lucide.createIcons();
          
          setTimeout(() => {
            container.querySelector('.content-container').classList.add('fade-in');
          }, 50);
        }, 300);
      }

      function openInApp() {
        const secret = window.location.hash.slice(1);
        const deeplink = secret
          ? \`blitz-wallet://gift/\${giftId}/\${secret}\`
          : \`blitz-wallet://gift/\${giftId}\`;
        window.location.href = deeplink;
      }

      function copyGift() {
        const giftLink = currentUrl.origin + currentUrl.pathname + currentUrl.search + currentUrl.hash;
        navigator.clipboard.writeText(giftLink);

        const button = document.querySelector('.copy-button');
        if (button) {
          const originalText = button.textContent;
          button.textContent = 'Link Copied!';
          setTimeout(() => {
            button.textContent = originalText;
          }, 2000);
        }
      }

      document.addEventListener('DOMContentLoaded', () => {
        renderGiftCard(GIFT_DATA, GIFT_DATA ? null : 'Gift not found');
      });

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          pageHidden = true;
          if (claimAttemptTimer) {
            clearTimeout(claimAttemptTimer);
            claimAttemptTimer = null;
          }
        } else {
          pageHidden = false;
        }
      });

      window.addEventListener('pagehide', () => {
        pageHidden = true;
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

    <div class="gift-container">
      <div class="gift-card">
        <div id="app">
          <div class="loading-container">
            <div class="loading-spinner"></div>
            <p>Loading your gift...</p>
          </div>
        </div>
      </div>
    </div>

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

        document.addEventListener('click', function(e) {
          if (e.target.closest('.download-btn')) {
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
          }
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
