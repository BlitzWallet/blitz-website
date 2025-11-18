import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

export async function handler(event, context) {
  const path = event.path;
  const giftId = path.split("/").pop();

  // Fetch gift data from Firebase using Admin SDK
  let giftData = null;
  let error = null;

  try {
    const db = admin.firestore();
    const cardResponse = await db.collection("blitzGifts").get(giftId);
    if (cardResponse.empty) throw new Error("no data");
    const [cardDoc] = cardResponse.docs;
    giftData = cardDoc.data();
  } catch (err) {
    error = err.message;
  }

  const formattedAmount = giftData.amount?.toLocaleString();

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "text/html",
    },
    body: `<!DOCTYPE html>
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
    
    <title>Claim your ₿${formattedAmount} Gift!</title>
    <meta
      name="description"
      content="You've received a Bitcoin gift card! Claim it with Blitz Wallet."
    />

    <!-- Open Graph / Facebook -->
    <meta property="og:image" content="https://blitzwalletapp.com/public/twitterCard.png" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://blitzwalletapp.com/gift/${giftId}" />
    <meta property="og:title" content="Claim your ₿${formattedAmount} Gift!" />
    <meta property="og:description" content="You've received a Bitcoin gift card! Claim it with Blitz Wallet." />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content="https://blitzwalletapp.com/public/twitterCard.png">
    <meta property="twitter:url" content="https://blitzwalletapp.com/gift/${giftId}" />
    <meta property="twitter:title" content="Claim your ₿${formattedAmount} Gift!" />
    <meta property="twitter:description" content="You've received a Bitcoin gift card! Claim it with Blitz Wallet." />

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
        color: var(--primary_color);
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

      .error-message {
        padding: 20px;
        border-radius: 8px;
      }
      .error-message p {
       margin-top: 20px;
      }


      @media screen and (max-width: 350px) {
        .gift-card {
          padding: 20px;
        }

        .gift-amount {
          font-size: 35px;
        }

      .formContainer form {
        width: 100%;
        max-width: 800px;
        margin: 0 auto;
      }
      .formContainer button {
        margin: 0 auto;
      }
    }

  
    </style>

    <script>
      const giftData = ${giftData ? JSON.stringify(giftData) : "null"};
      const loadError = ${error ? JSON.stringify(error) : "null"};
      const giftId = '${giftId}';
      const fragment = window.location.hash.substring(1);

      function renderGiftCard() {
        const container = document.getElementById('app');
        
        if (loadError) {
          container.innerHTML = \`
            <div class="error-message">
              <h2>Error Loading Gift Card</h2>
              <p>\${loadError}</p>
            </div>
          \`;
          return;
        }

        if (!giftData) {
          container.innerHTML = \`
            <div class="error-message">
              <h2>Gift Card Not Found</h2>
              <p>This gift card doesn't exist or has been removed.</p>
            </div>
          \`;
          return;
        }

        const isExpired = Date.now() > giftData.expireTime;
        const isClaimed = giftData.state === 'Claimed';
        
    
        const expiresDate = new Date(giftData.expireTime).toLocaleDateString();

        container.innerHTML = \`
          <h1 class="gift-title">Bitcoin Gift Card</h1>
          <div class="gift-amount">₿${formattedAmount}</div>
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
          \` : \`
            <div class="error-message">
              <p>\${isClaimed ? 'This gift card has already been claimed.' : 'This gift card has expired.'}</p>
            </div>
          \`}
        \`;
      }

      function claimGift() {
        const deepLink = \`blitz-wallet://gift/\${giftId}#\${fragment}\`;
        const fallbackUrl = 'https://blitzwalletapp.com';
        
        window.location.href = deepLink;
        
        setTimeout(() => {
          if (confirm('Blitz Wallet is not installed. Would you like to download it?')) {
            window.location.href = fallbackUrl;
          }
        }, 2000);
      }

      document.addEventListener('DOMContentLoaded', renderGiftCard);
    </script>
  </head>
  <body>
    <div class="gift-container">
      <div class="gift-card">
        <div id="app">
          ${!giftData && !error ? "<p>Loading gift card...</p>" : ""}
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
</html>`,
  };
}
