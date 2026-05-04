function serializeForInlineScript(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export async function handler(event, context) {
  const path = (event.path || "").replace(/\/+$/, "");
  let username = path.split("/").pop() || "";
  try {
    username = decodeURIComponent(username);
  } catch (e) {
    // Keep raw username if decode fails.
  }
  const serializedUsername = serializeForInlineScript(username);

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
    <link rel="canonical" href="https://blitzwalletapp.com/u/${username}" />

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
    <meta
      name="apple-itunes-app"
      content="app-id=6476810582, app-argument=https://blitzwalletapp.com/u/${username}"
    />
    <link rel="manifest" href="/public/favicon/site.webmanifest" />
    
   
    <title>Blitz Wallet | ${username}</title>
    <meta
      name="description"
      content="Blitz Wallet is a self-custodial Bitcoin wallet that lets you make payments with friends, spend Bitcoin at stores, and simplifies Bitcoin payments. Download the IOS or Android app today."
    />

    <!-- Open Graph / Facebook -->
    <meta property="og:image" content="https://blitzwalletapp.com/public/twitterCardAddContact.png" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://blitzwalletapp.com/u/${username}" />
    <meta property="og:title" content="Blitz Wallet | ${username}" />
    <meta property="og:description" content="Blitz Wallet is a self-custodial Bitcoin wallet that lets you make payments with friends, spend Bitcoin at stores, and simplifies Bitcoin payments. Download the IOS or Android app today." />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content="https://blitzwalletapp.com/public/twitterCardAddContact.png">
    <meta property="twitter:url" content="https://blitzwalletapp.com/u/${username}" />
    <meta property="twitter:title" content="Blitz Wallet | ${username}" />
    <meta property="twitter:description" content="Blitz Wallet is a self-custodial Bitcoin wallet that lets you make payments with friends, spend Bitcoin at stores, and simplifies Bitcoin payments. Check out ${username} on Blitz Wallet." />
    

    <!-- Open Graph Meta for Apple -->
    <meta property="og:title" content="${username}" />
    <meta property="og:site_name" content="Blitz Wallet" />
    <meta property="og:description" content="Check out ${username} on Blitz Wallet." />
    <meta property="og:url" content="https://blitzwalletapp.com/u/${username}" />

    <meta name="robots" content="noindex,nofollow">
    <meta name="googlebot" content="noindex,nofollow">
    <script src="/src/js/font-loader.js" defer></script>

    <link rel="stylesheet" href="../src/assets/styles/index.css" />
    <link rel="stylesheet" href="/src/components/downloadModal/style.css" />
    <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js" defer></script>
    <script src="/src/components/downloadModal/index.js" defer></script>
    <style>
    body {
      width: 100dvw;
      min-height: 100dvh;
      background-color: var(--lm-background);
      display: flex;
      flex-direction: column;
      }
      .container {
      width: 90%;
      max-width: 1800px;
      height: fit-content;
      min-height: 100dvh;
      display: flex;
      flex-direction: column;
      margin: 0 auto;
      }

      .wordmarkContainer {
      width: 100%;
      margin: 20px auto;
      }
      .wordmarkContainer img {
      width: 180px;
      }

      .contentContainer {
      width: 95%;
      max-width: 800px;
      margin: auto auto;
      text-align: center;
      }
      .contentContainer h1 {
      font-size: 44px;
      font-weight: 400;
      margin-top:40px;
      color: var(--lm-text);
      text-transform: capitalize;
      }
      .contentContainer .subHeader {
      font-size: 18px;
      opacity: 0.7;
      font-weight: 400;
      margin-top: 16px;
      margin-bottom: 8px;
      color: var(--lm-text);
      }

      .contentContainer .buttonContainer {
      width: 100%;
      max-width: 440px;
      align-items: center;
      display: flex;
      flex-direction: column;
      margin: 56px auto 0;
      }
      .contentContainer .button {
      width: 100%;
      min-height: 45px;
      text-decoration: none;
      margin: 10px 0;
      border-radius: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      }
      .contentContainer #blitzLink {
      background-color: var(--primary_color);
      }
      .contentContainer #blitzLink p {
      color: var(--lm-background);
      }

      .contentContainer .buttonContainer #downloadBtn {
         border: 1px solid var(--lm-text);
         
      }

       .contentContainer .buttonContainer #downloadBtn img {
        width: 18px;
        height: 18px;
        margin-right:10px;
         
      }
      
      .contentContainer p {
      text-decoration: none;
      color: var(--lm-text);
      }

      
