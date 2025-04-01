(function () {
  // Create preconnect link elements
  const preconnect1 = document.createElement("link");
  preconnect1.rel = "preconnect";
  preconnect1.href = "https://fonts.googleapis.com";

  const preconnect2 = document.createElement("link");
  preconnect2.rel = "preconnect";
  preconnect2.href = "https://fonts.gstatic.com";
  preconnect2.crossOrigin = "true";

  // Create preload link element
  const preload = document.createElement("link");
  preload.rel = "preload";
  preload.as = "style";
  preload.href =
    "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500&display=swap";

  // Create stylesheet link element
  const stylesheet = document.createElement("link");
  stylesheet.rel = "stylesheet";
  stylesheet.href =
    "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500&display=swap";
  stylesheet.media = "print";
  stylesheet.onload = function () {
    this.media = "all";
  };

  // Add all elements to the head
  document.head.appendChild(preconnect1);
  document.head.appendChild(preconnect2);
  document.head.appendChild(preload);
  document.head.appendChild(stylesheet);
})();
