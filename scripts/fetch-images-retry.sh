#!/bin/bash
# Retry failed image searches with visible errors
cd /home/z/my-project/assets/img-results

run_search() {
  local name="$1"
  local query="$2"
  local count="$3"
  if [ -s "$name.json" ]; then echo "skip $name (exists)"; return; fi
  echo ">>> searching: $name"
  z-ai image-search -q "$query" -c "$count" --no-rank --gl us -o "$name.json"
  echo "<<< done: $name"
}

run_search roses_pink "pink roses bouquet wrapped in craft paper elegant flower shop" 4 &
run_search tulips "fresh tulips bouquet spring colorful" 4 &
run_search plant "indoor potted houseplant green leaves in ceramic pot" 4 &
wait
run_search flowerbox "luxury flower box arrangement roses in round box" 4 &
run_search dried "dried flowers bouquet arrangement natural" 4 &
run_search sunflower "bright sunflower bouquet" 4 &
wait
run_search hero "florist holding beautiful flower bouquet in flower shop" 4 &
run_search wedding "bridal wedding bouquet white pastel flowers" 4 &
run_search birthday "colorful birthday flower bouquet gift festive" 4 &
wait
run_search peony "pink peonies flowers bouquet" 4 &
wait
echo "ALL RETRIES DONE"