.profile-section {
  text-align: center;
  margin-bottom: 3rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.loading-screen {
  width: 100%;
  min-height: 100dvh;
  display: grid;
  place-items: center;
  padding: 2rem;
}

.loading-screen[hidden] {
  display: none;
}

.loading-screen-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1.25rem;
}

.loading-wordmark {
  width: 220px;
  max-width: 65vw;
}

.loading-copy {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.loading-copy h1 {
  margin: 0;
  color: var(--lm-text);
  font-size: clamp(2rem, 4vw, 3.5rem);
  font-weight: 400;
}

.loading-copy p {
  margin: 0;
  color: var(--lm-text);
  opacity: 0.72;
}

.loading-indicator {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  border: 4px solid color-mix(in srgb, var(--primary_color) 16%, transparent);
  border-top-color: var(--primary_color);
  animation: loading-screen-spin 0.95s linear infinite;
}

@keyframes loading-screen-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.avatar-toggle {
  position: relative;
  width: 125px;
  height: 125px;
  cursor: pointer;
  flex-shrink: 0;
  margin-bottom: 1rem;
}

.avatar-primary {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: linear-gradient(
    135deg,
    var(--primary_color),
    var(--tertiary_color)
  );
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  font-weight: 700;
  color: white;
  overflow: hidden;
  transition:
    transform 0.3s ease,
    opacity 0.3s ease;
  transform-origin: bottom right;
  z-index: 1;
}
.avatar-primary img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-badge {
  position: absolute;
  bottom: -3px;
  right: -3px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  transition:
    transform 0.3s ease,
    width 0.3s ease,
    height 0.3s ease,
    bottom 0.3s ease,
    right 0.3s ease,
    border 0.3s ease;
  transform-origin: bottom right;
  z-index: 2;
}
.avatar-badge svg {
  width: 100%;
  height: 100%;
  display: block;
}

/*
 * Flipped state: identicon (badge) expands to primary position,
 * primary shrinks to badge corner.
 * scale(0.38) from transform-origin: bottom right anchors the
 * 52px primary element into the ~20px badge position naturally.
 */
.avatar-toggle.flipped .avatar-primary {
  transform: scale(0.32);
  opacity: 0.9;
  z-index: 2;
}
.avatar-toggle.flipped .avatar-badge {
  width: 125px;
  height: 125px;
  bottom: 0;
  right: 0;
  border: none;
  z-index: 1;
}

.username-display {
    color: var(--lm-text);
    text-transform: capitalize;
  }
  
      @media screen and (max-width: 500px) {
      .contentContainer h2 {
        font-size: 16px;
      }
      }

       @media screen and (max-width: 960px){

        .contentContainer h1{
        font-size:36px;
        margin-top: 24px;
        
        }
       
       }
    </style>
    <script>
    // Download links
    const IOS_STORE_URL = "https://apps.apple.com/us/app/blitz-wallet/id6476810582";
    const ANDROID_STORE_URL =
    "https://play.google.com/store/apps/details?id=com.blitzwallet";
    const username = ${serializedUsername};
    const currentUrl = new URL(window.location.href);
    const SPOKE_COUNTS = [4, 6, 8, 10, 12];

    function getEmptyProfile() {
      return { uuid: null, hasProfileImage: false, storageBaseUrl: null };
    }

    function getBadgeConfig(bytes) {
    const b = bytes;
    const spokeCount = SPOKE_COUNTS[b[0] % 5];
    const spokeBits = (b[1] << 16) | (b[2] << 8) | b[3];
    const rotationSteps = b[4] % 16;
    const baseAngle = rotationSteps * (360 / spokeCount / 16);
    const spokes = Array.from({ length: spokeCount }, (_, i) => {
      const bits = (spokeBits >> (i * 2)) & 0b11;
      const height =
        bits === 0b11 ? "tall" : bits === 0b01 || bits === 0b10 ? "medium" : "short";
      return { angle: baseAngle + i * (360 / spokeCount), height };
    });
    return { spokes };
  }

  function buildIdenticonSVG(bytes, size) {
    const clipId = \`ic-clip-\${Math.random().toString(36).slice(2, 8)}\`;
    const { spokes } = getBadgeConfig(bytes);
    const cx = size / 2, cy = size / 2, r = size / 2;
    const bgColor = "#e3e3e3";
    const strokeColor = "#262626";
    const tallOuterR = r * 0.85, mediumOuterR = r * 0.65, shortOuterR = r * 0.45;
    const hubR = r * 0.1, ringR = r * 0.3;
    const sw = Math.max(1.5, size * 0.03);
    const lines = spokes
      .map(({ angle, height }) => {
        const rad = (angle - 90) * (Math.PI / 180);
        const tipR = height === "tall" ? tallOuterR : height === "medium" ? mediumOuterR : shortOuterR;
        const opacity = height === "tall" ? 1 : height === "medium" ? 0.7 : 0.4;
        const x1 = cx + hubR * Math.cos(rad), y1 = cy + hubR * Math.sin(rad);
        const x2 = cx + tipR * Math.cos(rad), y2 = cy + tipR * Math.sin(rad);
        return \`<line x1="\${x1.toFixed(2)}" y1="\${y1.toFixed(2)}" x2="\${x2.toFixed(2)}" y2="\${y2.toFixed(2)}" stroke="\${strokeColor}" stroke-width="\${sw}" stroke-linecap="round" opacity="\${opacity}"/>\`;
      })
      .join("");
    return \`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 \${size} \${size}" width="\${size}" height="\${size}">
      <defs><clipPath id="\${clipId}"><circle cx="\${cx}" cy="\${cy}" r="\${r}"/></clipPath></defs>
      <circle cx="\${cx}" cy="\${cy}" r="\${r}" fill="\${bgColor}"/>
      <g clip-path="url(#\${clipId})">
        \${lines}
        <circle cx="\${cx}" cy="\${cy}" r="\${ringR}" fill="none" stroke="\${strokeColor}" stroke-width="2"/>
        <circle cx="\${cx}" cy="\${cy}" r="\${hubR}" fill="\${bgColor}"/>
        <circle cx="\${cx}" cy="\${cy}" r="\${(hubR * 0.55).toFixed(2)}" fill="\${strokeColor}"/>
      </g>
    </svg>\`;
  }


    /**
     * Detects the user's mobile operating system.
     * @returns {'ios' | 'android' | 'other'}
     */
    function detectOS() {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;

      if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        return "ios";
      }
      if (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) {
        return "ios";
      }
      if (/android/i.test(userAgent)) {
        return "android";
      }
      return "other";
    }


    function buildLinks() {
      const safeUsername = encodeURIComponent(username || "");
      const httpsLink =
        currentUrl.origin +
        currentUrl.pathname +
        currentUrl.search +
        currentUrl.hash;
      const deepLink =
        "blitz-wallet://u/" + safeUsername + currentUrl.search + currentUrl.hash;
      return { httpsLink, deepLink };
    }


    function openInApp(event) {
      if (event && event.isTrusted !== true) return;
      const os = detectOS();
      const links = buildLinks();

      if (os === "other") {
        window.location.href = links.httpsLink;
        return;
      }

      if (os === "android") {
        window.location.href = links.deepLink;
        return;
      }

      window.location.href = links.httpsLink;
    }

    async function fetchProfileData() {
      try {
        const res = await fetch(
          \`/getTipsData/\${encodeURIComponent(username)}\`,
        );

        if (!res.ok) {
          return getEmptyProfile();
        }

        const payload = await res.json();
        if (payload && typeof payload === "object" && payload.data) {
          return payload.data || getEmptyProfile();
        }

        return payload || getEmptyProfile();
      } catch (err) {
        console.error("Failed to load profile data", err);
        return getEmptyProfile();
      }
    }



   
      document.addEventListener("DOMContentLoaded", async function () {
      document.getElementById("blitzLink").addEventListener("click", (e) => {
        const os = detectOS();
        if (os === "ios" || os === "other") return;
        e.preventDefault();
        openInApp(e);
      });

      const loadingScreenEl = document.getElementById("loadingScreen");
      const loadedScreenEl = document.getElementById("loadedScreen");

      function setScreenState(state) {
        const isLoading = state === "loading";
        loadingScreenEl.hidden = !isLoading;
        loadedScreenEl.hidden = isLoading;
        loadingScreenEl.setAttribute("aria-busy", isLoading ? "true" : "false");
      }

      async function renderAvatar(profile) {
        const { uuid, hasProfileImage, storageBaseUrl } = profile;
        const primaryEl = document.getElementById("avatar-primary");
        const badgeEl = document.getElementById("avatar-badge");
        const toggleEl = document.getElementById("avatar-toggle");


        badgeEl.style.display = "";
        toggleEl.style.cursor = "pointer";

        if (!uuid) {
          badgeEl.style.display = "none";
          toggleEl.style.cursor = "default";
          return;
        }

        if (crypto?.subtle) {
          const bytes = new Uint8Array(
            await crypto.subtle.digest("SHA-256", new TextEncoder().encode(uuid)),
          );
          badgeEl.innerHTML = buildIdenticonSVG(bytes, 125);
          toggleEl.addEventListener("click", () =>
            toggleEl.classList.toggle("flipped"),
          );
        } else {
          badgeEl.style.display = "none";
          toggleEl.style.cursor = "default";
        }

        if (hasProfileImage && storageBaseUrl) {
          await new Promise((resolve) => {
            const img = document.createElement("img");
            img.alt = username;
            img.onload = () => {
              primaryEl.textContent = "";
              primaryEl.appendChild(img);
              resolve();
            };
            img.onerror = () => resolve();
            img.src = storageBaseUrl;
          });
        }
      }

      setScreenState("loading");

      try {
        const profileData = await fetchProfileData();
        await renderAvatar(profileData);
      } catch (err) {
        console.error("Failed to render loaded profile screen", err);
        await renderAvatar(getEmptyProfile());
      } finally {
        setScreenState("loaded");
      }

      });
    </script>
  </head>
  <body>
  <section class="loading-screen" id="loadingScreen" aria-live="polite" aria-busy="true">
    <div class="loading-screen-content">
      <div class="loading-indicator" aria-hidden="true"></div>
    </div>
  </section>
  <section class="container" id="loadedScreen" hidden>
    <div class="wordmarkContainer">
      <a href="/">
        <img src="/public/wordmark.png" alt="blitz wallet wordmark logo to take you back to the homepage" />
      </a>
    </div>
    <div class="contentContainer">
     <div class="profile-section">
        <div class="avatar-toggle" id="avatar-toggle">
          <div class="avatar-primary" id="avatar-primary">
            <i
              style="width: 40px; height: 40px"
              data-lucide="user-round"
            ></i>
          </div>
          <div class="avatar-badge" id="avatar-badge"></div>
        </div>
       <span class="username-display" id="username-display">@${username}</span>
      </div>


      <h1 class="header">Open Blitz to pay this person</h1>
      <p class="subHeader">Or download Blitz Wallet</p>

      <div class="buttonContainer">
        <a id="blitzLink" href="https://blitzwalletapp.com/u/${username}" class="button">
          <p>Open the app</p>
        </a>
        <a id="downloadBtn" class="button download-btn">
          <img src="https://blitzwalletapp.com/public/icon.png"/>
          <p>Get Blitz Wallet</p>
        </a>
      </div>
    </div>
    <!-- Download Modal -->
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
          <a href="https://apps.apple.com/us/app/blitz-wallet/id6476810582" class="store-badge" id="iosLink" target="_blank">
            <i data-lucide="apple"></i>
            <span>App Store</span>
          </a>
          <a href="https://play.google.com/store/apps/details?id=com.blitzwallet" class="store-badge" id="androidLink" target="_blank">
            <i data-lucide="play"></i>
            <span>Play Store</span>
          </a>
        </div>
      </div>
    </div>
  </div>
  </section>
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
