"""Save the archived series once and refresh the current series after races."""
import json
from datetime import datetime, time, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

from multigp_api import request, write_snapshot

ZONE = ZoneInfo("America/Vancouver")


def completed_races(series, now):
    completed = {}
    for race in series.get("races", []):
        if race.get("approved") is False:
            continue
        # When MultiGP omits the end time, wait until the race day has ended.
        end = race.get("endDate")
        if end:
            deadline = datetime.fromisoformat(end).replace(tzinfo=ZONE)
        else:
            day = datetime.fromisoformat(race["startDate"]).date() + timedelta(days=1)
            deadline = datetime.combine(day, time(), tzinfo=ZONE)
        finalized = str(race.get("finalized")) == "1"
        if finalized or deadline <= now:
            # Revisit results when a previously ended race is later finalized.
            completed[str(race["id"])] = finalized
    return completed


def refresh(series_id, destination, archive=False):
    path = Path(destination)
    if archive and path.exists():
        return
    series = request(f"series/view?id={series_id}")
    pilots = series.get("pilot-results")
    if not isinstance(pilots, list):
        raise RuntimeError("MultiGP series response is missing pilot-results")
    completed = completed_races(series, datetime.now(ZONE))
    if path.exists():
        previous = json.loads(path.read_text())
        if previous["completedRaces"] == completed:
            print(f"Series {series_id}: no newly completed races")
            return
    rows = [
        {
            "position": position,
            "username": pilot["userName"],
            "avatar": pilot.get("profilePictureUrl"),
            "races": pilot.get("raceCount"),
            "elo": pilot.get("eloScore"),
            "points": pilot.get("score"),
        }
        for position, pilot in enumerate(pilots, 1)
    ]
    write_snapshot(destination, {
        "seriesId": series_id,
        "name": series["name"],
        "source": f"MultiGP series/view?id={series_id} API",
        "completedRaces": completed,
        "pilots": rows,
    })
    print(f"Series {series_id}: saved {len(rows)} pilots")


def main():
    refresh(1013, "docs/data/standings-2024-2025.json", archive=True)
    refresh(1054, "docs/data/standings-2026-2027.json")


if __name__ == "__main__":
    main()
