"use strict";
const modalContainer = document.querySelector(".modalContainer");
const modal = document.querySelector(".modal");
const appCards = document.querySelectorAll(".appCard");

function toggleModal(e) {
  e.preventDefault();

  console.log(e);
  console.log("test");
  modalContainer.style.display =
    modalContainer.style.display === "flex" ? "none" : "flex";
}
console.log(appCards);

appCards.forEach((card) => {
  card.addEventListener("click", toggleModal);
});

modalContainer.addEventListener("click", toggleModal);

modal.addEventListener("click", (e) => {
  e.stopPropagation();
});
