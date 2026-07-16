// Reduced motion: no reproducir el video de fondo, dejar el poster estático
const heroVideo = document.getElementById("heroVideo");
if (heroVideo && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  heroVideo.removeAttribute("autoplay");
  heroVideo.pause();
}

// Toggle de idioma ES/EN
const langToggle = document.getElementById("langToggle");
const i18nEls = document.querySelectorAll("[data-es][data-en]");
let currentLang = localStorage.getItem("nw-lang") || "es";

function applyLang(lang) {
  i18nEls.forEach((el) => {
    const value = el.getAttribute(lang === "en" ? "data-en" : "data-es");
    if (value !== null) el.innerHTML = value;
  });
  document.documentElement.lang = lang;
  if (langToggle) langToggle.textContent = lang === "en" ? "ES" : "EN";
  localStorage.setItem("nw-lang", lang);
  currentLang = lang;
}

if (langToggle) {
  applyLang(currentLang);
  langToggle.addEventListener("click", () => {
    applyLang(currentLang === "en" ? "es" : "en");
  });
}

const toggle = document.querySelector(".menu-toggle");
const links = document.querySelector(".nav-links");

if (toggle && links) {
  toggle.addEventListener("click", () => {
    const open = links.style.display === "flex";
    links.style.display = open ? "none" : "flex";
    links.style.flexDirection = "column";
    links.style.position = "absolute";
    links.style.top = "68px";
    links.style.left = "0";
    links.style.right = "0";
    links.style.background = "#0b0f0e";
    links.style.padding = "20px 24px";
    links.style.borderBottom = "1px solid #232b28";
  });
}
