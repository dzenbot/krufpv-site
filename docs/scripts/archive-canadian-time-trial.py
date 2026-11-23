"""Manually archive Canadian Time Trial leaderboards from the MultiGP API."""
from pathlib import Path

from multigp_api import request, write_snapshot


def main():
    profiles = {}
    snapshots = []
    for year, series_id in ((2026, 1020), (2025, 1016)):
        series = request(f"series/view?id={series_id}")
        results = series.get("pilot-results")
        if not isinstance(results, list):
            raise RuntimeError(f"Missing pilot-results for CTT {year}")
        pilots = []
        for position, pilot in enumerate(results, 1):
            pilot_id = str(pilot["pilotId"])
            if pilot_id not in profiles:
                profile = request("user/search", {"id": pilot_id})
                if not isinstance(profile, dict) or str(profile.get("id")) != pilot_id:
                    raise RuntimeError(f"Unexpected profile for pilot {pilot_id}")
                profiles[pilot_id] = profile
            if str(profiles[pilot_id].get("homeChapterId")) != "1453":
                continue
            pilots.append({
                "position": position,
                "pilotId": pilot["pilotId"],
                "username": pilot["userName"],
                "profilePictureUrl": pilot.get("profilePictureUrl"),
                "fastest3Laps": pilot.get("fastest3Laps"),
                "homeChapterId": "1453",
                "chapterName": "KwadsRUs",
            })
        destination = Path(__file__).resolve().parents[1] / "data" / f"canadian-time-trial-{year}.json"
        snapshots.append((destination, {
            "seriesId": series_id, "year": year, "name": series["name"],
            "source": f"MultiGP series/view?id={series_id} API", "pilots": pilots,
        }))
        print(f"{year}: {len(pilots)} KwadsRUs pilots")
    for destination, snapshot in snapshots:
        write_snapshot(destination, snapshot)


if __name__ == "__main__":
    main()
