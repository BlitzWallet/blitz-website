"use strict";

// Download Modal Functionality
const modalContainer = document.getElementById("modalContainer");
const modalBackdrop = document.getElementById("modalBackdrop");
const modalClose = document.getElementById("modalClose");
const modalTabs = document.querySelectorAll(".modal-tab");

let qrcode = null;
// Agentic browsing / a11y: give the dialog proper semantics so it appears
// correctly in the accessibility tree (agents navigate via the a11y tree).
if (modalContainer && !modalContainer.hasAttribute("role")) {
  modalContainer.setAttribute("role", "dialog");
}
if (modalContainer && !modalContainer.hasAttribute("aria-modal")) {
  modalContainer.setAttribute("aria-modal", "true");
}
if (modalContainer && !modalContainer.hasAttribute("aria-label")) {
  modalContainer.setAttribute("aria-label", "Download Blitz Wallet");
}
if (modalClose && !modalClose.hasAttribute("aria-label")) {
  modalClose.setAttribute("aria-label", "Close download dialog");
}
if (modalClose && !modalClose.hasAttribute("type")) {
  modalClose.setAttribute("type", "button");
}
document.querySelectorAll(".modal-tab").forEach((tab) => {
  if (!tab.hasAttribute("type")) tab.setAttribute("type", "button");
  if (!tab.hasAttribute("aria-pressed")) {
    tab.setAttribute(
      "aria-pressed",
      tab.classList.contains("active") ? "true" : "false",
    );
  }
});
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

  // Move focus into the dialog so keyboard users and agents land on it.
  if (modalClose && typeof modalClose.focus === "function") {
    modalClose.focus({ preventScroll: true });
  }

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

// Escape closes the dialog from anywhere.
document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    modalContainer &&
    modalContainer.classList.contains("active")
  ) {
    hideModal();
  }
});

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
    modalTabs.forEach((t) =>
      t.setAttribute("aria-pressed", t === tab ? "true" : "false"),
    );
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
