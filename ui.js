// ui.js - UI utility functions

function setViewportHeight() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

// Set on load
setViewportHeight();

// Update if window is resized or mobile bar toggles
window.addEventListener('resize', setViewportHeight);
window.addEventListener('orientationchange', setViewportHeight);

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

    // === Update background ===
    const backgrounds = config.backgrounds || [];
    if (backgrounds.length > 0) {
      const randomIndex = Math.floor(Math.random() * backgrounds.length);
      const bkgd = document.querySelector(".bkgd");
      if (bkgd) {
        bkgd.style.backgroundImage = `url('${backgrounds[randomIndex]}')`;
      }
    }

    // === Update legal text & title ===
    const legalText = document.getElementById("legal-text");
    const chapterName = config.chapterName;
    const year = new Date().getFullYear();
    if (legalText) legalText.textContent = `${year} © ${chapterName}`;
    document.title = chapterName;

    // === Meta Tags ===
    setMetaProperty('og:title', config.chapterName);
    setMetaProperty('og:description', `Upcoming events from ${config.chapterName}`);
    setMetaName('description', `${config.chapterDesc}`);

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
          ${config.maacId ? `
            <a href="https://www.maac.ca/en/clubs_details.php?club_id=${config.maacId}" target="_blank">
              <img src="images/org_maac.png">
            </a>` : ""}
          ${config.amaId ? `
            <a href="https://www.modelaircraft.org/club-name-search?number=${config.amaId}" target="_blank">
              <img src="images/org_ama.png">
            </a>` : ""}
        </div>
      `;

      // --- Contact & Social section ---
      const contactSection = document.createElement("div");
      contactSection.className = "footer-title";

      const emailLink = config.email
        ? `<a href="mailto:${config.email}" target="_blank"><img src="images/social-email.png"></a>`
        : "";

      const instagramLink = config.instagram
        ? `<a href="https://www.instagram.com/${config.instagram}" target="_blank"><img src="images/social-insta.png"></a>`
        : "";

      const facebookLink = config.facebook
        ? `<a href="https://www.facebook.com/${config.facebook.includes("groups/") ? config.facebook : "groups/" + config.facebook}" target="_blank"><img src="images/social-fb.png"></a>`
        : "";

      contactSection.innerHTML = `
        <p class="sub-title">Contact & Social:</p>
        <div class="logos-row social">
          ${emailLink}${instagramLink}${facebookLink}
        </div>
      `;

      // --- Append both sections ---
      footerContainer.appendChild(sanctionedSection);
      footerContainer.appendChild(contactSection);
    }

  } catch (err) {
    console.error("Error initializing chapter page:", err);
  }
}

function setMetaProperty(property, content) {
  let element = document.querySelector(`meta[property='${property}']`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute('property', property);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function setMetaName(name, content) {
  let element = document.querySelector(`meta[name='${name}']`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute('name', name);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

initializeDynamicUI();