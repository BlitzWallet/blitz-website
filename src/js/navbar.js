// Mobile Menu Toggle
const mobileMenu = document.getElementById("mobileMenu");
const navLinks = document.querySelector(".nav-links");

mobileMenu.addEventListener("click", () => {
  navLinks.classList.toggle("active");
  const spans = mobileMenu.querySelectorAll("span");
  const isActive = navLinks.classList.contains("active");

  spans[0].style.transform = isActive ? "translateY(9px) rotate(45deg)" : "";

  spans[1].style.opacity = isActive ? "0" : "1";

  spans[2].style.transform = isActive ? "translateY(-9px) rotate(-45deg)" : "";
});

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
