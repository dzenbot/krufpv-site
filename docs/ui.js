// ui.js - UI utility functions

async function initializeDynamicUI() {

  try {
    // Wait for DOM to be ready
    if (document.readyState === "loading") {
      await new Promise(resolve => document.addEventListener("DOMContentLoaded", resolve));
    }

    // === Fetch config ===
    const response = await fetch("chapter.json");
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    const config = await response.json();

    // === Update legal text & title ===
    const legalText = document.getElementById("legal-text");
    const chapterName = config.chapterName;
    const year = new Date().getFullYear();
    if (legalText) legalText.textContent = `${year} © ${chapterName}`;
    document.title = chapterName;

    // === Build footer sections ===
    const footerContainer = document.querySelector(".footer-sections");
    if (footerContainer) {
      footerContainer.innerHTML = ""; // clear static markup if any

      // --- Sanctioned by section ---
      const sanctionedSection = document.createElement("div");
      sanctionedSection.className = "footer-title";

      sanctionedSection.innerHTML = `
        <p class="sub-title">Sanctioned by:</p>
        <div class="logos-row sponsor">
          ${config.chapterId ? `
            <a href="https://www.multigp.com/chapters/view/?chapter=${config.chapterId.replace(/\s+/g, '')}" target="_blank">
              <img src="images/org_mgp.png">
            </a>` : ""}
        </div>
      `;

      const instagramLink = config.instagram
        ? `<a href="https://www.instagram.com/${config.instagram}" target="_blank" rel="noopener" aria-label="Instagram"><img src="images/social-insta.png" alt=""></a>`
        : "";

      const facebookLink = config.facebook
        ? `<a href="https://www.facebook.com/${config.facebook.includes("groups/") ? config.facebook : "groups/" + config.facebook}" target="_blank" rel="noopener" aria-label="Facebook"><img src="images/social-fb.png" alt=""></a>`
        : "";

      const youtubeLink = config.youtube
        ? `<a href="https://www.youtube.com/${config.youtube}" target="_blank" rel="noopener" aria-label="YouTube"><img src="images/social-yt.png" alt=""></a>`
        : "";

      const footerEmail = document.querySelector(".footer-email");
      if (footerEmail && config.email) {
        footerEmail.href = `mailto:${config.email}`;
        footerEmail.textContent = config.email;
      }

      const footerSocials = document.getElementById("footer-socials");
      if (footerSocials) footerSocials.innerHTML = `${instagramLink}${facebookLink}${youtubeLink}`;

      // --- Append affiliation section ---
      footerContainer.appendChild(sanctionedSection);
    }

  } catch (err) {
    console.error("Error initializing chapter page:", err);
  }
}

initializeDynamicUI();

document.addEventListener("DOMContentLoaded", () => {
  const menuButton = document.querySelector(".menu-button");
  const nav = document.querySelector("#site-nav");
  const links = [...document.querySelectorAll("#site-nav .nav-link")];
  menuButton?.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(open));
  });
  links.forEach(link => link.addEventListener("click", () => {
    nav.classList.remove("open");
    menuButton?.setAttribute("aria-expanded", "false");
  }));
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) links.forEach(link => link.classList.toggle("active", link.hash === `#${entry.target.id}`));
  }), { rootMargin: "-30% 0px -60%" });
  document.querySelectorAll("#events, #get-started, #gallery, #about").forEach(section => observer.observe(section));
});

function setViewportHeight() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

// Set on load
setViewportHeight();

// Update if window is resized or mobile bar toggles
window.addEventListener('resize', setViewportHeight);
window.addEventListener('orientationchange', setViewportHeight);
