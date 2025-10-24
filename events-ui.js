// UI logic and event presentation

async function loadUpcomingEvents() {
  var container = document.getElementById("upcoming-events-container");
  var titleEl = document.querySelector(".events-title");
  var loadingText = document.querySelector(".loading-text");
  var spinner = document.querySelector(".spinner");

  try {
    // Load chapter configuration
    var configResponse = await fetch("chapter.json");
    var config = await configResponse.json();

    // Inline the JSON (for local use only)
    // var config = {
    //   apiKey: "5dabb882-c10f-5713-5a54-3cc21d69cd50",
    //   chapterId: "1453"
    // };
    
    // Fetch events using RaceSync
    var events = await RaceSync.fetchEvents(config.apiKey, config.chapterId);
    
    // Filter and sort events
    var now = new Date();
    var filtered = RaceSync.filterUpcomingEvents(events, now);
    var upcoming = RaceSync.sortEventsByDate(filtered.upcoming);
    
    // Limit to 5 events
    var displayEvents = upcoming.slice(0, 5);
    
    // Remove spinner and loading text
    container.innerHTML = "";

    // Handle no events case
    if (displayEvents.length === 0) {
      var loadingContainer = loadingText.parentElement;
      container.innerHTML = "";
      container.appendChild(loadingContainer);
      
      if (filtered.hasPastEvents) {
        loadingText.textContent = "No races scheduled yet";
      } else if (events.length === 0) {
        loadingText.textContent = "No events found";
      } else {
        loadingText.textContent = "No races scheduled yet";
      }
      loadingText.classList.add("visible");
      spinner.style.display = "none";
      return;
    }

    // Show title with count
    var count = displayEvents.length;
    titleEl.textContent = count + " Upcoming Event" + (count !== 1 ? "s" : "");
    titleEl.classList.add("visible");
    
    // Hide loading text
    if (loadingText && loadingText.style) {
      loadingText.style.display = "none";
    }

    // Render events with staggered animation
    for (var j = 0; j < displayEvents.length; j++) {
      (function(index, event) {
        setTimeout(function() {
          var card = createEventCard(event);
          container.appendChild(card);
          setTimeout(function() {
            card.classList.add("visible");
          }, 10);
        }, index * 100);
      })(j, displayEvents[j]);
    }

    // scroll to top
    window.scrollTo(0, 0);

  } catch (err) {
    console.error("Error loading events:", err);
    container.innerHTML = "";
    loadingText.textContent = "Failed to load events";
    loadingText.classList.add("visible");
    loadingText.classList.add("error");
  }
}

function createEventCard(ev) {
  var card = document.createElement("div");
  card.className = "event-card";

  var img = document.createElement("img");
  img.className = "event-image";
  img.src = ev.mainImageFileName || ev.chapterImageFileName || "";
  card.appendChild(img);

  var content = document.createElement("div");
  content.className = "event-content";

  var dateEl = document.createElement("div");
  dateEl.className = "event-date";
  dateEl.textContent = RaceSync.formatEventDate(ev.startDate) + " - " + ev.city + ", " + ev.state;
  content.appendChild(dateEl);

  var nameEl = document.createElement("div");
  nameEl.className = "event-name";
  nameEl.textContent = ev.name;
  content.appendChild(nameEl);

  card.appendChild(content);

  var chevron = document.createElement("div");
  chevron.className = "event-chevron";
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