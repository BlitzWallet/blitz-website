(function () {
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  // Hero rotating word ("Money that moves <globally / instantly / ...>")
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

  const staggerGroups = [
    ".features-grid",
    ".steps-container",
    ".dashboard-grid",
  ];

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

  // Orbital products: nodes orbit the Blitz logo; tapping one pauses the
  // rotation, pulls that node to the top, and reveals its detail card.
  const orbital = document.querySelector("[data-orbital]");
  if (orbital) {
    const stage = orbital.querySelector("[data-orbital-stage]");
    const nodes = Array.from(orbital.querySelectorAll("[data-orbital-node]"));
    const cards = Array.from(orbital.querySelectorAll("[data-detail]"));
    const line = orbital.querySelector("[data-orbital-line]");
    const total = nodes.length;

    if (stage && total) {
      const baseAngles = nodes.map((_, i) => (i / total) * 360);
      const ROTATION_SPEED = 7; // degrees per second
      let rotation = 0;
      let target = null; // tween destination when a node is focused
      let autoRotate = !reducedMotion;
      let activeIndex = null;
      let radius = 0;
      let running = false;
      let last = 0;

      function measure() {
        radius = stage.clientWidth / 2 - nodes[0].offsetWidth / 2 + 25;
      }

      function place() {
        nodes.forEach((node, i) => {
          const deg = baseAngles[i] + rotation - 90;
          const rad = (deg * Math.PI) / 180;
          const x = Math.cos(rad) * radius;
          const y = Math.sin(rad) * radius;
          node.style.transform = `translate(-50%, -50%) translate(${x.toFixed(
            1,
          )}px, ${y.toFixed(1)}px)`;
          // front (lower) nodes sit above the rest
          node.style.zIndex = String(
            10 + Math.round(((y / radius + 1) / 2) * 10),
          );
        });

        if (line && activeIndex !== null) {
          const deg = baseAngles[activeIndex] + rotation - 90;
          line.style.width = `${radius}px`;
          line.style.transform = `translate(0, -50%) rotate(${deg}deg)`;
        }
      }

      function frame(now) {
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        let busy = false;

        if (autoRotate) {
          rotation = (rotation + ROTATION_SPEED * dt) % 360;
          busy = true;
        } else if (target !== null) {
          let diff = ((target - rotation + 540) % 360) - 180;
          if (Math.abs(diff) < 0.2) {
            rotation = target;
            target = null;
          } else {
            rotation += diff * Math.min(dt * 6, 1);
            busy = true;
          }
        }

        place();
        if (busy) {
          requestAnimationFrame(frame);
        } else {
          running = false;
        }
      }

      function ensureRunning() {
        if (running) return;
        running = true;
        last = performance.now();
        requestAnimationFrame(frame);
      }

      function showCard(index) {
        cards.forEach((card) =>
          card.classList.toggle(
            "is-active",
            Number(card.dataset.detail) === index,
          ),
        );
      }

      function selectNode(index) {
        if (activeIndex === index) {
          deselect();
          return;
        }
        activeIndex = index;
        autoRotate = false;
        if (!reducedMotion) target = -baseAngles[index];
        nodes.forEach((node, i) =>
          node.classList.toggle("is-active", i === index),
        );
        orbital.classList.add("has-selection");
        showCard(index);
        ensureRunning();
        place();
      }

      function deselect() {
        console.log("desected", activeIndex);
        if (activeIndex === null) return;
        activeIndex = null;
        target = null;
        autoRotate = !reducedMotion;
        nodes.forEach((node) => node.classList.remove("is-active"));
        cards.forEach((card) =>
          card.classList.toggle(
            "is-active",
            Number(card.dataset.detail) === activeIndex,
          ),
        );
        orbital.classList.remove("has-selection");
        ensureRunning();
      }

      nodes.forEach((node, i) => {
        node.addEventListener("click", () => selectNode(i));
      });

      // Clicking empty stage space (or the core) resumes the orbit.
      stage.addEventListener("click", (event) => {
        if (event.target === stage) deselect();
      });

      measure();
      place();
      window.addEventListener("resize", () => {
        measure();
        place();
      });

      if (autoRotate) ensureRunning();
    }
  }

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
      const startScale = 1;
      const endScale = 0.9;
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
