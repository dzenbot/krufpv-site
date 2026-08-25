// Pure API connectivity and data fetching (no UI logic)

var RaceSync = (function() {

  function fetchEvents() {
    return fetch("events.json", { cache: "no-store" })
      .then(function(response) {
        if (!response.ok) throw new Error("Events file error " + response.status);
        return response.json();
      })
      .then(function(json) {
        if (!json || !Array.isArray(json.events)) {
          throw new Error("Invalid events file");
        }
        return {
          upcoming: json.events,
          recent: Array.isArray(json.recentEvents) ? json.recentEvents : []
        };
      });
  }

  function filterUpcomingEvents(events, currentDate) {
    var upcoming = [];
    var hasPastEvents = false;
    
    for (var i = 0; i < events.length; i++) {
      var ev = events[i];
      var evDate = parseDate(ev.startDate);

      if (evDate && !isNaN(evDate.getTime())) {
        if (evDate >= currentDate) {
          upcoming.push(ev);
        } else {
          hasPastEvents = true;
        }
      }
    }
    
    return {
      upcoming: upcoming,
      hasPastEvents: hasPastEvents
    };
  }

  function sortEventsByDate(events) {
    return events.sort(function(a, b) {
      return parseDate(a.startDate) - parseDate(b.startDate);
    });
  }

  function parseDate(dateStr) {
    if (!dateStr) return null;

    // Completed race details use "Aug 8, 2026 10:00 AM".
    var detailedParts = dateStr.match(/^([A-Za-z]{3})\s+(\d{1,2}),\s*(\d{4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (detailedParts) {
      var detailedMonth = new Date(detailedParts[1] + " 1, 2000").getMonth();
      var detailedHours = parseInt(detailedParts[4], 10);
      if (detailedParts[6].toLowerCase() === "pm" && detailedHours !== 12) detailedHours += 12;
      if (detailedParts[6].toLowerCase() === "am" && detailedHours === 12) detailedHours = 0;
      return new Date(
        parseInt(detailedParts[3], 10),
        detailedMonth,
        parseInt(detailedParts[2], 10),
        detailedHours,
        parseInt(detailedParts[5], 10)
      );
    }

    // MultiGP's public chapter feed uses "Aug 28, 1:00PM" without a year.
    var compactParts = dateStr.match(/^([A-Za-z]{3})\s+(\d{1,2}),\s*(\d{1,2}):(\d{2})(AM|PM)$/i);
    if (compactParts) {
      var currentDate = new Date();
      var compactMonth = new Date(compactParts[1] + " 1, 2000").getMonth();
      var compactYear = currentDate.getFullYear();
      if (currentDate.getMonth() >= 10 && compactMonth <= 2) compactYear += 1;
      var compactHours = parseInt(compactParts[3], 10);
      if (compactParts[5].toLowerCase() === "pm" && compactHours !== 12) compactHours += 12;
      if (compactParts[5].toLowerCase() === "am" && compactHours === 12) compactHours = 0;
      return new Date(compactYear, compactMonth, parseInt(compactParts[2], 10), compactHours, parseInt(compactParts[4], 10));
    }
    
    // Handle format: "2025-11-09 12:00 pm"
    var parts = dateStr.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2}):(\d{2})\s+(am|pm)/i);
    
    if (parts) {
      var year = parseInt(parts[1], 10);
      var month = parseInt(parts[2], 10) - 1;
      var day = parseInt(parts[3], 10);
      var hours = parseInt(parts[4], 10);
      var minutes = parseInt(parts[5], 10);
      var meridiem = parts[6].toLowerCase();
      
      if (meridiem === 'pm' && hours !== 12) {
        hours += 12;
      } else if (meridiem === 'am' && hours === 12) {
        hours = 0;
      }
      
      return new Date(year, month, day, hours, minutes);
    }
    
    var date = new Date(dateStr);
    
    if (isNaN(date.getTime())) {
      date = new Date(dateStr.replace(' ', 'T'));
    }
    
    return date;
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

    var formattedDate = eventYear !== currentYear
      ? weekday + ", " + monthName + " " + dayNum + ", " + eventYear
      : weekday + ", " + monthName + " " + dayNum;
    var includesTime = /\d{1,2}:\d{2}/.test(dateStr);
    if (!includesTime) return formattedDate;

    var hours = dateObj.getHours();
    var minutes = String(dateObj.getMinutes()).padStart(2, "0");
    var meridiem = hours >= 12 ? "PM" : "AM";
    var displayHours = hours % 12 || 12;
    return formattedDate + " @ " + displayHours + ":" + minutes + " " + meridiem;
  }

  // Public API
  return {
    fetchEvents: fetchEvents,
    filterUpcomingEvents: filterUpcomingEvents,
    sortEventsByDate: sortEventsByDate,
    parseDate: parseDate,
    formatEventDate: formatEventDate
  };
})();
