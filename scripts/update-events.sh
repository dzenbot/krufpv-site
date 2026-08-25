#!/usr/bin/env bash
set -euo pipefail

chapter_id="${1:-1453}"
output_file="${2:-docs/events.json}"
temporary_directory="$(mktemp -d)"
trap 'rm -rf "$temporary_directory"' EXIT

upcoming_file="$temporary_directory/multigp-upcoming.json"
completed_file="$temporary_directory/multigp-completed.json"
generated_file="$temporary_directory/events.json"

fetch_events() {
  local function_name="$1"
  local destination="$2"
  curl --fail --silent --show-error --retry 3 \
    --header "Content-Type: application/json" \
    --header "X-Requested-With: XMLHttpRequest" \
    --header "Referer: https://www.multigp.com/chapters/view/?chapter=${chapter_id}" \
    --user-agent "KwadsRUs-GitHub-Pages/1.0" \
    --request POST \
    --data-binary "{\"function\":\"${function_name}\",\"data\":{\"chapter\":${chapter_id}}}" \
    "https://www.multigp.com/MultiGP/request/handleRequest.php" \
    --output "$destination"
}

fetch_events "getUpcomingEvents" "$upcoming_file"
fetch_events "getCompletedEvents" "$completed_file"

jq --exit-status '.success == true and (.data.results | type == "array")' "$upcoming_file" >/dev/null
jq --exit-status '.success == true and (.data.results | type == "array")' "$completed_file" >/dev/null

jq --slurp '{
  source: "MultiGP public chapter events",
  events: [.[0].data.results[] | {
    id: .raceId,
    name: .raceName,
    startDate: .raceStartDate,
    location: .courseName,
    mainImageFileName: .raceImageUrl,
    chapterImageFileName: .chapterImageUrl,
    url: ("https://www.multigp.com" + .raceUrl)
  }],
  recentEvents: [
    (.[1].data.results
      | sort_by(.raceStartDate | strptime("%b %d, %Y") | mktime)
      | reverse
      | .[0:5][]
    ) | {
      id: .raceId,
      name: .raceName,
      startDate: .raceStartDate,
      location: .courseName,
      mainImageFileName: .raceImageUrl,
      chapterImageFileName: .chapterImageUrl,
      url: ("https://www.multigp.com" + .raceUrl)
    }
  ]
}' "$upcoming_file" "$completed_file" > "$generated_file"

# The completed-events summary omits start times. Enrich each retained event
# from the public race detail fragment, falling back to its summary date.
while IFS= read -r race_id; do
  detail_file="$temporary_directory/race-${race_id}.html"
  if curl --fail --silent --show-error --retry 2 \
    --header "X-Requested-With: XMLHttpRequest" \
    --header "Referer: https://www.multigp.com/races/view/?race=${race_id}" \
    --user-agent "KwadsRUs-GitHub-Pages/1.0" \
    "https://www.multigp.com/MultiGP/views/viewRace.php?race=${race_id}" \
    --output "$detail_file"; then
    race_date="$(perl -0777 -ne 'print $1 if /<span class="startDate">\s*([^<]+?)\s*<\/span>/s' "$detail_file")"
    race_time="$(perl -0777 -ne 'print $1 if /fa-clock[^>]*><\/i>[^<]*<small>\s*([^<]+?)\s*<\/small>/s' "$detail_file")"
    if [[ -n "$race_date" && -n "$race_time" ]]; then
      updated_file="$temporary_directory/events-updated.json"
      jq --arg id "$race_id" --arg startDate "$race_date $race_time" \
        '(.recentEvents[] | select(.id == $id) | .startDate) = $startDate' \
        "$generated_file" > "$updated_file"
      mv "$updated_file" "$generated_file"
    fi
  fi
done < <(jq -r '.recentEvents[].id' "$generated_file")

mv "$generated_file" "$output_file"
