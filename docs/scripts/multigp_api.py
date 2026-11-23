"""Authenticated MultiGP API requests and atomic public snapshot writes."""
import json
import os
import tempfile
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

BASE_URL = "https://www.multigp.com/mgp/multigpwebservice/"


def request(endpoint, data=None):
    api_key = os.environ.get("MULTIGP_API_KEY")
    if not api_key:
        raise RuntimeError("Set MULTIGP_API_KEY before refreshing MultiGP data")
    body = {"apiKey": api_key}
    session_id = os.environ.get("MULTIGP_SESSION_ID")
    if session_id:
        body["sessionId"] = session_id
    if data is not None:
        body["data"] = data
    req = Request(
        BASE_URL + endpoint,
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"},
    )
    try:
        with urlopen(req, timeout=30) as response:
            result = json.load(response)
    except HTTPError as error:
        raise RuntimeError(f"MultiGP API request failed (HTTP {error.code})") from None
    except (URLError, ValueError):
        raise RuntimeError("MultiGP API request failed or returned invalid JSON") from None
    if result.get("status") is not True:
        raise RuntimeError("MultiGP API reported an unsuccessful response")
    return result["data"]


def write_snapshot(destination, data):
    path = Path(destination)
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(mode="w", dir=path.parent, delete=False) as output:
            temporary = Path(output.name)
            json.dump(data, output, indent=2)
            output.write("\n")
        temporary.chmod(0o644)
        temporary.replace(path)
    finally:
        if temporary and temporary.exists():
            temporary.unlink()
