# Map geometry

`countries.json` derives from https://github.com/datasets/geo-countries (Natural Earth, public domain). Coordinates use an equirectangular projection, with reduced coordinate precision and vertex density for browser rendering. Country borders are geographic data, not an assertion about sovereignty. Small territories remain selectable through the ranking.

To regenerate, download `data/countries.geojson` from that repository to the temporary directory as `portfolio-countries.geojson`, then run `node scripts/prepare-map.mjs`.

## Brazilian states

`brazil-states.json` uses the official simplified IBGE geographic mesh, projected to the same equirectangular coordinates as the world map. Names, abbreviations and the Federal District come from IBGE Localidades. The downloadable assets are served by this project; the browser does not call IBGE.

Sources:
- https://servicodados.ibge.gov.br/api/docs/malhas?versao=3
- https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR?formato=application/vnd.geo%2Bjson&qualidade=minima&intrarregiao=UF
- https://servicodados.ibge.gov.br/api/v1/localidades/estados

To regenerate, download the last two URLs into the system temporary directory as `portfolio-brazil-states.geojson` and `portfolio-brazil-state-names.json`, then run `node scripts/prepare-brazil-states.mjs`. It also regenerates `shared/brazil-states.ts` for consistent names and validation.
