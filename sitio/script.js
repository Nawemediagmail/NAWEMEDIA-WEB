const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(pointer: fine)").matches;

// Reduced motion: no reproducir el video de fondo, dejar el poster estático
const heroVideo = document.getElementById("heroVideo");
if (heroVideo && reducedMotion) {
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

// Menú mobile
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

// Header compacto al scrollear
const header = document.querySelector("header");
let headerTicking = false;
window.addEventListener("scroll", () => {
  if (headerTicking) return;
  headerTicking = true;
  requestAnimationFrame(() => {
    header.classList.toggle("scrolled", window.scrollY > 40);
    headerTicking = false;
  });
}, { passive: true });

// Revelado progresivo al scrollear
const revealTargets = document.querySelectorAll(
  ".section-head, .service-card, .demo-card, .cart-bar, .contact-box, #presupuesto .nw-card, .clients-label, .marquee"
);

if (!reducedMotion && "IntersectionObserver" in window) {
  revealTargets.forEach((el) => el.classList.add("reveal"));

  // Stagger: retardo incremental entre hermanos dentro del mismo contenedor
  document.querySelectorAll(".grid-services, .grid-demos").forEach((grid) => {
    Array.from(grid.children).forEach((card, i) => {
      card.style.transitionDelay = `${Math.min(i * 90, 540)}ms`;
    });
  });

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target;
        el.classList.add("in");
        revealObserver.unobserve(el);
        // Al terminar la entrada, limpiar clases para devolverle a la card
        // sus transiciones de hover originales
        const delay = (parseFloat(el.style.transitionDelay) || 0) * 1000;
        setTimeout(() => {
          el.classList.remove("reveal", "in");
          el.style.transitionDelay = "";
        }, 900 + delay);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

  revealTargets.forEach((el) => revealObserver.observe(el));
}

// Contadores animados del hero
const counters = document.querySelectorAll(".count");
if (counters.length) {
  const animateCount = (el) => {
    const target = Number(el.dataset.target || 0);
    if (reducedMotion) { el.textContent = target; return; }
    const duration = 1400;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        countObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });

  counters.forEach((el) => countObserver.observe(el));
}

// Spotlight: glow dorado que sigue al mouse en las cards
if (finePointer && !reducedMotion) {
  document.querySelectorAll(".nw-card, .demo-card").forEach((card) => {
    card.classList.add("spotlight");
    card.addEventListener("pointermove", (e) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - rect.left}px`);
      card.style.setProperty("--my", `${e.clientY - rect.top}px`);
    });
  });
}

// Parallax sutil del video del hero
const hero = document.querySelector(".hero");
if (heroVideo && hero && !reducedMotion) {
  let parallaxTicking = false;
  window.addEventListener("scroll", () => {
    if (parallaxTicking) return;
    parallaxTicking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      if (y < hero.offsetHeight) {
        heroVideo.style.transform = `translateY(${y * 0.22}px) scale(1.06)`;
      }
      parallaxTicking = false;
    });
  }, { passive: true });
}

// Halo de cursor (solo desktop)
if (finePointer && !reducedMotion) {
  const glow = document.createElement("div");
  glow.className = "cursor-glow";
  document.body.appendChild(glow);
  let gx = -200, gy = -200, tx = -200, ty = -200;
  window.addEventListener("pointermove", (e) => { tx = e.clientX; ty = e.clientY; }, { passive: true });
  const followCursor = () => {
    gx += (tx - gx) * 0.12;
    gy += (ty - gy) * 0.12;
    glow.style.transform = `translate(${gx}px, ${gy}px)`;
    requestAnimationFrame(followCursor);
  };
  requestAnimationFrame(followCursor);
}
