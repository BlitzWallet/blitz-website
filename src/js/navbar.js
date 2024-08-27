// "use strict";

const hamburgerMenuBTN = document.querySelector(".mobileNavBTN");
const mobileNavContent = document.querySelector(".mobileNavDropdown");
const navigationIcon = document.querySelectorAll(".navigationIcon");

console.log(navigationIcon);
navigationIcon.forEach((item) => {
  console.log(item);
});

function handleMobileNavClick() {
  console.log(window.scrollY);
  if (mobileNavContent.style.display === "flex") {
    mobileNavContent.style.display = "none";
    document.body.style.overflow = "scroll";
    navigationIcon.forEach((item, index) => {
      console.log(item);
      item.classList.remove("shwon");
      item.classList.remove("hidden");
      if (index == 0) item.classList.add("shown");
      else item.classList.add("hidden");
    });
  } else {
    mobileNavContent.style.display = "flex";
    document.body.style.overflow = "hidden";
    navigationIcon.forEach((item, index) => {
      console.log(item);
      item.classList.remove("shwon");
      item.classList.remove("hidden");
      if (index == 1) item.classList.add("shown");
      else item.classList.add("hidden");
    });
  }
}

[hamburgerMenuBTN].forEach((btn) => {
  btn.addEventListener("click", handleMobileNavClick);
});
