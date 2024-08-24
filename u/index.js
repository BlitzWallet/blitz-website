"use strict";

const header = document.querySelector(".header");
const blitzLinkButton = document.querySelector("#blitzLink");

function router() {
  const path = window.location.pathname;
  const userName = path.split("/").pop();

  blitzLinkButton.click();
}

router();
