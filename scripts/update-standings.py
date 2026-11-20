"""Refresh series 1013 standings from the authenticated MultiGP API."""
from multigp_api import request, write_snapshot


def main():
    series = request("series/view?id=1013")
    pilots = series.get("pilot-results")
    if not isinstance(pilots, list):
        raise RuntimeError("MultiGP series response is missing pilot-results")
    overall = [
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
    years = sorted({
        int(race["startDate"][:4])
        for race in series.get("races", [])
        if race.get("startDate")
    }, reverse=True)
    write_snapshot("docs/standings.json", {
        "source": "MultiGP series/view?id=1013 API",
        "years": years,
        "overall": overall,
        "seasons": {},
    })


if __name__ == "__main__":
    main()
