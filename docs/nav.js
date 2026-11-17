document.addEventListener("DOMContentLoaded", () => {
  const menuButton = document.querySelector(".menu-button");
  const nav = document.querySelector("#site-nav");
  const links = [...document.querySelectorAll("#site-nav .nav-link")];
  const homeLinks = [...document.querySelectorAll('a[href="#home"]')];

  function closeMenu() {
    nav.classList.remove("open");
    menuButton?.setAttribute("aria-expanded", "false");
  }

  function setActiveSection(sectionId) {
    links.forEach(link => {
      link.classList.toggle("active", sectionId !== "events" && link.hash === `#${sectionId}`);
    });
  }

  menuButton?.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(open));
  });
  links.forEach(link => link.addEventListener("click", closeMenu));
  homeLinks.forEach(link => link.addEventListener("click", () => {
    closeMenu();
    setActiveSection("events");
  }));
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) setActiveSection(entry.target.id);
  }), { rootMargin: "-30% 0px -60%" });
  document.querySelectorAll("#events, #upcoming, #get-started, #gallery, #about").forEach(section => observer.observe(section));
});
