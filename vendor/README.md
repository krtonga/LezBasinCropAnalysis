# Vendored libraries

These files are pinned third-party libraries the viewer depends on at
runtime. They live in the repo (rather than being loaded from a CDN) so
that:

- The site has zero external runtime dependencies — works offline,
  inside restricted networks (some IHE labs), and survives CDN outages.
- The exact versions used in any given commit are reproducible — useful
  for academic work where a deployment must match the version of record
  cited in the paper.
- Forks don't have to manage Subresource Integrity hashes when bumping
  versions.

## Versions

| File                  | Library     | Version | Source                                                      |
|-----------------------|-------------|---------|-------------------------------------------------------------|
| `js-yaml.min.js`      | js-yaml     | 4.1.0   | https://cdn.jsdelivr.net/npm/js-yaml@4.1.0/dist/js-yaml.min.js |
| `marked.min.js`       | marked      | 12.0.2  | https://cdn.jsdelivr.net/npm/marked@12.0.2/marked.min.js    |
| `mustache.min.js`     | mustache.js | 4.2.0   | https://cdn.jsdelivr.net/npm/mustache@4.2.0/mustache.min.js |
| `chart.umd.min.js`    | Chart.js    | 4.4.7   | https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js |
| `maplibre-gl.js`      | MapLibre GL | 4.7.1   | https://cdn.jsdelivr.net/npm/maplibre-gl@4.7.1/dist/maplibre-gl.js  |
| `maplibre-gl.css`     | MapLibre GL | 4.7.1   | https://cdn.jsdelivr.net/npm/maplibre-gl@4.7.1/dist/maplibre-gl.css |
| `pmtiles.js`          | PMTiles     | 3.2.1   | https://cdn.jsdelivr.net/npm/pmtiles@3.2.1/dist/pmtiles.js  |

## Updating

To bump a version:

1. Download the new version from the URL above (replace the version segment).
2. Replace the file in this directory; keep the filename unchanged.
3. Update the version number in this README.
4. Test the viewer locally (`python serve.py` from the parent directory).
5. Bump `CACHE_VERSION` in `../sw.js` so returning visitors get the new bundle.

## Licenses

Each library retains its original upstream license:
- js-yaml — MIT
- marked — MIT
- mustache.js — MIT
- Chart.js — MIT
- MapLibre GL — BSD-3-Clause
- PMTiles — BSD-3-Clause
