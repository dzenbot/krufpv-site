// ui.js - UI utility functions

const BACKGROUND_DIRECTORY = "images/background/";
const BACKGROUND_API = "https://api.github.com/repos/dzenbot/krufpv-site/contents/docs/images/background?ref=main";
const IMAGE_FILE_PATTERN = /\.(avif|gif|jpe?g|png|webp)$/i;
let lightboxImages = [];
let lightboxIndex = 0;
let lightboxTrigger = null;
let lightboxCloseTimer = null;

function imagePathsFromNames(names) {
  return [...new Set(names)]
    .filter(name => IMAGE_FILE_PATTERN.test(name))
    .sort((first, second) => first.localeCompare(second, undefined, { numeric: true }))
    .map(name => `${BACKGROUND_DIRECTORY}${encodeURIComponent(name)}`);
}

function shuffled(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }
  return result;
}

function renderGallery(backgrounds, selectedBackground) {
  const gallery = document.querySelector(".gallery-grid");
  if (!gallery) return;

  const layouts = [
    ["ratio-cinematic", "ratio-classic", "ratio-photo", "ratio-wide", "ratio-classic", "ratio-photo", "ratio-wide", "ratio-cinematic", "ratio-photo", "ratio-wide"],
    ["ratio-photo", "ratio-wide", "ratio-classic", "ratio-cinematic", "ratio-photo", "ratio-wide", "ratio-classic", "ratio-photo", "ratio-wide", "ratio-cinematic"],
    ["ratio-classic", "ratio-photo", "ratio-cinematic", "ratio-wide", "ratio-photo", "ratio-classic", "ratio-wide", "ratio-cinematic", "ratio-photo", "ratio-wide"]
  ];
  const layout = layouts[Math.floor(Math.random() * layouts.length)];
  const galleryLimit = window.matchMedia("(max-width: 760px)").matches ? 5 : 10;
  const galleryBackgrounds = shuffled(
    backgrounds.filter(background => background !== selectedBackground)
  ).slice(0, galleryLimit);
  lightboxImages = galleryBackgrounds;
  gallery.replaceChildren(...galleryBackgrounds.map((background, index) => {
    const figure = document.createElement("figure");
    figure.className = layout[index];
    figure.dataset.galleryIndex = index;
    figure.tabIndex = 0;
    figure.setAttribute("role", "button");
    figure.setAttribute("aria-label", `View event photo ${index + 1} fullscreen`);

    const image = document.createElement("img");
    image.src = background;
    image.alt = `KwadsRUs FPV event photo ${index + 1}`;
    image.loading = "lazy";
    figure.appendChild(image);
    return figure;
  }));
}

function updateLightbox() {
  const lightbox = document.getElementById("gallery-lightbox");
  const image = lightbox?.querySelector(".lightbox-image");
  if (!image || lightboxImages.length === 0) return;

  image.src = lightboxImages[lightboxIndex];
  image.alt = `KwadsRUs FPV event photo ${lightboxIndex + 1} of ${lightboxImages.length}`;
}

function openLightbox(index, trigger) {
  const lightbox = document.getElementById("gallery-lightbox");
  if (!lightbox || lightboxImages.length === 0) return;

  lightboxIndex = index;
  lightboxTrigger = trigger;
  window.clearTimeout(lightboxCloseTimer);
  updateLightbox();
  lightbox.hidden = false;
  document.body.classList.add("lightbox-open");
  requestAnimationFrame(() => lightbox.classList.add("visible"));
  lightbox.focus();
}

function closeLightbox() {
  const lightbox = document.getElementById("gallery-lightbox");
  if (!lightbox || lightbox.hidden) return;

  lightbox.classList.remove("visible");
  document.body.classList.remove("lightbox-open");
  lightboxCloseTimer = window.setTimeout(() => {
    lightbox.hidden = true;
    lightbox.querySelector(".lightbox-image")?.removeAttribute("src");
    lightboxTrigger?.focus();
    lightboxTrigger = null;
  }, 220);
}

function moveLightbox(offset) {
  if (lightboxImages.length === 0) return;
  lightboxIndex = (lightboxIndex + offset + lightboxImages.length) % lightboxImages.length;
  updateLightbox();
}

function initializeLightbox() {
  const gallery = document.querySelector(".gallery-grid");
  const lightbox = document.getElementById("gallery-lightbox");
  if (!gallery || !lightbox) return;

  const openSelectedPhoto = target => {
    const figure = target.closest("figure[data-gallery-index]");
    if (figure) openLightbox(Number(figure.dataset.galleryIndex), figure);
  };

  gallery.addEventListener("click", event => openSelectedPhoto(event.target));
  gallery.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openSelectedPhoto(event.target);
    }
  });
  lightbox.querySelector(".lightbox-prev")?.addEventListener("click", () => moveLightbox(-1));
  lightbox.querySelector(".lightbox-next")?.addEventListener("click", () => moveLightbox(1));
  lightbox.addEventListener("click", event => {
    if (event.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", event => {
    if (lightbox.hidden) return;
    if (event.key === "Escape") closeLightbox();
    if (event.key === "ArrowLeft") moveLightbox(-1);
    if (event.key === "ArrowRight") moveLightbox(1);
  });
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
      rotation = { signature, queue: shuffled(backgrounds) };
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
      requestAnimationFrame(() => heroBackground.classList.add("is-loaded"));
    });
    image.addEventListener("error", () => {
      heroBackground.style.setProperty("--hero-image", "url('images/background/background4.jpg')");
      requestAnimationFrame(() => heroBackground.classList.add("is-loaded"));
    });
    image.src = selectedBackground;
  } catch (error) {
    console.warn("Using fallback hero background:", error);
    heroBackground.style.setProperty("--hero-image", "url('images/background/background4.jpg')");
    requestAnimationFrame(() => heroBackground.classList.add("is-loaded"));
    const galleryLoading = document.querySelector(".gallery-loading");
    if (galleryLoading) {
      galleryLoading.textContent = window.location.protocol === "file:"
        ? "Open this site through localhost to load photos"
        : "Photos are temporarily unavailable";
    }
  }
}

function initializeDynamicUI() {
  initializeRandomBackground();
  const legalText = document.getElementById("legal-text");
  if (legalText) {
    legalText.textContent = `${new Date().getFullYear()} © KwadsRUs Racing Club`;
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeDynamicUI);
} else {
  initializeDynamicUI();
}

document.addEventListener("DOMContentLoaded", () => {
  initializeLightbox();
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
  document.querySelectorAll("#upcoming, #get-started, #gallery, #about").forEach(section => observer.observe(section));
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
