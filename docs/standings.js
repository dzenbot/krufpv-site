loadStandings(document.querySelector("#standings"));

function loadStandings(section) {
  const status = section.querySelector("#standings-status");
  const controls = section.querySelector(".standings-seasons:not(.standings-categories)");
  const categories = section.querySelector(".standings-categories");
  const table = section.querySelector(".standings-table");
  const body = table.querySelector("tbody");
  const headings = table.querySelector("thead tr");
  const series = [
    { yearKey: "2028", label: "2028-2026", name: "200G MAX Series 2026-2028", id: 1054, file: "data/standings-2026-2028.json" },
    { yearKey: "2026", label: "2026-2024", name: "200G MAX Series 2024-2026", id: 1013, file: "data/standings-2024-2026.json" }
  ];
  const qualifiers = [2026, 2025, 2024, 2023, 2022, 2020, 2019].map(year => {
    return { label: String(year), name: "MultiGP Global Qualifier " + year,
      year, file: "data/global-qualifier-" + year + ".json" };
  });
  const timeTrials = [
    { label: "2026", name: "2026 Canadian Time Trial", id: 1020, year: 2026, ctt: true, file: "data/canadian-time-trial-2026.json" },
    { label: "2025", name: "2025 Canadian Time Trial", id: 1016, year: 2025, ctt: true, file: "data/canadian-time-trial-2025.json" },
    { label: "2023", name: "2023 Canadian Time Trial", year: 2023, ctt: true, file: "data/canadian-time-trial-2023.json" },
    { label: "2022", name: "2022 Canadian Time Trial", year: 2022, ctt: true, file: "data/canadian-time-trial-2022.json" }
  ];
  let selection = 0;

  async function selectLeaderboard(item, button) {
    const currentSelection = ++selection;
    for (const control of controls.children) {
      control.setAttribute("aria-pressed", String(control === button));
    }
    table.hidden = true;
    status.classList.remove("standings-empty");
    status.classList.add("standings-loading");
    status.textContent = "";
    table.classList.toggle("qualifier-table", Boolean(item.year));
    const source = section.querySelector(".text-link");
    source.hidden = Boolean(item.ctt && !item.id);
    source.href = item.year && !item.ctt
      ? (item.year >= 2024
        ? `https://www.multigp.com/${item.year}-global-qualifier-leaderboard/`
        : `https://www.multigp.com/championships/${item.year}-multigp-series-global-qualifier-results/`)
      : "https://www.multigp.com/multigp-series/?seriesId=" + item.id;
    try {
      const response = await fetch(item.file, { cache: "no-cache" });
      if (!response.ok) throw new Error("Standings request failed");
      const data = await response.json();
      if (currentSelection !== selection) return;
      status.classList.remove("standings-loading");
      if (!Array.isArray(data.pilots)) throw new Error("Invalid standings");
      const zipper = !item.ctt && (item.year === 2024 || item.year === 2025);
      const columns = item.year
        ? [item.ctt ? "Canada Rank" : "Global rank", "Pilot", ...(zipper ? ["Fastest 3 laps\n(Summer)", "Fastest 3 laps\n(Spring)"] : ["Fastest 3 laps"])]
        : ["BC Rank", "Pilot", "Races", "Elo", "Points"];
      headings.replaceChildren(...columns.map(label => {
        const heading = document.createElement("th");
        heading.scope = "col";
        if (["Global rank", "Canada Rank", "BC Rank"].includes(label)) {
          heading.classList.add("qualifier-time-heading");
          heading.dataset.mobileLabel = "Rank";
        }
        if (item.year && label.startsWith("Fastest 3 laps")) {
          heading.classList.add("qualifier-time-heading");
          heading.dataset.mobileLabel = label.includes("(Summer)") ? "Summer"
            : label.includes("(Spring)") ? "Spring" : "Fastest 3";
        }
        const lines = label.split("\n");
        lines.forEach((line, index) => {
          if (index) heading.append(document.createElement("br"));
          const text = document.createElement("span");
          text.className = "standings-heading-line";
          text.textContent = line;
          heading.append(text);
        });
        return heading;
      }));
      body.replaceChildren(...data.pilots.map(pilot => {
        const values = item.year
          ? (zipper
            ? ["Summer", "Spring"].map(track => {
              const season = item.year + track;
              const score = pilot.season1 === season ? pilot.season1Score
                : pilot.season2 === season ? pilot.season2Score : null;
              return formatQualifyingTime(score);
            })
            : [formatQualifyingTime(item.ctt ? pilot.fastest3Laps : pilot.season1Score)])
          : [pilot.races, pilot.elo, pilot.points];
        return standingRow(pilot, values);
      }));
      table.querySelector("table").setAttribute("aria-label", item.name + " leaderboard");
      table.hidden = data.pilots.length === 0;
      status.classList.toggle("standings-empty", data.pilots.length === 0);
      status.textContent = data.pilots.length ? "" : "No results yet";
    } catch {
      if (currentSelection !== selection) return;
      status.classList.remove("standings-loading");
      status.textContent = "Standings are temporarily unavailable. See the series on MultiGP.";
    }
  }

  const competitions = [
    { key: "200g", label: "200G MAX Series", items: series, defaultIndex: 1 },
    { key: "ctt", label: "Canadian Time Trial", items: timeTrials },
    { key: "gq", label: "MultiGP Global Qualifier", items: qualifiers }
  ];

  function showCompetition(category, season, updateUrl) {
    for (const button of categories.children) {
      button.setAttribute("aria-pressed", String(button.dataset.competition === category.key));
    }
    const selected = category.items.find(item => (item.yearKey ?? item.label) === season) ??
      category.items[category.defaultIndex ?? 0];
    controls.replaceChildren(...category.items.map(item => {
      const choice = document.createElement("button");
      choice.type = "button";
      choice.textContent = item.label;
      choice.addEventListener("click", () => showCompetition(category, item.yearKey ?? item.label, true));
      return choice;
    }));
    const index = category.items.indexOf(selected);
    selectLeaderboard(selected, controls.children[index]);
    if (updateUrl) {
      const url = new URL(window.location.href);
      url.searchParams.delete("standings");
      url.searchParams.delete("season");
      url.searchParams.set("s", category.key);
      url.searchParams.set("y", selected.yearKey ?? selected.label);
      url.hash = "standings";
      if (url.href !== window.location.href) {
        window.history.pushState(null, "", url);
      }
    }
  }

  function restoreSelection() {
    const params = new URLSearchParams(window.location.search);
    const category = competitions.find(item => item.key === params.get("s")) ??
      competitions[0];
    showCompetition(category, params.get("y"), false);
  }

  for (const category of competitions) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = category.label;
    button.dataset.competition = category.key;
    button.addEventListener("click", () => showCompetition(category, null, true));
    categories.append(button);
  }
  window.addEventListener("popstate", restoreSelection);
  restoreSelection();
}

