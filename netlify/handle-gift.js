export async function handler(event, context) {
  const path = event.path;
  const giftId = path.split("/").pop();

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "text/html",
    },
    body: generateHTML(giftId),
  };
}

function generateHTML(giftId) {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <!-- Favicon -->
    <link rel="icon" type="image/png" href="/public/favicon/favicon-96x96.png" sizes="96x96" />
    <link rel="icon" type="image/svg+xml" href="/public/favicon/favicon.svg" />
    <link rel="shortcut icon" href="/public/favicon/favicon.ico" />
    <link rel="apple-touch-icon" href="/public/favicon/favicon.ico" />
    <meta name="apple-mobile-web-app-title" content="Blitz Wallet" />
    <link rel="manifest" href="/public/favicon/site.webmanifest" />
    
    <title>Claim your Gift!</title>
    <meta name="description" content="You've received a gift! Claim it with Blitz Wallet." />

    <!-- Open Graph -->
    <meta property="og:image" content="https://blitzwalletapp.com/public/twitterCardPresent.png" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://blitzwalletapp.com/gift/${giftId}" />
    <meta property="og:title" content="Claim your Gift!" />
    <meta property="og:description" content="You've received a gift! Claim it with Blitz Wallet." />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content="https://blitzwalletapp.com/public/twitterCardPresent.png">
    <meta property="twitter:url" content="https://blitzwalletapp.com/gift/${giftId}" />
    <meta property="twitter:title" content="Claim your Gift!" />
    <meta property="twitter:description" content="You've received a gift! Claim it with Blitz Wallet." />

    <meta name="robots" content="noindex,nofollow"> 
    <meta name="googlebot" content="noindex,nofollow">

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- Lucide Icons -->
    <script src="https://unpkg.com/lucide@latest"></script>

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
      }

      .gift-container {
        width: 100%;
        max-width: 500px;
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
        margin-top: 1rem;
        font-family: var(--description_font);
      }

      .copy-button:hover {
        background: var(--lm-background);
        border-color: var(--primary_color);
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
      }
    </style>

    <script>
      const IOS_STORE_URL = 'https://apps.apple.com/us/app/blitz-wallet/id6476810582';
      const ANDROID_STORE_URL = 'https://play.google.com/store/apps/details?id=com.blitzwallet';
      let pageHidden = false;
      const FALLBACK_TIMEOUT_MS = 1500;
      const giftId = '${giftId}';
      const fragment = window.location.hash.substring(1);

      function detectOS() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) return 'ios';
        if (/android/i.test(userAgent)) return 'android';
        return 'other';
      }

      function updateLoadingStatus(message) {
        const loadingContainer = document.querySelector('.loading-container p');
        if (loadingContainer) loadingContainer.textContent = message;
      }

      function attemptDeepLinkWithFallback(onlyPreNavigate = false) {
        const os = detectOS();
        const deepLink = \`blitz-wallet://gift/\${giftId}#\${fragment}\`;
        
        let storeUrl = '';
        if (os === 'ios') {
          storeUrl = IOS_STORE_URL;
        } else if (os === 'android') {
          storeUrl = ANDROID_STORE_URL;
        } else {
          updateLoadingStatus('This link is optimized for mobile devices.');
          window.location.href = deepLink;
          return;
        }

        updateLoadingStatus('Opening Blitz Wallet...');
        window.location.href = deepLink;

        if (onlyPreNavigate) return;

        setTimeout(() => {
          if (pageHidden) return;
          updateLoadingStatus(\`App not detected. Redirecting to \${os === 'ios' ? 'App Store' : 'Play Store'}...\`);
          setTimeout(() => {
            if (!pageHidden) window.location.href = storeUrl;
          }, 1000);
        }, FALLBACK_TIMEOUT_MS);
      }

      async function fetchGiftData() {
        try {
          const response = await fetch('/getBitcoinGiftDetails', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ giftUUID: giftId })
          });

          if (!response.ok) throw new Error('Failed to fetch gift data');
          const data = await response.json();
          return { data, error: null };
        } catch (error) {
          return { data: null, error: error.message };
        }
      }

      function updateMetaTags(formattedAmount, denomination) {
        const title = \`Claim your \${formattedAmount || (denomination === 'BTC' ? 'Bitcoin' : 'Dollar')} Gift!\`;
        document.title = title;
        document.querySelector('meta[property="og:title"]').setAttribute('content', title);
        document.querySelector('meta[property="twitter:title"]').setAttribute('content', title);
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
          
          updateMetaTags(formattedAmount, denomination);

          container.innerHTML = \`
            <div class="content-container">
              <div class="gift-icon">
                <i data-lucide="gift"></i>
              </div>
              <h1 class="gift-title">You've Received a Gift!</h1>
              <div class="gift-amount">\${formattedAmount}</div>
              \${giftData.description ? \`<p class="gift-description">\${giftData.description}</p>\` : ''}
              
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Expires</span>
                  <span class="info-value">\${expiresDate}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Type</span>
                  <span class="info-value">\${giftType} Gift</span>
                </div>
              </div>

              \${(!isClaimed && !isExpired) ? \`
                <button class="claim-button" onclick="claimGift()">
                  Claim in Blitz Wallet
                </button>
                <button class="copy-button" onclick="copyGift()">
                  Copy Gift Link
                </button>
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

      function claimGift() {
        attemptDeepLinkWithFallback();
      }

      function copyGift() {
        const giftLink = \`https://blitzwalletapp.com/gift/\${giftId}#\${fragment}\`;
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
        setTimeout(async () => {
          const { data, error } = await fetchGiftData();
          if (!error && data.data) {
            attemptDeepLinkWithFallback(true);
          }
          const giftData = data?.data;
          renderGiftCard(giftData, error);
        }, 500);
      });

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          pageHidden = true;
        }
      });
    </script>
  </head>
  <body>
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
