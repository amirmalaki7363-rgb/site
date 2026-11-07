#!/bin/bash
cd /home/z/my-project/assets/img-results
run_search() {
  local name="$1"; local query="$2"; local count="$3"
  if [ -s "$name.json" ]; then echo "skip $name"; return; fi
  echo ">>> searching: $name"
  z-ai image-search -q "$query" -c "$count" --no-rank --gl us -o "$name.json" && echo "<<< ok: $name" || echo "<<< FAILED: $name"
  sleep 15
}
run_search roses_pink "pink roses bouquet wrapped in craft paper elegant flower shop" 4
run_search dried "dried flowers bouquet arrangement natural" 4
run_search hero "florist holding beautiful flower bouquet in flower shop" 4
echo "DONE"
