"""Manually archive completed Global Qualifier seasons as JSON exports."""
import json
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from multigp_api import write_snapshot


def main():
    for year in range(2019, 2027):
        params = {"season1": str(year), "exportjson": "true"}
        if year in (2024, 2025):
            params.update(season1=f"{year}Summer", season2=f"{year}Spring")
        url = "https://www.multigp.com/MultiGP/views/viewZipperSeasonResults.php?" + urlencode(params)
        with urlopen(Request(url, headers={"User-Agent": "Mozilla/5.0"}), timeout=30) as response:
            results = json.load(response)
        if not isinstance(results, list):
            raise RuntimeError(f"Invalid Global Qualifier response for {year}")
        pilots = [
            {
                "position": pilot["rank"],
                "username": pilot["userName"],
                "pilotId": pilot["pilotId"],
                "chapterName": pilot["chapterName"],
                "season1": pilot.get("season1"),
                "season1Score": pilot.get("season1Score"),
                "season2": pilot.get("season2"),
                "season2Score": pilot.get("season2Score"),
            }
            for pilot in results if pilot.get("chapterName") == "KwadsRUs"
        ]
        write_snapshot(Path(__file__).resolve().parents[1] / "data" / f"global-qualifier-{year}.json", {
            "year": year, "source": url, "pilots": pilots,
        })
        print(f"{year}: {len(pilots)} KwadsRUs pilots")


if __name__ == "__main__":
    main()
