if (new URLSearchParams(window.location.search).get("feature-standings") === "true") {
  const section = document.querySelector("#standings");
  section.hidden = false;
  document.querySelector('#site-nav a[href="#standings"]').hidden = false;
  if (window.location.hash === "#standings") {
    section.scrollIntoView({ behavior: "instant" });
  }
  loadStandings(section);
}

async function loadStandings(section) {
  const status = section.querySelector("#standings-status");
  const controls = section.querySelector(".standings-seasons");
  const table = section.querySelector(".standings-table");
  const body = table.querySelector("tbody");

  try {
    const response = await fetch("standings.json", { cache: "no-cache" });
    if (!response.ok) throw new Error("Standings request failed");
    const { years, overall, seasons } = await response.json();

    function selectSeason(season) {
      const rows = season === "Overall" ? overall : seasons[season];
      const hasRows = Boolean(rows?.length);
      for (const button of controls.children) {
        button.setAttribute("aria-pressed", String(button.textContent === String(season)));
      }
      body.replaceChildren(...(rows ?? []).map(standingRow));
      table.hidden = !hasRows;
      status.textContent = hasRows ? "" : `MultiGP has no separate standings available for ${season}.`;
    }

    for (const season of ["Overall", ...years]) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = season;
      button.addEventListener("click", () => selectSeason(season));
      controls.append(button);
    }
    selectSeason("Overall");
  } catch {
    status.textContent = "Standings are temporarily unavailable. See the series on MultiGP.";
  }
}

function standingRow(pilot) {
  const row = document.createElement("tr");
  row.insertCell().textContent = pilot.position;
  const name = document.createElement("th");
  name.scope = "row";
  const link = document.createElement("a");
  link.href = "https://www.multigp.com/pilots/view/?pilot=" + encodeURIComponent(pilot.username);
  link.title = pilot.username;
  const username = document.createElement("span");
  username.className = "standings-pilot-name";
  username.textContent = pilot.username;
  link.append(username);
  if (pilot.avatar?.startsWith("https://")) {
    const avatar = document.createElement("img");
    avatar.src = pilot.avatar;
    avatar.alt = "";
    avatar.loading = "lazy";
    avatar.addEventListener("error", () => avatar.remove(), { once: true });
    link.prepend(avatar);
  }
  name.append(link);
  row.append(name);
  for (const value of [pilot.races, pilot.elo, pilot.points]) {
    row.insertCell().textContent = value;
  }
  return row;
}
