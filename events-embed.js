async function loadUpcomingEvents() {
  console.log("Starting loadUpcomingEvents");
  
  var apiUrl = "https://www.multigp.com/mgp/multigpwebservice/race/list?pageSize=50";
  var proxyUrl = "https://corsproxy.io/?" + encodeURIComponent(apiUrl);
  var body = {
    apiKey: "5dabb882-c10f-5713-5a54-3cc21d69cd50",
    data: { chapterId: ["1453"] }
  };

  var container = document.getElementById("upcoming-events-container");
  var titleEl = document.querySelector(".events-title");
  var loadingText = document.querySelector(".loading-text");
  
  console.log("Container:", container);
  console.log("TitleEl:", titleEl);
  console.log("LoadingText:", loadingText);
  
  try {
    console.log("Fetching data...");
    var response = await fetch(proxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    console.log("Response received:", response.status);
    if (!response.ok) throw new Error("HTTP error " + response.status);
    var json = await response.json();
    var events = json.data || [];
    
    console.log("Events loaded:", events.length);

    var now = new Date();
    var upcoming = [];
    var hasPastEvents = false;
    
    // Filter and check for past events
    for (var i = 0; i < events.length; i++) {
      var ev = events[i];
      // Safari-safe date parsing
      var evDate = parseDate(ev.startDate);
      console.log("Event:", ev.name, "Date:", ev.startDate, "Parsed:", evDate, "Valid:", !isNaN(evDate.getTime()));
      if (evDate && !isNaN(evDate.getTime()) && evDate >= now) {
        upcoming.push(ev);
      } else if (evDate && !isNaN(evDate.getTime()) && evDate < now) {
        hasPastEvents = true;
      }
    }
    
    console.log("Upcoming events found:", upcoming.length);
    
    // Sort upcoming events
    upcoming.sort(function(a, b) {
      return new Date(a.startDate) - new Date(b.startDate);
    });
    
    // Limit to 5 events
    var displayEvents = upcoming.slice(0, 5);

    console.log("Display events count:", displayEvents.length);
    
    // Remove spinner and loading text
    container.innerHTML = "";

    if (displayEvents.length === 0) {
      console.log("No events to display");
      
      // Get the loading container (parent of loadingText)
      var loadingContainer = loadingText.parentElement;
      
      // Re-add the loading container to the main container
      container.innerHTML = "";
      container.appendChild(loadingContainer);
      
      if (hasPastEvents) {
        loadingText.textContent = "No races scheduled yet";
      } else if (events.length === 0) {
        loadingText.textContent = "No events found";
      } else {
        loadingText.textContent = "No races scheduled yet";
      }
      loadingText.classList.add("visible");
      console.log("Fallback message set:", loadingText.textContent);
      return;
    }

    // Show title with count
    var count = displayEvents.length;
    titleEl.textContent = count + " Upcoming Event" + (count !== 1 ? "s" : "");
    titleEl.classList.add("visible");
    
    console.log("Title updated:", titleEl.textContent);

    // Hide loading text
    if (loadingText && loadingText.style) {
      loadingText.style.display = "none";
    }

    // Render events with staggered animation
    console.log("Starting to render events...");
    for (var j = 0; j < displayEvents.length; j++) {
      (function(index, event) {
        setTimeout(function() {
          console.log("Creating card for:", event.name);
          var card = createEventCard(event);
          container.appendChild(card);
          console.log("Card appended. Container has", container.children.length, "children");
          // Trigger animation
          setTimeout(function() {
            card.classList.add("visible");
            console.log("Card marked visible");
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
  console.log("createEventCard called for:", ev.name);
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
  dateEl.textContent = formatEventDate(ev.startDate) + " - " + ev.city + ", " + ev.state;
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

  console.log("Card created successfully");
  return card;
}

function formatEventDate(dateStr) {
  if (!dateStr) return "";
  var dateObj = parseDate(dateStr);
  if (!dateObj || isNaN(dateObj.getTime())) return "";
  
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

// Safari-safe date parser
function parseDate(dateStr) {
  if (!dateStr) return null;
  
  // Safari doesn't like dates with timezone in certain formats
  // Try to parse and handle common formats
  var date = new Date(dateStr);
  
  // If invalid, try replacing space with 'T' for ISO format
  if (isNaN(date.getTime())) {
    date = new Date(dateStr.replace(' ', 'T'));
  }
  
  return date;
}

// Load events when page loads
console.log("Script loaded, document.readyState:", document.readyState);
if (document.readyState === "loading") {
  console.log("Waiting for DOMContentLoaded");
  document.addEventListener("DOMContentLoaded", function() {
    console.log("DOMContentLoaded fired");
    loadUpcomingEvents();
  });
} else {
  console.log("Document already loaded, calling function immediately");
  loadUpcomingEvents();
}