function formatQualifyingTime(score) {
  if (score === null || score === undefined || score === "") return "—";
  const seconds = Number(score);
  if (!Number.isFinite(seconds) || seconds <= 0 || seconds >= 2000000) return "—";
  const milliseconds = Math.floor(seconds * 1000);
  if (seconds < 60) return (milliseconds / 1000).toFixed(3) + "s";
  return String(Math.floor(milliseconds / 60000)).padStart(2, "0") + ":" +
    String(Math.floor(milliseconds / 1000) % 60).padStart(2, "0") + "." +
    String(milliseconds % 1000).padStart(3, "0");
}

function standingRow(pilot, values) {
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
  const avatarSlot = document.createElement("span");
  avatarSlot.className = "standings-avatar";
  avatarSlot.setAttribute("aria-hidden", "true");
  const avatarUrl = pilot.profilePictureUrl || pilot.avatar;
  if (avatarUrl?.startsWith("https://")) {
    const avatar = document.createElement("img");
    avatar.src = avatarUrl;
    avatar.alt = "";
    avatar.loading = "lazy";
    avatar.addEventListener("error", () => avatar.remove(), { once: true });
    avatarSlot.append(avatar);
  }
  link.prepend(avatarSlot);
  name.append(link);
  row.append(name);
  for (const value of values) {
    row.insertCell().textContent = value;
  }
  return row;
}
