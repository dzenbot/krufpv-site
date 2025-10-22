async function loadUpcomingEvents() {
  const apiUrl = "https://www.multigp.com/mgp/multigpwebservice/race/list?pageSize=50";
  const proxyUrl = "https://corsproxy.io/?" + encodeURIComponent(apiUrl);
  const body = {
    apiKey: "5dabb882-c10f-5713-5a54-3cc21d69cd50",
    data: { chapterId: ["1453"] }
  };

  const container = document.getElementById("upcoming-events-container");
  const titleEl = document.querySelector(".events-title");
  const loadingText = document.querySelector(".loading-text");
  
  try {
    const response = await fetch(proxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    const json = await response.json();
    const events = json.data || [];

    const now = new Date();
    const upcoming = events
      .filter(ev => new Date(ev.startDate) >= now)
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
      .slice(0, 5); // Show max 5 upcoming events

    const hasPastEvents = events.some(ev => new Date(ev.startDate) < now);

    // Remove spinner and loading text
    container.innerHTML = "";

    if (upcoming.length === 0) {
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
    titleEl.textContent = `${upcoming.length} Upcoming Event${upcoming.length !== 1 ? 's' : ''}`;
    titleEl.classList.add("visible");

    // Hide loading text
    loadingText.style.display = "none";

    // Render events with staggered animation
    upcoming.forEach((ev, index) => {
      setTimeout(() => {
        const card = createEventCard(ev);
        container.appendChild(card);
        // Trigger animation
        setTimeout(() => card.classList.add("visible"), 10);
      }, index * 100);
    });

  } catch (err) {
    console.error("Error loading events:", err);
    container.innerHTML = "";
    loadingText.textContent = "Failed to load events";
    loadingText.classList.add("visible", "error");
  }
}

function createEventCard(ev) {
  const card = document.createElement("div");
  card.className = "event-card-inline";

  const content = document.createElement("div");
  content.className = "event-content-inline";

  const img = document.createElement("img");
  img.className = "event-image";
  img.src = ev.mainImageFileName || ev.chapterImageFileName || "";
  img.alt = ev.name;
  card.appendChild(img);

  const dateEl = document.createElement("div");
  dateEl.className = "event-date-inline";
  dateEl.textContent = formatEventDate(ev.startDate) + " - " + ev.city + ", " + ev.state + " " + countryCodeToFlagEmoji(ev.country);
  content.appendChild(dateEl);

  const nameEl = document.createElement("div");
  nameEl.className = "event-name-inline";
  nameEl.textContent = ev.name;
  content.appendChild(nameEl);

  card.appendChild(content);

  const chevron = document.createElement("div");
  chevron.className = "event-chevron";
  chevron.innerHTML = "›";
  card.appendChild(chevron);

  card.addEventListener("click", () => {
    window.open(`https://www.multigp.com/races/view/?race=${ev.id}/`, "_blank");
  });

  return card;
}

function formatEventDate(dateStr) {
  if (!dateStr) return "";
  const dateObj = new Date(dateStr);
  const now = new Date();

  const optionsWeekday = { weekday: "short" };
  const optionsMonth = { month: "short" };
  const weekday = dateObj.toLocaleDateString(undefined, optionsWeekday);
  const monthName = dateObj.toLocaleDateString(undefined, optionsMonth);
  const dayNum = dateObj.getDate();

  const currentYear = now.getFullYear();
  const eventYear = dateObj.getFullYear();

  if (eventYear !== currentYear) {
    return `${weekday}, ${monthName} ${dayNum}, ${eventYear}`;
  } else {
    return `${weekday}, ${monthName} ${dayNum}`;
  }
}

function countryCodeToFlagEmoji(countryCode) {
  const code = countryCode.toUpperCase();
  if (code.length !== 2) return '';
  const first = String.fromCodePoint(code.charCodeAt(0) - 65 + 0x1F1E6);
  const second = String.fromCodePoint(code.charCodeAt(1) - 65 + 0x1F1E6);
  return first + second;
}

// Load events when page loads
document.addEventListener("DOMContentLoaded", loadUpcomingEvents);