"use strict";
const downloadBTN = document.querySelectorAll(".downloadButton");
const modalContainer = document.querySelector(".modalContainer");
const modal = document.querySelector(".modal");
const appCards = document.querySelectorAll(".downloadModal");
const qrCode = document.getElementById("qr-code");
const qrContentType = document.querySelector(".downloadTypeInModal");
const initialQRText = "https://testflight.apple.com/join/r8MfbNa6";

function toggleModal(e) {
  const isUsingMobile = isMobileCheck();
  console.log(isUsingMobile);
  console.log(isAndroid());

  if (isUsingMobile) {
    window.open(
      !isAndroid()
        ? "https://testflight.apple.com/join/r8MfbNa6"
        : "https://play.google.com/store/apps/details?id=com.blitzwallet",
      "_self"
    );
    return;
  }
  e.preventDefault();
  console.log(e);
  console.log("test");
  modalContainer.style.display =
    modalContainer.style.display === "flex" ? "none" : "flex";
  document.body.style.overflow =
    modalContainer.style.display === "flex" ? "hidden" : "scroll";

  modalContainer.style.top = `${window.scrollY}px`;
}

// Create QR code
const qrcode = new QRCode(document.getElementById("qr-code"), {
  text: initialQRText,
  width: 256,
  height: 256,
  colorDark: "#000000",
  colorLight: "#ffffff",
  correctLevel: QRCode.CorrectLevel.H,
});

function toggleQRContentType(e) {
  const targetElement = e.target;
  const parentElement = targetElement.parentNode;
  console.log(targetElement.classList, "TEST");
  if (Array.from(targetElement.classList).includes("downloadTypeInModal"))
    return;
  Array.from(parentElement.children).forEach((child) => {
    child.classList.remove("active");
  });
  targetElement.classList.add("active");

  qrcode.clear();
  qrcode.makeCode(
    Array.from(targetElement.classList).includes("IOS")
      ? "https://testflight.apple.com/join/r8MfbNa6"
      : "https://play.google.com/store/apps/details?id=com.blitzwallet"
  );
}

function isMobileCheck() {
  return document.body.getBoundingClientRect().width < 800;
}

function isAndroid() {
  const ua = navigator.userAgent || navigator.vendor;

  return /Android/i.test(ua) && !/iPhone|iPad|Macintosh|iPod/i.test(ua);
}
appCards.forEach((card) => {
  card.addEventListener("click", toggleModal);
});
downloadBTN.forEach((child) => {
  child.addEventListener("click", toggleModal);
});

qrContentType.addEventListener("click", toggleQRContentType);

modalContainer.addEventListener("click", toggleModal);

modal.addEventListener("click", (e) => {
  e.stopPropagation();
});
