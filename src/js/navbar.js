// "use strict";

const hamburgerMenuBTN = document.querySelector(".mobileNavBTN");
const mobileNavContent = document.querySelector(".mobileNavDropdown");
const navigationIcon = document.querySelector(".navigationIcon");

function handleMobileNavClick() {
  console.log(window.scrollY);
  if (mobileNavContent.style.display === "flex") {
    mobileNavContent.style.display = "none";
    document.body.style.overflow = "scroll";
    navigationIcon.src = "./src/assets/images/hamburger.svg";
  } else {
    mobileNavContent.style.display = "flex";
    document.body.style.overflow = "hidden";
    navigationIcon.src = "./src/assets/images/xIcon.svg";
  }
}

[hamburgerMenuBTN].forEach((btn) => {
  btn.addEventListener("click", handleMobileNavClick);
});
