"""Save the archived series once and refresh the current series after races."""
import argparse
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


def refresh(series_id, destination, archive=False, baseline=False):
    path = Path(destination)
    if archive and path.exists():
        return
    series = request(f"series/view?id={series_id}")
    pilots = series.get("pilot-results")
    if not isinstance(pilots, list):
        raise RuntimeError("MultiGP series response is missing pilot-results")
    completed = completed_races(series, datetime.now(ZONE))
    previous = None
    if path.exists() and not baseline:
        previous = json.loads(path.read_text())
        if previous["completedRaces"] == completed:
            print(f"Series {series_id}: no newly completed races")
            return
    rows = [
        {
            "position": position,
            "pilotId": str(pilot["pilotId"]) if pilot.get("pilotId") else None,
            "username": pilot["userName"],
            "avatar": pilot.get("profilePictureUrl"),
            "races": pilot.get("raceCount"),
            "elo": pilot.get("eloScore"),
            "points": pilot.get("score"),
        }
        for position, pilot in enumerate(pilots, 1)
    ]
    # A baseline deliberately has no deltas. New pilots have no previous rank.
    if previous and series_id == 1054:
        def identity(pilot):
            return pilot.get("pilotId") or pilot["username"].casefold()

        old_rows = {identity(pilot): pilot for pilot in previous["pilots"]}
        for row in rows:
            old = old_rows.get(identity(row))
            if old:
                row["positionChange"] = old["position"] - row["position"]
                row["pointsChange"] = float(row["points"] or 0) - float(old["points"] or 0)

    write_snapshot(destination, {
        "seriesId": series_id,
        "name": series["name"],
        "source": f"MultiGP series/view?id={series_id} API",
        "completedRaces": completed,
        "pilots": rows,
    })
    print(f"Series {series_id}: saved {len(rows)} pilots")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--baseline", action="store_true", help="Reset the active series without change indicators")
    args = parser.parse_args()
    refresh(1013, "docs/data/standings-2024-2025.json", archive=True)
    refresh(1054, "docs/data/standings-2026-2027.json", baseline=args.baseline)


if __name__ == "__main__":
    main()
