"use strict";

// Download Modal Functionality
const modalContainer = document.getElementById("modalContainer");
const modalBackdrop = document.getElementById("modalBackdrop");
const modalClose = document.getElementById("modalClose");
const modalTabs = document.querySelectorAll(".modal-tab");

let qrcode = null;
const iosUrl = "https://apps.apple.com/us/app/blitz-wallet/id6476810582";
const androidUrl =
  "https://play.google.com/store/apps/details?id=com.blitzwallet";

// Initialize QR code
function initQRCode(url) {
  const qrElement = document.getElementById("qr-code");
  qrElement.innerHTML = ""; // Clear existing QR code

  qrcode = new QRCode(qrElement, {
    text: url,
    width: 200,
    height: 200,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H,
  });
}

// Show modal
function showModal() {
  modalContainer.classList.add("active");
  modalBackdrop.classList.add("active");
  document.body.style.overflow = "hidden";

  // Initialize QR code with iOS URL by default
  if (!qrcode) {
    initQRCode(iosUrl);
  }
}

// Hide modal
function hideModal() {
  modalContainer.classList.remove("active");
  modalBackdrop.classList.remove("active");
  document.body.style.overflow = "";
}

// Tab switching
modalTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    // Remove active class from all tabs
    modalTabs.forEach((t) => t.classList.remove("active"));
    // Add active class to clicked tab
    tab.classList.add("active");

    // Update QR code
    const platform = tab.dataset.platform;
    const url = platform === "ios" ? iosUrl : androidUrl;
    initQRCode(url);
  });
});

// Close modal
modalClose.addEventListener("click", hideModal);
modalBackdrop.addEventListener("click", hideModal);

// Download button functionality
function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
}

function isAndroid() {
  return /Android/i.test(navigator.userAgent);
}

function isIOS() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

document.querySelectorAll(".download-btn").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();

    if (isMobile()) {
      // Mobile: Direct redirect
      if (isAndroid()) {
        window.location.href = androidUrl;
      } else if (isIOS()) {
        window.location.href = iosUrl;
      }
    } else {
      // Desktop: Show modal
      showModal();
    }
  });
});
