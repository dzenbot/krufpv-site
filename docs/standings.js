loadStandings(document.querySelector("#standings"));

function loadStandings(section) {
  const status = section.querySelector("#standings-status");
  const controls = section.querySelector(".standings-seasons:not(.standings-categories)");
  const categories = section.querySelector(".standings-categories");
  const table = section.querySelector(".standings-table");
  const body = table.querySelector("tbody");
  const headings = table.querySelector("thead tr");
  const sourceLink = section.querySelector(".standings-source");
  const toolbar = section.querySelector(".standings-toolbar");

  function updateSourceLinkLayout() {
    sourceLink.classList.remove("standings-source-overflow");
    if (sourceLink.hidden || window.matchMedia("(max-width: 760px)").matches) {
      return;
    }
    const buttons = categories.getBoundingClientRect();
    const link = sourceLink.getBoundingClientRect();
    if (link.top >= buttons.bottom || toolbar.scrollWidth > toolbar.clientWidth) {
      sourceLink.classList.add("standings-source-overflow");
    }
  }

  window.addEventListener("resize", updateSourceLinkLayout);
  document.fonts?.ready.then(updateSourceLinkLayout);

  const series = [
    {
      yearKey: "2027",
      label: "2026-2027",
      name: "200G MAX Series 2026-2027",
      id: 1054,
      file: "data/standings-2026-2027.json"
    },
    {
      yearKey: "2025",
      label: "2024-2025",
      name: "200G MAX Series 2024-2025",
      id: 1013,
      file: "data/standings-2024-2025.json"
    }
  ];
  const qualifiers = [2026, 2025, 2024, 2023, 2022, 2020, 2019].map((year) => {
    return {
      label: String(year),
      name: "MultiGP Global Qualifier " + year,
      year,
      file: "data/global-qualifier-" + year + ".json"
    };
  });
  const timeTrials = [
    {
      label: "2026",
      name: "2026 Canadian Time Trial",
      id: 1020,
      year: 2026,
      ctt: true,
      file: "data/canadian-time-trial-2026.json"
    },
    {
      label: "2025",
      name: "2025 Canadian Time Trial",
      id: 1016,
      year: 2025,
      ctt: true,
      file: "data/canadian-time-trial-2025.json"
    },
    {
      label: "2023",
      name: "2023 Canadian Time Trial",
      year: 2023,
      ctt: true,
      file: "data/canadian-time-trial-2023.json"
    },
    {
      label: "2022",
      name: "2022 Canadian Time Trial",
      year: 2022,
      ctt: true,
      file: "data/canadian-time-trial-2022.json"
    }
  ];
  // Ignore responses from an earlier selection when filters change quickly.
  let selection = 0;
  let loadingMessageTimer;

  async function selectLeaderboard(item, button) {
    const currentSelection = ++selection;
    section.setAttribute("aria-busy", "true");
    window.clearTimeout(loadingMessageTimer);
    for (const control of controls.children) {
      control.setAttribute("aria-pressed", String(control === button));
    }
    table.hidden = true;
    status.classList.remove("standings-empty");
    status.classList.add("standings-loading");
    status.textContent = "";
    // Cached snapshots usually arrive before the loading message is needed.
    loadingMessageTimer = window.setTimeout(() => {
      if (currentSelection === selection) {
        status.textContent = "Loading standings…";
      }
    }, 200);
    table.classList.toggle("qualifier-table", Boolean(item.year));
    const source = section.querySelector(".text-link");
    source.hidden = Boolean(item.ctt && !item.id);
    updateSourceLinkLayout();
    if (!item.year || item.ctt) {
      source.href = "https://www.multigp.com/multigp-series/?seriesId=" + item.id;
    } else if (item.year >= 2024) {
      source.href = `https://www.multigp.com/${item.year}-global-qualifier-leaderboard/`;
    } else {
      source.href = `https://www.multigp.com/championships/${item.year}-multigp-series-global-qualifier-results/`;
    }

    try {
      const response = await fetch(item.file, {
        cache: "no-cache"
      });
      if (!response.ok) {
        throw new Error("Standings request failed");
      }
      const data = await response.json();
      if (currentSelection !== selection) {
        return;
      }
      window.clearTimeout(loadingMessageTimer);
      status.classList.remove("standings-loading");
      if (!Array.isArray(data.pilots)) {
        throw new Error("Invalid standings");
      }
      const zipper = !item.ctt && (item.year === 2024 || item.year === 2025);
      let columns = ["Rank", "Pilot", "Races", "Elo", "Points"];

      if (item.year) {
        const rankLabel = item.ctt ? "Canada Rank" : "Global rank";
        const timeLabels = zipper
          ? ["Fastest 3 laps\n(Summer)", "Fastest 3 laps\n(Spring)"]
          : ["Fastest 3 laps"];

        columns = [rankLabel, "Pilot", ...timeLabels];
      }

      headings.replaceChildren(
        ...columns.map((label) => {
          const heading = document.createElement("th");
          heading.scope = "col";
          if (["Global rank", "Canada Rank"].includes(label)) {
            heading.classList.add("qualifier-time-heading");
            heading.dataset.mobileLabel = "Rank";
          }
          if (item.year && label.startsWith("Fastest 3 laps")) {
            heading.classList.add("qualifier-time-heading");
            heading.dataset.mobileLabel = label.includes("(Summer)")
              ? "Summer"
              : label.includes("(Spring)")
                ? "Spring"
                : "Fastest 3";
          }
          const lines = label.split("\n");
          lines.forEach((line, index) => {
            if (index) {
              heading.append(document.createElement("br"));
            }

            const text = document.createElement("span");
            text.className = "standings-heading-line";
            text.textContent = line;
            heading.append(text);
          });
          return heading;
        })
      );
      body.replaceChildren(
        ...data.pilots.map((pilot) => {
          let values = [pilot.races, pilot.elo, pilot.points];

          if (zipper) {
            // The export can list Spring or Summer first for an individual pilot.
            values = ["Summer", "Spring"].map((track) => {
              const season = item.year + track;
              let score = null;

              if (pilot.season1 === season) {
                score = pilot.season1Score;
              } else if (pilot.season2 === season) {
                score = pilot.season2Score;
              }

              return formatQualifyingTime(score);
            });
          } else if (item.year) {
            const score = item.ctt ? pilot.fastest3Laps : pilot.season1Score;
            values = [formatQualifyingTime(score)];
          }

          return standingRow(pilot, values);
        })
      );
      table.querySelector("table").setAttribute("aria-label", item.name + " leaderboard");
      table.hidden = data.pilots.length === 0;
      status.classList.toggle("standings-empty", data.pilots.length === 0);
      status.textContent = data.pilots.length ? "" : "No results yet";
    } catch {
      if (currentSelection !== selection) {
        return;
      }
      window.clearTimeout(loadingMessageTimer);
      status.classList.remove("standings-loading");
      status.textContent = "Standings are temporarily unavailable. See the series on MultiGP.";
    } finally {
      if (currentSelection === selection) {
        section.setAttribute("aria-busy", "false");
        section.dispatchEvent(new Event("standings:ready"));
      }
    }
  }

  const competitions = [
    {
      key: "200g",
      mobileLabel: "200G Max",
      label: "200G MAX Series",
      items: series,
      defaultIndex: 0
    },
    {
      key: "ctt",
      mobileLabel: "MultiGP CTT",
      label: "Canadian Time Trial",
      items: timeTrials
    },
    {
      key: "gq",
      mobileLabel: "MultiGP GQ",
      label: "MultiGP Global Qualifier",
      items: qualifiers
    }
  ];

  const descriptions = {
    "200g": [
      "KwadsRUs' Micro class on custom tracks with MultiGP Micro gates (4×4 ft opening), ranked by race position points.",
      "Any LiPo and propeller sizes. 200g max AUW."
    ],
    ctt: [
      "Open-class time trials between Canadian chapters on a standardized track, ranked by fastest 3 consecutive laps.",
      "KwadsRUs pilots shown with their national rank."
    ],
    gq: [
      "Open-class time trials on the official MultiGP Global Qualifier track, ranked by fastest 3 consecutive laps.",
      "KwadsRUs pilots shown with their global rank."
    ]
  };

  function showCompetition(category, season, updateUrl) {
    if (category.key === "200g") {
      const previousYearKeys = { "2028": "2027", "2026": "2025" };
      season = previousYearKeys[season] ?? season;
    }

    const description = section.querySelector(".standings-description");
    description.replaceChildren(
      ...descriptions[category.key].flatMap((line, index) =>
        index
          ? [document.createElement("br"), document.createTextNode(line)]
          : [document.createTextNode(line)]
      )
    );
    for (const button of categories.children) {
      button.setAttribute("aria-pressed", String(button.dataset.competition === category.key));
    }
    const selected =
      category.items.find((item) => (item.yearKey ?? item.label) === season) ??
      category.items[category.defaultIndex ?? 0];
    controls.replaceChildren(
      ...category.items.map((item) => {
        const choice = document.createElement("button");
        choice.type = "button";
        choice.textContent = item.label;
        choice.addEventListener("click", () =>
          showCompetition(category, item.yearKey ?? item.label, true)
        );
        return choice;
      })
    );
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

  // Shared links and browser history use s (competition) and y (season).
  function restoreSelection() {
    const params = new URLSearchParams(window.location.search);
    const category = competitions.find((item) => item.key === params.get("s")) ?? competitions[0];
    showCompetition(category, params.get("y"), false);
  }

  for (const category of competitions) {
    const button = document.createElement("button");
    button.type = "button";

    const fullLabel = document.createElement("span");
    fullLabel.className = "standings-category-full";
    fullLabel.textContent = category.label;

    const mobileLabel = document.createElement("span");
    mobileLabel.className = "standings-category-mobile";
    mobileLabel.textContent = category.mobileLabel;
    button.append(fullLabel, mobileLabel);
    button.dataset.competition = category.key;
    button.addEventListener("click", () => showCompetition(category, null, true));
    categories.append(button);
  }
  window.addEventListener("popstate", restoreSelection);
  restoreSelection();
}

function formatQualifyingTime(score) {
  if (score === null || score === undefined || score === "") {
    return "—";
  }
  const seconds = Number(score);
  if (!Number.isFinite(seconds) || seconds <= 0 || seconds >= 2000000) {
    return "—";
  }
  // Discard sub-millisecond precision from the API without rounding times up.
  const milliseconds = Math.floor(seconds * 1000);
  if (seconds < 60) {
    return (milliseconds / 1000).toFixed(3) + "s";
  }
  return (
    String(Math.floor(milliseconds / 60000)).padStart(2, "0") +
    ":" +
    String(Math.floor(milliseconds / 1000) % 60).padStart(2, "0") +
    "." +
    String(milliseconds % 1000).padStart(3, "0")
  );
}

function standingRow(pilot, values) {
  const row = document.createElement("tr");
  row.insertCell().textContent = pilot.position;

  const name = document.createElement("th");
  name.scope = "row";

  const link = document.createElement("a");
  link.href = "https://www.multigp.com/pilots/view/?pilot=" + encodeURIComponent(pilot.username);
  link.target = "_blank";
  link.rel = "noopener";
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
    avatar.addEventListener("error", () => avatar.remove(), {
      once: true
    });
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
