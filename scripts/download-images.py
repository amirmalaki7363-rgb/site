#!/usr/bin/env python3
"""Extract image URLs from search results, download best ones locally."""
import json, os, urllib.request, shutil
from pathlib import Path

RESULTS = Path("/home/z/my-project/assets/img-results")
OUT = Path("/home/z/my-project/public/images")
OUT.mkdir(parents=True, exist_ok=True)

# mapping: filename -> (result_file, index)
PICKS = {
    "roses-pink-1": ("roses_pink.json", 0),
    "roses-pink-2": ("roses_pink.json", 1),
    "roses-pink-3": ("roses_pink.json", 2),
    "roses-red-1": ("roses_red.json", 0),
    "roses-red-2": ("roses_red.json", 1),
    "tulips-1": ("tulips.json", 0),
    "tulips-2": ("tulips.json", 1),
    "plant-1": ("plant.json", 0),
    "plant-2": ("plant.json", 1),
    "flowerbox-1": ("flowerbox.json", 0),
    "flowerbox-2": ("flowerbox.json", 1),
    "dried-1": ("dried.json", 0),
    "dried-2": ("dried.json", 1),
    "sunflower-1": ("sunflower.json", 0),
    "sunflower-2": ("sunflower.json", 1),
    "orchid-1": ("orchid.json", 0),
    "orchid-2": ("orchid.json", 1),
    "hero-1": ("hero.json", 0),
    "hero-2": ("hero.json", 1),
    "hero-3": ("hero.json", 2),
    "wedding-1": ("wedding.json", 0),
    "wedding-2": ("wedding.json", 1),
    "birthday-1": ("birthday.json", 0),
    "birthday-2": ("birthday.json", 1),
    "peony-1": ("peony.json", 0),
    "peony-2": ("peony.json", 1),
}

def download(url: str, dest: Path) -> bool:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=60) as r, open(dest, "wb") as f:
            shutil.copyfileobj(r, f)
        return dest.stat().st_size > 5000
    except Exception as e:
        print(f"  FAIL {dest.name}: {e}")
        return False

ok, fail = [], []
for name, (src, idx) in PICKS.items():
    p = RESULTS / src
    if not p.exists():
        print(f"missing result file: {src}")
        fail.append(name)
        continue
    data = json.loads(p.read_text())
    if not data.get("success") or not data.get("results"):
        print(f"no results in {src}")
        fail.append(name)
        continue
    idx = min(idx, len(data["results"]) - 1)
    url = data["results"][idx]["original_url"]
    ext = ".jpg"
    dest = OUT / f"{name}{ext}"
    if download(url, dest):
        ok.append(name)
        print(f"  OK {name} <- {url[:80]}")
    else:
        fail.append(name)

print(f"\nDOWNLOADED: {len(ok)}  FAILED: {len(fail)}")
if fail:
    print("failed:", fail)
