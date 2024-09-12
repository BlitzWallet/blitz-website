const optionContainer = document.querySelector(".content-optionContainer");
const optionElements = document.querySelectorAll(".optionContainer-option");

optionElements.forEach((element) => {
  element.addEventListener("click", (e) => {
    console.log(e.target.classList.add("selected-option"), "TEST");
    for (let index = 0; index < optionContainer.children.length; index++) {
      const element = optionContainer.children[index];
      console.log(element.classList.remove("selected-option"));
    }
    e.target.classList.add("selected-option");
  });
});
