// viewer.js: entry point for viewer.html (v1b Steps 8 + 9 + 10).
// Page-specific render only; shared shell (lang, top nav, header, footer,
// i18n) lives in page-shell.js.

import { bootPage, registerServiceWorker } from "./page-shell.js";
import {
  createMap, addBasinOverlay, bindResize, addLandcoverOverlay, setBasemap,
  setCogLayer, setCogOpacity, clearCogLayers, setLandcoverDimmed,
} from "./map.js";
import {
  renderBasemapToggle, renderLandcoverFilters,
  renderEmptyStats, renderFeatureStats,
  renderVariableSelector, renderLegend, renderVariableInfo,
} from "./viewer-panels.js";
import {
  resolvePerCropCogs, resolveMonthlyCog,
  buildSections, lookupVariable,
} from "./variables.js";

registerServiceWorker();

const STORAGE_BASEMAP  = "lez-viewer-basemap";
const STORAGE_VARIABLE = "lez-viewer-variable";
const STORAGE_OPACITY  = "lez-viewer-opacity";

// The month (YYYY-MM) currently rendered on the map for monthly variables.
// Module-level state so the COG resolver and the right-panel sparkline
// both read the same value. v1b Step 11 will replace the literal default
// with a time-scrubber control that mutates this.
const DEFAULT_MONTH = "2018-06";
let currentMonth = DEFAULT_MONTH;

let mapHandle      = null;        // { map, accent }
let landcover      = null;        // { setVisibleClasses, onClickFeature }
let allClasses     = null;
let manifest       = null;
let basinAreas     = null;
let variablesCfg   = null;
let visibleCropIds = null;        // Set<class_id> from landcover filter (null = all)

let currentBasemap = (() => {
  try { return localStorage.getItem(STORAGE_BASEMAP) || "map"; } catch { return "map"; }
})();
let currentVariable = (() => {
  try { return localStorage.getItem(STORAGE_VARIABLE) || null; } catch { return null; }
})();
let currentOpacity = (() => {
  try {
    const v = parseFloat(localStorage.getItem(STORAGE_OPACITY));
    return Number.isFinite(v) ? v : 0.85;
  } catch { return 0.85; }
})();

bootPage({
  pageTitle: ({ lang, site }) =>
    `${lang === "fr" ? "Explorer" : "Explore"} | ${site?.site?.title ?? ""}`,
  onRender: async ({ lang, site }) => {
    [manifest, basinAreas, allClasses, variablesCfg] = await Promise.all([
      fetchJsonOr("data/manifest.json",         null),
      fetchJsonOr("data/basin_class_areas.json", { classes: [] }),
      fetchJsonOr("data/theia_oso_colors.json", { classes: [] }).then(j => j.classes || []),
      fetchJsonOr("data/variables.json",        { per_crop: [], monthly: [] }),
    ]);

    // Drop a persisted variable that no longer has a renderable file.
    // Otherwise the COG protocol fetches a 404 and the source breaks.
    if (currentVariable && !isVariableAvailable(currentVariable)) {
      currentVariable = null;
      try { localStorage.removeItem(STORAGE_VARIABLE); } catch {}
    }

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
      onChange: (visibleSet) => {
        visibleCropIds = visibleSet;
        landcover?.setVisibleClasses(visibleSet);
        // For per-crop variables, the COG mosaic depends on which crops
        // are visible; re-mount it so the colored pixels match the filter.
        // For basin-wide monthly variables, the raster is independent of
        // crop selection — skip the refresh.
        if (currentVariableIsPerCrop()) refreshActiveVariable({ lang, site });
      },
    });

    renderVariableControls({ lang, site });

    const statsHost = document.querySelector("[data-region='stats']");
    renderEmptyStats({ host: statsHost, site });

    landcover?.onClickFeature(({ class_id }) => {
      renderFeatureStats({
        host: statsHost, site, lang, classId: class_id,
        allClasses, manifest, basinAreas,
      });
    });

    // Restore the active variable from localStorage on first render.
    // Both setCogLayer and setLandcoverDimmed self-defer if the map's
    // style / landcover-fill layer isn't ready yet — so calling
    // refreshActiveVariable directly is safe here.
    if (currentVariable) refreshActiveVariable({ lang, site });
  },
});

