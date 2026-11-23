document.addEventListener("DOMContentLoaded", () => {
  const menuButton = document.querySelector(".menu-button");
  const nav = document.querySelector("#site-nav");
  const links = [...document.querySelectorAll("#site-nav .nav-link")];
  const homeLinks = [...document.querySelectorAll('a[href="#home"]')];

  let navigationScrollTimer;

  function finishNavigationScroll() {
    window.clearTimeout(navigationScrollTimer);
    navigationScrollTimer = undefined;
  }

  function closeMenu() {
    nav.classList.remove("open");
    menuButton?.setAttribute("aria-expanded", "false");
  }

  function setActiveSection(sectionId) {
    links.forEach(link => {
      link.classList.toggle("active", sectionId !== "events" && link.hash === `#${sectionId}`);
    });
  }

  const mobileLayout = window.matchMedia("(max-width: 760px)");
  const header = document.querySelector(".site-header");
  const wordmark = header.querySelector(".wordmark");
  const galleryLink = nav.querySelector('a[href="#gallery"]');

  function updateNavigationLayout() {
    galleryLink.hidden = false;
    if (mobileLayout.matches) return;

    const headerStyle = getComputedStyle(header);
    const availableWidth = header.clientWidth -
      parseFloat(headerStyle.paddingLeft) - parseFloat(headerStyle.paddingRight);
    const requiredWidth = wordmark.getBoundingClientRect().width +
      nav.getBoundingClientRect().width + 20;
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
  window.addEventListener("scroll", () => {
    if (navigationScrollTimer === undefined) return;
    window.clearTimeout(navigationScrollTimer);
    navigationScrollTimer = window.setTimeout(finishNavigationScroll, 150);
  }, { passive: true });

  links.forEach(link => link.addEventListener("click", event => {
    closeMenu();
    if (mobileLayout.matches || event.defaultPrevented ||
        event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    setActiveSection(link.hash.slice(1));
    window.clearTimeout(navigationScrollTimer);
    navigationScrollTimer = window.setTimeout(finishNavigationScroll, 250);
  }));
  homeLinks.forEach(link => link.addEventListener("click", () => {
    finishNavigationScroll();
    closeMenu();
    setActiveSection("events");
  }));
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (navigationScrollTimer === undefined && entry.isIntersecting) {
      setActiveSection(entry.target.id);
    }
  }), { rootMargin: "-30% 0px -60%" });
  document.querySelectorAll("#events, #upcoming, #standings:not([hidden]), #get-started, #gallery, #about").forEach(section => observer.observe(section));
});
