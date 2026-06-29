"use strict";
const IOS_STORE_URL = "https://apps.apple.com/us/app/blitz-wallet/id6476810582";
const ANDROID_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.blitzwallet";
const childMatch = window.location.pathname.match(/child\/([0-9A-Fa-f]{16})/i);
const childId = childMatch ? childMatch[1] : "";
const currentUrl = new URL(window.location.href);

function openInApp() {
  if (!childId) return;
  window.location.href = `blitz-wallet://child/${childId}`;
}

function copyInvite() {
  const inviteLink = currentUrl.origin + currentUrl.pathname;
  navigator.clipboard.writeText(inviteLink);

  const button = document.querySelector(".copy-button");
  if (button) {
    const originalText = button.textContent;
    button.textContent = "Link Copied!";
    setTimeout(() => {
      button.textContent = originalText;
    }, 2000);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (window.lucide) lucide.createIcons();
});
