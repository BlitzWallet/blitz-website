"use strict";

const blitzLinkButton = document.querySelector("#blitzLink");

function router() {
  try {
    blitzLinkButton.click();
  } catch (err) {
    console.log(err);
  }
}

document.addEventListener("DOMContentLoaded", router);