// Available per-crop variables = union of layers across all crops in the
// manifest (each crop's `layers[]` is populated by viewer_prep_cogs.py
// from filesystem state). A variable shows up in the selector only if at
// least one crop has a renderable file for it.
function availablePerCropSet() {
  const out = new Set();
  for (const crop of manifest?.crops || []) {
    for (const id of crop.layers || []) out.add(id);
  }
  return out;
}
function availableMonthlySet() {
  return new Set((manifest?.monthly_basin || []).map(l => l.id));
}
function isVariableAvailable(varId) {
  return availablePerCropSet().has(varId) || availableMonthlySet().has(varId);
}
function currentVariableIsPerCrop() {
  return currentVariable != null && availablePerCropSet().has(currentVariable);
}

function renderVariableControls({ lang, site }) {
  const i18n = site?.viewer?.variables;
  const monthlyLabels = buildMonthlyLabels(i18n);
  const sections = buildSections({
    variablesConfig: variablesCfg, i18n, monthlyLabels,
    availablePerCrop: availablePerCropSet(),
    availableMonthly: availableMonthlySet(),
  });

  renderVariableSelector({
    host: document.querySelector("[data-region='controls-variables']"),
    sections,
    current: currentVariable,
    opacity: currentOpacity,
    noneLabel:    i18n?.none_label,
    opacityLabel: i18n?.opacity_label,
    onVariableChange: (varId) => {
      currentVariable = varId;
      try {
        if (varId) localStorage.setItem(STORAGE_VARIABLE, varId);
        else       localStorage.removeItem(STORAGE_VARIABLE);
      } catch {}
      refreshActiveVariable({ lang, site });
      renderVariableControls({ lang, site });   // re-render to update enabled state
    },
    onOpacityChange: (op) => {
      currentOpacity = op;
      try { localStorage.setItem(STORAGE_OPACITY, String(op)); } catch {}
      if (mapHandle?.map) setCogOpacity(mapHandle.map, op);
    },
  });

  const variable = currentVariable
    ? lookupVariable({
        varId: currentVariable,
        variablesConfig: variablesCfg, i18n, monthlyLabels,
        manifest,
      })
    : null;
  renderLegend({
    host: document.querySelector("[data-region='map-legend']"),
    variable,
    hint: variable?.kind?.startsWith("monthly") ? (i18n?.project?.monthly_hint || "") : "",
  });
  // Right-panel variable-info card sits above the crop stats. When no
  // variable is selected the card clears itself, leaving only the
  // placeholder / crop stats below. Uses the module-level `currentMonth`
  // so the highlighted sparkline bar matches the map's displayed month.
  renderVariableInfo({
    host: document.querySelector("[data-region='variable-info']"),
    variable, site,
    currentMonth,
  });
}

// Pull monthly-variable labels + units from site.viewer.variables.items.
// All translatable strings live in the per-language YAML; the manifest
// only carries id / unit / file paths (no labels).
function buildMonthlyLabels(i18n) {
  const out = {};
  const items = i18n?.items || {};
  for (const [id, entry] of Object.entries(items)) {
    out[id] = { label: entry.label || id, unit: entry.unit || "" };
  }
  return out;
}

// (Re)mount the COG layer for the active variable id; clear it if `null`.
// Per-crop variables become a mosaic of one COG source per visible crop;
// monthly variables become a single basin-wide COG. Also dims the
// landcover fill so the colormap reads on top.
function refreshActiveVariable({ lang, site }) {
  if (!mapHandle?.map) return;
  if (!currentVariable) {
    clearCogLayers(mapHandle.map);
    setLandcoverDimmed(mapHandle.map, false);
    return;
  }
  const i18n = site?.viewer?.variables;
  const monthlyLabels = buildMonthlyLabels(i18n);
  const variable = lookupVariable({
    varId: currentVariable, variablesConfig: variablesCfg, i18n, monthlyLabels,
  });
  if (!variable) {
    clearCogLayers(mapHandle.map);
    setLandcoverDimmed(mapHandle.map, false);
    return;
  }
  const dataBaseUrl = manifest?.data_base_url || "data";
  const cogs = variable.kind === "per_crop"
    ? resolvePerCropCogs({ varId: variable.id, manifest, visibleCropIds, dataBaseUrl })
    : resolveMonthlyCog({ varId: variable.id, manifest, month: currentMonth, dataBaseUrl });

  setCogLayer(mapHandle.map, {
    cogs,
    colormap: variable.colormap,
    range:    variable.range,
    opacity:  currentOpacity,
  });
  setLandcoverDimmed(mapHandle.map, true);
}

async function fetchJsonOr(url, fallback) {
  try {
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) return fallback;
    return await res.json();
  } catch {
    return fallback;
  }
}
