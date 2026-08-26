// UI logic and event presentation

async function loadUpcomingEvents() {
  const container = document.querySelector(".cards-container");
  const titleText = document.querySelector(".section-title");
  const loadingText = document.querySelector(".loading-text");
  const spinner = document.querySelector(".spinner");

  // Helper to display an error or status message
  function showMessage(message, isError = false) {
    const loadingContainer = loadingText.parentElement;
    container.innerHTML = "";
    container.appendChild(loadingContainer);

    loadingText.textContent = message;
    loadingText.classList.add("visible");
    loadingText.classList.toggle("error", isError);

    spinner.style.display = "none";
  }

  try {
    // Events are synchronized server-side into a local file for GitHub Pages.
    const eventCollections = await RaceSync.fetchEvents();

    // Filter and sort events
    const now = new Date();
    const filtered = RaceSync.filterUpcomingEvents(eventCollections.upcoming, now);
    const upcoming = RaceSync.sortEventsByDate(filtered.upcoming);
    const recent = eventCollections.recent.slice().sort((a, b) => {
      return RaceSync.parseDate(b.startDate) - RaceSync.parseDate(a.startDate);
    });
    const recentCount = Math.min(5, Math.max(0, 5 - upcoming.length));
    const recentEvents = recent.slice(0, recentCount);

    // Remove spinner and loading text
    container.innerHTML = "";
    if (loadingText && loadingText.style) loadingText.style.display = "none";

    const count = upcoming.length;
    if (count > 0) {
      titleText.textContent = `${count} upcoming event${count !== 1 ? "s" : ""}`;
      upcoming.forEach(event => {
        container.appendChild(createEventCard(event));
      });

      if (recentEvents.length > 0) {
        const eventsContainer = document.querySelector(".events-container");
        const recentGroup = document.createElement("div");
        recentGroup.className = "recent-events-group";
        const recentTitle = document.createElement("p");
        recentTitle.className = "section-title";
        recentTitle.textContent = "Recent events";
        const recentCards = document.createElement("div");
        recentCards.className = "cards-container";
        recentEvents.forEach(event => {
          recentCards.appendChild(createEventCard(event));
        });
        recentGroup.append(recentTitle, recentCards);
        eventsContainer.appendChild(recentGroup);
      }
    } else if (recentEvents.length > 0) {
      titleText.textContent = `${recentEvents.length} recent event${recentEvents.length !== 1 ? "s" : ""}`;
      recentEvents.forEach(event => {
        container.appendChild(createEventCard(event));
      });
    } else {
      titleText.textContent = "Upcoming events";
      const emptyMessage = document.createElement("p");
      emptyMessage.className = "empty-events";
      emptyMessage.textContent = "No events scheduled yet";
      container.appendChild(emptyMessage);
    }
    titleText.classList.add("visible");

  } catch (err) {
    console.error("Error loading events:", err);
    showMessage("Failed to load events", true);
  }
}


function createEventCard(ev) {
  var card = document.createElement("a");
  card.className = "card";
  card.href = ev.url || "https://www.multigp.com/races/view/?race=" + ev.id;
  card.target = "_blank";
  card.rel = "noopener";
  card.setAttribute("aria-label", `View ${ev.name} on MultiGP`);

  var img = document.createElement("img");
  img.className = "card-image";
  img.src = ev.mainImageFileName || ev.chapterImageFileName || "";
  img.alt = "";
  card.appendChild(img);

  var content = document.createElement("div");
  content.className = "card-content";

  var dateEl = document.createElement("div");
  dateEl.className = "card-date";
  var dateText = document.createElement("span");
  dateText.className = "event-date";
  dateText.textContent = RaceSync.formatEventDate(ev.startDate);
  dateEl.appendChild(dateText);
  if (ev.location) {
    var locationText = document.createElement("span");
    locationText.className = "event-location";
    locationText.textContent = ev.location;
    dateEl.appendChild(locationText);
  }
  content.appendChild(dateEl);

  var nameEl = document.createElement("div");
  nameEl.className = "card-name";
  nameEl.textContent = ev.name;
  content.appendChild(nameEl);

  card.appendChild(content);

  var chevron = document.createElement("div");
  chevron.className = "card-chevron";
  chevron.setAttribute("aria-hidden", "true");
  chevron.innerHTML = '<svg viewBox="0 0 24 24"><path d="m9.5 5 7 7-7 7"/></svg>';
  card.appendChild(chevron);

  return card;
}

// Load events when page loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", function() {
    loadUpcomingEvents();
  });
} else {
  loadUpcomingEvents();
}
