// Mobile Menu Toggle
const mobileMenu = document.getElementById("mobileMenu");
const navLinks = document.querySelector(".nav-links");

// Agentic browsing / a11y: the hamburger is a <div> in markup, so expose it
// as a button in the accessibility tree (agents navigate via the a11y tree).
if (mobileMenu && !mobileMenu.hasAttribute("role")) {
  mobileMenu.setAttribute("role", "button");
}
if (mobileMenu && !mobileMenu.hasAttribute("tabindex")) {
  mobileMenu.setAttribute("tabindex", "0");
}
if (mobileMenu && !mobileMenu.hasAttribute("aria-label")) {
  mobileMenu.setAttribute("aria-label", "Open navigation menu");
}
if (mobileMenu && !mobileMenu.hasAttribute("aria-expanded")) {
  mobileMenu.setAttribute("aria-expanded", "false");
}
if (mobileMenu && navLinks && !mobileMenu.hasAttribute("aria-controls")) {
  if (!navLinks.id) navLinks.id = "primary-navigation";
  mobileMenu.setAttribute("aria-controls", navLinks.id);
}

function setMenuOpen(open) {
  if (!mobileMenu || !navLinks) return;
  navLinks.classList.toggle("active", open);
  const spans = mobileMenu.querySelectorAll("span");

  mobileMenu.setAttribute("aria-expanded", String(open));
  mobileMenu.setAttribute(
    "aria-label",
    open ? "Close navigation menu" : "Open navigation menu",
  );

  spans[0].style.transform = open ? "translateY(9px) rotate(45deg)" : "";

  spans[1].style.opacity = open ? "0" : "1";

  spans[2].style.transform = open ? "translateY(-9px) rotate(-45deg)" : "";
}

if (mobileMenu && navLinks) {
  mobileMenu.addEventListener("click", () => {
    setMenuOpen(!navLinks.classList.contains("active"));
  });

  // Keyboard parity for the div-based toggle.
  mobileMenu.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setMenuOpen(!navLinks.classList.contains("active"));
    } else if (event.key === "Escape") {
      setMenuOpen(false);
      mobileMenu.blur();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      navLinks.classList.contains("active") &&
      document.activeElement &&
      mobileMenu.contains(document.activeElement) === false &&
      navLinks.contains(document.activeElement) === false
    ) {
      setMenuOpen(false);
    }
  });
}

// Navbar scroll effect
const nav = document.querySelector("nav");
window.addEventListener("scroll", () => {
  if (window.scrollY > 100) {
    nav.classList.add("scrolled");
  } else {
    nav.classList.remove("scrolled");
  }
});

// Scroll animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -100px 0px",
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
    }
  });
}, observerOptions);

document.querySelectorAll(".fade-in").forEach((el) => observer.observe(el));

// Agentic browsing / a11y: inject a skip link on pages whose markup lacks
// one, so keyboard users and agents reach <main> without traversing nav.
(function injectSkipLink() {
  if (document.querySelector(".skip-link")) return;
  const main = document.querySelector("main");
  if (!main) return;
  if (!main.id) main.id = "main-content";
  const link = document.createElement("a");
  link.className = "skip-link";
  link.href = "#" + main.id;
  link.textContent = "Skip to main content";
  document.body.insertBefore(link, document.body.firstChild);
})();
