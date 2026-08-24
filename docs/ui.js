// ui.js - UI utility functions

const BACKGROUND_DIRECTORY = "images/background/";
const BACKGROUND_API = "https://api.github.com/repos/dzenbot/krufpv-site/contents/docs/images/background?ref=main";
const IMAGE_FILE_PATTERN = /\.(avif|gif|jpe?g|png|webp)$/i;

function imagePathsFromNames(names) {
  return [...new Set(names)]
    .filter(name => IMAGE_FILE_PATTERN.test(name))
    .sort((first, second) => first.localeCompare(second, undefined, { numeric: true }))
    .map(name => `${BACKGROUND_DIRECTORY}${encodeURIComponent(name)}`);
}

function renderGallery(backgrounds, selectedBackground) {
  const gallery = document.querySelector(".gallery-grid");
  if (!gallery) return;

  const galleryBackgrounds = backgrounds.filter(background => background !== selectedBackground);
  const tileClasses = ["wide", "tall", "", "", "wide", "", "tall", "wide", "wide", "", "wide"];
  gallery.replaceChildren(...galleryBackgrounds.map((background, index) => {
    const figure = document.createElement("figure");
    figure.className = tileClasses[index % tileClasses.length];

    const image = document.createElement("img");
    image.src = background;
    image.alt = `KwadsRUs FPV event photo ${index + 1}`;
    image.loading = "lazy";
    figure.appendChild(image);
    return figure;
  }));
}

async function discoverBackgrounds() {
  try {
    const directoryResponse = await fetch(BACKGROUND_DIRECTORY, { cache: "no-store" });
    if (directoryResponse.ok) {
      const directoryHtml = await directoryResponse.text();
      const directoryDocument = new DOMParser().parseFromString(directoryHtml, "text/html");
      const names = [...directoryDocument.querySelectorAll("a[href]")]
        .map(link => decodeURIComponent(link.getAttribute("href").split(/[?#]/)[0]).split("/").filter(Boolean).pop());
      const localBackgrounds = imagePathsFromNames(names);
      if (localBackgrounds.length > 0) return localBackgrounds;
    }
  } catch {
    // GitHub Pages does not expose directory listings; use its API below.
  }

  const apiResponse = await fetch(BACKGROUND_API, {
    headers: { Accept: "application/vnd.github+json" }
  });
  if (!apiResponse.ok) throw new Error(`Background API error ${apiResponse.status}`);
  const entries = await apiResponse.json();
  return imagePathsFromNames(entries.filter(entry => entry.type === "file").map(entry => entry.name));
}

async function initializeRandomBackground() {
  const heroBackground = document.querySelector(".hero-background");
  if (!heroBackground) return;

  try {
    const backgrounds = await discoverBackgrounds();
    if (backgrounds.length === 0) throw new Error("No background images found");

    const rotationKey = "kwadsrus-background-rotation";
    const signature = backgrounds.join("|");
    let rotation;

    try {
      rotation = JSON.parse(sessionStorage.getItem(rotationKey));
    } catch {
      rotation = null;
    }

    if (!rotation || rotation.signature !== signature || !Array.isArray(rotation.queue) || rotation.queue.length === 0) {
      const queue = [...backgrounds];
      for (let index = queue.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [queue[index], queue[randomIndex]] = [queue[randomIndex], queue[index]];
      }
      rotation = { signature, queue };
    }

    const selectedBackground = rotation.queue.shift();
    renderGallery(backgrounds, selectedBackground);
    try {
      sessionStorage.setItem(rotationKey, JSON.stringify(rotation));
    } catch {
      // Rotation still works when browser storage is unavailable.
    }

    const image = new Image();
    image.addEventListener("load", () => {
      heroBackground.style.setProperty("--hero-image", `url('${selectedBackground}')`);
    });
    image.src = selectedBackground;
  } catch (error) {
    console.warn("Using fallback hero background:", error);
    const galleryLoading = document.querySelector(".gallery-loading");
    if (galleryLoading) {
      galleryLoading.textContent = window.location.protocol === "file:"
        ? "Open this site through localhost to load photos"
        : "Photos are temporarily unavailable";
    }
  }
}

async function initializeDynamicUI() {

  try {
    // Wait for DOM to be ready
    if (document.readyState === "loading") {
      await new Promise(resolve => document.addEventListener("DOMContentLoaded", resolve));
    }

    initializeRandomBackground();

    // === Fetch config ===
    const response = await fetch("chapter.json", { cache: "no-store" });
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
