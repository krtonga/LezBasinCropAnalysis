// viewer.js: entry point for viewer.html (v1b Steps 8 + 9).
// Page-specific render only; shared shell (lang, top nav, header, footer,
// i18n) lives in page-shell.js.

import { bootPage, registerServiceWorker } from "./page-shell.js";
import { createMap, addBasinOverlay, bindResize, addLandcoverOverlay, setBasemap } from "./map.js";
import {
  renderBasemapToggle, renderLandcoverFilters,
  renderEmptyStats, renderFeatureStats,
} from "./viewer-panels.js";

registerServiceWorker();

const STORAGE_BASEMAP = "lez-viewer-basemap";

let mapHandle    = null;          // { map, accent }
let landcover    = null;          // { setVisibleClasses, onClickFeature }
let allClasses   = null;
let manifest     = null;
let basinAreas   = null;
let currentBasemap = (() => {
  try { return localStorage.getItem(STORAGE_BASEMAP) || "map"; } catch { return "map"; }
})();

bootPage({
  pageTitle: ({ lang, site }) =>
    `${lang === "fr" ? "Explorer" : "Explore"} | ${site?.site?.title ?? ""}`,
  onRender: async ({ lang, site }) => {
    [manifest, basinAreas, allClasses] = await Promise.all([
      fetchJsonOr("data/manifest.json",         null),
      fetchJsonOr("data/basin_class_areas.json", { classes: [] }),
      fetchJsonOr("data/theia_oso_colors.json", { classes: [] }).then(j => j.classes || []),
    ]);

    if (!mapHandle) {
      const container = document.querySelector("[data-region='map']");
      const basinGeo = await fetchJsonOr("data/lez_basin.geojson", null);

      mapHandle = createMap({
        container,
        center: manifest?.run?.center,
        zoom:   manifest?.run?.default_zoom,
        extent: manifest?.run?.extent,
        basemap: currentBasemap,
      });
      bindResize(mapHandle.map, container);

      addBasinOverlay(mapHandle.map, basinGeo, mapHandle.accent);

      landcover = addLandcoverOverlay(mapHandle.map, {
        url: "data/landcover_overlay.pmtiles",
        cropClasses: allClasses,        // accepts the full class list; keys for paint expression
      });
    }

    // Re-bind hover-popup labels in the active language. Cheap; runs on
    // every onRender (initial mount + each language toggle).
    landcover?.setLabels(Object.fromEntries(
      (allClasses || []).map(c => [c.id, (lang === "fr" ? c.label_fr : c.label_en) || `class ${c.id}`]),
    ));

    renderBasemapToggle({
      host: document.querySelector("[data-region='controls-basemap']"),
      site, current: currentBasemap,
      onChange: (id) => {
        currentBasemap = id;
        try { localStorage.setItem(STORAGE_BASEMAP, id); } catch {}
        setBasemap(mapHandle.map, id);
      },
    });

    renderLandcoverFilters({
      host: document.querySelector("[data-region='controls-landcover']"),
      site, lang, allClasses, basinAreas,
      onChange: (visibleSet) => landcover?.setVisibleClasses(visibleSet),
    });

    const statsHost = document.querySelector("[data-region='stats']");
    renderEmptyStats({ host: statsHost, site });

    landcover?.onClickFeature(({ class_id }) => {
      renderFeatureStats({
        host: statsHost, site, lang, classId: class_id,
        allClasses, manifest, basinAreas,
      });
    });
  },
});

async function fetchJsonOr(url, fallback) {
  try {
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) return fallback;
    return await res.json();
  } catch {
    return fallback;
  }
}
