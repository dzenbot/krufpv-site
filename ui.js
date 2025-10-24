// ui.js - UI utility functions

async function initializeDynamicUI() {
  try {
    // Wait for DOM to be ready
    if (document.readyState === "loading") {
      await new Promise(resolve => document.addEventListener("DOMContentLoaded", resolve));
    }

    // Fetch config
    const response = await fetch("chapter.json");
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    const config = await response.json();

    // === Update background ===
    const backgrounds = config.backgrounds || [];
    if (backgrounds.length > 0) {
      const randomIndex = Math.floor(Math.random() * backgrounds.length);
      const bkgd = document.getElementById("bkgd");
      if (bkgd) {
        bkgd.style.backgroundImage = `url('${backgrounds[randomIndex]}')`;
      }
    }

    const legalText = document.getElementById("legal-text");
    const chapterName = config.chapterName || "";
    const year = new Date().getFullYear();

    legalText.textContent = year + " © " + chapterName;
    document.title = chapterName;
  } catch (err) {
    console.error("Error initializing chapter page:", err);
  }
}

initializeDynamicUI();