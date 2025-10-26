// Pure API connectivity and data fetching (no UI logic)

var RaceSync = (function() {
  
  function fetchEvents(apiKey, chapterId) {
    var apiUrl = "https://www.multigp.com/mgp/multigpwebservice/race/list";
    var proxyUrl = "https://corsproxy.io/?" + encodeURIComponent(apiUrl);
    var body = {
      apiKey: apiKey,
      data: { 
        chapterId: [chapterId],
        upcoming: { limit: 1 }
      }
    };

    return fetch(proxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })
    .then(function(response) {
      if (!response.ok) {
        throw new Error("HTTP error " + response.status);
      }
      return response.json();
    })
    .then(function(json) {
      return json.data || [];
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

    if (eventYear !== currentYear) {
      return weekday + ", " + monthName + " " + dayNum + ", " + eventYear;
    } else {
      return weekday + ", " + monthName + " " + dayNum;
    }
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