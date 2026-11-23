"""Manually bake current profile picture URLs into the archived GQ results."""
import json
from pathlib import Path

from multigp_api import request, write_snapshot


def main():
    archives = {
        path: json.loads(path.read_text())
        for path in sorted((Path(__file__).resolve().parents[1] / "data").glob("global-qualifier-*.json"))
    }
    pilot_ids = {
        str(pilot["pilotId"])
        for archive in archives.values()
        for pilot in archive["pilots"]
    }
    avatars = {}
    for pilot_id in sorted(pilot_ids):
        profile = request("user/search", {"id": pilot_id})
        if not isinstance(profile, dict) or str(profile.get("id")) != pilot_id:
            raise RuntimeError(f"Unexpected user/search result for pilot {pilot_id}")
        avatars[pilot_id] = profile.get("profilePictureUrl")
    # Complete every lookup before writing, so a failed lookup can be retried.
    for path, archive in archives.items():
        for pilot in archive["pilots"]:
            pilot["profilePictureUrl"] = avatars[str(pilot["pilotId"])]
        write_snapshot(path, archive)
    print(f"Enriched {len(archives)} archives from {len(avatars)} unique pilot lookups.")


if __name__ == "__main__":
    main()
