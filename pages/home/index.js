// "use strict";
// const modalContainer = document.querySelector(".modalContainer");
// const modal = document.querySelector(".modal");
// const appCards = document.querySelectorAll(".downloadModal");
// const qrCode = document.getElementById("qr-code");
// const qrContentType = document.querySelector(".downloadTypeInModal");
// const initialQRText = "https://testflight.apple.com/join/r8MfbNa6";

// function toggleModal(e) {
//   const isUsingMobile = isMobileCheck();
//   console.log(isUsingMobile);
//   console.log(isAndroid());
//   if (isUsingMobile) {
//     window.open(
//       !isAndroid()
//         ? "https://testflight.apple.com/join/r8MfbNa6"
//         : "https://github.com/BlitzWallet/BlitzWallet/tags",
//       "_self"
//     );
//     return;
//   }
//   e.preventDefault();
//   console.log(e);
//   console.log("test");
//   modalContainer.style.display =
//     modalContainer.style.display === "flex" ? "none" : "flex";
//   document.body.style.overflow =
//     modalContainer.style.display === "flex" ? "hidden" : "scroll";

//   modalContainer.style.top = `${window.scrollY}px`;
// }

// // Create QR code
// const qrcode = new QRCode(document.getElementById("qr-code"), {
//   text: initialQRText,
//   width: 256,
//   height: 256,
//   colorDark: "#000000",
//   colorLight: "#ffffff",
//   correctLevel: QRCode.CorrectLevel.H,
// });

// function toggleQRContentType(e) {
//   const targetElement = e.target;
//   const parentElement = targetElement.parentNode;
//   console.log(targetElement.classList, "TEST");
//   if (Array.from(targetElement.classList).includes("downloadTypeInModal"))
//     return;
//   Array.from(parentElement.children).forEach((child) => {
//     child.classList.remove("active");
//   });
//   targetElement.classList.add("active");

//   qrcode.clear();
//   qrcode.makeCode(
//     Array.from(targetElement.classList).includes("IOS")
//       ? "https://testflight.apple.com/join/r8MfbNa6"
//       : "https://github.com/BlitzWallet/BlitzWallet/tags"
//   );
// }

// function isMobileCheck() {
//   let isMobile;
//   if ("maxTouchPoints" in navigator) {
//     isMobile = navigator.maxTouchPoints > 0;
//   } else if ("msMaxTouchPoints" in navigator) {
//     isMobile = navigator.msMaxTouchPoints > 0;
//   } else {
//     isMobile =
//       /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
//         navigator.userAgent
//       );
//   }
//   return isMobile;
// }

// // Check if device is Android
// function isAndroid() {
//   return /Android/i.test(navigator.userAgent);
// }
// appCards.forEach((card) => {
//   card.addEventListener("click", toggleModal);
// });

// qrContentType.addEventListener("click", toggleQRContentType);

// modalContainer.addEventListener("click", toggleModal);

// modal.addEventListener("click", (e) => {
//   e.stopPropagation();
// });
