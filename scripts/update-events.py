"""Refresh upcoming and recent chapter races using only the MultiGP API."""
import sys
from datetime import datetime
from zoneinfo import ZoneInfo

from multigp_api import request, write_snapshot

PROVINCES = {
    "British Columbia": "BC", "Alberta": "AB", "Ontario": "ON", "Quebec": "QC",
    "Manitoba": "MB", "Saskatchewan": "SK", "Nova Scotia": "NS",
    "New Brunswick": "NB", "Newfoundland and Labrador": "NL",
    "Prince Edward Island": "PE", "Yukon": "YT", "Nunavut": "NU",
    "Northwest Territories": "NT",
}


def race_date(value):
    for pattern in ("%Y-%m-%d %I:%M %p", "%Y-%m-%d %H:%M:%S"):
        try:
            return datetime.strptime(value, pattern).replace(tzinfo=ZoneInfo("America/Vancouver"))
        except ValueError:
            continue
    raise ValueError("MultiGP API returned an unsupported race date")


def event(race):
    city = race.get("city") or ""
    state = race.get("state") or ""
    return {
        "id": str(race["id"]),
        "name": race["name"],
        "startDate": race["startDate"],
        "location": race.get("courseName"),
        "cityRegion": ", ".join(part for part in (city, PROVINCES.get(state, state)) if part),
        "mainImageFileName": race.get("mainImageFileName"),
        "chapterImageFileName": race.get("chapterImageFileName"),
        "url": "https://www.multigp.com/races/view/?race=" + str(race["id"]),
    }


def main():
    chapter = sys.argv[1] if len(sys.argv) > 1 else "1453"
    destination = sys.argv[2] if len(sys.argv) > 2 else "docs/events.json"
    races = request("race/list", {"chapterId": [chapter]})
    if not isinstance(races, list):
        raise RuntimeError("MultiGP race data must be an array")
    now = datetime.now(ZoneInfo("America/Vancouver"))
    upcoming, recent = [], []
    for race in races:
        if race.get("parentRaceId"):
            continue
        start = race_date(race["startDate"])
        (upcoming if start >= now else recent).append((start, event(race)))
    upcoming.sort(key=lambda item: item[0])
    recent.sort(key=lambda item: item[0], reverse=True)
    write_snapshot(destination, {
        "source": "MultiGP race/list API",
        "events": [item[1] for item in upcoming],
        "recentEvents": [item[1] for item in recent[:5]],
    })


if __name__ == "__main__":
    main()
