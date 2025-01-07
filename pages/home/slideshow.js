"use strict";

const sliderBTNS = document.querySelectorAll(".sliderBTNs");

let currentIndex = 0;
let currentTimeout = null; // Track the current timeout
const contentOrder = [
  {
    heading: "Explore the Blitz Store",
    subHeading:
      " Discover a seamless in-app store experience, designed to make spending your Bitcoin as easy as a few taps. Browse a curated selection of items and services, pay instantly, and enjoy the convenience of secure, wallet-integrated shopping.",
    image: "./src/assets//images/blitzStorePage.webp",
  },
  {
    heading: "Effortless Transactions with Contacts",
    subHeading:
      "Simplify your Bitcoin transfers with Blitz Wallet's Contacts feature. Save and manage your trusted contacts to send and receive payments with just a tap, making peer-to-peer transactions more convenient and secure than ever.",
    image: "./src/assets//images/blitzContactPage.webp",
  },
  {
    heading: "Transaction History",
    subHeading:
      "Keep an eye on every Bitcoin transaction with a detailed history at your fingertips. Access past payments, monitor spending, and stay in control with clear insights into your activity.",
    image: "./src/assets//images/blitzTransactions.webp",
  },
  {
    heading: "Point-of-sale",
    subHeading:
      "The point-of-sale (POS) system is designed to enable businesses to easily accept Bitcoin payments. This integrated POS solution provides a user-friendly interface for merchants to generate payment requests and receive bitcoin to the creators wallet.",
    image: "./src/assets//images/posPage.webp",
  },
];

function handleSlideShowClick(e) {
  const targetElement = e.target;
  const targetElementClassList = Array.from(targetElement.classList);
  if (!targetElementClassList.includes("sliderBTNImages")) return;
  const container = targetElement.parentElement.parentElement;

  const iphone = Array.from(container.parentElement.parentElement.children)[1]
    .children[0];

  const containerChildren = Array.from(container.children);
  const header = containerChildren[0];
  const subHeader = containerChildren[1];
  if (currentTimeout) {
    clearTimeout(currentTimeout);
    currentTimeout = null;
    return;
  }
  header.style.opacity = 0;
  subHeader.style.opacity = 0;
  if (targetElementClassList.includes("left")) {
    if (currentIndex === 0) currentIndex = contentOrder.length - 1;
    else currentIndex -= 1;
  } else {
    if (currentIndex === contentOrder.length - 1) currentIndex = 0;
    else currentIndex += 1;
  }
  currentTimeout = setTimeout(() => {
    header.innerHTML = contentOrder[currentIndex].heading;
    subHeader.innerHTML = contentOrder[currentIndex].subHeading;
    header.style.opacity = 1;
    subHeader.style.opacity = 1;
    iphone.src = contentOrder[currentIndex].image;
    currentTimeout = null; // Clear the reference after timeout completes
  }, 400);
}

sliderBTNS.forEach((btn) => {
  btn.addEventListener("click", handleSlideShowClick);
});
