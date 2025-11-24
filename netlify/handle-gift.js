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
    <link
      rel="icon"
      type="image/png"
      href="/public/favicon/favicon-96x96.png"
      sizes="96x96"
    />
    <link rel="icon" type="image/svg+xml" href="/public/favicon/favicon.svg" />
    <link rel="shortcut icon" href="/public/favicon/favicon.ico" />
    <link rel="apple-touch-icon" href="/public/favicon/favicon.ico" />
    <meta name="apple-mobile-web-app-title" content="Blitz Wallet" />
    <link rel="manifest" href="/public/favicon/site.webmanifest" />
    
    <title>Claim your Bitcoin Gift!</title>
    <meta
      name="description"
      content="You've received a Bitcoin gift! Claim it with Blitz Wallet."
    />

    <!-- Open Graph / Facebook -->
    <meta property="og:image" content="https://blitzwalletapp.com/public/twitterCard.png" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://blitzwalletapp.com/gift/${giftId}" />
    <meta property="og:title" content="Claim your Bitcoin Gift!" />
    <meta property="og:description" content="You've received a Bitcoin gift! Claim it with Blitz Wallet." />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content="https://blitzwalletapp.com/public/twitterCard.png">
    <meta property="twitter:url" content="https://blitzwalletapp.com/gift/${giftId}" />
    <meta property="twitter:title" content="Claim your Bitcoin Gift!" />
    <meta property="twitter:description" content="You've received a Bitcoin gift! Claim it with Blitz Wallet." />

    <meta name="robots" content="noindex,nofollow"> 
    <meta name="googlebot" content="noindex,nofollow">

    <script src="/src/js/font-loader.js" defer></script>
    <link rel="stylesheet" href="../src/assets/styles/index.css" />

    <style>
      .gift-container {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }

      .gift-card {
        background-color: var(--dm-backgroundOffset);
        border-radius: 12px;
        padding: 40px;
        max-width: 500px;
        width: 100%;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        text-align: center;
      }

      .gift-icon {
        font-size: 80px;
        margin-bottom: 20px;
      }

      .gift-title {
        font-size: 28px;
        margin-bottom: 10px;
      }

      .gift-amount {
        font-size: 48px;
        font-weight: 600;
        color: var(--dm-text);
        margin: 20px 0;
      }

      .gift-description {
        font-size: 16px;
        margin-bottom: 20px;
        opacity: 0.9;
      }

      .info-grid {
        display: grid;
        gap: 12px;
        margin: 30px 0;
        text-align: left;
      }

      .info-item {
        display: flex;
        justify-content: space-between;
        padding: 15px;
        background: var(--dm-background);
        border-radius: 8px;
      }

      .info-label {
        font-size: 14px;
        opacity: 0.7;
      }

      .info-value {
        font-weight: 500;
        font-size: 14px;
      }

      .claim-button {
        background-color: var(--dm-text);
        color: var(--lm-text);
        padding: 14px 24px;
        border: 0;
        border-radius: 8px;
        font-size: 18px;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.3s ease-in-out;
        width: 100%;
        margin-top: 20px;
      }

      .claim-button:hover {
        background-color: #b8b8b8;
      }

      .copy-button {
        background-color: unset;
        color: var(--dm-text);
        padding: 14px 24px;
        border: 0;
        border-radius: 8px;
        font-size: 18px;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.3s ease-in-out;
        width: 100%;
        margin-top: 20px;
        text-decoration: underline;
      }

      .error-message {
        padding: 20px;
        border-radius: 8px;
      }
      
      .error-message p {
        margin-top: 20px;
      }

      .loading-spinner {
        display: inline-block;
        width: 50px;
        height: 50px;
        border: 5px solid rgba(255, 255, 255, 0.3);
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
        gap: 20px;
        opacity: 1;
        transition: opacity 0.3s ease-in-out;
      }

      .loading-container.fade-out {
        opacity: 0;
      }

      .content-container {
        opacity: 0;
        transition: opacity 0.3s ease-in-out;
      }

      .content-container.fade-in {
        opacity: 1;
      }

      @media screen and (max-width: 350px) {
        .gift-card {
          padding: 20px;
        }

        .gift-amount {
          font-size: 35px;
        }
      }
    </style>

    <script>
      // --- CONFIGURATION ---
      const IOS_STORE_URL = 'https://testflight.apple.com/join/r8MfbNa6';
      const ANDROID_STORE_URL = 'https://play.google.com/store/apps/details?id=com.blitzwallet';
      let pageHidden = false;
      
      // Time (in milliseconds) to wait before executing the fallback redirect.
      const FALLBACK_TIMEOUT_MS = 1500; 

      const giftId = '${giftId}';
      const fragment = window.location.hash.substring(1);

      /**
       * Detects the user's mobile operating system.
       * @returns {'ios' | 'android' | 'other'}
       */
      function detectOS() {
          const userAgent = navigator.userAgent || navigator.vendor || window.opera;
          
          if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
              return 'ios';
          }
          if (/android/i.test(userAgent)) {
              return 'android';
          }
          return 'other';
      }

      /**
       * Updates the content of the loading container to show a status message
       * before the full gift card UI is rendered.
       */
      function updateLoadingStatus(message) {
          const loadingContainer = document.querySelector('.loading-container p');
          if (loadingContainer) {
              loadingContainer.textContent = message;
          }
      }

      /**
       * Core function to attempt deep link launch with store redirect fallback.
       */
      function attemptDeepLinkWithFallback(onlyPreNaigate = false) {
          const os = detectOS();
          const deepLink = \`blitz-wallet://gift/\${giftId}#\${fragment}\`;
          
          let storeUrl = '';
          if (os === 'ios') {
              storeUrl = IOS_STORE_URL;
          } else if (os === 'android') {
              storeUrl = ANDROID_STORE_URL;
          } else {
              // For desktop/other, just try the deep link, but no fallback needed.
              updateLoadingStatus('This link is optimized for mobile devices. Trying to open the app...');
              window.location.href = deepLink;
              return;
          }

          updateLoadingStatus('Attempting to open the Blitz Wallet app...');
          
          // 1. Attempt Deep Link Navigation
          // If successful, the user leaves the page and the timer is naturally stopped.
          window.location.href = deepLink;

          if (onlyPreNaigate) return

          // 2. Set Fallback Timer
          // If the app is NOT installed, the browser remains on this page, and the timer fires.
          const fallbackTimer = setTimeout(() => {
            if (pageHidden) {
              // App opened → tab got backgrounded → do not redirect
              return;
            }
              
            updateLoadingStatus(\`App not detected. Redirecting you to the \${os === 'ios' ? 'App Store' : 'Play Store'}...\`);

            // Redirect after a moment to read the message
            setTimeout(() => {
              if (!pageHidden) window.location.href = storeUrl;
            }, 1000); 

          }, FALLBACK_TIMEOUT_MS);
          
          // Return the timer ID in case we need to clear it (e.g., if we confirm app launch quickly, though less reliable).
          return fallbackTimer;
      }
      
      async function fetchGiftData() {
        try {
          const response = await fetch('/getBitcoinGiftDetails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ giftUUID: giftId })
          });

          if (!response.ok) {
            throw new Error('Failed to fetch gift data');
          }

          const data = await response.json();
          return { data, error: null };
        } catch (error) {
          return { data: null, error: error.message };
        }
      }

      function updateMetaTags(formattedAmount) {
        const title = \`Claim your \${formattedAmount ? \`₿\${formattedAmount}\` : "Bitcoin"} Gift!\`;
        
        // Update title
        document.title = title;
        
        // Update Open Graph tags
        document.querySelector('meta[property="og:title"]').setAttribute('content', title);
        
        // Update Twitter tags
        document.querySelector('meta[property="twitter:title"]').setAttribute('content', title);
      }

      function renderGiftCard(giftData, loadError) {
        const container = document.getElementById('app');
        
        // Hide loading spinner with fade out
        const loadingContainer = document.querySelector('.loading-container');
        if (loadingContainer) {
          loadingContainer.classList.add('fade-out');
        }

        setTimeout(() => {
          if (loadError) {
            container.innerHTML = \`
              <div class="content-container fade-in">
                <div class="error-message gift-card" style="box-shadow: none;">
                  <h2 class="gift-title">Error Loading the Gift</h2>
                  <p class="gift-description">\${loadError}</p>
                </div>
              </div>
            \`;
            return;
          }

          if (!giftData) {
            container.innerHTML = \`
              <div class="content-container fade-in">
                <div class="error-message gift-card" style="box-shadow: none;">
                  <h2 class="gift-title">The Gift was Not Found</h2>
                  <p class="gift-description">This Gift doesn't exist or has been claimed.</p>
                </div>
              </div>
            \`;
            return;
          }

          const isExpired = Date.now() > giftData.expireTime;
          const isClaimed = giftData.state === 'Claimed';
          const formattedAmount = giftData.amount?.toLocaleString();
          const expiresDate = new Date(giftData.expireTime).toLocaleDateString();
          updateMetaTags(formattedAmount);

          container.innerHTML = \`
            <div class="content-container">
              <h1 class="gift-title">Claim your Bitcoin Gift!</h1>
              <div class="gift-amount">₿\${formattedAmount}</div>
              \${giftData.description ? \`<p class="gift-description">\${giftData.description}</p>\` : ''}
              
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Expires</span>
                  <span class="info-value">\${expiresDate}</span>
                </div>
              </div>

              \${!isClaimed && !isExpired ? \`
                <button class="claim-button" onclick="claimGift()">
                  Claim in Blitz Wallet
                </button>
                <button class="copy-button" onclick="copyGift()">
                  Copy Claim Link
                </button>
              \` : \`
                <div class="error-message">
                  <p class="gift-description">\${isClaimed ? 'This Bitcoin Gift has already been claimed.' : 'This Bitcoin Gift has expired.'}</p>
                </div>
              \`}
            </div>
          \`;

          // Trigger fade in
          setTimeout(() => {
            container.querySelector('.content-container').classList.add('fade-in');
          }, 50);
        }, 300); // Wait for fade out to complete
      }

      function claimGift() {
        attemptDeepLinkWithFallback();
      }

      function copyGift() {
        const giftLink = \`https://blitzwalletapp.com/gift/\${giftId}#\${fragment}\`;

        // Copy the text inside the text field
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

      // Fetch and render when DOM is ready
      document.addEventListener('DOMContentLoaded', () => {

        // Then fetch and render the UI after a short delay
        setTimeout(async () => {
          const { data, error } = await fetchGiftData();
          if (!error){
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
            <p>Loading Bitcoin Gift...</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Google tag (gtag.js) -->
    <script
      async
      src="https://www.googletagmanager.com/gtag/js?id=G-WNRJ7Y4RVE"
    ></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag() {
        dataLayer.push(arguments);
      }
      gtag("js", new Date());
      gtag("config", "G-WNRJ7Y4RVE");
    </script>
  </body>
</html>`;
}
