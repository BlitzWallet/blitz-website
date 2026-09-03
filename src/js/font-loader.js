(function () {
  // Preconnects
  const preconnect1 = document.createElement("link");
  preconnect1.rel = "preconnect";
  preconnect1.href = "https://fonts.googleapis.com";

  const preconnect2 = document.createElement("link");
  preconnect2.rel = "preconnect";
  preconnect2.href = "https://fonts.gstatic.com";
  preconnect2.crossOrigin = "true";

  // Preload Google Font
  const preload = document.createElement("link");
  preload.rel = "preload";
  preload.as = "style";
  preload.href =
    "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500&display=swap";

  // Load Google Font stylesheet non-blocking
  const stylesheet = document.createElement("link");
  stylesheet.rel = "stylesheet";
  stylesheet.href =
    "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500&display=swap";
  stylesheet.media = "print";
  stylesheet.onload = function () {
    this.media = "all";
  };

  // Lucide script
  const lucideScript = document.createElement("script");
  lucideScript.src = "https://unpkg.com/lucide@latest";
  lucideScript.defer = true;
  lucideScript.onload = function () {
    // Initialize icons after load
    if (window.lucide) {
      lucide.createIcons();
    }
    // Agentic browsing / a11y: lucide replaces <i data-lucide> with inline
    // SVGs that would otherwise appear as unnamed elements in the
    // accessibility tree. Mark decorative icons hidden (buttons/links on
    // this site already carry text or aria-labels).
    hideDecorativeIcons();
  };

  // Icons may also be inlined by other scripts, so observe late additions.
  if (typeof MutationObserver !== "undefined") {
    const observer = new MutationObserver(hideDecorativeIcons);
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  function hideDecorativeIcons() {
    document
      .querySelectorAll("i[data-lucide], svg.lucide")
      .forEach(function (el) {
        if (!el.hasAttribute("aria-hidden")) {
          el.setAttribute("aria-hidden", "true");
        }
        if (!el.hasAttribute("focusable") && el.tagName.toLowerCase() === "svg") {
          el.setAttribute("focusable", "false");
        }
      });
  }

  // Append to head
  document.head.appendChild(preconnect1);
  document.head.appendChild(preconnect2);
  document.head.appendChild(preload);
  document.head.appendChild(stylesheet);
  document.head.appendChild(lucideScript);
})();
