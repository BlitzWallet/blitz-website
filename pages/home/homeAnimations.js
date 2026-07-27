(function () {
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  // Tap-to-start demo overlay: until tapped it covers the iframe, so the
  // page scrolls over the phone instead of the iframe trapping the gesture.
  const demoOverlay = document.querySelector(".demo-overlay");
  if (demoOverlay) {
    demoOverlay.addEventListener("click", () => {
      demoOverlay.classList.add("is-dismissed");
    });
  }

  // Hero rotating word ("Money without <borders / banks / ...>")
  const heroRotate = document.querySelector(".hero-rotate");
  if (heroRotate) {
    const words = Array.from(heroRotate.querySelectorAll(".hero-rotate-word"));
    if (words.length) {
      let activeIndex = 0;

      const render = () => {
        words.forEach((word, index) => {
          word.classList.toggle("is-active", index === activeIndex);
          word.classList.toggle("is-past", index < activeIndex);
        });
      };

      render();

      if (!reducedMotion && words.length > 1) {
        // Advance once through the words, then rest on the final word.
        const timer = setInterval(() => {
          activeIndex += 1;
          render();
          if (activeIndex >= words.length - 1) {
            clearInterval(timer);
          }
        }, 1800);
      } else {
        // No motion: jump straight to the final word.
        activeIndex = words.length - 1;
        render();
      }
    }
  }

  const staggerGroups = [".features-grid", ".product-grid"];

  staggerGroups.forEach((selector) => {
    document.querySelectorAll(`${selector} .fade-in`).forEach((element, i) => {
      element.style.setProperty(
        "--stagger-delay",
        `${Math.min(i * 90, 360)}ms`,
      );
    });
  });

  document.querySelectorAll(".reveal-words").forEach((element) => {
    const words = element.textContent.trim().split(/\s+/);
    element.textContent = "";

    words.forEach((word, index) => {
      const span = document.createElement("span");
      span.className = "word";
      span.style.transitionDelay = `${Math.min(index * 24, 520)}ms`;
      span.textContent = `${word} `;
      element.appendChild(span);
    });
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add("visible");
        entry.target
          .querySelectorAll(".word")
          .forEach((word) => word.classList.add("visible"));
      });
    },
    {
      threshold: 0.18,
      rootMargin: "0px 0px -8% 0px",
    },
  );

  document
    .querySelectorAll(".fade-in, .reveal-words")
    .forEach((element) => observer.observe(element));

  if (reducedMotion) return;

  const phoneScroll = document.querySelector("[data-phone-scroll]");
  let scrollFrame = null;

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function updateScrollMotion() {
    if (phoneScroll) {
      const rect = phoneScroll.getBoundingClientRect();
      const travelDistance = Math.max(rect.height - window.innerHeight, 1);
      const progress = clamp(-rect.top / travelDistance, 0, 1);

      // Shrink the phone at the end of the scroll so the whole device fits
      // the viewport height. The phone is bottom-anchored (transform-origin:
      // bottom center), so subtracting a margin for the fixed navbar + gap
      // keeps the top clear on any screen height. offsetHeight ignores
      // transform:scale, so it's a stable base; recomputes on scroll AND
      // resize (handles orientation changes).
      const shell = phoneScroll.querySelector(".scroll-phone-shell");
      const phoneHeight = shell ? shell.offsetHeight : window.innerHeight;
      const FIT_MARGIN = 170; // navbar height + breathing room top & bottom
      const startScale = 1;
      const endScale = clamp(
        (window.innerHeight - FIT_MARGIN) / phoneHeight,
        0.45,
        0.95,
      );
      const scale = startScale + (endScale - startScale) * progress;

      phoneScroll.style.setProperty("--phone-scale", scale.toFixed(3));
    }
  }

  function requestScrollMotionUpdate() {
    if (scrollFrame) return;
    scrollFrame = window.requestAnimationFrame(() => {
      scrollFrame = null;
      updateScrollMotion();
    });
  }

  updateScrollMotion();
  window.addEventListener("scroll", requestScrollMotionUpdate, {
    passive: true,
  });
  window.addEventListener("resize", requestScrollMotionUpdate);
})();
