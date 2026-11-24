document.addEventListener("DOMContentLoaded", () => {
  const menuButton = document.querySelector(".menu-button");
  const nav = document.querySelector("#site-nav");
  const links = [...document.querySelectorAll("#site-nav .nav-link")];

  // Keep the clicked link active while smooth scrolling passes other sections.
  let navigationScrollTimer;

  let navigationRequest = 0;

  async function navigateTo(hash, updateUrl) {
    const request = ++navigationRequest;
    const standings = document.querySelector("#standings");

    if (standings?.getAttribute("aria-busy") === "true") {
      await new Promise((resolve) => {
        standings.addEventListener("standings:ready", resolve, { once: true });
      });
    }

    await document.fonts?.ready;
    await new Promise(requestAnimationFrame);

    if (request !== navigationRequest) {
      return;
    }

    const target = document.getElementById(hash.slice(1));
    if (!target) {
      return;
    }

    if (updateUrl) {
      const url = new URL(window.location.href);
      url.hash = hash;
      window.history.pushState(null, "", url);
    }

    const headerHeight = header.getBoundingClientRect().height;
    const top = target.getBoundingClientRect().top + window.scrollY - headerHeight;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    setActiveSection(target.id);
    window.clearTimeout(navigationScrollTimer);
    navigationScrollTimer = window.setTimeout(finishNavigationScroll, 250);
    window.scrollTo({
      top: Math.max(0, top),
      behavior: mobileLayout.matches || reducedMotion || !updateUrl ? "instant" : "smooth"
    });
  }

  function finishNavigationScroll() {
    window.clearTimeout(navigationScrollTimer);
    navigationScrollTimer = undefined;
  }

  function closeMenu() {
    nav.classList.remove("open");
    menuButton?.setAttribute("aria-expanded", "false");
  }

  function setActiveSection(sectionId) {
    links.forEach((link) => {
      link.classList.toggle("active", sectionId !== "events" && link.hash === `#${sectionId}`);
    });
  }

  const mobileLayout = window.matchMedia("(max-width: 760px)");
  const header = document.querySelector(".site-header");
  const wordmark = header.querySelector(".wordmark");
  const galleryLink = nav.querySelector('a[href="#gallery"]');

  // Restore Gallery before measuring so it can reappear as the viewport widens.
  function updateNavigationLayout() {
    galleryLink.hidden = false;
    if (mobileLayout.matches) {
      return;
    }

    const headerStyle = getComputedStyle(header);
    const availableWidth =
      header.clientWidth -
      parseFloat(headerStyle.paddingLeft) -
      parseFloat(headerStyle.paddingRight);
    const requiredWidth =
      wordmark.getBoundingClientRect().width + nav.getBoundingClientRect().width + 20;
    galleryLink.hidden = requiredWidth > availableWidth;
  }

  window.addEventListener("resize", updateNavigationLayout);
  document.fonts?.ready.then(updateNavigationLayout);
  updateNavigationLayout();

  mobileLayout.addEventListener("change", () => {
    finishNavigationScroll();
    nav.classList.remove("menu-transition");
    closeMenu();
  });

  menuButton?.addEventListener("click", () => {
    nav.classList.add("menu-transition");
    const open = nav.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(open));
  });
  window.addEventListener(
    "scroll",
    () => {
      if (navigationScrollTimer === undefined) {
        return;
      }
      window.clearTimeout(navigationScrollTimer);
      navigationScrollTimer = window.setTimeout(finishNavigationScroll, 150);
    },
    {
      passive: true
    }
  );

  document.addEventListener("click", (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || event.defaultPrevented || event.metaKey || event.ctrlKey ||
        event.shiftKey || event.altKey) {
      return;
    }

    event.preventDefault();
    closeMenu();
    navigateTo(link.hash, true);
  });

  window.addEventListener("popstate", () => {
    if (window.location.hash) {
      navigateTo(window.location.hash, false);
    }
  });

  if (window.location.hash) {
    navigateTo(window.location.hash, false);
  }

  const observer = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (navigationScrollTimer === undefined && entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      }),
    {
      rootMargin: "-30% 0px -60%"
    }
  );
  document
    .querySelectorAll(
      "#events, #upcoming, #standings:not([hidden]), #get-started, #gallery, #about"
    )
    .forEach((section) => observer.observe(section));
});
