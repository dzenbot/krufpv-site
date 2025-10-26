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
    // Load chapter configuration
    const configResponse = await fetch("chapter.json");
    const config = await configResponse.json();

    // Validate config
    if (!config.apiKey || !config.chapterId) {
      const missingField = !config.apiKey ? "apiKey" : "chapterId";
      showMessage(`Missing '${missingField}' in chapter.json`, true);
      return;
    }

    // Fetch events
    const events = await RaceSync.fetchEvents(config.apiKey, config.chapterId);

    // Filter and sort events
    const now = new Date();
    const filtered = RaceSync.filterUpcomingEvents(events, now);
    const upcoming = RaceSync.sortEventsByDate(filtered.upcoming);

    const displayEvents = upcoming.slice(0, 5);

    // Handle no events
    if (displayEvents.length === 0) {
      if (filtered.hasPastEvents) {
        showMessage("No races scheduled yet");
      } else if (events.length === 0) {
        showMessage("No races found");
      } else {
        showMessage("No races scheduled yet");
      }
      return;
    }

    // Remove spinner and loading text
    container.innerHTML = "";
    if (loadingText && loadingText.style) loadingText.style.display = "none";

    // Show title
    const count = displayEvents.length;
    titleText.textContent = `${count} Upcoming Event${count !== 1 ? "s" : ""}:`;
    titleText.classList.add("visible");

    // Render events with staggered animation
    displayEvents.forEach((event, index) => {
      setTimeout(() => {
        const card = createEventCard(event);
        container.appendChild(card);
        setTimeout(() => card.classList.add("visible"), 10);
      }, index * 100);
    });

  } catch (err) {
    console.error("Error loading events:", err);
    showMessage("Failed to load events", true);
  }
}


function createEventCard(ev) {
  var card = document.createElement("div");
  card.className = "card";

  var img = document.createElement("img");
  img.className = "card-image";
  img.src = ev.mainImageFileName || ev.chapterImageFileName || "";
  card.appendChild(img);

  var content = document.createElement("div");
  content.className = "card-content";

  var dateEl = document.createElement("div");
  dateEl.className = "card-date";
  dateEl.textContent = RaceSync.formatEventDate(ev.startDate) + " - " + ev.city + ", " + ev.state;
  content.appendChild(dateEl);

  var nameEl = document.createElement("div");
  nameEl.className = "card-name";
  nameEl.textContent = ev.name;
  content.appendChild(nameEl);

  card.appendChild(content);

  var chevron = document.createElement("div");
  chevron.className = "card-chevron";
  chevron.innerHTML = "&#8250;";
  card.appendChild(chevron);

  card.addEventListener("click", function() {
    window.location.href = "https://www.multigp.com/races/view/?race=" + ev.id + "/";
  });

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
