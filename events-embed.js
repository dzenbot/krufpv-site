async function loadUpcomingEvents() {
  var apiUrl = "https://www.multigp.com/mgp/multigpwebservice/race/list?pageSize=50";
  var proxyUrl = "https://corsproxy.io/?" + encodeURIComponent(apiUrl);
  var body = {
    apiKey: "5dabb882-c10f-5713-5a54-3cc21d69cd50",
    data: { chapterId: ["1453"] }
  };

  var container = document.getElementById("upcoming-events-container");
  var titleEl = document.querySelector(".events-title");
  var loadingText = document.querySelector(".loading-text");
  
  try {
    var response = await fetch(proxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!response.ok) throw new Error("HTTP error " + response.status);
    var json = await response.json();
    var events = json.data || [];

    var now = new Date();
    var upcoming = [];
    var hasPastEvents = false;
    
    // Filter and check for past events
    for (var i = 0; i < events.length; i++) {
      var ev = events[i];
      var evDate = new Date(ev.startDate);
      if (evDate >= now) {
        upcoming.push(ev);
      } else {
        hasPastEvents = true;
      }
    }
    
    // Sort upcoming events
    upcoming.sort(function(a, b) {
      return new Date(a.startDate) - new Date(b.startDate);
    });
    
    // Limit to 5 events
    var displayEvents = upcoming.slice(0, 5);

    // Remove spinner and loading text
    container.innerHTML = "";

    if (displayEvents.length === 0) {
      if (hasPastEvents) {
        loadingText.textContent = "No races scheduled yet";
      } else if (events.length === 0) {
        loadingText.textContent = "No events found";
      } else {
        loadingText.textContent = "No races scheduled yet";
      }
      loadingText.classList.add("visible");
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
          // Trigger animation
          setTimeout(function() {
            card.classList.add("visible");
          }, 10);
        }, index * 100);
      })(j, displayEvents[j]);
    }

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
  card.className = "event-card-inline";

  var img = document.createElement("img");
  img.className = "event-image";
  img.src = ev.mainImageFileName || ev.chapterImageFileName || "";
  img.alt = ev.name;
  card.appendChild(img);

  var content = document.createElement("div");
  content.className = "event-content-inline";

  var dateEl = document.createElement("div");
  dateEl.className = "event-date-inline";
  dateEl.textContent = formatEventDate(ev.startDate) + " - " + ev.city + ", " + ev.state + " " + countryCodeToFlagEmoji(ev.country);
  content.appendChild(dateEl);

  var nameEl = document.createElement("div");
  nameEl.className = "event-name-inline";
  nameEl.textContent = ev.name;
  content.appendChild(nameEl);

  card.appendChild(content);

  var chevron = document.createElement("div");
  chevron.className = "event-chevron";
  chevron.innerHTML = "&#8250;";
  card.appendChild(chevron);

  card.addEventListener("click", function() {
    window.open("https://www.multigp.com/races/view/?race=" + ev.id + "/", "_blank");
  });

  return card;
}

function formatEventDate(dateStr) {
  if (!dateStr) return "";
  var dateObj = new Date(dateStr);
  var now = new Date();

  var optionsWeekday = { weekday: "short" };
  var optionsMonth = { month: "short" };
  var weekday = dateObj.toLocaleDateString(undefined, optionsWeekday);
  var monthName = dateObj.toLocaleDateString(undefined, optionsMonth);
  var dayNum = dateObj.getDate();

  var currentYear = now.getFullYear();
  var eventYear = dateObj.getFullYear();

  if (eventYear !== currentYear) {
    return weekday + ", " + monthName + " " + dayNum + ", " + eventYear;
  } else {
    return weekday + ", " + monthName + " " + dayNum;
  }
}

function countryCodeToFlagEmoji(countryCode) {
  var code = countryCode.toUpperCase();
  if (code.length !== 2) return "";
  var first = String.fromCodePoint(code.charCodeAt(0) - 65 + 0x1F1E6);
  var second = String.fromCodePoint(code.charCodeAt(1) - 65 + 0x1F1E6);
  return first + second;
}

// Load events when page loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadUpcomingEvents);
} else {
  loadUpcomingEvents();
}