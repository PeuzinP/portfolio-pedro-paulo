# Map geometry

`countries.json` derives from https://github.com/datasets/geo-countries (Natural Earth, public domain). Coordinates use an equirectangular projection, with reduced coordinate precision and vertex density for browser rendering. Country borders are geographic data, not an assertion about sovereignty. Small territories remain selectable through the ranking.

To regenerate, download `data/countries.geojson` from that repository to the temporary directory as `portfolio-countries.geojson`, then run `node scripts/prepare-map.mjs`.
