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
