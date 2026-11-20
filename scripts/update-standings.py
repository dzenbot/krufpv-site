"""Refresh the public snapshot for MultiGP series 1013."""
import json
import re
import sys
from datetime import datetime
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import parse_qs, urljoin, urlsplit
from urllib.request import urlopen

BASE = "https://www.multigp.com"
SOURCE = BASE + "/MultiGP/views/handleMgpSeries.php?seriesId=1013"


class SeriesPage(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_table = False
        self.in_date = False
        self.in_cell = False
        self.cells = []
        self.pilot = None
        self.avatar = None
        self.rows = []
        self.years = set()

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "span" and attrs.get("class") == "mgp-date-text":
            self.in_date = True
        if tag == "table" and attrs.get("id") == "myTable2":
            self.in_table = True
        if not self.in_table:
            return
        if tag == "tr":
            self.cells, self.pilot, self.avatar = [], None, None
        if tag == "td":
            self.in_cell = True
            self.cells.append("")
        if tag == "a" and attrs.get("class") == "pilot-avatar-frame":
            self.pilot = parse_qs(urlsplit(attrs["href"]).query).get("pilot", [None])[0]
        if tag == "img" and attrs.get("class") == "pilot-thumb-small":
            self.avatar = urljoin(BASE, attrs.get("src", ""))

    def handle_endtag(self, tag):
        if tag == "span":
            self.in_date = False
        if tag == "table":
            self.in_table = False
        if not self.in_table:
            return
        if tag == "td":
            self.in_cell = False
        if tag == "tr" and self.pilot and len(self.cells) >= 6:
            points, elo, races = (int(cell.strip()) for cell in self.cells[3:6])
            self.rows.append(dict(username=self.pilot, avatar=self.avatar,
                                  races=races, elo=elo, points=points))

    def handle_data(self, data):
        if self.in_date and re.fullmatch(r"\d{2}-\d{2}-\d{4}", data.strip()):
            self.years.add(datetime.strptime(data.strip(), "%m-%d-%Y").year)
        if self.in_table and self.in_cell:
            self.cells[-1] += data


def main():
    if len(sys.argv) > 1:
        html = Path(sys.argv[1]).read_text()
    else:
        with urlopen(SOURCE, timeout=25) as response:
            html = response.read().decode("utf-8")
    page = SeriesPage()
    page.feed(html)
    if not page.rows or not page.years:
        raise SystemExit("MultiGP series page did not contain standings and race dates")
    page.rows.sort(key=lambda row: (-row["points"], -row["elo"]))
    for position, row in enumerate(page.rows, 1):
        row["position"] = position
    data = {
        "years": sorted(page.years, reverse=True),
        "overall": page.rows,
        "seasons": {},
    }
    Path("docs/standings.json").write_text(json.dumps(data, indent=2) + "\n")


if __name__ == "__main__":
    main()
