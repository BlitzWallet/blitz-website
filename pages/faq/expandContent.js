const dropdownClickableItems = document.querySelectorAll(
  ".expandContainerCover"
);

function handleExpandedClick(event) {
  const targetEvent = event.target;
  const alwaysShowCOntainer = targetEvent.parentElement;
  const dropdownContianer = Array.from(
    alwaysShowCOntainer.parentElement.children
  )[1];
  const listContainer = Array.from(dropdownContianer.children)[0];
  const expandedIcon = Array.from(alwaysShowCOntainer.children)[1];
  const isExpaned = expandedIcon?.src?.includes("minusIcon");

  if (isExpaned) {
    expandedIcon.src = "../../src/assets/images/plusIcon.svg";
    dropdownContianer.style.height = "0px";
    // listContainer.style.opacity = "0";
  } else {
    expandedIcon.src = "../../src/assets/images/minusIcon.svg";
    dropdownContianer.style.height = `${
      Array.from(dropdownContianer.children)[0].offsetHeight
    }px`;
    // listContainer.style.opacity = "1";
  }
}

dropdownClickableItems.forEach((item) => {
  item.addEventListener("click", handleExpandedClick);
});
