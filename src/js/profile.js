const username = window.location.pathname.split("/").pop();

const IOS_STORE_URL = "https://apps.apple.com/us/app/blitz-wallet/id6476810582";

const ANDROID_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.blitzwallet";

/**
 * Detects the user's mobile operating system.
 * @returns {'ios' | 'android' | 'other'}
 */
function detectOS() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;

  if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
    return "ios";
  }
  if (/android/i.test(userAgent)) {
    return "android";
  }
  return "other";
}

/**
 * Core function to attempt deep link launch with store redirect fallback.
 */
function goToDownload() {
  const os = detectOS();

  let storeUrl = "";
  if (os === "ios") {
    storeUrl = IOS_STORE_URL;
  } else if (os === "android") {
    storeUrl = ANDROID_STORE_URL;
  } else {
    window.location.href = "/";
    return;
  }

  window.location.href = storeUrl;
}

document.body.innerHTML = `<section class="container">
      <div class="wordmarkContainer">
        <a href="/">
          <img src="/public/wordmark.png" alt="blitz wallet wordmark logo to take you back to the homepage" />
        </a>
      </div>
      <div class="contentContainer">
        <h1 class="header">Sign in to pay ${username}</h1>
        <p class="subHeader">or create a Blitz Wallet account</p>

        <div class="buttonContainer">
          <a id="blitzLink" href="blitz-wallet://u/${username}" class="button">
            <p>Go to app</p>
          </a>
          <a id="downloadBtn" class="button">
            <p>Download</p>
          </a>
        </div>
      </div>
    </section>`;

document.getElementById("downloadBtn").addEventListener("click", (e) => {
  e.preventDefault();
  goToDownload();
});
